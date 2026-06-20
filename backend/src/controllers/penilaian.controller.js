import {
  buildPenilaianDetail,
  calculateAndPersistSAWForAset,
  getActorFromReq,
  listAdminPenilaian,
  saveNilaiKriteria,
  updateStatusPenilaian,
} from '../services/penilaian.service.js';

const sendError = (res, error) => {
  res.status(error.status || 500).json({ success: false, message: error.message });
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
    const result = await calculateAndPersistSAWForAset({
      asetId: req.params.asetId,
      actor,
      requireOwner: true,
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
