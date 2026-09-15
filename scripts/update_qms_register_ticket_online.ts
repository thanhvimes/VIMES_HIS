import { query } from '../src/config/database';

async function updateProcedure() {
  const sql = `
CREATE OR REPLACE FUNCTION public.qms_register_ticket_online(p_number_idx integer, p_kiosk_id character varying, p_kiosk_type character varying, p_patient_name character varying, p_identity_number character varying, p_phone character varying, p_dob date, p_address text, p_department_id character varying, p_is_priority boolean, p_insurance_card character varying, p_province_code character varying, p_ward_code character varying, p_roomid integer, p_receptno integer, p_gender character varying, p_identitydate date, p_examdate character varying, p_specialty_code character varying)
 RETURNS TABLE(ticket_id integer, ticket_number character varying, roomname character varying, patient_name character varying, doc_no character varying, patient_id character varying, created_at timestamp without time zone)
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
	v_roomid		INT;
	v_disrate		INT := 0;
	v_maphikham		VARCHAR(10);
	v_examdate		TIMESTAMP;
	v_gender		VARCHAR(10);
BEGIN
	
	v_examdate := p_examdate::timestamp;
	v_gender := 'F';
	IF(lower(p_gender) = 'nam' OR lower(p_gender) = 'm') THEN
	  v_gender := 'M';
	END IF;
	
    -- 1. XỬ LÝ BỆNH NHÂN (HMS_PATIENT)
    IF p_identity_number IS NOT NULL AND p_identity_number <> '' THEN
        SELECT hp_patientno INTO v_patient_id FROM hms_patient WHERE hp_sin = p_identity_number LIMIT 1;
    END IF;

    -- Tìm qua SDT và Tên nếu không có CCCD
    IF v_patient_id IS NULL OR v_patient_id = 0 THEN
        IF p_phone IS NOT NULL AND p_phone <> '' THEN
            SELECT hp_patientno INTO v_patient_id FROM hms_patient 
            WHERE hp_tel = p_phone 
              AND lower(trim(hp_surname) || ' ' || trim(hp_midname) || ' ' || trim(hp_firstname)) = lower(trim(p_patient_name))
            LIMIT 1;
        END IF;
    END IF;

    -- 2. NẾU LÀ BỆNH NHÂN MỚI -> TẠO BỆNH NHÂN
    IF v_patient_id IS NULL OR v_patient_id = 0 THEN
        -- Tách tên
        SELECT surname, midname, firstname INTO v_surname, v_midname, v_firstname FROM split_fullname(p_patient_name);        
        -- Tạo BN mới
        v_patient_id := hms_insert_patient(v_surname, v_midname, v_firstname, p_dob, v_gender, p_province_code, p_province_code, p_ward_code, p_address, p_identity_number, p_identitydate, '', '', '');
	ELSE
		 -- 3. XỬ LÝ HỒ SƠ KHÁM TRONG NGÀY (HMS_DOC)
    	SELECT he_docno INTO v_doc_no FROM hms_exam WHERE he_patientno = v_patient_id AND DATE(he_examdate) = DATE(v_examdate) LIMIT 1;
    END IF;

    IF v_doc_no IS NULL OR v_doc_no = 0 THEN
        -- Tạo mới hồ sơ (Visit)
        v_doc_no := hms_create_hms_doc(v_patient_id, p_phone, 5, p_insurance_card, 0, v_card_idx, p_department_id,'ONLINE', v_examdate);
    END IF;    
	
	-- Lay ma kieu kham neu duoc thiet lap ss_othercode (D0000021, D0000033) de tinh phi cho benh nhan
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
	AND hrk_id		= p_roomid
	AND CAST(hrk_code AS TEXT) = p_specialty_code
	ORDER BY hrk_id,ss_othercode LIMIT 1;
	
    v_exam_id := hms_insert_exam_online(v_patient_id, v_doc_no, p_department_id, p_roomid, p_examdate, p_receptno, v_maphikham);
	
    -- 5. TẠO PHIẾU HÀNG ĐỢI (QMS_PATIENTS)
    UPDATE qms_patient SET qms_patientno = v_patient_id, qms_docno = v_doc_no WHERE qms_idx = p_number_idx; 
    
    -- 6. TRẢ VỀ KẾT QUẢ
    RETURN QUERY
    SELECT v_roomid, v_exam_id::VARCHAR, v_roomname, p_patient_name, v_doc_no::VARCHAR, v_patient_id::VARCHAR, v_created_at;
END;
$function$;
  `;

  try {
    console.log("Updating qms_register_ticket_online procedure...");
    await query(sql);
    console.log("Success!");
    process.exit(0);
  } catch (e: any) {
    console.error("Error updating procedure:", e.message);
    process.exit(1);
  }
}

updateProcedure();
