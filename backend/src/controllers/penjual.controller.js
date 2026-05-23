import prisma from '../models/prisma.client.js';
import { createNotification, createNotifications } from '../utils/notification.util.js';
import { getUploadedFilePath } from '../middleware/upload.middleware.js';
import {
  SELLER_VERIFICATION_STATUS,
  resolveSellerVerificationStatus,
  toLegacySellerVerifiedFlag,
} from '../utils/seller-verification.util.js';

const sellerInclude = {
  user: { select: { id: true, nama: true, email: true, createdAt: true } },
  verifier: { select: { id: true, nama: true, email: true } },
};

export const getSemuaPenjual = async (req, res) => {
  try {
    const list = await prisma.penjual.findMany({
      include: sellerInclude,
      orderBy: { createdAt: 'desc' }
    });
    res.json({
      success: true,
      data: list.map((item) => ({
        ...item,
        verificationStatus: resolveSellerVerificationStatus(item),
        isVerified: toLegacySellerVerifiedFlag(item),
      })),
    });
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
        ...sellerInclude,
        aset: {
          select: {
            id: true,
            nama: true,
            statusLelang: true,
            createdAt: true,
            kategori: { select: { nama: true } },
          },
        },
      }
    });
    if (!data) return res.status(404).json({ success: false, message: 'Penjual tidak ditemukan' });
    res.json({
      success: true,
      data: {
        ...data,
        verificationStatus: resolveSellerVerificationStatus(data),
        isVerified: toLegacySellerVerifiedFlag(data),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifikasiPenjual = async (req, res) => {
  try {
    const { id } = req.params;
    const action = req.body?.action;
    const note = req.body?.note?.trim() || null;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Aksi verifikasi penjual tidak valid' });
    }

    if (action === 'reject' && !note) {
      return res.status(400).json({ success: false, message: 'Catatan penolakan seller wajib diisi' });
    }

    const nextStatus = action === 'approve'
      ? SELLER_VERIFICATION_STATUS.APPROVED
      : SELLER_VERIFICATION_STATUS.REJECTED;
    const verificationNote = action === 'approve'
      ? (note || 'Dokumen penjual telah diverifikasi dan disetujui admin.')
      : note;

    const data = await prisma.penjual.update({
      where: { id: Number(id) },
      data: {
        isVerified: nextStatus === SELLER_VERIFICATION_STATUS.APPROVED,
        verificationStatus: nextStatus,
        verificationNote,
        verifiedAt: new Date(),
        verifiedBy: req.userId,
      },
      include: sellerInclude,
    });

    await createNotification({
      userId: data.userId,
      judul: nextStatus === SELLER_VERIFICATION_STATUS.APPROVED ? 'Verifikasi Penjual Disetujui' : 'Verifikasi Penjual Ditolak',
      pesan: nextStatus === SELLER_VERIFICATION_STATUS.APPROVED
        ? 'Akun penjual Anda telah diverifikasi. Anda sekarang dapat menginput aset dan mengajukan lelang.'
        : `Dokumen penjual Anda perlu direvisi. Catatan admin: ${verificationNote}`,
      tipe: nextStatus === SELLER_VERIFICATION_STATUS.APPROVED ? 'SELLER_APPROVED' : 'SELLER_REJECTED',
      referenceType: 'PENJUAL',
      referenceId: data.id,
    });

    res.json({
      success: true,
      message: nextStatus === SELLER_VERIFICATION_STATUS.APPROVED
        ? `Seller ${data.user.nama} berhasil disetujui`
        : `Seller ${data.user.nama} berhasil ditandai perlu revisi`,
      data: {
        ...data,
        verificationStatus: resolveSellerVerificationStatus(data),
        isVerified: toLegacySellerVerifiedFlag(data),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resubmitDokumenPenjual = async (req, res) => {
  try {
    if (req.userRole !== 'PENJUAL') {
      return res.status(403).json({ success: false, message: 'Hanya seller yang dapat memperbarui dokumen' });
    }

    const seller = await prisma.penjual.findUnique({
      where: { userId: req.userId },
      include: sellerInclude,
    });

    if (!seller) {
      return res.status(404).json({ success: false, message: 'Profil seller tidak ditemukan' });
    }

    if (resolveSellerVerificationStatus(seller) === SELLER_VERIFICATION_STATUS.APPROVED) {
      return res.status(400).json({ success: false, message: 'Akun seller Anda sudah aktif dan tidak perlu revisi dokumen' });
    }

    const ktpUrl = getUploadedFilePath(req.files?.ktp_file?.[0]);
    const npwpUrl = getUploadedFilePath(req.files?.npwp_file?.[0]);
    const rekeningBank = req.body?.rekeningBank?.trim();
    const nomorRekening = req.body?.nomorRekening?.trim();

    if (!ktpUrl && !npwpUrl && !rekeningBank && !nomorRekening) {
      return res.status(400).json({ success: false, message: 'Unggah minimal satu dokumen atau perbarui data rekening' });
    }

    const data = await prisma.penjual.update({
      where: { userId: req.userId },
      data: {
        ...(ktpUrl ? { ktpUrl } : {}),
        ...(npwpUrl ? { npwpUrl } : {}),
        ...(rekeningBank !== undefined ? { rekeningBank: rekeningBank || null } : {}),
        ...(nomorRekening !== undefined ? { nomorRekening: nomorRekening || null } : {}),
        isVerified: false,
        verificationStatus: SELLER_VERIFICATION_STATUS.PENDING,
        verificationNote: 'Dokumen seller telah diperbarui dan menunggu review ulang admin.',
        verifiedAt: null,
        verifiedBy: null,
      },
      include: sellerInclude,
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    });

    await createNotifications(
      admins.map((admin) => ({
        userId: admin.id,
        judul: 'Seller Memperbarui Dokumen',
        pesan: `Seller ${seller.user?.nama || 'Unknown'} telah memperbarui dokumen dan kembali menunggu review admin.`,
        tipe: 'SELLER_RESUBMITTED',
        referenceType: 'PENJUAL',
        referenceId: seller.id,
      }))
    );

    res.json({
      success: true,
      message: 'Dokumen berhasil diperbarui dan dikirim ulang untuk verifikasi admin',
      data: {
        ...data,
        verificationStatus: resolveSellerVerificationStatus(data),
        isVerified: toLegacySellerVerifiedFlag(data),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
