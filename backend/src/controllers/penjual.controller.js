import prisma from '../models/prisma.client.js';

const sellerInclude = {
  user: { select: { id: true, nama: true, email: true, createdAt: true } },
  verifikator: { select: { id: true, nama: true, email: true } },
};

const serializePenjual = (seller) => ({
  ...seller,
  isVerified: seller.verificationStatus === 'APPROVED',
});

export const getSemuaPenjual = async (req, res) => {
  try {
    const list = await prisma.penjual.findMany({
      include: sellerInclude,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: list.map(serializePenjual) });
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
        aset: { select: { id: true, nama: true, statusLelang: true, createdAt: true } },
      },
    });

    if (!data) {
      return res.status(404).json({ success: false, message: 'Penjual tidak ditemukan' });
    }

    res.json({ success: true, data: serializePenjual(data) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const approvePenjual = async (req, res) => {
  try {
    const { id } = req.params;
    const note = req.body?.note?.trim();

    const data = await prisma.penjual.update({
      where: { id: Number(id) },
      data: {
        isVerified: true,
        verificationStatus: 'APPROVED',
        verificationNote: note || 'Dokumen penjual telah diverifikasi dan disetujui admin.',
        verifiedAt: new Date(),
        verifiedBy: req.userId,
      },
      include: sellerInclude,
    });

    res.json({
      success: true,
      message: `Akun penjual ${data.user.nama} berhasil disetujui`,
      data: serializePenjual(data),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectPenjual = async (req, res) => {
  try {
    const { id } = req.params;
    const note = req.body?.note?.trim();

    if (!note) {
      return res.status(400).json({ success: false, message: 'Alasan penolakan wajib diisi' });
    }

    const data = await prisma.penjual.update({
      where: { id: Number(id) },
      data: {
        isVerified: false,
        verificationStatus: 'REVISION_REQUESTED',
        verificationNote: note,
        verifiedAt: new Date(),
        verifiedBy: req.userId,
      },
      include: sellerInclude,
    });

    res.json({
      success: true,
      message: `Verifikasi penjual ${data.user.nama} ditolak dan diminta revisi dokumen`,
      data: serializePenjual(data),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifikasiPenjual = async (req, res) => {
  try {
    const { isVerified, note } = req.body;

    if (Boolean(isVerified)) {
      return approvePenjual(req, res);
    }

    req.body.note = note || 'Dokumen belum sesuai. Silakan perbarui dokumen dan unggah ulang.';
    return rejectPenjual(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reuploadDokumenPenjual = async (req, res) => {
  try {
    if (req.userRole !== 'PENJUAL') {
      return res.status(403).json({ success: false, message: 'Hanya penjual yang dapat memperbarui dokumen' });
    }

    const penjual = await prisma.penjual.findUnique({
      where: { userId: req.userId },
      include: sellerInclude,
    });

    if (!penjual) {
      return res.status(404).json({ success: false, message: 'Profil penjual tidak ditemukan' });
    }

    if (penjual.verificationStatus === 'APPROVED') {
      return res.status(400).json({ success: false, message: 'Akun sudah disetujui. Revisi dokumen tidak diperlukan.' });
    }

    const { rekeningBank, nomorRekening } = req.body;
    const ktpUrl = req.files?.ktp_file?.[0]?.path || null;
    const npwpUrl = req.files?.npwp_file?.[0]?.path || null;

    const data = await prisma.penjual.update({
      where: { id: penjual.id },
      data: {
        ...(ktpUrl && { ktpUrl }),
        ...(npwpUrl && { npwpUrl }),
        ...(rekeningBank !== undefined && { rekeningBank: rekeningBank || null }),
        ...(nomorRekening !== undefined && { nomorRekening: nomorRekening || null }),
        isVerified: false,
        verificationStatus: 'PENDING',
        verificationNote: null,
        verifiedAt: null,
        verifiedBy: null,
        revisionCount: { increment: 1 },
      },
      include: sellerInclude,
    });

    res.json({
      success: true,
      message: 'Dokumen penjual berhasil diperbarui dan dikirim ulang untuk verifikasi',
      data: serializePenjual(data),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
