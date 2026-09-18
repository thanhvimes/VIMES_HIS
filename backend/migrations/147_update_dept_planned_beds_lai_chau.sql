-- ============================================================================
-- Migration 147: Cập nhật số giường kế hoạch theo QĐ 49/QĐ-BVĐKT của BVĐK tỉnh Lai Châu
-- Ngày quyết định: 22/01/2026
-- Tổng số giường kế hoạch sau điều chỉnh: 562 giường (14 khoa lâm sàng)
-- ============================================================================

DO $$
BEGIN
    -- Đảm bảo cột sd_planned_bed tồn tại trong sys_dept
    ALTER TABLE sys_dept ADD COLUMN IF NOT EXISTS sd_planned_bed integer DEFAULT 0;

    -- 1. Khoa Ngoại chấn thương chỉnh hình: 62 giường
    UPDATE sys_dept 
    SET sd_planned_bed = 62 
    WHERE sd_type = 'DT' AND (sd_name ILIKE '%chấn thương chỉnh hình%' OR sd_id IN ('CTCH', 'KCTCH', 'NCTCH'));

    -- 2. Khoa Ngoại tổng hợp: 50 giường
    UPDATE sys_dept 
    SET sd_planned_bed = 50 
    WHERE sd_type = 'DT' AND (sd_name ILIKE '%ngoại tổng hợp%' OR sd_id IN ('KNTH', 'NGOAI', 'KNT'));

    -- 3. Khoa Phụ sản: 50 giường
    UPDATE sys_dept 
    SET sd_planned_bed = 50 
    WHERE sd_type = 'DT' AND (sd_name ILIKE '%phụ sản%' OR sd_id IN ('PS', 'KPS', 'SAN'));

    -- 4. Khoa Nhi: 94 giường (14 giường HSCC gồm 7 giường và 7 lồng ấp)
    UPDATE sys_dept 
    SET sd_planned_bed = 94 
    WHERE sd_type = 'DT' AND ((sd_name ILIKE '%khoa nhi%' OR sd_name = 'Nhi') AND sd_name NOT ILIKE '%truyền nhiễm%' OR sd_id IN ('NHI', 'KNHI'));

    -- 5. Khoa Nội tổng hợp: 75 giường (01 giường HSCC)
    UPDATE sys_dept 
    SET sd_planned_bed = 75 
    WHERE sd_type = 'DT' AND (sd_name ILIKE '%nội tổng hợp%' OR sd_id IN ('NOI', 'KNOI', 'NTH'));

    -- 6. Khoa Nội tim mạch: 32 giường (02 giường HSCC)
    UPDATE sys_dept 
    SET sd_planned_bed = 32 
    WHERE sd_type = 'DT' AND (sd_name ILIKE '%nội tim mạch%' OR sd_name ILIKE '%tim mạch%' OR sd_id IN ('NTM', 'TM', 'KTM'));

    -- 7. Khoa Lão khoa: 30 giường
    UPDATE sys_dept 
    SET sd_planned_bed = 30 
    WHERE sd_type = 'DT' AND (sd_name ILIKE '%lão khoa%' OR sd_id IN ('LK', 'KLK', 'LAO'));

    -- 8. Khoa Mắt: 13 giường
    UPDATE sys_dept 
    SET sd_planned_bed = 13 
    WHERE sd_type = 'DT' AND (sd_name ILIKE '%mắt%' OR sd_id IN ('MAT', 'KMAT'));

    -- 9. Khoa Tai mũi họng: 18 giường
    UPDATE sys_dept 
    SET sd_planned_bed = 18 
    WHERE sd_type = 'DT' AND (sd_name ILIKE '%tai mũi họng%' OR sd_id IN ('TMH', 'KTMH'));

    -- 10. Khoa Răng hàm mặt: 12 giường
    UPDATE sys_dept 
    SET sd_planned_bed = 12 
    WHERE sd_type = 'DT' AND (sd_name ILIKE '%răng hàm mặt%' OR sd_id IN ('RHM', 'KRHM'));

    -- 11. Khoa Truyền nhiễm: 40 giường (01 giường HSCC)
    UPDATE sys_dept 
    SET sd_planned_bed = 40 
    WHERE sd_type = 'DT' AND (sd_name ILIKE '%truyền nhiễm%' OR sd_id IN ('TN', 'KTN'));

    -- 12. Khoa Y học cổ truyền: 40 giường
    UPDATE sys_dept 
    SET sd_planned_bed = 40 
    WHERE sd_type = 'DT' AND (sd_name ILIKE '%y học cổ truyền%' OR sd_id IN ('YHCT', 'KYHCT', 'DONGY'));

    -- 13. Khoa Vật lý trị liệu – Phục hồi chức năng: 30 giường
    UPDATE sys_dept 
    SET sd_planned_bed = 30 
    WHERE sd_type = 'DT' AND (sd_name ILIKE '%phục hồi chức năng%' OR sd_name ILIKE '%vật lý trị liệu%' OR sd_id IN ('PHCN', 'VLTL', 'KPHCN'));

    -- 14. Khoa HSTC – CĐ: 16 giường (03 giường ICU, 10 giường HSCC)
    UPDATE sys_dept 
    SET sd_planned_bed = 16 
    WHERE sd_type = 'DT' AND (sd_name ILIKE '%hồi sức tích cực%' OR sd_name ILIKE '%hstc%' OR sd_id IN ('HSTC', 'ICU', 'HSTCCD', 'CC'));

END $$;
