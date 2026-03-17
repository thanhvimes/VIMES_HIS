
import { query } from './src/config/database';

async function fix() {
    try {
        console.log("Re-deploying hms_register_patient_v2 with individual error blocks...");
        
        await query(`
CREATE OR REPLACE FUNCTION hms_register_patient_v2(p_payload JSONB) 
RETURNS JSONB AS $$
DECLARE
    v_patientno BIGINT; v_docno BIGINT; v_cardidx BIGINT := 0;
    v_receptno INT; v_receptidx INT;
    v_mode TEXT := p_payload->>'mode';
    v_user TEXT := p_payload->>'currentUser';
    v_patient JSONB := p_payload->'patient';
    v_doc JSONB := p_payload->'doc';
    v_card JSONB := p_payload->'card';
    v_exam JSONB := p_payload->'exam';
    v_result JSONB;
BEGIN
    --------------------------------------------------
    -- 1. PATIENT
    --------------------------------------------------
    BEGIN
        IF v_mode = 'ADD_PATIENT' THEN
            IF (v_patient->>'sin') IS NOT NULL AND (v_patient->>'sin') <> '' THEN
                SELECT hp_patientno INTO v_patientno FROM hms_patient WHERE hp_sin = v_patient->>'sin' LIMIT 1;
            END IF;

            IF v_patientno IS NULL THEN
                SELECT nextval('hms_patient_hp_patientno_seq') INTO v_patientno;
                
                INSERT INTO hms_patient (
                    hp_createdby, hp_createddate, hp_patientno, hp_patientid, 
                    hp_surname, hp_midname, hp_firstname, hp_birthdate, hp_sex, 
                    hp_ethnic, hp_sin, hp_provid, hp_distid, hp_villid, hp_dtladdr, 
                    hp_occupation, hp_workplace, hp_workplaceid, hp_status, hp_nationality
                ) VALUES (
                    v_user, NOW(), v_patientno, v_patientno::TEXT,
                    COALESCE(v_patient->>'surname', ''), COALESCE(v_patient->>'midName', ''), COALESCE(v_patient->>'firstName', ''), 
                    NULLIF(v_patient->>'birthDate', '')::DATE, COALESCE(v_patient->>'sex', 'M'),
                    NULLIF(v_patient->>'ethnic', '')::INT, v_patient->>'sin', 
                    NULLIF(v_patient->>'provId', '')::INT, NULLIF(v_patient->>'distId', '')::INT, 
                    NULLIF(v_patient->>'villId', '')::INT, v_patient->>'dtlAddr',
                    NULLIF(v_patient->>'occupation', '')::INT, v_patient->>'workplace', 
                    v_patient->>'workplaceId', 'A', COALESCE(v_patient->>'nationality', 'VN')
                );
            END IF;
        ELSIF v_mode = 'EDIT_PATIENT' THEN
            v_patientno := (v_patient->>'patientNo')::BIGINT;
            UPDATE hms_patient SET 
                hp_surname = v_patient->>'surname', 
                hp_firstname = v_patient->>'firstName', 
                hp_birthdate = NULLIF(v_patient->>'birthDate', '')::DATE, 
                hp_sex = v_patient->>'sex',
                hp_sin = v_patient->>'sin', 
                hp_dtladdr = v_patient->>'dtlAddr', 
                hp_provid = NULLIF(v_patient->>'provId', '')::INT, 
                hp_distid = NULLIF(v_patient->>'distId', '')::INT, 
                hp_villid = NULLIF(v_patient->>'villId', '')::INT,
                hp_occupation = NULLIF(v_patient->>'occupation', '')::INT, 
                hp_ethnic = NULLIF(v_patient->>'ethnic', '')::INT
            WHERE hp_patientno = v_patientno;
        ELSE
            v_patientno := (v_patient->>'patientNo')::BIGINT;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'HMS DB Error (Step 1 Patient): %', SQLERRM;
    END;

    --------------------------------------------------
    -- 2. DOC
    --------------------------------------------------
    BEGIN
        IF v_mode = 'ADD_PATIENT' OR v_mode = 'ADD_DOC' THEN
            SELECT nextval('hms_doc_hd_docno_seq') INTO v_docno;
            
            INSERT INTO hms_doc (
                hd_createdby, hd_createddate, hd_docno, hd_patientno, hd_status, 
                hd_telephone, hd_relative, hd_relation, hd_contactaddr, hd_contacttel, 
                hd_object, hd_cardno, hd_cardidx, hd_insregdate, hd_disrate, hd_insexpdate,
                hd_insline, hd_admitdate, hd_admitdept, 
                hd_reexam, hd_emergency
            ) VALUES (
                v_user, NOW(), v_docno, v_patientno, 'O',
                v_doc->>'telephone', v_doc->>'relative', NULLIF(v_doc->>'relation', '')::INT, v_doc->>'contactAddr', v_doc->>'contactTel',
                CASE 
                    WHEN v_doc->>'objectId' = 'I' THEN 1
                    WHEN v_doc->>'objectId' = 'S' THEN 7
                    WHEN (v_doc->>'objectId') ~ '^[0-9]+$' THEN (v_doc->>'objectId')::INT
                    ELSE 7
                END,
                COALESCE(v_card->>'cardNo', ''), 0, 
                NULLIF(v_doc->>'insRegDate', '')::DATE, NULLIF(v_doc->>'disRate', '')::INT, 
                NULLIF(v_doc->>'insExpDate', '')::DATE,
                COALESCE(v_doc->>'insLine', 'N'), NOW(), v_doc->>'admitDept',
                COALESCE(v_doc->>'reExam', 'N'), COALESCE(v_doc->>'emergency', 'N')
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'HMS DB Error (Step 2 Doc): %', SQLERRM;
    END;

    --------------------------------------------------
    -- 3. CARD
    --------------------------------------------------
    BEGIN
        IF v_patientno IS NOT NULL AND (v_card->>'cardNo') IS NOT NULL AND (v_card->>'cardNo') <> '' THEN
            SELECT hc_idx INTO v_cardidx FROM hms_card WHERE hc_patientno = v_patientno AND hc_cardno = v_card->>'cardNo' LIMIT 1;

            IF v_cardidx IS NULL THEN
                SELECT nextval('hms_card_hc_idx_seq') INTO v_cardidx;
                INSERT INTO hms_card (
                    hc_createdby, hc_createddate, hc_patientno, hc_cardno, hc_idx, 
                    hc_regdate, hc_expdate, hc_regcode, hc_active
                ) VALUES (
                    v_user, NOW(), v_patientno, v_card->>'cardNo', v_cardidx,
                    NULLIF(v_card->>'regDate', '')::DATE, NULLIF(v_card->>'expDate', '')::DATE, 
                    v_card->>'regCode', 'Y'
                );
            END IF;
            
            IF v_docno IS NOT NULL THEN
                UPDATE hms_doc SET hd_cardidx = v_cardidx, hd_cardno = v_card->>'cardNo' WHERE hd_docno = v_docno;
            END IF;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'HMS DB Error (Step 3 Card): %', SQLERRM;
    END;

    --------------------------------------------------
    -- 4. EXAM
    --------------------------------------------------
    BEGIN
        IF v_mode = 'ADD_PATIENT' OR v_mode = 'ADD_DOC' THEN
            PERFORM pg_advisory_xact_lock(COALESCE(NULLIF(v_exam->>'roomId', ''), '0')::INT);

            SELECT COALESCE(MAX(he_receptno), 0) + 1 INTO v_receptno
            FROM hms_exam 
            WHERE TRIM(he_deptid) = TRIM(v_exam->>'deptId') 
              AND he_roomid = NULLIF(v_exam->>'roomId', '')::INT 
              AND DATE(he_examdate) = CURRENT_DATE;

            SELECT NEXTVAL('hms_exam_he_receptidx_asq') INTO v_receptidx;

            INSERT INTO hms_exam (
                he_createdby, he_createddate, he_patientno, he_docno, he_deptid, 
                he_roomid, he_receptno, he_receptidx, he_examtype, he_status, 
                he_examdate, he_prediagnostic, he_hasfee, he_payment
            ) VALUES (
                v_user, NOW(), v_patientno, v_docno, v_exam->>'deptId', 
                NULLIF(v_exam->>'roomId', '')::INT, v_receptno, v_receptidx, v_exam->>'examType', 'O', 
                NOW(), COALESCE(v_exam->>'preDiagnostic', ''), 
                CASE WHEN (v_doc->>'objectId') = 'S' OR (v_exam->>'hasFee') = 'Y' THEN 'Y' ELSE 'N' END, 'N'
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'HMS DB Error (Step 4 Exam): %', SQLERRM;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'patientNo', v_patientno,
        'docNo', v_docno,
        'receptNo', v_receptno,
        'receptIdx', v_receptidx
    );
END;
$$ LANGUAGE plpgsql;
        `);
        console.log("Success");
        process.exit(0);
    } catch (e: any) {
        console.error("Fail:", e.message);
        process.exit(1);
    }
}
fix();
