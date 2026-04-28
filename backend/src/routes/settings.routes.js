import { Router } from 'express';
import {
  getSettingsSummary,
  importSettingsData,
  purgeSettingsModule,
  resetSettingsData,
} from '../controllers/settings.controller.js';
import { verifyAdmin, verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken, verifyAdmin);

router.get('/summary', getSettingsSummary);
router.post('/import', importSettingsData);
router.post('/purge/:module', purgeSettingsModule);
router.post('/reset', resetSettingsData);

export default router;
