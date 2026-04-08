import bcrypt from 'bcryptjs';
import prisma from '../models/prisma.client.js';
import {
  SELLER_VERIFICATION_STATUS,
  resolveSellerVerificationStatus,
  toLegacySellerVerifiedFlag,
} from '../utils/seller-verification.util.js';

const USER_BASE_SELECT = {
  id: true,
  nama: true,
  email: true,
  role: true,
  ktpUrl: true,
  buyerVerificationStatus: true,
  buyerVerificationNote: true,
  buyerVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
  penjual: {
    select: {
      id: true,
      ktpUrl: true,
      npwpUrl: true,
      rekeningBank: true,
      nomorRekening: true,
      isVerified: true,
      verificationStatus: true,
      verificationNote: true,
      verifiedAt: true,
      verifiedBy: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          aset: true,
        },
      },
      verifier: {
        select: {
          id: true,
          nama: true,
          email: true,
        },
      },
    },
  },
  buyerVerifier: {
    select: {
      id: true,
      nama: true,
      email: true,
    },
  },
  _count: {
    select: {
      penawaran: true,
      lelangDimenangkan: true,
      verifiedPayments: true,
      notifications: true,
      verifiedBuyers: true,
    },
  },
};

const DETAIL_SELECT = {
  ...USER_BASE_SELECT,
  penawaran: {
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      lelang: {
        select: {
          id: true,
          status: true,
          aset: { select: { nama: true } },
        },
      },
    },
  },
  notifications: {
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      judul: true,
      tipe: true,
      isRead: true,
      createdAt: true,
    },
  },
};

const VALID_ROLES = ['ADMIN', 'PENJUAL', 'PEMBELI'];
const VALID_BUYER_STATUS = ['UNVERIFIED', 'PENDING', 'APPROVED', 'REJECTED'];
const VALID_SELLER_STATUS = Object.values(SELLER_VERIFICATION_STATUS);

const canChangeRole = async (userId, nextRole) => {
  const current = await prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      id: true,
      role: true,
      penjual: {
        select: {
          id: true,
          _count: { select: { aset: true } },
        },
      },
      _count: {
        select: {
          penawaran: true,
          lelangDimenangkan: true,
          verifiedPayments: true,
          verifiedBuyers: true,
        },
      },
    },
  });

  if (!current) return { ok: false, message: 'User tidak ditemukan' };
  if (current.role === nextRole) return { ok: true, current };

  if (current.penjual?._count?.aset > 0) {
    return { ok: false, message: 'Role tidak dapat diubah karena user memiliki aset penjual terdaftar' };
  }

  if (current._count.penawaran > 0 || current._count.lelangDimenangkan > 0) {
    return { ok: false, message: 'Role tidak dapat diubah karena user sudah memiliki histori bidding/lelang' };
  }

  if (current._count.verifiedPayments > 0 || current._count.verifiedBuyers > 0) {
    return { ok: false, message: 'Role tidak dapat diubah karena user sudah tercatat sebagai verifikator' };
  }

  return { ok: true, current };
};

const buildSellerCreateData = (body, adminUserId) => {
  const sellerStatus = VALID_SELLER_STATUS.includes(body.sellerVerificationStatus)
    ? body.sellerVerificationStatus
    : (body.isSellerVerified ? SELLER_VERIFICATION_STATUS.APPROVED : SELLER_VERIFICATION_STATUS.PENDING);

  return {
    ktpUrl: body.sellerKtpUrl?.trim() || null,
    npwpUrl: body.sellerNpwpUrl?.trim() || null,
    rekeningBank: body.rekeningBank?.trim() || null,
    nomorRekening: body.nomorRekening?.trim() || null,
    isVerified: sellerStatus === SELLER_VERIFICATION_STATUS.APPROVED,
    verificationStatus: sellerStatus,
    verificationNote: body.sellerVerificationNote?.trim() || null,
    verifiedAt: sellerStatus === SELLER_VERIFICATION_STATUS.APPROVED ? new Date() : null,
    verifiedBy: sellerStatus === SELLER_VERIFICATION_STATUS.APPROVED ? adminUserId : null,
  };
};

const serializeUserRecord = (record) => {
  if (!record?.penjual) return record;
  return {
    ...record,
    penjual: {
      ...record.penjual,
      verificationStatus: resolveSellerVerificationStatus(record.penjual),
      isVerified: toLegacySellerVerifiedFlag(record.penjual),
    },
  };
};

const buildCreatePayload = async (body, adminUserId) => {
  const {
    nama,
    email,
    password,
    role,
    ktpUrl,
    buyerVerificationStatus,
    buyerVerificationNote,
    rekeningBank,
    nomorRekening,
    sellerKtpUrl,
    sellerNpwpUrl,
    sellerVerificationStatus,
    sellerVerificationNote,
    isSellerVerified,
  } = body;

  if (!nama?.trim() || !email?.trim() || !password?.trim() || !role) {
    return { error: 'Nama, email, password, dan role wajib diisi' };
  }

  if (!VALID_ROLES.includes(role)) {
    return { error: 'Role user tidak valid' };
  }

  const existing = await prisma.user.findUnique({ where: { email: email.trim() } });
  if (existing) {
    return { error: 'Email sudah terdaftar' };
  }

  const hashedPassword = await bcrypt.hash(password.trim(), 10);
  const buyerStatus = VALID_BUYER_STATUS.includes(buyerVerificationStatus) ? buyerVerificationStatus : 'UNVERIFIED';

  return {
    data: {
      nama: nama.trim(),
      email: email.trim(),
      password: hashedPassword,
      role,
      ktpUrl: ktpUrl?.trim() || null,
      buyerVerificationStatus: role === 'PEMBELI' ? buyerStatus : 'UNVERIFIED',
      buyerVerificationNote: role === 'PEMBELI' ? (buyerVerificationNote?.trim() || null) : null,
      buyerVerifiedAt: role === 'PEMBELI' && buyerStatus === 'APPROVED' ? new Date() : null,
      penjual: role === 'PENJUAL'
        ? {
            create: {
              ...buildSellerCreateData({
                sellerKtpUrl,
                sellerNpwpUrl,
                rekeningBank,
                nomorRekening,
                sellerVerificationStatus,
                sellerVerificationNote,
                isSellerVerified,
              }, adminUserId),
            },
          }
        : undefined,
    },
  };
};

export const getAllUsers = async (req, res) => {
  try {
    const { role, q } = req.query;
    const where = {};

    if (role && VALID_ROLES.includes(role)) {
      where.role = role;
    }

    if (q?.trim()) {
      where.OR = [
        { nama: { contains: q.trim() } },
        { email: { contains: q.trim() } },
      ];
    }

    const data = await prisma.user.findMany({
      where,
      select: USER_BASE_SELECT,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: data.map(serializeUserRecord) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = await prisma.user.findUnique({
      where: { id },
      select: DETAIL_SELECT,
    });

    if (!data) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    res.json({ success: true, data: serializeUserRecord(data) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUserByAdmin = async (req, res) => {
  try {
    const payload = await buildCreatePayload(req.body, req.userId);
    if (payload.error) {
      return res.status(400).json({ success: false, message: payload.error });
    }

    const data = await prisma.user.create({
      data: payload.data,
      select: USER_BASE_SELECT,
    });

    res.status(201).json({ success: true, message: 'User berhasil ditambahkan', data: serializeUserRecord(data) });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ success: false, message: 'Email sudah digunakan user lain' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserByAdmin = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      nama,
      email,
      password,
      role,
      ktpUrl,
      buyerVerificationStatus,
      buyerVerificationNote,
      rekeningBank,
      nomorRekening,
      sellerKtpUrl,
      sellerNpwpUrl,
      sellerVerificationStatus,
      sellerVerificationNote,
      isSellerVerified,
    } = req.body;

    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        penjual: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    if (!nama?.trim() || !email?.trim() || !role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan role wajib valid' });
    }

    if (existing.email !== email.trim()) {
      const duplicate = await prisma.user.findUnique({ where: { email: email.trim() } });
      if (duplicate) {
        return res.status(409).json({ success: false, message: 'Email sudah digunakan user lain' });
      }
    }

    const roleCheck = await canChangeRole(id, role);
    if (!roleCheck.ok) {
      return res.status(400).json({ success: false, message: roleCheck.message });
    }

    if (req.userId === id && role !== 'ADMIN') {
      return res.status(400).json({ success: false, message: 'Admin tidak dapat menurunkan role akunnya sendiri' });
    }

    const buyerStatus = VALID_BUYER_STATUS.includes(buyerVerificationStatus) ? buyerVerificationStatus : 'UNVERIFIED';

    const data = await prisma.$transaction(async (tx) => {
      if (existing.role !== role) {
        if (existing.role === 'PENJUAL' && existing.penjual) {
          await tx.penjual.delete({ where: { userId: id } });
        }
        if (role === 'PENJUAL' && !existing.penjual) {
          await tx.penjual.create({
            data: {
              userId: id,
              ...buildSellerCreateData({
                sellerKtpUrl,
                sellerNpwpUrl,
                rekeningBank,
                nomorRekening,
                sellerVerificationStatus,
                sellerVerificationNote,
                isSellerVerified,
              }, req.userId),
            },
          });
        }
      }

      if (role === 'PENJUAL') {
        if (existing.penjual || existing.role === 'PENJUAL') {
          await tx.penjual.update({
            where: { userId: id },
            data: buildSellerCreateData({
              sellerKtpUrl,
              sellerNpwpUrl,
              rekeningBank,
              nomorRekening,
              sellerVerificationStatus,
              sellerVerificationNote,
              isSellerVerified,
            }, req.userId),
          });
        }
      }

      await tx.user.update({
        where: { id },
        data: {
          nama: nama.trim(),
          email: email.trim(),
          role,
          ktpUrl: ktpUrl?.trim() || null,
          buyerVerificationStatus: role === 'PEMBELI' ? buyerStatus : 'UNVERIFIED',
          buyerVerificationNote: role === 'PEMBELI' ? (buyerVerificationNote?.trim() || null) : null,
          buyerVerifiedAt: role === 'PEMBELI' && buyerStatus === 'APPROVED' ? (existing.buyerVerifiedAt || new Date()) : null,
          ...(password?.trim() ? { password: await bcrypt.hash(password.trim(), 10) } : {}),
        },
      });

      return tx.user.findUnique({
        where: { id },
        select: USER_BASE_SELECT,
      });
    });

    res.json({ success: true, message: 'User berhasil diperbarui', data: serializeUserRecord(data) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUserByAdmin = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (req.userId === id) {
      return res.status(400).json({ success: false, message: 'Admin tidak dapat menghapus akunnya sendiri' });
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        penjual: {
          select: {
            _count: { select: { aset: true } },
          },
        },
        _count: {
          select: {
            penawaran: true,
            lelangDimenangkan: true,
            verifiedPayments: true,
            verifiedBuyers: true,
          },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    if (existing.role === 'ADMIN') {
      const totalAdmin = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (totalAdmin <= 1) {
        return res.status(400).json({ success: false, message: 'Admin terakhir tidak boleh dihapus' });
      }
    }

    if (existing.penjual?._count?.aset > 0) {
      return res.status(400).json({ success: false, message: 'User tidak dapat dihapus karena masih memiliki aset' });
    }

    if (existing._count.penawaran > 0 || existing._count.lelangDimenangkan > 0) {
      return res.status(400).json({ success: false, message: 'User tidak dapat dihapus karena memiliki histori bidding/lelang' });
    }

    if (existing._count.verifiedPayments > 0 || existing._count.verifiedBuyers > 0) {
      return res.status(400).json({ success: false, message: 'User tidak dapat dihapus karena tercatat sebagai verifikator' });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
