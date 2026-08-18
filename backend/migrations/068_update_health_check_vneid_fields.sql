-- Migration: 068_update_health_check_vneid_fields.sql
-- Description: Bổ sung và đồng bộ các trường dữ liệu KSK VNeID theo QĐ 1551 & QĐ 2062

ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS cac_benh_tat_neu_co TEXT;
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS benh_dang_dieu_tri TEXT;
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS tsbt_dang_dieu_tri_benh VARCHAR(10);
ALTER TABLE health_check_masters ADD COLUMN IF NOT EXISTS nhi_khoa_lam_sang_khac TEXT;

COMMENT ON COLUMN health_check_masters.cac_benh_tat_neu_co IS 'Tình trạng sức khỏe; mắc các bệnh, tật (nếu có) - Mục 121 QĐ 1551';
COMMENT ON COLUMN health_check_masters.benh_dang_dieu_tri IS 'Cụ thể tên bệnh và liệt kê các thuốc đang dùng - Mục 39 QĐ 1551';

-- Đảm bảo các cột liên quan đến địa giới cư trú lưu trữ chuỗi an toàn
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_prov_code VARCHAR(20);
ALTER TABLE hms_exm_employee ADD COLUMN IF NOT EXISTS hee_vill_code VARCHAR(20);
