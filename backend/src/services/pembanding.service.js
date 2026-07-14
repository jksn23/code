/**
 * pembanding.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * P0 — Pencarian & Manajemen Data Pembanding Harga Aset (VERSI BERSIH)
 *
 * Alur (sesuai panduan P0):
 *   1. Keyword Generator
 *   2. Puppeteer Real Web Scraping (OLX + Carmudi)
 *   3. URL Integrity Check (canonicalize, classify, hash)
 *   4. Deduplication via canonicalUrlHash
 *   5. Comparable Matching (hard gates + fuzzy similarity)
 *   6. Outlier Detection IQR (flag isOutlier)
 *   7. Jika scraping < 3 hasil DETAIL_IKLAN → generate SaranPencarianPembanding (tanpa harga)
 *   8. Admin Validation via UI
 *   9. Confidence Assessment → median hanya jika TIDAK_CUKUP diblokir
 *
 * PENTING P0:
 *   - TIDAK ADA synthetic fallback dengan harga buatan (basePrice × multiplier DIHAPUS)
 *   - Link pencarian BUKAN data pembanding — disimpan ke SaranPencarianPembanding
 *   - Semua DataPembanding harus memiliki URL yang valid (DETAIL_IKLAN)
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

import Fuse from 'fuse.js';
import { puppeteerScraperService } from './puppeteer_scraper.service.js';
import { processUrl } from './url_integrity.js';
import { matchPembanding, STATUS_KECOCOKAN } from './comparable_matching.service.js';
import {
  calculateConfidence,
  filterValidForMedian,
  TINGKAT_KEYAKINAN,
} from './reference_confidence.service.js';
import logger from '../utils/logger.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Saran Pencarian Generator ─────────────────────────────────────────────────
// Menghasilkan LINK PENCARIAN saja (tanpa harga/data sintetis) untuk membantu
// penjual/admin menemukan data pembanding secara manual.

const MARKETPLACE_SEARCH_TEMPLATES = [
  {
    marketplace: 'Tokopedia',
    getUrl: (q) => `https://www.tokopedia.com/search?st=product&q=${encodeURIComponent(q)}`,
  },
  {
    marketplace: 'OLX Indonesia',
    getUrl: (q) => `https://www.olx.co.id/items/q-${q.replace(/\s+/g, '-').toLowerCase()}`,
  },
  {
    marketplace: 'Shopee Indonesia',
    getUrl: (q) => `https://shopee.co.id/search?keyword=${encodeURIComponent(q)}`,
  },
  {
    marketplace: 'Bukalapak',
    getUrl: (q) =>
      `https://www.bukalapak.com/products?search[keywords]=${encodeURIComponent(q)}`,
  },
  {
    marketplace: 'Carmudi Indonesia',
    getUrl: (q) => `https://www.carmudi.co.id/cars/?q=${encodeURIComponent(q)}`,
    onlyVehicle: true,
  },
  {
    marketplace: 'Lamudi',
    getUrl: (q) => `https://www.lamudi.co.id/${q.replace(/\s+/g, '-').toLowerCase()}/`,
    onlyProperty: true,
  },
];

/**
 * Generate saran tautan pencarian (tanpa harga) untuk aset tertentu.
 * @param {object} asset
 * @param {string} keyword
 * @returns {Array<{ marketplace, query, searchUrl }>}
 */
function generateSaranPencarian(asset, keyword) {
  return MARKETPLACE_SEARCH_TEMPLATES
    .filter((tmpl) => {
      if (tmpl.onlyVehicle && !asset.assetVehicle) return false;
      if (tmpl.onlyProperty && !asset.assetProperty) return false;
      return true;
    })
    .map((tmpl) => ({
      marketplace: tmpl.marketplace,
      query: keyword,
      searchUrl: tmpl.getUrl(keyword),
    }));
}

// ── PembandingService ─────────────────────────────────────────────────────────

class PembandingService {
  /**
   * Generate kata kunci pencarian dari atribut aset.
   * @param {object} asset
   * @returns {string}
   */
  generateSearchKeyword(asset) {
    const parts = [asset.nama];

    if (asset.assetVehicle) {
      if (asset.assetVehicle.brand && !asset.nama.includes(asset.assetVehicle.brand)) {
        parts.push(asset.assetVehicle.brand);
      }
      if (asset.assetVehicle.type && !asset.nama.includes(asset.assetVehicle.type)) {
        parts.push(asset.assetVehicle.type);
      }
    } else if (asset.assetProperty) {
      if (asset.assetProperty.district) parts.push(asset.assetProperty.district);
      if (asset.assetProperty.city) parts.push(asset.assetProperty.city);
    } else if (asset.assetElectronic) {
      if (asset.assetElectronic.brand && !asset.nama.includes(asset.assetElectronic.brand)) {
        parts.push(asset.assetElectronic.brand);
      }
    }

    return parts
      .filter(Boolean)
      .join(' ')
      .replace(/[^a-zA-Z0-9 ]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Fuzzy Matching menggunakan Fuse.js.
   * Digunakan sebagai LANGKAH AWAL sebelum comparable_matching.service.js.
   *
   * @param {string} keyword
   * @param {Array} items
   * @returns {Array} item dengan field similarity (0.0-1.0)
   */
  applyFuzzyMatching(keyword, items) {
    if (!items || items.length === 0) return [];

    const fuse = new Fuse(items, {
      keys: [
        { name: 'judul', weight: 0.6 },
        { name: 'spesifikasi', weight: 0.3 },
        { name: 'sumber', weight: 0.1 },
      ],
      threshold: 0.7,
      includeScore: true,
      ignoreLocation: true,
    });

    const fuseResults = fuse.search(keyword);
    const scoreMap = new Map(fuseResults.map((r) => [r.refIndex, r.score ?? 1.0]));

    return items.map((item, idx) => {
      const fuseScore = scoreMap.has(idx) ? scoreMap.get(idx) : 1.0;
      const similarity = Math.round((1 - fuseScore) * 100) / 100;
      return { ...item, similarity };
    });
  }

  /**
   * Outlier Detection menggunakan IQR. Flag isOutlier tanpa membuang data.
   * @param {Array} items
   * @returns {Array}
   */
  applyOutlierFlags(items) {
    if (items.length < 4) return items.map((i) => ({ ...i, isOutlier: false }));

    const prices = items.map((i) => Number(i.harga));
    const sorted = [...prices].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return items.map((item) => ({
      ...item,
      isOutlier: Number(item.harga) < lowerBound || Number(item.harga) > upperBound,
    }));
  }

  /**
   * Cari data pembanding menggunakan Puppeteer + URL Integrity + Matching.
   * TIDAK ADA fallback harga sintetis. Jika data kurang, generate saran pencarian.
   *
   * @param {object} asset — data aset beserta relasi
   * @returns {Promise<{
   *   pembanding: Array,
   *   saranPencarian: Array,
   *   tidakCukupData: boolean
   * }>}
   */
  async findComparableAssets(asset) {
    const keyword = this.generateSearchKeyword(asset);

    logger.spk('Mulai scraping data pembanding via Puppeteer', { asetId: asset.id, keyword });

    let rawData = [];

    // ── Tahap 1: Puppeteer Real Web Scraping ──────────────────────────────
    try {
      rawData = await puppeteerScraperService.scrapeAll(asset, keyword);
    } catch (err) {
      logger.error('Puppeteer scraper error', { asetId: asset.id, message: err.message });
    }

    // ── Tahap 2: URL Integrity + Canonicalize ─────────────────────────────
    const withUrlIntegrity = rawData.map((item) => {
      const urlInfo = processUrl(item.sourceUrl);
      return {
        ...item,
        ...urlInfo,
        jenisSumber: 'SCRAPED_REAL',
      };
    });

    // ── Tahap 3: Filter hanya DETAIL_IKLAN (valid URL) ────────────────────
    const validUrls = withUrlIntegrity.filter(
      (item) => item.statusIntegritasUrl === 'DETAIL_IKLAN'
    );
    const invalidUrls = withUrlIntegrity.filter(
      (item) => item.statusIntegritasUrl !== 'DETAIL_IKLAN'
    );

    if (invalidUrls.length > 0) {
      logger.warn('Beberapa URL pembanding bukan halaman detail iklan', {
        asetId: asset.id,
        jumlahInvalid: invalidUrls.length,
        contoh: invalidUrls[0]?.sourceUrl,
      });
    }

    // ── Tahap 4: Fuzzy Matching awal ──────────────────────────────────────
    const withSimilarity = this.applyFuzzyMatching(keyword, validUrls);

    // ── Tahap 5: Comparable Matching (hard gates + dimensional scoring) ────
    const withMatching = withSimilarity.map((item) => {
      const matchResult = matchPembanding(asset, item);
      return { ...item, ...matchResult };
    });

    // ── Tahap 6: Outlier Detection ─────────────────────────────────────────
    const withOutlierFlags = this.applyOutlierFlags(withMatching);

    // ── Tahap 7: Skor kecocokan (backward compat) ──────────────────────────
    const finalResults = withOutlierFlags.map((item) => ({
      ...item,
      skorKecocokan: Math.round((item.similarity ?? 0) * 100),
    }));

    // ── Tahap 8: Cek apakah data cukup; generate saran jika tidak ─────────
    const layakCount = finalResults.filter(
      (r) => r.statusKecocokan === STATUS_KECOCOKAN.LAYAK
    ).length;

    let saranPencarian = [];
    const tidakCukupData = layakCount < 3;

    if (tidakCukupData) {
      saranPencarian = generateSaranPencarian(asset, keyword);
      logger.warn('Data pembanding tidak cukup — generate saran pencarian', {
        asetId: asset.id,
        layakCount,
        saranCount: saranPencarian.length,
      });
    }

    logger.spk('Pencarian data pembanding selesai', {
      asetId: asset.id,
      totalRaw: rawData.length,
      validUrl: validUrls.length,
      layak: layakCount,
      tidakCukupData,
    });

    return {
      pembanding: finalResults,
      saranPencarian,
      tidakCukupData,
    };
  }

  /**
   * Hitung median harga referensi pasar dari data pembanding yang sudah divalidasi.
   * HANYA menggunakan data: statusValidasi=DITERIMA, statusIntegritasUrl=DETAIL_IKLAN,
   * statusKecocokan=LAYAK, dan isOutlier=false.
   *
   * @param {object[]} pembandingList — semua DataPembanding dari DB (termasuk yang belum valid)
   * @returns {{
   *   median: number|null,
   *   diblokir: boolean,
   *   alasan: string,
   *   tingkatKeyakinan: string,
   *   statistik: object
   * }}
   */
  hitungMedianHargaReferensi(pembandingList) {
    // Uji TC-08: Tolak median jika ada pembanding terpilih yang masih MENUNGGU atau PERLU_TINJAU
    const pendingCount = pembandingList.filter(
      (p) => p.statusValidasi === 'MENUNGGU' || p.statusKecocokan === 'PERLU_TINJAU'
    ).length;

    if (pendingCount > 0) {
      return {
        median: null,
        diblokir: true,
        alasan: `Kalkulasi median ditolak karena terdapat ${pendingCount} data pembanding yang berstatus MENUNGGU validasi atau PERLU_TINJAU.`,
        tingkatKeyakinan: TINGKAT_KEYAKINAN.TIDAK_CUKUP,
        skorKeyakinan: 0,
        alasanKeyakinan: { alasan: [`Terdapat ${pendingCount} data pembanding belum selesai ditinjau`], statistik: {} },
        statistik: {},
      };
    }

    // Filter ketat — hanya pembanding yang benar-benar valid
    const valid = filterValidForMedian(pembandingList).filter((p) => !p.isOutlier);

    const confidenceResult = calculateConfidence(valid);

    if (confidenceResult.diblokir) {
      return {
        median: null,
        diblokir: true,
        alasan: `Median diblokir: ${confidenceResult.alasanKeyakinan.alasan.join('; ')}`,
        tingkatKeyakinan: TINGKAT_KEYAKINAN.TIDAK_CUKUP,
        skorKeyakinan: confidenceResult.skorKeyakinan,
        alasanKeyakinan: confidenceResult.alasanKeyakinan,
        statistik: confidenceResult.statistik,
      };
    }

    return {
      median: confidenceResult.mediaanHarga,
      diblokir: false,
      alasan: confidenceResult.alasanKeyakinan.alasan.join('; '),
      tingkatKeyakinan: confidenceResult.tingkatKeyakinan,
      skorKeyakinan: confidenceResult.skorKeyakinan,
      alasanKeyakinan: confidenceResult.alasanKeyakinan,
      statistik: confidenceResult.statistik,
    };
  }

  /**
   * @deprecated Gunakan hitungMedianHargaReferensi() yang baru.
   * Dipertahankan untuk backward compatibility.
   */
  calculateMedian(prices) {
    if (!prices || prices.length === 0) return 0;
    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  /**
   * @deprecated Gunakan filterValidForMedian() dari reference_confidence.service.js
   */
  removeOutliers(prices) {
    if (prices.length < 4) return prices;
    const sorted = [...prices].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    return prices.filter((p) => p >= lowerBound && p <= upperBound);
  }
}

export const pembandingService = new PembandingService();
export { generateSaranPencarian };
