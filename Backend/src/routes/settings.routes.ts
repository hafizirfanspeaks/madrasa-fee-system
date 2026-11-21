import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = Router();

// 🔥 FIX: 'protect' hata diya taake login page par settings load ho sake (401 error fix)
router.get('/', getSettings); 

// Update ke liye login (protect) aur Admin hona zaroori hai
router.put('/', protect, adminOnly, updateSettings); 

export default router;