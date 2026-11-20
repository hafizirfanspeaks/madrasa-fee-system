import { Request, Response } from 'express';
import { User } from '../models/User.model.js';

export const createTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, permissions } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) { res.status(400).json({ message: 'یہ ای میل پہلے سے رجسٹرڈ ہے' }); return; }

    const teacher = await User.create({
      name, email, password, role: 'teacher',
      permissions: permissions || { canCollectFee: false, canRegisterStudent: false, canDeleteStudent: false, canManageClasses: false },
    });
    res.status(201).json({ success: true, data: teacher });
  } catch (error: any) { res.status(500).json({ message: error.message }); }
};

export const getTeachers = async (req: Request, res: Response): Promise<void> => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    res.status(200).json({ success: true, data: teachers });
  } catch (error: any) { res.status(500).json({ message: error.message }); }
};

export const deleteTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'استاد کا اکاؤنٹ ڈیلیٹ کر دیا گیا' });
  } catch (error: any) { res.status(500).json({ message: error.message }); }
};

// 🔥 Naya: Teacher Update Function
export const updateTeacher = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, password, permissions } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) { res.status(404).json({ message: 'اکاؤنٹ نہیں ملا' }); return; }

    user.name = name;
    if (permissions) user.permissions = { ...user.permissions, ...permissions };
    if (password && password.trim() !== '') user.password = password; // Hashing handled in Model pre-save

    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error: any) { res.status(500).json({ message: error.message }); }
};