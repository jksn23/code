import { Router } from 'express';
import {
  getSemuaPenjual,
  getPenjualById,
  resubmitDokumenPenjual,
  verifikasiPenjual,
} from '../controllers/penjual.controller.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js';
import { uploadFiles } from '../middleware/upload.middleware.js';

const router = Router();

router.get('/', verifyToken, verifyAdmin, getSemuaPenjual);
router.put(
  '/me/documents',
  verifyToken,
  uploadFiles.fields([
    { name: 'ktp_file', maxCount: 1 },
    { name: 'npwp_file', maxCount: 1 },
  ]),
  resubmitDokumenPenjual
);
router.get('/:id', verifyToken, verifyAdmin, getPenjualById);
router.put('/:id/verify', verifyToken, verifyAdmin, verifikasiPenjual);

export default router;
