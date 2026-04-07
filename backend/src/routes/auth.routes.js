import express from 'express';
import { register, login, getProfile } from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { uploadFiles } from '../middleware/upload.middleware.js';

const router = express.Router();

router.post(
  '/register/pembeli',
  uploadFiles.fields([{ name: 'ktp_file', maxCount: 1 }]),
  (req, res, next) => {
    req.body.role = 'PEMBELI';
    next();
  },
  register
);

// Register Penjual membutuhkan upload ktp dan npwp
router.post(
  '/register/penjual',
  uploadFiles.fields([
    { name: 'ktp_file', maxCount: 1 },
    { name: 'npwp_file', maxCount: 1 }
  ]),
  (req, res, next) => {
    // Override role enforcing for this endpoint
    req.body.role = 'PENJUAL';
    next();
  },
  register
);

router.post('/login', login);
router.get('/profile', verifyToken, getProfile);

export default router;
