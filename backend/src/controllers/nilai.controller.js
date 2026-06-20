import prisma from '../models/prisma.client.js';
import {
  assertCanSellerEditPenilaian,
  assertSellerOwnsAset,
  getActorFromReq,
  getPenilaianAset,
  saveNilaiKriteria,
} from '../services/penilaian.service.js';

// POST - Input/Update nilai aset per kriteria (bulk)
export const inputNilaiAset = async (req, res) => {
  try {
    const { aset_id, nilai_list } = req.body;
    if (!aset_id || !Array.isArray(nilai_list) || nilai_list.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'aset_id dan nilai_list (array) wajib diisi',
      });
    }

    const actor = getActorFromReq(req);
    const aset = await getPenilaianAset(aset_id);
    if (!aset) return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });
    if (actor.role === 'PENJUAL') {
      assertSellerOwnsAset(aset, actor.userId);
      assertCanSellerEditPenilaian(aset);
    } else if (actor.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Requires Admin atau Penjual Role' });
    } else if (req.body.override !== true) {
      return res.status(400).json({ success: false, message: 'Admin harus mengaktifkan mode override untuk mengubah nilai kriteria' });
    }

    const results = await saveNilaiKriteria({
      asetId: aset_id,
      nilaiList: nilai_list,
      actor,
      aksi: actor.role === 'ADMIN' ? 'ADMIN_OVERRIDE_NILAI' : 'SELLER_SIMPAN_NILAI_LEGACY',
    });

    res.json({ success: true, message: 'Nilai aset berhasil disimpan', data: results });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// GET - Lihat semua nilai aset
export const getNilaiByAset = async (req, res) => {
  try {
    const { aset_id } = req.params;
    const actor = getActorFromReq(req);
    const aset = await getPenilaianAset(aset_id);
    if (!aset) return res.status(404).json({ success: false, message: 'Aset tidak ditemukan' });
    if (actor.role === 'PENJUAL') {
      assertSellerOwnsAset(aset, actor.userId);
    } else if (actor.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Requires Admin atau Penjual Role' });
    }

    const data = await prisma.nilaiAset.findMany({
      where: { asetId: Number(aset_id) },
      include: { kriteria: true },
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};
