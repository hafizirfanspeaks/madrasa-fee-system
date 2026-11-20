import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', protect, getSettings);
router.put('/', protect, adminOnly, updateSettings); // Sirf Admin change kar sakta hai

export default router;