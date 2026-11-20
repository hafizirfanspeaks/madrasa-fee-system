import { Router } from 'express';
import { createTeacher, getTeachers, deleteTeacher, updateTeacher } from '../controllers/user.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = Router();

router.route('/')
  .post(protect, adminOnly, createTeacher)
  .get(protect, adminOnly, getTeachers);

router.route('/:id')
  .delete(protect, adminOnly, deleteTeacher)
  .put(protect, adminOnly, updateTeacher); // 🔥 Naya Route

export default router;