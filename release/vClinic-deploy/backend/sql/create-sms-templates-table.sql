-- ==========================================
-- SMS TEMPLATES TABLE FOR ONLINE BOOKING
-- ==========================================
-- Enhanced table to support department-specific and patient-type-specific templates

CREATE TABLE IF NOT EXISTS public.hms_booking_sms_templates (
    template_id SERIAL PRIMARY KEY,
    template_type VARCHAR(50) NOT NULL, -- 'confirmation', 'approved', 'cancellation', 'reminder', 'reschedule'
    dept_code VARCHAR(20), -- NULL = default for all departments (e.g., 'KB', 'KBYC')
    patient_type VARCHAR(10), -- 'DV' (Dịch vụ), 'BH' (Bảo hiểm), NULL = default for all types
    template_content TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sms_templates_type ON public.hms_booking_sms_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_sms_templates_dept ON public.hms_booking_sms_templates(dept_code);
CREATE INDEX IF NOT EXISTS idx_sms_templates_patient_type ON public.hms_booking_sms_templates(patient_type);
CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON public.hms_booking_sms_templates(is_active);

-- Create unique index to prevent duplicate template configurations
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_template_config 
ON public.hms_booking_sms_templates(template_type, COALESCE(dept_code, ''), COALESCE(patient_type, ''));

-- ==========================================
-- DEFAULT SMS TEMPLATES (Migrated from settings)
-- ==========================================
-- These are default templates (dept_code = NULL, patient_type = NULL)
-- They will be used as fallback when no specific template exists

INSERT INTO public.hms_booking_sms_templates (template_type, dept_code, patient_type, template_content, description, is_active) VALUES
('confirmation', NULL, NULL, 
'Xin chào {patientName}. Lịch khám của bạn đã được xác nhận:
- Khoa: {specialty}
- Ngày: {date}
- Giờ: {time}
- STT: {queueNumber}
Vui lòng đến trước 15 phút. Hotline: {hotline}',
'Default confirmation template for all departments and patient types', TRUE),

('approved', NULL, NULL,
'Chúc mừng {patientName}! Lịch khám vào {date} lúc {time} đã được duyệt. Khoa: {specialty}. STT: {queueNumber}. Hotline: {hotline}',
'Default approval template for all departments and patient types', TRUE),

('cancellation', NULL, NULL,
'Xin chào {patientName}. Lịch khám ngày {date} lúc {time} đã bị hủy. Lý do: {reason}. Vui lòng liên hệ Hotline: {hotline} để được hỗ trợ.',
'Default cancellation template for all departments and patient types', TRUE),

('reminder', NULL, NULL,
'Nhắc lịch khám: {patientName} có lịch khám tại {specialty} vào ngày mai {date} lúc {time}. Vui lòng đến trước 15 phút. Hotline: {hotline}',
'Default reminder template for all departments and patient types', TRUE),

('reschedule', NULL, NULL,
'Xin chào {patientName}. Lịch khám đã được đổi sang {newDate} lúc {newTime}. Khoa: {specialty}. Hotline: {hotline}',
'Default reschedule template for all departments and patient types', TRUE);

-- ==========================================
-- EXAMPLE SPECIFIC TEMPLATES
-- ==========================================
-- Example: KB (Khám bệnh) - Dịch vụ
INSERT INTO public.hms_booking_sms_templates (template_type, dept_code, patient_type, template_content, description, is_active) VALUES
('confirmation', 'KB', 'DV',
'Xin chào {patientName}. Lịch khám DỊCH VỤ của bạn đã được xác nhận:
- Khoa: {specialty}
- Ngày: {date}
- Giờ: {time}
- STT: {queueNumber}
Vui lòng đến trước 15 phút và mang theo CMND/CCCD. Hotline: {hotline}',
'Confirmation template for KB department - Dịch vụ patients', TRUE);

-- Example: KB (Khám bệnh) - Bảo hiểm
INSERT INTO public.hms_booking_sms_templates (template_type, dept_code, patient_type, template_content, description, is_active) VALUES
('confirmation', 'KB', 'BH',
'Xin chào {patientName}. Lịch khám BẢO HIỂM của bạn đã được xác nhận:
- Khoa: {specialty}
- Ngày: {date}
- Giờ: {time}
- STT: {queueNumber}
Vui lòng mang theo: Thẻ BHYT, CMND/CCCD, Giấy chuyển viện (nếu có). Đến trước 15 phút. Hotline: {hotline}',
'Confirmation template for KB department - Bảo hiểm patients', TRUE);

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON TABLE public.hms_booking_sms_templates IS 'SMS templates for online booking system with department and patient type support';
COMMENT ON COLUMN public.hms_booking_sms_templates.template_id IS 'Unique identifier for the template';
COMMENT ON COLUMN public.hms_booking_sms_templates.template_type IS 'Type of template: confirmation, approved, cancellation, reminder, reschedule';
COMMENT ON COLUMN public.hms_booking_sms_templates.dept_code IS 'Department code (e.g., KB, KBYC). NULL = default for all departments';
COMMENT ON COLUMN public.hms_booking_sms_templates.patient_type IS 'Patient type: DV (Dịch vụ), BH (Bảo hiểm). NULL = default for all types';
COMMENT ON COLUMN public.hms_booking_sms_templates.template_content IS 'SMS message content with variables like {patientName}, {date}, etc.';
COMMENT ON COLUMN public.hms_booking_sms_templates.is_active IS 'Whether this template is active and can be used';
