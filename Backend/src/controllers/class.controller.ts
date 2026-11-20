import { Request, Response } from 'express';
import { Class } from '../models/Class.model.js';

export const createClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const newClass = await Class.create(req.body);
    res.status(201).json({ success: true, data: newClass });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getClasses = async (req: Request, res: Response): Promise<void> => {
  try {
    const classes = await Class.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: classes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔥 Naya Function: Class Update karna
export const updateClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const updatedClass = await Class.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedClass) {
      res.status(404).json({ message: 'کلاس نہیں ملی' });
      return;
    }
    res.status(200).json({ success: true, data: updatedClass });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔥 Naya Function: Class Delete karna
export const deleteClass = async (req: Request, res: Response): Promise<void> => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'کلاس ڈیلیٹ کر دی گئی' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};