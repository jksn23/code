import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../models/prisma.client.js';

const SECRET = process.env.JWT_SECRET || 'secret_key_lelang_spk_2026';

const buildUserPayload = (user) => {
  const seller = user.penjual || null;
  const verificationStatus = seller?.verificationStatus || null;

  return {
    id: user.id,
    nama: user.nama,
    email: user.email,
    role: user.role,
    isVerified: seller ? seller.isVerified : true,
    verificationStatus: seller ? verificationStatus : 'APPROVED',
    verificationNote: seller?.verificationNote || null,
    verifiedAt: seller?.verifiedAt || null,
    revisionCount: seller?.revisionCount || 0,
    rekeningBank: seller?.rekeningBank || '',
    nomorRekening: seller?.nomorRekening || '',
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
      
      // Jika mendaftar sebagai PEMBELI (via form multipart), simpan KTP ke user.ktpUrl
      if (assignedRole === 'PEMBELI') {
        ktpUrlUser = req.files?.ktp_file ? req.files.ktp_file[0].path : null;
      }

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          nama,
          role: assignedRole,
          ktpUrl: ktpUrlUser
        }
      });

      // Jika mendaftar sebagai penjual (via form multipart)
      if (assignedRole === 'PENJUAL') {
        const ktpUrl = req.files?.ktp_file ? req.files.ktp_file[0].path : null;
        const npwpUrl = req.files?.npwp_file ? req.files.npwp_file[0].path : null;
        const { rekeningBank, nomorRekening } = req.body;
        
        await tx.penjual.create({
          data: {
            userId: user.id,
            ktpUrl,
            npwpUrl,
            rekeningBank: rekeningBank || null,
            nomorRekening: nomorRekening || null,
            isVerified: false,
            verificationStatus: 'PENDING',
            verificationNote: null,
            revisionCount: 0,
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

    // Cek jika penjual belum divefirikasi, apakah boleh login? Boleh, tapi batasi askes di FE.
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: buildUserPayload(user)
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, nama: true, role: true, penjual: true }
    });

    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    
    res.json({
      success: true,
      data: {
        ...user,
        userSummary: buildUserPayload(user),
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
