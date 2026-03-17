// ==================== NOTIFICATION SERVICE ====================
// File: backend/src/services/notification.service.js

require('dotenv').config();

class NotificationService {

  /**
   * Gửi SMS
   * @param {string} phone - Số điện thoại
   * @param {string} type - Loại thông báo (booking_confirmation, booking_cancellation, etc.)
   * @param {object} data - Dữ liệu để format message
   */
  async sendSMS(phone, type, data) {
    const provider = process.env.SMS_PROVIDER || 'mock';

    if (provider === 'mock') {
      return this._sendMockSMS(phone, type, data);
    }

    // TODO: Implement real SMS providers
    // if (provider === 'esms') return this._sendEsmsSMS(phone, type, data);
    // if (provider === 'vietguys') return this._sendVietguysSMS(phone, type, data);

    throw new Error(`Unknown SMS provider: ${provider}`);
  }

  /**
   * Gửi Email
   * @param {string} email - Email address
   * @param {string} type - Loại thông báo
   * @param {object} data - Dữ liệu để format message
   */
  async sendEmail(email, type, data) {
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

  _sendMockSMS(phone, type, data) {
    const messages = {
      booking_confirmation: `[${process.env.SMS_BRAND_NAME || 'VIMES'}] Xin chao ${data.name}. Lich kham cua ban: ${data.date} luc ${data.time}. STT: ${data.receptNo}. Vui long den dung gio.`,
      booking_approved: `[${process.env.SMS_BRAND_NAME || 'VIMES'}] Chuc mung ${data.name}! Lich kham vao ${data.date} luc ${data.time} da duoc duyet. STT: ${data.receptNo}.`,
      booking_cancellation: `[${process.env.SMS_BRAND_NAME || 'VIMES'}] Lich kham cua ban ngay ${data.date} luc ${data.time} da bi huy. Ly do: ${data.reason || 'Khong ro'}`,
      booking_reminder: `[${process.env.SMS_BRAND_NAME || 'VIMES'}] Nhac nho: Ban co lich kham vao ${data.date} luc ${data.time}. STT: ${data.receptNo}. Vui long den dung gio.`,
      booking_reschedule: `[${process.env.SMS_BRAND_NAME || 'VIMES'}] Lich kham cua ban da duoc doi sang ${data.newDate} luc ${data.newTime}.`
    };

    const message = messages[type] || 'Thong bao tu VIMES';

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
  // Uncomment and implement when ready to use real providers

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
}

module.exports = new NotificationService();
