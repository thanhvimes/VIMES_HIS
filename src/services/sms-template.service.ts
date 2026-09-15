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
     * Get SMS template with 4-level fallback logic based on dept_code (qms_deptid) and patient_type
     * Priority:
     * 1. Specific dept_code + Specific patient_type (BH/DV)
     * 2. Specific dept_code + ALL patient_types (NULL / ALL)
     * 3. Global dept_code (NULL / ALL) + Specific patient_type (BH/DV)
     * 4. Global dept_code (NULL / ALL) + ALL patient_types (NULL / ALL)
     */
    async getTemplate(templateType: string, deptCode: any = null, patientType: any = null): Promise<SMSTemplate | null> {
        const deptCodeStr = deptCode !== null && deptCode !== undefined && String(deptCode).trim() !== '' && String(deptCode) !== 'ALL'
            ? String(deptCode).trim()
            : null;

        // Build patientTypes array for matching.
        // If patientType is empty/null → treat as global (match ALL or NULL patient_type in DB)
        let patientTypes: string[] = [];
        const hasPatientType = patientType !== null && patientType !== undefined &&
            String(patientType).trim() !== '' && String(patientType).trim().toUpperCase() !== 'ALL';

        if (hasPatientType) {
            const pt = String(patientType).trim().toUpperCase();
            if (pt === 'BH' || pt === 'I' || pt === 'BHYT') {
                patientTypes = ['BH', 'I', 'BHYT'];
            } else if (pt === 'DV' || pt === 'S') {
                patientTypes = ['DV', 'S'];
            } else {
                patientTypes = [pt];
            }
        }

        // ---------------------------------------------------------------
        // CRITICAL FIX: In PostgreSQL, "column = NULL" is ALWAYS FALSE.
        // We must use "IS NULL" when deptCodeStr is null.
        // Therefore we build the query dynamically based on whether we
        // have a real dept code or not.
        // ---------------------------------------------------------------

        let sql: string;
        let params: any[];

        if (deptCodeStr !== null && hasPatientType) {
            // Both dept and patient type are known → full 4-level priority
            sql = `
                SELECT template_id, template_type, dept_code, patient_type,
                       template_content, description, is_active
                FROM hms_booking_sms_templates
                WHERE template_type = $1
                  AND is_active = TRUE
                  AND (
                      (dept_code = $2 AND patient_type = ANY($3::text[]))
                      OR (dept_code = $2 AND (patient_type IS NULL OR patient_type = '' OR patient_type = 'ALL'))
                      OR ((dept_code IS NULL OR dept_code = '' OR dept_code = 'ALL') AND patient_type = ANY($3::text[]))
                      OR ((dept_code IS NULL OR dept_code = '' OR dept_code = 'ALL') AND (patient_type IS NULL OR patient_type = '' OR patient_type = 'ALL'))
                  )
                ORDER BY
                    CASE
                        WHEN dept_code = $2 AND patient_type = ANY($3::text[]) THEN 1
                        WHEN dept_code = $2 AND (patient_type IS NULL OR patient_type = '' OR patient_type = 'ALL') THEN 2
                        WHEN (dept_code IS NULL OR dept_code = '' OR dept_code = 'ALL') AND patient_type = ANY($3::text[]) THEN 3
                        WHEN (dept_code IS NULL OR dept_code = '' OR dept_code = 'ALL') AND (patient_type IS NULL OR patient_type = '' OR patient_type = 'ALL') THEN 4
                        ELSE 5
                    END
                LIMIT 1
            `;
            params = [templateType, deptCodeStr, patientTypes];

        } else if (deptCodeStr !== null && !hasPatientType) {
            // dept known, patientType not specified → match dept-specific or global fallback
            sql = `
                SELECT template_id, template_type, dept_code, patient_type,
                       template_content, description, is_active
                FROM hms_booking_sms_templates
                WHERE template_type = $1
                  AND is_active = TRUE
                  AND (
                      (dept_code = $2 AND (patient_type IS NULL OR patient_type = '' OR patient_type = 'ALL'))
                      OR ((dept_code IS NULL OR dept_code = '' OR dept_code = 'ALL') AND (patient_type IS NULL OR patient_type = '' OR patient_type = 'ALL'))
                  )
                ORDER BY
                    CASE
                        WHEN dept_code = $2 THEN 1
                        ELSE 2
                    END
                LIMIT 1
            `;
            params = [templateType, deptCodeStr];

        } else if (deptCodeStr === null && hasPatientType) {
            // dept unknown, patientType known → match patientType-specific global or full global
            sql = `
                SELECT template_id, template_type, dept_code, patient_type,
                       template_content, description, is_active
                FROM hms_booking_sms_templates
                WHERE template_type = $1
                  AND is_active = TRUE
                  AND (dept_code IS NULL OR dept_code = '' OR dept_code = 'ALL')
                  AND (
                      (patient_type = ANY($2::text[]))
                      OR (patient_type IS NULL OR patient_type = '' OR patient_type = 'ALL')
                  )
                ORDER BY
                    CASE
                        WHEN patient_type = ANY($2::text[]) THEN 1
                        ELSE 2
                    END
                LIMIT 1
            `;
            params = [templateType, patientTypes];

        } else {
            // Neither dept nor patientType → pure global fallback
            sql = `
                SELECT template_id, template_type, dept_code, patient_type,
                       template_content, description, is_active
                FROM hms_booking_sms_templates
                WHERE template_type = $1
                  AND is_active = TRUE
                  AND (dept_code IS NULL OR dept_code = '' OR dept_code = 'ALL')
                  AND (patient_type IS NULL OR patient_type = '' OR patient_type = 'ALL')
                LIMIT 1
            `;
            params = [templateType];
        }

        const result = await query(sql, params);

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
            ON CONFLICT (template_type, COALESCE(dept_code, ''), COALESCE(patient_type, ''))
            DO UPDATE SET
                template_content = EXCLUDED.template_content,
                description = COALESCE(EXCLUDED.description, hms_booking_sms_templates.description),
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP,
                updated_by = EXCLUDED.created_by
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

    /**
     * Create a log entry for a sent SMS
     */
    async createSMSLog(logData: {
        bookingId?: number | null;
        patientName?: string | null;
        phone: string;
        deptCode?: string | null;
        patientType?: string | null;
        smsType: string;
        messageContent: string;
        provider?: string;
        providerMessageId?: string | null;
        status?: 'SUCCESS' | 'FAILED' | 'PENDING';
        errorMessage?: string | null;
    }): Promise<any> {
        try {
            const sql = `
                INSERT INTO hms_booking_sms_logs
                (booking_id, patient_name, phone, dept_code, patient_type, sms_type, message_content, provider, provider_message_id, status, error_message, sent_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
                RETURNING *
            `;
            const result = await query(sql, [
                logData.bookingId || null,
                logData.patientName || null,
                logData.phone,
                logData.deptCode || null,
                logData.patientType || null,
                logData.smsType,
                logData.messageContent,
                logData.provider || 'mock',
                logData.providerMessageId || null,
                logData.status || 'PENDING',
                logData.errorMessage || null
            ]);
            return result.rows[0];
        } catch (error: any) {
            console.error('❌ Error creating SMS log:', error.message);
            return null;
        }
    }

    /**
     * Get SMS log history for a specific booking
     */
    async getSMSLogsByBooking(bookingId: number): Promise<any[]> {
        const sql = `
            SELECT log_id, booking_id, patient_name, phone, dept_code, patient_type,
                   sms_type, message_content, provider, provider_message_id, status,
                   error_message, sent_at
            FROM hms_booking_sms_logs
            WHERE booking_id = $1
            ORDER BY sent_at DESC
        `;
        const result = await query(sql, [bookingId]);
        return result.rows;
    }
}

export default new SMSTemplateService();
