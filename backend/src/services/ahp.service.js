/**
 * SERVICE: AHP (Analytical Hierarchy Process)
 *
 * Langkah:
 * 1. Validasi matriks pairwise comparison
 * 2. Hitung jumlah kolom
 * 3. Normalisasi matriks
 * 4. Hitung eigen vector/bobot prioritas dari rata-rata baris
 * 5. Hitung lambda max, CI, dan CR
 */

const RANDOM_INDEX = {
  1: 0,
  2: 0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
};

const round = (value, digits = 6) => Number(value.toFixed(digits));

const validateMatrix = (matrix) => {
  if (!Array.isArray(matrix) || matrix.length === 0) {
    throw new Error('Matriks pairwise comparison kosong');
  }

  const n = matrix.length;
  matrix.forEach((row, rowIndex) => {
    if (!Array.isArray(row) || row.length !== n) {
      throw new Error(`Matriks harus berbentuk persegi. Baris ${rowIndex + 1} tidak memiliki ${n} kolom`);
    }

    row.forEach((value, colIndex) => {
      const numericValue = Number(value);
      if (!Number.isFinite(numericValue) || numericValue <= 0) {
        throw new Error(`Nilai matriks baris ${rowIndex + 1}, kolom ${colIndex + 1} harus angka positif`);
      }
    });
  });
};

export function hitungAHP(matrix, options = {}) {
  const { threshold = 0.1, throwOnInconsistent = false } = options;
  validateMatrix(matrix);

  const n = matrix.length;
  const numericMatrix = matrix.map((row) => row.map(Number));
  const ri = RANDOM_INDEX[n];

  if (ri === undefined) {
    throw new Error(`Random Index untuk matriks ${n}x${n} belum tersedia`);
  }

  const jumlahKolom = numericMatrix.map((_, colIndex) =>
    numericMatrix.reduce((sum, row) => sum + row[colIndex], 0)
  );

  const matriksNormalisasi = numericMatrix.map((row) =>
    row.map((value, colIndex) => value / jumlahKolom[colIndex])
  );

  const bobotRaw = matriksNormalisasi.map((row) =>
    row.reduce((sum, value) => sum + value, 0) / n
  );

  const weightedSum = numericMatrix.map((row) =>
    row.reduce((sum, value, colIndex) => sum + value * bobotRaw[colIndex], 0)
  );

  const consistencyVector = weightedSum.map((value, index) => value / bobotRaw[index]);
  const lambdaMaxRaw = consistencyVector.reduce((sum, value) => sum + value, 0) / n;
  const ciRaw = n <= 2 ? 0 : (lambdaMaxRaw - n) / (n - 1);
  const crRaw = ri === 0 ? 0 : ciRaw / ri;
  const isConsistent = crRaw < threshold;

  const result = {
    ukuranMatriks: n,
    randomIndex: ri,
    threshold,
    matriksInput: numericMatrix.map((row) => row.map((value) => round(value))),
    jumlahKolom: jumlahKolom.map((value) => round(value)),
    matriksNormalisasi: matriksNormalisasi.map((row) => row.map((value) => round(value))),
    bobot: bobotRaw.map((value) => round(value)),
    weightedSum: weightedSum.map((value) => round(value)),
    consistencyVector: consistencyVector.map((value) => round(value)),
    lambdaMax: round(lambdaMaxRaw),
    CI: round(ciRaw),
    CR: round(crRaw),
    isConsistent,
    pesan: isConsistent
      ? `Matriks konsisten karena CR = ${round(crRaw)} < ${threshold}`
      : `Matriks tidak konsisten karena CR = ${round(crRaw)} >= ${threshold}`,
  };

  if (!isConsistent && throwOnInconsistent) {
    const error = new Error(result.pesan);
    error.result = result;
    throw error;
  }

  return result;
}
