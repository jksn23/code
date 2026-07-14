/**
 * ahp.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * P1 — Analytical Hierarchy Process (AHP) dengan validasi ketat reciprocal.
 *
 * Langkah:
 *  1. Validasi matriks: persegi, positif, diagonal = 1, reciprocal a[i][j] = 1/a[j][i]
 *  2. Hitung jumlah kolom
 *  3. Normalisasi matriks
 *  4. Hitung eigen vector (bobot prioritas) dari rata-rata baris
 *  5. Hitung lambda_max, CI, dan CR
 *
 * P1 Tambahan:
 *  - Validasi syarat reciprocal: a[i][j] × a[j][i] = 1 (±toleransi 0.001)
 *  - Validasi diagonal harus tepat = 1.0 (bukan ≈ 1.0)
 *  - Error message yang menjelaskan secara eksplisit elemen mana yang bermasalah
 *  - Fungsi buildReciprocal: auto-build matriks simetris dari segitiga atas
 * ─────────────────────────────────────────────────────────────────────────────
 */


// ── Constants ─────────────────────────────────────────────────────────────────

// Saaty (1980) Random Consistency Index
export const RANDOM_INDEX = {
  1: 0, 2: 0, 3: 0.58, 4: 0.9, 5: 1.12,
  6: 1.24, 7: 1.32, 8: 1.41, 9: 1.45, 10: 1.49,
};

export const CR_THRESHOLD_DEFAULT = 0.10;

// Toleransi untuk cek reciprocal: a[i][j] × a[j][i] harus ≈ 1 ± toleransi
const RECIPROCAL_TOLERANCE = 0.001;

// ── Helpers ───────────────────────────────────────────────────────────────────

const round = (value, digits = 6) => Number(Number(value).toFixed(digits));

// ── Validasi ──────────────────────────────────────────────────────────────────

/**
 * Validasi matriks pairwise comparison AHP.
 * Cek:
 *   1. Array tidak kosong
 *   2. Berbentuk persegi n×n
 *   3. Semua elemen positif dan finite
 *   4. Diagonal = 1.0 (tepat)
 *   5. Syarat reciprocal: a[i][j] × a[j][i] = 1 ± toleransi
 *
 * @param {number[][]} matrix
 * @param {object} options
 * @param {boolean} options.checkReciprocal — default true
 * @param {number} options.tolerance — toleransi reciprocal, default 0.001
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMatrix(matrix, options = {}) {
  const { checkReciprocal = true, tolerance = RECIPROCAL_TOLERANCE } = options;
  const errors = [];

  if (!Array.isArray(matrix) || matrix.length === 0) {
    return { valid: false, errors: ['Matriks pairwise comparison kosong atau bukan array'] };
  }

  const n = matrix.length;

  for (let i = 0; i < n; i++) {
    if (!Array.isArray(matrix[i]) || matrix[i].length !== n) {
      errors.push(`Matriks harus berbentuk persegi ${n}×${n}. Baris ${i + 1} memiliki ${matrix[i]?.length ?? 0} kolom`);
      continue;
    }

    for (let j = 0; j < n; j++) {
      const val = Number(matrix[i][j]);

      if (!Number.isFinite(val) || val <= 0) {
        errors.push(`Elemen [${i + 1}][${j + 1}] = ${matrix[i][j]} harus angka positif`);
        continue;
      }

      // Validasi diagonal = 1
      if (i === j && Math.abs(val - 1.0) > 1e-9) {
        errors.push(`Elemen diagonal [${i + 1}][${j + 1}] harus = 1, ditemukan ${val}`);
      }
    }
  }

  // Hentikan jika ada error struktur dasar
  if (errors.length > 0) return { valid: false, errors };

  // Validasi reciprocal: a[i][j] × a[j][i] ≈ 1
  if (checkReciprocal) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const aij = Number(matrix[i][j]);
        const aji = Number(matrix[j][i]);
        const product = aij * aji;

        if (Math.abs(product - 1.0) > tolerance) {
          errors.push(
            `Syarat reciprocal gagal pada [${i + 1}][${j + 1}]: ` +
            `a[${i + 1}][${j + 1}]=${round(aij, 4)} × a[${j + 1}][${i + 1}]=${round(aji, 4)} = ${round(product, 6)} ≠ 1 ` +
            `(toleransi ±${tolerance}). Seharusnya a[${j + 1}][${i + 1}] = ${round(1 / aij, 6)}`
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── Builder ───────────────────────────────────────────────────────────────────

/**
 * Auto-build matriks reciprocal dari segitiga atas.
 * Berguna untuk memastikan konsistensi saat input dari UI (hanya segitiga atas).
 *
 * @param {number[][]} upperTriangle — matriks n×n; hanya elemen [i][j] untuk i < j yang digunakan
 * @returns {number[][]} matriks n×n yang reciprocal
 */
export function buildReciprocalMatrix(upperTriangle) {
  const n = upperTriangle.length;
  const matrix = Array.from({ length: n }, () => Array(n).fill(1));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const val = Number(upperTriangle[i][j]);
      if (!val || val <= 0) {
        throw new Error(`Nilai segitiga atas [${i + 1}][${j + 1}] harus positif`);
      }
      matrix[i][j] = val;
      matrix[j][i] = round(1 / val, 9);
    }
  }

  return matrix;
}

// ── AHP Calculation ───────────────────────────────────────────────────────────

/**
 * Hitung AHP dari matriks pairwise comparison.
 *
 * @param {number[][]} matrix — matriks n×n
 * @param {object} options
 * @param {number} options.threshold — batas CR (default 0.10)
 * @param {boolean} options.throwOnInconsistent — lempar error jika CR > threshold
 * @param {boolean} options.throwOnInvalidReciprocal — lempar error jika reciprocal gagal
 * @returns {object} Hasil AHP lengkap
 */
export function hitungAHP(matrix, options = {}) {
  const {
    threshold = CR_THRESHOLD_DEFAULT,
    throwOnInconsistent = false,
    throwOnInvalidReciprocal = true,
  } = options;

  // Validasi matriks
  const { valid, errors } = validateMatrix(matrix, {
    checkReciprocal: true,
    tolerance: RECIPROCAL_TOLERANCE,
  });

  if (!valid) {
    if (throwOnInvalidReciprocal) {
      const error = new Error(
        `Matriks AHP tidak valid:\n${errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}`
      );
      error.validationErrors = errors;
      throw error;
    }
    // Mode lenient: lanjut tapi tandai
  }

  const n = matrix.length;
  const numericMatrix = matrix.map((row) => row.map(Number));
  const ri = RANDOM_INDEX[n] ?? null;

  if (ri === null) {
    throw new Error(`Random Index untuk matriks ${n}×${n} belum tersedia (maks: 10×10)`);
  }

  // Step 2: Jumlah tiap kolom
  const jumlahKolom = numericMatrix[0].map((_, colIndex) =>
    numericMatrix.reduce((sum, row) => sum + row[colIndex], 0)
  );

  // Step 3: Normalisasi
  const matriksNormalisasi = numericMatrix.map((row) =>
    row.map((value, colIndex) => value / jumlahKolom[colIndex])
  );

  // Step 4: Bobot (eigen vector ≈ rata-rata baris)
  const bobotRaw = matriksNormalisasi.map((row) =>
    row.reduce((sum, value) => sum + value, 0) / n
  );

  // Step 5: Konsistensi
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
    validasiReciprocal: {
      valid,
      errors: errors.length ? errors : null,
    },
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
      ? `Matriks konsisten — CR = ${round(crRaw, 4)} < ${threshold} ✓`
      : `Matriks TIDAK KONSISTEN — CR = ${round(crRaw, 4)} ≥ ${threshold}. Perlu revisi penilaian pakar.`,
  };

  if (!isConsistent && throwOnInconsistent) {
    const error = new Error(result.pesan);
    error.result = result;
    throw error;
  }

  return result;
}


