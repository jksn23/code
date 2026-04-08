import prisma from '../models/prisma.client.js';
import { createNotification } from '../utils/notification.util.js';

const buyerSelect = {
  id: true,
  nama: true,
  email: true,
  role: true,
  ktpUrl: true,
  buyerVerificationStatus: true,
  buyerVerificationNote: true,
  buyerVerifiedAt: true,
  createdAt: true,
  buyerVerifier: {
    select: { id: true, nama: true, email: true },
  },
};

export const getSemuaPembeli = async (req, res) => {
  try {
    const list = await prisma.user.findMany({
      where: { role: 'PEMBELI' },
      select: buyerSelect,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPembeliById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const data = await prisma.user.findFirst({
      where: { id, role: 'PEMBELI' },
      select: {
        ...buyerSelect,
        penawaran: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            lelang: {
              select: {
                id: true,
                status: true,
                waktuTutup: true,
                aset: { select: { nama: true } },
              },
            },
          },
        },
      },
    });

    if (!data) {
      return res.status(404).json({ success: false, message: 'Pembeli tidak ditemukan' });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifikasiPembeli = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const action = req.body?.action;
    const note = req.body?.note?.trim() || null;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Aksi verifikasi pembeli tidak valid' });
    }

    if (action === 'reject' && !note) {
      return res.status(400).json({ success: false, message: 'Catatan penolakan wajib diisi' });
    }

    const buyer = await prisma.user.findFirst({
      where: { id, role: 'PEMBELI' },
      select: { id: true, nama: true, ktpUrl: true },
    });

    if (!buyer) {
      return res.status(404).json({ success: false, message: 'Pembeli tidak ditemukan' });
    }

    if (!buyer.ktpUrl) {
      return res.status(400).json({ success: false, message: 'Pembeli belum mengunggah KTP' });
    }

    const data = await prisma.user.update({
      where: { id },
      data: {
        buyerVerificationStatus: action === 'approve' ? 'APPROVED' : 'REJECTED',
        buyerVerificationNote: action === 'approve'
          ? (note || 'KYC pembeli telah diverifikasi dan disetujui admin.')
          : note,
        buyerVerifiedAt: new Date(),
        buyerVerifiedBy: req.userId,
      },
      select: buyerSelect,
    });

    await createNotification({
      userId: id,
      judul: action === 'approve' ? 'KYC Pembeli Disetujui' : 'KYC Pembeli Ditolak',
      pesan: action === 'approve'
        ? 'Akun Anda sudah terverifikasi dan dapat mengikuti bidding.'
        : `Verifikasi identitas ditolak. ${note}`,
      tipe: action === 'approve' ? 'BUYER_KYC_APPROVED' : 'BUYER_KYC_REJECTED',
      referenceType: 'BUYER',
      referenceId: id,
    });

    res.json({
      success: true,
      message: action === 'approve'
        ? `KYC pembeli ${buyer.nama} berhasil disetujui`
        : `KYC pembeli ${buyer.nama} berhasil ditolak`,
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
