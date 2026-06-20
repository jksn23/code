import { Router } from 'express';
import {
  getAdminPenilaianDetail,
  getAdminPenilaianList,
  patchAdminStatusPenilaian,
} from '../controllers/penilaian.controller.js';
import { verifyAdmin, verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, verifyAdmin, getAdminPenilaianList);
router.get('/:asetId', verifyToken, verifyAdmin, getAdminPenilaianDetail);
router.patch('/:asetId/status', verifyToken, verifyAdmin, patchAdminStatusPenilaian);

export default router;
