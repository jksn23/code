import prisma from '../models/prisma.client.js';

// GET semua kriteria (bisa filter by kategori_id)
export const getAllKriteria = async (req, res) => {
  try {
    const { kategori_id } = req.query;
    const where = kategori_id ? { kategoriId: Number(kategori_id) } : {};
    const data = await prisma.kriteria.findMany({
      where,
      include: { kategori: { select: { id: true, nama: true } } },
      orderBy: { id: 'asc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET kriteria by ID
export const getKriteriaById = async (req, res) => {
  try {
    const data = await prisma.kriteria.findUnique({
      where: { id: Number(req.params.id) },
      include: { kategori: true },
    });
    if (!data) return res.status(404).json({ success: false, message: 'Kriteria tidak ditemukan' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST - Tambah kriteria
export const createKriteria = async (req, res) => {
  try {
    const { kategori_id, nama, tipe } = req.body;
    if (!kategori_id || !nama || !tipe) {
      return res.status(400).json({ success: false, message: 'kategori_id, nama, dan tipe wajib diisi' });
    }
    if (!['benefit', 'cost'].includes(tipe)) {
      return res.status(400).json({ success: false, message: 'Tipe harus "benefit" atau "cost"' });
    }
    // Cek kategori ada
    const kategori = await prisma.kategori.findUnique({ where: { id: Number(kategori_id) } });
    if (!kategori) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });

    const data = await prisma.kriteria.create({
      data: { kategoriId: Number(kategori_id), nama: nama.trim(), tipe },
      include: { kategori: { select: { id: true, nama: true } } },
    });
    res.status(201).json({ success: true, message: 'Kriteria berhasil ditambahkan', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT - Update kriteria
export const updateKriteria = async (req, res) => {
  try {
    const { kategori_id, nama, tipe } = req.body;
    if (!['benefit', 'cost'].includes(tipe)) {
      return res.status(400).json({ success: false, message: 'Tipe harus "benefit" atau "cost"' });
    }
    const existing = await prisma.kriteria.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Kriteria tidak ditemukan' });

    const data = await prisma.kriteria.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(kategori_id && { kategoriId: Number(kategori_id) }),
        ...(nama && { nama: nama.trim() }),
        ...(tipe && { tipe }),
      },
      include: { kategori: { select: { id: true, nama: true } } },
    });
    res.json({ success: true, message: 'Kriteria berhasil diperbarui', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE - Hapus kriteria
export const deleteKriteria = async (req, res) => {
  try {
    const existing = await prisma.kriteria.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Kriteria tidak ditemukan' });
    await prisma.kriteria.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Kriteria berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
