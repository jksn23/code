import { Router } from 'express';
import { hitungSAWController, getHasil } from '../controllers/spk.controller.js';

const router = Router();
router.post('/hitung-saw', hitungSAWController);
router.get('/hasil/:kategori_id', getHasil);
export default router;
