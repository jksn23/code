import { Router } from 'express';
import { getAllKriteria, getKriteriaById, createKriteria, updateKriteria, deleteKriteria } from '../controllers/kriteria.controller.js';

const router = Router();
router.get('/', getAllKriteria);        // GET /api/kriteria?kategori_id=1
router.get('/:id', getKriteriaById);
router.post('/', createKriteria);
router.put('/:id', updateKriteria);
router.delete('/:id', deleteKriteria);
export default router;
