import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/auth.middleware.js';

// Lazy import karena limit_validation.controller.js menggunakan CommonJS require
// (dapat diubah ke ESM sepenuhnya di masa depan)
const router = express.Router();

router.use(verifyToken);
router.use(verifyAdmin);

// Dynamic import controller agar kompatibel dengan ESM app
let ctrl;
const getCtrl = async () => {
  if (!ctrl) {
    const mod = await import('../controllers/limit_validation.controller.js');
    ctrl = mod;
  }
  return ctrl;
};

router.post('/', async (req, res, next) => {
  const { createValidasi } = await getCtrl();
  return createValidasi(req, res, next);
});

router.get('/aset/:asetId', async (req, res, next) => {
  const { getValidasiForAset } = await getCtrl();
  return getValidasiForAset(req, res, next);
});

router.get('/report', async (req, res, next) => {
  const { getReport } = await getCtrl();
  return getReport(req, res, next);
});

router.delete('/:id', async (req, res, next) => {
  const { removeValidasi } = await getCtrl();
  return removeValidasi(req, res, next);
});

export default router;
