// ==================== NOTIFICATION SERVICE ====================
// File: backend/src/config/services/notification.service.ts

import dotenv from 'dotenv';
import axios from 'axios';
import smsTemplateService from './sms-template.service';
import settingsService from './settings.service';

dotenv.config();

export interface NotificationData {
    patientName?: string;
    name?: string;
    date?: string;
    bookingDate?: string;
    time?: string;
    bookingTime?: string;
    queueNumber?: string;
    receptNo?: string;
    bookingId?: string | number;
    reason?: string;
    newDate?: string;
    newTime?: string;
    deptId?: string | null;
    patientType?: string | null;
    specialtyName?: string;
    specialty?: string;
    roomName?: string;
}

export type NotificationType =
    | 'booking_confirmation'
    | 'booking_approved'
    | 'booking_cancellation'
    | 'booking_reschedule'
    | 'booking_reminder';

class NotificationService {

    /**
     * Gửi SMS
     * @param phone - Số điện thoại
     * @param type - Loại thông báo
     * @param data - Dữ liệu để format message
     */
    async sendSMS(phone: string, type: NotificationType, data: NotificationData) {
        // 1. Kiểm tra cấu hình hệ thống
        const isSMSEnabled = await settingsService.getValue('notification_sms_enabled', true);
        if (!isSMSEnabled) {
            console.log(`[NotificationService] SMS channel is disabled. Skipping ${type} to ${phone}`);
            return { success: false, message: 'SMS channel disabled' };
        }

        // 2. Kiểm tra cấu hình cho từng loại sự kiện
        const eventSettingMap: Record<string, string> = {
            'booking_confirmation': 'notification_send_on_create',
            'booking_approved': 'notification_send_on_approve',
            'booking_cancellation': 'notification_send_on_cancel',
            'booking_reschedule': 'notification_send_on_reschedule',
            'booking_reminder': 'notification_reminder_enabled'
        };

        const settingKey = eventSettingMap[type];
        if (settingKey) {
            const isEventEnabled = await settingsService.getValue(settingKey, true);
            if (!isEventEnabled) {
                console.log(`[NotificationService] SMS for event ${type} is disabled. Skipping to ${phone}`);
                return { success: false, message: `SMS for ${type} disabled` };
            }
        }

        const provider = process.env.SMS_PROVIDER || 'mock';

        // Get dynamic template from database
        let templateContent: string | null = null;
        try {
            const mappedType = this._mapType(type);
            const template = await smsTemplateService.getTemplate(
                mappedType,
                data.deptId || null,
                data.patientType || null
            );

            if (template && template.template_content) {
                templateContent = this._formatMessage(template.template_content, data);
            }
        } catch (error: any) {
            console.warn(`[NotificationService] No template found for ${type}, using hardcoded fallback.`, error.message);
        }

        if (provider === 'mock') {
            return this._sendMockSMS(phone, type, data, templateContent);
        }

        if (provider === 'caresoft') {
            return this._sendCaresoftSMS(phone, type, data, templateContent);
        }

        throw new Error(`Unknown SMS provider: ${provider}`);
    }

    /**
     * Gửi Email
     * @param email - Email address
     * @param type - Loại thông báo
     * @param data - Dữ liệu để format message
     */
    async sendEmail(email: string, type: NotificationType, data: NotificationData) {
        const isEmailEnabled = await settingsService.getValue('notification_email_enabled', false);
        if (!isEmailEnabled) {
            console.log(`[NotificationService] Email channel is disabled. Skipping ${type} to ${email}`);
            return { success: false, message: 'Email channel disabled' };
        }

        const eventSettingMap: Record<string, string> = {
            'booking_confirmation': 'notification_send_on_create',
            'booking_approved': 'notification_send_on_approve',
            'booking_cancellation': 'notification_send_on_cancel',
            'booking_reschedule': 'notification_send_on_reschedule',
            'booking_reminder': 'notification_reminder_enabled'
        };

        const settingKey = eventSettingMap[type];
        if (settingKey) {
            const isEventEnabled = await settingsService.getValue(settingKey, true);
            if (!isEventEnabled) {
                console.log(`[NotificationService] Email/SMS for event ${type} is disabled. Skipping to ${email}`);
                return { success: false, message: `Email for ${type} disabled` };
            }
        }

        const provider = process.env.EMAIL_PROVIDER || 'mock';

        if (provider === 'mock') {
            return this._sendMockEmail(email, type, data);
        }

        throw new Error(`Unknown Email provider: ${provider}`);
    }

    // ==================== MOCK IMPLEMENTATIONS ====================

    private _sendMockSMS(phone: string, type: NotificationType, data: NotificationData, dynamicContent: string | null = null) {
        const fallbacks: Record<string, string> = {
            booking_confirmation: `[${process.env.SMS_BRAND_NAME || 'VIMES'}] Xin chao ${data.patientName || data.name}. Lich kham cua ban: ${data.date} luc ${data.time}. STT: ${data.queueNumber || data.receptNo}. Vui long den dung gio.`,
            booking_approved: `[${process.env.SMS_BRAND_NAME || 'VIMES'}] Chuc mung ${data.patientName || data.name}! Lich kham vao ${data.date} luc ${data.time} da duoc duyet. STT: ${data.queueNumber || data.receptNo}.`,
            booking_cancellation: `[${process.env.SMS_BRAND_NAME || 'VIMES'}] Lich kham cua ban ngay ${data.date} luc ${data.time} da bi huy. Ly do: ${data.reason || 'Khong ro'}`,
            booking_reminder: `[${process.env.SMS_BRAND_NAME || 'VIMES'}] Nhac nho: Ban co lich kham vao ${data.date} luc ${data.time}. STT: ${data.queueNumber || data.receptNo}. Vui long den dung gio.`,
            booking_reschedule: `[${process.env.SMS_BRAND_NAME || 'VIMES'}] Lich kham cua ban da duoc doi sang ${data.newDate} luc ${data.newTime}.`
        };

        const message = dynamicContent || fallbacks[type] || 'Thong bao tu VIMES';

        console.log('📱 [MOCK SMS]');
        console.log(`   To: ${phone} `);
        console.log(`   Type: ${type} `);
        console.log(`   Message: ${message} `);
        console.log('   Status: ✅ Sent (Mock)');

        return {
            success: true,
            provider: 'mock',
            messageId: `SMS - ${Date.now()} `,
            phone,
            message
        };
    }

    private _sendMockEmail(email: string, type: NotificationType, data: NotificationData) {
        const subjects: Record<string, string> = {
            booking_confirmation: 'Xác nhận đặt lịch khám',
            booking_cancellation: 'Thông báo hủy lịch khám',
            booking_reminder: 'Nhắc nhở lịch khám',
            booking_reschedule: 'Thông báo đổi lịch khám'
        };

        const subject = subjects[type] || 'Thông báo từ VIMES';

        console.log('📧 [MOCK EMAIL]');
        console.log(`   To: ${email} `);
        console.log(`   Subject: ${subject} `);
        console.log(`   Type: ${type} `);
        console.log(`   Data: `, data);
        console.log('   Status: ✅ Sent (Mock)');

        return {
            success: true,
            provider: 'mock',
            messageId: `EMAIL - ${Date.now()} `,
            email,
            subject
        };
    }

    // ==================== REAL PROVIDER IMPLEMENTATIONS ====================

    private async _sendCaresoftSMS(phone: string, type: NotificationType, data: NotificationData, dynamicContent: string | null = null) {
        const url = process.env.SMS_CARESOFT_URL || 'https://api.caresoft.vn/benhvienk/api/v1/sms';
        const token = process.env.SMS_CARESOFT_TOKEN || 'hl70lbLhwLJqsAk';
        const serviceId = process.env.SMS_CARESOFT_SERVICE_ID || '214';

        const fallbacks: Record<string, string> = {
            booking_confirmation: `[BENH VIEN K] Xin chao ${data.patientName || data.name}. Lich kham cua ban: ${data.date} luc ${data.time}. STT: ${data.queueNumber || data.receptNo}. Vui long den dung gio.`,
            booking_approved: `[BENH VIEN K] Chuc mung ${data.patientName || data.name}! Lich kham vao ${data.date} luc ${data.time} da duoc duyet. STT: ${data.queueNumber || data.receptNo}.`,
            booking_cancellation: `[BENH VIEN K] Lich kham cua ban ngay ${data.date} luc ${data.time} da bi huy. Ly do: ${data.reason || 'Khong ro'}`,
            booking_reminder: `[BENH VIEN K] Nhac nho: Ban co lich kham vao ${data.date} luc ${data.time}. STT: ${data.queueNumber || data.receptNo}. Vui long den dung gio.`,
            booking_reschedule: `[BENH VIEN K] Lich kham cua ban da duoc doi sang ${data.newDate} luc ${data.newTime}.`
        };

        const content = dynamicContent || fallbacks[type] || `[BENH VIEN K] Thong bao tu Benh vien K`;

        const payload = {
            sms: {
                service_id: serviceId,
                content,
                phone
            }
        };

        try {
            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                provider: 'caresoft',
                messageId: (response.data as any).messageId || `SMS-${Date.now()}`,
                phone,
                message: content,
                response: response.data
            };

        } catch (error: any) {
            console.error('❌ [CARESOFT SMS] Error:', error.response?.data || error.message);
            throw new Error(`SMS Exception: ${error.message}`);
        }
    }

    // ==================== HELPERS ====================

    private _mapType(type: NotificationType): string {
        const map: Record<NotificationType, string> = {
            'booking_confirmation': 'confirmation',
            'booking_approved': 'approved',
            'booking_cancellation': 'cancellation',
            'booking_reminder': 'reminder',
            'booking_reschedule': 'reschedule'
        };
        return map[type] || 'confirmation';
    }

    private _formatMessage(template: string, data: NotificationData): string {
        if (!template) return '';
        let message = template;
        const placeholders: Record<string, string> = {
            '{patientName}': data.patientName || data.name || 'Ong/Ba',
            '{bookingId}': String(data.bookingId || ''),
            '{date}': data.date || data.bookingDate || '',
            '{time}': data.time || data.bookingTime || '',
            '{specialty}': data.specialtyName || data.specialty || '',
            '{roomName}': data.roomName || '',
            '{queueNumber}': data.queueNumber || data.receptNo || '',
            '{hotline}': process.env.SMS_HOTLINE || '190088664'
        };

        for (const [placeholder, value] of Object.entries(placeholders)) {
            const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            message = message.replace(new RegExp(escapedPlaceholder, 'g'), value);
        }
        return message;
    }
}

export default new NotificationService();
