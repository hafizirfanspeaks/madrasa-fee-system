import { Router } from 'express';
import { collectFee, getPayments, getStudentPayments, waivePayment, deletePayment } from '../controllers/payment.controller.js';
import { protect, checkPermission, adminOnly } from '../middleware/auth.middleware.js';

const router = Router();

router.route('/')
  .post(protect, checkPermission('canCollectFee'), collectFee)
  .get(protect, getPayments);

router.route('/student/:studentId')
  .get(protect, getStudentPayments);

// Sirf Admin fees maaf kar sakta hai
router.route('/:id/waive')
  .patch(protect, adminOnly, waivePayment);

// 🔥 Naya Route: Payment Delete karne ke liye (Sirf Admin)
router.route('/:id')
  .delete(protect, adminOnly, deletePayment);

export default router;