import prisma from '../models/prisma.client.js';
import { createNotification } from '../utils/notification.util.js';

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

    await createNotification({
      userId: data.userId,
      judul: Boolean(isVerified) ? 'Verifikasi Penjual Disetujui' : 'Verifikasi Penjual Ditolak',
      pesan: Boolean(isVerified)
        ? 'Akun penjual Anda telah diverifikasi. Anda sekarang dapat mengajukan aset ke lelang.'
        : 'Dokumen penjual Anda belum disetujui admin. Silakan hubungi admin untuk detail revisi.',
      tipe: Boolean(isVerified) ? 'SELLER_APPROVED' : 'SELLER_REJECTED',
      referenceType: 'PENJUAL',
      referenceId: data.id,
    });

    res.json({ success: true, message: `Status penjual ${data.user.nama} berhasil diperbarui`, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
