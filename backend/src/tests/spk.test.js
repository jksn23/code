/**
 * UNIT TEST: Validasi Algoritma SPK AHP + SAW
 * 
 * Tujuan:
 * 1. Memastikan perhitungan AHP sesuai formula (λmax, CI, CR)
 * 2. Memastikan SAW menghasilkan normalisasi, perankingan, dan nilai limit yang benar
 * 3. Memvalidasi kasus edge (data kosong, kriteria hilang, dll)
 * 
 * Jalankan: node src/tests/spk.test.js
 * 
 * Catatan: Test ini menggunakan data dari hasil_pengujian_final.md
 * sebagai expected values untuk validasi penelitian.
 */

import { hitungAHP } from '../services/ahp.service.js';
import { hitungSAW } from '../services/saw.service.js';

// ─── Helpers ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

const assert = (condition, testName, details = '') => {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${details ? ' — ' + details : ''}`);
    failed++;
  }
};

const assertAlmostEqual = (actual, expected, tolerance = 0.001, testName = '') => {
  const diff = Math.abs(actual - expected);
  assert(
    diff <= tolerance,
    testName || `${actual} ≈ ${expected} (tol: ${tolerance})`,
    `actual=${actual}, expected=${expected}, diff=${diff}`
  );
};

const section = (title) => {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`📋 ${title}`);
  console.log('─'.repeat(70));
};

// ─── Data Test Berdasarkan hasil_pengujian_final.md ───────────────────────────

// Kategori: Kendaraan — 3 aset
const kriteriaKendaraan = [
  { id: 1, nama: 'Kondisi Fisik', tipe: 'benefit', bobot: 0.370513 },
  { id: 2, nama: 'Tahun Produksi', tipe: 'benefit', bobot: 0.278636 },
  { id: 3, nama: 'Kelengkapan Surat', tipe: 'benefit', bobot: 0.207252 },
  { id: 4, nama: 'Jarak Tempuh', tipe: 'cost', bobot: 0.143599 },
];

const asetKendaraan = [
  {
    id: 1,
    nama: 'Honda Beat 2021',
    hargaPasar: 12900000,
    nilaiAset: [
      { kriteriaId: 1, nilai: 5 },
      { kriteriaId: 2, nilai: 5 },
      { kriteriaId: 3, nilai: 5 },
      { kriteriaId: 4, nilai: 1 },
    ],
  },
  {
    id: 2,
    nama: 'Toyota Avanza 2019',
    hargaPasar: 150000000,
    nilaiAset: [
      { kriteriaId: 1, nilai: 4 },
      { kriteriaId: 2, nilai: 4 },
      { kriteriaId: 3, nilai: 5 },
      { kriteriaId: 4, nilai: 2 },
    ],
  },
  {
    id: 3,
    nama: 'Mitsubishi Xpander 2018',
    hargaPasar: 179000000,
    nilaiAset: [
      { kriteriaId: 1, nilai: 4 },
      { kriteriaId: 2, nilai: 3 },
      { kriteriaId: 3, nilai: 4 },
      { kriteriaId: 4, nilai: 2 },
    ],
  },
];

// Kategori: Elektronik — 3 aset
const kriteriaElektronik = [
  { id: 5, nama: 'Kondisi Fisik', tipe: 'benefit', bobot: 0.512821 },
  { id: 6, nama: 'Spesifikasi Teknis', tipe: 'benefit', bobot: 0.307692 },
  { id: 7, nama: 'Kelengkapan Aksesori', tipe: 'benefit', bobot: 0.179487 },
];

const asetElektronik = [
  {
    id: 4,
    nama: 'Laptop Lenovo ThinkPad 2021',
    hargaPasar: 5850000,
    nilaiAset: [
      { kriteriaId: 5, nilai: 5 },
      { kriteriaId: 6, nilai: 5 },
      { kriteriaId: 7, nilai: 5 },
    ],
  },
  {
    id: 5,
    nama: 'iPhone 12 128GB',
    hargaPasar: 5800000,
    nilaiAset: [
      { kriteriaId: 5, nilai: 5 },
      { kriteriaId: 6, nilai: 5 },
      { kriteriaId: 7, nilai: 4 },
    ],
  },
  {
    id: 6,
    nama: 'Kamera Canon EOS 700D',
    hargaPasar: 3300000,
    nilaiAset: [
      { kriteriaId: 5, nilai: 4 },
      { kriteriaId: 6, nilai: 4 },
      { kriteriaId: 7, nilai: 5 },
    ],
  },
];

// ─── TEST SUITE 1: AHP ───────────────────────────────────────────────────────

section('TEST SUITE 1: Algoritma AHP — Konsistensi Rasio');

try {
  // Matriks yang sempurna konsisten (CR = 0)
  const bobotAcuan = [0.4, 0.3, 0.2, 0.1];
  const matriksKonsisten = bobotAcuan.map((a) => bobotAcuan.map((b) => a / b));
  const hasil1 = hitungAHP(matriksKonsisten);

  assert(hasil1.isConsistent, 'Matriks sempurna konsisten (CR=0) harus lulus');
  assertAlmostEqual(hasil1.CR, 0, 0.001, 'CR matriks konsisten ≈ 0');
  assertAlmostEqual(hasil1.CI, 0, 0.001, 'CI matriks konsisten ≈ 0');
  assert(hasil1.bobot.length === 4, 'Jumlah bobot = 4 (sesuai ukuran matriks)');

  // Validasi bobot mendekati nilai input
  bobotAcuan.forEach((bAcuan, i) => {
    assertAlmostEqual(
      hasil1.bobot[i],
      bAcuan,
      0.001,
      `Bobot kriteria-${i + 1} ≈ ${bAcuan}`
    );
  });

  // Jumlah bobot harus ≈ 1
  const totalBobot = hasil1.bobot.reduce((sum, b) => sum + b, 0);
  assertAlmostEqual(totalBobot, 1.0, 0.001, 'Total bobot AHP ≈ 1.0');

} catch (e) {
  assert(false, 'AHP konsisten tidak boleh throw error', e.message);
}

// Matriks tidak konsisten harus terdeteksi
try {
  const matriksTidakKonsisten = [
    [1, 9, 1 / 7, 5],
    [1 / 9, 1, 8, 1 / 6],
    [7, 1 / 8, 1, 9],
    [1 / 5, 6, 1 / 9, 1],
  ];
  const hasil2 = hitungAHP(matriksTidakKonsisten, { throwOnInconsistent: true });
  assert(false, 'Matriks tidak konsisten HARUS throw error', `CR=${hasil2.CR} tidak terdeteksi`);
} catch (e) {
  assert(e.result && !e.result.isConsistent, 'Matriks tidak konsisten terdeteksi dan di-reject');
  assert(e.result?.CR > 0.1, `CR > 0.1 (actual: ${e.result?.CR?.toFixed(4)})`);
}

// Validasi error handling
try {
  hitungAHP([]);
  assert(false, 'Matriks kosong harus throw error');
} catch (e) {
  assert(e.message.includes('kosong'), 'Error message untuk matriks kosong sesuai');
}

// ─── TEST SUITE 2: SAW — Perhitungan Perangkingan ────────────────────────────

section('TEST SUITE 2: Algoritma SAW — Normalisasi & Perangkingan');

// Test 2.1: SAW Kendaraan
try {
  const hasilSAW = hitungSAW(asetKendaraan, kriteriaKendaraan);

  assert(hasilSAW.ranking.length === 3, 'SAW Kendaraan: 3 aset diproses');

  const hondaBeat = hasilSAW.ranking.find((a) => a.id === 1);
  const toyotaAvanza = hasilSAW.ranking.find((a) => a.id === 2);
  const xpander = hasilSAW.ranking.find((a) => a.id === 3);

  assert(hondaBeat !== undefined, 'Honda Beat ada di hasil SAW');
  assert(hondaBeat.ranking === 1, 'Honda Beat ranking 1 (nilai preferensi tertinggi)');

  // Validasi nilai preferensi relatif (Honda Beat punya semua nilai max, harus ranking 1)
  // Expected values berdasarkan bobot aktual dari test ini:
  // Honda Beat nilaiAset semua max (5,5,5 benefit + nilai cost min=1)
  // → normalisasi semua = 1.0 → nilaiPreferensi = sum(bobot) = 1.0
  assertAlmostEqual(hondaBeat.nilaiPreferensi, 1.0, 0.001, 'Honda Beat nilaiPreferensi = 1.0 (semua kriteria optimal)');
  assert(hondaBeat.nilaiPreferensi > toyotaAvanza.nilaiPreferensi, 'Honda Beat > Toyota Avanza');
  assert(toyotaAvanza.nilaiPreferensi > xpander.nilaiPreferensi, 'Toyota Avanza > Xpander');

  // Nilai limit = nilaiPreferensi × hargaPasar
  assertAlmostEqual(
    hondaBeat.nilaiLimit,
    hondaBeat.nilaiPreferensi * 12900000,
    1000,
    `Honda Beat nilaiLimit = nilaiPreferensi × hargaPasar`
  );

  // Pastikan ranking terurut descending
  const preferensiRanking = hasilSAW.ranking.map((a) => a.nilaiPreferensi);
  for (let i = 0; i < preferensiRanking.length - 1; i++) {
    assert(
      preferensiRanking[i] >= preferensiRanking[i + 1],
      `Ranking ${i + 1} nilaiPreferensi >= ranking ${i + 2}`
    );
  }

} catch (e) {
  assert(false, 'SAW Kendaraan tidak boleh throw error', e.message);
}

// Test 2.2: SAW Elektronik
try {
  const hasilSAW = hitungSAW(asetElektronik, kriteriaElektronik);

  assert(hasilSAW.ranking.length === 3, 'SAW Elektronik: 3 aset diproses');

  const thinkpad = hasilSAW.ranking.find((a) => a.id === 4);
  const iphone = hasilSAW.ranking.find((a) => a.id === 5);

  assert(thinkpad?.ranking === 1, 'ThinkPad ranking 1 (semua nilai maksimal)');
  assertAlmostEqual(thinkpad?.nilaiPreferensi, 1.0, 0.001, 'ThinkPad nilaiPreferensi = 1.0 (semua kriteria max)');
  assert(thinkpad?.nilaiPreferensi >= iphone?.nilaiPreferensi, 'ThinkPad > iPhone dalam preferensi');

} catch (e) {
  assert(false, 'SAW Elektronik tidak boleh throw error', e.message);
}

// ─── TEST SUITE 3: SAW — Validasi Tipe Kriteria ──────────────────────────────

section('TEST SUITE 3: SAW — Normalisasi Benefit vs Cost');

try {
  // Aset dengan cost lebih rendah harus mendapat normalisasi lebih tinggi
  const kriteriaTest = [
    { id: 1, nama: 'Usia', tipe: 'cost', bobot: 1.0 },
  ];
  const asetTest = [
    { id: 1, nama: 'Aset Lama', hargaPasar: 100, nilaiAset: [{ kriteriaId: 1, nilai: 10 }] },
    { id: 2, nama: 'Aset Baru', hargaPasar: 100, nilaiAset: [{ kriteriaId: 1, nilai: 2 }] },
  ];
  const hasil = hitungSAW(asetTest, kriteriaTest);
  const asetBaru = hasil.ranking.find((a) => a.id === 2);
  const asetLama = hasil.ranking.find((a) => a.id === 1);

  assert(asetBaru.ranking === 1, 'Kriteria cost: nilai lebih kecil = ranking lebih tinggi');
  assert(asetBaru.nilaiPreferensi > asetLama.nilaiPreferensi, 'Aset baru (cost rendah) > aset lama dalam preferensi');

  // Normalisasi cost: min/val
  const normBaru = asetBaru.detailNormalisasi[0].nilaiNorm;
  assertAlmostEqual(normBaru, 1.0, 0.001, 'Normalisasi cost terkecil = 1.0 (min/min = 1)');

} catch (e) {
  assert(false, 'Normalisasi cost tidak boleh gagal', e.message);
}

// ─── TEST SUITE 4: Edge Cases ────────────────────────────────────────────────

section('TEST SUITE 4: Edge Cases & Error Handling');

// Aset tanpa nilai kriteria
try {
  const asetTidakLengkap = [
    { id: 1, nama: 'Aset A', hargaPasar: 100, nilaiAset: [] }, // tidak ada nilai
    { id: 2, nama: 'Aset B', hargaPasar: 100, nilaiAset: [{ kriteriaId: 1, nilai: 3 }] },
  ];
  const kriteriaDummy = [{ id: 1, nama: 'K1', tipe: 'benefit', bobot: 1.0 }];
  hitungSAW(asetTidakLengkap, kriteriaDummy);
  assert(false, 'Aset tanpa nilai kriteria harus throw error');
} catch (e) {
  assert(e.message.includes('belum diisi'), 'Error: nilai kriteria belum diisi');
}

// Daftar aset kosong
try {
  hitungSAW([], [{ id: 1, nama: 'K', tipe: 'benefit', bobot: 1 }]);
  assert(false, 'Aset kosong harus throw error');
} catch (e) {
  assert(true, 'Aset kosong terdeteksi dan di-reject');
}

// Kriteria kosong
try {
  hitungSAW([{ id: 1, nama: 'A', hargaPasar: 1, nilaiAset: [] }], []);
  assert(false, 'Kriteria kosong harus throw error');
} catch (e) {
  assert(true, 'Kriteria kosong terdeteksi dan di-reject');
}

// ─── Ringkasan ────────────────────────────────────────────────────────────────

section(`HASIL AKHIR UNIT TEST SPK`);
console.log(`  Total  : ${passed + failed} test`);
console.log(`  ✅ PASS : ${passed} test`);
console.log(`  ❌ FAIL : ${failed} test`);
console.log('');

if (failed === 0) {
  console.log('🎉 SEMUA TEST LULUS — Algoritma AHP & SAW tervalidasi untuk penelitian skripsi.');
  process.exit(0);
} else {
  console.error(`⚠️  ${failed} TEST GAGAL — Periksa hasil di atas sebelum melanjutkan.`);
  process.exit(1);
}
