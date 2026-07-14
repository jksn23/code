/**
 * saw.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * P1 — Simple Additive Weighting (SAW) dengan normalisasi SKALA TETAP 1-5.
 *
 * PENTING (P1): Normalisasi menggunakan skala tetap 1-5 (bukan max/min dinamis).
 * Alasan: Normalisasi dinamis mengubah nilai relatif antar aset setiap kali
 * ada penambahan data, sehingga hasil tidak reproducible dan tidak valid untuk
 * perbandingan lintas waktu / lintas aset.
 *
 * Skala tetap 1-5:
 *   - Benefit: Rij = Xij / 5   (nilai 5 = maksimum ideal, 1 = minimum)
 *   - Cost:    Rij = (6 - Xij) / 5   (nilai 1 = terburuk, 5 = terbaik)
 *
 * Input nilai aset HARUS dalam skala integer 1-5 (sudah divalidasi sebelumnya).
 *
 * Metode: FIXED_SCALE_1_5
 * Formula: Vi = Σ (Wj × Rij)   → Nilai Limit = Vi × Harga Referensi Pasar
 *
 * Referensi:
 *   - PANDUAN AI AGENT P1 §4 (Normalisasi SAW Skala Tetap)
 *   - Fishburn (1967) — original SAW formulation
 * ─────────────────────────────────────────────────────────────────────────────
 */
import logger from '../utils/logger.js';

// ── Constants ─────────────────────────────────────────────────────────────────
export const METODE_NORMALISASI = 'FIXED_SCALE_1_5';
export const SKALA_MIN = 1;
export const SKALA_MAX = 5;
export const VERSI_FORMULA = 'LIMIT_V2';

export function clampPreference(value) {
  if (!Number.isFinite(value)) {
    throw new Error('Preference must be finite.');
  }
  return Math.min(1, Math.max(0, value));
}

// ── Normalisasi ────────────────────────────────────────────────────────────────

/**
 * Normalisasi nilai pada skala tetap 1-5.
 * @param {number} nilai — nilai integer 1-5
 * @param {'benefit'|'cost'} tipe
 * @returns {number} nilai ternormalisasi 0.0-1.0
 */
export function normalisasiSkalaTetap(nilai, tipe) {
  const n = parseFloat(nilai);

  // Guard: clamp ke rentang 1-5
  const clamped = Math.max(SKALA_MIN, Math.min(SKALA_MAX, n));

  if (tipe === 'benefit') {
    // Benefit: 5 = terbaik (1.0), 1 = terburuk (0.2)
    return clamped / SKALA_MAX;
  } else {
    // Cost: 1 = terbaik (1.0), 5 = terburuk (0.2)
    return (SKALA_MAX + 1 - clamped) / SKALA_MAX;
  }
}

// ── Main SAW function ──────────────────────────────────────────────────────────

/**
 * Hitung SAW untuk satu aset atau banyak aset dengan bobot kriteria.
 *
 * @param {Array<object>} asetList — Array aset dengan nilaiAset[]
 * @param {Array<object>} kriteria — Array kriteria dengan bobot (dari BobotAHP)
 * @returns {object} Hasil SAW lengkap dengan snapshot untuk reproducibility
 *
 * Format kriteria item: { id, nama, tipe, bobot }
 * Format nilaiAset item: { kriteriaId, nilai } (nilai 1-5)
 */
export function hitungSAW(asetList, kriteria) {
  if (!asetList || asetList.length === 0) throw new Error('Data aset kosong');
  if (!kriteria || kriteria.length === 0) throw new Error('Data kriteria & bobot kosong');

  const n = asetList.length;
  const m = kriteria.length;

  // Validasi: total bobot harus ≈ 1.0
  const totalBobot = kriteria.reduce((s, k) => s + parseFloat(k.bobot), 0);
  if (Math.abs(totalBobot - 1.0) > 0.01) {
    throw new Error(`Total bobot kriteria = ${totalBobot.toFixed(4)}, seharusnya ≈ 1.0`);
  }

  // Step 1: Bangun decision matrix dan normalisasi per aset
  const hasilSAW = asetList.map((aset) => {
    const detailNormalisasi = kriteria.map((krit) => {
      const nilaiObj = aset.nilaiAset.find((nv) => nv.kriteriaId === krit.id);
      if (!nilaiObj) {
        throw new Error(
          `Nilai aset "${aset.nama}" untuk kriteria "${krit.nama}" (ID:${krit.id}) belum diisi`
        );
      }

      const nilaiAsli = parseFloat(nilaiObj.nilai);

      // Validasi skala
      if (nilaiAsli < SKALA_MIN || nilaiAsli > SKALA_MAX) {
        throw new Error(
          `Nilai aset "${aset.nama}" kriteria "${krit.nama}" = ${nilaiAsli} di luar rentang ${SKALA_MIN}-${SKALA_MAX}`
        );
      }

      const nilaiNorm = normalisasiSkalaTetap(nilaiAsli, krit.tipe);
      const bobot = parseFloat(krit.bobot);
      const kontribusi = nilaiNorm * bobot;

      return {
        kriteriaId: krit.id,
        namaKriteria: krit.nama,
        tipe: krit.tipe,
        nilaiAsli,
        nilaiNorm: parseFloat(nilaiNorm.toFixed(6)),
        bobot,
        kontribusi: parseFloat(kontribusi.toFixed(6)),
      };
    });

    // Step 2: Vi = Σ (Wj × Rij)
    const rawPreference = detailNormalisasi.reduce((s, d) => s + d.kontribusi, 0);
    const safePreference = clampPreference(rawPreference);
    logger.info(`[SPK] SAW calculation for aset="${aset.nama}" (ID:${aset.id}): rawPreference=${rawPreference.toFixed(16)}, safePreference=${safePreference.toFixed(6)}`);

    return {
      id: aset.id,
      nama: aset.nama,
      hargaPasar: parseFloat(aset.hargaPasar),
      nilaiPreferensi: safePreference,
      rawPreference: rawPreference,
      safePreference: safePreference,
      nilaiLimit: safePreference * parseFloat(aset.hargaPasar),
      detailNormalisasi,
      hasil: aset.hasil || [],
    };
  });

  // Ranking berdasarkan nilai preferensi (descending) dengan tie-breaker
  const confidenceOrder = { TINGGI: 4, SEDANG: 3, RENDAH: 2, TIDAK_CUKUP: 1 };
  hasilSAW.sort((a, b) => {
    if (Math.abs(b.nilaiPreferensi - a.nilaiPreferensi) > 1e-12) {
      return b.nilaiPreferensi - a.nilaiPreferensi;
    }
    const aConfStr = a.hasil?.[0]?.tingkatKeyakinan || 'TIDAK_CUKUP';
    const bConfStr = b.hasil?.[0]?.tingkatKeyakinan || 'TIDAK_CUKUP';
    const aConf = confidenceOrder[aConfStr] || 0;
    const bConf = confidenceOrder[bConfStr] || 0;
    if (bConf !== aConf) {
      return bConf - aConf;
    }
    if (Math.abs(b.nilaiLimit - a.nilaiLimit) > 1e-2) {
      return b.nilaiLimit - a.nilaiLimit;
    }
    return a.id - b.id;
  });

  hasilSAW.forEach((item, index) => {
    item.ranking = index + 1;
    delete item.hasil;
  });

  // Metadata metode untuk audit / snapshot
  const metaKriteria = kriteria.map((krit) => ({
    id: krit.id,
    nama: krit.nama,
    tipe: krit.tipe,
    bobot: parseFloat(krit.bobot),
    skalaMin: SKALA_MIN,
    skalaMax: SKALA_MAX,
    normMin: normalisasiSkalaTetap(SKALA_MIN, krit.tipe),
    normMax: normalisasiSkalaTetap(SKALA_MAX, krit.tipe),
  }));

  return {
    metodeNormalisasi: METODE_NORMALISASI,
    versiFormula: VERSI_FORMULA,
    skalaMin: SKALA_MIN,
    skalaMax: SKALA_MAX,
    jumlahAset: n,
    jumlahKriteria: m,
    totalBobot: parseFloat(totalBobot.toFixed(6)),
    detailKriteria: metaKriteria,
    ranking: hasilSAW,
  };
}

/**
 * Hitung SAW untuk satu aset tunggal (digunakan saat penilaian per aset).
 * Mengembalikan nilai preferensi dan snapshot normalisasi untuk disimpan di Hasil.
 *
 * @param {object} aset
 * @param {Array<object>} kriteria
 * @param {number} hargaReferensi — harga referensi pasar (dari median pembanding)
 * @returns {{
 *   nilaiPreferensi: number,
 *   nilaiLimit: number,
 *   normalisasiSnapshot: object[],
 *   metodeNormalisasi: string,
 *   versiFormula: string
 * }}
 */
export function hitungSAWSingleAset(aset, kriteria, hargaReferensi) {
  const result = hitungSAW([aset], kriteria);
  const asetResult = result.ranking[0];

  // Override nilaiLimit jika hargaReferensi diberikan eksplisit
  const nilaiLimit = hargaReferensi
    ? parseFloat((asetResult.nilaiPreferensi * parseFloat(hargaReferensi)).toFixed(2))
    : asetResult.nilaiLimit;

  return {
    nilaiPreferensi: asetResult.nilaiPreferensi,
    nilaiLimit,
    normalisasiSnapshot: asetResult.detailNormalisasi,
    metodeNormalisasi: METODE_NORMALISASI,
    versiFormula: VERSI_FORMULA,
  };
}

