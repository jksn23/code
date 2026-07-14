/**
 * comparable_matching.service.js (ESM)
 * ─────────────────────────────────────────────────────────────────────────────
 * P0 — Algoritma fuzzy matching data pembanding terhadap spesifikasi aset.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const STATUS_KECOCOKAN = {
  LAYAK: 'LAYAK',
  PERLU_TINJAU: 'PERLU_TINJAU',
  TIDAK_LAYAK: 'TIDAK_LAYAK',
};

export const THRESHOLD = {
  LAYAK: 0.80,
  PERLU_TINJAU: 0.70,
};

const STOP_WORDS = new Set([
  'dan', 'atau', 'yang', 'di', 'ke', 'dari', 'pada', 'dengan', 'untuk',
  'ini', 'itu', 'adalah', 'ada', 'tidak', 'bukan', 'sudah', 'akan',
  'jual', 'beli', 'murah', 'bagus', 'dijual', 'second', 'bekas', 'baru',
  'ready', 'stok', 'original', 'ori', 'resmi',
]);

export function tokenize(str) {
  if (!str || typeof str !== 'string') return [];
  return str
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

export function jaccardSimilarity(a, b) {
  if (!a.length && !b.length) return 1.0;
  if (!a.length || !b.length) return 0.0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const t of setA) if (setB.has(t)) intersection++;
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

export function numericProximity(a, b, maxDiff = 3) {
  if (a == null || b == null) return null;
  const diff = Math.abs(a - b);
  if (diff === 0) return 1.0;
  if (diff >= maxDiff) return 0.0;
  return 1.0 - diff / maxDiff;
}

export function locationSimilarity(lokasiAset, lokasiPembanding) {
  if (!lokasiAset || !lokasiPembanding) return null;
  const a = lokasiAset.toLowerCase().trim();
  const b = lokasiPembanding.toLowerCase().trim();
  if (a === b) return 1.0;
  if (a.includes(b) || b.includes(a)) return 0.7;
  const tokA = tokenize(lokasiAset);
  const tokB = tokenize(lokasiPembanding);
  const jaccard = jaccardSimilarity(tokA, tokB);
  return jaccard > 0.3 ? jaccard : 0.0;
}

function buildAsetSpec(aset) {
  const parts = [
    aset.nama || '',
    aset.deskripsi || '',
    aset.spesifikasi || '',
    aset.assetVehicle ? `${aset.assetVehicle.brand} ${aset.assetVehicle.type} ${aset.assetVehicle.year}` : '',
    aset.assetElectronic ? `${aset.assetElectronic.brand} ${aset.assetElectronic.series} ${aset.assetElectronic.type}` : '',
    aset.assetProperty ? `${aset.assetProperty.village} ${aset.assetProperty.city} ${aset.assetProperty.province}` : '',
  ];
  return parts.filter(Boolean).join(' ');
}

function buildPembandingSpec(pembanding) {
  return [
    pembanding.judul || '',
    pembanding.spesifikasi || '',
    pembanding.kondisi || '',
  ]
    .filter(Boolean)
    .join(' ');
}

export function checkHardGates(aset, pembanding) {
  const failures = [];

  if (
    pembanding.statusIntegritasUrl &&
    pembanding.statusIntegritasUrl !== 'DETAIL_IKLAN' &&
    pembanding.statusIntegritasUrl !== 'BELUM_DIVERIFIKASI'
  ) {
    failures.push(`URL bukan halaman detail iklan (${pembanding.statusIntegritasUrl})`);
  }

  const harga = parseFloat(pembanding.harga);
  if (!harga || harga <= 0) {
    failures.push('Harga pembanding harus positif');
  }

  if (aset.assetVehicle && pembanding.tahun) {
    const selisihTahun = Math.abs(aset.assetVehicle.year - pembanding.tahun);
    if (selisihTahun > 5) {
      failures.push(`Selisih tahun terlalu besar (${selisihTahun} tahun > batas 5 tahun)`);
    }
  }

  return failures;
}

export function calculateSimilarity(aset, pembanding) {
  const gateFailures = checkHardGates(aset, pembanding);
  if (gateFailures.length > 0) {
    return {
      similarity: 0.0,
      statusKecocokan: STATUS_KECOCOKAN.TIDAK_LAYAK,
      alasanKecocokan: { hardGateFailed: true, failures: gateFailures, dimensiSkor: {} },
      hardGateFailed: true,
    };
  }

  const dimensiSkor = {};

  const specAset = tokenize(buildAsetSpec(aset));
  const specPembanding = tokenize(buildPembandingSpec(pembanding));
  const specSimilarity = jaccardSimilarity(specAset, specPembanding);
  dimensiSkor.spesifikasi = { skor: parseFloat(specSimilarity.toFixed(4)), bobot: 0.50 };

  const tahunAset = aset.assetVehicle?.year || null;
  const tahunPembanding = pembanding.tahun || null;
  const tahunProx = numericProximity(tahunAset, tahunPembanding, 5);
  dimensiSkor.tahun = {
    skor: tahunProx != null ? parseFloat(tahunProx.toFixed(4)) : null,
    bobot: tahunAset ? 0.25 : 0.0,
    keterangan: tahunProx == null ? 'Data tahun tidak tersedia' : undefined,
  };

  const lokasiAset = aset.assetProperty
    ? `${aset.assetProperty.village} ${aset.assetProperty.city}`
    : null;
  const lokasiSim = locationSimilarity(lokasiAset, pembanding.lokasi);
  dimensiSkor.lokasi = {
    skor: lokasiSim != null ? parseFloat(lokasiSim.toFixed(4)) : null,
    bobot: lokasiAset ? 0.15 : 0.0,
    keterangan: lokasiSim == null ? 'Data lokasi tidak tersedia' : undefined,
  };

  const kondisiSkor = (() => {
    const kondisiPembanding = (pembanding.kondisi || '').toLowerCase();
    if (!kondisiPembanding) return null;
    if (/baru|new/.test(kondisiPembanding)) return 1.0;
    if (/bekas|second|used|eks/.test(kondisiPembanding)) return 0.6;
    return 0.5;
  })();
  dimensiSkor.kondisi = {
    skor: kondisiSkor,
    bobot: 0.10,
    keterangan: kondisiSkor == null ? 'Data kondisi tidak tersedia' : undefined,
  };

  let totalBobot = 0;
  let totalSkor = 0;
  for (const dim of Object.values(dimensiSkor)) {
    if (dim.skor != null && dim.bobot > 0) {
      totalBobot += dim.bobot;
      totalSkor += dim.skor * dim.bobot;
    }
  }

  const similarity = totalBobot > 0 ? totalSkor / totalBobot : 0;

  let statusKecocokan;
  if (similarity >= THRESHOLD.LAYAK) statusKecocokan = STATUS_KECOCOKAN.LAYAK;
  else if (similarity >= THRESHOLD.PERLU_TINJAU) statusKecocokan = STATUS_KECOCOKAN.PERLU_TINJAU;
  else statusKecocokan = STATUS_KECOCOKAN.TIDAK_LAYAK;

  return {
    similarity: parseFloat(similarity.toFixed(4)),
    statusKecocokan,
    alasanKecocokan: {
      hardGateFailed: false,
      dimensiSkor,
      totalBobot: parseFloat(totalBobot.toFixed(4)),
      similarityWeighted: parseFloat(similarity.toFixed(4)),
    },
    hardGateFailed: false,
  };
}

export function matchPembanding(aset, pembanding) {
  const result = calculateSimilarity(aset, pembanding);
  return {
    similarity: result.similarity,
    statusKecocokan: result.statusKecocokan,
    alasanKecocokan: result.alasanKecocokan,
  };
}

export function matchPembandingBatch(aset, pembandingList) {
  return pembandingList.map((p) => ({
    id: p.id,
    ...matchPembanding(aset, p),
  }));
}
