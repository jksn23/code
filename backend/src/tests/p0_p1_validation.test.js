/**
 * p0_p1_validation.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Unit + Integration Test untuk komponen P0 (Validitas Data) dan P1 (Validitas Metode)
 *
 * Test coverage:
 *   ✅ URL Integrity (processUrl, classify, canonicalize)
 *   ✅ Comparable Matching (hard gates, soft scoring, status LAYAK/PERLU_TINJAU/TIDAK_LAYAK)
 *   ✅ Reference Confidence (TINGGI/SEDANG/RENDAH/TIDAK_CUKUP, filter valid)
 *   ✅ SAW Fixed Scale (normalisasi 1-5, benefit vs cost, validasi bobot)
 *   ✅ AHP Reciprocal Validation (diagonal, reciprocal, CR)
 *   ✅ Integration: P0+P1 pipeline (data valid → confidence → SAW → snapshot)
 *   ✅ Negative tests (data cukup, URL search, harga 0, CR buruk)
 *
 * Jalankan: node src/tests/p0_p1_validation.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { processUrl, classify, canonicalize, STATUS_INTEGRITAS } from '../services/url_integrity.js';
import { calculateMAE, calculateMAPE, calculateRMSE, calculateBias } from '../services/limit_validation.service.js';
import {
  calculateSimilarity,
  matchPembanding,
  STATUS_KECOCOKAN,
  THRESHOLD,
  tokenize,
  jaccardSimilarity,
} from '../services/comparable_matching.service.js';
import {
  calculateConfidence,
  filterValidForMedian,
  detectOutliersIQR,
  median,
  TINGKAT_KEYAKINAN,
  THRESHOLDS,
} from '../services/reference_confidence.service.js';
import { hitungSAW, hitungSAWSingleAset, normalisasiSkalaTetap, METODE_NORMALISASI } from '../services/saw.service.js';
import { hitungAHP, validateMatrix, buildReciprocalMatrix } from '../services/ahp.service.js';

// ─── Test Runner ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const errors = [];

const assert = (condition, testName, details = '') => {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    const msg = `  ❌ FAIL: ${testName}${details ? ' — ' + details : ''}`;
    console.error(msg);
    errors.push(msg);
    failed++;
  }
};

const section = (name) => {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  📋 ${name}`);
  console.log('═'.repeat(60));
};

const approxEqual = (a, b, tolerance = 0.0001) => Math.abs(a - b) <= tolerance;

// ─── TEST SUITES ─────────────────────────────────────────────────────────────

// ── 1. URL Integrity ──────────────────────────────────────────────────────────

section('URL Integrity (P0)');

// 1.1 URL halaman detail iklan — valid
{
  const result = classify('https://www.olx.co.id/iklan/toyota-avanza-2018-IDX123456.html');
  assert(result.status === STATUS_INTEGRITAS.DETAIL_IKLAN, 'OLX detail URL → DETAIL_IKLAN');
}
{
  const result = classify('https://www.tokopedia.com/toko-abc/iphone-14-pro-second-fullset-ori');
  assert(result.status === STATUS_INTEGRITAS.DETAIL_IKLAN, 'Tokopedia detail URL → DETAIL_IKLAN');
}
{
  const result = classify('https://shopee.co.id/iPhone-13-Pro-Max-256GB-i.123456789.123456789');
  assert(result.status === STATUS_INTEGRITAS.DETAIL_IKLAN, 'Shopee detail URL → DETAIL_IKLAN');
}

// 1.2 URL halaman pencarian — tidak valid
{
  const result = classify('https://www.olx.co.id/items/q-toyota-avanza');
  assert(result.status === STATUS_INTEGRITAS.HALAMAN_PENCARIAN, 'OLX search URL → HALAMAN_PENCARIAN');
}
{
  const result = classify('https://www.tokopedia.com/search?st=product&q=iphone+14');
  assert(result.status === STATUS_INTEGRITAS.HALAMAN_PENCARIAN, 'Tokopedia search URL → HALAMAN_PENCARIAN');
}
{
  const result = classify('https://shopee.co.id/search?keyword=laptop');
  assert(result.status === STATUS_INTEGRITAS.HALAMAN_PENCARIAN, 'Shopee search URL → HALAMAN_PENCARIAN');
}

// 1.3 URL tidak valid (bukan marketplace)
{
  const result = classify('https://www.google.com/search?q=toyota');
  assert(result.status === STATUS_INTEGRITAS.TIDAK_VALID, 'Google URL → TIDAK_VALID');
}
{
  const result = classify('not-a-url');
  assert(result.status === STATUS_INTEGRITAS.TIDAK_VALID, 'Non-URL → TIDAK_VALID');
}
{
  const result = classify('');
  assert(result.status === STATUS_INTEGRITAS.TIDAK_VALID, 'Empty URL → TIDAK_VALID');
}

// 1.4 Canonicalize — hapus tracking params
{
  const { canonical } = canonicalize(
    'https://www.olx.co.id/iklan/motor-honda-IDX999.html?utm_source=fb&utm_campaign=test#section'
  );
  assert(canonical && !canonical.includes('utm_source'), 'Canonicalize: hapus utm params');
  assert(canonical && !canonical.includes('#section'), 'Canonicalize: hapus fragment');
}

// 1.5 processUrl: full pipeline
{
  const result = processUrl('https://www.olx.co.id/iklan/toyota-avanza-2018-IDX123456.html');
  assert(result.statusIntegritasUrl === 'DETAIL_IKLAN', 'processUrl: statusIntegritasUrl');
  assert(result.canonicalUrlHash !== null, 'processUrl: ada hash SHA-256');
  assert(result.canonicalUrlHash.length === 64, 'processUrl: hash length 64 char');
  assert(result.sourceDomain === 'olx.co.id', 'processUrl: sourceDomain ekstrak dengan benar');
}

// ── 2. Comparable Matching ────────────────────────────────────────────────────

section('Comparable Matching (P0)');

const asetKendaraan = {
  id: 1,
  nama: 'Toyota Avanza 2018',
  deskripsi: 'Mobil keluarga kondisi baik',
  spesifikasi: null,
  hargaPasar: 150000000,
  assetVehicle: { brand: 'Toyota', type: 'Avanza', year: 2018 },
  assetProperty: null,
  assetElectronic: null,
};

// 2.1 Hard gate: harga 0 → TIDAK_LAYAK
{
  const result = calculateSimilarity(asetKendaraan, {
    judul: 'Toyota Avanza 2018',
    harga: 0,
    statusIntegritasUrl: 'DETAIL_IKLAN',
    tahun: 2018,
    kondisi: 'Bekas - Baik',
    spesifikasi: 'Avanza 2018 kondisi baik',
  });
  assert(result.hardGateFailed === true, 'Hard gate: harga 0 → hardGateFailed=true');
  assert(result.statusKecocokan === STATUS_KECOCOKAN.TIDAK_LAYAK, 'Hard gate: harga 0 → TIDAK_LAYAK');
}

// 2.2 Hard gate: URL search → TIDAK_LAYAK
{
  const result = calculateSimilarity(asetKendaraan, {
    judul: 'Toyota Avanza 2018',
    harga: 150000000,
    statusIntegritasUrl: 'HALAMAN_PENCARIAN',
    tahun: 2018,
    kondisi: 'Bekas - Baik',
    spesifikasi: 'Avanza',
  });
  assert(result.hardGateFailed === true, 'Hard gate: URL pencarian → hardGateFailed=true');
}

// 2.3 Hard gate: selisih tahun > 5 → TIDAK_LAYAK
{
  const result = calculateSimilarity(asetKendaraan, {
    judul: 'Toyota Avanza 2010',
    harga: 90000000,
    statusIntegritasUrl: 'DETAIL_IKLAN',
    tahun: 2010,
    kondisi: 'Bekas',
    spesifikasi: 'Avanza',
  });
  assert(result.hardGateFailed === true, 'Hard gate: selisih tahun 8 → TIDAK_LAYAK');
}

// 2.4 Spesifikasi mirip → similarity tinggi
{
  const result = calculateSimilarity(asetKendaraan, {
    judul: 'Toyota Avanza G 2018 Low KM',
    harga: 155000000,
    statusIntegritasUrl: 'DETAIL_IKLAN',
    tahun: 2018,
    kondisi: 'Bekas - Sangat Baik',
    spesifikasi: 'Toyota Avanza 2018 kondisi prima',
  });
  assert(result.hardGateFailed === false, 'Pembanding valid: hardGateFailed=false');
  assert(result.similarity > 0, 'Pembanding valid: similarity > 0');
  console.log(`     Similarity Toyota Avanza 2018 (mirip): ${result.similarity.toFixed(4)}`);
}

// 2.5 Tokenize + Jaccard
{
  const tokA = tokenize('Toyota Avanza 2018 kondisi baik dijual');
  const tokB = tokenize('Toyota Avanza 2018 low KM bekas baik');
  const sim = jaccardSimilarity(tokA, tokB);
  assert(sim > 0.3, `Jaccard similarity Toyota Avanza mirip: ${sim.toFixed(4)} > 0.3`);
}

// ── 3. Reference Confidence ───────────────────────────────────────────────────

section('Reference Confidence (P0)');

// 3.1 TIDAK_CUKUP: < 3 data
{
  const result = calculateConfidence([
    { harga: 150000000, jenisSumber: 'SCRAPED_REAL', sourceDomain: 'olx.co.id' },
    { harga: 145000000, jenisSumber: 'SCRAPED_REAL', sourceDomain: 'tokopedia.com' },
  ]);
  assert(result.tingkatKeyakinan === TINGKAT_KEYAKINAN.TIDAK_CUKUP, 'Confidence: 2 data → TIDAK_CUKUP');
  assert(result.diblokir === true, 'Confidence: TIDAK_CUKUP → median diblokir');
}

// 3.2 TINGGI: >= 5 data, >= 3 scraped, >= 2 domain, CV rendah
{
  const dataTinggi = [
    { harga: 150000000, jenisSumber: 'SCRAPED_REAL', sourceDomain: 'olx.co.id' },
    { harga: 148000000, jenisSumber: 'SCRAPED_REAL', sourceDomain: 'tokopedia.com' },
    { harga: 152000000, jenisSumber: 'SCRAPED_REAL', sourceDomain: 'carmudi.co.id' },
    { harga: 149000000, jenisSumber: 'MANUAL', sourceDomain: 'olx.co.id' },
    { harga: 151000000, jenisSumber: 'MANUAL', sourceDomain: 'tokopedia.com' },
  ];
  const result = calculateConfidence(dataTinggi);
  assert(result.tingkatKeyakinan === TINGKAT_KEYAKINAN.TINGGI, 'Confidence: 5 data, 3 scraped, 3 domain, CV rendah → TINGGI');
  assert(result.diblokir === false, 'Confidence: TINGGI → median tidak diblokir');
}

// 3.3 CV tinggi → RENDAH
{
  const dataSpread = [
    { harga: 100000000, jenisSumber: 'SCRAPED_REAL', sourceDomain: 'olx.co.id' },
    { harga: 150000000, jenisSumber: 'SCRAPED_REAL', sourceDomain: 'olx.co.id' },
    { harga: 200000000, jenisSumber: 'SCRAPED_REAL', sourceDomain: 'olx.co.id' },
  ];
  const result = calculateConfidence(dataSpread);
  // CV sangat tinggi (>30%) dan hanya 1 domain → RENDAH
  assert(
    [TINGKAT_KEYAKINAN.RENDAH, TINGKAT_KEYAKINAN.TIDAK_CUKUP].includes(result.tingkatKeyakinan),
    `Confidence: CV tinggi + 1 domain → ${result.tingkatKeyakinan}`
  );
}

// 3.4 filterValidForMedian
{
  const campuran = [
    { statusValidasi: 'DITERIMA', statusIntegritasUrl: 'DETAIL_IKLAN', statusKecocokan: 'LAYAK', harga: 100 },
    { statusValidasi: 'DITERIMA', statusIntegritasUrl: 'HALAMAN_PENCARIAN', statusKecocokan: 'LAYAK', harga: 100 },
    { statusValidasi: 'MENUNGGU', statusIntegritasUrl: 'DETAIL_IKLAN', statusKecocokan: 'LAYAK', harga: 100 },
    { statusValidasi: 'DITERIMA', statusIntegritasUrl: 'DETAIL_IKLAN', statusKecocokan: 'TIDAK_LAYAK', harga: 100 },
  ];
  const valid = filterValidForMedian(campuran);
  assert(valid.length === 1, `filterValidForMedian: hanya 1 yang lolos filter ketat`);
}

// 3.5 IQR Outlier detection
{
  const values = [100, 105, 98, 102, 103, 300]; // 300 adalah outlier
  const { clean, outliers } = detectOutliersIQR(values);
  assert(outliers.length > 0, 'IQR: deteksi outlier (300 dari data normal 98-105)');
  assert(!clean.includes(300), 'IQR: nilai 300 tidak masuk clean data');
}

// ── 4. SAW Fixed Scale ────────────────────────────────────────────────────────

section('SAW Fixed Scale 1-5 (P1)');

// 4.1 Normalisasi benefit
{
  assert(approxEqual(normalisasiSkalaTetap(5, 'benefit'), 1.0), 'Benefit skor 5 → norm 1.0');
  assert(approxEqual(normalisasiSkalaTetap(1, 'benefit'), 0.2), 'Benefit skor 1 → norm 0.2');
  assert(approxEqual(normalisasiSkalaTetap(3, 'benefit'), 0.6), 'Benefit skor 3 → norm 0.6');
}

// 4.2 Normalisasi cost
{
  assert(approxEqual(normalisasiSkalaTetap(1, 'cost'), 1.0), 'Cost skor 1 → norm 1.0 (terbaik)');
  assert(approxEqual(normalisasiSkalaTetap(5, 'cost'), 0.2), 'Cost skor 5 → norm 0.2 (terburuk)');
  assert(approxEqual(normalisasiSkalaTetap(3, 'cost'), 0.6), 'Cost skor 3 → norm 0.6');
}

// 4.3 hitungSAW — single aset
{
  const asetList = [{
    id: 1,
    nama: 'Aset A',
    hargaPasar: 100000000,
    nilaiAset: [
      { kriteriaId: 1, nilai: 4 },
      { kriteriaId: 2, nilai: 3 },
    ],
  }];
  const kriteria = [
    { id: 1, nama: 'Kondisi', tipe: 'benefit', bobot: 0.6 },
    { id: 2, nama: 'Usia', tipe: 'cost', bobot: 0.4 },
  ];
  const result = hitungSAW(asetList, kriteria);
  assert(result.metodeNormalisasi === METODE_NORMALISASI, 'SAW: metodeNormalisasi = FIXED_SCALE_1_5');
  assert(result.ranking.length === 1, 'SAW: 1 aset → 1 ranking');
  const vi = result.ranking[0].nilaiPreferensi;
  // V = (4/5)*0.6 + (6-3)/5*0.4 = 0.48 + 0.24 = 0.72
  assert(approxEqual(vi, 0.72, 0.001), `SAW: Preferensi = 0.72, got ${vi}`);
  const nilaiLimit = result.ranking[0].nilaiLimit;
  assert(approxEqual(nilaiLimit, 72000000, 1), `SAW: Nilai Limit = 72.000.000, got ${nilaiLimit}`);
}

// 4.4 SAW multi aset — ranking benar
{
  const asetList = [
    { id: 1, nama: 'Aset Rendah', hargaPasar: 100000000, nilaiAset: [{ kriteriaId: 1, nilai: 1 }] },
    { id: 2, nama: 'Aset Tinggi', hargaPasar: 100000000, nilaiAset: [{ kriteriaId: 1, nilai: 5 }] },
  ];
  const kriteria = [{ id: 1, nama: 'Kondisi', tipe: 'benefit', bobot: 1.0 }];
  const result = hitungSAW(asetList, kriteria);
  assert(result.ranking[0].id === 2, 'SAW: Aset skor 5 berada di ranking 1');
  assert(result.ranking[1].id === 1, 'SAW: Aset skor 1 berada di ranking 2');
}

// 4.5 SAW — error bobot tidak 1.0
{
  let threw = false;
  try {
    hitungSAW(
      [{ id: 1, nama: 'A', hargaPasar: 100, nilaiAset: [{ kriteriaId: 1, nilai: 3 }] }],
      [{ id: 1, nama: 'K', tipe: 'benefit', bobot: 0.5 }] // total bobot hanya 0.5
    );
  } catch {
    threw = true;
  }
  assert(threw, 'SAW: bobot total 0.5 → throw Error');
}

// 4.6 SAW — error nilai di luar skala 1-5
{
  let threw = false;
  try {
    hitungSAW(
      [{ id: 1, nama: 'A', hargaPasar: 100, nilaiAset: [{ kriteriaId: 1, nilai: 7 }] }],
      [{ id: 1, nama: 'K', tipe: 'benefit', bobot: 1.0 }]
    );
  } catch {
    threw = true;
  }
  assert(threw, 'SAW: nilai 7 (> skala maks 5) → throw Error');
}

// ── 5. AHP Reciprocal Validation ──────────────────────────────────────────────

section('AHP Reciprocal Validation (P1)');

// 5.1 Matriks valid reciprocal
{
  const matrix = [
    [1, 3, 5],
    [1/3, 1, 2],
    [1/5, 1/2, 1],
  ];
  const { valid, errors: errs } = validateMatrix(matrix);
  assert(valid === true, `AHP: Matriks valid reciprocal → valid=true (errors: ${errs?.join('; ')})`);
}

// 5.2 Diagonal bukan 1 → error
{
  const matrix = [
    [2, 3],
    [1/3, 1],
  ];
  const { valid, errors: errs } = validateMatrix(matrix);
  assert(valid === false, 'AHP: Diagonal [0][0]=2 → valid=false');
  assert(errs.some(e => e.includes('diagonal')), 'AHP: Error menyebut "diagonal"');
}

// 5.3 Reciprocal tidak tepat → error
{
  const matrix = [
    [1, 3],
    [0.4, 1], // Seharusnya 1/3 ≈ 0.333, bukan 0.4
  ];
  const { valid } = validateMatrix(matrix);
  assert(valid === false, 'AHP: Reciprocal tidak tepat (0.4 ≠ 1/3) → valid=false');
}

// 5.4 buildReciprocalMatrix — auto build
{
  const upper = [
    [1, 3, 5],
    [0, 1, 2],
    [0, 0, 1],
  ];
  const matrix = buildReciprocalMatrix(upper);
  assert(approxEqual(matrix[1][0], 1/3, 0.001), 'buildReciprocal: [1][0] = 1/3');
  assert(approxEqual(matrix[2][0], 1/5, 0.001), 'buildReciprocal: [2][0] = 1/5');
  assert(approxEqual(matrix[2][1], 1/2, 0.001), 'buildReciprocal: [2][1] = 1/2');

  // Verifikasi hasil hitungAHP dengan matriks auto-build konsisten
  const result = hitungAHP(matrix, { throwOnInvalidReciprocal: false });
  assert(result.CR < 0.10, `AHP auto-built matrix: CR=${result.CR.toFixed(4)} < 0.10`);
}

// 5.5 hitungAHP — matriks tidak konsisten (CR tinggi)
{
  // Matriks yang sengaja inkonsisten (a→b→c tidak transitif)
  const matrix = [
    [1, 9, 1/9],
    [1/9, 1, 9],
    [9, 1/9, 1],
  ];
  const result = hitungAHP(matrix, { throwOnInconsistent: false, throwOnInvalidReciprocal: false });
  assert(result.CR > 0.10, `AHP: CR inkonsisten = ${result.CR.toFixed(4)} > 0.10`);
  assert(result.isConsistent === false, 'AHP: isConsistent=false untuk matriks inkonsisten');
}

// 5.6 hitungAHP — matriks konsisten sempurna (identitas)
{
  const matrix = [[1]]; // 1×1 → CR = 0
  const result = hitungAHP(matrix);
  assert(result.CR === 0, 'AHP: Matriks 1×1 → CR=0');
  assert(result.isConsistent === true, 'AHP: Matriks 1×1 → konsisten');
}

// ── 6. Integration Test ───────────────────────────────────────────────────────

section('Integration: P0 + P1 Pipeline');

// Full pipeline: data pembanding valid → confidence → SAW → nilai limit
{
  // Data pembanding yang sudah divalidasi
  const pembandingValid = [
    { statusValidasi: 'DITERIMA', statusIntegritasUrl: 'DETAIL_IKLAN', statusKecocokan: 'LAYAK', jenisSumber: 'SCRAPED_REAL', sourceDomain: 'olx.co.id', harga: 145000000, isOutlier: false },
    { statusValidasi: 'DITERIMA', statusIntegritasUrl: 'DETAIL_IKLAN', statusKecocokan: 'LAYAK', jenisSumber: 'SCRAPED_REAL', sourceDomain: 'tokopedia.com', harga: 150000000, isOutlier: false },
    { statusValidasi: 'DITERIMA', statusIntegritasUrl: 'DETAIL_IKLAN', statusKecocokan: 'LAYAK', jenisSumber: 'SCRAPED_REAL', sourceDomain: 'carmudi.co.id', harga: 148000000, isOutlier: false },
    // Data TIDAK valid (tidak boleh masuk median)
    { statusValidasi: 'MENUNGGU', statusIntegritasUrl: 'DETAIL_IKLAN', statusKecocokan: 'LAYAK', jenisSumber: 'SCRAPED_REAL', sourceDomain: 'olx.co.id', harga: 200000000, isOutlier: false },
    { statusValidasi: 'DITERIMA', statusIntegritasUrl: 'HALAMAN_PENCARIAN', statusKecocokan: 'LAYAK', jenisSumber: 'SCRAPED_REAL', sourceDomain: 'google.com', harga: 99000000, isOutlier: false },
  ];

  const validOnly = filterValidForMedian(pembandingValid).filter(p => !p.isOutlier);
  assert(validOnly.length === 3, `Integration: filterValidForMedian → 3 data valid (got ${validOnly.length})`);

  const confidence = calculateConfidence(validOnly);
  assert(!confidence.diblokir, 'Integration: 3 data valid → median tidak diblokir');
  assert(confidence.mediaanHarga !== null, 'Integration: median harga ada');

  // Median dari 145, 148, 150 juta
  const expectedMedian = 148000000;
  assert(approxEqual(confidence.mediaanHarga, expectedMedian, 500000), `Integration: median ≈ 148 juta (got ${confidence.mediaanHarga})`);

  // SAW dengan harga referensi dari median
  const asetSingle = {
    id: 99,
    nama: 'Toyota Avanza 2018',
    hargaPasar: 150000000,
    nilaiAset: [
      { kriteriaId: 1, nilai: 4 },
      { kriteriaId: 2, nilai: 3 },
    ],
  };
  const kriteriaPenilaian = [
    { id: 1, nama: 'Kondisi', tipe: 'benefit', bobot: 0.6 },
    { id: 2, nama: 'Usia', tipe: 'cost', bobot: 0.4 },
  ];

  const sawResult = hitungSAWSingleAset(asetSingle, kriteriaPenilaian, confidence.mediaanHarga);
  assert(sawResult.nilaiPreferensi > 0, 'Integration: SAW nilaiPreferensi > 0');
  assert(sawResult.metodeNormalisasi === 'FIXED_SCALE_1_5', 'Integration: SAW menggunakan FIXED_SCALE_1_5');
  assert(sawResult.normalisasiSnapshot.length === 2, 'Integration: snapshot normalisasi ada');

  // Nilai Limit = Vi × Harga Referensi = 0.72 × 148.000.000 = 106.560.000
  const expectedLimit = Math.round(sawResult.nilaiPreferensi * confidence.mediaanHarga);
  assert(
    approxEqual(sawResult.nilaiLimit, expectedLimit, 1000),
    `Integration: Nilai Limit = Vi × HargaReferensi = ${expectedLimit.toLocaleString('id-ID')}`
  );

  console.log(`\n   📊 HASIL INTEGRASI:`);
  console.log(`      Harga Referensi (Median)   : Rp ${confidence.mediaanHarga.toLocaleString('id-ID')}`);
  console.log(`      Tingkat Keyakinan           : ${confidence.tingkatKeyakinan}`);
  console.log(`      Nilai Preferensi SAW        : ${sawResult.nilaiPreferensi}`);
  console.log(`      Nilai Limit Rekomendasi     : Rp ${sawResult.nilaiLimit.toLocaleString('id-ID')}`);
  console.log(`      Metode Normalisasi          : ${sawResult.metodeNormalisasi}`);
}

// ── 7. Limit Validation Metrics ──────────────────────────────────────────────

section('Limit Validation Metrics (P1)');

{
  const predicted = [100, 105, 95, 110];
  const actual = [102, 100, 98, 105];

  // MAE = (|100-102| + |105-100| + |95-98| + |110-105|) / 4 = (2 + 5 + 3 + 5) / 4 = 15/4 = 3.75
  const mae = calculateMAE(predicted, actual);
  assert(approxEqual(mae, 3.75), `Limit Validation: MAE = 3.75 (got ${mae})`);

  // RMSE = sqrt(((100-102)^2 + (105-100)^2 + (95-98)^2 + (110-105)^2) / 4)
  //      = sqrt((4 + 25 + 9 + 25) / 4) = sqrt(63 / 4) = sqrt(15.75) ≈ 3.9686
  const rmse = calculateRMSE(predicted, actual);
  assert(approxEqual(rmse, 3.9686, 0.001), `Limit Validation: RMSE ≈ 3.9686 (got ${rmse})`);

  // Bias = (sum((predicted - actual) / actual) / N) * 100
  //      = (((100-102)/102 + (105-100)/100 + (95-98)/98 + (110-105)/105) / 4) * 100
  //      = ((-2/102 + 5/100 - 3/98 + 5/105) / 4) * 100
  //      = ((-0.0196 + 0.05 - 0.0306 + 0.0476) / 4) * 100 = (0.0474 / 4) * 100 ≈ 1.185%
  const bias = calculateBias(predicted, actual);
  assert(approxEqual(bias, 1.185, 0.05), `Limit Validation: Bias ≈ 1.185% (got ${bias.toFixed(4)}%)`);

  // MAPE = (sum(|(predicted - actual) / actual|) / N) * 100
  //      = (((2/102 + 5/100 + 3/98 + 5/105) / 4) * 100
  //      = ((0.0196 + 0.05 + 0.0306 + 0.0476) / 4) * 100 = (0.1478 / 4) * 100 ≈ 3.695%
  const mape = calculateMAPE(predicted, actual);
  assert(approxEqual(mape, 3.695, 0.05), `Limit Validation: MAPE ≈ 3.695% (got ${mape.toFixed(4)}%)`);
}


// ── Final Report ──────────────────────────────────────────────────────────────

console.log(`\n${'═'.repeat(60)}`);
console.log(`  📊 HASIL TEST P0 + P1`);
console.log('═'.repeat(60));
console.log(`  Total  : ${passed + failed}`);
console.log(`  PASS   : ${passed}`);
console.log(`  FAIL   : ${failed}`);
if (errors.length > 0) {
  console.log('\n  Errors:');
  errors.forEach(e => console.log(e));
}
console.log('═'.repeat(60));

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n  🎉 SEMUA TEST LULUS!\n');
}
