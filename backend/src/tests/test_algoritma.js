/**
 * TEST MANUAL: Algoritma AHP & SAW
 * Jalankan: node src/tests/test_algoritma.js
 * 
 * Data test:
 * - 3 Kriteria: Kondisi (benefit), Usia (cost), Harga (benefit)
 * - 2 Aset: Laptop A, Laptop B
 */

import { hitungAHP } from '../services/ahp.service.js';
import { hitungSAW } from '../services/saw.service.js';

console.log('='.repeat(60));
console.log('🧪 TEST ALGORITMA AHP & SAW');
console.log('='.repeat(60));

// ==========================================
// TEST 1: AHP dengan matriks 3x3
// ==========================================
console.log('\n📌 TEST 1: AHP (Matriks 3x3 - Konsisten)');
console.log('-'.repeat(40));

const matrix3x3 = [
  [1,   3,   5  ],
  [1/3, 1,   3  ],
  [1/5, 1/3, 1  ],
];

try {
  const hasilAHP = hitungAHP(matrix3x3);
  console.log('✅ Bobot Kriteria:', hasilAHP.bobot);
  console.log('   λmax:', hasilAHP.lambdaMax);
  console.log('   CI  :', hasilAHP.CI);
  console.log('   CR  :', hasilAHP.CR);
  console.log('   Status:', hasilAHP.pesan);
  if (!hasilAHP.isConsistent) throw new Error('GAGAL: Matriks seharusnya konsisten!');
  console.log('✅ TEST 1 PASSED\n');
} catch (e) {
  console.error('❌ TEST 1 FAILED:', e.message);
}

// ==========================================
// TEST 2: AHP Tidak Konsisten (CR >= 0.1)
// ==========================================
console.log('📌 TEST 2: AHP (Tidak Konsisten - CR harus > 0.1)');
console.log('-'.repeat(40));

const matrixTidakKonsisten = [
  [1, 9, 2],
  [1/9, 1, 9],
  [1/2, 1/9, 1],
];

try {
  const hasilTidakKonsisten = hitungAHP(matrixTidakKonsisten);
  console.log('   CR:', hasilTidakKonsisten.CR);
  console.log('   Status:', hasilTidakKonsisten.pesan);
  if (hasilTidakKonsisten.isConsistent) {
    throw new Error('GAGAL: Matriks seharusnya tidak konsisten!');
  }
  console.log('✅ TEST 2 PASSED (CR terdeteksi > 0.1, sistem STOP)\n');
} catch (e) {
  if (e.message.startsWith('GAGAL')) console.error('❌ TEST 2 FAILED:', e.message);
  else console.error('❌ TEST 2 ERROR:', e.message);
}

// ==========================================
// TEST 3: SAW dengan 2 aset, 3 kriteria
// ==========================================
console.log('📌 TEST 3: SAW (2 Aset, 3 Kriteria)');
console.log('-'.repeat(40));

// Bobot dari hasil AHP Test 1
const bobotAHP = hitungAHP(matrix3x3).bobot;

const kriteriaSAW = [
  { id: 1, nama: 'Kondisi', tipe: 'benefit', bobot: bobotAHP[0] },
  { id: 2, nama: 'Usia (Tahun)', tipe: 'cost', bobot: bobotAHP[1] },
  { id: 3, nama: 'Harga Beli', tipe: 'benefit', bobot: bobotAHP[2] },
];

const asetSAW = [
  {
    id: 1, nama: 'Laptop A', hargaPasar: 8000000,
    nilaiAset: [
      { kriteriaId: 1, nilai: '8' },
      { kriteriaId: 2, nilai: '3' },
      { kriteriaId: 3, nilai: '7000000' },
    ],
  },
  {
    id: 2, nama: 'Laptop B', hargaPasar: 5000000,
    nilaiAset: [
      { kriteriaId: 1, nilai: '6' },
      { kriteriaId: 2, nilai: '5' },
      { kriteriaId: 3, nilai: '5000000' },
    ],
  },
];

try {
  const hasilSAW = hitungSAW(asetSAW, kriteriaSAW);
  console.log('✅ Hasil Perankingan SAW:');
  hasilSAW.ranking.forEach((item) => {
    console.log(`   Rank ${item.ranking}: ${item.nama}`);
    console.log(`           Nilai Preferensi : ${item.nilaiPreferensi}`);
    console.log(`           Nilai Limit      : Rp ${item.nilaiLimit.toLocaleString('id-ID')}`);
  });
  if (hasilSAW.ranking.length !== 2) throw new Error('GAGAL: Harus ada 2 hasil!');
  console.log('✅ TEST 3 PASSED\n');
} catch (e) {
  console.error('❌ TEST 3 FAILED:', e.message);
}

console.log('='.repeat(60));
console.log('✅ SEMUA TEST SELESAI');
console.log('='.repeat(60));
