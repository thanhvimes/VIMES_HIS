// ==================== AUTH ROUTES ====================
// File: backend/src/routes/auth.routes.ts

import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();
const controller = new AuthController();

// Public routes (không cần authentication)
router.post('/login', (req, res) => controller.login(req, res));
router.post('/logout', (req, res) => controller.logout(req, res));

// Protected routes (cần authentication)
router.get('/me', authMiddleware, (req, res) => controller.getCurrentUser(req, res));

export default router;
