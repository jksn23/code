import { Router } from 'express';
import { getAllKategori, getKategoriById, createKategori, updateKategori, deleteKategori } from '../controllers/kategori.controller.js';

const router = Router();
router.get('/', getAllKategori);
router.get('/:id', getKategoriById);
router.post('/', createKategori);
router.put('/:id', updateKategori);
router.delete('/:id', deleteKategori);
export default router;
