const { query } = require('../src/config/database');

const sql = `
CREATE OR REPLACE FUNCTION public.qms_patient_create_booking(
    p_cccd text,
    p_ho_ten text,
    p_ngay_sinh DATE,
    p_gioi_tinh text,
    p_dan_toc text,
    p_ma_tinh       INTEGER,
    p_ma_quan_huyen INTEGER,
    p_ma_phuong_xa  INTEGER,
    p_dia_chi_chi_tiet text,
    p_so_dien_thoai text,
    p_ma_khoa text,
    p_ma_phong_kham INTEGER,
    p_ngay_hen      DATE,
    p_gio_hen text,
    p_ly_do_kham text,
    p_occupation INTEGER,
    p_doctor text,
    p_email text DEFAULT ''::text,
    p_type text DEFAULT 'ONL'::text,
    p_ngay_cap_cccd DATE DEFAULT NULL,
    p_is_priority BOOLEAN DEFAULT FALSE,
    p_is_insurance BOOLEAN DEFAULT FALSE,
    p_ma_chuyen_khoa text DEFAULT ''::text) RETURNS INTEGER LANGUAGE 'plpgsql' COST 100 VOLATILE PARALLEL UNSAFE
AS
  $BODY$
  DECLARE
    v_res      INTEGER;
    v_idx      INTEGER;
    v_receptno INTEGER;
    v_count    INTEGER;
  BEGIN
    -- Kiểm tra xem block giờ hẹn đã được đăng ký chưa
    SELECT COUNT(*)
    INTO v_count
    FROM hms_schedule_exam
    WHERE hse_date = p_ngay_hen
    AND hse_deptid = p_ma_khoa
    AND hse_roomid = p_ma_phong_kham
    AND hse_time   = p_gio_hen
    AND hse_status = 'S';
    IF v_count     > 0 THEN
      RAISE NOTICE 'Block giờ hẹn đã được đăng ký';
      RETURN -1;
    END IF;
    -- Kiểm tra xem bệnh nhân đã đăng ký trong ngày chưa
    SELECT COUNT(*)
    INTO v_count
    FROM qms_patient
    WHERE qms_contact        = p_so_dien_thoai
    AND qms_deptid           = p_ma_khoa
    AND qms_appointment_date = p_ngay_hen
    AND qms_patientname      = p_ho_ten
    AND qms_birthdate        = p_ngay_sinh
    AND qms_sex              = p_gioi_tinh;
    IF v_count               > 0 THEN
      RAISE NOTICE 'Chỉ được đăng ký 1 lần trong ngày';
      RETURN -3;
    END IF;
    -- Lấy hse_receptno, nếu không có thì đặt v_receptno = 0
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
    -- Lấy giá trị tiếp theo của sequence
    SELECT nextval('qms_idx_asq')
    INTO v_idx;
    -- Thêm bản ghi vào qms_patient
    INSERT
    INTO qms_patient
      (
        qms_idx,
        qms_idcard,
        qms_idcard_issue_date,
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
      VALUES
      (
        v_idx,
        p_cccd,
        p_ngay_cap_cccd,
        p_ho_ten,
        p_ngay_sinh,
        p_gioi_tinh,
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
    -- Lấy số dòng ảnh hưởng
    GET DIAGNOSTICS v_res = ROW_COUNT;
    RAISE NOTICE 'Số bản ghi được chèn: %',
    v_res;
    RETURN v_idx;
  END;
  $BODY$;
`;

async function updateProcedure() {
  try {
    console.log('🚀 Updating procedure qms_patient_create_booking...');
    await query(sql);
    console.log('✅ Procedure updated successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Procedure update failed:', error);
    process.exit(1);
  }
}

updateProcedure();
