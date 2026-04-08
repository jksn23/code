import prisma from '../models/prisma.client.js';

export const getNotifikasiSaya = async (req, res) => {
  try {
    const list = await prisma.notifikasi.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = await prisma.notifikasi.count({
      where: { userId: req.userId, isRead: false },
    });

    res.json({
      success: true,
      data: list,
      meta: { unreadCount },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markNotifikasiRead = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await prisma.notifikasi.findFirst({
      where: { id, userId: req.userId },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Notifikasi tidak ditemukan' });
    }

    const data = await prisma.notifikasi.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ success: true, message: 'Notifikasi ditandai sudah dibaca', data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllNotifikasiRead = async (req, res) => {
  try {
    const result = await prisma.notifikasi.updateMany({
      where: { userId: req.userId, isRead: false },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'Semua notifikasi ditandai sudah dibaca',
      data: { updatedCount: result.count },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
