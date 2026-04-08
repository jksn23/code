import { Router } from 'express';
import { getPembeliById, getSemuaPembeli, verifikasiPembeli } from '../controllers/pembeli.controller.js';
import { verifyAdmin, verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, verifyAdmin, getSemuaPembeli);
router.get('/:id', verifyToken, verifyAdmin, getPembeliById);
router.put('/:id/verifikasi', verifyToken, verifyAdmin, verifikasiPembeli);

export default router;
