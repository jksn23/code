import prisma from '../models/prisma.client.js';
import { hitungSAW } from './saw.service.js';

export const STATUS_PENILAIAN = ['DRAFT', 'MENUNGGU_VERIFIKASI', 'DISETUJUI', 'PERLU_REVISI', 'DITOLAK'];
export const MUTABLE_SELLER_STATUSES = ['DRAFT', 'PERLU_REVISI'];
export const ADMIN_REVIEW_STATUSES = ['DISETUJUI', 'PERLU_REVISI', 'DITOLAK'];

const toNumber = (value) => Number(value);

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const actorFromReq = (req) => ({
  userId: Number(req.userId),
  role: req.userRole,
});

const nilaiSnapshot = (nilaiAset = []) =>
  nilaiAset
    .slice()
    .sort((a, b) => a.kriteriaId - b.kriteriaId)
    .map((item) => ({
      kriteriaId: item.kriteriaId,
      kriteria: item.kriteria?.nama || null,
      nilai: toNumber(item.nilai),
    }));

const statusSnapshot = (aset) => ({
  statusPenilaian: aset.statusPenilaian,
  catatanPenilaian: aset.catatanPenilaian || null,
});

export const getActorFromReq = actorFromReq;

export const getPenilaianAset = (asetId, client = prisma) =>
  client.aset.findUnique({
    where: { id: Number(asetId) },
    include: {
      kategori: {
        include: {
          kriteria: {
            include: { bobotAhp: { orderBy: { createdAt: 'desc' }, take: 1 } },
            orderBy: { id: 'asc' },
          },
        },
      },
      penjual: { include: { user: { select: { id: true, nama: true, email: true } } } },
      nilaiAset: { include: { kriteria: true }, orderBy: { kriteriaId: 'asc' } },
      hasil: { orderBy: { createdAt: 'desc' }, take: 1 },
      assetProperty: true,
      assetVehicle: true,
      assetElectronic: true,
    },
  });

export const assertSellerOwnsAset = (aset, userId) => {
  if (!aset?.penjual) throw httpError(403, 'Aset ini tidak memiliki profil penjual');
  if (aset.penjual.userId !== Number(userId)) throw httpError(403, 'Anda tidak berhak menilai aset milik penjual lain');
};

export const assertCanSellerEditPenilaian = (aset) => {
  if (!MUTABLE_SELLER_STATUSES.includes(aset.statusPenilaian)) {
    throw httpError(
      400,
      'Nilai kriteria hanya dapat diubah saat status penilaian DRAFT atau PERLU_REVISI'
    );
  }
};

export const getKriteriaWithBobot = (kriteriaList = []) => {
  const missingBobot = kriteriaList.filter((kriteria) => !kriteria.bobotAhp?.length);
  if (missingBobot.length > 0) {
    throw httpError(
      400,
      `Bobot AHP predefined belum tersedia untuk kriteria: ${missingBobot.map((item) => item.nama).join(', ')}`
    );
  }

  return kriteriaList.map((kriteria) => ({
    id: kriteria.id,
    nama: kriteria.nama,
    tipe: kriteria.tipe,
    bobot: toNumber(kriteria.bobotAhp[0].bobot),
  }));
};

export const validateNilaiList = (nilaiList, kriteriaList) => {
  if (!Array.isArray(nilaiList) || nilaiList.length === 0) {
    throw httpError(400, 'nilai_list wajib diisi');
  }

  const kriteriaIds = kriteriaList.map((item) => item.id);
  const nilaiMap = new Map();

  nilaiList.forEach((item) => {
    const kriteriaId = Number(item.kriteria_id ?? item.kriteriaId);
    const nilai = Number(item.nilai);

    if (!kriteriaIds.includes(kriteriaId)) {
      throw httpError(400, `Kriteria ID ${kriteriaId} tidak sesuai kategori aset ini`);
    }
    if (!Number.isInteger(nilai) || nilai < 1 || nilai > 5) {
      throw httpError(400, 'Nilai kriteria harus berupa angka bulat 1 sampai 5');
    }
    nilaiMap.set(kriteriaId, nilai);
  });

  const missing = kriteriaList.filter((kriteria) => !nilaiMap.has(kriteria.id));
  if (missing.length > 0) {
    throw httpError(400, `Semua kriteria wajib diisi. Belum diisi: ${missing.map((item) => item.nama).join(', ')}`);
  }

  return kriteriaList.map((kriteria) => ({
    kriteriaId: kriteria.id,
    nilai: nilaiMap.get(kriteria.id),
  }));
};

export const logPenilaianAudit = (client, { asetId, actor, aksi, nilaiSebelum, nilaiSesudah }) =>
  client.penilaianAuditLog.create({
    data: {
      asetId: Number(asetId),
      userId: Number(actor.userId),
      role: actor.role,
      aksi,
      nilaiSebelum: nilaiSebelum ?? undefined,
      nilaiSesudah: nilaiSesudah ?? undefined,
    },
  });

export const saveNilaiKriteria = async ({ asetId, nilaiList, actor, requireOwner = false, requireSellerMutable = false, aksi = 'SIMPAN_NILAI' }) => {
  const aset = await getPenilaianAset(asetId);
  if (!aset) throw httpError(404, 'Aset tidak ditemukan');

  if (requireOwner) assertSellerOwnsAset(aset, actor.userId);
  if (requireSellerMutable) assertCanSellerEditPenilaian(aset);

  const normalizedNilai = validateNilaiList(nilaiList, aset.kategori.kriteria);
  const before = nilaiSnapshot(aset.nilaiAset);

  const saved = await prisma.$transaction(async (tx) => {
    await Promise.all(
      normalizedNilai.map((item) =>
        tx.nilaiAset.upsert({
          where: { asetId_kriteriaId: { asetId: Number(asetId), kriteriaId: item.kriteriaId } },
          update: { nilai: item.nilai },
          create: { asetId: Number(asetId), kriteriaId: item.kriteriaId, nilai: item.nilai },
        })
      )
    );

    const afterRows = await tx.nilaiAset.findMany({
      where: { asetId: Number(asetId) },
      include: { kriteria: true },
      orderBy: { kriteriaId: 'asc' },
    });

    await logPenilaianAudit(tx, {
      asetId,
      actor,
      aksi,
      nilaiSebelum: before,
      nilaiSesudah: nilaiSnapshot(afterRows),
    });

    return afterRows;
  });

  return saved;
};

const fetchCompleteAsetsForSAW = async (kategoriId, kriteriaIds) => {
  const asetList = await prisma.aset.findMany({
    where: { kategoriId: Number(kategoriId) },
    include: { nilaiAset: { include: { kriteria: true } } },
    orderBy: { id: 'asc' },
  });

  return asetList.filter((aset) =>
    kriteriaIds.every((kriteriaId) => aset.nilaiAset.some((nilai) => nilai.kriteriaId === kriteriaId))
  );
};

export const calculateAndPersistSAWForAset = async ({ asetId, actor, requireOwner = false }) => {
  const aset = await getPenilaianAset(asetId);
  if (!aset) throw httpError(404, 'Aset tidak ditemukan');

  if (requireOwner) {
    assertSellerOwnsAset(aset, actor.userId);
    assertCanSellerEditPenilaian(aset);
  }

  const kriteriaWithBobot = getKriteriaWithBobot(aset.kategori.kriteria);
  const normalizedNilai = validateNilaiList(
    aset.nilaiAset.map((item) => ({ kriteria_id: item.kriteriaId, nilai: toNumber(item.nilai) })),
    aset.kategori.kriteria
  );
  const kriteriaIds = normalizedNilai.map((item) => item.kriteriaId);
  const completeAsets = await fetchCompleteAsetsForSAW(aset.kategoriId, kriteriaIds);

  if (!completeAsets.some((item) => item.id === aset.id)) {
    throw httpError(400, 'Semua kriteria aset wajib diisi sebelum SAW dihitung');
  }

  const hasilSAW = hitungSAW(completeAsets, kriteriaWithBobot);
  const affectedIds = hasilSAW.ranking.map((item) => item.id);
  const currentResult = hasilSAW.ranking.find((item) => item.id === aset.id);

  await prisma.$transaction(async (tx) => {
    await tx.hasil.deleteMany({ where: { asetId: { in: affectedIds } } });
    await tx.hasil.createMany({
      data: hasilSAW.ranking.map((item) => ({
        asetId: item.id,
        nilaiPreferensi: item.nilaiPreferensi,
        nilaiLimit: item.nilaiLimit,
      })),
    });

    await Promise.all(
      hasilSAW.ranking.map((item) =>
        tx.aset.update({
          where: { id: item.id },
          data: { limitValue: item.nilaiLimit },
        })
      )
    );

    const updatedAset = await tx.aset.update({
      where: { id: aset.id },
      data: {
        statusPenilaian: 'MENUNGGU_VERIFIKASI',
        catatanPenilaian: null,
        penilaianSubmittedAt: new Date(),
      },
    });

    await logPenilaianAudit(tx, {
      asetId,
      actor,
      aksi: 'HITUNG_SAW',
      nilaiSebelum: statusSnapshot(aset),
      nilaiSesudah: statusSnapshot(updatedAset),
    });
  });

  return { hasilSAW, currentResult };
};

export const buildPenilaianDetail = async ({ asetId, actor, requireOwner = false, includeAudit = false }) => {
  const aset = await getPenilaianAset(asetId);
  if (!aset) throw httpError(404, 'Aset tidak ditemukan');
  if (requireOwner) assertSellerOwnsAset(aset, actor.userId);

  const kriteriaWithBobot = getKriteriaWithBobot(aset.kategori.kriteria);
  const nilaiByKriteria = new Map(aset.nilaiAset.map((item) => [item.kriteriaId, item]));
  let currentResult = null;

  try {
    const kriteriaIds = aset.kategori.kriteria.map((item) => item.id);
    const completeAsets = await fetchCompleteAsetsForSAW(aset.kategoriId, kriteriaIds);
    if (completeAsets.some((item) => item.id === aset.id)) {
      const hasilSAW = hitungSAW(completeAsets, kriteriaWithBobot);
      currentResult = hasilSAW.ranking.find((item) => item.id === aset.id) || null;
    }
  } catch {
    currentResult = null;
  }

  const auditLog = includeAudit
    ? await prisma.penilaianAuditLog.findMany({
        where: { asetId: aset.id },
        orderBy: { waktu: 'desc' },
        take: 20,
      })
    : [];

  return {
    aset: {
      id: aset.id,
      nama: aset.nama,
      deskripsi: aset.deskripsi,
      hargaPasar: toNumber(aset.hargaPasar),
      limitValue: aset.limitValue == null ? null : toNumber(aset.limitValue),
      statusLelang: aset.statusLelang,
      statusPenilaian: aset.statusPenilaian,
      catatanPenilaian: aset.catatanPenilaian,
      penilaianSubmittedAt: aset.penilaianSubmittedAt,
      penilaianReviewedAt: aset.penilaianReviewedAt,
      penjual: aset.penjual,
      kategori: { id: aset.kategori.id, nama: aset.kategori.nama },
      assetProperty: aset.assetProperty,
      assetVehicle: aset.assetVehicle,
      assetElectronic: aset.assetElectronic,
    },
    kriteria: aset.kategori.kriteria.map((kriteria) => {
      const nilai = nilaiByKriteria.get(kriteria.id);
      return {
        id: kriteria.id,
        nama: kriteria.nama,
        tipe: kriteria.tipe,
        bobot: kriteria.bobotAhp?.[0] ? toNumber(kriteria.bobotAhp[0].bobot) : null,
        nilai: nilai ? toNumber(nilai.nilai) : null,
      };
    }),
    hasil: aset.hasil[0]
      ? {
          id: aset.hasil[0].id,
          nilaiPreferensi: toNumber(aset.hasil[0].nilaiPreferensi),
          nilaiLimit: toNumber(aset.hasil[0].nilaiLimit),
          createdAt: aset.hasil[0].createdAt,
        }
      : null,
    detailNormalisasi: currentResult?.detailNormalisasi || null,
    currentResult,
    auditLog,
  };
};

export const updateStatusPenilaian = async ({ asetId, status, catatan, actor }) => {
  if (!ADMIN_REVIEW_STATUSES.includes(status)) {
    throw httpError(400, 'Status penilaian admin harus DISETUJUI, PERLU_REVISI, atau DITOLAK');
  }

  const aset = await getPenilaianAset(asetId);
  if (!aset) throw httpError(404, 'Aset tidak ditemukan');
  if (!aset.hasil?.length) throw httpError(400, 'Aset belum memiliki hasil penilaian SAW');

  const before = statusSnapshot(aset);
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.aset.update({
      where: { id: Number(asetId) },
      data: {
        statusPenilaian: status,
        catatanPenilaian: catatan?.trim() || null,
        penilaianReviewedAt: new Date(),
        penilaianReviewedBy: actor.userId,
      },
    });

    await logPenilaianAudit(tx, {
      asetId,
      actor,
      aksi: `ADMIN_${status}`,
      nilaiSebelum: before,
      nilaiSesudah: statusSnapshot(row),
    });

    return row;
  });

  return updated;
};

export const listAdminPenilaian = async () => {
  const data = await prisma.aset.findMany({
    where: {
      OR: [
        { statusPenilaian: { not: 'DRAFT' } },
        { hasil: { some: {} } },
      ],
    },
    include: {
      kategori: true,
      penjual: { include: { user: { select: { id: true, nama: true, email: true } } } },
      nilaiAset: true,
      hasil: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return data.map((item) => ({
    id: item.id,
    nama: item.nama,
    kategori: item.kategori,
    penjual: item.penjual,
    hargaPasar: toNumber(item.hargaPasar),
    statusPenilaian: item.statusPenilaian,
    statusLelang: item.statusLelang,
    catatanPenilaian: item.catatanPenilaian,
    jumlahNilai: item.nilaiAset.length,
    hasil: item.hasil[0]
      ? {
          nilaiPreferensi: toNumber(item.hasil[0].nilaiPreferensi),
          nilaiLimit: toNumber(item.hasil[0].nilaiLimit),
          createdAt: item.hasil[0].createdAt,
        }
      : null,
    updatedAt: item.updatedAt,
  }));
};
