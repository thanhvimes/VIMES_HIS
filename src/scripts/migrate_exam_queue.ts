
import { pool } from '../config/database';

async function migrate() {
    const sql = `
    DROP FUNCTION IF EXISTS hms_get_exam_queue_v1(text, text, text);
    DROP FUNCTION IF EXISTS hms_get_exam_queue_v1(text, text, text, text, text, integer);
    DROP FUNCTION IF EXISTS hms_get_exam_queue_v1(text, text, text, text, text, integer, boolean, boolean);

    -- Function to fetch patient queue with full filters including outpatient/chronic
    CREATE OR REPLACE FUNCTION hms_get_exam_queue_v1(
        p_dept_id text, 
        p_status text,
        p_time_period text DEFAULT '1',
        p_from_date text DEFAULT CURRENT_DATE::text,
        p_to_date text DEFAULT CURRENT_DATE::text,
        p_room_id integer DEFAULT NULL,
        p_is_outpatient boolean DEFAULT false,
        p_is_chronic boolean DEFAULT false
    )
    RETURNS jsonb AS $$
    DECLARE
        v_results jsonb;
        v_he_status text;
        v_from_time text;
        v_to_time text;
    BEGIN
        v_he_status := CASE 
            WHEN p_status = 'waiting' THEN 'O'
            WHEN p_status = 'processing' THEN 'P'
            WHEN p_status = 'completed' THEN 'T'
            ELSE 'O'
        END;

        IF p_time_period = '2' THEN
            v_from_time := '00:00:00';
            v_to_time := '11:59:59';
        ELSIF p_time_period = '3' THEN
            v_from_time := '12:00:00';
            v_to_time := '23:59:59';
        ELSE
            v_from_time := '00:00:00';
            v_to_time := '23:59:59';
        END IF;

        SELECT jsonb_agg(t) INTO v_results
        FROM (
            SELECT 
                p.hp_patientno::text as id,
                TRIM(COALESCE(p.hp_surname, '') || ' ' || COALESCE(p.hp_firstname, '')) as name,
                EXTRACT(YEAR FROM AGE(p.hp_birthdate))::int as age,
                CASE WHEN p.hp_sex = 'M' THEN 'Nam' ELSE 'Nữ' END as gender,
                e.he_prediagnostic as reason,
                p_status as status,
                to_char(e.he_examdate, 'HH24:MI') as "arrivalTime",
                CASE 
                    WHEN e.he_emergency = 'Y' THEN 'Emergency' 
                    WHEN e.he_priority = '1' THEN 'High' 
                    ELSE 'Normal' 
                END as priority,
                e.he_docno::text as "docNo",
                e.he_patientno::text as "patientNo",
                e.he_receptidx as "receptIdx",
                e.he_roomid as "roomId"
            FROM hms_exam e
            JOIN hms_patient p ON e.he_patientno = p.hp_patientno
            JOIN hms_doc d ON e.he_docno = d.hd_docno
            WHERE (p_dept_id = 'ALL' OR e.he_deptid = p_dept_id)
              AND e.he_status = v_he_status
              AND (p_room_id IS NULL OR e.he_roomid = p_room_id)
              AND e.he_examdate >= (p_from_date::date + v_from_time::time)
              AND e.he_examdate <= (p_to_date::date + v_to_time::time)
              AND (
                  (NOT p_is_outpatient AND NOT p_is_chronic) OR
                  (p_is_outpatient AND d.hd_ma_loai_kcb = '02') OR
                  (p_is_chronic AND d.hd_ma_loai_kcb IN ('05', '08'))
              )
            ORDER BY 
                CASE WHEN e.he_emergency = 'Y' THEN 0 WHEN e.he_priority = '1' THEN 1 ELSE 2 END,
                e.he_examdate ASC
        ) t;
        RETURN COALESCE(v_results, '[]'::jsonb);
    END;
    $$ LANGUAGE plpgsql;

    -- Function to get rooms for a department
    CREATE OR REPLACE FUNCTION hms_get_rooms_v1(p_dept_id text)
    RETURNS jsonb AS $$
    DECLARE
        v_results jsonb;
    BEGIN
        SELECT jsonb_agg(t) INTO v_results
        FROM (
            SELECT hrl_id as id, hrl_name as name 
            FROM hms_roomlist 
            WHERE hrl_deptid = p_dept_id 
            ORDER BY hrl_id
        ) t;
        RETURN COALESCE(v_results, '[]'::jsonb);
    END;
    $$ LANGUAGE plpgsql;

    -- Function to fetch detailed patient profile
    DROP FUNCTION IF EXISTS hms_get_patient_profile_v1(bigint, bigint);
    CREATE OR REPLACE FUNCTION hms_get_patient_profile_v1(p_patient_no bigint, p_doc_no bigint DEFAULT NULL)
    RETURNS jsonb AS $$
    DECLARE
        v_result jsonb;
    BEGIN
        SELECT jsonb_build_object(
            'id', p.hp_patientno::text,
            'recordNumber', p.hp_patientno::text,
            'name', TRIM(COALESCE(p.hp_surname, '') || ' ' || COALESCE(p.hp_firstname, '')),
            'dob', COALESCE(to_char(p.hp_birthdate, 'YYYY-MM-DD'), ''),
            'age', COALESCE(FLOOR(date_part('year', age(p.hp_birthdate))), 0),
            'gender', CASE WHEN p.hp_sex = 'M' THEN 'Nam' ELSE 'Nữ' END,
            'ethnicity', p.hp_ethnic,
            'occupation', p.hp_occupation,
            'address', COALESCE(d.hd_dtladdr, p.hp_dtladdr, ''),
            'phone', COALESCE(d.hd_telephone, ''),
            'identityCard', COALESCE(p.hp_pid, ''),
            'patientType', CASE WHEN d.hd_object = 1 THEN 'Bảo hiểm' ELSE 'Dịch vụ' END,
            'insuranceNumber', COALESCE(d.hd_cardno, ''),
            'hasInsurance', (d.hd_cardno IS NOT NULL AND d.hd_cardno <> ''),
            'vitalSigns', jsonb_build_object(
                'height', COALESCE(e.he_height, 0),
                'weight', COALESCE(e.he_weight, 0),
                'heartRate', COALESCE(e.he_pulse, 0),
                'temp', COALESCE(e.he_temperature, 0),
                'bpSys', COALESCE(e.he_bloodpressure::text, '0'),
                'bpDia', COALESCE(e.he_bloodpressurex::text, '0'),
                'respRate', COALESCE(e.he_breathinterval, 0),
                'bmi', COALESCE(e.he_bmi, 0)
            )
        ) INTO v_result
        FROM hms_patient p
        LEFT JOIN hms_exam e ON p.hp_patientno = e.he_patientno AND (p_doc_no IS NULL OR e.he_docno = p_doc_no)
        LEFT JOIN hms_doc d ON e.he_docno = d.hd_docno
        WHERE p.hp_patientno = p_patient_no
        ORDER BY e.he_examdate DESC NULLS LAST
        LIMIT 1;

        RETURN COALESCE(v_result, '{}'::jsonb);
    END;
    $$ LANGUAGE plpgsql;
    `;

    try {
        await pool.query(sql);
        console.log("Exam queue migration functions created successfully.");
    } catch (err) {
        console.error("Migration failed:", err);
    }
    process.exit(0);
}

migrate();
