-- Migration: 044_fix_qms_patient_create_booking_overloads.sql
-- Purpose: Clean up old overloaded function signatures of public.qms_patient_create_booking and define the single canonical 23-parameter version to avoid ambiguity error 42725.

-- 1. Drop older/overloaded versions of qms_patient_create_booking if they exist
DROP FUNCTION IF EXISTS public.qms_patient_create_booking(text, text, date, text, text, integer, integer, integer, text, text, text, integer, date, text, text, integer, text, text, text);
DROP FUNCTION IF EXISTS public.qms_patient_create_booking(text, text, date, text, text, integer, integer, integer, text, text, text, integer, date, text, text, integer, text, text, text, date);
DROP FUNCTION IF EXISTS public.qms_patient_create_booking(text, text, date, text, text, integer, integer, integer, text, text, text, integer, date, text, text, integer, text, text, text, date, boolean, boolean, text);

-- 2. Recreate canonical stored procedure public.qms_patient_create_booking
CREATE OR REPLACE FUNCTION public.qms_patient_create_booking(
    p_cccd text, 
    p_ho_ten text, 
    p_ngay_sinh date, 
    p_gioi_tinh text, 
    p_dan_toc text, 
    p_ma_tinh integer, 
    p_ma_quan_huyen integer, 
    p_ma_phuong_xa integer, 
    p_dia_chi_chi_tiet text, 
    p_so_dien_thoai text, 
    p_ma_khoa text, 
    p_ma_phong_kham integer, 
    p_ngay_hen date, 
    p_gio_hen text, 
    p_ly_do_kham text, 
    p_occupation integer, 
    p_doctor text, 
    p_email text DEFAULT ''::text, 
    p_type text DEFAULT 'ONL'::text, 
    p_ngay_cap_cccd date DEFAULT NULL::date, 
    p_is_priority boolean DEFAULT false, 
    p_is_insurance boolean DEFAULT false, 
    p_ma_chuyen_khoa text DEFAULT ''::text
)
RETURNS integer
LANGUAGE plpgsql
AS $function$
  DECLARE
    v_res      INTEGER;
    v_idx      INTEGER;
    v_receptno INTEGER;
    v_count    INTEGER;
    v_sex      VARCHAR(1);
  BEGIN
    -- Chuẩn hóa giới tính về 'M' hoặc 'F'
    v_sex := 'F';
    IF (lower(p_gioi_tinh) = 'nam' OR lower(p_gioi_tinh) = 'm') THEN
      v_sex := 'M';
    END IF;

    -- A. Kiểm tra xem block giờ hẹn đã được đăng ký hoặc đã có ai đặt chưa
    SELECT COUNT(*)
    INTO v_count
    FROM qms_patient
    WHERE qms_appointment_date = p_ngay_hen
    AND qms_deptid = p_ma_khoa
    AND qms_roomid = p_ma_phong_kham
    AND qms_appointment_time = p_gio_hen
    AND qms_status IN ('O', 'S');
    
    IF v_count > 0 THEN
      RAISE NOTICE 'Block giờ hẹn đã có người đăng ký (chờ duyệt hoặc đã duyệt)';
      RETURN -1;
    END IF;

    -- B. Kiểm tra trạng thái slot trong hms_schedule_exam
    SELECT COUNT(*)
    INTO v_count
    FROM hms_schedule_exam
    WHERE hse_date = p_ngay_hen
    AND hse_deptid = p_ma_khoa
    AND hse_roomid = p_ma_phong_kham
    AND hse_time   = p_gio_hen
    AND hse_status = 'S';
    
    IF v_count > 0 THEN
      RAISE NOTICE 'Block giờ hẹn đã được đăng ký trong hệ thống khám';
      RETURN -1;
    END IF;

    -- C. Kiểm tra xem bệnh nhân đã đăng ký chuyên khoa này trong ngày chưa (tránh trùng lặp)
    SELECT COUNT(*)
    INTO v_count
    FROM qms_patient
    WHERE qms_contact        = p_so_dien_thoai
    AND qms_specialty_code   = p_ma_chuyen_khoa
    AND qms_appointment_date = p_ngay_hen
    AND qms_patientname      = p_ho_ten
    AND qms_birthdate        = p_ngay_sinh
    AND qms_sex              = v_sex
    AND qms_status           != 'C';
    
    IF v_count > 0 THEN
      RAISE NOTICE 'Bệnh nhân đã có lịch hẹn cho chuyên khoa này trong ngày';
      RETURN -3;
    END IF;

    -- D. Lấy hse_receptno
    SELECT hse_receptno
    INTO v_receptno
    FROM hms_schedule_exam
    WHERE hse_deptid   = p_ma_khoa
    AND hse_roomid     = p_ma_phong_kham
    AND hse_date::DATE = p_ngay_hen::DATE
    AND hse_time       = p_gio_hen;
    
    IF NOT FOUND THEN
      v_receptno := 0;
    END IF;
    
    IF v_receptno IS NULL OR v_receptno <= 0 THEN
      RAISE NOTICE 'Block chưa được tạo';
      RETURN -2;
    END IF;

    -- E. Lấy giá trị tiếp theo của sequence
    SELECT nextval('qms_idx_asq') INTO v_idx;

    -- F. Thêm bản ghi vào qms_patient với trạng thái mặc định 'O' (chờ duyệt)
    INSERT INTO qms_patient (
        qms_idx,
        qms_idcard,
        qms_idcard_issuedate,
        qms_patientname,
        qms_birthdate,
        qms_sex,
        qms_ethnic,
        qms_prov_id,
        qms_dist_id,
        qms_vill_id,
        qms_address,
        qms_contact,
        qms_email,
        qms_deptid,
        qms_roomid,
        qms_appointment_date,
        qms_appointment_time,
        qms_reason,
        qms_status,
        qms_receptno,
        qms_occupation,
        qms_doctor,
        qms_type,
        qms_is_priority,
        qms_is_insurance,
        qms_specialty_code
    )
    VALUES (
        v_idx,
        p_cccd,
        p_ngay_cap_cccd,
        p_ho_ten,
        p_ngay_sinh,
        v_sex,
        p_dan_toc::INTEGER,
        p_ma_tinh,
        p_ma_quan_huyen,
        p_ma_phuong_xa,
        p_dia_chi_chi_tiet,
        p_so_dien_thoai,
        p_email,
        p_ma_khoa,
        p_ma_phong_kham,
        p_ngay_hen,
        p_gio_hen,
        p_ly_do_kham,
        'O',
        v_receptno,
        p_occupation,
        p_doctor,
        p_type,
        p_is_priority,
        p_is_insurance,
        p_ma_chuyen_khoa
    );

    GET DIAGNOSTICS v_res = ROW_COUNT;
    RAISE NOTICE 'Số bản ghi được chèn: %', v_res;
    RETURN v_idx;
  END;
  $function$;
