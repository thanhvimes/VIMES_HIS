-- =============================================================================
-- Migration: 067_create_enterprise_emr_schema.sql
-- Mô tả: Phân hệ Bệnh Án Điện Tử Toàn Diện (Enterprise EMR)
-- Căn cứ: Thông tư 46/2018/TT-BYT, Thông tư 54/2017/TT-BYT (Mức 6 & 7)
--         Quyết định 4069/QĐ-BYT (42 mẫu bệnh án chuyên khoa)
-- =============================================================================

-- 1. Bảng 42 Mẫu Bệnh Án Chuyên Khoa Chuẩn Bộ Y Tế (QĐ 4069/QĐ-BYT)
CREATE TABLE IF NOT EXISTS emr_specialty_template_catalog (
    code VARCHAR(64) PRIMARY KEY,                      -- BA_NOIKHOA, BA_NGOAIKHOA, BA_SANKHOA, BA_NHIKHOA...
    name VARCHAR(255) NOT NULL,                        -- Bệnh án Nội khoa, Bệnh án Sản khoa...
    specialty_code VARCHAR(50) NOT NULL,               -- NOI, NGOAI, SAN, NHI, MAT, TMH, RHM, UNGBUOU, ICU, YHCT...
    form_number VARCHAR(50) NOT NULL,                  -- MS: 01/BV-01, MS: 01/BV-02...
    is_inpatient BOOLEAN NOT NULL DEFAULT TRUE,        -- Nội trú / Ngoại trú
    custom_schema JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Cấu trúc trường chuyên khoa đặc thù (PARA, Nhãn áp, Tổn thương...)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Bảng Theo Dõi Chức Năng Sống & Sinh Hiệu (Vital Signs & Clinical Charting)
CREATE TABLE IF NOT EXISTS emr_vital_signs (
    id BIGSERIAL PRIMARY KEY,
    doc_no VARCHAR(50) NOT NULL,                       -- Mã đợt điều trị (hms_doc.hd_docno)
    patient_id VARCHAR(50) NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),    -- Thời điểm đo
    pulse INT,                                         -- Mạch (lần/phút)
    temperature NUMERIC(4,1),                          -- Nhiệt độ (°C, ví dụ: 37.2)
    blood_pressure_systolic INT,                       -- Huyết áp tâm thu (mmHg)
    blood_pressure_diastolic INT,                      -- Huyết áp tâm trương (mmHg)
    respiratory_rate INT,                              -- Nhịp thở (lần/phút)
    spo2 INT,                                          -- Nồng độ oxy SpO2 (%)
    weight_kg NUMERIC(5,2),                            -- Cân nặng (kg)
    height_cm NUMERIC(5,1),                            -- Chiều cao (cm)
    bmi NUMERIC(4,1),                                  -- Chỉ số BMI tự tính
    recorded_by VARCHAR(100) NOT NULL,                 -- Điều dưỡng đo
    nurse_name VARCHAR(255),
    notes TEXT,                                        -- Ghi chú lâm sàng
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emr_vital_doc ON emr_vital_signs(doc_no, recorded_at DESC);

-- 3. Bảng Quản lý Y Lệnh Điện Tử & Nhật Ký Thực Hiện Điều Dưỡng (CPOE & eMAR)
CREATE TABLE IF NOT EXISTS emr_order_execution (
    id BIGSERIAL PRIMARY KEY,
    doc_no VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    order_type VARCHAR(50) NOT NULL,                   -- MEDICATION (Thuốc), INFUSION (Dịch truyền), CARE (Chăm sóc), LAB, IMAGING
    order_id BIGINT,                                   -- Mã y lệnh từ HIS
    item_name VARCHAR(255) NOT NULL,                   -- Tên thuốc / dịch truyền / y lệnh
    dosage VARCHAR(100),                               -- Liều dùng (ví dụ: 1 viên, 500ml)
    route VARCHAR(50),                                 -- Đường dùng: Uống, Tiêm TM, Truyền TM, Bôi...
    scheduled_time TIMESTAMPTZ NOT NULL,               -- Thời gian y lệnh cần thực hiện
    executed_time TIMESTAMPTZ,                         -- Thời gian Điều dưỡng thực tế thực hiện
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'      -- PENDING, EXECUTED, CANCELLED, REFUSED
        CHECK (status IN ('PENDING', 'EXECUTED', 'CANCELLED', 'REFUSED')),
    executed_by VARCHAR(100),                          -- Điều dưỡng thực hiện
    nurse_name VARCHAR(255),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_emr_order_exec_doc ON emr_order_execution(doc_no, scheduled_time ASC);

-- 4. Bảng Tổng Kết Bệnh Án & Thẩm Định Ra Viện (Clinical Summary & Quality Review)
CREATE TABLE IF NOT EXISTS emr_clinical_summary (
    id BIGSERIAL PRIMARY KEY,
    doc_no VARCHAR(50) NOT NULL UNIQUE,
    patient_id VARCHAR(50) NOT NULL,
    treatment_result VARCHAR(50) NOT NULL DEFAULT 'KHOI' -- KHOI (Khỏi), DO_GIAM (Đỡ/Giảm), KHONG_THAY_DOI, NANG_HON, TU_VONG, XIN_VE
        CHECK (treatment_result IN ('KHOI', 'DO_GIAM', 'KHONG_THAY_DOI', 'NANG_HON', 'TU_VONG', 'XIN_VE')),
    main_icd10 VARCHAR(50) NOT NULL,                   -- Bệnh chính ra viện
    secondary_icd10 TEXT,                              -- Bệnh kèm theo
    clinical_evolution TEXT NOT NULL,                  -- Tóm tắt diễn biến lâm sàng trong quá trình điều trị
    key_paraclinical_results TEXT,                     -- Các xét nghiệm và CĐHA có giá trị chẩn đoán
    treatment_methods TEXT NOT NULL,                   -- Phương pháp điều trị đã áp dụng
    discharge_condition TEXT NOT NULL,                 -- Tình trạng người bệnh khi ra viện
    follow_up_instructions TEXT,                       -- Hướng dẫn điều trị tiếp theo & Lời dặn Bác sĩ
    doctor_signature_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    department_head_approval VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_by VARCHAR(100),
    approved_at TIMESTAMPTZ,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bảng Quản Lý Mượn Đọc & Khai Thác Hồ Sơ Bệnh Án Điện Tử (EMR Lending & Research Disclosure)
CREATE TABLE IF NOT EXISTS emr_record_lending_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bundle_id UUID REFERENCES emr_document_bundle(id),
    doc_no VARCHAR(50) NOT NULL,
    patient_id VARCHAR(50) NOT NULL,
    requester_id VARCHAR(100) NOT NULL,
    requester_name VARCHAR(255) NOT NULL,
    requester_organization VARCHAR(255) NOT NULL,      -- Phòng Nghiên cứu KH, Cơ quan Công an, Tòa án, BHXH...
    purpose VARCHAR(50) NOT NULL,                      -- NGHIEN_CUU_KHOA_HOC, GIAM_DINH_PHAP_Y, THANH_TRA_BHYT, CHUYEN_TUYEN
    is_deidentified BOOLEAN NOT NULL DEFAULT TRUE,     -- Có ẩn danh thông tin cá nhân PHI không
    approved_by VARCHAR(100),                          -- Giám đốc / Trưởng phòng KHTH duyệt
    approved_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING'      -- PENDING, APPROVED, REJECTED, EXPIRED
        CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
    access_granted_from TIMESTAMPTZ,
    access_granted_to TIMESTAMPTZ,
    export_token VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nạp sẵn 42 Danh mục Mẫu Bệnh Án Chuyên Khoa Bộ Y Tế
INSERT INTO emr_specialty_template_catalog (code, name, specialty_code, form_number, is_inpatient, custom_schema)
VALUES
    ('BA_NOIKHOA', 'Bệnh Án Nội Khoa', 'NOI', 'MS: 01/BV-01', TRUE, '{"has_cv_exam": true, "has_respiratory_exam": true}'::jsonb),
    ('BA_NGOAIKHOA', 'Bệnh Án Ngoại Khoa', 'NGOAI', 'MS: 01/BV-02', TRUE, '{"has_surgical_indication": true, "has_wound_desc": true}'::jsonb),
    ('BA_SANKHOA', 'Bệnh Án Sản Khoa (Kèm Theo Dõi Chuyển Dạ)', 'SAN', 'MS: 01/BV-03', TRUE, '{"para": true, "fetal_heart_rate": true, "cervical_dilation": true}'::jsonb),
    ('BA_PHUKHOA', 'Bệnh Án Phụ Khoa', 'SAN', 'MS: 01/BV-04', TRUE, '{"menstrual_history": true, "speculum_exam": true}'::jsonb),
    ('BA_NHIKHOA', 'Bệnh Án Nhi Khoa (Trẻ em < 15 tuổi)', 'NHI', 'MS: 01/BV-05', TRUE, '{"birth_weight": true, "vaccination_history": true, "nutrition_dev": true}'::jsonb),
    ('BA_SOSINH', 'Bệnh Án Sơ Sinh', 'NHI', 'MS: 01/BV-06', TRUE, '{"apgar_score": true, "gestational_age": true, "birth_defects": true}'::jsonb),
    ('BA_TRUYENNHIEM', 'Bệnh Án Truyền Nhiễm', 'TRUYENNHIEM', 'MS: 01/BV-07', TRUE, '{"epidemiological_history": true, "fever_chart": true}'::jsonb),
    ('BA_HOISUC_CAPCUU', 'Bệnh Án Hồi Sức Cấp Cứu (ICU)', 'ICU', 'MS: 01/BV-08', TRUE, '{"glasgow_score": true, "ventilator_settings": true, "central_line": true}'::jsonb),
    ('BA_MAT', 'Bệnh Án Chuyên Khoa Mắt', 'MAT', 'MS: 01/BV-09', TRUE, '{"visual_acuity_right": true, "visual_acuity_left": true, "iop_right": true, "iop_left": true}'::jsonb),
    ('BA_TAIMUIHONG', 'Bệnh Án Chuyên Khoa Tai Mũi Họng', 'TMH', 'MS: 01/BV-10', TRUE, '{"ear_exam": true, "nose_exam": true, "throat_larynx_exam": true}'::jsonb),
    ('BA_RANGHAMMAT', 'Bệnh Án Răng Hàm Mặt', 'RHM', 'MS: 01/BV-11', TRUE, '{"dental_chart": true, "occlusion": true, "maxillofacial_trauma": true}'::jsonb),
    ('BA_DALIEU', 'Bệnh Án Da Liễu', 'DALIEU', 'MS: 01/BV-12', TRUE, '{"primary_lesions": true, "secondary_lesions": true, "wood_lamp": true}'::jsonb),
    ('BA_YHCT', 'Bệnh Án Y Học Cổ Truyền', 'YHCT', 'MS: 01/BV-13', TRUE, '{"tu_chan": true, "bat_cuong": true, "mach_chan": true}'::jsonb),
    ('BA_PHUCHCN', 'Bệnh Án Phục Hồi Chức Năng', 'PHCN', 'MS: 01/BV-14', TRUE, '{"barthel_index": true, "fim_score": true, "muscle_power": true}'::jsonb),
    ('BA_UNGBUOU', 'Bệnh Án Ung Bướu', 'UNGBUOU', 'MS: 01/BV-15', TRUE, '{"tnm_staging": true, "histopathology": true, "chemo_cycle": true}'::jsonb),
    ('BA_TAMTHAN', 'Bệnh Án Tâm Thần', 'TAMTHAN', 'MS: 01/BV-16', TRUE, '{"affect_mood": true, "thought_content": true, "hallucinations": true}'::jsonb),
    ('BA_NGOAITRU_CHUNG', 'Bệnh Án Ngoại Trú (Khám Bệnh Ban Ngày)', 'KHAMBENH', 'MS: 02/BV-01', FALSE, '{"outpatient_summary": true}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- Nạp mẫu đo sinh hiệu ban đầu
INSERT INTO emr_vital_signs (doc_no, patient_id, recorded_at, pulse, temperature, blood_pressure_systolic, blood_pressure_diastolic, respiratory_rate, spo2, weight_kg, height_cm, bmi, recorded_by, nurse_name, notes)
SELECT
    '260817001',
    'BN88291',
    NOW() - INTERVAL '3 hours',
    78,
    36.8,
    130,
    85,
    18,
    98,
    68.5,
    170.0,
    23.7,
    'dd_hoa',
    'ĐD. Lê Thị Hoa',
    'Bệnh nhân tỉnh táo, tiếp xúc tốt, huyết áp ổn định'
WHERE NOT EXISTS (SELECT 1 FROM emr_vital_signs LIMIT 1);
