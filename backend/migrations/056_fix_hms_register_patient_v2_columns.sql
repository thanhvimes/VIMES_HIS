-- Migration 056: Fix hms_register_patient_v2 hms_patient column names (hp_address, hp_sin, hp_sindate)

CREATE OR REPLACE FUNCTION hms_register_patient_v2(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
    v_patient  JSONB;
    v_doc      JSONB;
    v_card     JSONB;
    v_exam     JSONB;
    v_user     VARCHAR(50);
    
    v_patientno INT;
    v_docno     INT;
    v_receptno  INT;
    v_receptidx INT;
    
    v_surname   VARCHAR(50);
    v_midname   VARCHAR(50);
    v_firstname VARCHAR(50);
    v_sex       VARCHAR(1);
    v_object    INT;
    v_phone     VARCHAR(20);
BEGIN
    v_patient := p_payload->'patient';
    v_doc     := p_payload->'doc';
    v_card    := p_payload->'card';
    v_exam    := p_payload->'exam';
    v_user    := COALESCE(p_payload->>'userId', 'ADMIN');

    IF v_patient IS NULL OR v_doc IS NULL OR v_exam IS NULL THEN
        RAISE EXCEPTION 'Payload không hợp lệ. Phải chứa đầy đủ: patient, doc, exam.';
    END IF;

    -- ============================================================
    -- BƯỚC 1: XỬ LÝ BỆNH NHÂN (hms_patient)
    -- ============================================================
    v_patientno := NULLIF(v_patient->>'patientNo', '')::INT;
    
    IF v_patientno IS NULL OR v_patientno = 0 THEN
        IF (v_patient->>'identityNo') IS NOT NULL AND (v_patient->>'identityNo') <> '' THEN
            SELECT hp_patientno INTO v_patientno 
            FROM hms_patient 
            WHERE hp_sin = (v_patient->>'identityNo') 
            LIMIT 1;
        END IF;
    END IF;

    IF v_patientno IS NULL OR v_patientno = 0 THEN
        SELECT surname, midname, firstname 
        INTO v_surname, v_midname, v_firstname 
        FROM split_fullname(COALESCE(v_patient->>'fullName', ''));

        v_sex := 'F';
        IF lower(v_patient->>'sex') IN ('m', 'nam', '1') THEN
            v_sex := 'M';
        END IF;

        SELECT nextval('hms_patient_hp_patientno_asq')::INT INTO v_patientno;

        INSERT INTO hms_patient (
            hp_createdby, hp_createddate,
            hp_patientno, hp_surname, hp_midname, hp_firstname,
            hp_birthdate, hp_sex, hp_ethnic,
            hp_provid, hp_distid, hp_villid,
            hp_address, hp_sin, hp_sindate,
            hp_occupation, hp_workplace
        ) VALUES (
            v_user, NOW(),
            v_patientno, v_surname, v_midname, v_firstname,
            NULLIF(v_patient->>'birthDate', '')::DATE, v_sex,
            COALESCE(NULLIF(v_patient->>'ethnicId', '')::INT, 1),
            v_patient->>'provinceId',
            v_patient->>'districtId',
            v_patient->>'wardId',
            v_patient->>'address',
            v_patient->>'identityNo',
            NULLIF(v_patient->>'identityDate', '')::DATE,
            COALESCE(NULLIF(v_patient->>'occupationId', '')::INT, 0),
            v_patient->>'workplace'
        );
    END IF;

    -- ============================================================
    -- BƯỚC 2: XỬ LÝ HỒ SƠ KHÁM (hms_doc)
    -- ============================================================
    v_docno := NULLIF(v_doc->>'docNo', '')::INT;
    v_phone := v_patient->>'phone';

    IF v_docno IS NULL OR v_docno = 0 THEN
        SELECT hd_docno INTO v_docno 
        FROM hms_doc 
        WHERE hd_patientno = v_patientno 
          AND DATE(hd_admitdate) = CURRENT_DATE
          AND hd_status <> 'C'
        LIMIT 1;
    END IF;

    IF v_docno IS NULL OR v_docno = 0 THEN
        v_object := COALESCE(NULLIF(v_doc->>'objectId', '')::INT, 7);
        
        SELECT nextval('hms_doc_hd_docno_asq')::INT INTO v_docno;

        INSERT INTO hms_doc (
            hd_createdby, hd_createddate,
            hd_docno, hd_patientno,
            hd_admitdate, hd_status,
            hd_object, hd_admitdept,
            hd_cardno, hd_insregdate, hd_insexpdate,
            hd_contacttel
        ) VALUES (
            v_user, NOW(),
            v_docno, v_patientno,
            NOW(), 'O',
            v_object, COALESCE(v_exam->>'deptId', 'KB'),
            v_card->>'cardNo',
            NULLIF(v_card->>'regDate', '')::DATE,
            NULLIF(v_card->>'expDate', '')::DATE,
            v_phone
        );
    END IF;

    -- ============================================================
    -- BƯỚC 3: XỬ LÝ THẺ BHYT (hms_card - Nếu có)
    -- ============================================================
    IF v_card IS NOT NULL AND (v_card->>'cardNo') IS NOT NULL AND (v_card->>'cardNo') <> '' THEN
        INSERT INTO hms_card (
            hc_patientno, hc_cardno, hc_regdate, hc_expdate, hc_createddate
        ) VALUES (
            v_patientno, v_card->>'cardNo',
            NULLIF(v_card->>'regDate', '')::DATE,
            NULLIF(v_card->>'expDate', '')::DATE,
            NOW()
        ) ON CONFLICT DO NOTHING;

        UPDATE hms_doc SET
            hd_cardno  = v_card->>'cardNo',
            hd_insregdate = NULLIF(v_card->>'regDate', '')::DATE,
            hd_insexpdate = NULLIF(v_card->>'expDate', '')::DATE
        WHERE hd_docno = v_docno;
    END IF;

    -- ============================================================
    -- BƯỚC 4: XỬ LÝ PHIẾU KHÁM + SINH SỐ THỨ TỰ (hms_exam)
    -- Sử dụng hms_get_next_receptno để cấp số tăng liên tục (gap-filling)
    -- ============================================================
    IF (v_exam->>'roomId') IS NULL OR (v_exam->>'roomId') = '' THEN
        RAISE EXCEPTION 'Thiếu roomId trong exam payload. Không thể sinh số thứ tự.';
    END IF;

    IF (v_exam->>'deptId') IS NULL OR (v_exam->>'deptId') = '' THEN
        RAISE EXCEPTION 'Thiếu deptId trong exam payload. Không thể sinh số thứ tự.';
    END IF;

    IF EXISTS (
        SELECT 1 FROM hms_exam 
        WHERE he_docno = v_docno 
        AND he_deptid = v_exam->>'deptId'
        AND he_roomid = (v_exam->>'roomId')::INT 
        AND DATE(he_examdate) = CURRENT_DATE
        AND he_status <> 'C'
    ) THEN
        RAISE EXCEPTION 'Phiếu khám đã tồn tại trong phòng [%] của khoa [%] cho hồ sơ này trong ngày hôm nay.', (v_exam->>'roomId'), (v_exam->>'deptId');
    END IF;

    -- Sinh số thứ tự liên tục bằng hms_get_next_receptno (bổ sung deptId)
    v_receptno := hms_get_next_receptno(v_exam->>'deptId', (v_exam->>'roomId')::INT, CURRENT_DATE);

    SELECT nextval('hms_exam_he_receptidx_asq')::INT INTO v_receptidx;

    INSERT INTO hms_exam (
        he_createdby, he_createddate,
        he_patientno, he_docno,
        he_deptid, he_roomid,
        he_receptno, he_receptidx,
        he_examtype, he_status,
        he_examdate, he_doctor,
        he_examine, he_prediagnostic, he_diagnostic,
        he_hasfee, he_payment
    ) VALUES (
        v_user, NOW(),
        v_patientno, v_docno,
        v_exam->>'deptId', (v_exam->>'roomId')::INT,
        v_receptno, v_receptidx,
        COALESCE(v_exam->>'examType', 'O'), 'O',
        NOW(),
        COALESCE(v_exam->>'doctor', ''),
        COALESCE(v_exam->>'examine', ''),
        COALESCE(v_exam->>'preDiagnostic', ''),
        COALESCE(v_exam->>'diagnostic', ''),
        CASE
            WHEN v_object IN (7, 4) OR (v_doc->>'objectId') IN ('S', '7') OR (v_exam->>'hasFee') = 'Y' THEN 'Y'
            ELSE 'N'
        END,
        'N'
    );

    RETURN jsonb_build_object(
        'success', true,
        'patientNo', v_patientno,
        'docNo', v_docno,
        'receptNo', v_receptno,
        'receptIdx', v_receptidx,
        'message', 'Đăng ký tiếp đón thành công!'
    );
END;
$function$;
