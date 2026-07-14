/**
 * limit_validation.controller.js (ESM)
 * ─────────────────────────────────────────────────────────────────────────────
 * P1 — Controller untuk endpoint validasi formula nilai limit.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  addValidasi,
  getValidasiByAset,
  generateReport,
  deleteValidasi,
} from '../services/limit_validation.service.js';

export const createValidasi = async (req, res, next) => {
  try {
    const { asetId, hasilId, jenisNilaiAcuan, nilaiAcuan, sumberAcuan, tanggalAcuan, catatan } =
      req.body;

    if (!asetId || !hasilId || !jenisNilaiAcuan || !nilaiAcuan || !sumberAcuan) {
      return res.status(400).json({
        status: 'error',
        message: 'Field wajib: asetId, hasilId, jenisNilaiAcuan, nilaiAcuan, sumberAcuan',
      });
    }

    const data = await addValidasi({
      asetId,
      hasilId,
      jenisNilaiAcuan,
      nilaiAcuan: parseFloat(nilaiAcuan),
      sumberAcuan,
      tanggalAcuan: tanggalAcuan || null,
      catatan: catatan || null,
    });

    return res.status(201).json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

export const getValidasiForAset = async (req, res, next) => {
  try {
    const { asetId } = req.params;
    const data = await getValidasiByAset(Number(asetId));
    return res.json({ status: 'success', data });
  } catch (err) {
    next(err);
  }
};

export const getReport = async (req, res, next) => {
  try {
    const { jenisNilaiAcuan, dari, sampai } = req.query;
    const report = await generateReport({
      jenisNilaiAcuan: jenisNilaiAcuan || null,
      dari: dari || null,
      sampai: sampai || null,
    });
    return res.json({ status: 'success', data: report });
  } catch (err) {
    next(err);
  }
};

export const removeValidasi = async (req, res, next) => {
  try {
    const { id } = req.params;
    await deleteValidasi(Number(id));
    return res.json({ status: 'success', message: 'Data validasi dihapus' });
  } catch (err) {
    next(err);
  }
};
