import { Request, Response } from 'express';
import { Student } from '../models/Student.model.js';
import { Class } from '../models/Class.model.js'; // 🔥 NAYA: Class model import kiya

// 1. Naya Student Add karna
export const createStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const newStudent = await Student.create(req.body);
    res.status(201).json({ success: true, data: newStudent });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2. Saare Students dekhna
export const getStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const students = await Student.find().populate('classId', 'className monthlyFee');
    res.status(200).json({ success: true, data: students });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Student Delete karna
export const deleteStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Student.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: 'Student deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Student Update karna (Edit / Class Promotion)
export const updateStudent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const updatedStudent = await Student.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedStudent) {
      res.status(404).json({ message: 'طالب علم نہیں ملا' });
      return;
    }

    res.status(200).json({ success: true, data: updatedStudent });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 🔥 5. NAYA: Bulk Import Students (Excel Data)
export const bulkImportStudents = async (req: Request, res: Response): Promise<void> => {
  try {
    const { students } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      res.status(400).json({ success: false, message: 'Koi data nahi mila.' });
      return;
    }

    const errors: any[] = [];
    const validStudents: any[] = [];

    // Pichla admission number nikalain taake naye generate kiye ja sakein
    const lastStudent = await Student.findOne().sort({ admissionNumber: -1 });
    let nextId = lastStudent && lastStudent.admissionNumber ? parseInt(lastStudent.admissionNumber) + 1 : 1;

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      
      try {
        // Validation: Zaroori fields check karein
        if (!row.studentName || !row.guardianName || !row.contactNumber || !row.className) {
          throw new Error('Zaroori fields (Name, Father Name, Contact, Class) khali hain.');
        }

        // Class Name se Class ID nikalain
        const classDoc = await Class.findOne({ className: row.className.trim() });
        if (!classDoc) {
          throw new Error(`Class '${row.className}' database mein nahi mili.`);
        }

        // Admission Number generate karein (0001, 0002...)
        const admissionNumber = String(nextId).padStart(4, '0');
        nextId++;

        // Data ko model ke mutabiq tayar karein
        validStudents.push({
          admissionNumber,
          studentName: row.studentName,
          guardianName: row.guardianName,
          contactNumber: row.contactNumber,
          department: row.department || 'General',
          classId: classDoc._id,
          section: row.section || 'A',
          monthlyFee: Number(row.monthlyFee) || classDoc.monthlyFee || 0,
          admissionFee: Number(row.admissionFee) || 0,
          discountAmount: Number(row.discountAmount) || 0,
          installmentPlan: row.installmentPlan || 'None',
          status: 'active'
        });

      } catch (err: any) {
        errors.push({ row: i + 2, message: err.message, data: row });
      }
    }

    // Database mein bulk insert karein
    let insertedCount = 0;
    if (validStudents.length > 0) {
      const result = await Student.insertMany(validStudents, { ordered: false });
      insertedCount = result.length;
    }

    res.status(200).json({
      success: true,
      message: `${insertedCount} students import ho gaye.`,
      insertedCount,
      failedCount: errors.length,
      errors,
    });

  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};