// ==================== AUTH ROUTES (JavaScript) ====================
// File: backend/src/routes/auth.routes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Public routes
router.post('/login', (req, res) => authController.login(req, res));
router.post('/logout', (req, res) => authController.logout(req, res));

// Protected routes (cần authentication middleware)
// router.get('/me', authMiddleware, (req, res) => authController.getCurrentUser(req, res));

module.exports = router;
