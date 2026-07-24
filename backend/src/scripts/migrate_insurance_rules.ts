
import { pool } from '../config/database';

async function migrate() {
    try {
        await pool.query(`
CREATE OR REPLACE FUNCTION hms_check_insurance_rules_v1(
    p_docno BIGINT, 
    p_receptidx INT, 
    p_doctor TEXT,
    p_exceed_limit INT DEFAULT 65,
    p_min_minutes INT DEFAULT 15
) 
RETURNS JSONB AS $$
DECLARE
    v_object INT;
    v_exam_count INT;
    v_specialty_count INT;
    v_minutes_diff INT;
    v_recept_date TIMESTAMP;
    v_res JSONB;
BEGIN
    -- 1. LẤY THÔNG TIN ĐỐI TƯỢNG VÀ THỜI GIAN TIẾP ĐÓN
    SELECT hd_object INTO v_object 
    FROM hms_doc WHERE hd_docno = p_docno;

    -- Nếu không phải Bảo hiểm (giả định 1 là BHXH trong hệ thống cũ, 4 trong VIMES HIS mới)
    -- Chúng ta check cả 1 và 4 cho chắc chắn tùy theo database hiện tại
    IF v_object NOT IN (1, 4) THEN
        RETURN jsonb_build_object('success', true, 'message', 'Đơn vị không yêu cầu kiểm tra BHYT');
    END IF;

    -- 2. KIỂM TRA ĐỊNH MỨC KHÁM CỦA BÁC SĨ (ExceedExamedPatient)
    SELECT COUNT(*) INTO v_exam_count
    FROM hms_exam 
    WHERE he_doctor = p_doctor 
      AND DATE(he_examdate) = CURRENT_DATE
      AND he_status IN ('P', 'T'); -- Đang khám hoặc đã kết thúc

    IF p_exceed_limit > 0 AND v_exam_count >= p_exceed_limit THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error_code', 'EXCEED_LIMIT',
            'message', format('Bác sĩ đã khám %s bệnh nhân trong ngày. Nếu khám tiếp BHXH sẽ xuất toán!', v_exam_count)
        );
    END IF;

    -- 3. KIỂM TRA MỘT BÁC SĨ - MỘT CHUYÊN KHOA (Examinationdoctoronespecialty)
    SELECT COUNT(*) INTO v_specialty_count
    FROM hms_exam 
    WHERE he_docno = p_docno 
      AND he_doctor = p_doctor 
      AND he_receptidx <> p_receptidx
      AND he_status <> 'O';

    IF v_specialty_count > 0 THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error_code', 'DUPLICATE_SPECIALTY',
            'message', 'Một bác sĩ chỉ được khám 1 phiếu khám của bệnh nhân. Khám 2 chuyên khoa sẽ bị xuất toán!'
        );
    END IF;

    -- 4. KIỂM TRA THỜI GIAN KHÁM TỐI THIỂU (Min Reception-Exam Interval)
    SELECT he_createddate INTO v_recept_date
    FROM hms_exam 
    WHERE he_docno = p_docno AND he_receptidx = p_receptidx;

    IF v_recept_date IS NOT NULL THEN
        v_minutes_diff := EXTRACT(EPOCH FROM (NOW() - v_recept_date)) / 60;
        IF p_min_minutes > 0 AND v_minutes_diff < p_min_minutes THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error_code', 'TOO_FAST',
                'message', format('Giờ khám phải lớn hơn %s phút kể từ lúc tiếp đón!', p_min_minutes)
            );
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;
        `);

        console.log("Function hms_check_insurance_rules_v1 created successfully.");
        process.exit(0);
    } catch (e) {
        console.error("Error creating function:", e);
        process.exit(1);
    }
}

migrate();
