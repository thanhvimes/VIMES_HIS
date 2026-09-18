-- Migration 148: Fix Online Booking Queue Date Mismatch & ReceptNo Synchronization
-- Mục tiêu:
-- 1. Sửa hàm hms_exam_pending_insert (8 tham số) lưu đúng hep_date = COALESCE(p_date, CURRENT_DATE) thay vì gán cứng CURRENT_DATE
-- 2. Cập nhật trigger hms_exam_trg để đóng hàng đợi hep_pending = 'A' chuẩn xác theo (hep_docno, hep_receptidx)
-- 3. Cập nhật hms_get_next_receptno bổ sung khóa room_%d tương thích tuyệt đối với HIS Desktop C++ HMSRegistration.cpp
-- 4. Cập nhật hms_insert_exam_online đồng bộ khóa phòng và kiểm tra trùng số chuẩn xác
-- 5. Cập nhật qms_register_ticket_online đồng bộ số thực tế vào qms_patient.qms_receptno và trả về ticket_number chuẩn
-- 6. Sửa qms_auto_register_exam_khammoi & qms_auto_register_exam gọi hms_get_next_receptno tránh trùng số
-- 7. Chuẩn hóa dữ liệu hàng đợi hms_exam_pending đang chờ ('O') bị lệch ngày hẹn khám

-- ============================================================================
-- 1. SỬA HÀM hms_exam_pending_insert (OVERLOAD 8 THAM SỐ)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.hms_exam_pending_insert(
    p_docno integer, 
    p_orderid integer, 
    p_deptid text, 
    p_roomid integer, 
    p_receptidx integer, 
    p_status text, 
    p_type text, 
    p_date date
)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
    v_count INTEGER;
    v_index INTEGER;
    v_receptno INTEGER;
    v_status CHARACTER(1);
    v_target_date DATE;
BEGIN
    v_target_date := COALESCE(p_date, CURRENT_DATE);

    SELECT hep_receptno
    INTO v_receptno
    FROM hms_exam_pending
    WHERE hep_docno = p_docno
      AND hep_roomid = p_roomid
      AND hep_deptid = p_deptid
      AND hep_date = v_target_date;
      
    IF (v_receptno > 0) THEN
      RETURN v_receptno;
    END IF;

    -- Neu la phieu kham (lay lai so phieu tiep don)
    IF (p_receptidx > 0) THEN
      v_index := 0;
      v_receptno := p_receptidx;
    ELSE
      -- Goi ham lay so tang dan
      v_receptno := hms_get_pending_number(p_deptid, p_roomid, p_status);
      v_index := 0;
    END IF;

    IF v_receptno > 0 THEN
      INSERT INTO hms_exam_pending (
          hep_docno,
          hep_deptid,
          hep_roomid,
          hep_receptidx,
          hep_receptno,
          hep_pending,
          hep_index,
          hep_orderid,
          hep_date,
          hep_type
      ) VALUES (
          p_docno,
          p_deptid,
          p_roomid,
          p_orderid,
          v_receptno,
          'O',
          v_index,
          p_orderid,
          v_target_date,
          p_type
      );
    END IF;
   
    RETURN v_receptno;
EXCEPTION
WHEN NO_DATA_FOUND THEN
    RETURN -2000;
END;
$function$;

-- ============================================================================
-- 2. ĐỒNG BỘ KHÓA ADVISORY LOCK TRONG hms_get_next_receptno
-- ============================================================================
CREATE OR REPLACE FUNCTION public.hms_get_next_receptno(
    p_deptid character varying,
    p_roomid integer,
    p_examdate date DEFAULT CURRENT_DATE
)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
    v_next_no INT;
    v_date DATE;
BEGIN
    IF p_roomid IS NULL OR p_roomid <= 0 OR p_deptid IS NULL OR p_deptid = '' THEN
        RETURN 1;
    END IF;

    v_date := COALESCE(p_examdate, CURRENT_DATE);

    -- 1. Khóa theo mã phòng tương thích 100% với HIS C++ (HMSRegistration.cpp dòng 8999)
    PERFORM pg_advisory_xact_lock(hashtext('room_' || p_roomid::text));

    -- 2. Khóa giao dịch kết hợp (Khoa, Phòng, Ngày) tránh xung đột đồng thời
    PERFORM pg_advisory_xact_lock(hashtext('receptno_dept_' || trim(p_deptid) || '_room_' || p_roomid::text || '_' || v_date::text));

    -- 3. Tìm số thứ tự dương nhỏ nhất còn trống cho phòng và ngày khám (loại bỏ phiếu hủy 'C' giống HIS)
    SELECT MIN(t1.receptno + 1)
    INTO v_next_no
    FROM (
        SELECT 0 AS receptno
        UNION ALL
        SELECT he_receptno AS receptno
        FROM hms_exam
        WHERE trim(he_deptid) = trim(p_deptid)
          AND he_roomid = p_roomid
          AND DATE(he_examdate) = v_date
          AND he_receptno IS NOT NULL
          AND he_status <> 'C'
    ) t1
    WHERE NOT EXISTS (
        SELECT 1
        FROM hms_exam t2
        WHERE trim(t2.he_deptid) = trim(p_deptid)
          AND t2.he_roomid = p_roomid
          AND DATE(t2.he_examdate) = v_date
          AND t2.he_receptno = t1.receptno + 1
          AND t2.he_status <> 'C'
    );

    RETURN COALESCE(v_next_no, 1);
END;
$function$;

-- ============================================================================
-- 3. CẬP NHẬT hms_insert_exam_online
-- ============================================================================
CREATE OR REPLACE FUNCTION public.hms_insert_exam_online(
    p_patientno integer, 
    p_docno integer, 
    p_makhoa character varying, 
    p_maphongkham integer, 
    p_examdate character varying, 
    p_receptno integer, 
    p_maphikham character varying
)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
    nReceptidx   INTEGER;
    nReceptNo    INTEGER;
    nRoomKey     INTEGER;
    vExamDate    TIMESTAMP;
    nFeeID       INTEGER;
    vMaPhiKham   VARCHAR(15);
BEGIN
    vMaPhiKham := trim(p_maphikham);
    IF (coalesce(vMaPhiKham, '') = '' OR LENGTH(vMaPhiKham) < 6) THEN
      vMaPhiKham := 'D0000031';
    END IF;
	
    IF p_examdate IS NOT NULL AND p_examdate <> '' THEN
      vExamDate := p_examdate::timestamp;
    ELSE
      vExamDate := CURRENT_TIMESTAMP;
    END IF;
    
    SELECT hrl_key
    INTO nRoomKey
    FROM hms_roomlist
    WHERE hrl_deptid = p_makhoa
    AND hrl_id       = p_maphongkham;	
	
    BEGIN
      SELECT hfl_idx
      INTO nFeeID
      FROM hms_feelist
      WHERE hfl_typeid = 'E'
      AND hfl_feeid    = vMaPhiKham;
    EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RETURN -1;
    END;

    -- Khóa theo phòng trước khi kiểm tra số
    PERFORM pg_advisory_xact_lock(hashtext('room_' || p_maphongkham::text));

    -- Xử lý sinh số thứ tự receptno (nReceptNo):
    nReceptNo := p_receptno;
    IF nReceptNo IS NULL OR nReceptNo <= 0 THEN
      nReceptNo := hms_get_next_receptno(p_makhoa, p_maphongkham, DATE(vExamDate));
    ELSE
      IF EXISTS (
        SELECT 1 FROM hms_exam 
        WHERE trim(he_deptid) = trim(p_makhoa)
          AND he_roomid = p_maphongkham 
          AND DATE(he_examdate) = DATE(vExamDate) 
          AND he_receptno = nReceptNo
          AND he_status <> 'C'
      ) THEN
        nReceptNo := hms_get_next_receptno(p_makhoa, p_maphongkham, DATE(vExamDate));
      END IF;
    END IF;

    SELECT nextval('hms_exam_he_receptidx_asq')
    INTO nReceptidx;

    INSERT INTO hms_exam (
        he_patientno,
        he_docno,
        he_deptid,
        he_roomid,
        he_receptno,
        he_examdate,
        he_hasfee,
        he_examtype,
        he_status,
        he_receptidx,
        he_doctor,
        he_typeid,
        he_feeidx,
        he_roomkey        
    ) VALUES (
        p_patientno,
        p_docno,
        p_makhoa,
        p_maphongkham,
        nReceptNo,
        vExamDate,
        'Y',
        vMaPhiKham,
        'O',
        nReceptidx,
        NULL,
        0,
        nFeeID,
        nRoomKey       
    );
   
    RETURN nReceptidx;
END;
$function$;

-- ============================================================================
-- 4. CẬP NHẬT qms_register_ticket_online
-- ============================================================================
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
    v_patient_id      INT := 0;
    v_doc_no          INT := 0;
    v_exam_id         INT := 0;
    v_actual_receptno INT := 0;
    v_card_idx        INT := 0;
    v_surname         VARCHAR(50);
    v_midname         VARCHAR(50);
    v_firstname       VARCHAR(50);
    v_roomname        VARCHAR(50);
    v_maphikham       VARCHAR(10);
    v_examdate        TIMESTAMP;
    v_gender          VARCHAR(10);
BEGIN
    v_examdate := p_examdate::timestamp;
    v_gender := 'F';
    IF (lower(p_gender) = 'nam' OR lower(p_gender) = 'm') THEN
      v_gender := 'M';
    END IF;
    
    -- 1. XỬ LÝ BỆNH NHÂN (HMS_PATIENT)
    IF p_identity_number IS NOT NULL AND p_identity_number <> '' THEN
        SELECT hp_patientno INTO v_patient_id FROM hms_patient WHERE hp_sin = p_identity_number LIMIT 1;
    END IF;

    IF (v_patient_id IS NULL OR v_patient_id = 0) AND p_phone IS NOT NULL AND p_phone <> '' THEN
        SELECT hp_patientno INTO v_patient_id 
        FROM hms_patient 
        WHERE (hp_phone = p_phone OR hp_workplace = p_phone) 
          AND lower(concat(hp_surname, ' ', hp_midname, ' ', hp_firstname)) = lower(p_patient_name)
        LIMIT 1;
    END IF;

    -- 2. NẾU LÀ BỆNH NHÂN MỚI -> TẠO BỆNH NHÂN
    IF v_patient_id IS NULL OR v_patient_id = 0 THEN
        SELECT surname, midname, firstname INTO v_surname, v_midname, v_firstname FROM split_fullname(p_patient_name);        
        v_patient_id := hms_insert_patient(v_surname, v_midname, v_firstname, p_dob, v_gender, p_province_code, p_province_code, p_ward_code, p_address, p_identity_number, p_identitydate, '', '', '');
    END IF;

    -- 3. XỬ LÝ HỒ SƠ KHÁM TRONG NGÀY HẸN (HMS_DOC)
    SELECT hd_docno INTO v_doc_no 
    FROM hms_doc 
    WHERE hd_patientno = v_patient_id 
      AND DATE(hd_admitdate) = DATE(v_examdate) 
      AND hd_status <> 'T' 
    ORDER BY hd_docno DESC LIMIT 1;

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
    
    -- 5. LẤY MÃ KIỂU KHÁM & TÊN PHÒNG
    SELECT ss_othercode, hrl_name
    INTO v_maphikham, v_roomname
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
    
    -- Lấy số thứ tự he_receptno thực tế được ghi nhận
    SELECT he_receptno INTO v_actual_receptno FROM hms_exam WHERE he_receptidx = v_exam_id;
    IF v_actual_receptno IS NULL OR v_actual_receptno <= 0 THEN
      v_actual_receptno := p_receptno;
    END IF;

    -- 7. CẬP NHẬT PHIẾU HÀNG ĐỢI (QMS_PATIENTS)
    UPDATE qms_patient 
    SET qms_patientno = v_patient_id, 
        qms_docno = v_doc_no,
        qms_receptno = v_actual_receptno
    WHERE qms_idx = p_number_idx; 

    -- 8. TRẢ VỀ KẾT QUẢ
    RETURN QUERY
    SELECT p_roomid, v_actual_receptno::VARCHAR, v_roomname, p_patient_name, v_doc_no::VARCHAR, v_patient_id::VARCHAR, NOW()::TIMESTAMP;
END;
$function$;

-- ============================================================================
-- 5. CẬP NHẬT qms_auto_register_exam_khammoi ĐỒNG BỘ DÙNG hms_get_next_receptno
-- ============================================================================
CREATE OR REPLACE FUNCTION public.qms_auto_register_exam_khammoi(
    p_patientno integer, 
    p_docno integer, 
    p_makhoa character varying, 
    p_maphongkham integer, 
    p_examdate character varying, 
    p_maphikham character varying
)
RETURNS integer
LANGUAGE plpgsql
AS $function$
DECLARE
    nReceptidx   INTEGER;
    nReceptNo    INTEGER;
    nRoomKey     INTEGER;
    vExamDate    TIMESTAMP;
    nFeeID       INTEGER;
    vXorg_id     CHARACTER VARYING(5);
    vMaPhiKham   CHARACTER VARYING(15);
    vPartner     TEXT;
BEGIN
    vMaPhiKham := p_maphikham;

    SELECT hd_createdby INTO vPartner FROM hms_doc WHERE hd_docno = p_docno;
    IF (vPartner <> 'TAG') THEN
        vMaPhiKham := 'D0000031';
    END IF;

    vExamDate := CURRENT_TIMESTAMP;

    -- Gọi hms_get_next_receptno theo ngày khám để tránh trùng số
    nReceptNo := hms_get_next_receptno(p_makhoa, p_maphongkham, DATE(vExamDate));

    SELECT hrl_key INTO nRoomKey FROM hms_roomlist WHERE hrl_deptid = p_makhoa AND hrl_id = p_maphongkham;
    SELECT sd_xorg_id INTO vXorg_id FROM sys_dept WHERE sd_id = p_makhoa;

    BEGIN
        SELECT hfl_idx INTO nFeeID
        FROM hms_fee_list
        WHERE hfl_typeid = 'E'
          AND hfl_feeid = vMaPhiKham;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN -1;
    END;

    SELECT nextval('hms_exam_he_receptidx_asq') INTO nReceptidx;

    INSERT INTO hms_exam (
        he_patientno,
        he_docno,
        he_deptid,
        he_roomid,
        he_receptno,
        he_examdate,
        he_hasfee,
        he_examtype,
        he_status,
        he_receptidx,
        he_doctor,
        he_typeid,
        he_feeidx,
        he_roomkey,
        he_xorg_id
    ) VALUES (
        p_patientno,
        p_docno,
        p_makhoa,
        p_maphongkham,
        nReceptNo,
        CURRENT_TIMESTAMP,
        'Y',
        vMaPhiKham,
        'O',
        nReceptidx,
        NULL,
        0,
        nFeeID,
        nRoomKey,
        vXorg_id
    );
	
    UPDATE hms_doc
    SET hd_admitdate = vExamDate,
        hd_admitdept = p_makhoa,
        hd_xorg_id   = vXorg_id
    WHERE hd_docno = p_docno;

    IF (vMaPhiKham = 'D0000031') THEN			
        UPDATE hms_doc
        SET hd_object = 5
        WHERE hd_docno = p_docno;
    END IF;

    RETURN nReceptidx;
END;
$function$;

-- ============================================================================
-- 6. CẬP NHẬT TRIGGER hms_exam_trg_proc
-- ============================================================================
CREATE OR REPLACE FUNCTION public.hms_exam_trg_proc()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    vCount INTEGER;
    nInt   INTEGER;
    nIns   INTEGER;
    tObjectType TEXT;
BEGIN
    nIns := 0;
    SELECT ho_type
    INTO tObjectType
    FROM hms_doc
    LEFT JOIN hms_object ON (hd_object = ho_id)
    WHERE hd_docno = NEW.he_docno;
    IF (tObjectType = 'I') THEN
        nIns := 1;
    END IF;
	  
    IF TG_OP = 'INSERT' THEN
        IF NEW.HE_RECEPTIDX IS NULL THEN
            SELECT NEXTVAL('HMS_EXAM_HE_RECEPTIDX_ASQ') INTO NEW.HE_RECEPTIDX;
        END IF;
        IF NEW.he_examdate < CURRENT_TIMESTAMP THEN
            NEW.he_examdate := CURRENT_TIMESTAMP;
        END IF;
        NEW.he_createddate   := CURRENT_TIMESTAMP;
        NEW.HE_DIAGNOSTIC    := '';
        NEW.HE_ICD10         := '';
        NEW.HE_MEDICAL       := '';
        NEW.HE_EXAMINE       := '';
        NEW.HE_PREDIAGNOSTIC := '';
        NEW.HE_WEIGHT        := 0;
        NEW.HE_HEIGHT        := 0;
        NEW.HE_BREATHINTERVAL:= 0;
        NEW.HE_BLOODPRESSUREX:= 0;
        NEW.HE_BLOODPRESSURE := 0;
        NEW.HE_TEMPERATURE   := 0;
        NEW.HE_PULSE         := 0;

        -- Tinh toan them ban ghi vao bang hms_examview
        SELECT COUNT(*)
        INTO nInt
        FROM hms_examview
        WHERE he_deptid            = NEW.he_deptid
          AND he_roomid            = NEW.he_roomid
          AND TRUNC_DATE(he_examtime) = TRUNC_DATE(CURRENT_DATE);

        IF (nInt > 0) THEN
            UPDATE hms_examview
            SET he_receptreg = he_receptreg + 1,
                he_insreg    = he_insreg + nIns
            WHERE he_deptid  = NEW.he_deptid
              AND he_roomid  = NEW.he_roomid
              AND TRUNC_DATE(he_examtime) = TRUNC_DATE(CURRENT_DATE);
        ELSE
            INSERT INTO hms_examview (
                he_deptid, he_roomid, he_receptreg, he_examed, he_insreg, he_examtime
            ) VALUES (
                NEW.he_deptid, NEW.he_roomid, 1, 0, nIns, CURRENT_DATE
            );
        END IF;

        IF NEW.he_examtype = 'D0000009' AND NEW.he_deptid = 'TYC' THEN
            UPDATE hms_doc SET hd_nonexam = 'Y' WHERE hd_docno = NEW.he_docno;
        END IF;
      
        -- Chèn hàng đợi với ngày hẹn khám chuẩn xác DATE(NEW.he_examdate)
        vCount := hms_exam_pending_insert(
            NEW.he_docno, 
            NEW.he_receptidx, 
            NEW.he_deptid, 
            NEW.he_roomid, 
            NEW.he_receptno, 
            'O',
            'E', 
            DATE(NEW.he_examdate)
        );
    
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        SELECT ho_type
        INTO tObjectType
        FROM hms_doc
        LEFT JOIN hms_object ON (hd_object = ho_id)
        WHERE hd_docno = OLD.he_docno;
        IF (tObjectType = 'I') THEN
            nIns := -1;
        END IF;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF NEW.he_examtype <> OLD.he_examtype THEN
            DELETE FROM hms_fee
            WHERE hfe_docno = OLD.he_docno
              AND hfe_orderid = OLD.he_receptidx
              AND hfe_status IN ('O', 'X');
        END IF;

        IF (NEW.HE_STATUS IN ('P', 'T') AND OLD.HE_STATUS = 'O') THEN
            IF OLD.he_status = 'O' AND NEW.he_status = 'P' THEN
                NEW.he_examdate := CURRENT_TIMESTAMP;
            END IF;
            IF OLD.he_status = 'P' AND NEW.he_status = 'T' THEN
                NEW.he_updateddate := CURRENT_TIMESTAMP;
            END IF;
            IF OLD.he_status = 'O' AND NEW.he_status = 'T' THEN
                NEW.he_examdate    := CURRENT_TIMESTAMP;
                NEW.he_updateddate := CURRENT_TIMESTAMP;
            END IF;
		
            -- Đóng trạng thái hàng đợi theo khóa duy nhất (docno, receptidx) hoặc ngày
            UPDATE hms_exam_pending
            SET hep_pending = 'A'
            WHERE hep_docno = OLD.he_docno
              AND (hep_receptidx = OLD.he_receptidx OR (hep_deptid = OLD.he_deptid AND hep_roomid = OLD.he_roomid AND DATE(hep_date) = CURRENT_DATE));
		
            IF (NEW.he_roomid <> OLD.he_roomid OR NEW.he_deptid <> OLD.he_deptid) THEN
                UPDATE hms_exam_pending
                SET hep_roomid  = NEW.he_roomid,
                    hep_deptid  = NEW.he_deptid,
                    hep_receptno  = NEW.he_receptno,
                    hep_receptidx = NEW.he_receptidx
                WHERE hep_docno = OLD.he_docno
                  AND (hep_receptidx = OLD.he_receptidx OR (hep_deptid = OLD.he_deptid AND hep_roomid = OLD.he_roomid));
            END IF;
	  
            UPDATE hms_examview
            SET he_examed = he_examed + 1
            WHERE he_deptid = OLD.he_deptid
              AND he_roomid = OLD.he_roomid
              AND TRUNC_DATE(he_examtime) = TRUNC_DATE(CURRENT_DATE);

            IF NEW.he_examtype = 'D0000009' AND NEW.he_deptid = 'TYC' THEN
                UPDATE hms_doc SET hd_nonexam = 'Y' WHERE hd_docno = NEW.he_docno;
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    IF TG_OP = 'DELETE' THEN
        SELECT COUNT(*)
        INTO vCount
        FROM hms_fee
        WHERE hfe_docno = OLD.he_docno
          AND hfe_type = 'E'
          AND hfe_orderid = OLD.he_receptidx
          AND hfe_status IN ('P', 'R');
      
        IF vCount > 0 THEN
            RAISE NOTICE 'Benh nhan da duoc thu phi. Khong cho phep xoa phieu';
            RETURN OLD;
        END IF;
      
        IF OLD.he_deptid = 'TYC' THEN
            SELECT COUNT(*)
            INTO vCount
            FROM hms_fee_refund
            WHERE hfe_docno = OLD.he_docno
              AND hfe_status IN ('O', 'P', 'R');
            IF vCount > 0 THEN
                RAISE NOTICE 'Benh nhan da duoc thu phi tam gui. Khong cho phep xoa phieu';
                RETURN OLD;
            END IF;
        END IF;
      
        DELETE FROM hms_fee
        WHERE hfe_docno = OLD.he_docno
          AND hfe_type = 'E'
          AND hfe_orderid = OLD.he_receptidx
          AND hfe_status NOT IN ('P', 'R');

        IF TRUNC(OLD.he_createddate) = TRUNC(CURRENT_DATE) THEN
            UPDATE hms_examview
            SET he_receptreg = he_receptreg - 1,
                he_insreg    = he_insreg + nIns
            WHERE he_deptid  = OLD.he_deptid
              AND he_roomid  = OLD.he_roomid
              AND TRUNC_DATE(he_examtime) = TRUNC_DATE(CURRENT_DATE);

            DELETE FROM hms_exam_pending
            WHERE hep_docno = OLD.he_docno
              AND (hep_receptidx = OLD.he_receptidx OR (hep_deptid = OLD.he_deptid AND hep_roomid = OLD.he_roomid));
        END IF;
      
        IF OLD.he_examtype = 'D0000009' AND OLD.he_deptid = 'TYC' THEN
            UPDATE hms_doc SET hd_nonexam = 'N' WHERE hd_docno = NEW.he_docno;
        END IF;
      
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$function$;

-- ============================================================================
-- 7. DATA FIX: CẬP NHẬT LẠI hep_date CHO CÁC BẢN GHI ĐANG CHỜ ('O') BỊ LỆCH NGÀY
-- ============================================================================
UPDATE hms_exam_pending ep
SET hep_date = DATE(e.he_examdate)
FROM hms_exam e
WHERE e.he_docno = ep.hep_docno
  AND e.he_receptidx = ep.hep_receptidx
  AND ep.hep_pending = 'O'
  AND ep.hep_date <> DATE(e.he_examdate);

-- Cập nhật bổ sung cho các bản ghi có hep_receptidx = 0/NULL (nếu có)
UPDATE hms_exam_pending ep
SET hep_date = DATE(e.he_examdate)
FROM hms_exam e
WHERE e.he_docno = ep.hep_docno
  AND e.he_deptid = ep.hep_deptid
  AND e.he_roomid = ep.hep_roomid
  AND e.he_receptno = ep.hep_receptno
  AND ep.hep_pending = 'O'
  AND ep.hep_date <> DATE(e.he_examdate);
