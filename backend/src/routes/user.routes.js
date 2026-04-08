import { Router } from 'express';
import {
  createUserByAdmin,
  deleteUserByAdmin,
  getAllUsers,
  getUserById,
  updateUserByAdmin,
} from '../controllers/user.controller.js';
import { verifyAdmin, verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken, verifyAdmin);

router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.post('/', createUserByAdmin);
router.put('/:id', updateUserByAdmin);
router.delete('/:id', deleteUserByAdmin);

export default router;
