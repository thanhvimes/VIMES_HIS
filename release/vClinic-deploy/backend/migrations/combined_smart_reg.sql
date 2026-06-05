
-- ============================================================
-- Combined Smart Registration Migration
-- ============================================================

CREATE OR REPLACE FUNCTION hms_check_registration_v2(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_mode TEXT := p_payload->>'mode';
    v_patient JSONB := p_payload->'patient';
    v_doc JSONB := p_payload->'doc';
    v_exam JSONB := p_payload->'exam';
    v_patientno INT;
    v_room_id INT := (v_exam->>'roomId')::INT;
    v_card_no TEXT := COALESCE(p_payload->'card'->>'cardNo', v_doc->>'insuranceNumber', '');
    v_result JSONB;
    v_messages TEXT[] := ARRAY[]::TEXT[];
    v_is_valid BOOLEAN := TRUE;
    v_count INT;
    v_exist_patient_info JSONB;
    v_open_doc_info JSONB;
BEGIN
    IF v_mode IS NULL OR v_mode NOT IN ('ADD_PATIENT', 'ADD_DOC', 'ADD_EXAM') THEN
        RETURN jsonb_build_object('isValid', FALSE, 'message', 'Mode invalid', 'severity', 'ERROR');
    END IF;

    -- Basic check
    IF v_room_id IS NULL THEN
        v_messages := array_append(v_messages, 'Thiếu Phòng khám.');
        v_is_valid := FALSE;
    END IF;

    -- Smart patient lookup for ADD_PATIENT (Informational only, not blocking)
    IF v_is_valid AND v_mode = 'ADD_PATIENT' AND (v_patient->>'sin') IS NOT NULL AND (v_patient->>'sin') <> '' THEN
        SELECT hp_patientno INTO v_patientno FROM hms_patient WHERE hp_sin = v_patient->>'sin' LIMIT 1;
        IF v_patientno IS NOT NULL THEN
            v_messages := array_append(v_messages, 'Phát hiện bệnh nhân cũ theo CCCD. Sẽ tự động gộp vào Mã BN: ' || v_patientno);
        END IF;
    END IF;

    -- Duplicate exam check
    IF v_is_valid AND v_mode = 'ADD_EXAM' THEN
        SELECT COUNT(*) INTO v_count FROM hms_exam 
        WHERE he_docno = (v_doc->>'docNo')::INT AND he_roomid = v_room_id AND DATE(he_examdate) = CURRENT_DATE AND he_status <> 'C';
        IF v_count > 0 THEN
            v_messages := array_append(v_messages, 'Đã có phiếu khám tại phòng này hôm nay.');
            v_is_valid := FALSE;
        END IF;
    END IF;

    v_result := jsonb_build_object(
        'isValid', v_is_valid,
        'message', array_to_string(v_messages, ' '),
        'severity', CASE WHEN v_is_valid AND array_length(v_messages, 1) > 0 THEN 'WARNING' WHEN v_is_valid THEN 'SUCCESS' ELSE 'ERROR' END
    );
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION hms_register_patient_v2(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_patientno INT;
    v_docno     INT;
    v_cardidx   INT := 0;
    v_receptno  INT;
    v_receptidx INT;
    v_mode   TEXT   := p_payload->>'mode';
    v_user   TEXT   := p_payload->>'currentUser';
    v_patient JSONB := p_payload->'patient';
    v_doc     JSONB := p_payload->'doc';
    v_card    JSONB := p_payload->'card';
    v_exam    JSONB := p_payload->'exam';
    v_result JSONB;
BEGIN
    v_result := hms_check_registration_v2(p_payload);
    IF NOT (v_result->>'isValid')::BOOLEAN THEN
        RAISE EXCEPTION 'HMS Error: %', (v_result->>'message');
    END IF;

    -- SMART TRANSITION
    IF v_mode = 'ADD_PATIENT' AND (v_patient->>'sin') IS NOT NULL AND (v_patient->>'sin') <> '' THEN
        SELECT hp_patientno INTO v_patientno FROM hms_patient WHERE hp_sin = v_patient->>'sin' LIMIT 1;
        IF v_patientno IS NOT NULL THEN
            UPDATE hms_patient SET hp_updatedby = v_user, hp_updateddate = NOW() WHERE hp_patientno = v_patientno;
            v_mode := 'ADD_DOC';
        END IF;
    END IF;

    IF v_mode = 'ADD_PATIENT' THEN
        SELECT nextval('hms_patient_hp_patientno_seq')::INT INTO v_patientno;
        INSERT INTO hms_patient (hp_createdby, hp_createddate, hp_patientno, hp_surname, hp_midname, hp_firstname, hp_birthdate, hp_sex, hp_sin, hp_dtladdr)
        VALUES (v_user, NOW(), v_patientno, v_patient->>'surname', v_patient->>'midName', v_patient->>'firstName', NULLIF(v_patient->>'birthDate', '')::DATE, v_patient->>'sex', v_patient->>'sin', v_patient->>'dtlAddr');
    ELSE
        v_patientno := COALESCE(v_patientno, (v_patient->>'patientNo')::INT);
    END IF;

    -- MERGE DOC LOGIC
    IF v_mode = 'ADD_DOC' THEN
        SELECT hd_docno INTO v_docno FROM hms_doc WHERE hd_patientno = v_patientno AND DATE(hd_admitdate) = CURRENT_DATE AND hd_status <> 'T' ORDER BY hd_admitdate DESC LIMIT 1;
        IF v_docno IS NOT NULL THEN
            v_mode := 'ADD_EXAM';
        END IF;
    END IF;

    IF v_mode IN ('ADD_PATIENT', 'ADD_DOC') THEN
        SELECT nextval('hms_doc_hd_docno_seq')::INT INTO v_docno;
        INSERT INTO hms_doc (hd_createdby, hd_createddate, hd_docno, hd_patientno, hd_status, hd_admitdate, hd_admitdept)
        VALUES (v_user, NOW(), v_docno, v_patientno, 'O', NOW(), v_doc->>'admitDept');
    ELSE
        v_docno := COALESCE(v_docno, (v_doc->>'docNo')::INT);
    END IF;

    -- EXAM
    SELECT COALESCE(MAX(he_receptno), 0) + 1 INTO v_receptno FROM hms_exam WHERE he_roomid = (v_exam->>'roomId')::INT AND DATE(he_examdate) = CURRENT_DATE;
    SELECT nextval('hms_exam_he_receptidx_asq')::INT INTO v_receptidx;
    INSERT INTO hms_exam (he_createdby, he_createddate, he_patientno, he_docno, he_deptid, he_roomid, he_receptno, he_receptidx, he_status, he_examdate)
    VALUES (v_user, NOW(), v_patientno, v_docno, v_exam->>'deptId', (v_exam->>'roomId')::INT, v_receptno, v_receptidx, 'O', NOW());

    RETURN jsonb_build_object('success', true, 'patientNo', v_patientno, 'docNo', v_docno, 'receptNo', v_receptno);
END;
$$ LANGUAGE plpgsql;
