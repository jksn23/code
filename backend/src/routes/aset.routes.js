import { Router } from 'express';
import { getAllAset, getAsetById, createAset, updateAset, deleteAset, ajukanLelang, createLelangOlehAdmin } from '../controllers/aset.controller.js';
import { verifyToken, verifyPenjual, verifyAdmin } from '../middleware/auth.middleware.js';
import { uploadFiles } from '../middleware/upload.middleware.js';

const router = Router();

router.get('/', verifyToken, getAllAset); // GET /api/aset - auth required for role-based filtering
router.get('/:id', getAsetById);

// Penjual & Admin bisa nambah aset
router.post(
  '/', 
  verifyToken, 
  uploadFiles.single('dokumen_aset'), 
  createAset
);

router.put('/:id', verifyToken, updateAset);
router.delete('/:id', verifyToken, deleteAset);

// Flow Lelang
router.put('/:id/ajukan', verifyToken, verifyPenjual, ajukanLelang);
router.post('/:id/verifikasi-lelang', verifyToken, verifyAdmin, createLelangOlehAdmin);

export default router;
