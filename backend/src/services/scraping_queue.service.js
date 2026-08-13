/**
 * Persistent scraping queue backed by the application's MySQL database.
 *
 * Hostinger Business does not provide Redis, so jobs and their status are
 * stored in MySQL and processed by the single Node.js application process.
 */

import prisma from '../models/prisma.client.js';
import { pembandingService } from './pembanding.service.js';
import logger from '../utils/logger.js';

const POLL_INTERVAL_MS = Number(process.env.SCRAPING_QUEUE_POLL_MS || 5000);

let workerTimer = null;
let drainInProgress = false;

async function saveScrapingResult(asetId, result) {
  const pembanding = result?.pembanding || [];
  const saranPencarian = result?.saranPencarian || [];

  await prisma.$transaction(async (tx) => {
    await tx.dataPembanding.deleteMany({
      where: {
        asetId,
        OR: [
          { sourceUrl: { contains: 'example.com' } },
          { statusValidasi: 'MENUNGGU', dipilihPenjual: false },
        ],
      },
    });

    for (const item of pembanding) {
      await tx.dataPembanding.create({ data: { ...item, asetId } });
    }

    await tx.saranPencarianPembanding.deleteMany({ where: { asetId } });
    if (saranPencarian.length > 0) {
      await tx.saranPencarianPembanding.createMany({
        data: saranPencarian.map((item) => ({ ...item, asetId })),
      });
    }
  });

  return {
    count: pembanding.length,
    suggestionCount: saranPencarian.length,
    insufficientData: Boolean(result?.tidakCukupData),
  };
}

async function claimNextJob() {
  const candidate = await prisma.scrapingJob.findFirst({
    where: { status: 'WAITING' },
    orderBy: { createdAt: 'asc' },
  });

  if (!candidate) return null;

  const claimed = await prisma.scrapingJob.updateMany({
    where: { id: candidate.id, status: 'WAITING' },
    data: {
      status: 'ACTIVE',
      attempts: { increment: 1 },
      startedAt: new Date(),
      failReason: null,
    },
  });

  if (claimed.count !== 1) return null;
  return prisma.scrapingJob.findUnique({ where: { id: candidate.id } });
}

async function processJob(job) {
  try {
    const aset = await prisma.aset.findUnique({
      where: { id: job.asetId },
      include: { assetVehicle: true, assetProperty: true, assetElectronic: true },
    });
    if (!aset) throw new Error(`Aset tidak ditemukan: asetId=${job.asetId}`);

    logger.info(`[MySQL Queue] Memproses scraping job ${job.id}`, { asetId: job.asetId });
    const result = await pembandingService.findComparableAssets(aset);
    const summary = await saveScrapingResult(job.asetId, result);

    await prisma.scrapingJob.update({
      where: { id: job.id },
      data: {
        status: 'COMPLETED',
        result: summary,
        finishedAt: new Date(),
      },
    });
    logger.info(`[MySQL Queue] Scraping job ${job.id} selesai`, summary);
  } catch (error) {
    const shouldRetry = job.attempts < job.maxAttempts;
    await prisma.scrapingJob.update({
      where: { id: job.id },
      data: {
        status: shouldRetry ? 'WAITING' : 'FAILED',
        failReason: error.message,
        finishedAt: shouldRetry ? null : new Date(),
      },
    });
    logger.error(`[MySQL Queue] Scraping job ${job.id} gagal`, {
      attempt: job.attempts,
      retry: shouldRetry,
      message: error.message,
    });
  }
}

async function drainQueue() {
  if (drainInProgress) return;
  drainInProgress = true;
  try {
    let job = await claimNextJob();
    while (job) {
      await processJob(job);
      job = await claimNextJob();
    }
  } finally {
    drainInProgress = false;
  }
}

export async function initScrapingQueue() {
  if (workerTimer) return;

  // A process restart must not leave a claimed job stuck forever.
  await prisma.scrapingJob.updateMany({
    where: { status: 'ACTIVE' },
    data: { status: 'WAITING', failReason: 'Worker restarted before completion' },
  });

  workerTimer = setInterval(() => {
    drainQueue().catch((error) => {
      logger.error('[MySQL Queue] Worker loop gagal', { message: error.message });
    });
  }, POLL_INTERVAL_MS);
  workerTimer.unref?.();

  queueMicrotask(() => {
    drainQueue().catch((error) => {
      logger.error('[MySQL Queue] Initial drain gagal', { message: error.message });
    });
  });

  logger.info('[MySQL Queue] Worker aktif', { pollIntervalMs: POLL_INTERVAL_MS });
}

export function stopScrapingQueue() {
  if (workerTimer) clearInterval(workerTimer);
  workerTimer = null;
}

export async function enqueueScraping(asetId) {
  const job = await prisma.scrapingJob.create({
    data: { asetId: Number(asetId) },
  });

  queueMicrotask(() => {
    drainQueue().catch((error) => {
      logger.error('[MySQL Queue] Drain setelah enqueue gagal', { message: error.message });
    });
  });

  return { jobId: String(job.id) };
}

export async function getJobStatus(jobId) {
  const numericJobId = Number(jobId);
  if (!Number.isInteger(numericJobId) || numericJobId <= 0) {
    return { jobId, status: 'NOT_FOUND' };
  }

  const job = await prisma.scrapingJob.findUnique({ where: { id: numericJobId } });
  if (!job) return { jobId, status: 'NOT_FOUND' };

  return {
    jobId: String(job.id),
    status: job.status,
    progress: job.status === 'COMPLETED' ? 100 : job.status === 'ACTIVE' ? 50 : 0,
    result: job.status === 'COMPLETED' ? job.result : null,
    failReason: job.status === 'FAILED' ? job.failReason : null,
    addedAt: job.createdAt.toISOString(),
  };
}
