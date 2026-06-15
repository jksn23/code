import { Router } from 'express';
import { getQuickBids, saveQuickBids } from '../controllers/quick_bid.controller.js';
import { verifyToken, verifyPembeli } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', verifyToken, verifyPembeli, getQuickBids);
router.post('/', verifyToken, verifyPembeli, saveQuickBids);

export default router;
