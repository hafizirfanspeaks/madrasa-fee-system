import { Router } from 'express';
import { createClass, getClasses, updateClass, deleteClass } from '../controllers/class.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';

const router = Router();

router.route('/')
  .post(protect, adminOnly, createClass)
  .get(protect, getClasses);

router.route('/:id')
  .put(protect, adminOnly, updateClass)
  .delete(protect, adminOnly, deleteClass);

export default router;