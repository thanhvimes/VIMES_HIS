// ==================== NOTIFICATION SERVICE ====================
// File: backend/src/services/notification.service.js

require('dotenv').config();
const smsTemplateService = require('./sms-template.service');
const settingsService = require('./settings.service');

class NotificationService {

  /**
   * Gửi SMS
   * @param {string} phone - Số điện thoại
   * @param {string} type - Loại thông báo (booking_confirmation, booking_cancellation, etc.)
   * @param {object} data - Dữ liệu để format message
   */
  async sendSMS(phone, type, data) {
    // 1. Kiểm tra cấu hình hệ thống
    const isSMSEnabled = await settingsService.getValue('notification_sms_enabled', true);
    if (!isSMSEnabled) {
      console.log(`[NotificationService] SMS channel is disabled. Skipping ${type} to ${phone}`);
      return { success: false, message: 'SMS channel disabled' };
    }

    // 2. Kiểm tra cấu hình cho từng loại sự kiện
    const eventSettingMap = {
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
    let templateContent = null;
    try {
      const mappedType = this._mapType(type);
      // We need deptCode and patientType for effective template selection
      // If not provided in data, it will fallback to default template
      const template = await smsTemplateService.getTemplate(
        mappedType,
        data.deptId || null,
        data.patientType || null
      );

      if (template && template.template_content) {
        templateContent = this._formatMessage(template.template_content, data);
      }
    } catch (error) {
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
   * @param {string} email - Email address
   * @param {string} type - Loại thông báo
   * @param {object} data - Dữ liệu để format message
   */
  async sendEmail(email, type, data) {
    // 1. Kiểm tra cấu hình hệ thống
    const isEmailEnabled = await settingsService.getValue('notification_email_enabled', false);
    if (!isEmailEnabled) {
      console.log(`[NotificationService] Email channel is disabled. Skipping ${type} to ${email}`);
      return { success: false, message: 'Email channel disabled' };
    }

    // 2. Kiểm tra cấu hình cho từng loại sự kiện (Dùng chung với SMS)
    const eventSettingMap = {
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

    // TODO: Implement real Email providers
    // if (provider === 'gmail') return this._sendGmailEmail(email, type, data);
    // if (provider === 'sendgrid') return this._sendSendgridEmail(email, type, data);

    throw new Error(`Unknown Email provider: ${provider}`);
  }

  // ==================== MOCK IMPLEMENTATIONS ====================

  _sendMockSMS(phone, type, data, dynamicContent = null) {
    // Fallback hardcoded messages if dynamic template is not available
    const fallbacks = {
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

  _sendMockEmail(email, type, data) {
    const subjects = {
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

  /**
   * Gửi SMS qua Caresoft API
   * @param {string} phone - Số điện thoại
   * @param {string} type - Loại thông báo
   * @param {object} data - Dữ liệu để format message
   */
  async _sendCaresoftSMS(phone, type, data, dynamicContent = null) {
    const axios = require('axios');

    const url = process.env.SMS_CARESOFT_URL || 'https://api.caresoft.vn/benhvienk/api/v1/sms';
    const token = process.env.SMS_CARESOFT_TOKEN || 'hl70lbLhwLJqsAk';
    const serviceId = process.env.SMS_CARESOFT_SERVICE_ID || '214';

    // Fallback hardcoded messages if dynamic template is not available
    const fallbacks = {
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
      console.log('📱 [CARESOFT SMS] Sending...');
      console.log(`   To: ${phone}`);
      console.log(`   Type: ${type}`);
      console.log(`   Message: ${content}`);

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('   Status: ✅ Sent successfully');
      console.log(`   Response: ${JSON.stringify(response.data)}`);

      return {
        success: true,
        provider: 'caresoft',
        messageId: response.data.messageId || `SMS-${Date.now()}`,
        phone,
        message: content,
        response: response.data
      };

    } catch (error) {
      console.error('❌ [CARESOFT SMS] Error:');
      console.error(`   Status Code: ${error.response?.status}`);
      console.error(`   Reason: ${error.response?.statusText}`);
      console.error(`   Response: ${JSON.stringify(error.response?.data)}`);
      console.error(`   Payload sent: ${JSON.stringify(payload)}`);

      if (error.response) {
        throw new Error(`SMS Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else {
        throw new Error(`SMS Exception: ${error.message}`);
      }
    }
  }

  // ==================== OTHER PROVIDER IMPLEMENTATIONS ====================
  // Uncomment and implement when ready to use other providers

  /*
  async _sendEsmsSMS(phone, type, data) {
    const apiKey = process.env.SMS_API_KEY;
    const secretKey = process.env.SMS_SECRET_KEY;
    
    // TODO: Implement ESMS.vn API
    // https://esms.vn/
    
    return {
      success: true,
      provider: 'esms',
      messageId: 'xxx'
    };
  }
 
  async _sendVietguysSMS(phone, type, data) {
    const apiKey = process.env.SMS_API_KEY;
    
    // TODO: Implement Vietguys API
    // https://vietguys.biz/
    
    return {
      success: true,
      provider: 'vietguys',
      messageId: 'xxx'
    };
  }
 
  async _sendGmailEmail(email, type, data) {
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: process.env.EMAIL_SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS
      }
    });
 
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Subject here',
      html: '<p>HTML content here</p>'
    };
 
    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      provider: 'gmail',
      messageId: info.messageId
    };
  }
 
  async _sendSendgridEmail(email, type, data) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
 
    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'Subject here',
      html: '<p>HTML content here</p>'
    };
 
    await sgMail.send(msg);
    
    return {
      success: true,
      provider: 'sendgrid',
      messageId: 'xxx'
    };
  }
  */

  // ==================== HELPERS ====================

  _mapType(type) {
    const map = {
      'booking_confirmation': 'confirmation',
      'booking_approved': 'approved',
      'booking_cancellation': 'cancellation',
      'booking_reminder': 'reminder',
      'booking_reschedule': 'reschedule'
    };
    return map[type] || 'confirmation';
  }

  _formatMessage(template, data) {
    if (!template) return '';
    let message = template;
    const placeholders = {
      '{patientName}': data.patientName || data.name || 'Ong/Ba',
      '{bookingId}': data.bookingId || '',
      '{date}': data.date || data.bookingDate || '',
      '{time}': data.time || data.bookingTime || '',
      '{specialty}': data.specialtyName || data.specialty || '',
      '{roomName}': data.roomName || '',
      '{queueNumber}': data.queueNumber || data.receptNo || '',
      '{hotline}': process.env.SMS_HOTLINE || '190088664'
    };

    for (const [placeholder, value] of Object.entries(placeholders)) {
      // Escape special characters in placeholder for regex
      const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      message = message.replace(new RegExp(escapedPlaceholder, 'g'), value);
    }
    return message;
  }
}

module.exports = new NotificationService();
