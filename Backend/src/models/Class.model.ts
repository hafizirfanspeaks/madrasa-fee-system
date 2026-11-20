import mongoose, { Schema, Document } from 'mongoose';

export interface IClass extends Document {
  className: string;
  sections: string[];
  admissionFee: number;
  monthlyFee: number;
  nextClassId?: mongoose.Types.ObjectId;
}

const classSchema = new Schema<IClass>({
  className: { type: String, required: true, unique: true },
  sections: [{ type: String, required: true }],
  admissionFee: { type: Number, required: true, default: 0 },
  monthlyFee: { type: Number, required: true, default: 0 },
  nextClassId: { type: Schema.Types.ObjectId, ref: 'Class' },
}, { timestamps: true });

export const Class = mongoose.model<IClass>('Class', classSchema);