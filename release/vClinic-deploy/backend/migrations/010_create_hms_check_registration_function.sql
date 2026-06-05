
-- =============================================================================
-- Chức năng: Kiểm tra điều kiện Tiếp đón (Check Registration)
-- Phục vụ luồng: ADD_PATIENT, ADD_DOC, ADD_EXAM
-- Trả về: JSONB { isValid: boolean, message: text, severity: text, data: jsonb }
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
            'message', 'Chế độ (mode) không hợp lệ. Phải là ADD_PATIENT, ADD_DOC hoặc ADD_EXAM.',
            'severity', 'ERROR'
        );
    END IF;

    -- 2. KIỂM TRA DỮ LIỆU CƠ BẢN (Phòng khám)
    IF v_room_id IS NULL THEN
        v_messages := array_append(v_messages, 'Thiếu thông tin Phòng khám (roomId).');
        v_is_valid := FALSE;
    ELSE
        SELECT COUNT(*) INTO v_count FROM hms_roomlist WHERE hrl_id = v_room_id;
        IF v_count = 0 THEN
            v_messages := array_append(v_messages, 'Phòng khám ' || v_room_id || ' không tồn tại trong danh mục.');
            v_is_valid := FALSE;
        END IF;
    END IF;

    -- 3. KIỂM TRA BỆNH NHÂN (Cho ADD_DOC và ADD_EXAM)
    IF v_mode IN ('ADD_DOC', 'ADD_EXAM') THEN
        v_patientno := NULLIF(v_patient->>'patientNo', '')::INT;
        
        IF v_patientno IS NULL THEN
            v_messages := array_append(v_messages, 'Thiếu mã bệnh nhân (patientNo) cho chế độ ' || v_mode);
            v_is_valid := FALSE;
        ELSE
            SELECT jsonb_build_object(
                'patientNo', hp_patientno,
                'name', trim(COALESCE(hp_surname,'') || ' ' || COALESCE(hp_midname,'') || ' ' || hp_firstname),
                'dob', hp_birthdate,
                'sex', hp_sex,
                'address', hp_dtladdr
            ) INTO v_exist_patient_info
            FROM hms_patient WHERE hp_patientno = v_patientno;

            IF v_exist_patient_info IS NULL THEN
                v_messages := array_append(v_messages, 'Không tìm thấy bệnh nhân có mã ' || v_patientno);
                v_is_valid := FALSE;
            END IF;
        END IF;
    END IF;

    -- 4. KIỂM TRA TRÙNG PHIẾU KHÁM TRONG NGÀY (Cấm đăng ký 2 phiếu cùng phòng 1 ngày cho 1 hồ sơ)
    IF v_is_valid AND v_mode IN ('ADD_EXAM') THEN
        DECLARE
            v_tmp_doc_no INT := (v_doc->>'docNo')::INT;
        BEGIN
            IF v_tmp_doc_no IS NOT NULL THEN
                SELECT COUNT(*) INTO v_count 
                FROM hms_exam 
                WHERE he_docno = v_tmp_doc_no 
                  AND he_roomid = v_room_id 
                  AND DATE(he_examdate) = CURRENT_DATE
                  AND he_status <> 'C';
                
                IF v_count > 0 THEN
                    v_messages := array_append(v_messages, 'Bệnh nhân đã có phiếu khám tại phòng này trong ngày hôm nay (Hồ sơ: ' || v_tmp_doc_no || ').');
                    v_is_valid := FALSE;
                END IF;
            END IF;
        END;
    END IF;

    -- 5. KIỂM TRA HỒ SƠ CHƯA KẾT THÚC (Warning cho ADD_DOC)
    IF v_is_valid AND v_mode = 'ADD_DOC' AND v_patientno IS NOT NULL THEN
        SELECT jsonb_build_object(
            'docNo', hd_docno,
            'admitDate', hd_admitdate,
            'status', hd_status,
            'deptId', hd_admitdept
        ) INTO v_open_doc_info
        FROM hms_doc
        WHERE hd_patientno = v_patientno
          AND hd_status IN ('O', 'E')
        ORDER BY hd_admitdate DESC
        LIMIT 1;

        IF v_open_doc_info IS NOT NULL THEN
            v_messages := array_append(v_messages, 'CẢNH BÁO: Bệnh nhân đang có một hồ sơ chưa kết thúc (# ' || (v_open_doc_info->>'docNo') || '). Bạn có chắc muốn tạo hồ sơ mới?');
        END IF;
    END IF;

    -- 6. KIỂM TRA THẺ BHYT (Nếu có)
    IF v_card_no <> '' THEN
        SELECT COUNT(*) INTO v_count
        FROM hms_doc d
        WHERE d.hd_cardno = v_card_no
          AND d.hd_status IN ('O', 'E')
          AND d.hd_patientno <> COALESCE(v_patientno, 0);
        
        IF v_count > 0 THEN
            v_messages := array_append(v_messages, 'Thẻ BHYT ' || v_card_no || ' đang được sử dụng ở một hồ sơ khác chưa kết thúc.');
            v_is_valid := FALSE;
        END IF;
    END IF;

    -- 7. KIỂM TRA TRÙNG LẶP BỆNH NHÂN (Cho ADD_PATIENT)
    IF v_is_valid AND v_mode = 'ADD_PATIENT' AND (v_patient->>'sin') IS NOT NULL AND (v_patient->>'sin') <> '' THEN
        SELECT hp_patientno INTO v_patientno
        FROM hms_patient 
        WHERE hp_sin = v_patient->>'sin'
        LIMIT 1;

        IF v_patientno IS NOT NULL THEN
            v_messages := array_append(v_messages, 'Phát hiện bệnh nhân cũ theo số CCCD ' || (v_patient->>'sin') || '. Hệ thống sẽ tự động gộp vào Mã BN: ' || v_patientno);
            -- v_is_valid remains TRUE, allow Smart SP to handle it.
        END IF;
    END IF;

    -- TỔNG HỢP KẾT QUẢ
    v_result := jsonb_build_object(
        'isValid', v_is_valid,
        'message', array_to_string(v_messages, ' '),
        'severity', CASE WHEN v_is_valid AND array_length(v_messages, 1) > 0 THEN 'WARNING' 
                         WHEN v_is_valid THEN 'SUCCESS'
                         ELSE 'ERROR' END,
        'data', jsonb_build_object(
            'patientInfo', v_exist_patient_info,
            'openDocInfo', v_open_doc_info
        )
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
