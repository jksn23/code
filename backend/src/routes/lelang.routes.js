import { Router } from 'express';
import {
  getSemuaLelangAktif,
  getLelangById,
  getLelangSelesai,
  getLelangSayaMenang,
  getNextLelang,
  getLelangSummary,
  getInvoiceLelang,
  uploadBuktiPembayaran,
  verifikasiPembayaran,
  tolakPembayaran,
  konfirmasiTerimaBarang,
} from '../controllers/lelang.controller.js';
import { verifyToken, verifyAdmin, verifyPembeli } from '../middleware/auth.middleware.js';
import { uploadFiles } from '../middleware/upload.middleware.js';

const router = Router();

// Public: list lelang aktif & selesai
router.get('/', getSemuaLelangAktif);

// Admin: lihat semua lelang selesai (MUST be before /:id)
router.get('/admin/selesai', verifyToken, verifyAdmin, getLelangSelesai);

// Pembeli: riwayat lelang yang dimenangkan
router.get('/pemenang/saya', verifyToken, verifyPembeli, getLelangSayaMenang);

// Public: ringkasan lelang berdasarkan tanggal (MUST be before /:id)
router.get('/summary/:date', getLelangSummary);

// Public: lelang berikutnya dalam antrean (MUST be before /:id)
router.get('/next/:currentId', getNextLelang);

// Auth: lihat invoice
router.get('/:id/invoice', verifyToken, getInvoiceLelang);

// Login: lihat detail lelang (untuk bidding)
router.get('/:id', verifyToken, getLelangById);

// Admin: verifikasi pembayaran
router.put('/:id/pembayaran', verifyToken, verifyAdmin, verifikasiPembayaran);
router.put('/:id/pembayaran/verifikasi', verifyToken, verifyAdmin, verifikasiPembayaran);
router.put('/:id/pembayaran/tolak', verifyToken, verifyAdmin, tolakPembayaran);

// Pembeli pemenang: upload bukti pembayaran
router.post('/:id/upload-bukti', verifyToken, verifyPembeli, uploadFiles.single('bukti_bayar'), uploadBuktiPembayaran);

// Pembeli (pemenang): konfirmasi terima barang
router.put('/:id/terima-barang', verifyToken, verifyPembeli, konfirmasiTerimaBarang);

export default router;
