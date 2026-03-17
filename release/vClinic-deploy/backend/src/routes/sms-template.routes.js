// ==========================================
// SMS TEMPLATE ROUTES
// ==========================================

const express = require('express');
const router = express.Router();
const smsTemplateController = require('../controllers/sms-template.controller');

// Get metadata
router.get('/meta/types', smsTemplateController.getTemplateTypes.bind(smsTemplateController));
router.get('/meta/patient-types', smsTemplateController.getPatientTypes.bind(smsTemplateController));

// CRUD operations
router.get('/', smsTemplateController.getAllTemplates.bind(smsTemplateController));
router.get('/:type/:deptCode/:patientType', smsTemplateController.getTemplate.bind(smsTemplateController));
router.post('/', smsTemplateController.createTemplate.bind(smsTemplateController));
router.put('/:id', smsTemplateController.updateTemplate.bind(smsTemplateController));
router.delete('/:id', smsTemplateController.deleteTemplate.bind(smsTemplateController));

module.exports = router;
