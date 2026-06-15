import { Router } from 'express';
import { getAllAset, getAsetById, createAset, updateAset, deleteAset, ajukanLelang, createLelangOlehAdmin, createAsetProperty, createAssetVehicle, createAssetElectronic, verifyProperty, verifyVehicle, verifyElectronic } from '../controllers/aset.controller.js';
import { verifyToken, verifyPenjual, verifyAdmin } from '../middleware/auth.middleware.js';
import { uploadFiles } from '../middleware/upload.middleware.js';

const router = Router();

router.get('/', verifyToken, getAllAset); // GET /api/aset - auth required for role-based filtering
router.get('/:id', getAsetById);

// Penjual & Admin bisa nambah aset (Legacy)
router.post(
  '/', 
  verifyToken, 
  uploadFiles.single('dokumen_aset'), 
  createAset
);

// Specific Asset Endpoints
router.post('/property', verifyToken, verifyPenjual, uploadFiles.fields([
  { name: 'property_photo', maxCount: 1 },
  { name: 'certificate_file_pdf', maxCount: 1 }
]), createAsetProperty);

router.post('/vehicle', verifyToken, verifyPenjual, uploadFiles.fields([
  { name: 'vehicle_photo', maxCount: 1 },
  { name: 'vehicle_bpkb', maxCount: 1 },
  { name: 'vehicle_stnk', maxCount: 1 }
]), createAssetVehicle);

router.post('/electronic', verifyToken, verifyPenjual, uploadFiles.single('item_photo'), createAssetElectronic);

router.put('/:id', verifyToken, updateAset);
router.delete('/:id', verifyToken, deleteAset);

// Flow Lelang
router.put('/:id/ajukan', verifyToken, verifyPenjual, ajukanLelang);
router.post('/:id/verifikasi-lelang', verifyToken, verifyAdmin, createLelangOlehAdmin);

// Specific Verification Endpoints
router.post('/:id/verify-property', verifyToken, verifyAdmin, verifyProperty);
router.post('/:id/verify-vehicle', verifyToken, verifyAdmin, verifyVehicle);
router.post('/:id/verify-electronic', verifyToken, verifyAdmin, verifyElectronic);

export default router;
