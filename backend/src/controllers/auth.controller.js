import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../models/prisma.client.js';
import { getUploadedFilePath } from '../middleware/upload.middleware.js';
import {
  SELLER_VERIFICATION_STATUS,
  resolveSellerVerificationStatus,
  toLegacySellerVerifiedFlag,
} from '../utils/seller-verification.util.js';

const SECRET = process.env.JWT_SECRET || 'secret_key_lelang_spk_2026';

const buildUserPayload = (user) => {
  const sellerStatus = user.penjual
    ? resolveSellerVerificationStatus(user.penjual)
    : SELLER_VERIFICATION_STATUS.APPROVED;

  return {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
    isVerified: user.penjual ? toLegacySellerVerifiedFlag(user.penjual) : true,
    sellerVerificationStatus: sellerStatus,
    sellerVerificationNote: user.penjual?.verificationNote || null,
    sellerVerifiedAt: user.penjual?.verifiedAt || null,
    rekeningBank: user.penjual?.rekeningBank || '',
    nomorRekening: user.penjual?.nomorRekening || '',
    sellerKtpUrl: user.penjual?.ktpUrl || null,
    sellerNpwpUrl: user.penjual?.npwpUrl || null,
    buyerVerificationStatus: user.role === 'PEMBELI'
      ? user.buyerVerificationStatus
      : 'APPROVED',
    buyerVerificationNote: user.role === 'PEMBELI' ? user.buyerVerificationNote : null,
    buyerVerifiedAt: user.role === 'PEMBELI' ? user.buyerVerifiedAt : null,
    ktpUrl: user.ktpUrl || null,
  };
};

export const register = async (req, res) => {
  try {
    const { email, password, nama, role } = req.body;
    
    // Validasi basic
    if (!email || !password || !nama) {
      return res.status(400).json({ success: false, message: 'Semua field (email, password, nama) harus diisi' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role === 'ADMIN' ? 'PEMBELI' : (role || 'PEMBELI'); // cegah daftar sbg admin langsung via request biasa

    const resultDb = await prisma.$transaction(async (tx) => {
      let ktpUrlUser = null;
      let buyerVerificationStatus = 'UNVERIFIED';
      
      if (assignedRole === 'PEMBELI') {
        ktpUrlUser = getUploadedFilePath(req.files?.ktp_file?.[0]);
        buyerVerificationStatus = ktpUrlUser ? 'PENDING' : 'UNVERIFIED';
      }

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          nama,
          role: assignedRole,
          ktpUrl: ktpUrlUser,
          buyerVerificationStatus,
        }
      });

      // Jika mendaftar sebagai penjual (via form multipart)
      if (assignedRole === 'PENJUAL') {
        const ktpUrl = getUploadedFilePath(req.files?.ktp_file?.[0]);
        const npwpUrl = getUploadedFilePath(req.files?.npwp_file?.[0]);
        const { rekeningBank, nomorRekening } = req.body;
        
        await tx.penjual.create({
          data: {
            userId: user.id,
            ktpUrl,
            npwpUrl,
            rekeningBank: rekeningBank || null,
            nomorRekening: nomorRekening || null,
            isVerified: false,
            verificationStatus: SELLER_VERIFICATION_STATUS.PENDING,
          }
        });
      }

      return user;
    });

    res.status(201).json({ success: true, message: 'Register berhasil', data: { id: resultDb.id, email: resultDb.email, role: resultDb.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { penjual: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Email tidak ditemukan' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Password salah' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: buildUserPayload(user),
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        penjual: true,
        buyerVerifier: {
          select: { id: true, nama: true, email: true },
        },
      },
    });

    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    
    res.json({
      success: true,
      data: {
        ...user,
        userSummary: buildUserPayload(user),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
