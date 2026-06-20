import { Router } from 'express';
import {
  getSellerKriteria,
  getSellerHasilPenilaian,
  hitungSellerSAW,
  saveSellerNilaiKriteria,
} from '../controllers/penilaian.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/:asetId/kriteria', verifyToken, getSellerKriteria);
router.post('/:asetId/nilai-kriteria', verifyToken, saveSellerNilaiKriteria);
router.put('/:asetId/nilai-kriteria', verifyToken, saveSellerNilaiKriteria);
router.post('/:asetId/hitung-saw', verifyToken, hitungSellerSAW);
router.get('/:asetId/hasil-penilaian', verifyToken, getSellerHasilPenilaian);

export default router;
