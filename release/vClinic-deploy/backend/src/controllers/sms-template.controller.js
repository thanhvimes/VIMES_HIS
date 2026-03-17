// ==========================================
// SMS TEMPLATE CONTROLLER
// ==========================================
// API endpoints for managing SMS templates

const smsTemplateService = require('../services/sms-template.service');

class SMSTemplateController {
    /**
     * GET /api/v1/sms-templates
     * Get all SMS templates with optional filters
     */
    async getAllTemplates(req, res) {
        try {
            const { templateType, deptCode, patientType, isActive, effective } = req.query;

            if (effective === 'true') {
                const templates = await smsTemplateService.getEffectiveTemplates(
                    deptCode === 'null' ? null : deptCode,
                    patientType === 'null' ? null : patientType
                );
                return res.json({
                    success: true,
                    data: templates,
                    count: templates.length
                });
            }

            const filters = {
                templateType,
                deptCode: deptCode === 'null' ? null : deptCode,
                patientType: patientType === 'null' ? null : patientType,
                isActive: isActive !== undefined ? isActive === 'true' : undefined
            };

            const templates = await smsTemplateService.getAllTemplates(filters);

            res.json({
                success: true,
                data: templates,
                count: templates.length
            });
        } catch (error) {
            console.error('Error fetching SMS templates:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch SMS templates',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v1/sms-templates/:type/:deptCode/:patientType
     * Get specific template with fallback
     */
    async getTemplate(req, res) {
        try {
            const { type, deptCode, patientType } = req.params;

            const template = await smsTemplateService.getTemplate(
                type,
                deptCode === 'null' ? null : deptCode,
                patientType === 'null' ? null : patientType
            );

            res.json({
                success: true,
                data: template
            });
        } catch (error) {
            console.error('Error fetching SMS template:', error);
            res.status(404).json({
                success: false,
                error: 'Template not found',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/sms-templates
     * Create new SMS template
     */
    async createTemplate(req, res) {
        try {
            const { template_type, dept_code, patient_type, template_content, description } = req.body;
            const createdBy = req.user?.userId || 'system';

            if (!template_type || !template_content) {
                return res.status(400).json({
                    success: false,
                    error: 'template_type and template_content are required'
                });
            }

            const template = await smsTemplateService.createTemplate({
                templateType: template_type,
                deptCode: dept_code,
                patientType: patient_type,
                templateContent: template_content,
                description,
                createdBy
            });

            res.status(201).json({
                success: true,
                data: template,
                message: 'Template created successfully'
            });
        } catch (error) {
            console.error('Error creating SMS template:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create template',
                message: error.message
            });
        }
    }

    /**
     * PUT /api/v1/sms-templates/:id
     * Update SMS template
     */
    async updateTemplate(req, res) {
        try {
            const { id } = req.params;
            const { template_content, description, is_active } = req.body;
            const updatedBy = req.user?.userId || 'system';

            const template = await smsTemplateService.updateTemplate(id, {
                templateContent: template_content,
                description,
                isActive: is_active,
                updatedBy
            });

            res.json({
                success: true,
                data: template,
                message: 'Template updated successfully'
            });
        } catch (error) {
            console.error('Error updating SMS template:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update template',
                message: error.message
            });
        }
    }

    /**
     * DELETE /api/v1/sms-templates/:id
     * Delete SMS template
     */
    async deleteTemplate(req, res) {
        try {
            const { id } = req.params;
            const success = await smsTemplateService.deleteTemplate(id);

            if (!success) {
                return res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            }

            res.json({
                success: true,
                message: 'Template deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting SMS template:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete template',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v1/sms-templates/meta/types
     * Get available template types
     */
    getTemplateTypes(req, res) {
        try {
            const types = smsTemplateService.getTemplateTypes();
            res.json({
                success: true,
                data: types
            });
        } catch (error) {
            console.error('Error fetching template types:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch template types',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v1/sms-templates/meta/patient-types
     * Get available patient types
     */
    getPatientTypes(req, res) {
        try {
            const types = smsTemplateService.getPatientTypes();
            res.json({
                success: true,
                data: types
            });
        } catch (error) {
            console.error('Error fetching patient types:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch patient types',
                message: error.message
            });
        }
    }
}

module.exports = new SMSTemplateController();
