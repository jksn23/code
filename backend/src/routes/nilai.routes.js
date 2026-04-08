import { Router } from 'express';
import { inputNilaiAset, getNilaiByAset } from '../controllers/nilai.controller.js';
import { verifyAdmin, verifyToken } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/aset/:aset_id', verifyToken, verifyAdmin, getNilaiByAset);
router.post('/', verifyToken, verifyAdmin, inputNilaiAset);
export default router;
