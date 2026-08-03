// ==================== CATALOG ROUTES ====================
// File: backend/src/routes/catalog.routes.ts

import express from 'express';
import catalogController from '../controllers/catalog/catalog.controller';

const router = express.Router();

router.get('/provinces', catalogController.getProvinces.bind(catalogController));
router.get('/districts/:provinceId', catalogController.getDistricts.bind(catalogController));
router.get('/wards/:provinceId', catalogController.getWards.bind(catalogController));
router.get('/departments', catalogController.getDepartments.bind(catalogController));
router.get('/rooms', catalogController.getRooms.bind(catalogController));
router.get('/ethnicities', catalogController.getEthnicities.bind(catalogController));
router.get('/occupations', catalogController.getOccupations.bind(catalogController));
router.get('/examtypes', catalogController.getExamTypes.bind(catalogController));
router.get('/objects', catalogController.getObjects.bind(catalogController));
router.get('/hospitals', catalogController.getHospitals.bind(catalogController));
router.get('/icd10', catalogController.searchIcd10.bind(catalogController));

export default router;
