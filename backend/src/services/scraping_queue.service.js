/**
 * SCRAPING QUEUE SERVICE
 *
 * Menggunakan BullMQ + Redis (Laragon port 6379) untuk mengelola
 * antrean job scraping secara asynchronous.
 *
 * Alur:
 *   POST /search-job  → enqueue job → HTTP 202 Accepted (instant)
 *   Background Worker → Puppeteer scraping → simpan hasil ke DB
 *   GET  /job-status  → polling status PENDING|PROCESSING|COMPLETED|FAILED
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import prisma from '../models/prisma.client.js';
import { pembandingService } from './pembanding.service.js';
import logger from '../utils/logger.js';

// ─── Konfigurasi Redis ─────────────────────────────────────────────────────

const REDIS_CONNECTION = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
};

const QUEUE_NAME = 'scraping-pembanding';

// ─── Queue Instance ────────────────────────────────────────────────────────

let scrapingQueue = null;
let scrapingWorker = null;
let queueEvents = null;

/**
 * Inisialisasi Queue & Worker BullMQ
 * Dipanggil sekali saat server app.js startup
 */
export function initScrapingQueue() {
  scrapingQueue = new Queue(QUEUE_NAME, { connection: REDIS_CONNECTION });

  queueEvents = new QueueEvents(QUEUE_NAME, { connection: REDIS_CONNECTION });

  // Worker: memproses setiap job di background
  scrapingWorker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { asetId } = job.data;
      logger.info(`[BullMQ Worker] Mulai memproses scraping job untuk asetId=${asetId}`);

      try {
        // Ambil data aset lengkap dari DB
        const aset = await prisma.aset.findUnique({
          where: { id: asetId },
          include: { assetVehicle: true, assetProperty: true, assetElectronic: true },
        });

        if (!aset) throw new Error(`Aset tidak ditemukan: asetId=${asetId}`);

        // Bersihkan data lama yang belum divalidasi / masih menunggu
        await prisma.dataPembanding.deleteMany({
          where: {
            asetId,
            OR: [
              { sourceUrl: { contains: 'example.com' } },
              { statusValidasi: 'MENUNGGU', dipilihPenjual: false },
            ],
          },
        });

        // Jalankan scraping + fuzzy matching + outlier detection
        const results = await pembandingService.findComparableAssets(aset);

        // Simpan hasil ke database
        const saved = await Promise.all(
          results.map((item) =>
            prisma.dataPembanding.create({
              data: { ...item, asetId },
            })
          )
        );

        logger.info(`[BullMQ Worker] Selesai scraping asetId=${asetId}, ${saved.length} data disimpan`);
        return { count: saved.length };
      } catch (err) {
        logger.error('[BullMQ Worker] Scraping gagal', { asetId, message: err.message });
        throw err; // BullMQ akan mencatat job sebagai FAILED
      }
    },
    {
      connection: REDIS_CONNECTION,
      concurrency: 2,
    }
  );

  scrapingWorker.on('completed', (job, result) => {
    logger.info(`[BullMQ] Job ${job.id} selesai`, result);
  });

  scrapingWorker.on('failed', (job, err) => {
    logger.error(`[BullMQ] Job ${job?.id} gagal`, { error: err.message });
  });

  logger.info('[BullMQ] Scraping Queue & Worker berhasil diinisialisasi', REDIS_CONNECTION);
  return { scrapingQueue, scrapingWorker };
}

/**
 * Enqueue job scraping baru untuk sebuah aset
 * @param {number} asetId
 * @returns {Promise<{jobId: string}>}
 */
export async function enqueueScraping(asetId) {
  if (!scrapingQueue) throw new Error('Scraping Queue belum diinisialisasi');

  const job = await scrapingQueue.add(
    `scrape-aset-${asetId}`,
    { asetId },
    {
      attempts: 2,          // Coba ulang maksimal 2x jika gagal
      backoff: { type: 'exponential', delay: 3000 },
      removeOnComplete: 100, // Simpan maksimal 100 job completed di Redis
      removeOnFail: 50,
    }
  );

  logger.info(`[BullMQ] Job scraping dienqueue untuk asetId=${asetId}`, { jobId: job.id });
  return { jobId: job.id };
}

/**
 * Cek status job scraping berdasarkan jobId
 * @param {string} jobId
 * @returns {Promise<{jobId, status, progress, result?, failReason?}>}
 */
export async function getJobStatus(jobId) {
  if (!scrapingQueue) throw new Error('Scraping Queue belum diinisialisasi');

  const job = await scrapingQueue.getJob(jobId);

  if (!job) {
    return { jobId, status: 'NOT_FOUND' };
  }

  const state = await job.getState();
  const progress = job.progress || 0;

  return {
    jobId,
    status: state.toUpperCase(),   // waiting → WAITING, active → ACTIVE, completed → COMPLETED, failed → FAILED
    progress,
    result: state === 'completed' ? await job.returnvalue : null,
    failReason: state === 'failed' ? job.failedReason : null,
    addedAt: new Date(job.timestamp).toISOString(),
  };
}

export { scrapingQueue };
