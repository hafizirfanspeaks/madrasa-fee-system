import { Router } from 'express';
import { 
  createStudent, 
  getStudents, 
  deleteStudent, 
  updateStudent,
  bulkImportStudents // 🔥 NAYA: Import function
} from '../controllers/student.controller.js';
import { protect, checkPermission } from '../middleware/auth.middleware.js';

const router = Router();

router.route('/')
  .post(protect, checkPermission('canRegisterStudent'), createStudent)
  .get(protect, getStudents);

// 🔥 NAYA: Bulk Import Route (Isko /:id se PEHLE rakhna zaroori hai)
router.post('/bulk-import', protect, checkPermission('canRegisterStudent'), bulkImportStudents);

router.route('/:id')
  .delete(protect, checkPermission('canDeleteStudent'), deleteStudent)
  .put(protect, checkPermission('canRegisterStudent'), updateStudent);

export default router;