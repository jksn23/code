import { Router } from 'express';
import { hitungAHPController, hitungSAWController, getHasil } from '../controllers/spk.controller.js';

const router = Router();
router.post('/hitung-ahp', hitungAHPController);
router.post('/hitung-saw', hitungSAWController);
router.get('/hasil/:kategori_id', getHasil);
export default router;
