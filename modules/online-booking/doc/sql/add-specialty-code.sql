-- ==================== ADD SPECIALTY CODE COLUMN AND UPDATE PROCEDURES ====================
-- 1. Add column to qms_patient
ALTER TABLE qms_patient ADD COLUMN IF NOT EXISTS qms_specialty_code CHARACTER VARYING(15);

-- 2. Update qms_patient_create_booking to 23 parameters
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
    p_idcard_issue_date date DEFAULT NULL,
    p_is_priority BOOLEAN DEFAULT FALSE,
    p_is_insurance BOOLEAN DEFAULT FALSE,
    p_ma_chuyen_khoa text DEFAULT ''::text
) RETURNS INTEGER LANGUAGE 'plpgsql' 
AS $BODY$
  DECLARE
    v_res      INTEGER;
    v_idx      INTEGER;
    v_receptno INTEGER;
    v_count    INTEGER;
  BEGIN
    -- Kiểm tra xem block giờ hẹn đã được đăng ký chưa
    SELECT COUNT(*) INTO v_count FROM hms_schedule_exam
    WHERE hse_date = p_ngay_hen AND hse_deptid = p_ma_khoa AND hse_roomid = p_ma_phong_kham
    AND hse_time = p_gio_hen AND hse_status = 'S';
    
    IF v_count > 0 THEN
      RAISE NOTICE 'Block giờ hẹn đã được đăng ký';
      RETURN -1;
    END IF;
    
    -- Kiểm tra xem bệnh nhân đã đăng ký trong ngày chưa
    SELECT COUNT(*) INTO v_count FROM qms_patient
    WHERE qms_contact = p_so_dien_thoai AND qms_deptid = p_ma_khoa
    AND qms_appointment_date = p_ngay_hen AND qms_patientname = p_ho_ten
    AND qms_birthdate = p_ngay_sinh AND qms_sex = p_gioi_tinh;
    
    IF v_count > 0 THEN
      RAISE NOTICE 'Chỉ được đăng ký 1 lần trong ngày';
      RETURN -3;
    END IF;
    
    -- Lấy hse_receptno
    SELECT hse_receptno INTO v_receptno FROM hms_schedule_exam
    WHERE hse_deptid = p_ma_khoa AND hse_roomid = p_ma_phong_kham
    AND hse_date::DATE = p_ngay_hen::DATE AND hse_time = p_gio_hen;
    
    IF NOT FOUND THEN v_receptno := 0; END IF;
    IF v_receptno IS NULL OR v_receptno <= 0 THEN
      RAISE NOTICE 'Block chưa được tạo';
      RETURN -2;
    END IF;
    
    -- Lấy giá trị tiếp theo của sequence
    SELECT nextval('qms_idx_asq') INTO v_idx;
    
    -- Thêm bản ghi vào qms_patient
    INSERT INTO qms_patient (
        qms_idx, qms_idcard, qms_patientname, qms_birthdate, qms_sex, qms_ethnic,
        qms_prov_id, qms_dist_id, qms_vill_id, qms_address, qms_contact,
        qms_email, qms_deptid, qms_roomid, qms_appointment_date, qms_appointment_time,
        qms_reason, qms_status, qms_receptno, qms_occupation, qms_doctor, qms_type,
        qms_idcard_issue_date, qms_is_priority, qms_is_insurance, qms_specialty_code
    ) VALUES (
        v_idx, p_cccd, p_ho_ten, p_ngay_sinh, p_gioi_tinh, p_dan_toc::INTEGER,
        p_ma_tinh, p_ma_quan_huyen, p_ma_phuong_xa, p_dia_chi_chi_tiet, p_so_dien_thoai,
        p_email, p_ma_khoa, p_ma_phong_kham, p_ngay_hen, p_gio_hen,
        p_ly_do_kham, 'O', v_receptno, p_occupation, p_doctor, p_type,
        p_idcard_issue_date, p_is_priority, p_is_insurance, p_ma_chuyen_khoa
    );
      
    RETURN v_idx;
  END;
$BODY$;

-- 3. Update qms_register_ticket_online to 19 parameters
CREATE OR REPLACE FUNCTION public.qms_register_ticket_online(
	p_number_idx integer,
	p_kiosk_id character varying,
	p_kiosk_type character varying,
	p_patient_name character varying,
	p_identity_number character varying,
	p_phone character varying,
	p_dob date,
	p_address text,
	p_department_id character varying,
	p_is_priority boolean,
	p_insurance_card character varying,
	p_province_code character varying,
	p_ward_code character varying,
	p_roomid integer,
    p_receptno integer,
	p_gender character varying,
	p_identitydate date,
	p_examdate character varying,
    p_speciality_code character varying DEFAULT ''::character varying)
    RETURNS TABLE(ticket_id integer, ticket_number character varying, roomname character varying, patient_name character varying, doc_no character varying, patient_id character varying, created_at timestamp without time zone) 
    LANGUAGE 'plpgsql'
AS $BODY$
DECLARE
    v_patient_id    INT := 0;
    v_doc_no        INT := 0;
    v_exam_id       INT := 0;
	v_card_idx      INT := 0;
    v_new_ticket_id INT;
    v_created_at    TIMESTAMP := CURRENT_TIMESTAMP;
    v_surname       VARCHAR(50);
    v_midname       VARCHAR(50);
    v_firstname     VARCHAR(50);
	v_roomname      VARCHAR(100);
	v_roomid		INT := p_roomid;
	v_disrate		INT := 0;
	v_maphikham		VARCHAR(10);
	v_examdate		TIMESTAMP;
	v_gender		VARCHAR(10);
BEGIN
	v_examdate := TO_TIMESTAMP(p_examdate, 'YYYY-MM-DD HH24:MI:SS');
	v_gender := 'F';
	IF(lower(p_gender) = 'nam' OR lower(p_gender) = 'm') THEN v_gender := 'M'; END IF;
	
    -- 1. XỬ LÝ BỆNH NHÂN (HMS_PATIENT)
    IF p_identity_number IS NOT NULL AND p_identity_number <> '' THEN
        SELECT hp_patientno INTO v_patient_id FROM hms_patient WHERE hp_sin = p_identity_number LIMIT 1;
    END IF;

    -- 2. NẾU LÀ BỆNH NHÂN MỚI -> TẠO BỆNH NHÂN
    IF v_patient_id IS NULL OR v_patient_id = 0 THEN
        SELECT surname, midname, firstname INTO v_surname, v_midname, v_firstname FROM split_fullname(p_patient_name);        
        v_patient_id := hms_insert_patient(v_surname, v_midname, v_firstname, p_dob, v_gender, p_province_code, p_province_code, p_ward_code, p_address, p_identity_number, p_identitydate, '', '', '');
	ELSE
    	SELECT he_docno INTO v_doc_no FROM hms_exam WHERE he_patientno = v_patient_id AND DATE(he_examdate) = CURRENT_DATE LIMIT 1;
    END IF;

    IF v_doc_no IS NULL OR v_doc_no = 0 THEN
        v_doc_no := hms_create_hms_doc(v_patient_id, p_phone, 5, p_insurance_card, 0, v_card_idx, p_department_id,'KIOS', v_examdate);
    END IF;
    
    v_exam_id := hms_insert_exam_online(v_patient_id, v_doc_no, p_department_id, p_roomid, '', v_maphikham);
	
	SELECT hrl_roomname INTO v_roomname FROM hms_roomlist WHERE hrl_deptid = p_department_id AND hrl_id = p_roomid;

    -- Update QMS Patient with Specialty Code
    UPDATE qms_patient SET 
        qms_patientno = v_patient_id, 
        qms_docno = v_doc_no,
        qms_specialty_code = p_speciality_code
    WHERE qms_idx = p_number_idx; 
    
    RETURN QUERY
    SELECT v_roomid, v_exam_id::VARCHAR, v_roomname, p_patient_name, v_doc_no::VARCHAR, v_patient_id::VARCHAR, v_created_at;
END;
$BODY$;
