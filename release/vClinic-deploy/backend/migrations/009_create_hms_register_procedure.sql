-- ============================================================
-- Migration: 009 - Stored Procedure Đăng ký Tiếp Đón
-- Date: 2026-03-10
-- Mô tả: Gộp toàn bộ nghiệp vụ đăng ký bệnh nhân vào 1 hàm PL/pgSQL
--        nhận 1 JSONB payload và ghi vào 4 bảng trong 1 transaction:
--        hms_patient, hms_doc, hms_card, hms_exam
-- ============================================================

CREATE OR REPLACE FUNCTION hms_register_patient_v2(p_payload JSONB)
RETURNS JSONB AS $$
DECLARE
    -- Các biến chứa ID tự sinh
    v_patientno INT;
    v_docno     INT;
    v_cardidx   INT := 0;
    v_receptno  INT;
    v_receptidx INT;

    -- Bóc tách các node chính từ JSON
    v_mode   TEXT   := p_payload->>'mode';
    v_user   TEXT   := p_payload->>'currentUser';

    v_patient JSONB := p_payload->'patient';
    v_doc     JSONB := p_payload->'doc';
    v_card    JSONB := p_payload->'card';
    v_exam    JSONB := p_payload->'exam';

    v_result JSONB;
BEGIN
    -- Validate mode bắt buộc phải có
    IF v_mode IS NULL OR v_mode NOT IN ('ADD_PATIENT', 'ADD_DOC', 'ADD_EXAM') THEN
        RAISE EXCEPTION 'Giá trị mode không hợp lệ: %. Chỉ chấp nhận ADD_PATIENT, ADD_DOC, ADD_EXAM.', v_mode;
    END IF;

    IF v_user IS NULL OR v_user = '' THEN
        RAISE EXCEPTION 'Thiếu currentUser trong payload. Không xác định được người thao tác.';
    END IF;

    -- Thiết lập ngữ cảnh cho Audit Log
    PERFORM set_config('app.current_user_id', v_user, true);
    PERFORM set_config('app.context_module', 'RECEPTION_REG', true);

    -- ============================================================
    -- BƯỚC 0: CÁC KIỂM TRA NGHIỆP VỤ (VIMES LOGIC)
    -- ============================================================
    v_result := hms_check_registration_v2(p_payload);
    
    -- Nếu không hợp lệ (ERROR), báo lỗi ngay
    IF NOT (v_result->>'isValid')::BOOLEAN THEN
        RAISE EXCEPTION 'HMS Registration Error [%]: %', (v_result->>'severity'), (v_result->>'message');
    END IF;

    -- ============================================================
    -- BƯỚC 1: XỬ LÝ BỆNH NHÂN (hms_patient)
    -- ============================================================
    -- [SMART LOOKUP]: Nếu là ADD_PATIENT nhưng SIN (CCCD) đã tồn tại, 
    --                 thì chuyển sang cập nhật và dùng patientNo có sẵn.
    IF v_mode = 'ADD_PATIENT' AND (v_patient->>'sin') IS NOT NULL AND (v_patient->>'sin') <> '' THEN
        SELECT hp_patientno INTO v_patientno
        FROM hms_patient 
        WHERE hp_sin = v_patient->>'sin'
        LIMIT 1;

        IF v_patientno IS NOT NULL THEN
            -- Cập nhật thông tin hành chính bệnh nhân hiện có (Tránh phân mảnh dữ liệu)
            UPDATE hms_patient SET
                hp_surname = v_patient->>'surname', 
                hp_midname = v_patient->>'midName', 
                hp_firstname = v_patient->>'firstName',
                hp_birthdate = NULLIF(v_patient->>'birthDate', '')::DATE, 
                hp_sex = v_patient->>'sex',
                hp_ethnic = COALESCE(NULLIF(v_patient->>'ethnic', '')::INT, 0),
                hp_provid = COALESCE(NULLIF(v_patient->>'provId', '')::INT, 0),
                hp_distid = COALESCE(NULLIF(v_patient->>'distId', '')::INT, 0),
                hp_villid = COALESCE(NULLIF(v_patient->>'villId', '')::INT, 0),
                hp_dtladdr = v_patient->>'dtlAddr',
                hp_occupation = COALESCE(NULLIF(v_patient->>'occupation', '')::INT, 0),
                hp_updatedby = v_user, hp_updateddate = NOW()
            WHERE hp_patientno = v_patientno;

            v_mode := 'ADD_DOC'; -- Chuyển sang flow tiếp đón hồ sơ cho BN cũ
        END IF;
    END IF;

    IF v_mode = 'ADD_PATIENT' THEN
        -- Bệnh nhân thực sự mới: sinh mã và insert
        SELECT nextval('hms_patient_hp_patientno_seq')::INT INTO v_patientno;

        INSERT INTO hms_patient (
            hp_createdby, hp_createddate,
            hp_patientno, hp_patientid,
            hp_surname, hp_midname, hp_firstname,
            hp_birthdate, hp_sex,
            hp_ethnic,
            hp_sin,
            hp_provid, hp_distid, hp_villid,
            hp_dtladdr,
            hp_occupation,
            hp_workplace, hp_workplaceid,
            hp_status, hp_rank, hp_position,
            hp_cmnddate,
            hp_yearofbirth,
            hp_nationality
        ) VALUES (
            v_user, NOW(),
            v_patientno, v_patient->>'patientId',
            v_patient->>'surname', v_patient->>'midName', v_patient->>'firstName',
            NULLIF(v_patient->>'birthDate', '')::DATE, v_patient->>'sex',
            COALESCE(NULLIF(v_patient->>'ethnic', '')::INT, 0),
            v_patient->>'sin',
            COALESCE(NULLIF(v_patient->>'provId', '')::INT, 0),
            COALESCE(NULLIF(v_patient->>'distId', '')::INT, 0),
            COALESCE(NULLIF(v_patient->>'villId', '')::INT, 0),
            v_patient->>'dtlAddr',
            COALESCE(NULLIF(v_patient->>'occupation', '')::INT, 0),
            v_patient->>'workplace', v_patient->>'workplaceId',
            COALESCE(v_patient->>'status', 'A'),
            COALESCE(NULLIF(v_patient->>'rank', '')::INT, 0),
            COALESCE(NULLIF(v_patient->>'position', '')::INT, 0),
            NULLIF(v_patient->>'cmndDate', '')::DATE,
            v_patient->>'yearOfBirth',
            COALESCE(v_patient->>'nationality', 'VN')
        );

    ELSIF v_mode IN ('ADD_DOC', 'ADD_EXAM') THEN
        -- Bệnh nhân đã tồn tại: lấy ID từ payload
        v_patientno := COALESCE(v_patientno, NULLIF(v_patient->>'patientNo', '')::INT);
        IF v_patientno IS NULL THEN
            RAISE EXCEPTION 'Thiếu patientNo trong payload với mode = %', v_mode;
        END IF;
    END IF;

    -- ============================================================
    -- BƯỚC 2: XỬ LÝ HỒ SƠ KHÁM (hms_doc)
    -- ============================================================
    -- [VIMES LOGIC]: Nếu trong ngày đã có hồ sơ chưa kết thúc (status <> 'T'), 
    --                thì dùng lại docNo đó, không insert thêm hms_doc mới.
    IF v_mode = 'ADD_DOC' AND v_patientno IS NOT NULL THEN
        SELECT hd_docno INTO v_docno
        FROM hms_doc
        WHERE hd_patientno = v_patientno
          AND DATE(hd_admitdate) = CURRENT_DATE
          AND hd_status <> 'T'
        ORDER BY hd_admitdate DESC
        LIMIT 1;

        IF v_docno IS NOT NULL THEN
            v_mode := 'ADD_EXAM'; -- Chuyển sang chế độ chỉ thêm phiếu khám vào hồ sơ hiện tại
        END IF;
    END IF;

    IF v_mode IN ('ADD_PATIENT', 'ADD_DOC') THEN
        SELECT nextval('hms_doc_hd_docno_seq')::INT INTO v_docno;

        INSERT INTO hms_doc (
            hd_createdby, hd_createddate,
            hd_docno, hd_patientno, hd_status,
            -- Liên hệ
            hd_telephone, hd_relative, hd_relation, hd_contactaddr, hd_contacttel,
            -- Đối tượng & BHYT
            hd_object, hd_cardno, hd_cardidx, hd_insregdate, hd_insexpdate, hd_over5yeardate, hd_disrate,
            hd_insline, hd_admitstate, hd_admitdate, hd_admitdept,
            -- Chuyển tuyến
            hd_transplace, hd_transdiagn, hd_transplaceid,
            -- Đối tượng ngoại tuyến (thẻ cũ)
            hd_xobject, hd_xcardno, hd_xissueplace, hd_xissuedate,
            -- Cờ nghiệp vụ
            hd_reexam, hd_emergency, hd_ma_doituong_kcb
        ) VALUES (
            v_user, NOW(),
            v_docno, v_patientno, 'O',
            v_doc->>'telephone',
            v_doc->>'relative',
            COALESCE(NULLIF(v_doc->>'relation', '')::INT, 0),
            v_doc->>'contactAddr',
            v_doc->>'contactTel',
            CASE 
                WHEN (v_doc->>'objectId') = 'I' THEN 4
                WHEN (v_doc->>'objectId') = 'S' THEN 7
                ELSE COALESCE(NULLIF(v_doc->>'objectId', ''), '7')::INT
            END,
            COALESCE(v_card->>'cardNo', ''),
            0,
            NULLIF(v_doc->>'insRegDate', '')::DATE,
            NULLIF(v_doc->>'insExpDate', '')::DATE,
            NULLIF(v_doc->>'over5YearDate', '')::DATE,
            COALESCE(NULLIF(v_doc->>'disRate', '')::NUMERIC, 0),
            COALESCE(v_doc->>'insLine', 'N'),
            COALESCE(v_doc->>'admitState', ''),
            NOW(),
            v_doc->>'admitDept',
            COALESCE(v_doc->>'transPlace', ''),
            COALESCE(v_doc->>'transDiagn', ''),
            COALESCE(v_doc->>'transPlaceId', ''),
            CASE 
                WHEN (v_doc->>'xObject') = 'I' THEN 4
                WHEN (v_doc->>'xObject') = 'S' THEN 7
                ELSE COALESCE(NULLIF(v_doc->>'xObject', ''), '0')::INT
            END,
            COALESCE(v_doc->>'xCardNo', ''),
            COALESCE(v_doc->>'xIssuePlace', ''),
            NULLIF(v_doc->>'xIssueDate', '')::DATE,
            COALESCE(v_doc->>'reExam', 'N'),
            COALESCE(v_doc->>'emergency', 'N'),
            COALESCE(v_doc->>'maDoiTuongKcb', '')
        );

    ELSIF v_mode = 'ADD_EXAM' THEN
        -- Thêm phiếu khám vào đợt điều trị đang còn mở
        v_docno := COALESCE(v_docno, NULLIF(v_doc->>'docNo', '')::INT);
        IF v_docno IS NULL THEN
            RAISE EXCEPTION 'Thiếu docNo trong payload với mode = ADD_EXAM';
        END IF;
    END IF;

    -- ============================================================
    -- BƯỚC 3: XỬ LÝ THẺ BHYT (hms_card)
    -- Chỉ insert khi có số thẻ BHYT và đang tạo hồ sơ mới
    -- ============================================================
    IF v_mode IN ('ADD_PATIENT', 'ADD_DOC')
       AND (v_card->>'cardNo') IS NOT NULL
       AND (v_card->>'cardNo') <> ''
    THEN
        SELECT nextval('hms_card_hc_idx_seq')::INT INTO v_cardidx;

        INSERT INTO hms_card (
            hc_createdby, hc_createddate,
            hc_patientno, hc_cardno, hc_idx,
            hc_regdate, hc_expdate,
            hc_regcode, hc_company, hc_code,
            hc_discount, hc_active,
            hc_groupid, hc_area
        ) VALUES (
            v_user, NOW(),
            v_patientno, v_card->>'cardNo', v_cardidx,
            NULLIF(v_card->>'regDate', '')::DATE,
            NULLIF(v_card->>'expDate', '')::DATE,
            v_card->>'regCode',
            v_card->>'company',
            v_card->>'code',
            COALESCE(NULLIF(v_card->>'discount', '')::INT, 0),
            'Y',
            COALESCE(NULLIF(v_card->>'groupId', '')::INT, 0),
            COALESCE(v_card->>'area', '')
        );

        -- Cập nhật ngược chỉ số thẻ vào hồ sơ
        UPDATE hms_doc
        SET hd_cardidx = v_cardidx,
            hd_cardno  = v_card->>'cardNo',
            hd_insregdate = NULLIF(v_card->>'regDate', '')::DATE,
            hd_insexpdate = NULLIF(v_card->>'expDate', '')::DATE
        WHERE hd_docno = v_docno;
    END IF;

    -- ============================================================
    -- BƯỚC 4: XỬ LÝ PHIẾU KHÁM + SINH SỐ THỨ TỰ (hms_exam)
    -- [QUAN TRỌNG] Dùng advisory lock để chống trùng số thứ tự
    --             trong môi trường đa luồng (nhiều tab/user cùng lúc)
    -- ============================================================
    IF (v_exam->>'roomId') IS NULL OR (v_exam->>'roomId') = '' THEN
        RAISE EXCEPTION 'Thiếu roomId trong exam payload. Không thể sinh số thứ tự.';
    END IF;

    -- 4.0 Kiểm tra trùng phiếu khám trong phòng trùng ngày (VIMES logic)
    IF EXISTS (
        SELECT 1 FROM hms_exam 
        WHERE he_docno = v_docno 
        AND he_roomid = (v_exam->>'roomId')::INT 
        AND DATE(he_examdate) = CURRENT_DATE
        AND he_status <> 'C' -- Không tính phiếu đã hủy
    ) THEN
        RAISE EXCEPTION 'Phiếu khám đã tồn tại trong phòng [%] cho hồ sơ này trong ngày hôm nay.', (v_exam->>'roomId');
    END IF;

    -- Khóa tạm thời độc quyền theo phòng khám để tránh đụng số
    PERFORM pg_advisory_xact_lock(hashtext('room_' || (v_exam->>'roomId')));

    -- Lấy số thứ tự bốc số cho phòng khám TRONG NGÀY
    SELECT COALESCE(MAX(he_receptno), 0) + 1 INTO v_receptno
    FROM hms_exam
    WHERE he_roomid   = (v_exam->>'roomId')::INT
      AND DATE(he_examdate) = CURRENT_DATE;

    -- Lấy receptidx bằng sequence (Vì là PK toàn cục trong DB này)
    SELECT nextval('hms_exam_he_receptidx_asq')::INT INTO v_receptidx;

    -- Insert phiếu khám
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
            WHEN (v_doc->>'objectId') IN ('S', '7') OR (v_exam->>'hasFee') = 'Y' THEN 'Y'
            ELSE 'N'
        END,
        'N'
    );

    -- ============================================================
    -- BƯỚC 5: HẬU XỬ LÝ (Tùy chọn - Comment/Uncomment theo nhu cầu)
    -- ============================================================

    -- 5.1 Thêm cận lâm sàng đính kèm tự động (nếu có)
    -- IF (v_exam->>'refItemId') IS NOT NULL AND (v_exam->>'refItemId') <> '' THEN
    --    PERFORM pcms_order_additem(
    --        v_user, v_exam->>'deptId', v_patientno, v_docno,
    --        (v_exam->>'roomId')::INT, (v_exam->>'examDate')::TEXT,
    --        v_user, 'D0000', v_exam->>'refItemId'
    --    );
    -- END IF;

    -- 5.2 Thu phí tự động nếu là Dịch Vụ và bật Auto Payment
    -- IF (v_doc->>'objectId') IN ('S', '7') AND (v_exam->>'isAutoPayment')::BOOLEAN = TRUE THEN
    --    PERFORM hms_fee_create(v_user, v_docno);
    --    PERFORM hms_fee_createinvoice_exam(
    --        v_docno, 'AUTO', '000101', 0, CURRENT_DATE::TEXT, v_user, 'Tự động thu phí'
    --    );
    -- END IF;

    -- ============================================================
    -- TRẢ KẾT QUẢ VỀ CHO NODE.JS
    -- ============================================================
    v_result := jsonb_build_object(
        'success',    true,
        'patientNo',  v_patientno,
        'docNo',      v_docno,
        'receptNo',   v_receptno,
        'receptIdx',  v_receptidx,
        'cardIdx',    v_cardidx
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- Toàn bộ transaction tự động rollback khi có lỗi bất kỳ
    RAISE EXCEPTION 'HMS Registration Error [%]: %', SQLSTATE, SQLERRM;
END;
$$ LANGUAGE plpgsql;
