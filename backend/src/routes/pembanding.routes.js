import express from 'express';
import {
  getPembandingByAset,
  searchPembanding,
  addManualPembanding,
  selectPembanding,
  validasiPembanding,
  hitungMedian,
  getScrapingJobStatus,
} from '../controllers/pembanding.controller.js';
import { verifyToken, verifyAdmin, verifyPenjual } from '../middleware/auth.middleware.js';

const router = express.Router();

// Semua route butuh otentikasi
router.use(verifyToken);

router.get('/aset/:asetId', getPembandingByAset);
router.post('/aset/:asetId/search', verifyPenjual, searchPembanding);
router.get('/aset/:asetId/job-status/:jobId', getScrapingJobStatus);     // ← Polling job status
router.post('/aset/:asetId/manual', verifyPenjual, addManualPembanding);
router.post('/aset/:asetId/hitung-median', verifyPenjual, hitungMedian);

router.patch('/:id/select', verifyPenjual, selectPembanding);
router.patch('/:id/validasi', verifyAdmin, validasiPembanding);

export default router;
