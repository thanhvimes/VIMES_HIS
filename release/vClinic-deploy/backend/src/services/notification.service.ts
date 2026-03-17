
// ==========================================
// NOTIFICATION SERVICE (Mock Implementation)
// ==========================================

interface SMSConfig {
    provider: 'mock' | 'esms' | 'vietguys' | 'twilio';
    apiKey?: string;
    brandName?: string;
}

interface EmailConfig {
    provider: 'mock' | 'gmail' | 'sendgrid';
    from?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
}

interface BookingInfo {
    bookingId: string;
    patientName: string;
    phone: string;
    email?: string;
    speciality: string;
    date: string;
    time: string;
    queueNumber?: number;
}

export class NotificationService {
    private smsConfig: SMSConfig;
    private emailConfig: EmailConfig;

    constructor() {
        this.smsConfig = {
            provider: (process.env.SMS_PROVIDER as any) || 'mock',
            apiKey: process.env.SMS_API_KEY,
            brandName: process.env.SMS_BRAND_NAME || 'VIMES'
        };

        this.emailConfig = {
            provider: (process.env.EMAIL_PROVIDER as any) || 'mock',
            from: process.env.EMAIL_FROM || 'noreply@vimes.vn',
            smtpHost: process.env.SMTP_HOST,
            smtpPort: parseInt(process.env.SMTP_PORT || '587'),
            smtpUser: process.env.SMTP_USER,
            smtpPass: process.env.SMTP_PASS
        };
    }

    // ==================== SMS METHODS ====================

    /**
     * Gửi SMS xác nhận booking
     */
    async sendBookingConfirmation(booking: BookingInfo): Promise<boolean> {
        const message = this.buildConfirmationMessage(booking);
        return await this.sendSMS(booking.phone, message);
    }

    /**
     * Gửi SMS hủy booking
     */
    async sendBookingCancellation(booking: BookingInfo, reason: string): Promise<boolean> {
        const message = `Xin chào ${booking.patientName}. Lịch khám của bạn ngày ${booking.date} lúc ${booking.time} đã bị hủy. Lý do: ${reason}. Vui lòng liên hệ Hotline: 1900xxxx để được hỗ trợ.`;
        return await this.sendSMS(booking.phone, message);
    }

    /**
     * Gửi SMS nhắc lịch (trước 1 ngày)
     */
    async sendBookingReminder(booking: BookingInfo): Promise<boolean> {
        const message = `Nhắc lịch khám: ${booking.patientName} có lịch khám tại ${booking.speciality} vào ngày mai ${booking.date} lúc ${booking.time}. Vui lòng đến trước 15 phút. Hotline: 1900xxxx`;
        return await this.sendSMS(booking.phone, message);
    }

    /**
     * Gửi SMS đổi lịch
     */
    async sendBookingReschedule(booking: BookingInfo, newDate: string, newTime: string): Promise<boolean> {
        const message = `Xin chào ${booking.patientName}. Lịch khám của bạn đã được đổi sang ngày ${newDate} lúc ${newTime}. Khoa: ${booking.speciality}. Hotline: 1900xxxx`;
        return await this.sendSMS(booking.phone, message);
    }

    /**
     * Core SMS sending method
     */
    private async sendSMS(phone: string, message: string): Promise<boolean> {
        console.log(`\n========== SMS NOTIFICATION ==========`);
        console.log(`Provider: ${this.smsConfig.provider}`);
        console.log(`To: ${phone}`);
        console.log(`Brand: ${this.smsConfig.brandName}`);
        console.log(`Message:\n${message}`);
        console.log(`======================================\n`);

        switch (this.smsConfig.provider) {
            case 'mock':
                // Mock implementation - always success
                await this.delay(500); // Simulate network delay
                return true;

            case 'esms':
                return await this.sendViaEsms(phone, message);

            case 'vietguys':
                return await this.sendViaVietguys(phone, message);

            case 'twilio':
                return await this.sendViaTwilio(phone, message);

            default:
                console.error(`Unknown SMS provider: ${this.smsConfig.provider}`);
                return false;
        }
    }

    // ==================== EMAIL METHODS ====================

    /**
     * Gửi email xác nhận booking
     */
    async sendEmailConfirmation(booking: BookingInfo): Promise<boolean> {
        if (!booking.email) return false;

        const subject = `Xác nhận lịch khám - ${booking.bookingId}`;
        const html = this.buildConfirmationEmailHTML(booking);

        return await this.sendEmail(booking.email, subject, html);
    }

    /**
     * Core Email sending method
     */
    private async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
        console.log(`\n========== EMAIL NOTIFICATION ==========`);
        console.log(`Provider: ${this.emailConfig.provider}`);
        console.log(`From: ${this.emailConfig.from}`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`========================================\n`);

        switch (this.emailConfig.provider) {
            case 'mock':
                // Mock implementation - always success
                await this.delay(500);
                return true;

            case 'gmail':
                return await this.sendViaGmail(to, subject, html);

            case 'sendgrid':
                return await this.sendViaSendgrid(to, subject, html);

            default:
                console.error(`Unknown email provider: ${this.emailConfig.provider}`);
                return false;
        }
    }

    // ==================== HELPER METHODS ====================

    private buildConfirmationMessage(booking: BookingInfo): string {
        let msg = `Xin chào ${booking.patientName}. Lịch khám của bạn đã được xác nhận:\n`;
        msg += `- Khoa: ${booking.speciality}\n`;
        msg += `- Ngày: ${booking.date}\n`;
        msg += `- Giờ: ${booking.time}\n`;
        if (booking.queueNumber) {
            msg += `- Số thứ tự: ${booking.queueNumber}\n`;
        }
        msg += `Vui lòng đến trước 15 phút. Hotline: 1900xxxx`;
        return msg;
    }

    private buildConfirmationEmailHTML(booking: BookingInfo): string {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0d9488; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #0d9488; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Xác nhận lịch khám</h1>
          </div>
          <div class="content">
            <p>Xin chào <strong>${booking.patientName}</strong>,</p>
            <p>Lịch khám của bạn đã được xác nhận với thông tin sau:</p>
            <div class="info-row"><span class="label">Mã booking:</span> ${booking.bookingId}</div>
            <div class="info-row"><span class="label">Chuyên khoa:</span> ${booking.speciality}</div>
            <div class="info-row"><span class="label">Ngày khám:</span> ${booking.date}</div>
            <div class="info-row"><span class="label">Giờ khám:</span> ${booking.time}</div>
            ${booking.queueNumber ? `<div class="info-row"><span class="label">Số thứ tự:</span> ${booking.queueNumber}</div>` : ''}
            <p style="margin-top: 20px;"><strong>Lưu ý:</strong> Vui lòng đến trước 15 phút để làm thủ tục.</p>
          </div>
          <div class="footer">
            <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            <p>Hotline: 1900xxxx | Email: support@vimes.vn</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ==================== PROVIDER IMPLEMENTATIONS ====================
    // These will be implemented when you choose a real provider

    private async sendViaEsms(phone: string, message: string): Promise<boolean> {
        // TODO: Implement ESMS.vn API
        // const response = await fetch('https://rest.esms.vn/MainService.svc/json/SendMultipleMessage_V4_post_json/', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({
        //     ApiKey: this.smsConfig.apiKey,
        //     SecretKey: process.env.SMS_SECRET_KEY,
        //     Phone: phone,
        //     Content: message,
        //     Brandname: this.smsConfig.brandName,
        //     SmsType: 2
        //   })
        // });
        console.warn('ESMS provider not implemented yet. Using mock.');
        return true;
    }

    private async sendViaVietguys(phone: string, message: string): Promise<boolean> {
        // TODO: Implement Vietguys API
        console.warn('Vietguys provider not implemented yet. Using mock.');
        return true;
    }

    private async sendViaTwilio(phone: string, message: string): Promise<boolean> {
        // TODO: Implement Twilio API
        console.warn('Twilio provider not implemented yet. Using mock.');
        return true;
    }

    private async sendViaGmail(to: string, subject: string, html: string): Promise<boolean> {
        // TODO: Implement Gmail SMTP
        // const nodemailer = require('nodemailer');
        // const transporter = nodemailer.createTransporter({...});
        console.warn('Gmail provider not implemented yet. Using mock.');
        return true;
    }

    private async sendViaSendgrid(to: string, subject: string, html: string): Promise<boolean> {
        // TODO: Implement SendGrid API
        console.warn('SendGrid provider not implemented yet. Using mock.');
        return true;
    }
}

// Export singleton instance
export const notificationService = new NotificationService();
