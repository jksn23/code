/**
 * SERVICE: AHP (Analytical Hierarchy Process)
 * 
 * Langkah:
 * 1. Buat matriks pairwise comparison n x n
 * 2. Jumlahkan setiap kolom
 * 3. Normalisasi (Nij = aij / jumlah kolom j)
 * 4. Hitung bobot Wi = rata-rata baris normalisasi
 * 5. Hitung λmax dari (matriks * bobot) / bobot
 * 6. CI = (λmax - n) / (n - 1)
 * 7. CR = CI / RI
 * 8. Validasi CR < 0.1
 */

// Random Index (RI) berdasarkan jumlah kriteria
const RI_TABLE = {
  1: 0.00, 2: 0.00, 3: 0.58, 4: 0.90,
  5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41,
  9: 1.45, 10: 1.49,
};

/**
 * Hitung AHP dari matriks pairwise comparison
 * @param {number[][]} matrix - Matriks n x n
 * @returns {object} Hasil perhitungan AHP lengkap
 */
export function hitungAHP(matrix) {
  const n = matrix.length;

  // Validasi matriks
  if (n < 2) throw new Error('Matriks minimal 2x2');
  if (!matrix.every((row) => row.length === n)) throw new Error('Matriks harus berbentuk persegi (n x n)');

  // Step 1: Jumlah setiap kolom
  const jumlahKolom = Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      jumlahKolom[j] += matrix[i][j];
    }
  }

  // Step 2: Normalisasi matriks (Nij = aij / jumlah kolom j)
  const matriksNorm = matrix.map((row, i) =>
    row.map((val, j) => val / jumlahKolom[j])
  );

  // Step 3: Bobot Wi = rata-rata baris normalisasi
  const bobot = matriksNorm.map((row) => row.reduce((sum, val) => sum + val, 0) / n);

  // Step 4: Hitung λmax
  // Kalikan matriks asli x bobot, lalu bagi masing-masing dengan bobot
  const weightedSum = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      weightedSum[i] += matrix[i][j] * bobot[j];
    }
  }
  const lambdaValues = weightedSum.map((ws, i) => ws / bobot[i]);
  const lambdaMax = lambdaValues.reduce((sum, val) => sum + val, 0) / n;

  // Step 5: Consistency Index (CI)
  const CI = (lambdaMax - n) / (n - 1);

  // Step 6: Consistency Ratio (CR)
  const ri = RI_TABLE[n];
  if (ri === undefined) throw new Error(`RI belum terdefinisi untuk n=${n}. Maksimal n=10`);
  
  const CR = n <= 2 ? 0 : CI / ri;

  // Step 7: Validasi CR
  const isConsistent = CR < 0.1;

  return {
    n,
    jumlahKolom,
    matriksNorm: matriksNorm.map(row => row.map(v => parseFloat(v.toFixed(6)))),
    bobot: bobot.map(v => parseFloat(v.toFixed(6))),
    lambdaMax: parseFloat(lambdaMax.toFixed(6)),
    CI: parseFloat(CI.toFixed(6)),
    RI: ri,
    CR: parseFloat(CR.toFixed(6)),
    isConsistent,
    pesan: isConsistent
      ? `✅ Konsisten (CR = ${CR.toFixed(4)} < 0.1). Bobot dapat digunakan.`
      : `❌ Tidak konsisten (CR = ${CR.toFixed(4)} ≥ 0.1). Perbaiki matriks perbandingan!`,
  };
}
