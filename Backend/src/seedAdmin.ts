import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.model.js';

dotenv.config();

const resetAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Database connected...");

    const email = 'admin@madarsa.com';
    const newPassword = 'admin123'; // 🔥 Yeh aapka naya password hoga

    const admin = await User.findOne({ email });

    if (admin) {
      admin.password = newPassword;
      await admin.save(); // Model ka pre-save hook isko hash kar dega
      console.log('✅ Admin ka password kamyabi se reset ho gaya!');
      console.log(`📧 Email: ${email}`);
      console.log(`🔑 New Password: ${newPassword}`);
    } else {
      console.log('❌ Is email se koi user nahi mila!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

resetAdmin();