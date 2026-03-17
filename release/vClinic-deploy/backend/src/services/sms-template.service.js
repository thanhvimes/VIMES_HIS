// ==========================================
// SMS TEMPLATE SERVICE
// ==========================================
// Manages SMS templates with department and patient type support

const pool = require('../config/database');

class SMSTemplateService {
    /**
     * Get SMS template with fallback logic
     * Priority: specific dept+type > dept only > type only > default
     * 
     * @param {string} templateType - 'confirmation', 'approved', 'cancellation', 'reminder', 'reschedule'
     * @param {string} deptCode - Department code (e.g., 'KB', 'KBYC')
     * @param {string} patientType - 'DV' (Dịch vụ) or 'BH' (Bảo hiểm)
     * @returns {Promise<object>} Template object with content
     */
    async getTemplate(templateType, deptCode = null, patientType = null) {
        // Try to find template with priority:
        // 1. Exact match (dept + patient type)
        // 2. Department only match
        // 3. Patient type only match  
        // 4. Default (no dept, no type)

        const query = `
            SELECT template_id, template_type, dept_code, patient_type, 
                   template_content, description, is_active
            FROM hms_booking_sms_templates
            WHERE template_type = $1
              AND is_active = TRUE
              AND (
                  -- Priority 1: Exact match
                  (dept_code = $2 AND patient_type = $3)
                  OR
                  -- Priority 2: Department only
                  (dept_code = $2 AND patient_type IS NULL)
                  OR
                  -- Priority 3: Patient type only
                  (dept_code IS NULL AND patient_type = $3)
                  OR
                  -- Priority 4: Default
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

        const result = await pool.query(query, [templateType, deptCode, patientType]);

        if (result.rows.length === 0) {
            throw new Error(`No template found for type: ${templateType}`);
        }

        return result.rows[0];
    }

    /**
     * Get all SMS templates with fallback for a specific context
     * Returns one template for each type, picking the best match
     * 
     * @param {string} deptCode 
     * @param {string} patientType 
     * @returns {Promise<array>} Array of 5 effective templates
     */
    async getEffectiveTemplates(deptCode = null, patientType = null) {
        const types = this.getTemplateTypes();
        const effectiveTemplates = [];

        for (const type of types) {
            try {
                const template = await this.getTemplate(type, deptCode, patientType);
                effectiveTemplates.push(template);
            } catch (error) {
                // If even default fails, skip or handle (should not happen with default setup)
                console.error(`Error getting effective template for ${type}:`, error.message);
            }
        }

        return effectiveTemplates;
    }

    /**
     * Get all SMS templates (for management UI)
     * @param {object} filters - Optional filters { templateType, deptCode, patientType, isActive }
     * @returns {Promise<array>} Array of templates
     */
    async getAllTemplates(filters = {}) {
        let query = `
            SELECT template_id, template_type, dept_code, patient_type,
                   template_content, description, is_active,
                   created_by, created_at, updated_by, updated_at
            FROM hms_booking_sms_templates
            WHERE 1=1
        `;

        const params = [];
        let paramIndex = 1;

        if (filters.templateType) {
            query += ` AND template_type = $${paramIndex}`;
            params.push(filters.templateType);
            paramIndex++;
        }

        if (filters.deptCode !== undefined) {
            if (filters.deptCode === null) {
                query += ` AND dept_code IS NULL`;
            } else {
                query += ` AND dept_code = $${paramIndex}`;
                params.push(filters.deptCode);
                paramIndex++;
            }
        }

        if (filters.patientType !== undefined) {
            if (filters.patientType === null) {
                query += ` AND patient_type IS NULL`;
            } else {
                query += ` AND patient_type = $${paramIndex}`;
                params.push(filters.patientType);
                paramIndex++;
            }
        }

        if (filters.isActive !== undefined) {
            query += ` AND is_active = $${paramIndex}`;
            params.push(filters.isActive);
            paramIndex++;
        }

        query += ` ORDER BY template_type, dept_code NULLS FIRST, patient_type NULLS FIRST`;

        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Create new SMS template
     * @param {object} templateData - Template data
     * @returns {Promise<object>} Created template
     */
    async createTemplate(templateData) {
        const { templateType, deptCode, patientType, templateContent, description, createdBy } = templateData;

        const query = `
            INSERT INTO hms_booking_sms_templates 
            (template_type, dept_code, patient_type, template_content, description, created_by, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, TRUE)
            RETURNING *
        `;

        const result = await pool.query(query, [
            templateType,
            deptCode || null,
            patientType || null,
            templateContent,
            description || null,
            createdBy || 'system'
        ]);

        return result.rows[0];
    }

    /**
     * Update SMS template
     * @param {number} templateId - Template ID
     * @param {object} updates - Fields to update
     * @returns {Promise<object>} Updated template
     */
    async updateTemplate(templateId, updates) {
        const { templateContent, description, isActive, updatedBy } = updates;

        const query = `
            UPDATE hms_booking_sms_templates
            SET template_content = COALESCE($1, template_content),
                description = COALESCE($2, description),
                is_active = COALESCE($3, is_active),
                updated_by = $4,
                updated_at = CURRENT_TIMESTAMP
            WHERE template_id = $5
            RETURNING *
        `;

        const result = await pool.query(query, [
            templateContent,
            description,
            isActive,
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
     * @param {number} templateId - Template ID
     * @returns {Promise<boolean>} Success
     */
    async deleteTemplate(templateId) {
        const query = `DELETE FROM hms_booking_sms_templates WHERE template_id = $1`;
        const result = await pool.query(query, [templateId]);
        return result.rowCount > 0;
    }

    /**
     * Get template types
     * @returns {array} Array of template types
     */
    getTemplateTypes() {
        return ['confirmation', 'approved', 'cancellation', 'reminder', 'reschedule'];
    }

    /**
     * Get patient types
     * @returns {array} Array of patient types
     */
    getPatientTypes() {
        return [
            { code: 'DV', name: 'Dịch vụ' },
            { code: 'BH', name: 'Bảo hiểm' }
        ];
    }
}

// Export singleton instance
module.exports = new SMSTemplateService();
