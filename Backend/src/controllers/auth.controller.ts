import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

// JWT Token generate karne ka function
const generateToken = (id: string) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET as string, 
    { expiresIn: '30d' as jwt.SignOptions['expiresIn'] }
  );
};

// 1. Register API
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id.toString()),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Login API
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          token: generateToken(user._id.toString()),
        },
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Update Profile API (Name & Password)
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      
      // Agar naya password diya gaya hai
      if (req.body.password && req.body.password.trim() !== '') {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.status(200).json({
        success: true,
        data: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          permissions: updatedUser.permissions,
          token: generateToken(updatedUser._id.toString()), // Naya token generate kiya
        },
      });
    } else {
      res.status(404).json({ message: 'صارف نہیں ملا' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};