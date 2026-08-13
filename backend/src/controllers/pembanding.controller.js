import prisma from '../models/prisma.client.js';
import axios from 'axios';
import { pembandingService } from '../services/pembanding.service.js';
import { enqueueScraping, getJobStatus } from '../services/scraping_queue.service.js';
import { processUrl } from '../services/url_integrity.js';
import { matchPembanding } from '../services/comparable_matching.service.js';
import { detectOutliersIQR } from '../services/reference_confidence.service.js';

// ─── GET /pembanding/aset/:asetId ─────────────────────────────────────────────

export const getPembandingByAset = async (req, res) => {
  try {
    const asetId = Number(req.params.asetId);
    if (isNaN(asetId)) return res.status(400).json({ success: false, message: 'ID Aset tidak valid' });

    const aset = await prisma.aset.findUnique({ where: { id: asetId } });
    if (!aset) return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });

    if (req.userRole !== 'ADMIN') {
      const penjual = await prisma.penjual.findUnique({ where: { userId: req.userId } });
      if (!penjual || penjual.id !== aset.penjualId) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }
    }

    // Bersihkan sisa data legacy example.com
    await prisma.dataPembanding.deleteMany({
      where: { asetId, sourceUrl: { contains: 'example.com' } },
    });

    const pembanding = await prisma.dataPembanding.findMany({
      where: { asetId },
      orderBy: [{ isOutlier: 'asc' }, { similarity: 'desc' }, { createdAt: 'desc' }],
    });

    // Ambil baris hasil terbaru (bukan index 0 yang bisa jadi data lama)
    const hasilTerbaru = await prisma.hasil.findFirst({
      where: { asetId },
      orderBy: { id: 'desc' },
    });

    const hargaReferensi = hasilTerbaru?.hargaReferensiPasar
      ? Number(hasilTerbaru.hargaReferensiPasar)
      : null;

    res.json({
      success: true,
      data: pembanding,
      hargaReferensiPasar: hargaReferensi,
      tingkatKeyakinan: hasilTerbaru?.tingkatKeyakinan || null,
      skorKeyakinan: hasilTerbaru?.skorKeyakinan ? Number(hasilTerbaru.skorKeyakinan) : null,
      alasanKeyakinan: hasilTerbaru?.alasanKeyakinan || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── POST /pembanding/aset/:asetId/search ─────────────────────────────────────
// Asynchronous: enqueue BullMQ job, return jobId HTTP 202 Accepted

export const searchPembanding = async (req, res) => {
  try {
    const asetId = Number(req.params.asetId);
    if (isNaN(asetId)) return res.status(400).json({ success: false, message: 'ID Aset tidak valid' });

    const aset = await prisma.aset.findUnique({
      where: { id: asetId },
      include: { assetVehicle: true, assetProperty: true, assetElectronic: true },
    });

    if (!aset) return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });

    // Cek hak akses
    if (req.userRole !== 'ADMIN') {
      const penjual = await prisma.penjual.findUnique({ where: { userId: req.userId } });
      if (!penjual || penjual.id !== aset.penjualId) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }
    }

    // ── Enqueue async scraping job ke BullMQ ──────────────────────────────
    const { jobId } = await enqueueScraping(asetId);

    res.status(202).json({
      success: true,
      message: 'Proses scraping telah dimulai. Pantau progress melalui endpoint job-status.',
      jobId,
      pollUrl: `/api/pembanding/aset/${asetId}/job-status/${jobId}`,
    });
  } catch (error) {
    // Fallback: jika BullMQ/Redis tidak tersedia, jalankan scraping synchronous
    try {
      const asetId = Number(req.params.asetId);
      const aset = await prisma.aset.findUnique({
        where: { id: asetId },
        include: { assetVehicle: true, assetProperty: true, assetElectronic: true },
      });

      await prisma.dataPembanding.deleteMany({
        where: {
          asetId,
          OR: [
            { sourceUrl: { contains: 'example.com' } },
            { statusValidasi: 'MENUNGGU', dipilihPenjual: false },
          ],
        },
      });

      const realData = await pembandingService.findComparableAssets(aset);
      const savedData = [];
      for (const data of realData) {
        if (data.canonicalUrlHash) {
          const existing = await prisma.dataPembanding.findFirst({
            where: { asetId, canonicalUrlHash: data.canonicalUrlHash }
          });
          if (existing) {
            continue;
          }
        }
        const created = await prisma.dataPembanding.create({ data: { ...data, asetId } });
        savedData.push(created);
      }

      res.json({
        success: true,
        data: savedData,
        message: 'Scraping selesai (mode synchronous — Redis tidak tersedia)',
      });
    } catch (fallbackError) {
      res.status(500).json({ success: false, message: fallbackError.message });
    }
  }
};

// ─── GET /pembanding/aset/:asetId/job-status/:jobId ───────────────────────────
// Polling endpoint untuk UI progress bar

export const getScrapingJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;

    const status = await getJobStatus(jobId);

    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /pembanding/aset/:asetId/manual ─────────────────────────────────────

export const addManualPembanding = async (req, res) => {
  try {
    const asetId = Number(req.params.asetId);
    if (isNaN(asetId)) return res.status(400).json({ success: false, message: 'ID Aset tidak valid' });

    const { judul, sumber, sourceUrl, harga, lokasi, tahun, kondisi, spesifikasi } = req.body;

    if (!judul || !sumber || !sourceUrl || !harga || Number(harga) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Harap lengkapi judul, sumber, URL sumber, dan harga (> 0)',
      });
    }

    // Validasi URL format
    try {
      new URL(sourceUrl);
    } catch {
      return res.status(400).json({ success: false, message: 'URL sumber tidak valid' });
    }

    // P0: Klasifikasi URL & Integritas
    const urlInfo = processUrl(sourceUrl);
    if (urlInfo.statusIntegritasUrl !== 'DETAIL_IKLAN') {
      return res.status(400).json({
        success: false,
        message: `Tautan manual ditolak: ${urlInfo.alasan}`,
      });
    }

    // Ambil data aset untuk pencocokan spesifikasi
    const aset = await prisma.aset.findUnique({
      where: { id: asetId },
      include: { assetVehicle: true, assetProperty: true, assetElectronic: true },
    });

    if (!aset) {
      return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });
    }

    // Cek jika duplikat
    if (urlInfo.canonicalUrlHash) {
      const existing = await prisma.dataPembanding.findFirst({
        where: { asetId, canonicalUrlHash: urlInfo.canonicalUrlHash },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Data pembanding dengan URL yang sama sudah ada untuk aset ini',
        });
      }
    }

    // Sanitasi XSS sederhana pada judul manual
    const cleanJudul = judul.replace(/<[^>]*>?/gm, '');

    // P0: Evaluasi kelayakan pembanding (hard gates & fuzzy matching)
    const matchResult = matchPembanding(aset, {
      judul: cleanJudul,
      spesifikasi: spesifikasi || 'Data diinput manual oleh penjual',
      kondisi: kondisi || 'Bekas - Baik',
      tahun: tahun ? Number(tahun) : null,
      lokasi: lokasi || 'Indonesia',
      harga: Number(harga),
      statusIntegritasUrl: urlInfo.statusIntegritasUrl,
    });

    const pembanding = await prisma.dataPembanding.create({
      data: {
        asetId,
        judul: cleanJudul,
        sumber,
        sourceUrl,
        harga: Number(harga),
        lokasi: lokasi || 'Indonesia',
        tahun: tahun ? Number(tahun) : null,
        kondisi: kondisi || 'Bekas - Baik',
        spesifikasi: spesifikasi || 'Data diinput manual oleh penjual',
        jenisSumber: 'MANUAL',
        statusIntegritasUrl: urlInfo.statusIntegritasUrl,
        canonicalUrl: urlInfo.canonicalUrl,
        canonicalUrlHash: urlInfo.canonicalUrlHash,
        sourceDomain: urlInfo.sourceDomain,
        similarity: matchResult.similarity,
        statusKecocokan: matchResult.statusKecocokan,
        alasanKecocokan: matchResult.alasanKecocokan,
        skorKecocokan: Math.round((matchResult.similarity || 0) * 100),
        isOutlier: false,
        statusValidasi: 'MENUNGGU',
        dipilihPenjual: true,
      },
    });

    res.json({ success: true, data: pembanding, message: 'Data pembanding manual berhasil ditambahkan' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /pembanding/:id/select ─────────────────────────────────────────────

export const selectPembanding = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID Pembanding tidak valid' });

    const { dipilihPenjual } = req.body;

    const pembanding = await prisma.dataPembanding.findUnique({
      where: { id },
      include: { aset: true },
    });

    if (!pembanding) return res.status(404).json({ success: false, message: 'Data pembanding tidak ditemukan' });

    if (req.userRole !== 'ADMIN') {
      const penjual = await prisma.penjual.findUnique({ where: { userId: req.userId } });
      if (!penjual || penjual.id !== pembanding.aset.penjualId) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }
    }

    const updated = await prisma.dataPembanding.update({
      where: { id },
      data: { dipilihPenjual },
    });

    res.json({ success: true, data: pembanding, message: 'Status seleksi diperbarui' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── PATCH /pembanding/:id/validasi ───────────────────────────────────────────

export const validasiPembanding = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID Pembanding tidak valid' });

    const { statusValidasi } = req.body;

    if (!['DITERIMA', 'DITOLAK', 'MENUNGGU'].includes(statusValidasi)) {
      return res.status(400).json({ success: false, message: 'Status validasi tidak valid' });
    }

    const pembanding = await prisma.dataPembanding.update({
      where: { id },
      data: { statusValidasi },
    });

    res.json({ success: true, data: pembanding, message: 'Status validasi diperbarui' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── POST /pembanding/aset/:asetId/hitung-median ──────────────────────────────

export const hitungMedian = async (req, res) => {
  try {
    const asetId = Number(req.params.asetId);
    if (isNaN(asetId)) return res.status(400).json({ success: false, message: 'ID Aset tidak valid' });

    const aset = await prisma.aset.findUnique({ where: { id: asetId } });
    if (!aset) return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });

    if (req.userRole !== 'ADMIN') {
      const penjual = await prisma.penjual.findUnique({ where: { userId: req.userId } });
      if (!penjual || penjual.id !== aset.penjualId) {
        return res.status(403).json({ success: false, message: 'Akses ditolak' });
      }
    }

    // Ambil data yang dipilih penjual & valid
    const selectedPembanding = await prisma.dataPembanding.findMany({
      where: {
        asetId,
        dipilihPenjual: true,
        statusValidasi: { not: 'DITOLAK' },
      },
    });

    // P0: Validasi & Kalkulasi Median dengan keyakinan referensi
    const medianResult = pembandingService.hitungMedianHargaReferensi(selectedPembanding);

    if (medianResult.diblokir) {
      return res.status(400).json({
        success: false,
        message: `Kalkulasi median diblokir karena tingkat keyakinan referensi tidak cukup: ${medianResult.alasan}`,
        data: medianResult,
      });
    }

    const median = medianResult.median;
    const outliersCount = medianResult.statistik.jumlahOutlier;

    const result = await prisma.$transaction(async (tx) => {
      // Selalu update hargaPasar & statusPenilaian di tabel aset
      await tx.aset.update({
        where: { id: asetId },
        data: {
          hargaPasar: median,
          limitValue: null,
          statusPenilaian: 'MENUNGGU_PERHITUNGAN_SAW',
        }
      });

      // Persist outlier status ke database
      const hargaValues = selectedPembanding.map((p) => Number(p.harga)).filter((h) => h > 0 && isFinite(h));
      const { lower, upper } = detectOutliersIQR(hargaValues);
      for (const p of selectedPembanding) {
        const isOut = Number(p.harga) < lower || Number(p.harga) > upper;
        await tx.dataPembanding.update({
          where: { id: p.id },
          data: { isOutlier: isOut }
        });
      }

      // Cari baris hasil yang ada
      let hasil = await tx.hasil.findFirst({ where: { asetId } });

      if (hasil) {
        hasil = await tx.hasil.update({
          where: { id: hasil.id },
          data: {
            hargaReferensiPasar: median,
            nilaiPreferensi: null,
            nilaiLimit: null,
            tingkatKeyakinan: medianResult.tingkatKeyakinan,
            skorKeyakinan: medianResult.skorKeyakinan,
            alasanKeyakinan: medianResult.alasanKeyakinan,
            jumlahPembandingValid: medianResult.statistik.jumlahHargaValid,
            jumlahScrapedReal: medianResult.statistik.jumlahScrapedReal,
            jumlahManual: medianResult.statistik.jumlahManual,
            jumlahDomainUnik: medianResult.statistik.jumlahDomainUnik,
            calculatedAt: new Date(),
          },
        });
      } else {
        hasil = await tx.hasil.create({
          data: {
            asetId,
            nilaiPreferensi: null,
            hargaReferensiPasar: median,
            nilaiLimit: null,
            tingkatKeyakinan: medianResult.tingkatKeyakinan,
            skorKeyakinan: medianResult.skorKeyakinan,
            alasanKeyakinan: medianResult.alasanKeyakinan,
            jumlahPembandingValid: medianResult.statistik.jumlahHargaValid,
            jumlahScrapedReal: medianResult.statistik.jumlahScrapedReal,
            jumlahManual: medianResult.statistik.jumlahManual,
            jumlahDomainUnik: medianResult.statistik.jumlahDomainUnik,
            calculatedAt: new Date(),
          },
        });
      }

      return {
        median,
        hasil,
        outliersCount,
        outliersFlagged: outliersCount,
        hargaAwal: selectedPembanding.map((p) => Number(p.harga)),
        limitUpdated: true,
      };
    });

    res.json({ success: true, data: result, message: 'Harga referensi pasar berhasil dihitung' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkActivityController = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID Pembanding tidak valid' });

    const pembanding = await prisma.dataPembanding.findUnique({ where: { id } });
    if (!pembanding) return res.status(404).json({ success: false, message: 'Data pembanding tidak ditemukan' });

    const url = pembanding.sourceUrl;
    let status = null;
    let reason = '';
    let retryCount = pembanding.retryCount || 0;

    if (url.includes('mock-404')) {
      status = 404;
      reason = 'Not Found (Mock)';
      retryCount += 1;
    } else if (url.includes('mock-410')) {
      status = 410;
      reason = 'Gone (Mock)';
      retryCount += 1;
    } else if (url.includes('mock-timeout')) {
      status = 0;
      reason = 'Request timeout (Mock)';
      retryCount += 1;
    } else if (url.includes('mock-500')) {
      status = 500;
      reason = 'Internal Server Error (Mock)';
      retryCount += 1;
    } else {
      try {
        const checkRes = await axios.get(url, {
          timeout: 5000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
          }
        });
        status = checkRes.status;
        reason = 'URL is active and responsive';
      } catch (err) {
        status = err.response?.status || 0;
        if (err.code === 'ECONNABORTED') {
          reason = 'Request timeout';
        } else {
          reason = err.response?.data?.message || err.message || 'Unknown network error';
        }
        retryCount += 1;
      }
    }

    let validationStatus = 'BELUM_DIVERIFIKASI';
    let statusIntegritasUrl = 'BELUM_DIVERIFIKASI';

    if (status === 200) {
      validationStatus = 'DETAIL_IKLAN';
      statusIntegritasUrl = 'DETAIL_IKLAN';
    } else if (status === 404 || status === 410) {
      validationStatus = 'TIDAK_VALID';
      statusIntegritasUrl = 'TIDAK_VALID';
    } else if (status === 0 || status === 500) {
      validationStatus = 'PERLU_TINJAU';
      statusIntegritasUrl = 'TIDAK_VALID';
    } else {
      validationStatus = 'TIDAK_VALID';
      statusIntegritasUrl = 'TIDAK_VALID';
    }

    const updated = await prisma.dataPembanding.update({
      where: { id },
      data: {
        lastCheckedAt: new Date(),
        lastHttpStatus: status,
        retryCount,
        validationStatus,
        validationReason: reason,
        statusIntegritasUrl,
      }
    });

    res.json({
      success: true,
      message: 'Integritas dan keaktifan URL berhasil diperiksa',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

