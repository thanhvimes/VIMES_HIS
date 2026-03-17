const pool = require('./src/config/database');

async function migrate() {
    try {
        await pool.query(`
CREATE OR REPLACE FUNCTION hms_register_patient_v2(p_payload JSONB) 
RETURNS JSONB AS $$
DECLARE
    -- Các biến chứa ID tự sinh
    v_patientno BIGINT;
    v_docno BIGINT;
    v_cardidx BIGINT := 0;
    v_receptno INT;
    v_receptidx INT;
    
    -- Các biến bóc tách từ JSON tham số
    v_mode TEXT := p_payload->>'mode';
    v_user TEXT := p_payload->>'currentUser';
    
    v_patient JSONB := p_payload->'patient';
    v_doc JSONB := p_payload->'doc';
    v_card JSONB := p_payload->'card';
    v_exam JSONB := p_payload->'exam';
    
    -- Result
    v_result JSONB;
BEGIN
    RAISE NOTICE 'HMS: Starting registration mode: %', v_mode;
    --------------------------------------------------
    -- 1. XỬ LÝ LIÊN QUAN ĐẾN BỆNH NHÂN (hms_patient)
    --------------------------------------------------
    IF v_mode = 'ADD_PATIENT' THEN
        RAISE NOTICE 'HMS: Adding patient...';
        -- Check duplicate SIN
        IF (v_patient->>'sin') IS NOT NULL AND (v_patient->>'sin') <> '' THEN
            SELECT hp_patientno INTO v_patientno FROM hms_patient WHERE hp_sin = v_patient->>'sin' LIMIT 1;
        END IF;

        IF v_patientno IS NULL THEN
            -- Sinh ID bệnh nhân mới
            SELECT nextval('hms_patient_hp_patientno_seq') INTO v_patientno;
            RAISE NOTICE 'HMS: Generated patientNo: %', v_patientno;
            
            INSERT INTO hms_patient (
                hp_createdby, hp_createddate, hp_patientno, hp_patientid, 
                hp_surname, hp_midname, hp_firstname, hp_birthdate, hp_sex, 
                hp_ethnic, hp_sin, hp_provid, hp_distid, hp_villid, hp_dtladdr, 
                hp_occupation, hp_workplace, hp_workplaceid, hp_status, hp_rank, 
                hp_position, hp_yearofbirth, hp_nationality
            ) VALUES (
                v_user, NOW(), v_patientno, (v_patientno)::TEXT,
                v_patient->>'surname', v_patient->>'midName', v_patient->>'firstName', 
                NULLIF(v_patient->>'birthDate', '')::DATE, v_patient->>'sex',
                NULLIF(v_patient->>'ethnic', '')::INT, v_patient->>'sin', 
                NULLIF(v_patient->>'provId', '')::INT, NULLIF(v_patient->>'distId', '')::BIGINT, 
                NULLIF(v_patient->>'villId', '')::BIGINT, v_patient->>'dtlAddr',
                NULLIF(v_patient->>'occupation', '')::INT, v_patient->>'workplace', 
                v_patient->>'workplaceId', COALESCE(v_patient->>'status', 'A'), 
                NULLIF(v_patient->>'rank', '')::INT,
                NULLIF(v_patient->>'position', '')::INT, v_patient->>'yearOfBirth', 
                COALESCE(v_patient->>'nationality', 'VN')
            );
        END IF;
    ELSIF v_mode = 'EDIT_PATIENT' THEN
        RAISE NOTICE 'HMS: Editing patient...';
        v_patientno := NULLIF(v_patient->>'patientNo', '')::BIGINT;
        IF v_patientno IS NOT NULL THEN
            UPDATE hms_patient SET 
                hp_surname = v_patient->>'surname', 
                hp_firstname = v_patient->>'firstName', 
                hp_birthdate = NULLIF(v_patient->>'birthDate', '')::DATE, 
                hp_sex = v_patient->>'sex',
                hp_sin = v_patient->>'sin', 
                hp_dtladdr = v_patient->>'dtlAddr', 
                hp_provid = NULLIF(v_patient->>'provId', '')::INT, 
                hp_distid = NULLIF(v_patient->>'distId', '')::BIGINT, 
                hp_villid = NULLIF(v_patient->>'villId', '')::BIGINT,
                hp_occupation = NULLIF(v_patient->>'occupation', '')::INT, 
                hp_ethnic = NULLIF(v_patient->>'ethnic', '')::INT, 
                hp_workplace = v_patient->>'workplace'
            WHERE hp_patientno = v_patientno;
        END IF;
    ELSE
        -- ADD_DOC
        RAISE NOTICE 'HMS: Adding document only...';
        v_patientno := NULLIF(v_patient->>'patientNo', '')::BIGINT;
    END IF;

    --------------------------------------------------
    -- 2. XỬ LÝ LIÊN QUAN ĐẾN DOCUMENT (hms_doc)
    --------------------------------------------------
    IF v_mode = 'ADD_PATIENT' OR v_mode = 'ADD_DOC' THEN
        SELECT nextval('hms_doc_hd_docno_seq') INTO v_docno;
        RAISE NOTICE 'HMS: Generated docNo: %', v_docno;
        
        INSERT INTO hms_doc (
            hd_createdby, hd_createddate, hd_docno, hd_patientno, hd_status, 
            hd_telephone, hd_relative, hd_relation, hd_contactaddr, hd_contacttel, 
            hd_object, hd_cardno, hd_cardidx, hd_insregdate, hd_disrate, hd_insexpdate, hd_over5yeardate,
            hd_insline, hd_admitstate, hd_admitdate, hd_admitdept, 
            hd_transplace, hd_transdiagn, hd_transplaceid, 
            hd_reexam, hd_emergency
        ) VALUES (
            v_user, NOW(), v_docno, v_patientno, 'O',
            v_doc->>'telephone', v_doc->>'relative', NULLIF(v_doc->>'relation', '')::INT, v_doc->>'contactAddr', v_doc->>'contactTel',
            CASE 
                WHEN v_doc->>'objectId' = 'I' THEN 1
                WHEN v_doc->>'objectId' = 'S' THEN 7
                ELSE COALESCE(NULLIF(v_doc->>'objectId', ''), '7')::INT
            END,
            COALESCE(v_card->>'cardNo', ''), COALESCE(NULLIF(v_doc->>'cardIdx', ''), '0')::BIGINT, 
            NULLIF(v_doc->>'insRegDate', '')::DATE, NULLIF(v_doc->>'disRate', '')::INT, 
            NULLIF(v_doc->>'insExpDate', '')::DATE, NULLIF(v_doc->>'over5YearDate', '')::DATE,
            COALESCE(v_doc->>'insLine', 'N'), COALESCE(v_doc->>'admitState', ''), NOW(), v_doc->>'admitDept',
            COALESCE(v_doc->>'transPlace', ''), COALESCE(v_doc->>'transDiagn', ''), COALESCE(v_doc->>'transPlaceId', ''),
            COALESCE(v_doc->>'reExam', 'N'), COALESCE(v_doc->>'emergency', 'N')
        );
    ELSIF v_mode = 'EDIT_PATIENT' THEN
        v_docno := NULLIF(v_doc->>'docNo', '')::BIGINT;
        IF v_docno IS NOT NULL THEN
            UPDATE hms_doc SET 
                hd_object = CASE 
                    WHEN v_doc->>'objectId' = 'I' THEN 1
                    WHEN v_doc->>'objectId' = 'S' THEN 7
                    ELSE COALESCE(NULLIF(v_doc->>'objectId', ''), '7')::INT
                END, 
                hd_cardno = COALESCE(v_card->>'cardNo', ''), 
                hd_telephone = v_doc->>'telephone', 
                hd_admitdept = v_doc->>'admitDept',
                hd_transplaceid = COALESCE(v_doc->>'transPlaceId', ''), 
                hd_transdiagn = COALESCE(v_doc->>'transDiagn', ''), 
                hd_reexam = COALESCE(v_doc->>'reExam', 'N'),
                hd_insregdate = NULLIF(v_doc->>'insRegDate', '')::DATE, 
                hd_insexpdate = NULLIF(v_doc->>'insExpDate', '')::DATE, 
                hd_over5yeardate = NULLIF(v_doc->>'over5YearDate', '')::DATE,
                hd_relative = v_doc->>'relative', 
                hd_contacttel = v_doc->>'contactTel'
            WHERE hd_docno = v_docno;
        END IF;
    END IF;

    --------------------------------------------------
    -- 3. XỬ LÝ LIÊN QUAN ĐẾN THẺ BHYT (hms_card)
    --------------------------------------------------
    IF v_patientno IS NOT NULL AND (v_card->>'cardNo') IS NOT NULL AND (v_card->>'cardNo') <> '' THEN
        RAISE NOTICE 'HMS: Handling card...';
        IF v_mode = 'EDIT_PATIENT' THEN
            SELECT hc_idx INTO v_cardidx FROM hms_card WHERE hc_patientno = v_patientno AND hc_cardno = v_card->>'cardNo' LIMIT 1;
        END IF;

        IF v_cardidx IS NULL OR v_cardidx = 0 THEN
            SELECT nextval('hms_card_hc_idx_seq') INTO v_cardidx;
            RAISE NOTICE 'HMS: Generated cardIdx: %', v_cardidx;
            
            INSERT INTO hms_card (
                hc_createdby, hc_createddate, hc_patientno, hc_cardno, hc_idx, 
                hc_regdate, hc_expdate, hc_over5year, hc_regcode, hc_active
            ) VALUES (
                v_user, NOW(), v_patientno, v_card->>'cardNo', v_cardidx,
                NULLIF(v_card->>'regDate', '')::DATE, 
                NULLIF(v_card->>'expDate', '')::DATE, 
                CASE WHEN NULLIF(v_card->>'over5YearDate', '') IS NOT NULL THEN 'Y' ELSE 'N' END, 
                v_card->>'regCode', 'Y'
            );
        ELSE
            UPDATE hms_card SET 
                hc_regdate = NULLIF(v_card->>'regDate', '')::DATE, 
                hc_expdate = NULLIF(v_card->>'expDate', '')::DATE, 
                hc_over5year = CASE WHEN NULLIF(v_card->>'over5YearDate', '') IS NOT NULL THEN 'Y' ELSE 'N' END, 
                hc_regcode = v_card->>'regCode'
            WHERE hc_patientno = v_patientno AND hc_cardno = (v_card->>'cardNo');
        END IF;
        
        -- Cập nhật thông tin index của thẻ BHYT ngược vào hồ sơ
        IF v_docno IS NOT NULL THEN
            UPDATE hms_doc SET hd_cardidx = v_cardidx, hd_cardno = v_card->>'cardNo' WHERE hd_docno = v_docno;
        END IF;
    END IF;

    --------------------------------------------------
    -- 4. XỬ LÝ PHIẾU KHÁM & MẬT MÃ BỐC SỐ KHÁM (hms_exam)
    --------------------------------------------------
    IF v_mode = 'ADD_PATIENT' OR v_mode = 'ADD_DOC' THEN
        RAISE NOTICE 'HMS: Handling exam ticket...';
        -- [!IMPORTANT] Khóa cấp số phòng khám bằng advisory_lock
        PERFORM pg_advisory_xact_lock(COALESCE(NULLIF(v_exam->>'roomId', ''), '0')::INT);

        -- Lấy số thứ tự bốc phiếu cho phòng khám ngày hôm nay
        SELECT COALESCE(MAX(he_receptno), 0) + 1 INTO v_receptno
        FROM hms_exam 
        WHERE TRIM(he_deptid) = TRIM(v_exam->>'deptId') 
          AND he_roomid = NULLIF(v_exam->>'roomId', '')::INT 
          AND DATE(he_examdate) = DATE(COALESCE(NULLIF(v_exam->>'examDate', ''), NOW()::TEXT)::TIMESTAMP);

        -- Lấy chỉ mục phòng khám (index) trong 1 đợt hồ sơ điều trị
        SELECT COALESCE(MAX(he_receptidx), 0) + 1 INTO v_receptidx 
        FROM hms_exam WHERE he_docno = v_docno;

        RAISE NOTICE 'HMS: Generated receptNo: %, receptIdx: %', v_receptno, v_receptidx;

        -- Thêm phiếu khám
        INSERT INTO hms_exam (
            he_createdby, he_createddate, he_patientno, he_docno, he_deptid, 
            he_roomid, he_receptno, he_receptidx, he_examtype, he_status, 
            he_examdate, he_doctor, he_examine, he_prediagnostic, he_diagnostic, 
            he_hasfee, he_payment
        ) VALUES (
            v_user, NOW(), v_patientno, v_docno, v_exam->>'deptId', 
            NULLIF(v_exam->>'roomId', '')::INT, v_receptno, v_receptidx, v_exam->>'examType', 'O', 
            COALESCE(NULLIF(v_exam->>'examDate', ''), NOW()::TEXT)::TIMESTAMP, COALESCE(v_exam->>'doctor', ''), COALESCE(v_exam->>'examine', ''), COALESCE(v_exam->>'preDiagnostic', ''), COALESCE(v_exam->>'diagnostic', ''), 
            CASE WHEN (v_doc->>'objectId') = 'S' OR (v_exam->>'hasFee') = 'Y' THEN 'Y' ELSE 'N' END, 'N'
        );
    ELSIF v_mode = 'EDIT_PATIENT' THEN
        -- Chuyển phòng nếu cần
        IF v_docno IS NOT NULL AND v_exam IS NOT NULL AND v_exam->>'roomId' IS NOT NULL AND v_exam->>'roomId' <> '' THEN
            UPDATE hms_exam SET 
                he_deptid = v_exam->>'deptId', 
                he_roomid = NULLIF(v_exam->>'roomId', '')::INT,
                he_receptno = CASE WHEN he_roomid != NULLIF(v_exam->>'roomId', '')::INT THEN 
                               (SELECT COALESCE(MAX(he_receptno), 0) + 1 
                                FROM hms_exam 
                                WHERE he_roomid = NULLIF(v_exam->>'roomId', '')::INT 
                                AND DATE(he_examdate) = CURRENT_DATE)
                              ELSE he_receptno END
            WHERE he_docno = v_docno AND he_status = 'O'; -- Chỉ phòng khám đang Open
        END IF;
    END IF;

    --------------------------------------------------
    -- TRẢ VỀ KẾT QUẢ CHO TẦNG NODE.JS
    --------------------------------------------------
    v_result := jsonb_build_object(
        'success', true,
        'patientNo', v_patientno,
        'docNo', v_docno,
        'receptNo', v_receptno,
        'receptIdx', v_receptidx
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Lỗi Database HMS Registration: % (at mode %)', SQLERRM, v_mode;
END;
$$ LANGUAGE plpgsql;
        `);

        await pool.query(`
CREATE OR REPLACE FUNCTION hms_delete_reception_v2(p_docno BIGINT, p_user TEXT) 
RETURNS VOID AS $$
BEGIN
    DELETE FROM hms_exam WHERE he_docno = p_docno;
    -- Xoá card nếu chỉ có 1 doc này map tới thẻ
    -- (simplified for now: leave card as it doesn't hurt)
    DELETE FROM hms_doc WHERE hd_docno = p_docno;
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Lỗi Database HMS Delete Reception: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
        `);

        console.log("Functions created successfully.");
        process.exit(0);
    } catch (e) {
        console.error("Error running script:", e);
        process.exit(1);
    }
}

migrate();
