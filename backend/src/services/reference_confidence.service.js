/**
 * reference_confidence.service.js (ESM)
 * ─────────────────────────────────────────────────────────────────────────────
 * P0 — Kalkulasi tingkat keyakinan referensi harga pasar.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const TINGKAT_KEYAKINAN = {
  TINGGI: 'TINGGI',
  SEDANG: 'SEDANG',
  RENDAH: 'RENDAH',
  TIDAK_CUKUP: 'TIDAK_CUKUP',
};

export const THRESHOLDS = {
  MIN_DATA_VALID: 3,
  MIN_SCRAPED_TINGGI: 3,
  MIN_SCRAPED_SEDANG: 2,
  MIN_DOMAIN_SEDANG: 2,
  MIN_DATA_TINGGI: 5,
  CV_TINGGI: 0.20,
  CV_SEDANG: 0.30,
};

export function mean(values) {
  if (!values.length) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function stdDev(values) {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function coefficientOfVariation(values) {
  if (!values.length) return 0;
  const avg = mean(values);
  if (avg === 0) return 0;
  return stdDev(values) / avg;
}

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function detectOutliersIQR(values) {
  if (values.length < 4) return { lower: -Infinity, upper: Infinity, outliers: [], clean: values };
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const clean = values.filter((v) => v >= lower && v <= upper);
  const outliers = values.filter((v) => v < lower || v > upper);
  return { lower, upper, outliers, clean };
}

export function calculateConfidence(pembandingList) {
  const hargaValues = pembandingList
    .map((p) => parseFloat(p.harga))
    .filter((h) => h > 0 && isFinite(h));

  const { clean: hargaClean, outliers: hargaOutliers } = detectOutliersIQR(hargaValues);

  const jumlahTotal = pembandingList.length;
  const jumlahHargaValid = hargaClean.length;

  const scraped = pembandingList.filter((p) => p.jenisSumber === 'SCRAPED_REAL');
  const manual = pembandingList.filter((p) => p.jenisSumber === 'MANUAL');
  const domains = new Set(pembandingList.map((p) => p.sourceDomain).filter(Boolean));
  const jumlahDomainUnik = domains.size;
  const jumlahScrapedReal = scraped.length;
  const jumlahManual = manual.length;

  const cv = hargaClean.length > 1 ? coefficientOfVariation(hargaClean) : 0;
  const hargaMedian = median(hargaClean);
  const hargaMean = mean(hargaClean);
  const hargaStdDev = stdDev(hargaClean);

  const statistik = {
    jumlahTotal,
    jumlahHargaValid,
    jumlahScrapedReal,
    jumlahManual,
    jumlahDomainUnik,
    jumlahOutlier: hargaOutliers.length,
    hargaMedian,
    hargaMean: parseFloat(hargaMean.toFixed(2)),
    hargaStdDev: parseFloat(hargaStdDev.toFixed(2)),
    cv: parseFloat(cv.toFixed(4)),
    domains: [...domains],
  };

  const alasan = [];
  let tingkatKeyakinan;
  let skorKeyakinan = 0;

  if (jumlahHargaValid < THRESHOLDS.MIN_DATA_VALID) {
    tingkatKeyakinan = TINGKAT_KEYAKINAN.TIDAK_CUKUP;
    alasan.push(`Hanya ${jumlahHargaValid} data valid setelah filter outlier (minimum: ${THRESHOLDS.MIN_DATA_VALID})`);
    skorKeyakinan = (jumlahHargaValid / THRESHOLDS.MIN_DATA_VALID) * 25;
  } else if (
    jumlahHargaValid >= THRESHOLDS.MIN_DATA_TINGGI &&
    jumlahScrapedReal >= THRESHOLDS.MIN_SCRAPED_TINGGI &&
    jumlahDomainUnik >= THRESHOLDS.MIN_DOMAIN_SEDANG &&
    cv <= THRESHOLDS.CV_TINGGI
  ) {
    tingkatKeyakinan = TINGKAT_KEYAKINAN.TINGGI;
    alasan.push(`${jumlahHargaValid} data valid, ${jumlahScrapedReal} scraped real, ${jumlahDomainUnik} domain unik, CV=${(cv * 100).toFixed(1)}%`);
    skorKeyakinan = 90 + Math.min(10, jumlahHargaValid - 5);
  } else if (
    jumlahHargaValid >= THRESHOLDS.MIN_DATA_VALID &&
    jumlahScrapedReal >= THRESHOLDS.MIN_SCRAPED_SEDANG &&
    jumlahDomainUnik >= THRESHOLDS.MIN_DOMAIN_SEDANG &&
    cv <= THRESHOLDS.CV_SEDANG
  ) {
    tingkatKeyakinan = TINGKAT_KEYAKINAN.SEDANG;
    alasan.push(`${jumlahHargaValid} data valid, ${jumlahScrapedReal} scraped real, ${jumlahDomainUnik} domain unik, CV=${(cv * 100).toFixed(1)}%`);
    skorKeyakinan = Math.min(79, 60 + (jumlahScrapedReal * 5) + (jumlahDomainUnik * 3));
  } else {
    tingkatKeyakinan = TINGKAT_KEYAKINAN.RENDAH;
    if (jumlahScrapedReal < THRESHOLDS.MIN_SCRAPED_SEDANG) {
      alasan.push(`Scraped real kurang (${jumlahScrapedReal} < ${THRESHOLDS.MIN_SCRAPED_SEDANG}) — dominasi manual`);
    }
    if (jumlahDomainUnik < THRESHOLDS.MIN_DOMAIN_SEDANG) {
      alasan.push(`Domain unik kurang (${jumlahDomainUnik} < ${THRESHOLDS.MIN_DOMAIN_SEDANG}) — berisiko konfirmasi bias`);
    }
    if (cv > THRESHOLDS.CV_SEDANG) {
      alasan.push(`Sebaran harga tinggi CV=${(cv * 100).toFixed(1)}% > ${THRESHOLDS.CV_SEDANG * 100}%`);
    }
    skorKeyakinan = Math.min(59, Math.max(25, 25 + (jumlahHargaValid * 3) + (jumlahScrapedReal * 2)));
  }

  return {
    tingkatKeyakinan,
    skorKeyakinan: parseFloat(skorKeyakinan.toFixed(2)),
    alasanKeyakinan: { alasan, statistik },
    mediaanHarga: hargaMedian,
    diblokir: tingkatKeyakinan === TINGKAT_KEYAKINAN.TIDAK_CUKUP,
    statistik,
  };
}

export function filterValidForMedian(pembandingList) {
  return pembandingList.filter(
    (p) =>
      p.statusValidasi === 'DITERIMA' &&
      p.statusIntegritasUrl === 'DETAIL_IKLAN' &&
      p.statusKecocokan === 'LAYAK',
  );
}
