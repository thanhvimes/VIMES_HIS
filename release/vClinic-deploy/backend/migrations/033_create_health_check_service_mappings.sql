-- Migration 033: Create health_check_service_mappings table
-- Description: Store mappings between HIS service codes and official health check types (XN, HA, TD)

CREATE TABLE IF NOT EXISTS health_check_service_mappings (
    service_code VARCHAR(50) PRIMARY KEY,
    cls_type VARCHAR(10) NOT NULL CHECK (cls_type IN ('XN', 'HA', 'TD')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed some standard default mappings for common service codes in HIS (Lab and PACS)
INSERT INTO health_check_service_mappings (service_code, cls_type) VALUES
-- Blood test / Lab exams (XN)
('A01.001', 'XN'), -- Huyết học / Công thức máu
('A01.002', 'XN'), -- Bạch cầu
('A01.003', 'XN'), -- Hồng cầu
('A01.004', 'XN'), -- Tiểu cầu
('A02.001', 'XN'), -- Sinh hóa / Glucose
('A02.002', 'XN'), -- Ure
('A02.003', 'XN'), -- Creatinin
('A02.004', 'XN'), -- Cholesterol
('A02.005', 'XN'), -- Triglycerid
('A02.006', 'XN'), -- AST (GOT)
('A02.007', 'XN'), -- ALT (GPT)
('A03.001', 'XN'), -- Nước tiểu thường quy 10 thông số
('A03.002', 'XN'), -- Protein niệu

-- Imaging / PACS (HA)
('B20.001', 'HA'), -- Siêu âm ổ bụng
('B20.002', 'HA'), -- Siêu âm tuyến giáp
('B20.003', 'HA'), -- Siêu âm vú
('B22.001', 'HA'), -- X-Quang ngực thẳng
('B22.002', 'HA'), -- X-Quang cột sống
('B23.001', 'HA'), -- Chụp cắt lớp vi tính (CT)
('B24.001', 'HA'), -- Cộng hưởng từ (MRI)

-- Functional Investigations (TD)
('D10.001', 'TD'), -- Điện tim thường (ECG)
('D10.002', 'TD'), -- Điện não đồ (EEG)
('D11.001', 'TD'), -- Đo chức năng hô hấp (Spirometry)
('D12.001', 'TD'), -- Đo thính lực
('D12.002', 'TD'), -- Đo thị lực
('D13.001', 'TD')  -- Nội soi tiêu hóa (Dạ dày/Đại tràng)
ON CONFLICT (service_code) DO NOTHING;
