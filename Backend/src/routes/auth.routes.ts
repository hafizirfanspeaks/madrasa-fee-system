import { Router } from 'express';
import { registerUser, loginUser, updateProfile } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// Naya Route: Profile Update karne ke liye (Protect yani login zaroori hai)
router.put('/profile', protect, updateProfile);

export default router;