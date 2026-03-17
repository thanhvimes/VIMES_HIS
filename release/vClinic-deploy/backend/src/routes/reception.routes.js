// ==================== RECEPTION ROUTES (JavaScript) ====================
// File: backend/src/routes/reception.routes.js

const express = require('express');
const router = express.Router();
const receptionController = require('../controllers/reception.controller');

router.get('/patients', (req, res) => receptionController.getPatients(req, res));
router.get('/patients/:id', (req, res) => receptionController.getPatientById(req, res));
router.post('/patients', (req, res) => receptionController.createPatient(req, res));
router.put('/patients/:id', (req, res) => receptionController.updatePatient(req, res));
router.get('/queue', (req, res) => receptionController.getQueueStatus(req, res));
router.post('/queue/next', (req, res) => receptionController.callNextPatient(req, res));

module.exports = router;
