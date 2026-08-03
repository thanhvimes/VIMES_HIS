-- Migration: 045_fix_reuse_hms_doc_for_same_day_bookings.sql
-- Purpose: Update public.qms_register_ticket_online stored procedure to reuse existing hms_doc (hd_docno) for a patient when registering multiple specialties on the same appointment date (v_examdate), ensuring only 1 hms_doc is created while inserting individual hms_exam records.

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
    p_specialty_code character varying
)
RETURNS TABLE(
    ticket_id integer, 
    ticket_number character varying, 
    roomname character varying, 
    patient_name character varying, 
    doc_no character varying, 
    patient_id character varying, 
    created_at timestamp without time zone
)
LANGUAGE plpgsql
AS $function$
DECLARE
    v_patient_id    INT := 0;
    v_doc_no        INT := 0;
    v_exam_id       INT := 0;
    v_card_idx      INT := 0;
    v_new_ticket_id INT;
    v_created_at    TIMESTAMP;
    v_surname       VARCHAR(50);
    v_midname       VARCHAR(50);
    v_firstname     VARCHAR(50);
    v_roomname      VARCHAR(50);
    v_roomid        INT;
    v_disrate       INT := 0;
    v_maphikham     VARCHAR(10);
    v_examdate      TIMESTAMP;
    v_gender        VARCHAR(10);
BEGIN
    v_examdate := p_examdate::timestamp;
    v_gender := 'F';
    IF (lower(p_gender) = 'nam' OR lower(p_gender) = 'm') THEN
      v_gender := 'M';
    END IF;
    
    -- 1. XỬ LÝ BỆNH NHÂN (HMS_PATIENT)
    -- Tìm bệnh nhân theo số CCCD / CMND
    IF p_identity_number IS NOT NULL AND p_identity_number <> '' THEN
        SELECT hp_patientno INTO v_patient_id FROM hms_patient WHERE hp_sin = p_identity_number LIMIT 1;
    END IF;

    -- Nếu chưa tìm thấy theo CCCD, tìm theo Số điện thoại + Tên bệnh nhân
    IF (v_patient_id IS NULL OR v_patient_id = 0) AND p_phone IS NOT NULL AND p_phone <> '' THEN
        SELECT hp_patientno INTO v_patient_id 
        FROM hms_patient 
        WHERE (hp_phone = p_phone OR hp_workplace = p_phone) 
          AND lower(concat(hp_surname, ' ', hp_midname, ' ', hp_firstname)) = lower(p_patient_name)
        LIMIT 1;
    END IF;

    -- 2. NẾU LÀ BỆNH NHÂN MỚI -> TẠO BỆNH NHÂN
    IF v_patient_id IS NULL OR v_patient_id = 0 THEN
        -- Tách tên
        SELECT surname, midname, firstname INTO v_surname, v_midname, v_firstname FROM split_fullname(p_patient_name);        
        -- Tạo BN mới
        v_patient_id := hms_insert_patient(v_surname, v_midname, v_firstname, p_dob, v_gender, p_province_code, p_province_code, p_ward_code, p_address, p_identity_number, p_identitydate, '', '', '');
    END IF;

    -- 3. XỬ LÝ HỒ SƠ KHÁM TRONG NGÀY HẸN (HMS_DOC)
    -- Kiểm tra xem bệnh nhân đã có hồ sơ khám (hms_doc) nào trong ngày hẹn (DATE(v_examdate)) chưa
    SELECT hd_docno INTO v_doc_no 
    FROM hms_doc 
    WHERE hd_patientno = v_patient_id 
      AND DATE(hd_admitdate) = DATE(v_examdate) 
      AND hd_status <> 'T' 
    ORDER BY hd_docno DESC LIMIT 1;

    -- Nếu chưa tìm thấy trong hms_doc, kiểm tra trong hms_exam theo ngày hẹn
    IF v_doc_no IS NULL OR v_doc_no = 0 THEN
        SELECT he_docno INTO v_doc_no 
        FROM hms_exam 
        WHERE he_patientno = v_patient_id 
          AND DATE(he_examdate) = DATE(v_examdate) 
        ORDER BY he_docno DESC LIMIT 1;
    END IF;

    -- 4. NẾU CHƯA CÓ HỒ SƠ KHÁM TRONG NGÀY -> TẠO MỚI HỒ SƠ KHÁM (HMS_DOC)
    IF v_doc_no IS NULL OR v_doc_no = 0 THEN
        v_doc_no := hms_create_hms_doc(v_patient_id, p_phone, 5, p_insurance_card, 0, v_card_idx, p_department_id, 'ONLINE', v_examdate);
    END IF;    
    
    -- 5. LẤY MÃ KIỂU KHÁM
    SELECT ss_othercode
    INTO v_maphikham
    FROM hms_roomlist_kios
    LEFT JOIN hms_roomlist
    ON (hrk_deptid   = hrl_deptid
    AND hrk_id       = hrl_id)    
    LEFT JOIN sys_sel
    ON (ss_id   = 'hms_room_kios'
    AND ss_code     = CAST(hrk_code AS TEXT))
    WHERE hrk_deptid = p_department_id
    AND hrk_id        = p_roomid
    AND CAST(hrk_code AS TEXT) = p_specialty_code
    ORDER BY hrk_id, ss_othercode LIMIT 1;
    
    -- 6. TẠO THÊM PHIẾU KHÁM MỚI (HMS_EXAM) DƯỚI CÙNG HỒ SƠ KHÁM (v_doc_no)
    v_exam_id := hms_insert_exam_online(v_patient_id, v_doc_no, p_department_id, p_roomid, p_examdate, p_receptno, v_maphikham);
    
    -- 7. TẠO/CẬP NHẬT PHIẾU HÀNG ĐỢI (QMS_PATIENTS)
    UPDATE qms_patient SET qms_patientno = v_patient_id, qms_docno = v_doc_no WHERE qms_idx = p_number_idx; 

    -- 8. TRẢ VỀ KẾT QUẢ
    RETURN QUERY
    SELECT v_roomid, v_exam_id::VARCHAR, v_roomname, p_patient_name, v_doc_no::VARCHAR, v_patient_id::VARCHAR, v_created_at;
END;
$function$;
