import { Response } from 'express';
import { Payment } from '../models/Payment.model.js';
import { Student } from '../models/Student.model.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import mongoose from 'mongoose';

// 1. Daily Collection Report
export const getDailyReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const payments = await Payment.find({
      paymentDate: { $gte: startOfDay, $lte: endOfDay }
    })
    .populate({
      path: 'studentId',
      select: 'studentName admissionNumber classId section',
      populate: { path: 'classId', select: 'className' }
    })
    .populate('collectedBy', 'name')
    .sort({ createdAt: -1 });

    const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    res.status(200).json({ success: true, data: { payments, totalCollected } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Pending Fees Report (Month & Class Filter ke sath)
export const getPendingReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classId, month, year } = req.query; 

    // Base condition: Sirf woh records jinki fees baqi hai
    let matchStage: any = { balance: { $gt: 0 } };
    
    // 🔥 Month & Year Filter
    if (month) matchStage.month = month;
    if (year) matchStage.year = year;

    // 🔥 Class Filter
    if (classId && classId !== 'All') {
      const students = await Student.find({ classId: new mongoose.Types.ObjectId(classId as string) }).select('_id');
      const studentIds = students.map(s => s._id);
      matchStage.studentId = { $in: studentIds };
    }

    const pendingPayments = await Payment.find(matchStage)
      .populate({
        path: 'studentId',
        select: 'studentName admissionNumber classId section',
        populate: { path: 'classId', select: 'className' }
      })
      .sort({ createdAt: -1 });

    // 🔥 Data ko Class ke hisaab se sort karein (Sequence)
    pendingPayments.sort((a: any, b: any) => {
      const classA = a.studentId?.classId?.className || '';
      const classB = b.studentId?.classId?.className || '';
      return classA.localeCompare(classB);
    });

    const totalPending = pendingPayments.reduce((sum, p) => sum + p.balance, 0);
    res.status(200).json({ success: true, data: { pendingPayments, totalPending } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Saare Students ka Data (Class-wise sorted)
export const getAllStudentsData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const students = await Student.find()
      .populate('classId', 'className')
      .sort({ 'classId.className': 1, studentName: 1 }); // Class wise sort

    res.status(200).json({ success: true, data: students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};