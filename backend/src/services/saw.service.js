/**
 * saw.service.js
 * ─────────────────────────────────────────────────────────────────────────────
 * JCIS Final Regression V3 — SAW dengan normalisasi RELATIF.
 *
 * Metode: RELATIVE_SAW (sesuai naskah jurnal JCIS)
 *
 * Normalisasi relatif (Hwang & Yoon, 1981):
 *   Benefit: r_ij = x_ij / max_i(x_ij)
 *   Cost:    r_ij = min_i(x_ij) / x_ij
 *
 * Nilai preferensi: V_i = Σ (w_j × r_ij)
 * Nilai limit:      NL_i = V_i × HP_i (median harga pembanding)
 *
 * PENTING:
 *   - Normalisasi RELATIVE membutuhkan SELURUH aset dalam kategori.
 *   - max/min dihitung dari kolom nilai per kriteria, bukan hardcoded.
 *   - Jika hanya satu aset, max = min = nilai aset itu sendiri → r = 1.
 *   - AI Agent DILARANG menggunakan normalisasi skala tetap 1–5 pada hasil final.
 *
 * Referensi: PANDUAN_AI_AGENT_FINAL_REGRESSION_JCIS.md §1
 * ─────────────────────────────────────────────────────────────────────────────
 */
import logger from '../utils/logger.js';

// ── Constants ─────────────────────────────────────────────────────────────────
export const METODE_NORMALISASI = 'RELATIVE_SAW';
export const VERSI_FORMULA = 'LIMIT_V3';

// ── Clamp ─────────────────────────────────────────────────────────────────────
export function clampPreference(value) {
  if (!Number.isFinite(value)) {
    throw new Error('Preference must be finite.');
  }
  return Math.min(1, Math.max(0, value));
}

// ── Normalisasi Relatif ────────────────────────────────────────────────────────

/**
 * Normalisasi nilai dengan metode relatif.
 * @param {number} nilai  — nilai mentah aset pada kriteria j
 * @param {number} maxVal — nilai maksimum kriteria j dari seluruh aset
 * @param {number} minVal — nilai minimum kriteria j dari seluruh aset
 * @param {'benefit'|'cost'} tipe
 * @returns {number} nilai ternormalisasi (0.0-1.0)
 */
export function normalisasiRelatif(nilai, maxVal, minVal, tipe) {
  const n = parseFloat(nilai);
  const mx = parseFloat(maxVal);
  const mn = parseFloat(minVal);

  if (tipe === 'benefit') {
    // Benefit: r = x / max(x)
    if (mx === 0) return 0;
    return n / mx;
  } else {
    // Cost: r = min(x) / x
    if (n === 0) return 0;
    return mn / n;
  }
}

// ── Main SAW function ──────────────────────────────────────────────────────────

/**
 * Hitung SAW untuk satu aset atau banyak aset menggunakan normalisasi relatif.
 *
 * @param {Array<object>} asetList — Array aset dengan nilaiAset[]
 * @param {Array<object>} kriteria — Array kriteria dengan bobot (dari BobotAHP)
 * @returns {object} Hasil SAW lengkap dengan snapshot untuk reproducibility
 *
 * Format kriteria item: { id, nama, tipe, bobot }
 * Format nilaiAset item: { kriteriaId, nilai } (nilai integer 1-5)
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

  // Step 1: Bangun matriks keputusan — ambil nilai setiap aset per kriteria
  // Sekaligus hitung max dan min per kriteria (untuk normalisasi relatif)
  const maxPerKriteria = {};
  const minPerKriteria = {};

  kriteria.forEach((krit) => {
    const values = asetList.map((aset) => {
      const nilaiObj = aset.nilaiAset.find((nv) => nv.kriteriaId === krit.id);
      if (!nilaiObj) {
        throw new Error(
          `Nilai aset "${aset.nama}" untuk kriteria "${krit.nama}" (ID:${krit.id}) belum diisi`
        );
      }
      return parseFloat(nilaiObj.nilai);
    });
    maxPerKriteria[krit.id] = Math.max(...values);
    minPerKriteria[krit.id] = Math.min(...values);
  });

  // Step 2: Normalisasi dan hitung preferensi per aset
  const hasilSAW = asetList.map((aset) => {
    const detailNormalisasi = kriteria.map((krit) => {
      const nilaiObj = aset.nilaiAset.find((nv) => nv.kriteriaId === krit.id);
      const nilaiAsli = parseFloat(nilaiObj.nilai);
      const maxVal = maxPerKriteria[krit.id];
      const minVal = minPerKriteria[krit.id];

      const nilaiNorm = normalisasiRelatif(nilaiAsli, maxVal, minVal, krit.tipe);
      const bobot = parseFloat(krit.bobot);
      const kontribusi = nilaiNorm * bobot;

      return {
        kriteriaId: krit.id,
        namaKriteria: krit.nama,
        tipe: krit.tipe,
        nilaiAsli,
        maxVal,
        minVal,
        nilaiNorm,
        bobot,
        kontribusi,
      };
    });

    // Step 3: V_i = Σ (w_j × r_ij)
    const rawPreference = detailNormalisasi.reduce((s, d) => s + d.kontribusi, 0);
    const safePreference = clampPreference(rawPreference);

    logger.info(`[SPK] SAW-RELATIVE aset="${aset.nama}" (ID:${aset.id}): rawPref=${rawPreference.toFixed(16)}, safePref=${safePreference}`);

    return {
      id: aset.id,
      nama: aset.nama,
      hargaPasar: parseFloat(aset.hargaPasar),
      nilaiPreferensi: safePreference,
      rawPreference,
      safePreference,
      // NL = V_i × hargaPasar (pasar = median pembanding, di-set sebelumnya)
      nilaiLimit: safePreference * parseFloat(aset.hargaPasar),
      detailNormalisasi,
      hasil: aset.hasil || [],
    };
  });

  // Step 4: Ranking (descending) dengan tie-breaker deterministik
  const confidenceOrder = { TINGGI: 4, SEDANG: 3, RENDAH: 2, TIDAK_CUKUP: 1 };
  hasilSAW.sort((a, b) => {
    if (Math.abs(b.nilaiPreferensi - a.nilaiPreferensi) > 1e-12) {
      return b.nilaiPreferensi - a.nilaiPreferensi;
    }
    // Tie-breaker 1: tingkat keyakinan referensi
    const aConfStr = a.hasil?.[0]?.tingkatKeyakinan || 'TIDAK_CUKUP';
    const bConfStr = b.hasil?.[0]?.tingkatKeyakinan || 'TIDAK_CUKUP';
    const aConf = confidenceOrder[aConfStr] || 0;
    const bConf = confidenceOrder[bConfStr] || 0;
    if (bConf !== aConf) return bConf - aConf;
    // Tie-breaker 2: nilai limit
    if (Math.abs(b.nilaiLimit - a.nilaiLimit) > 1e-2) return b.nilaiLimit - a.nilaiLimit;
    // Tie-breaker 3: ID (deterministik)
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
    maxVal: maxPerKriteria[krit.id],
    minVal: minPerKriteria[krit.id],
  }));

  return {
    metodeNormalisasi: METODE_NORMALISASI,
    versiFormula: VERSI_FORMULA,
    jumlahAset: n,
    jumlahKriteria: m,
    totalBobot: parseFloat(totalBobot.toFixed(6)),
    detailKriteria: metaKriteria,
    ranking: hasilSAW,
  };
}

/**
 * Hitung SAW untuk satu aset tunggal (digunakan saat penilaian per aset).
 * CATATAN: Normalisasi relatif membutuhkan aset lain dalam kategori yang sama
 * untuk menghitung max/min. Fungsi ini memanggil hitungSAW dengan array aset.
 *
 * @param {object} aset         — aset yang dinilai (sudah include nilaiAset)
 * @param {Array}  semuaAset   — semua aset dalam kategori (untuk menghitung max/min)
 * @param {Array}  kriteria    — kriteria dengan bobot
 * @param {number} hargaReferensi — median harga pembanding
 */
export function hitungSAWSingleAset(aset, semuaAset, kriteria, hargaReferensi) {
  // Gunakan seluruh aset dalam kategori agar max/min relatif akurat
  const asetListForCalc = semuaAset && semuaAset.length > 0 ? semuaAset : [aset];
  const result = hitungSAW(asetListForCalc, kriteria);
  const asetResult = result.ranking.find((r) => r.id === aset.id);

  if (!asetResult) {
    throw new Error(`Aset ID=${aset.id} tidak ditemukan dalam hasil SAW`);
  }

  // Override nilaiLimit dengan hargaReferensi eksplisit (median pembanding)
  const nilaiLimit = hargaReferensi
    ? parseFloat((asetResult.nilaiPreferensi * parseFloat(hargaReferensi)).toFixed(2))
    : asetResult.nilaiLimit;

  return {
    nilaiPreferensi: asetResult.nilaiPreferensi,
    nilaiLimit,
    normalisasiSnapshot: asetResult.detailNormalisasi,
    metodeNormalisasi: METODE_NORMALISASI,
    versiFormula: VERSI_FORMULA,
    detailKriteria: result.detailKriteria,
    ranking: asetResult.ranking,
  };
}
