// ==================== RECEPTION ROUTES ====================
// File: backend/src/routes/reception.routes.ts

import express from 'express';

// Sub-controllers
import catalog from '../controllers/reception/catalog.controller';
import patient from '../controllers/reception/patient.controller';
import insurance from '../controllers/reception/insurance.controller';
import { dashboardController } from '../controllers/reception/dashboard.controller';
import reportController from '../controllers/reception/report.controller';
import authMiddleware, { requirePermission } from '../middleware/authMiddleware';

const router = express.Router();

// ── DASHBOARD (Bảng điều khiển) ──────────────────
router.get('/statistics', dashboardController.getStatistics.bind(dashboardController));

// ── CATALOGS (Danh mục) ─────────────────────────
router.get('/catalogs/provinces', catalog.getProvinces.bind(catalog));
router.get('/catalogs/wards/:provinceId', catalog.getWards.bind(catalog));
router.get('/catalogs/departments', catalog.getDepartments.bind(catalog));
router.get('/catalogs/rooms', catalog.getRooms.bind(catalog));
router.get('/catalogs/ethnicities', catalog.getEthnicities.bind(catalog));
router.get('/catalogs/occupations', catalog.getOccupations.bind(catalog));
router.get('/catalogs/examtypes', catalog.getExamTypes.bind(catalog));
router.get('/catalogs/hospitals', catalog.getHospitals.bind(catalog));
router.get('/catalogs/objects', catalog.getObjects.bind(catalog));
router.get('/catalogs/nations', catalog.getNations.bind(catalog));
router.get('/catalogs/relationships', catalog.getRelationships.bind(catalog));
router.get('/catalogs/workplaces', catalog.getWorkplaces.bind(catalog));
router.get('/catalogs/receptionists', catalog.getReceptionists.bind(catalog));
router.get('/catalogs/doctors', catalog.getDoctors.bind(catalog));
router.get('/catalogs', catalog.getCatalogItems.bind(catalog));

// ── TRA CỨU BỆNH NHÂN ──────────────────────────
router.get('/lookup', patient.lookupPatient.bind(patient));

// ── BỆNH NHÂN / HỒ SƠ KHÁM ─────────────────────
router.get('/patients', patient.getPatients.bind(patient));
router.get('/patients/:id', patient.getPatientById.bind(patient));
router.post('/patients', authMiddleware, requirePermission('01.01'), patient.createPatient.bind(patient));
router.post('/patients/:id/register', authMiddleware, requirePermission('01.01'), patient.addDocForExistingPatient.bind(patient));
router.post('/patients/:id/exams', authMiddleware, requirePermission('01.01'), patient.addExamForExistingPatient.bind(patient));
router.put('/patients/:id', authMiddleware, requirePermission('01.02'), patient.updatePatient.bind(patient));
router.put('/patients/:id/terminate', authMiddleware, requirePermission('01.02'), patient.terminateDoc.bind(patient));
router.delete('/patients/:id', authMiddleware, requirePermission('01.03'), patient.deletePatientRegistration.bind(patient));

// ── HÀNG ĐỢI ────────────────────────────────────
router.get('/queue', patient.getQueueStatus.bind(patient));
router.post('/queue/next', patient.callNextPatient.bind(patient));

// ── BHYT (Bảo hiểm y tế) ────────────────────────
router.post('/insurance/check', authMiddleware, insurance.checkBHXHCard.bind(insurance));
router.post('/insurance/save', authMiddleware, insurance.saveInsuranceCard.bind(insurance));

// ── BÁO CÁO ─────────────────────────────────────
router.get('/reports/patient-exam-list', reportController.getPatientExamList.bind(reportController));

// ── CẤU HÌNH (Settings) ─────────────────────────
import settings from '../controllers/reception/settings.controller';
router.get('/settings/printer', authMiddleware, settings.getPrinterConfig.bind(settings));
router.put('/settings/printer', authMiddleware, settings.updatePrinterConfig.bind(settings));
router.get('/settings/rooms', authMiddleware, settings.getRoomsSettings.bind(settings));
router.put('/settings/rooms/:id', authMiddleware, settings.updateRoomSettings.bind(settings));

export default router;
