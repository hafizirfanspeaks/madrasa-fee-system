import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'teacher';
  permissions: {
    canCollectFee: boolean;
    canRegisterStudent: boolean;
    canDeleteStudent: boolean;
    canManageClasses: boolean;
  };
  status: 'active' | 'inactive';
  matchPassword(enteredPassword: string): Promise<boolean>; // Naya method
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'teacher'], default: 'teacher' },
  permissions: {
    canCollectFee: { type: Boolean, default: true },
    canRegisterStudent: { type: Boolean, default: false },
    canDeleteStudent: { type: Boolean, default: false },
    canManageClasses: { type: Boolean, default: false },
  },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
}, { timestamps: true });

// Password Hash karne ka logic (Save hone se pehle)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password compare karne ka method
userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);