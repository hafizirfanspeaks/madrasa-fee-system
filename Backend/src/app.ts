import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
dotenv.config();

// Database Import
import { connectDB } from './config/db.js';

// Routes Import
import authRoutes from './routes/auth.routes.js';
import classRoutes from './routes/class.routes.js';
import studentRoutes from './routes/student.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import userRoutes from './routes/user.routes.js';
import reportRoutes from './routes/report.routes.js';
import settingsRoutes from './routes/settings.routes.js'; // 🔥 Settings import kiya
// import feeStructureRoutes from './routes/feeStructure.routes.js'; // 🔥 Fee Structure import kiya
// import courseRoutes from './routes/course.routes.js'; // 🔥 Course import kiya

const app = express();

// Middlewares
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));

// 🔥 Database Connection Middleware (Vercel ke liye zaroori hai)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('DB Connection Error:', error);
    res.status(500).json({ message: 'Database connection failed' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes); // 🔥 Settings route add kiya
// app.use('/api/fee-structures', feeStructureRoutes); // 🔥 Fee Structure route add kiya
// app.use('/api/courses', courseRoutes); // 🔥 Course route add kiya

// Test Route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Madarsa Fee Management API is running!' });
});

export default app;