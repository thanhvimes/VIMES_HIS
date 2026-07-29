// ==========================================
// SMS TEMPLATE SERVICE
// ==========================================
// Manages SMS templates with department and patient type support

import { query } from '../config/database';

export interface SMSTemplate {
    template_id: number;
    template_type: string;
    dept_code: string | null;
    patient_type: string | null;
    template_content: string;
    description: string | null;
    is_active: boolean;
    created_by?: string;
    created_at?: Date;
    updated_by?: string;
    updated_at?: Date;
}

export interface TemplateFilters {
    templateType?: string;
    deptCode?: string | null;
    patientType?: string | null;
    isActive?: boolean | string;
}

class SMSTemplateService {
    /**
     * Get SMS template with fallback logic
     * Priority: specific dept+type > dept only > type only > default
     */
    async getTemplate(templateType: string, deptCode: any = null, patientType: any = null): Promise<SMSTemplate | null> {
        const deptCodeStr = deptCode !== null && deptCode !== undefined ? String(deptCode) : null;
        const patientTypeStr = patientType !== null && patientType !== undefined ? String(patientType) : null;

        const sql = `
            SELECT template_id, template_type, dept_code, patient_type, 
                   template_content, description, is_active
            FROM hms_booking_sms_templates
            WHERE template_type = $1
              AND is_active = TRUE
              AND (
                  (dept_code = $2 AND patient_type = $3)
                  OR
                  (dept_code = $2 AND patient_type IS NULL)
                  OR
                  (dept_code IS NULL AND patient_type = $3)
                  OR
                  (dept_code IS NULL AND patient_type IS NULL)
              )
            ORDER BY 
                CASE 
                    WHEN dept_code = $2 AND patient_type = $3 THEN 1
                    WHEN dept_code = $2 AND patient_type IS NULL THEN 2
                    WHEN dept_code IS NULL AND patient_type = $3 THEN 3
                    WHEN dept_code IS NULL AND patient_type IS NULL THEN 4
                END
            LIMIT 1
        `;

        const result = await query(sql, [templateType, deptCodeStr, patientTypeStr]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    }

    /**
     * Get all SMS templates with fallback for a specific context
     */
    async getEffectiveTemplates(deptCode: string | null = null, patientType: string | null = null): Promise<SMSTemplate[]> {
        const types = this.getTemplateTypes();
        const effectiveTemplates: SMSTemplate[] = [];

        for (const type of types) {
            try {
                const template = await this.getTemplate(type, deptCode, patientType);
                if (template) effectiveTemplates.push(template);
            } catch (error: any) {
                console.error(`Error getting effective template for ${type}:`, error.message);
            }
        }

        return effectiveTemplates;
    }

    /**
     * Get all SMS templates (for management UI)
     */
    async getAllTemplates(filters: TemplateFilters = {}): Promise<SMSTemplate[]> {
        let sql = `
            SELECT template_id, template_type, dept_code, patient_type,
                   template_content, description, is_active,
                   created_by, created_at, updated_by, updated_at
            FROM hms_booking_sms_templates
            WHERE 1=1
        `;

        const params: any[] = [];
        let paramIndex = 1;

        if (filters.templateType) {
            sql += ` AND template_type = $${paramIndex}`;
            params.push(filters.templateType);
            paramIndex++;
        }

        if (filters.deptCode !== undefined) {
            if (filters.deptCode === null) {
                sql += ` AND dept_code IS NULL`;
            } else {
                sql += ` AND dept_code = $${paramIndex}`;
                params.push(filters.deptCode);
                paramIndex++;
            }
        }

        if (filters.patientType !== undefined) {
            if (filters.patientType === null) {
                sql += ` AND patient_type IS NULL`;
            } else {
                sql += ` AND patient_type = $${paramIndex}`;
                params.push(filters.patientType);
                paramIndex++;
            }
        }

        if (filters.isActive !== undefined) {
            sql += ` AND is_active = $${paramIndex}`;
            params.push(filters.isActive);
            paramIndex++;
        }

        sql += ` ORDER BY template_type, dept_code NULLS FIRST, patient_type NULLS FIRST`;

        const result = await query(sql, params);
        return result.rows;
    }

    /**
     * Create new SMS template
     */
    async createTemplate(templateData: Partial<SMSTemplate> & { createdBy?: string }): Promise<SMSTemplate> {
        const { template_type, dept_code, patient_type, template_content, description, createdBy } = templateData;

        const sql = `
            INSERT INTO hms_booking_sms_templates 
            (template_type, dept_code, patient_type, template_content, description, created_by, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, TRUE)
            RETURNING *
        `;

        const result = await query(sql, [
            template_type,
            dept_code || null,
            patient_type || null,
            template_content,
            description || null,
            createdBy || 'system'
        ]);

        return result.rows[0];
    }

    /**
     * Update SMS template
     */
    async updateTemplate(templateId: number, updates: Partial<SMSTemplate> & { updatedBy?: string }): Promise<SMSTemplate> {
        const { template_content, description, is_active, updatedBy } = updates;

        const sql = `
            UPDATE hms_booking_sms_templates
            SET template_content = COALESCE($1, template_content),
                description = COALESCE($2, description),
                is_active = COALESCE($3, is_active),
                updated_by = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE template_id = $5
            RETURNING *
        `;

        const result = await query(sql, [
            template_content !== undefined ? template_content : null,
            description !== undefined ? description : null,
            is_active !== undefined ? is_active : null,
            updatedBy || 'system',
            templateId
        ]);

        if (result.rows.length === 0) {
            throw new Error(`Template not found: ${templateId}`);
        }

        return result.rows[0];
    }

    /**
     * Delete SMS template
     */
    async deleteTemplate(templateId: number): Promise<boolean> {
        const sql = `DELETE FROM hms_booking_sms_templates WHERE template_id = $1`;
        const result = await query(sql, [templateId]);
        return (result.rowCount ?? 0) > 0;
    }

    /**
     * Get template types
     */
    getTemplateTypes(): string[] {
        return ['confirmation', 'approved', 'cancellation', 'reminder', 'reschedule'];
    }

    /**
     * Get patient types
     */
    getPatientTypes(): { code: string; name: string }[] {
        return [
            { code: 'DV', name: 'Dịch vụ' },
            { code: 'BH', name: 'Bảo hiểm' }
        ];
    }
}

export default new SMSTemplateService();
