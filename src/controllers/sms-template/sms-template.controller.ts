// ==========================================
// SMS TEMPLATE CONTROLLER
// File: backend/src/controllers/sms-template.controller.ts
// ==========================================

import { Request, Response } from 'express';
import smsTemplateService from '../../services/sms-template.service';
import { AuthRequest } from '../../middleware/authMiddleware';

class SMSTemplateController {
    /**
     * GET /api/v1/sms-templates
     */
    async getAllTemplates(req: Request, res: Response) {
        try {
            const { templateType, deptCode, patientType, isActive, effective } = (req as any).query;

            if (effective === 'true') {
                const templates = await smsTemplateService.getEffectiveTemplates(
                    deptCode === 'null' ? null : (deptCode as string),
                    patientType === 'null' ? null : (patientType as string)
                );
                return res.json({
                    success: true,
                    data: templates,
                    count: templates.length
                });
            }

            const filters = {
                templateType: templateType as string,
                deptCode: deptCode === 'null' ? null : (deptCode as string),
                patientType: patientType === 'null' ? null : (patientType as string),
                isActive: isActive !== undefined ? isActive === 'true' : undefined
            };

            const templates = await smsTemplateService.getAllTemplates(filters);

            return res.json({
                success: true,
                data: templates,
                count: templates.length
            });
        } catch (error: any) {
            console.error('Error fetching SMS templates:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch SMS templates',
                message: error.message
            });
        }
    }

    /**
     * GET /api/v1/sms-templates/:type/:deptCode/:patientType
     */
    async getTemplate(req: Request, res: Response) {
        try {
            const { type, deptCode, patientType } = (req as any).params;

            const template = await smsTemplateService.getTemplate(
                type as string,
                deptCode === 'null' ? null : (deptCode as string),
                patientType === 'null' ? null : (patientType as string)
            );

            return res.json({
                success: true,
                data: template
            });
        } catch (error: any) {
            console.error('Error fetching SMS template:', error);
            return res.status(404).json({
                success: false,
                error: 'Template not found',
                message: error.message
            });
        }
    }

    /**
     * POST /api/v1/sms-templates
     */
    async createTemplate(req: AuthRequest, res: Response) {
        try {
            const { template_type, dept_code, patient_type, template_content, description } = (req as any).body;
            const createdBy = req.userId || 'system';

            if (!template_type || !template_content) {
                return res.status(400).json({
                    success: false,
                    error: 'template_type and template_content are required'
                });
            }

            const template = await smsTemplateService.createTemplate({
                template_type,
                dept_code,
                patient_type,
                template_content,
                description,
                createdBy: String(createdBy)
            } as any);
            return res.status(201).json({
                success: true,
                data: template,
                message: 'Template created successfully'
            });
        } catch (error: any) {
            console.error('Error creating SMS template:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to create template',
                message: error.message
            });
        }
    }

    /**
     * PUT /api/v1/sms-templates/:id
     */
    async updateTemplate(req: AuthRequest, res: Response) {
        try {
            const { id } = (req as any).params;
            const { template_content, description, is_active } = (req as any).body;
            const updatedBy = req.userId || 'system';
            const template = await smsTemplateService.updateTemplate(Number(id), {
                template_content,
                description,
                is_active,
                updatedBy: String(updatedBy)
            } as any);

            return res.json({
                success: true,
                data: template,
                message: 'Template updated successfully'
            });
        } catch (error: any) {
            console.error('Error updating SMS template:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to update template',
                message: error.message
            });
        }
    }

    /**
     * DELETE /api/v1/sms-templates/:id
     */
    async deleteTemplate(req: Request, res: Response) {
        try {
            const { id } = (req as any).params;
            const success = await smsTemplateService.deleteTemplate(Number(id));
            if (!success) {
                return res.status(404).json({
                    success: false,
                    error: 'Template not found'
                });
            }

            return res.json({
                success: true,
                message: 'Template deleted successfully'
            });
        } catch (error: any) {
            console.error('Error deleting SMS template:', error);
            return res.status(500).json({
                success: false,
                error: 'Failed to delete template',
                message: error.message
            });
        }
    }

    /**
     * Meta getters
     */
    getTemplateTypes(req: Request, res: Response) {
        try {
            const types = smsTemplateService.getTemplateTypes();
            return res.json({
                success: true,
                data: types
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch template types',
                message: error.message
            });
        }
    }

    getPatientTypes(req: Request, res: Response) {
        try {
            const types = smsTemplateService.getPatientTypes();
            return res.json({
                success: true,
                data: types
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                error: 'Failed to fetch patient types',
                message: error.message
            });
        }
    }
}

export default new SMSTemplateController();
