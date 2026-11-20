import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  madarsaName: string;
  address: string;
  phone: string;
  email: string;
  footerText: string;
}

const settingsSchema = new Schema<ISettings>({
  madarsaName: { type: String, default: 'مدرسہ فیض القرآن' },
  address: { type: String, default: '1-K-3, Al Hasan Chowk, Nazimabad, No. 1' },
  phone: { type: String, default: '0300-1234567' },
  email: { type: String, default: 'IrfanzSolutions@gmail.com' },
  footerText: { type: String, default: 'Prepared by Irfanz Solutions' },
}, { timestamps: true });

export const Settings = mongoose.model<ISettings>('Settings', settingsSchema);