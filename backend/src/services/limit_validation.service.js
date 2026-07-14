/**
 * limit_validation.service.js (ESM)
 * ─────────────────────────────────────────────────────────────────────────────
 * P1 — Validasi akurasi formula nilai limit terhadap nilai acuan.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ── Kalkulasi metrik ──────────────────────────────────────────────────────────

export function calculateMAE(predicted, actual) {
  if (predicted.length !== actual.length || !predicted.length) return 0;
  const sum = predicted.reduce((s, p, i) => s + Math.abs(p - actual[i]), 0);
  return sum / predicted.length;
}

export function calculateMAPE(predicted, actual) {
  if (predicted.length !== actual.length || !predicted.length) return 0;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < predicted.length; i++) {
    if (actual[i] !== 0) {
      sum += Math.abs((predicted[i] - actual[i]) / actual[i]);
      count++;
    }
  }
  return count > 0 ? (sum / count) * 100 : 0;
}

export function calculateRMSE(predicted, actual) {
  if (predicted.length !== actual.length || !predicted.length) return 0;
  const sum = predicted.reduce((s, p, i) => s + Math.pow(p - actual[i], 2), 0);
  return Math.sqrt(sum / predicted.length);
}

export function calculateBias(predicted, actual) {
  if (predicted.length !== actual.length || !predicted.length) return 0;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < predicted.length; i++) {
    if (actual[i] !== 0) {
      sum += (predicted[i] - actual[i]) / actual[i];
      count++;
    }
  }
  return count > 0 ? (sum / count) * 100 : 0;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function addValidasi(data) {
  const { asetId, hasilId, jenisNilaiAcuan, nilaiAcuan, sumberAcuan, tanggalAcuan, catatan } = data;

  const hasil = await prisma.hasil.findUnique({
    where: { id: Number(hasilId) },
    select: { nilaiLimit: true, asetId: true },
  });

  if (!hasil) throw new Error(`Hasil ID ${hasilId} tidak ditemukan`);
  if (hasil.asetId !== Number(asetId)) {
    throw new Error('Hasil tidak milik aset yang ditentukan');
  }

  const nilaiLimit = parseFloat(hasil.nilaiLimit);
  const acuan = parseFloat(nilaiAcuan);
  const absoluteError = Math.abs(nilaiLimit - acuan);
  const percentageError = acuan !== 0 ? ((nilaiLimit - acuan) / acuan) * 100 : null;

  return prisma.validasiNilaiLimit.create({
    data: {
      asetId: Number(asetId),
      hasilId: Number(hasilId),
      jenisNilaiAcuan,
      nilaiAcuan: acuan,
      sumberAcuan,
      tanggalAcuan: tanggalAcuan ? new Date(tanggalAcuan) : null,
      absoluteError,
      percentageError,
      catatan: catatan || null,
    },
  });
}

export async function getValidasiByAset(asetId) {
  return prisma.validasiNilaiLimit.findMany({
    where: { asetId: Number(asetId) },
    include: {
      hasil: {
        select: {
          nilaiLimit: true,
          metodeNormalisasi: true,
          versiFormula: true,
          calculatedAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function generateReport(filter = {}) {
  const where = {};
  if (filter.jenisNilaiAcuan) where.jenisNilaiAcuan = filter.jenisNilaiAcuan;
  if (filter.dari || filter.sampai) {
    where.createdAt = {};
    if (filter.dari) where.createdAt.gte = new Date(filter.dari);
    if (filter.sampai) where.createdAt.lte = new Date(filter.sampai);
  }

  const records = await prisma.validasiNilaiLimit.findMany({
    where,
    include: {
      hasil: {
        select: { nilaiLimit: true, versiFormula: true, metodeNormalisasi: true },
      },
      aset: { select: { nama: true, kategoriId: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!records.length) {
    return {
      jumlahSampel: 0,
      mae: null,
      mape: null,
      rmse: null,
      bias: null,
      interpretasi: 'Belum ada data validasi',
      records: [],
    };
  }

  const predicted = records.map((r) => parseFloat(r.hasil.nilaiLimit));
  const actual = records.map((r) => parseFloat(r.nilaiAcuan));

  const mae = calculateMAE(predicted, actual);
  const mape = calculateMAPE(predicted, actual);
  const rmse = calculateRMSE(predicted, actual);
  const bias = calculateBias(predicted, actual);

  let interpretasi;
  if (mape < 10) interpretasi = 'Sangat Akurat';
  else if (mape < 20) interpretasi = 'Akurat';
  else if (mape < 50) interpretasi = 'Cukup Akurat';
  else interpretasi = 'Tidak Akurat — perlu review formula';

  return {
    jumlahSampel: records.length,
    mae: parseFloat(mae.toFixed(2)),
    mape: parseFloat(mape.toFixed(4)),
    rmse: parseFloat(rmse.toFixed(2)),
    bias: parseFloat(bias.toFixed(4)),
    interpretasi,
    filter,
    records: records.map((r) => ({
      id: r.id,
      asetId: r.asetId,
      namaAset: r.aset.nama,
      hasilId: r.hasilId,
      nilaiLimit: parseFloat(r.hasil.nilaiLimit),
      nilaiAcuan: parseFloat(r.nilaiAcuan),
      absoluteError: parseFloat(r.absoluteError),
      percentageError: parseFloat(r.percentageError),
      jenisNilaiAcuan: r.jenisNilaiAcuan,
      sumberAcuan: r.sumberAcuan,
      versiFormula: r.hasil.versiFormula,
      createdAt: r.createdAt,
    })),
  };
}

export async function deleteValidasi(id) {
  return prisma.validasiNilaiLimit.delete({
    where: { id: Number(id) },
  });
}
