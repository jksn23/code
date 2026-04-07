import prisma from '../models/prisma.client.js';

// GET all kategori
export const getAllKategori = async (req, res) => {
  try {
    const data = await prisma.kategori.findMany({
      include: { _count: { select: { kriteria: true, aset: true } } },
      orderBy: { id: 'asc' },
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET kategori by ID
export const getKategoriById = async (req, res) => {
  try {
    const data = await prisma.kategori.findUnique({
      where: { id: Number(req.params.id) },
      include: { kriteria: true, aset: true },
    });
    if (!data) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST - Tambah kategori
export const createKategori = async (req, res) => {
  try {
    const { nama } = req.body;
    if (!nama || nama.trim() === '') {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }
    const data = await prisma.kategori.create({ data: { nama: nama.trim() } });
    res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan', data });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Nama kategori sudah ada' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT - Update kategori
export const updateKategori = async (req, res) => {
  try {
    const { nama } = req.body;
    if (!nama || nama.trim() === '') {
      return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });
    }
    const existing = await prisma.kategori.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    const data = await prisma.kategori.update({
      where: { id: Number(req.params.id) },
      data: { nama: nama.trim() },
    });
    res.json({ success: true, message: 'Kategori berhasil diperbarui', data });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Nama kategori sudah ada' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE - Hapus kategori
export const deleteKategori = async (req, res) => {
  try {
    const existing = await prisma.kategori.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
    await prisma.kategori.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
