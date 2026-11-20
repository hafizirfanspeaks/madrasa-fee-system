import { Response } from 'express';
import { Student } from '../models/Student.model.js';
import { Payment } from '../models/Payment.model.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import mongoose from 'mongoose';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, classId } = req.query;

    let matchStage: any = {};

    // 1. Date Filter (Daily / Monthly)
    if (startDate && endDate) {
      matchStage.paymentDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(new Date(endDate as string).setHours(23, 59, 59, 999))
      };
    }

    // 2. Class Filter
    if (classId && classId !== 'All') {
      const students = await Student.find({ classId: new mongoose.Types.ObjectId(classId as string) }).select('_id');
      const studentIds = students.map(s => s._id);
      matchStage.studentId = { $in: studentIds };
    }

    // Total Students
    let studentQuery: any = {};
    if (classId && classId !== 'All') {
      studentQuery.classId = classId;
    }
    const totalStudents = await Student.countDocuments(studentQuery);

    // Total Collected
    const collectedData = await Payment.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } }
    ]);
    const totalCollected = collectedData.length > 0 ? collectedData[0].total : 0;

    // Total Pending (Balance)
    const pendingData = await Payment.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: "$balance" } } }
    ]);
    const totalPending = pendingData.length > 0 ? pendingData[0].total : 0;

    // Class-wise Breakdown (Chart/List ke liye)
    const classWiseData = await Payment.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'classes',
          localField: 'student.classId',
          foreignField: '_id',
          as: 'class'
        }
      },
      { $unwind: '$class' },
      {
        $group: {
          _id: '$class._id',
          className: { $first: '$class.className' },
          totalCollected: { $sum: '$amountPaid' }
        }
      },
      { $sort: { totalCollected: -1 } } // Zyada collection wali class upar
    ]);

    res.status(200).json({
      success: true,
      data: { totalStudents, totalCollected, totalPending, classWiseData }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};