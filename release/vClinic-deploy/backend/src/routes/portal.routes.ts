// ==================== PORTAL ROUTES ====================
// File: backend/src/routes/portal.routes.ts

import express from 'express';
import authMiddleware from '../middleware/authMiddleware';

// Sub-controllers
import portalAuth from '../controllers/portal/auth.controller';
import portalHistory from '../controllers/portal/history.controller';
import portalProfile from '../controllers/portal/profile.controller';
import portalPayment from '../controllers/portal/payment.controller';

const router = express.Router();

// ── AUTH (Public) ────────────────────────────────
router.post('/login', portalAuth.login.bind(portalAuth));
router.post('/activate', portalAuth.activateAccount.bind(portalAuth));

// ── HISTORY (Protected) ─────────────────────────
router.get('/history', authMiddleware, portalHistory.getHistoryList.bind(portalHistory));
router.get('/history/:visitId', authMiddleware, portalHistory.getHistoryDetail.bind(portalHistory));
router.post('/documents/download', authMiddleware, portalHistory.downloadHisPdf.bind(portalHistory));
router.post('/reports/signed-file', authMiddleware, portalHistory.getSignedFile.bind(portalHistory));

// ── PROFILE (Protected) ─────────────────────────
router.post('/link', authMiddleware, portalProfile.linkProfile.bind(portalProfile));
router.get('/profiles', authMiddleware, portalProfile.getProfiles.bind(portalProfile));
router.post('/profiles', authMiddleware, portalProfile.createProfile.bind(portalProfile));
router.put('/profiles/:id', authMiddleware, portalProfile.updateProfile.bind(portalProfile));
router.delete('/profiles/:id', authMiddleware, portalProfile.deleteProfile.bind(portalProfile));

// ── BILLING & APPOINTMENTS (Protected) ──────────
router.get('/invoices', authMiddleware, portalPayment.getInvoices.bind(portalPayment));
router.get('/appointments', authMiddleware, portalPayment.getUpcomingAppointments.bind(portalPayment));

// ── PAYMENT (Protected) ─────────────────────────
router.post('/payment/generate-qr', authMiddleware, portalPayment.generatePaymentQR.bind(portalPayment));
router.get('/payment/status/:billId', authMiddleware, portalPayment.checkPaymentStatus.bind(portalPayment));
router.post('/payment/complete', authMiddleware, portalPayment.completePayment.bind(portalPayment));

export default router;
