import { Router } from 'express';
import { inputNilaiAset, getNilaiByAset } from '../controllers/nilai.controller.js';

const router = Router();
router.get('/aset/:aset_id', getNilaiByAset);
router.post('/', inputNilaiAset);
export default router;
