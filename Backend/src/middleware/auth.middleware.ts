import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model.js';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!token) {
        res.status(401).json({ message: 'Not authorized, token missing' });
        return;
      }
      
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);
      req.user = await User.findById(decoded.id).select('-password');
      
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
    return;
  }
};

export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin only.' });
  }
};

// 🔥 Naya Middleware: Specific Permission check karne ke liye
export const checkPermission = (permissionName: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    // Agar Admin hai, toh usko sab ki ijazat hai
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // Agar Teacher hai, toh uski specific permission check karein
    if (req.user && req.user.permissions && req.user.permissions[permissionName]) {
      return next();
    }

    res.status(403).json({ message: 'اجازت نہیں ہے (Access Denied)' });
  };
};