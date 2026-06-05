// ==================== AUTH ROUTES ====================
// File: backend/src/routes/auth.routes.ts

import express from 'express';
import authController from '../controllers/auth/auth.controller';
import authMiddleware from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/login', authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser.bind(authController));
router.put('/update-profile', authMiddleware, authController.updateProfile.bind(authController));

export default router;
