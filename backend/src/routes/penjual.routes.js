import { Router } from 'express';
import { getSemuaPenjual, getPenjualById, verifikasiPenjual } from '../controllers/penjual.controller.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, verifyAdmin, getSemuaPenjual);
router.get('/:id', verifyToken, verifyAdmin, getPenjualById);
router.put('/:id/verify', verifyToken, verifyAdmin, verifikasiPenjual);

export default router;
