-- Migration: 074_update_reception_slip_hospital_placeholder.sql
-- Description: Thay thế tên viện fix cứng Ninh Bình bằng biến {{hospital}} trong mẫu in phiếu tiếp đón

UPDATE health_check_settings
SET reception_slip_template = REPLACE(
    REPLACE(
        REPLACE(reception_slip_template, 'BỆNH VIỆN ĐA KHOA TỈNH NINH BÌNH', '{{hospital}}'),
        'BỆNH VIỆN ĐK TỈNH NINH BÌNH', '{{hospital}}'
    ),
    'Bệnh viện đa khoa tỉnh Ninh Bình', '{{hospital}}'
)
WHERE reception_slip_template IS NOT NULL;
