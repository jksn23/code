import prisma from '../models/prisma.client.js';

export const getSemuaPenjual = async (req, res) => {
  try {
    const list = await prisma.penjual.findMany({
      include: {
        user: { select: { nama: true, email: true, createdAt: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPenjualById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.penjual.findUnique({
      where: { id: Number(id) },
      include: {
        user: { select: { id: true, nama: true, email: true, createdAt: true } },
        aset: { select: { id: true, nama: true, statusLelang: true, createdAt: true } }
      }
    });
    if (!data) return res.status(404).json({ success: false, message: 'Penjual tidak ditemukan' });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifikasiPenjual = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Asumsi req body mengirim { isVerified: true/false }
    const { isVerified } = req.body;

    const data = await prisma.penjual.update({
      where: { id: Number(id) },
      data: { isVerified: Boolean(isVerified) },
      include: { user: { select: { nama: true, email: true } } }
    });

    res.json({ success: true, message: `Status penjual ${data.user.nama} berhasil diperbarui`, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
