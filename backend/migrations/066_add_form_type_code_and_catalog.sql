-- =============================================================================
-- Migration: 066_add_form_type_code_and_catalog.sql
-- Mô tả: Thêm Danh mục Chuẩn hóa Mã Loại Biểu Mẫu EMR (Form Type Code)
--        theo Thông tư 46/2018/TT-BYT và Thông tư 54/2017/TT-BYT.
-- =============================================================================

-- 1. Tạo bảng Danh mục Mã Loại Biểu Mẫu EMR chuẩn Bộ Y Tế
CREATE TABLE IF NOT EXISTS emr_form_type_catalog (
    code VARCHAR(64) PRIMARY KEY,                      -- Mã loại biểu mẫu chuẩn (ví dụ: PHIEU_CHI_DINH_CLS, KET_QUA_CLS)
    name VARCHAR(255) NOT NULL,                        -- Tên loại biểu mẫu tiếng Việt
    category_group VARCHAR(50) NOT NULL,               -- Nhóm: HANH_CHINH, CHI_DINH, CAN_LAM_SANG, DIEU_TRI, PHAU_THUAT, RA_VIEN
    byt_form_code VARCHAR(50),                         -- Mã mẫu theo quy định BYT (ví dụ: MS: 01/BV, MS: 08/BV)
    is_signature_required BOOLEAN NOT NULL DEFAULT TRUE, -- Có bắt buộc ký số không
    default_signer_role VARCHAR(100),                  -- Vai trò người ký mặc định (BAC_SI_DIEU_TRI, KTV_XET_NGHIEM, TRUONG_KHOA)
    is_patient_signature_required BOOLEAN NOT NULL DEFAULT FALSE, -- Có yêu cầu Bệnh nhân ký Tablet không
    sort_order INT NOT NULL DEFAULT 10,                -- Thứ tự sắp xếp trong cây hồ sơ bệnh án
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Thêm cột form_type_code vào bảng emr_document_instance
ALTER TABLE emr_document_instance 
    ADD COLUMN IF NOT EXISTS form_type_code VARCHAR(64) DEFAULT 'CLINICAL_FORM';

-- 3. Thêm cột form_type_code vào bảng hms_document_template (nếu chưa có)
ALTER TABLE hms_document_template 
    ADD COLUMN IF NOT EXISTS form_type_code VARCHAR(64);

-- 4. Tạo Index hỗ trợ tìm kiếm nhanh theo mã loại biểu mẫu
CREATE INDEX IF NOT EXISTS idx_emr_doc_form_type ON emr_document_instance (form_type_code);
CREATE INDEX IF NOT EXISTS idx_hms_tmpl_form_type ON hms_document_template (form_type_code);

-- 5. Nạp danh mục các mã loại biểu mẫu y tế chuẩn dùng trong EMR
INSERT INTO emr_form_type_catalog (code, name, category_group, byt_form_code, is_signature_required, default_signer_role, is_patient_signature_required, sort_order)
VALUES
    -- I. Hành chính & Hồ sơ gốc
    ('VO_BENH_AN', 'Vỏ Hồ Sơ Bệnh Án (Ngoại trú / Nội trú)', 'HANH_CHINH', 'MS: 01/BV', TRUE, 'BAC_SI_DIEU_TRI', FALSE, 1),
    ('BAN_KHAM_BENH_VAO_VIEN', 'Bản Khám Bệnh Vào Viện', 'HANH_CHINH', 'MS: 02/BV', TRUE, 'BAC_SI_DIEU_TRI', FALSE, 2),
    ('GIAY_CAM_DOAN_VAO_VIEN', 'Giấy Cam Đoan Chấp Nhận Điều Trị', 'HANH_CHINH', 'MS: 03/BV', TRUE, 'BAC_SI_DIEU_TRI', TRUE, 3),

    -- II. Chỉ định lâm sàng & Đơn thuốc
    ('PHIEU_CHI_DINH_CLS', 'Phiếu Chỉ Định Cận Lâm Sàng (XN, CĐHA, TDCN)', 'CHI_DINH', 'MS: 04/BV', TRUE, 'BAC_SI_CHI_DINH', FALSE, 10),
    ('DON_THUOC_NGOAI_TRU', 'Đơn Thuốc Ngoại Trú / Ra Viện', 'CHI_DINH', 'MS: 05/BV', TRUE, 'BAC_SI_KHAM', FALSE, 11),
    ('PHIEU_TRUYEN_DICH', 'Phiếu Theo Dõi Truyền Dịch & Dược', 'DIEU_TRI', 'MS: 06/BV', TRUE, 'DIEU_DUONG', FALSE, 12),

    -- III. Kết quả Cận lâm sàng (LIS / RIS / PACS)
    ('KET_QUA_XET_NGHIEM', 'Phiếu Kết Quả Xét Nghiệm (Huyết học, Sinh hóa, Vi sinh)', 'CAN_LAM_SANG', 'MS: 07/BV', TRUE, 'KTV_XET_NGHIEM', FALSE, 20),
    ('KET_QUA_CDHA_XQUANG', 'Phiếu Kết Quả Chẩn Đoán Hình Ảnh X-Quang', 'CAN_LAM_SANG', 'MS: 08/BV', TRUE, 'BAC_SI_CDHA', FALSE, 21),
    ('KET_QUA_CDHA_CT_MRI', 'Phiếu Kết Quả Cắt Lớp Vi Tính CT / Cộng Hưởng Từ MRI', 'CAN_LAM_SANG', 'MS: 09/BV', TRUE, 'BAC_SI_CDHA', FALSE, 22),
    ('KET_QUA_SIEU_AM', 'Phiếu Kết Quả Siêu Âm Màu / Tim Mạch / Sản Phụ Khoa', 'CAN_LAM_SANG', 'MS: 10/BV', TRUE, 'BAC_SI_CDHA', FALSE, 23),
    ('KET_QUA_NOI_SOI', 'Phiếu Kết Quả Nội Soi Tiêu Hóa / Tai Mũi Họng', 'CAN_LAM_SANG', 'MS: 11/BV', TRUE, 'BAC_SI_NOI_SOI', FALSE, 24),
    ('KET_QUA_THAM_DO_CHUC_NANG', 'Phiếu Kết Quả Thăm Dò Chức Năng (Điện tim, Điện não)', 'CAN_LAM_SANG', 'MS: 12/BV', TRUE, 'BAC_SI_TDCN', FALSE, 25),

    -- IV. Quá trình Điều trị & Chăm sóc
    ('TO_DIEU_TRI_HANG_NGAY', 'Tờ Điều Trị Hàng Ngày (Diễn biến & Y lệnh)', 'DIEU_TRI', 'MS: 13/BV', TRUE, 'BAC_SI_DIEU_TRI', FALSE, 30),
    ('PHIEU_CHAM_SOC_DIEU_DUONG', 'Phiếu Theo Dõi & Chăm Sóc Của Điều Dưỡng', 'DIEU_TRI', 'MS: 14/BV', TRUE, 'DIEU_DUONG_TRUC', FALSE, 31),
    ('PHIEU_THEO_DOI_CHUC_NANG_SONG', 'Phiếu Theo Dõi Chức Năng Sống (Mạch, Nhiệt độ, Huyết áp)', 'DIEU_TRI', 'MS: 15/BV', FALSE, 'DIEU_DUONG', FALSE, 32),
    ('BIEN_BAN_HOI_CHAN', 'Biên Bản Hội Chẩn Chuyên Môn', 'DIEU_TRI', 'MS: 16/BV', TRUE, 'CHU_TICH_HOI_DONG', FALSE, 33),

    -- V. Phẫu thuật - Thủ thuật
    ('GIAY_CAM_DOAN_PHAU_THUAT', 'Giấy Cam Đoan Chấp Nhận Phẫu Thuật / Thủ Thuật', 'PHAU_THUAT', 'MS: 17/BV', TRUE, 'PHAU_THUAT_VIEN', TRUE, 40),
    ('PHIEU_KHAM_TIEN_ME', 'Phiếu Khám Tiền Mê', 'PHAU_THUAT', 'MS: 18/BV', TRUE, 'BAC_SI_GAY_ME', FALSE, 41),
    ('TUONG_TRINH_PHAU_THUAT', 'Phiếu Phẫu Thuật / Thủ Thuật (Tường trình mổ)', 'PHAU_THUAT', 'MS: 19/BV', TRUE, 'PHAU_THUAT_VIEN_CHINH', FALSE, 42),

    -- VI. Kết thúc điều trị & BHYT
    ('GIAY_RA_VIEN', 'Giấy Ra Viện (Có dấu pháp nhân bệnh viện)', 'RA_VIEN', 'MS: 20/BV', TRUE, 'TRUONG_KHOA_GIAM_DOC', FALSE, 50),
    ('TRICH_SAO_BENH_AN', 'Trích Sao / Tóm Tắt Hồ Sơ Bệnh Án', 'RA_VIEN', 'MS: 21/BV', TRUE, 'GIAM_DOC_BENH_VIEN', FALSE, 51),
    ('GIAY_CHUYEN_TUYEN', 'Giấy Chuyển Tuyến / Chuyển Viện BHYT', 'RA_VIEN', 'MS: 22/BV', TRUE, 'GIAM_DOC_BENH_VIEN', FALSE, 52),
    ('GIAY_HEN_KHAM_LAI', 'Giấy Hẹn Khám Lại', 'RA_VIEN', 'MS: 23/BV', TRUE, 'BAC_SI_KHAM', FALSE, 53),
    ('BANG_KE_CHI_PHI_BHYT', 'Bảng Kê Chi Phí Khám Bệnh Chữa Bệnh (Mẫu 01/BV & 02/BV)', 'RA_VIEN', 'MS: 24/BV', TRUE, 'KE_TOAN_VIEN_PHI', FALSE, 54)
ON CONFLICT (code) DO NOTHING;

-- 6. Cập nhật dữ liệu mẫu hiện có sang mã chuẩn
UPDATE emr_document_instance 
SET form_type_code = 'DON_THUOC_NGOAI_TRU' 
WHERE template_code = 'DT_NGOAITRU' AND (form_type_code IS NULL OR form_type_code = 'CLINICAL_FORM');

UPDATE emr_document_instance 
SET form_type_code = 'GIAY_CAM_DOAN_PHAU_THUAT' 
WHERE template_code = 'CAM_KET_PHAU_THUAT' AND (form_type_code IS NULL OR form_type_code = 'CLINICAL_FORM');
