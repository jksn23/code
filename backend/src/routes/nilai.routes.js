import { Router } from 'express';
import { inputNilaiAset, getNilaiByAset } from '../controllers/nilai.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();
router.get('/aset/:aset_id', verifyToken, getNilaiByAset);
router.post('/', verifyToken, inputNilaiAset);
export default router;
