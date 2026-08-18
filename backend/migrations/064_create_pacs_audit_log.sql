-- =============================================================================
-- Migration: 064_create_pacs_audit_log.sql
-- Mô tả: Tạo bảng lưu trữ nhật ký thao tác chuyên sâu cho phân hệ Chẩn đoán hình ảnh (RIS/PACS)
-- Ghi nhận: Ký số, Hủy ký số, Lưu nháp, Xem phim DICOM, Đăng nhập, Xuất báo cáo
-- =============================================================================

CREATE TABLE IF NOT EXISTS pacs_audit_log (
    id BIGSERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,            -- SIGN_REPORT, REVOKE_SIGNATURE, SAVE_DRAFT, VIEW_STUDY, EXPORT_REPORT, LOGIN
    user_id VARCHAR(50) NOT NULL,           -- Mã tài khoản Bác sĩ / KTV
    user_name VARCHAR(150),                 -- Họ tên người thực hiện
    user_role VARCHAR(100) DEFAULT 'DOCTOR',-- Vai trò: BÁC SĨ CĐHA, KỸ THUẬT VIÊN, SUPER_ADMIN
    order_id VARCHAR(50),                   -- Mã chỉ định (pcms_order)
    line_id VARCHAR(50),                    -- Mã dòng dịch vụ (pcms_order_line)
    doc_no VARCHAR(50),                     -- Mã hồ sơ bệnh án (hms_doc)
    patient_id VARCHAR(50),                 -- Mã bệnh nhân
    patient_name VARCHAR(150),              -- Tên bệnh nhân
    modality VARCHAR(20),                   -- Loại máy: CT, MR, US, CR, ES
    details TEXT,                           -- Mô tả chi tiết hành động
    reason TEXT,                            -- Lý do (đặc biệt bắt buộc khi Hủy ký số / Mở khóa kết quả)
    client_ip VARCHAR(50) DEFAULT '127.0.0.1',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Chỉ mục tối ưu hóa tốc độ tìm kiếm và lọc dữ liệu
CREATE INDEX IF NOT EXISTS idx_pacs_audit_created_at ON pacs_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pacs_audit_action ON pacs_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_pacs_audit_user_id ON pacs_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_pacs_audit_patient_id ON pacs_audit_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_pacs_audit_order_id ON pacs_audit_log(order_id);

-- Nạp sẵn một số bản ghi mẫu thực tế minh họa quy trình (nếu bảng trống)
INSERT INTO pacs_audit_log (action, user_id, user_name, user_role, order_id, patient_id, patient_name, modality, details, reason, client_ip, created_at)
SELECT 'SIGN_REPORT', 'bs_tinh', 'CN. Bùi Văn Tình', 'BÁC SĨ CĐHA', 'ORD_9901', 'BN88291', 'TRẦN VĂN MẠNH', 'CT', 'Ký số phê duyệt kết quả Chụp CT Lồng ngực 128 dãy có cản quang', NULL, '192.168.1.45', NOW() - INTERVAL '15 minutes'
WHERE NOT EXISTS (SELECT 1 FROM pacs_audit_log LIMIT 1);

INSERT INTO pacs_audit_log (action, user_id, user_name, user_role, order_id, patient_id, patient_name, modality, details, reason, client_ip, created_at)
SELECT 'REVOKE_SIGNATURE', 'bs_tinh', 'CN. Bùi Văn Tình', 'BÁC SĨ CĐHA', 'ORD_9902', 'BN88292', 'LÊ THỊ THU HÀ', 'MR', 'Hủy chữ ký số kết quả Chụp MRI Sọ não để bổ sung mô tả', 'Bổ sung khảo sát chuỗi xung 3D TOF MRA mạch máu não theo yêu cầu hội chẩn', '192.168.1.45', NOW() - INTERVAL '45 minutes'
WHERE (SELECT COUNT(*) FROM pacs_audit_log) = 1;

INSERT INTO pacs_audit_log (action, user_id, user_name, user_role, order_id, patient_id, patient_name, modality, details, reason, client_ip, created_at)
SELECT 'SAVE_DRAFT', 'bs_hoa', 'Bs. Trần Thị Hòa', 'BÁC SĨ CĐHA', 'ORD_9903', 'BN88293', 'NGUYỄN VĂN HÙNG', 'US', 'Lưu bản nháp mô tả Siêu âm ổ bụng tổng quát', NULL, '192.168.1.48', NOW() - INTERVAL '2 hours'
WHERE (SELECT COUNT(*) FROM pacs_audit_log) = 2;

INSERT INTO pacs_audit_log (action, user_id, user_name, user_role, order_id, patient_id, patient_name, modality, details, reason, client_ip, created_at)
SELECT 'VIEW_STUDY', 'ktv_dung', 'KTV. Phan Thanh Dũng', 'KỸ THUẬT VIÊN', 'ORD_9901', 'BN88291', 'TRẦN VĂN MẠNH', 'CT', 'Mở xem loạt ảnh DICOM 3D trên Web Viewer', NULL, '192.168.1.50', NOW() - INTERVAL '3 hours'
WHERE (SELECT COUNT(*) FROM pacs_audit_log) = 3;
