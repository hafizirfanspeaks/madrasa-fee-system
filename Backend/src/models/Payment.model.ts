import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  studentId: mongoose.Types.ObjectId;
  amountPaid: number;
  balance: number;
  month: string;
  year: string;
  receiptNo: string;
  paymentDate: Date;
  collectedBy: mongoose.Types.ObjectId;
  isWaived: boolean; // 🔥 Naya field
}

const paymentSchema = new Schema<IPayment>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  amountPaid: { type: Number, required: true },
  balance: { type: Number, required: true, default: 0 },
  month: { type: String, required: true },
  year: { type: String, required: true },
  receiptNo: { type: String, unique: true },
  paymentDate: { type: Date, default: Date.now },
  collectedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isWaived: { type: Boolean, default: false }, // 🔥 Naya field
}, { timestamps: true });

// Auto Generate Receipt Number
paymentSchema.pre('save', async function () {
  if (this.isNew) {
    const lastPayment = await mongoose.model('Payment').findOne().sort({ receiptNo: -1 });
    if (lastPayment && lastPayment.receiptNo) {
      const lastNumber = parseInt(lastPayment.receiptNo.split('-')[1]);
      this.receiptNo = `REC-${String(lastNumber + 1).padStart(4, '0')}`;
    } else {
      this.receiptNo = 'REC-0001';
    }
  }
});

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);