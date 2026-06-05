
-- =============================================================================
-- FULL COMBINED SMART REGISTRATION (009 + 010)
-- =============================================================================

CREATE OR REPLACE FUNCTION hms_check_registration_v2(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    v_mode TEXT := p_payload->>'mode';
    v_patient JSONB := p_payload->'patient';
    v_doc JSONB := p_payload->'doc';
    v_exam JSONB := p_payload->'exam';
    
    v_patientno INT;
    v_room_id INT := (v_exam->>'roomId')::INT;
    v_dept_id TEXT := v_exam->>'deptId';
    v_card_no TEXT := COALESCE(p_payload->'card'->>'cardNo', v_doc->>'insuranceNumber', '');
    
    v_result JSONB;
    v_messages TEXT[] := ARRAY[]::TEXT[];
    v_is_valid BOOLEAN := TRUE;
    v_count INT;
    v_exist_patient_info JSONB;
    v_open_doc_info JSONB;
BEGIN
    -- 1. KIỂM TRA MODE
    IF v_mode IS NULL OR v_mode NOT IN ('ADD_PATIENT', 'ADD_DOC', 'ADD_EXAM') THEN
        RETURN jsonb_build_object(
            'isValid', FALSE,
            'message', 'Chế độ (mode) không hợp lệ.',
            'severity', 'ERROR'
        );
    END IF;

    -- 2. KIỂM TRA PHÒNG KHÁM
    IF v_room_id IS NULL THEN
        v_messages := array_append(v_messages, 'Thiếu thông tin Phòng khám.');
        v_is_valid := FALSE;
    END IF;

    -- 3. KIỂM TRA BỆNH NHÂN CŨ (ADD_DOC, ADD_EXAM)
    IF v_mode IN ('ADD_DOC', 'ADD_EXAM') THEN
        v_patientno := NULLIF(v_patient->>'patientNo', '')::INT;
        IF v_patientno IS NULL THEN
            v_messages := array_append(v_messages, 'Thiếu mã bệnh nhân.');
            v_is_valid := FALSE;
        END IF;
    END IF;

    -- 4. KIỂM TRA TRÙNG PHIẾU TRONG NGÀY
    IF v_is_valid AND v_mode IN ('ADD_EXAM') THEN
        IF (v_doc->>'docNo') IS NOT NULL THEN
            SELECT COUNT(*) INTO v_count FROM hms_exam 
            WHERE he_docno = (v_doc->>'docNo')::INT 
              AND he_roomid = v_room_id 
              AND he_deptid = v_dept_id
              AND DATE(he_examdate) = CURRENT_DATE 
              AND he_status <> 'C';
            IF v_count > 0 THEN
                DECLARE
                    v_room_name TEXT;
                    v_dept_name TEXT;
                BEGIN
                    SELECT hrl_roomname INTO v_room_name FROM hms_roomlist WHERE hrl_id = v_room_id AND hrl_deptid = v_dept_id LIMIT 1;
                    SELECT sd_name INTO v_dept_name FROM sys_dept WHERE sd_id = v_dept_id LIMIT 1;
                    v_messages := array_append(v_messages, 'Bệnh nhân này ĐÃ CÓ phiếu khám tại [' || COALESCE(v_room_name, v_room_id::text) || '] - Khoa [' || COALESCE(v_dept_name, v_dept_id) || '] hôm nay rồi.');
                END;
                v_is_valid := FALSE;
            END IF;
        END IF;
    END IF;

    -- 7. CẢNH BÁO BỆNH NHÂN CŨ (Cho ADD_PATIENT) - KHÔNG BLOCK
    IF v_is_valid AND v_mode = 'ADD_PATIENT' AND (v_patient->>'sin') IS NOT NULL AND (v_patient->>'sin') <> '' THEN
        SELECT hp_patientno INTO v_patientno FROM hms_patient WHERE hp_sin = v_patient->>'sin' LIMIT 1;
        IF v_patientno IS NOT NULL THEN
            v_messages := array_append(v_messages, 'Phát hiện bệnh nhân cũ theo số CCCD ' || (v_patient->>'sin') || '. Hệ thống sẽ tự động gộp vào Mã BN: ' || v_patientno);
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
    v_count     INT;
    
    -- Bóc tách các node chính từ JSON
    v_mode   TEXT   := p_payload->>'mode';
    v_user   TEXT   := p_payload->>'currentUser';
    v_patient JSONB := p_payload->'patient';
    v_doc     JSONB := p_payload->'doc';
    v_card    JSONB := p_payload->'card';
    v_exam    JSONB := p_payload->'exam';
    v_result JSONB;
BEGIN
    -- Kiểm tra nghiệp vụ
    v_result := hms_check_registration_v2(p_payload);
    IF NOT (v_result->>'isValid')::BOOLEAN THEN
        RAISE EXCEPTION 'HMS Registration Error [%]: %', (v_result->>'severity'), (v_result->>'message');
    END IF;

    -- Thiết lập ngữ cảnh
    PERFORM set_config('app.current_user_id', v_user, true);
    PERFORM set_config('app.context_module', 'RECEPTION_REG', true);

    -- 1. XỬ LÝ BỆNH NHÂN (Idempotent / Smart)
    IF v_mode = 'ADD_PATIENT' AND (v_patient->>'sin') IS NOT NULL AND (v_patient->>'sin') <> '' THEN
        SELECT hp_patientno INTO v_patientno FROM hms_patient WHERE hp_sin = v_patient->>'sin' LIMIT 1;
        IF v_patientno IS NOT NULL THEN
            -- Cập nhật thông tin BN
            UPDATE hms_patient SET
                hp_surname = v_patient->>'surname', hp_midname = v_patient->>'midName', hp_firstname = v_patient->>'firstName',
                hp_birthdate = NULLIF(v_patient->>'birthDate', '')::DATE, hp_sex = v_patient->>'sex',
                hp_updatedby = v_user, hp_updateddate = NOW()
            WHERE hp_patientno = v_patientno;
            v_mode := 'ADD_DOC';
        END IF;
    END IF;

    IF v_mode = 'ADD_PATIENT' THEN
        SELECT nextval('hms_patient_hp_patientno_seq')::INT INTO v_patientno;
        INSERT INTO hms_patient (hp_createdby, hp_createddate, hp_patientno, hp_patientid, hp_surname, hp_midname, hp_firstname, hp_birthdate, hp_sex, hp_sin, hp_dtladdr, hp_nationality)
        VALUES (v_user, NOW(), v_patientno, v_patient->>'patientId', v_patient->>'surname', v_patient->>'midName', v_patient->>'firstName', NULLIF(v_patient->>'birthDate', '')::DATE, v_patient->>'sex', v_patient->>'sin', v_patient->>'dtlAddr', 'VN');
    ELSE
        v_patientno := COALESCE(v_patientno, NULLIF(v_patient->>'patientNo', '')::INT);
    END IF;

    -- 2. XỬ LÝ HỒ SƠ KHÁM (Gộp hồ sơ trong ngày)
    IF v_mode = 'ADD_DOC' AND v_patientno IS NOT NULL THEN
        SELECT hd_docno INTO v_docno FROM hms_doc WHERE hd_patientno = v_patientno AND DATE(hd_admitdate) = CURRENT_DATE AND hd_status <> 'T' ORDER BY hd_admitdate DESC LIMIT 1;
        IF v_docno IS NOT NULL THEN
            v_mode := 'ADD_EXAM';
            -- Kiểm tra trùng phiếu sau khi chuyển mode
            SELECT COUNT(*) INTO v_count FROM hms_exam 
            WHERE he_docno = v_docno AND he_roomid = (v_exam->>'roomId')::INT AND he_deptid = v_exam->>'deptId' AND DATE(he_examdate) = CURRENT_DATE AND he_status <> 'C';
            IF v_count > 0 THEN
                RAISE EXCEPTION 'HMS Registration Error [ERROR]: Đã có phiếu khám tại phòng này hôm nay (Tự động phát hiện khi gộp hồ sơ).';
            END IF;
        END IF;
    END IF;

    IF v_mode IN ('ADD_PATIENT', 'ADD_DOC') THEN
        SELECT nextval('hms_doc_hd_docno_seq')::INT INTO v_docno;
        INSERT INTO hms_doc (hd_createdby, hd_createddate, hd_docno, hd_patientno, hd_status, hd_telephone, hd_object, hd_admitdate, hd_admitdept)
        VALUES (v_user, NOW(), v_docno, v_patientno, 'O', v_doc->>'telephone', COALESCE(NULLIF(v_doc->>'objectId', ''), '7')::INT, NOW(), v_doc->>'admitDept');
    ELSE
        v_docno := COALESCE(v_docno, NULLIF(v_doc->>'docNo', '')::INT);
        -- Fallback: Nếu là thêm phiếu (ADD_EXAM) mà vẫn chưa có v_docno, thử tìm hồ sơ đang mở trong ngày
        IF v_docno IS NULL AND v_patientno IS NOT NULL THEN
             SELECT hd_docno INTO v_docno FROM hms_doc 
             WHERE hd_patientno = v_patientno AND DATE(hd_admitdate) = CURRENT_DATE AND hd_status <> 'T' 
             ORDER BY hd_admitdate DESC LIMIT 1;
        END IF;
    END IF;

    -- 3. XỬ LÝ THẺ BHYT
    IF v_mode IN ('ADD_PATIENT', 'ADD_DOC') AND (v_card->>'cardNo') IS NOT NULL AND (v_card->>'cardNo') <> '' THEN
        SELECT nextval('hms_card_hc_idx_seq')::INT INTO v_cardidx;
        INSERT INTO hms_card (hc_createdby, hc_createddate, hc_patientno, hc_cardno, hc_idx, hc_regdate, hc_expdate, hc_active)
        VALUES (v_user, NOW(), v_patientno, v_card->>'cardNo', v_cardidx, NULLIF(v_card->>'regDate', '')::DATE, NULLIF(v_card->>'expDate', '')::DATE, 'Y');
        UPDATE hms_doc SET hd_cardidx = v_cardidx, hd_cardno = v_card->>'cardNo' WHERE hd_docno = v_docno;
    END IF;

    -- 4. PHIẾU KHÁM & STT
    PERFORM pg_advisory_xact_lock(hashtext('room_' || (v_exam->>'roomId')));
    SELECT COALESCE(MAX(he_receptno), 0) + 1 INTO v_receptno FROM hms_exam WHERE he_roomid = (v_exam->>'roomId')::INT AND DATE(he_examdate) = CURRENT_DATE;
    SELECT nextval('hms_exam_he_receptidx_asq')::INT INTO v_receptidx;
    INSERT INTO hms_exam (he_createdby, he_createddate, he_patientno, he_docno, he_deptid, he_roomid, he_receptno, he_receptidx, he_status, he_examdate)
    VALUES (v_user, NOW(), v_patientno, v_docno, v_exam->>'deptId', (v_exam->>'roomId')::INT, v_receptno, v_receptidx, 'O', NOW());

    RETURN jsonb_build_object('success', true, 'patientNo', v_patientno, 'docNo', v_docno, 'receptNo', v_receptno, 'receptIdx', v_receptidx);
END;
$$ LANGUAGE plpgsql;
