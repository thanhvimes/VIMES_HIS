// ==========================================
// ENHANCED NOTIFICATION SERVICE WITH DYNAMIC TEMPLATES
// ==========================================
// Uses settings from database for SMS/Email templates

const settingsService = require('./settings.service');

class NotificationServiceEnhanced {
    constructor() {
        this.templateCache = new Map();
    }

    /**
     * Send SMS with dynamic template
     */
    async sendSMS(phone, templateKey, variables) {
        try {
            // Get template from settings
            const template = await this.getTemplate(templateKey);
            if (!template) {
                throw new Error(`SMS template not found: ${templateKey}`);
            }

            // Replace variables in template
            const message = this.replaceVariables(template, variables);

            // Get notification settings
            const smsEnabled = await settingsService.getValue('notification_sms_enabled', true);
            if (!smsEnabled) {
                console.log('📱 SMS notifications are disabled');
                return { success: false, reason: 'SMS disabled' };
            }

            // Send SMS (using existing SMS provider logic)
            const provider = process.env.SMS_PROVIDER || 'mock';
            console.log(`\n========== SMS NOTIFICATION ==========`);
            console.log(`Provider: ${provider}`);
            console.log(`To: ${phone}`);
            console.log(`Template: ${templateKey}`);
            console.log(`Message:\n${message}`);
            console.log(`======================================\n`);

            // Mock implementation for now
            return { success: true, messageId: `SMS-${Date.now()}` };

        } catch (error) {
            console.error('Error sending SMS:', error);
            throw error;
        }
    }

    /**
     * Send booking confirmation SMS
     */
    async sendBookingConfirmation(booking) {
        const variables = await this.buildBookingVariables(booking);
        return await this.sendSMS(
            booking.phone,
            'sms_template_confirmation',
            variables
        );
    }

    /**
     * Send booking approval SMS
     */
    async sendBookingApproval(booking) {
        const variables = await this.buildBookingVariables(booking);
        return await this.sendSMS(
            booking.phone,
            'sms_template_approved',
            variables
        );
    }

    /**
     * Send booking cancellation SMS
     */
    async sendBookingCancellation(booking, reason) {
        const variables = await this.buildBookingVariables(booking);
        variables.reason = reason || 'Không rõ';
        return await this.sendSMS(
            booking.phone,
            'sms_template_cancellation',
            variables
        );
    }

    /**
     * Send booking reminder SMS
     */
    async sendBookingReminder(booking) {
        const variables = await this.buildBookingVariables(booking);
        return await this.sendSMS(
            booking.phone,
            'sms_template_reminder',
            variables
        );
    }

    /**
     * Send booking reschedule SMS
     */
    async sendBookingReschedule(booking, newDate, newTime) {
        const variables = await this.buildBookingVariables(booking);
        variables.newDate = newDate;
        variables.newTime = newTime;
        return await this.sendSMS(
            booking.phone,
            'sms_template_reschedule',
            variables
        );
    }

    /**
     * Get template from settings (with caching)
     */
    async getTemplate(templateKey) {
        // Check cache first
        if (this.templateCache.has(templateKey)) {
            return this.templateCache.get(templateKey);
        }

        // Get from settings
        const template = await settingsService.getValue(templateKey);
        if (template) {
            this.templateCache.set(templateKey, template);
        }

        return template;
    }

    /**
     * Build variables object from booking data
     */
    async buildBookingVariables(booking) {
        // Get general settings
        const hospitalName = await settingsService.getValue('general_hospital_name', 'VIMES');
        const hotline = await settingsService.getValue('general_hotline', '1900886684');

        return {
            patientName: booking.patientName || booking.name,
            date: this.formatDate(booking.date || booking.appointmentDate),
            time: booking.time || booking.appointmentTime,
            specialty: booking.specialty || booking.deptName,
            queueNumber: booking.queueNumber || booking.receptNo || '',
            bookingId: booking.bookingId || booking.idx,
            hospitalName: hospitalName,
            hotline: hotline
        };
    }

    /**
     * Replace variables in template
     * Supports: {variableName} format
     */
    replaceVariables(template, variables) {
        let result = template;

        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{${key}}`;
            result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value || '');
        }

        return result;
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        if (!date) return '';

        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();

        return `${day}/${month}/${year}`;
    }

    /**
     * Clear template cache
     */
    clearCache() {
        this.templateCache.clear();
    }
}

// Export singleton instance
module.exports = new NotificationServiceEnhanced();
