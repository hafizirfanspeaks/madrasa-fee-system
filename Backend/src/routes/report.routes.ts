import { Router } from 'express';
import { getDailyReport, getPendingReport, getAllStudentsData } from '../controllers/report.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/daily', protect, adminOnly, getDailyReport);
router.get('/pending', protect, adminOnly, getPendingReport);
router.get('/students-data', protect, adminOnly, getAllStudentsData); // 🔥 Naya Route

export default router;