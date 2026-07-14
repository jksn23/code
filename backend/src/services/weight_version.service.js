/**
 * weight_version.service.js (ESM)
 * ─────────────────────────────────────────────────────────────────────────────
 * P1 — Manajemen versi bobot AHP yang aktif.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function getActiveWeightVersion(kategoriId) {
  return prisma.bobotVersion.findFirst({
    where: {
      kategoriId: Number(kategoriId),
      aktif: true,
    },
    include: {
      bobotAhp: {
        include: { kriteria: true },
        orderBy: { kriteriaId: 'asc' },
      },
      kategori: true,
    },
  });
}

export async function activateWeightVersion(versionId, adminUserId) {
  return prisma.$transaction(async (tx) => {
    const targetVersion = await tx.bobotVersion.findUnique({
      where: { id: Number(versionId) },
      include: { kategori: true },
    });

    if (!targetVersion) {
      throw new Error(`BobotVersion ID ${versionId} tidak ditemukan`);
    }

    await tx.bobotVersion.updateMany({
      where: {
        kategoriId: targetVersion.kategoriId,
        aktif: true,
        id: { not: Number(versionId) },
      },
      data: { aktif: false },
    });

    const activated = await tx.bobotVersion.update({
      where: { id: Number(versionId) },
      data: {
        aktif: true,
        tanggalValidasi: targetVersion.tanggalValidasi || new Date(),
      },
      include: {
        bobotAhp: {
          include: { kriteria: true },
          orderBy: { kriteriaId: 'asc' },
        },
        kategori: true,
      },
    });

    return activated;
  });
}

export function createBobotSnapshot(bobotVersion) {
  if (!bobotVersion) return null;

  const snapshot = {
    versionId: bobotVersion.id,
    namaVersi: bobotVersion.namaVersi,
    kategoriId: bobotVersion.kategoriId,
    cr: parseFloat(bobotVersion.cr),
    ci: bobotVersion.ci ? parseFloat(bobotVersion.ci) : null,
    ri: bobotVersion.ri ? parseFloat(bobotVersion.ri) : null,
    lambdaMax: bobotVersion.lambdaMax ? parseFloat(bobotVersion.lambdaMax) : null,
    tanggalValidasi: bobotVersion.tanggalValidasi,
    bobotPerKriteria: {},
  };

  for (const b of bobotVersion.bobotAhp) {
    snapshot.bobotPerKriteria[b.kriteriaId] = {
      nama: b.kriteria.nama,
      tipe: b.kriteria.tipe,
      bobot: parseFloat(b.bobot),
    };
  }

  return snapshot;
}

export async function listWeightVersions(kategoriId) {
  return prisma.bobotVersion.findMany({
    where: { kategoriId: Number(kategoriId) },
    include: {
      bobotAhp: {
        include: { kriteria: { select: { id: true, nama: true, tipe: true } } },
        orderBy: { kriteriaId: 'asc' },
      },
    },
    orderBy: [{ aktif: 'desc' }, { createdAt: 'desc' }],
  });
}

export function validateCR(version) {
  const cr = parseFloat(version.cr);
  const valid = cr < 0.10;
  return {
    valid,
    cr,
    pesan: valid
      ? `CR ${(cr * 100).toFixed(2)}% < 10% — konsistensi penilaian DITERIMA`
      : `CR ${(cr * 100).toFixed(2)}% >= 10% — penilaian TIDAK KONSISTEN, perlu perbaikan matriks`,
  };
}
