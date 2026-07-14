/**
 * ROUTES: Auction Document Management System (ADMS)
 * 
 * Base URL: /api/dokumen
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  uploadDocumentController,
  getDocumentsRepositoryController,
  verifyDocumentController,
  getAssetChecklistController,
  generateMultiFormatDokumenController,
  downloadArchiveZipController,
  getActivityLogsController,
  getDokumenController,
  downloadDokumenController,
  deleteDokumenController,
} from '../controllers/dokumen.controller.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../../uploads/repository');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage configuration for ADMS repository uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `adms_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = Router();

// Semua route membutuhkan autentikasi token JWT
router.use(verifyToken);

// ─── ADMS REPOSITORY & WORKFLOW ROUTES ────────────────────────────────────────

// Upload dokumen ke repository (Penjual / Admin)
router.post('/upload', upload.single('file'), uploadDocumentController);

// Filter list dokumen di repository
router.get('/repository', getDocumentsRepositoryController);

// Evaluasi checklist dokumen per aset
router.get('/checklist/asset/:assetId', getAssetChecklistController);

// Verifikasi status dokumen (Admin: APPROVE / REJECT)
router.patch('/:id/verify', verifyAdmin, verifyDocumentController);

// Generate dokumen sistem (PDF & DOCX)
router.post('/:lelangId/generate', verifyAdmin, generateMultiFormatDokumenController);

// Unduh Paket Arsip ZIP Lelang Selesai
router.get('/:lelangId/archive/zip', downloadArchiveZipController);

// Activity Log ADMS Audit Trail
router.get('/activity-log', getActivityLogsController);

// ─── LEGACY ROUTES (COMPATIBILITY) ────────────────────────────────────────────

router.get('/:lelangId', getDokumenController);
router.get('/:lelangId/:dokumenId/download', downloadDokumenController);
router.delete('/:dokumenId', verifyAdmin, deleteDokumenController);

export default router;
