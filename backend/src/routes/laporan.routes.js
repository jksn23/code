import { Router } from 'express';
import { getLaporanAset, getLaporanLelang, getLaporanTransaksi } from '../controllers/laporan.controller.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js';

const router = Router();

// Semua laporan hanya bisa diakses Admin
router.get('/aset', verifyToken, verifyAdmin, getLaporanAset);
router.get('/lelang', verifyToken, verifyAdmin, getLaporanLelang);
router.get('/transaksi', verifyToken, verifyAdmin, getLaporanTransaksi);

export default router;
