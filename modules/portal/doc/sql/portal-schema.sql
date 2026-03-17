
-- TẠO CẤU TRÚC HỆ THỐNG TÀI KHOẢN PORTAL
-- File: backend/sql/portal-schema.sql

-- 1. Bảng tài khoản (Định danh bằng Số điện thoại)
CREATE TABLE IF NOT EXISTS portal_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash VARCHAR(255),               -- Dùng cho option không OTP
    auth_method VARCHAR(20) DEFAULT 'PASSWORD', -- 'OTP' | 'PASSWORD'
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 2. Bảng liên kết hồ sơ bệnh nhân (HIS Mapping)
-- Cho phép 1 tài khoản quản lý nhiều hồ sơ (Vd: Bố mẹ quản lý con cái)
CREATE TABLE IF NOT EXISTS portal_patient_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES portal_accounts(id) ON DELETE CASCADE,
    patient_no VARCHAR(20) NOT NULL,          -- Mã bệnh nhân từ HIS
    relationship VARCHAR(50) DEFAULT 'Self', -- 'Self', 'Child', 'Parent', 'Other'
    is_primary BOOLEAN DEFAULT FALSE,         -- Hồ sơ mặc định khi vào portal
    linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, patient_no)
);

-- Index để truy vấn nhanh
CREATE INDEX IF NOT EXISTS idx_portal_accounts_phone ON portal_accounts(phone);
CREATE INDEX IF NOT EXISTS idx_portal_patient_links_account ON portal_patient_links(account_id);
CREATE INDEX IF NOT EXISTS idx_portal_patient_links_pno ON portal_patient_links(patient_no);

-- Thêm ghi chú
COMMENT ON TABLE portal_accounts IS 'Bảng tài khoản bệnh nhân trên Patient Portal';
COMMENT ON TABLE portal_patient_links IS 'Bảng liên kết tài khoản portal với các hồ sơ trong HIS';
