import { Router } from 'express';
import { getNotifikasiSaya, markAllNotifikasiRead, markNotifikasiRead } from '../controllers/notifikasi.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, getNotifikasiSaya);
router.put('/read-all', verifyToken, markAllNotifikasiRead);
router.put('/:id/read', verifyToken, markNotifikasiRead);

export default router;
