import { pool } from '../config/database';

async function migrate() {
    try {
        await pool.query(`
CREATE OR REPLACE FUNCTION hms_save_consultation_v1(p_payload JSONB) 
RETURNS JSONB AS $$
DECLARE
    v_docno BIGINT := (p_payload->>'docNo')::BIGINT;
    v_patientno BIGINT := (p_payload->>'patientNo')::BIGINT;
    v_receptidx INT := (p_payload->>'receptIdx')::INT;
    v_user TEXT := p_payload->>'currentUser';
    
    v_vitals JSONB := p_payload->'vitals';
    v_diagnosis JSONB := p_payload->'diagnosis';
    v_main_disease JSONB := p_payload->'mainDisease';
    v_sub_diseases JSONB := p_payload->'subDiseases';
    v_status TEXT := COALESCE(p_payload->>'status', 'P');
    
    v_icd_list TEXT := '';
    v_sub_icd TEXT := '';
    v_item JSONB;
BEGIN
    RAISE NOTICE 'HMS: Saving consultation for DocNo: %, Status: %', v_docno, v_status;

    --------------------------------------------------
    -- 1. XỬ LÝ CHUỖI BỆNH KÈM THEO (CẬP NHẬT hd_reldisease)
    --------------------------------------------------
    IF v_sub_diseases IS NOT NULL AND jsonb_array_length(v_sub_diseases) > 0 THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(v_sub_diseases)
        LOOP
            v_sub_icd := v_sub_icd || (v_item->>'code') || ';';
        END LOOP;
    END IF;

    --------------------------------------------------
    -- 2. CẬP NHẬT BẢNG hms_exam (Chi tiết lượt khám)
    --------------------------------------------------
    UPDATE hms_exam SET
        he_pulse = (v_vitals->>'pulse')::INT,
        he_temperature = (v_vitals->>'temperature')::REAL,
        he_weight = (v_vitals->>'weight')::REAL,
        he_height = (v_vitals->>'height')::REAL,
        he_bmi = (v_vitals->>'bmi')::REAL,
        he_breathingrate = (v_vitals->>'breathingRate')::INT,
        he_bpsys = (v_vitals->>'bpSystolic')::INT,
        he_bpdia = (v_vitals->>'bpDiastolic')::INT,
        
        he_medical = v_diagnosis->>'pathologyProcess',
        he_examine = v_diagnosis->>'clinicalExam',
        he_prediagnostic = v_diagnosis->>'preliminaryDiagnosis',
        he_diagnostic = v_diagnosis->>'conclusion',
        
        he_icd10 = v_main_disease->>'code',
        he_status = v_status, 
        he_doctor = v_user,
        he_updatedby = v_user,
        he_updateddate = NOW(),
        he_enddate = CASE WHEN v_status = 'T' THEN NOW() ELSE he_enddate END
    WHERE he_docno = v_docno AND he_receptidx = v_receptidx;

    --------------------------------------------------
    -- 3. CẬP NHẬT BẢNG hms_doc (Hồ sơ tổng quát)
    --------------------------------------------------
    UPDATE hms_doc SET
        hd_doctor = v_user,
        hd_conclusion = v_diagnosis->>'conclusion',
        hd_reldisease = v_sub_icd,
        hd_yhct = v_main_disease->>'yhctCode',
        hd_updatedby = v_user,
        hd_updateddate = NOW()
    WHERE hd_docno = v_docno;

    RETURN jsonb_build_object(
        'success', true,
        'docNo', v_docno,
        'receptIdx', v_receptidx
    );

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Lỗi Database HMS Save Consultation: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;
        `);

        console.log("Function hms_save_consultation_v1 created successfully.");
        process.exit(0);
    } catch (e) {
        console.error("Error creating function:", e);
        process.exit(1);
    }
}

migrate();
