import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  admissionNumber: string;
  studentName: string;
  guardianName: string;
  contactNumber: string;
  department: string;
  classId: mongoose.Types.ObjectId;
  section: string;
  monthlyFee: number;
  admissionFee: number;
  discountAmount: number;       // 🔥 Naya Field
  installmentPlan: string;      // 🔥 Naya Field
  status: 'active' | 'inactive';
}

const studentSchema = new Schema<IStudent>({
  admissionNumber: { type: String, unique: true },
  studentName: { type: String, required: true },
  guardianName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  department: { type: String, required: true },
  classId: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  section: { type: String, required: true },
  monthlyFee: { type: Number, required: true },
  admissionFee: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },     // 🔥 Naya Field
  installmentPlan: { type: String, default: 'None' }, // 🔥 Naya Field
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

// Auto Generate Admission Number (0001, 0002...)
studentSchema.pre('save', async function () {
  if (this.isNew) {
    const lastStudent = await mongoose.model('Student').findOne().sort({ admissionNumber: -1 });
    if (lastStudent && lastStudent.admissionNumber) {
      const nextId = parseInt(lastStudent.admissionNumber) + 1;
      this.admissionNumber = String(nextId).padStart(4, '0');
    } else {
      this.admissionNumber = '0001';
    }
  }
});

export const Student = mongoose.model<IStudent>('Student', studentSchema);