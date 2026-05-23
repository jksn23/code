/**
 * TEST MANUAL: Algoritma AHP & SAW untuk Bab Hasil dan Pembahasan
 *
 * Jalankan dari folder backend:
 * npm test
 *
 * Script ini menggunakan dummy data penuh, tanpa koneksi database.
 */

import { hitungAHP } from '../services/ahp.service.js';
import { hitungSAW } from '../services/saw.service.js';

const kriteriaLelang = [
  { id: 1, nama: 'Lokasi', tipe: 'benefit' },
  { id: 2, nama: 'Luas Tanah', tipe: 'benefit' },
  { id: 3, nama: 'Kondisi Bangunan', tipe: 'benefit' },
  { id: 4, nama: 'Aksesibilitas', tipe: 'benefit' },
];

const bobotAcuanKonsisten = [0.4, 0.3, 0.2, 0.1];

const matrixAHPKonsisten = bobotAcuanKonsisten.map((bobotBaris) =>
  bobotAcuanKonsisten.map((bobotKolom) => bobotBaris / bobotKolom)
);

const matrixAHPTidakKonsisten = [
  [1, 9, 1 / 7, 5],
  [1 / 9, 1, 8, 1 / 6],
  [7, 1 / 8, 1, 9],
  [1 / 5, 6, 1 / 9, 1],
];

const formatNumber = (value, digits = 6) => Number(value).toFixed(digits);

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);

const labeledMatrixRows = (matrix, rowLabels = kriteriaLelang.map((item) => item.nama)) =>
  matrix.map((row, rowIndex) => {
    const record = { Kriteria: rowLabels[rowIndex] };
    row.forEach((value, colIndex) => {
      record[rowLabels[colIndex]] = formatNumber(value);
    });
    return record;
  });

const vectorRows = (label, values) =>
  values.map((value, index) => ({
    No: index + 1,
    Kriteria: kriteriaLelang[index].nama,
    [label]: formatNumber(value),
  }));

const printSeparator = (title) => {
  console.log('\n' + '='.repeat(100));
  console.log(title);
  console.log('='.repeat(100));
};

const printAHPDetail = (hasilAHP) => {
  console.log('\n[1] Matriks Pairwise Comparison');
  console.table(labeledMatrixRows(hasilAHP.matriksInput));

  console.log('[2] Jumlah Kolom Matriks Pairwise');
  console.table(vectorRows('Jumlah Kolom', hasilAHP.jumlahKolom));

  console.log('[3] Matriks Normalisasi AHP');
  console.table(labeledMatrixRows(hasilAHP.matriksNormalisasi));

  console.log('[4] Bobot Prioritas Kriteria (Eigen Vector/Rata-rata Baris)');
  console.table(vectorRows('Bobot', hasilAHP.bobot));

  console.log('[5] Weighted Sum Vector');
  console.table(vectorRows('Weighted Sum', hasilAHP.weightedSum));

  console.log('[6] Consistency Vector = Weighted Sum / Bobot');
  console.table(vectorRows('Consistency Vector', hasilAHP.consistencyVector));

  console.log('[7] Indikator Konsistensi');
  console.table([
    {
      'Ukuran Matriks': `${hasilAHP.ukuranMatriks}x${hasilAHP.ukuranMatriks}`,
      'Random Index (RI)': formatNumber(hasilAHP.randomIndex),
      'Lambda Max': formatNumber(hasilAHP.lambdaMax),
      'Consistency Index (CI)': formatNumber(hasilAHP.CI),
      'Consistency Ratio (CR)': formatNumber(hasilAHP.CR),
      Threshold: hasilAHP.threshold,
      Status: hasilAHP.isConsistent ? 'KONSISTEN' : 'TIDAK KONSISTEN',
    },
  ]);
};

const printSAWDetail = (hasilSAW) => {
  console.log('\n[1] Kriteria SAW dan Bobot dari AHP');
  console.table(
    hasilSAW.detailKriteria.map((item) => ({
      ID: item.id,
      Kriteria: item.nama,
      Tipe: item.tipe,
      Bobot: formatNumber(item.bobot),
      Max: formatNumber(item.max),
      Min: formatNumber(item.min),
    }))
  );

  console.log('[2] Matriks Keputusan X (Nilai Asli Setiap Aset)');
  console.table(
    hasilSAW.ranking
      .slice()
      .sort((a, b) => a.id - b.id)
      .map((aset) => {
        const row = { Aset: aset.nama, 'Harga Pasar': formatRupiah(aset.hargaPasar) };
        aset.detailNormalisasi.forEach((detail) => {
          row[detail.namaKriteria] = formatNumber(detail.nilaiAsli, 2);
        });
        return row;
      })
  );

  console.log('[3] Matriks Normalisasi R dan Kontribusi Bobot (Wj x Rij)');
  hasilSAW.ranking
    .slice()
    .sort((a, b) => a.id - b.id)
    .forEach((aset) => {
      console.log(`\nAset: ${aset.nama}`);
      console.table(
        aset.detailNormalisasi.map((detail) => ({
          Kriteria: detail.namaKriteria,
          Tipe: detail.tipe,
          'Nilai Asli': formatNumber(detail.nilaiAsli, 2),
          'Nilai Normalisasi Rij': formatNumber(detail.nilaiNorm),
          Bobot: formatNumber(detail.bobot),
          'Kontribusi Wj x Rij': formatNumber(detail.kontribusi),
        }))
      );
    });

  console.log('\n[4] Tabel Akhir Perangkingan SAW');
  console.table(
    hasilSAW.ranking.map((item) => ({
      Ranking: item.ranking,
      Aset: item.nama,
      'Nilai Preferensi (V)': formatNumber(item.nilaiPreferensi),
      'Harga Pasar': formatRupiah(item.hargaPasar),
      'Estimasi Nilai Limit Rupiah': formatRupiah(item.nilaiLimit),
    }))
  );
};

printSeparator('TEST ALGORITMA AHP-SAW UNTUK SPK LELANG ONLINE');
console.log('Kriteria lelang yang diuji:');
console.table(
  kriteriaLelang.map((item) => ({
    ID: item.id,
    Kriteria: item.nama,
    Tipe: item.tipe,
  }))
);

let hasilAHPKonsisten;

try {
  printSeparator('TEST CASE 1: AHP KONSISTEN (CR < 0.1)');
  hasilAHPKonsisten = hitungAHP(matrixAHPKonsisten);
  printAHPDetail(hasilAHPKonsisten);

  if (!hasilAHPKonsisten.isConsistent) {
    throw new Error(`CR = ${hasilAHPKonsisten.CR} seharusnya < 0.1`);
  }

  console.log(
    `✅ TEST 1 PASSED: Consistency Ratio (CR) = ${formatNumber(hasilAHPKonsisten.CR)} < 0.1, Bobot Kriteria Valid.`
  );
} catch (error) {
  console.error(`❌ TEST 1 FAILED: ${error.message}`);
  process.exitCode = 1;
}

try {
  printSeparator('TEST CASE 2: AHP TIDAK KONSISTEN (CR > 0.1)');
  const hasilTidakKonsisten = hitungAHP(matrixAHPTidakKonsisten, { throwOnInconsistent: true });
  printAHPDetail(hasilTidakKonsisten);
  throw new Error(`Matriks tidak konsisten tetap lolos. CR = ${hasilTidakKonsisten.CR}`);
} catch (error) {
  const hasilTidakKonsisten = error.result;

  if (!hasilTidakKonsisten) {
    console.error(`❌ TEST 2 FAILED: ${error.message}`);
    process.exitCode = 1;
  } else {
    printAHPDetail(hasilTidakKonsisten);
    console.log(`Pesan sistem: ${error.message}`);
    console.log(
      `✅ TEST 2 PASSED: CR terdeteksi = ${formatNumber(hasilTidakKonsisten.CR)} > 0.1. Sistem berhasil menghentikan proses (STOP).`
    );
  }
}

try {
  printSeparator('TEST CASE 3: PERANGKINGAN SAW 5 ASET');

  if (!hasilAHPKonsisten?.isConsistent) {
    throw new Error('Bobot AHP dari Test Case 1 tidak valid, SAW tidak dijalankan');
  }

  const kriteriaSAW = kriteriaLelang.map((kriteria, index) => ({
    ...kriteria,
    bobot: hasilAHPKonsisten.bobot[index],
  }));

  const asetSAW = [
    {
      id: 1,
      nama: 'Rumah A',
      hargaPasar: 850000000,
      nilaiAset: [
        { kriteriaId: 1, nilai: 88 },
        { kriteriaId: 2, nilai: 120 },
        { kriteriaId: 3, nilai: 82 },
        { kriteriaId: 4, nilai: 90 },
      ],
    },
    {
      id: 2,
      nama: 'Rumah B',
      hargaPasar: 760000000,
      nilaiAset: [
        { kriteriaId: 1, nilai: 75 },
        { kriteriaId: 2, nilai: 150 },
        { kriteriaId: 3, nilai: 78 },
        { kriteriaId: 4, nilai: 72 },
      ],
    },
    {
      id: 3,
      nama: 'Rumah C',
      hargaPasar: 920000000,
      nilaiAset: [
        { kriteriaId: 1, nilai: 92 },
        { kriteriaId: 2, nilai: 110 },
        { kriteriaId: 3, nilai: 88 },
        { kriteriaId: 4, nilai: 85 },
      ],
    },
    {
      id: 4,
      nama: 'Rumah D',
      hargaPasar: 680000000,
      nilaiAset: [
        { kriteriaId: 1, nilai: 70 },
        { kriteriaId: 2, nilai: 95 },
        { kriteriaId: 3, nilai: 65 },
        { kriteriaId: 4, nilai: 80 },
      ],
    },
    {
      id: 5,
      nama: 'Rumah E',
      hargaPasar: 810000000,
      nilaiAset: [
        { kriteriaId: 1, nilai: 84 },
        { kriteriaId: 2, nilai: 135 },
        { kriteriaId: 3, nilai: 90 },
        { kriteriaId: 4, nilai: 76 },
      ],
    },
  ];

  const hasilSAW = hitungSAW(asetSAW, kriteriaSAW);
  printSAWDetail(hasilSAW);

  if (hasilSAW.ranking.length !== 5) {
    throw new Error(`Jumlah hasil ranking seharusnya 5, tetapi menjadi ${hasilSAW.ranking.length}`);
  }

  console.log('✅ TEST 3 PASSED: SAW berhasil merangking 5 aset.');
} catch (error) {
  console.error(`❌ TEST 3 FAILED: ${error.message}`);
  process.exitCode = 1;
}

printSeparator('RINGKASAN EKSEKUSI');
if (process.exitCode === 1) {
  console.log('Status akhir: ADA TEST YANG GAGAL. Periksa pesan error di atas.');
} else {
  console.log('Status akhir: SEMUA TEST PASSED. Output angka dan tabel siap digunakan untuk naskah jurnal.');
}
