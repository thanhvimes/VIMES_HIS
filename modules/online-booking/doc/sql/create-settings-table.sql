-- ==========================================
-- SETTINGS TABLE FOR ONLINE BOOKING MODULE
-- ==========================================
-- This table stores all configurable settings for the online booking system
-- including SMS templates, booking rules, business hours, and general configuration

CREATE TABLE IF NOT EXISTS public.hms_booking_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(20) NOT NULL, -- 'string', 'number', 'boolean', 'json'
    category VARCHAR(50) NOT NULL, -- 'sms', 'booking', 'business_hours', 'notification', 'general'
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- System settings cannot be deleted
    updated_by VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster category queries
CREATE INDEX IF NOT EXISTS idx_booking_settings_category ON public.hms_booking_settings(category);

-- ==========================================
-- DEFAULT SMS TEMPLATES
-- ==========================================
-- Variables available: {patientName}, {date}, {time}, {specialty}, {queueNumber}, 
--                      {bookingId}, {hospitalName}, {hotline}, {reason}, {newDate}, {newTime}

INSERT INTO public.hms_booking_settings (setting_key, setting_value, setting_type, category, description, is_system) VALUES
('sms_template_confirmation', 'Xin chào {patientName}. Lịch khám của bạn đã được xác nhận:
- Khoa: {specialty}
- Ngày: {date}
- Giờ: {time}
- STT: {queueNumber}
Vui lòng đến trước 15 phút. Hotline: {hotline}', 'string', 'sms', 'SMS template for booking confirmation', TRUE),

('sms_template_approved', 'Chúc mừng {patientName}! Lịch khám vào {date} lúc {time} đã được duyệt. Khoa: {specialty}. STT: {queueNumber}. Hotline: {hotline}', 'string', 'sms', 'SMS template for booking approval', TRUE),

('sms_template_cancellation', 'Xin chào {patientName}. Lịch khám ngày {date} lúc {time} đã bị hủy. Lý do: {reason}. Vui lòng liên hệ Hotline: {hotline} để được hỗ trợ.', 'string', 'sms', 'SMS template for booking cancellation', TRUE),

('sms_template_reminder', 'Nhắc lịch khám: {patientName} có lịch khám tại {specialty} vào ngày mai {date} lúc {time}. Vui lòng đến trước 15 phút. Hotline: {hotline}', 'string', 'sms', 'SMS template for booking reminder', TRUE),

('sms_template_reschedule', 'Xin chào {patientName}. Lịch khám đã được đổi sang {newDate} lúc {newTime}. Khoa: {specialty}. Hotline: {hotline}', 'string', 'sms', 'SMS template for booking reschedule', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- ==========================================
-- BOOKING RULES
-- ==========================================

INSERT INTO public.hms_booking_settings (setting_key, setting_value, setting_type, category, description, is_system) VALUES
('booking_max_per_slot', '10', 'number', 'booking', 'Maximum bookings per time slot', TRUE),
('booking_advance_days_min', '0', 'number', 'booking', 'Minimum days in advance to book (0 = same day allowed)', TRUE),
('booking_advance_days_max', '30', 'number', 'booking', 'Maximum days in advance to book', TRUE),
('booking_cancellation_hours', '24', 'number', 'booking', 'Hours before appointment to allow patient cancellation', TRUE),
('booking_auto_approve', 'false', 'boolean', 'booking', 'Auto-approve bookings without staff review', TRUE),
('booking_require_phone', 'true', 'boolean', 'booking', 'Require phone number for booking', TRUE),
('booking_require_email', 'false', 'boolean', 'booking', 'Require email for booking', TRUE),
('booking_allow_same_day', 'true', 'boolean', 'booking', 'Allow same-day bookings', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- ==========================================
-- BUSINESS HOURS
-- ==========================================

INSERT INTO public.hms_booking_settings (setting_key, setting_value, setting_type, category, description, is_system) VALUES
('business_hours', '{
  "monday": {"enabled": true, "morning": "07:30-11:30", "afternoon": "13:30-17:00"},
  "tuesday": {"enabled": true, "morning": "07:30-11:30", "afternoon": "13:30-17:00"},
  "wednesday": {"enabled": true, "morning": "07:30-11:30", "afternoon": "13:30-17:00"},
  "thursday": {"enabled": true, "morning": "07:30-11:30", "afternoon": "13:30-17:00"},
  "friday": {"enabled": true, "morning": "07:30-11:30", "afternoon": "13:30-17:00"},
  "saturday": {"enabled": true, "morning": "07:30-11:30", "afternoon": ""},
  "sunday": {"enabled": false, "morning": "", "afternoon": ""}
}', 'json', 'business_hours', 'Weekly business hours configuration', TRUE),

('holidays', '[]', 'json', 'business_hours', 'List of holiday dates (YYYY-MM-DD format)', TRUE),

('special_schedules', '[]', 'json', 'business_hours', 'Special schedules for specific dates', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- ==========================================
-- NOTIFICATION SETTINGS
-- ==========================================

INSERT INTO public.hms_booking_settings (setting_key, setting_value, setting_type, category, description, is_system) VALUES
('notification_sms_enabled', 'true', 'boolean', 'notification', 'Enable SMS notifications', TRUE),
('notification_email_enabled', 'false', 'boolean', 'notification', 'Enable email notifications', TRUE),
('notification_reminder_hours', '24', 'number', 'notification', 'Hours before appointment to send reminder (24 = 1 day before)', TRUE),
('notification_reminder_enabled', 'true', 'boolean', 'notification', 'Enable automatic appointment reminders', TRUE),
('notification_send_on_create', 'true', 'boolean', 'notification', 'Send notification when booking is created', TRUE),
('notification_send_on_approve', 'true', 'boolean', 'notification', 'Send notification when booking is approved', TRUE),
('notification_send_on_cancel', 'true', 'boolean', 'notification', 'Send notification when booking is cancelled', TRUE),
('notification_send_on_reschedule', 'true', 'boolean', 'notification', 'Send notification when booking is rescheduled', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- ==========================================
-- GENERAL SETTINGS
-- ==========================================

INSERT INTO public.hms_booking_settings (setting_key, setting_value, setting_type, category, description, is_system) VALUES
('general_hospital_name', 'Bệnh viện Đa khoa Quốc tế VIMES', 'string', 'general', 'Hospital name for display and SMS', TRUE),
('general_hotline', '1900886684', 'string', 'general', 'Hospital hotline number', TRUE),
('general_email', 'support@vimes.vn', 'string', 'general', 'Hospital support email', TRUE),
('general_address', 'Cầu Bươu, Tân Triều, Thanh Trì, Hà Nội', 'string', 'general', 'Hospital address', TRUE),
('general_website', 'https://vimes.vn', 'string', 'general', 'Hospital website URL', TRUE),
('general_timezone', 'Asia/Ho_Chi_Minh', 'string', 'general', 'Timezone for date/time operations', TRUE),
('general_language', 'vi', 'string', 'general', 'Default language (vi, en)', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- ==========================================
-- DISPLAY SETTINGS
-- ==========================================

INSERT INTO public.hms_booking_settings (setting_key, setting_value, setting_type, category, description, is_system) VALUES
('display_show_queue_number', 'true', 'boolean', 'display', 'Show queue number to patients', TRUE),
('display_show_doctor_name', 'true', 'boolean', 'display', 'Show doctor name in booking form', TRUE),
('display_booking_success_message', 'Cảm ơn bạn đã đăng ký! Chúng tôi sẽ xác nhận lịch khám qua SMS/Email.', 'string', 'display', 'Success message after booking', TRUE),
('display_terms_and_conditions', 'Bằng việc đăng ký, bạn đồng ý với các điều khoản và điều kiện của bệnh viện.', 'string', 'display', 'Terms and conditions text', TRUE)
ON CONFLICT (setting_key) DO NOTHING;

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE public.hms_booking_settings IS 'Configuration settings for online booking system';
COMMENT ON COLUMN public.hms_booking_settings.setting_key IS 'Unique identifier for the setting';
COMMENT ON COLUMN public.hms_booking_settings.setting_value IS 'Value of the setting (stored as text, parsed based on setting_type)';
COMMENT ON COLUMN public.hms_booking_settings.setting_type IS 'Data type: string, number, boolean, or json';
COMMENT ON COLUMN public.hms_booking_settings.category IS 'Category for grouping: sms, booking, business_hours, notification, general, display';
COMMENT ON COLUMN public.hms_booking_settings.is_system IS 'System settings cannot be deleted (but can be modified)';
COMMENT ON COLUMN public.hms_booking_settings.updated_by IS 'User ID who last updated this setting';
COMMENT ON COLUMN public.hms_booking_settings.updated_at IS 'Timestamp of last update';
