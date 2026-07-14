import {
  buildPenilaianDetail,
  calculateAndPersistSAWForAset,
  getActorFromReq,
  listAdminPenilaian,
  saveNilaiKriteria,
  updateStatusPenilaian,
} from '../services/penilaian.service.js';

import logger from '../utils/logger.js';

const sendError = (res, error) => {
  const status = error.status || 500;
  const correlationId = `corr-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  if (error.message === 'FAULT_INJECTION_TC15') {
    logger.warn(`[SPK] FAULT_INJECTION_TC15: Transaction rollback triggered. correlationId=${correlationId}`);
    return res.status(status).json({
      success: false,
      code: 'TRANSACTION_ROLLED_BACK',
      message: 'Transaksi dibatalkan karena simulasi kegagalan (Fault Injection).',
      correlationId
    });
  }

  logger.error(`[API Error] Status ${status}: ${error.message}`, { status, errorStack: error.stack, correlationId });
  
  res.status(status).json({
    success: false,
    message: error.message,
    code: error.code || undefined,
    totalWeight: error.totalWeight || undefined,
    correlationId
  });
};

const nilaiListFromBody = (req) => req.body.nilai_list || req.body.nilaiList || [];

export const getSellerKriteria = async (req, res) => {
  try {
    const detail = await buildPenilaianDetail({
      asetId: req.params.asetId,
      actor: getActorFromReq(req),
      requireOwner: true,
    });
    res.json({ success: true, data: detail });
  } catch (error) {
    sendError(res, error);
  }
};

export const saveSellerNilaiKriteria = async (req, res) => {
  try {
    const actor = getActorFromReq(req);
    await saveNilaiKriteria({
      asetId: req.params.asetId,
      nilaiList: nilaiListFromBody(req),
      actor,
      requireOwner: true,
      requireSellerMutable: true,
      aksi: 'SELLER_SIMPAN_NILAI',
    });

    const detail = await buildPenilaianDetail({
      asetId: req.params.asetId,
      actor,
      requireOwner: true,
    });
    res.json({ success: true, message: 'Nilai kriteria berhasil disimpan', data: detail });
  } catch (error) {
    sendError(res, error);
  }
};

export const hitungSellerSAW = async (req, res) => {
  try {
    const actor = getActorFromReq(req);
    const forceRollback = req.headers['x-force-rollback'] === 'true';
    const result = await calculateAndPersistSAWForAset({
      asetId: req.params.asetId,
      actor,
      requireOwner: true,
      forceRollback,
    });
    const detail = await buildPenilaianDetail({
      asetId: req.params.asetId,
      actor,
      requireOwner: true,
    });
    res.json({
      success: true,
      message: 'Perhitungan SAW berhasil. Hasil menunggu verifikasi admin.',
      data: {
        ...detail,
        hasilSAW: result.hasilSAW,
        currentResult: result.currentResult,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

export const getSellerHasilPenilaian = async (req, res) => {
  try {
    const detail = await buildPenilaianDetail({
      asetId: req.params.asetId,
      actor: getActorFromReq(req),
      requireOwner: true,
    });
    res.json({ success: true, data: detail });
  } catch (error) {
    sendError(res, error);
  }
};

export const getAdminPenilaianList = async (req, res) => {
  try {
    const data = await listAdminPenilaian();
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

export const getAdminPenilaianDetail = async (req, res) => {
  try {
    const detail = await buildPenilaianDetail({
      asetId: req.params.asetId,
      actor: getActorFromReq(req),
      includeAudit: true,
    });
    res.json({ success: true, data: detail });
  } catch (error) {
    sendError(res, error);
  }
};

export const patchAdminStatusPenilaian = async (req, res) => {
  try {
    const { status, catatan } = req.body;
    await updateStatusPenilaian({
      asetId: req.params.asetId,
      status,
      catatan,
      actor: getActorFromReq(req),
    });
    const detail = await buildPenilaianDetail({
      asetId: req.params.asetId,
      actor: getActorFromReq(req),
      includeAudit: true,
    });
    res.json({ success: true, message: 'Status penilaian berhasil diperbarui', data: detail });
  } catch (error) {
    sendError(res, error);
  }
};
