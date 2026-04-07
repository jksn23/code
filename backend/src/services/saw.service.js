/**
 * SERVICE: SAW (Simple Additive Weighting)
 * 
 * Langkah:
 * 1. Ambil nilai aset per kriteria
 * 2. Tentukan max/min tiap kriteria
 * 3. Normalisasi:
 *    - Benefit: Rij = Xij / max(Xj)
 *    - Cost:    Rij = min(Xj) / Xij
 * 4. Nilai Preferensi: Vi = Σ (Wj * Rij)
 * 5. Nilai Limit = Vi × Harga Pasar
 */

/**
 * Hitung SAW dari data aset dengan bobot kriteria
 * @param {Array} asetList - Array aset dengan nilai kriteria
 * @param {Array} kriteria - Array kriteria dengan bobot dari AHP
 * @returns {object} Hasil perankingan SAW lengkap
 */
export function hitungSAW(asetList, kriteria) {
  if (!asetList || asetList.length === 0) throw new Error('Data aset kosong');
  if (!kriteria || kriteria.length === 0) throw new Error('Data kriteria & bobot kosong');

  const n = asetList.length;   // jumlah aset
  const m = kriteria.length;   // jumlah kriteria

  // Step 1: Bangun matriks keputusan (Decision Matrix)
  // matriksKeputusan[i][j] = nilai aset ke-i pada kriteria ke-j
  const matriksKeputusan = asetList.map((aset) =>
    kriteria.map((krit) => {
      const nilaiObj = aset.nilaiAset.find((nv) => nv.kriteriaId === krit.id);
      if (!nilaiObj) throw new Error(`Nilai aset "${aset.nama}" untuk kriteria "${krit.nama}" belum diisi`);
      return parseFloat(nilaiObj.nilai);
    })
  );

  // Step 2: Hitung max/min tiap kriteria
  const maxPerKriteria = kriteria.map((_, j) => Math.max(...matriksKeputusan.map((row) => row[j])));
  const minPerKriteria = kriteria.map((_, j) => Math.min(...matriksKeputusan.map((row) => row[j])));

  // Step 3: Normalisasi matriks
  const matriksNorm = matriksKeputusan.map((row) =>
    row.map((val, j) => {
      const tipe = kriteria[j].tipe;
      if (tipe === 'benefit') {
        return maxPerKriteria[j] === 0 ? 0 : val / maxPerKriteria[j];
      } else {
        // cost
        return val === 0 ? 0 : minPerKriteria[j] / val;
      }
    })
  );

  // Step 4: Nilai Preferensi Vi = Σ (Wj * Rij)
  const nilaiPreferensi = matriksNorm.map((row) =>
    row.reduce((sum, rij, j) => sum + rij * parseFloat(kriteria[j].bobot), 0)
  );

  // Step 5: Nilai Limit = Vi × Harga Pasar
  const hasilSAW = asetList.map((aset, i) => ({
    id: aset.id,
    nama: aset.nama,
    hargaPasar: parseFloat(aset.hargaPasar),
    nilaiPreferensi: parseFloat(nilaiPreferensi[i].toFixed(6)),
    nilaiLimit: parseFloat((nilaiPreferensi[i] * parseFloat(aset.hargaPasar)).toFixed(2)),
    detailNormalisasi: kriteria.map((krit, j) => ({
      kriteriaId: krit.id,
      namaKriteria: krit.nama,
      tipe: krit.tipe,
      nilaiAsli: matriksKeputusan[i][j],
      nilaiNorm: parseFloat(matriksNorm[i][j].toFixed(6)),
      bobot: parseFloat(krit.bobot),
      kontribusi: parseFloat((matriksNorm[i][j] * parseFloat(krit.bobot)).toFixed(6)),
    })),
  }));

  // Ranking berdasarkan nilai preferensi (descending)
  hasilSAW.sort((a, b) => b.nilaiPreferensi - a.nilaiPreferensi);
  hasilSAW.forEach((item, index) => { item.ranking = index + 1; });

  return {
    jumlahAset: n,
    jumlahKriteria: m,
    detailKriteria: kriteria.map((krit, j) => ({
      id: krit.id,
      nama: krit.nama,
      tipe: krit.tipe,
      bobot: parseFloat(krit.bobot),
      max: maxPerKriteria[j],
      min: minPerKriteria[j],
    })),
    ranking: hasilSAW,
  };
}
