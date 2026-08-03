-- =====================================================
-- MIGRATION: 036_create_booking_sms_logs.sql
-- PURPOSE: Tạo bảng lưu nhật ký chi tiết SMS gửi cho bệnh nhân đăng ký khám online
-- =====================================================

CREATE TABLE IF NOT EXISTS public.hms_booking_sms_logs (
    log_id BIGSERIAL PRIMARY KEY,
    booking_id INT REFERENCES public.qms_patient(qms_idx) ON DELETE SET NULL,
    patient_name VARCHAR(100),
    phone VARCHAR(20) NOT NULL,
    dept_code VARCHAR(20),
    patient_type VARCHAR(10), -- 'BH' / 'I' hoặc 'DV' / 'S'
    sms_type VARCHAR(50) NOT NULL, -- 'confirmation', 'approved', 'cancellation', 'reminder', 'reschedule'
    message_content TEXT NOT NULL,
    provider VARCHAR(50) DEFAULT 'mock',
    provider_message_id VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING', -- 'SUCCESS', 'FAILED', 'PENDING'
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for quick query
CREATE INDEX IF NOT EXISTS idx_sms_logs_booking_id ON public.hms_booking_sms_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON public.hms_booking_sms_logs(phone);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON public.hms_booking_sms_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sms_logs_status ON public.hms_booking_sms_logs(status);

COMMENT ON TABLE public.hms_booking_sms_logs IS 'Lưu nhật ký chi tiết tin nhắn SMS đã gửi cho bệnh nhân khám online';
