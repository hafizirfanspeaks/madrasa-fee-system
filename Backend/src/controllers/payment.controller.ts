import { Response } from 'express';
import { Payment } from '../models/Payment.model.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

// 1. Nayi Fee Collect karna
export const collectFee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { studentId, amountPaid, month, year, balance } = req.body;
    
    const payment = await Payment.create({
      studentId,
      amountPaid,
      month,
      year,
      balance: balance || 0,
      collectedBy: req.user._id,
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Saari Payments dekhna
export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find()
      .populate('studentId', 'studentName admissionNumber classId')
      .populate('collectedBy', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Ek specific student ki saari payments dekhna
export const getStudentPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payments = await Payment.find({ studentId: req.params.studentId })
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: payments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Fees Maaf Karna (Waive Off)
export const waivePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    
    if (!payment) {
      res.status(404).json({ message: 'ریکارڈ نہیں ملا' });
      return;
    }

    payment.balance = 0;
    payment.isWaived = true;
    await payment.save();

    res.status(200).json({ success: true, message: 'باقی فیس کامیابی سے معاف کر دی گئی ہے' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 🔥 5. Naya Function: Payment Record Delete karna
export const deletePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findByIdAndDelete(id);
    
    if (!payment) {
      res.status(404).json({ message: 'رسید کا ریکارڈ نہیں ملا' });
      return;
    }

    res.status(200).json({ success: true, message: 'رسید کا ریکارڈ ڈیلیٹ کر دیا گیا' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};