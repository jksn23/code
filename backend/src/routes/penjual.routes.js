import { Router } from 'express';
import { getSemuaPenjual, getPenjualById, verifikasiPenjual, approvePenjual, rejectPenjual, reuploadDokumenPenjual } from '../controllers/penjual.controller.js';
import { verifyToken, verifyAdmin, verifyPenjual } from '../middleware/auth.middleware.js';
import { uploadFiles } from '../middleware/upload.middleware.js';

const router = Router();

router.get('/', verifyToken, verifyAdmin, getSemuaPenjual);
router.get('/:id', verifyToken, verifyAdmin, getPenjualById);
router.put('/:id/verify', verifyToken, verifyAdmin, verifikasiPenjual);
router.put('/:id/approve', verifyToken, verifyAdmin, approvePenjual);
router.put('/:id/reject', verifyToken, verifyAdmin, rejectPenjual);
router.put('/me/reupload-dokumen', verifyToken, verifyPenjual, uploadFiles.fields([
  { name: 'ktp_file', maxCount: 1 },
  { name: 'npwp_file', maxCount: 1 }
]), reuploadDokumenPenjual);

export default router;
