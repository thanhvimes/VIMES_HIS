-- =============================================================================
-- Migration: 065_create_emr_document_tables.sql
-- Mô tả: Phân hệ Bệnh Án Điện Tử (EMR Document Engine)
-- Bao gồm: Quản lý bản thể văn bản lâm sàng, Ký số đa cấp, Ký Tablet người bệnh,
--          Đóng gói bệnh án xuất viện, Đánh số trang liên tục và Lưu vết kiểm toán.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Bảng quản lý từng Tờ tài liệu lâm sàng cụ thể (Clinical Document Instance)
CREATE TABLE IF NOT EXISTS emr_document_instance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_no VARCHAR(50) NOT NULL,                       -- Mã đợt khám / hồ sơ bệnh án (hms_doc.hd_docno)
    patient_id VARCHAR(50) NOT NULL,                   -- Mã bệnh nhân (hms_patient.hp_patientid)
    patient_name VARCHAR(255),                         -- Tên bệnh nhân hiển thị
    template_code VARCHAR(64) NOT NULL,                -- Mã mẫu Word (DT_NGOAITRU, TO_DIEU_TRI, GIAY_RA_VIEN...)
    template_version_id BIGINT,                        -- Phiên bản mẫu đã sử dụng
    document_name VARCHAR(255) NOT NULL,               -- Tên văn bản (ví dụ: Đơn thuốc ngày 17/08/2026)
    document_group VARCHAR(50) NOT NULL DEFAULT 'CLINICAL' -- BENH_AN, DIEU_TRI, XET_NGHIEM, CDHA, PHAU_THUAT, RA_VIEN, CLINICAL
        CHECK (document_group IN ('BENH_AN', 'DIEU_TRI', 'XET_NGHIEM', 'CDHA', 'PHAU_THUAT', 'RA_VIEN', 'CLINICAL')),
    clinical_date DATE NOT NULL DEFAULT CURRENT_DATE,  -- Ngày lâm sàng
    version_number INT NOT NULL DEFAULT 1,             -- Bản số mấy (1: bản gốc, 2: bản đính chính)
    
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT'        -- Vòng đời tài liệu
        CHECK (status IN ('DRAFT', 'READY_TO_SIGN', 'PARTIALLY_SIGNED', 'SIGNED', 'LOCKED', 'REVOKED', 'AMENDED')),
    
    snapshot_data JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Bản chụp dữ liệu tĩnh tại thời điểm phát hành (chống biến dạng)
    raw_pdf_path TEXT,                                 -- Đường dẫn file PDF thô (S3 / Local storage)
    signed_pdf_path TEXT,                              -- Đường dẫn file PDF đã ký số hoàn chỉnh (S3 / Local storage)
    pdf_sha256 CHAR(64),                               -- Mã băm toàn vẹn SHA-256
    page_count INT DEFAULT 1,                          -- Số trang của văn bản này
    
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emr_doc_patient ON emr_document_instance(patient_id, doc_no, clinical_date DESC);
CREATE INDEX IF NOT EXISTS idx_emr_doc_status ON emr_document_instance(status, document_group);
CREATE INDEX IF NOT EXISTS idx_emr_doc_template ON emr_document_instance(template_code, version_number);

-- 2. Bảng quản lý chi tiết Chữ Ký Số & Chữ Ký Cảm Ứng Tablet (Signatures)
CREATE TABLE IF NOT EXISTS emr_document_signature (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_instance_id UUID NOT NULL REFERENCES emr_document_instance(id) ON DELETE CASCADE,
    
    signer_type VARCHAR(30) NOT NULL DEFAULT 'DOCTOR'  -- DOCTOR, NURSE, PATIENT, GUARDIAN, ORG_SEAL
        CHECK (signer_type IN ('DOCTOR', 'NURSE', 'PATIENT', 'GUARDIAN', 'ORG_SEAL')),
    signer_id VARCHAR(100),                            -- Mã tài khoản người ký
    signer_name VARCHAR(255) NOT NULL,                 -- Họ tên người ký hiển thị
    signer_role VARCHAR(100) NOT NULL,                 -- Bác sĩ điều trị, Phẫu thuật viên, Người bệnh...
    signing_order INT NOT NULL DEFAULT 1,              -- Thứ tự ký (1: BS ký, 2: Trưởng khoa, 3: Dấu viện)
    
    signature_method VARCHAR(30) NOT NULL DEFAULT 'SMART_CA' -- SMART_CA, USB_TOKEN, TABLET_TOUCH, HSM_SERVER
        CHECK (signature_method IN ('SMART_CA', 'USB_TOKEN', 'TABLET_TOUCH', 'HSM_SERVER')),
    signature_image_path TEXT,                         -- Ảnh chữ ký nét vẽ / con dấu
    certificate_subject TEXT,                          -- Tên chủ thể chứng thư số
    certificate_serial VARCHAR(255),                   -- Serial chứng thư số
    certificate_issuer TEXT,                           -- Nhà cung cấp CA (VNPT, Viettel, FPT...)
    tsa_timestamp TIMESTAMPTZ,                         -- Dấu thời gian cấp phép TSA
    
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'      -- PENDING, SIGNED, REJECTED, REVOKED
        CHECK (status IN ('PENDING', 'SIGNED', 'REJECTED', 'REVOKED')),
    
    signed_at TIMESTAMPTZ,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emr_sig_doc ON emr_document_signature(document_instance_id, signing_order, status);

-- 3. Bảng quản lý Trọn bộ Hồ Sơ Bệnh Án Master khi Xuất Viện (EMR Bundle)
CREATE TABLE IF NOT EXISTS emr_document_bundle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_no VARCHAR(50) NOT NULL UNIQUE,                -- Mã đợt khám / bệnh án (hms_doc.hd_docno)
    patient_id VARCHAR(50) NOT NULL,
    patient_name VARCHAR(255),
    bundle_type VARCHAR(50) NOT NULL DEFAULT 'NOI_TRU' -- NOI_TRU, NGOAI_TRU, PHAU_THUAT, KSK
        CHECK (bundle_type IN ('NOI_TRU', 'NGOAI_TRU', 'PHAU_THUAT', 'KSK')),
    total_pages INT NOT NULL DEFAULT 0,                -- Tổng số trang liên tục
    
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN'         -- OPEN (Đang điều trị), READY_TO_CLOSE, CLOSED_LOCKED (Đã đóng WORM)
        CHECK (status IN ('OPEN', 'READY_TO_CLOSE', 'CLOSED_LOCKED')),
    
    master_pdf_path TEXT,                              -- File PDF tổng hợp ghép toàn bộ các tờ
    master_sha256 CHAR(64),                            -- Mã băm bảo toàn cuốn bệnh án
    closed_by VARCHAR(100),                            -- Trưởng phòng KHTH / Lãnh đạo đóng bệnh án
    closed_at TIMESTAMPTZ,                             -- Thời điểm đóng hồ sơ (Khóa WORM)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emr_bundle_patient ON emr_document_bundle(patient_id, status);

-- 4. Bảng Mục lục & Đánh số trang liên tục trong Bệnh án (Bundle Items)
CREATE TABLE IF NOT EXISTS emr_document_bundle_item (
    id BIGSERIAL PRIMARY KEY,
    bundle_id UUID NOT NULL REFERENCES emr_document_bundle(id) ON DELETE CASCADE,
    document_instance_id UUID NOT NULL REFERENCES emr_document_instance(id),
    order_index INT NOT NULL,                          -- Thứ tự tờ trong mục lục
    start_page INT NOT NULL,                           -- Bắt đầu từ trang số mấy
    end_page INT NOT NULL,                             -- Kết thúc ở trang số mấy
    title_in_toc VARCHAR(255) NOT NULL                -- Tên hiển thị trong Tờ Mục Lục Bệnh Án
);

CREATE INDEX IF NOT EXISTS idx_emr_bundle_item_order ON emr_document_bundle_item(bundle_id, order_index);

-- 5. Bảng quản lý Lịch sử Đính chính / Thay thế khi có sai sót (Amendments)
CREATE TABLE IF NOT EXISTS emr_document_amendment (
    id BIGSERIAL PRIMARY KEY,
    original_document_id UUID NOT NULL REFERENCES emr_document_instance(id),
    amended_document_id UUID NOT NULL REFERENCES emr_document_instance(id),
    reason TEXT NOT NULL,                              -- Lý do đính chính bắt buộc
    approved_by VARCHAR(100) NOT NULL,                 -- Trưởng khoa / Hội đồng duyệt
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Bảng Nhật ký Truy cập & Trích sao Bệnh án (Access & Disclosure Audit Log)
CREATE TABLE IF NOT EXISTS emr_document_access_log (
    id BIGSERIAL PRIMARY KEY,
    document_instance_id UUID REFERENCES emr_document_instance(id),
    bundle_id UUID REFERENCES emr_document_bundle(id),
    actor_id VARCHAR(100) NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,                       -- VIEW, PRINT, EXPORT_PDF, DISCLOSE_TO_INSURANCE, DISCLOSE_TO_POLICE
    reason TEXT,                                       -- Mục đích xem / trích sao
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emr_access_log ON emr_document_access_log(document_instance_id, created_at DESC);

-- Nạp sẵn dữ liệu mẫu thực tế minh họa quy trình lâm sàng EMR (nếu bảng trống)
INSERT INTO emr_document_instance (id, doc_no, patient_id, patient_name, template_code, document_name, document_group, clinical_date, version_number, status, snapshot_data, raw_pdf_path, signed_pdf_path, pdf_sha256, page_count, created_by, created_at)
SELECT 
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'::uuid,
    '260817001',
    'BN88291',
    'TRẦN VĂN MẠNH',
    'DT_NGOAITRU',
    'Đơn Thuốc Ngoại Trú (Khám Ngày 17/08/2026)',
    'CLINICAL',
    CURRENT_DATE,
    1,
    'SIGNED',
    '{"patient_name": "TRẦN VĂN MẠNH", "dob": "15/04/1982", "gender": "Nam", "icd_code": "I10 - Tăng huyết áp vô căn", "medicines": [{"name": "Amlodipin 5mg", "qty": 30, "usage": "Uống 1 viên/ngày vào buổi sáng"}, {"name": "Losartan 50mg", "qty": 30, "usage": "Uống 1 viên/ngày vào buổi tối"}], "doctor_name": "BS. CKI. Phạm Thanh Tùng"}'::jsonb,
    '/storage/emr/raw/260817001_DT_raw.pdf',
    '/storage/emr/signed/260817001_DT_signed.pdf',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    1,
    'bs_tung',
    NOW() - INTERVAL '2 hours'
WHERE NOT EXISTS (SELECT 1 FROM emr_document_instance LIMIT 1);

INSERT INTO emr_document_signature (id, document_instance_id, signer_type, signer_id, signer_name, signer_role, signing_order, signature_method, certificate_subject, certificate_serial, certificate_issuer, tsa_timestamp, status, signed_at, ip_address)
SELECT
    'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e'::uuid,
    'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'::uuid,
    'DOCTOR',
    'bs_tung',
    'BS. CKI. Phạm Thanh Tùng',
    'BÁC SĨ KHÁM BỆNH',
    1,
    'SMART_CA',
    'CN=BS. CKI. Phạm Thanh Tùng, O=Bệnh Viện Đa Khoa ViMES, C=VN',
    '7849-2019-9482-1048',
    'VNPT SmartCA National Root',
    NOW() - INTERVAL '2 hours',
    'SIGNED',
    NOW() - INTERVAL '2 hours',
    '192.168.1.45'
WHERE NOT EXISTS (SELECT 1 FROM emr_document_signature LIMIT 1);

INSERT INTO emr_document_instance (id, doc_no, patient_id, patient_name, template_code, document_name, document_group, clinical_date, version_number, status, snapshot_data, raw_pdf_path, signed_pdf_path, pdf_sha256, page_count, created_by, created_at)
SELECT 
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f'::uuid,
    '260817001',
    'BN88291',
    'TRẦN VĂN MẠNH',
    'CAM_KET_PHAU_THUAT',
    'Giấy Cam Đoan Chấp Nhận Phẫu Thuật / Thủ Thuật',
    'PHAU_THUAT',
    CURRENT_DATE,
    1,
    'SIGNED',
    '{"patient_name": "TRẦN VĂN MẠNH", "guardian_name": "TRẦN THỊ HỒNG (Vợ)", "procedure_name": "Nội soi can thiệp cắt polyp đại tràng", "risks_explained": "Đã được Bác sĩ giải thích rõ nguy cơ chảy máu, thủng và đồng ý tự nguyện làm thủ thuật", "doctor_name": "BS. CKII. Nguyễn Văn An"}'::jsonb,
    '/storage/emr/raw/260817001_CAMKET_raw.pdf',
    '/storage/emr/signed/260817001_CAMKET_signed.pdf',
    'f4c8996fb92427ae41e4649b934ca495991b7852b855e3b0c44298fc1c149afb',
    1,
    'bs_an',
    NOW() - INTERVAL '1 hour'
WHERE (SELECT COUNT(*) FROM emr_document_instance) = 1;

INSERT INTO emr_document_signature (document_instance_id, signer_type, signer_id, signer_name, signer_role, signing_order, signature_method, signature_image_path, status, signed_at, ip_address)
SELECT
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f'::uuid,
    'PATIENT',
    NULL,
    'TRẦN VĂN MẠNH',
    'NGƯỜI BỆNH (KÝ TAY TABLET)',
    1,
    'TABLET_TOUCH',
    '/storage/emr/signatures/patient_tranvanmanh_touch.png',
    'SIGNED',
    NOW() - INTERVAL '1 hour',
    '192.168.1.120'
WHERE (SELECT COUNT(*) FROM emr_document_signature) = 1;

INSERT INTO emr_document_signature (document_instance_id, signer_type, signer_id, signer_name, signer_role, signing_order, signature_method, certificate_subject, certificate_serial, certificate_issuer, tsa_timestamp, status, signed_at, ip_address)
SELECT
    'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f'::uuid,
    'DOCTOR',
    'bs_an',
    'BS. CKII. Nguyễn Văn An',
    'PHẪU THUẬT VIÊN CHÍNH',
    2,
    'SMART_CA',
    'CN=BS. CKII. Nguyễn Văn An, O=Bệnh Viện Đa Khoa ViMES, C=VN',
    '9981-4012-3342-8821',
    'Viettel-CA National Root',
    NOW() - INTERVAL '1 hour',
    'SIGNED',
    NOW() - INTERVAL '1 hour',
    '192.168.1.48'
WHERE (SELECT COUNT(*) FROM emr_document_signature) = 2;
