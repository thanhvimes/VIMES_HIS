import { pool } from '../src/config/database';

async function testSurgerySQL() {
    console.log('====================================================');
    console.log('🔍 TESTING USER SURGERY QUERY AGAINST DATABASE');
    console.log('====================================================\n');

    try {
        // Query 1: Strict o.ho_startdate >= NOW() - INTERVAL '8 hours'
        const strictSql = `
            SELECT 
              o.ho_idx as id,
              o.ho_docno as doc_no,
              trim(p.hp_surname || ' ' || COALESCE(p.hp_midname,'') || ' ' || p.hp_firstname) as patient_name,
              to_char(p.hp_birthdate, 'YYYY') as birth_year,
              COALESCE(pd.sd_name, o.ho_pdeptid, r.hrl_name, 'Phòng mổ ' || COALESCE(ob.hob_roomid, o.ho_roomid, 1)) as room_name,
              COALESCE(ob.hob_roomid, o.ho_roomid) as room_id,
              to_char(o.ho_startdate, 'HH24:MI') as expected_time,
              to_char(o.ho_performdate, 'HH24:MI') as entrance_time,
              COALESCE(ob.hob_status, o.ho_status, 'P') as status,
              ss.ss_desc as status_desc,
              ob.hob_operation_table as operation_table,
              t.hst_name as table_name,
              ob.hob_rettime as return_time_minutes,
              ob.hob_retdept as return_dept_id,
              rd.sd_name as return_dept_name,
              to_char(ob.hob_conscious_date, 'HH24:MI') as conscious_time,
              o.ho_deptid as dept_id,
              sd.sd_name as dept_name,
              o.ho_doctor as doctor_id,
              o.ho_beforeopera as before_diagnosis,
              o.ho_afteropera as after_diagnosis
          FROM hms_operation o
          LEFT JOIN hms_doc d ON d.hd_docno = o.ho_docno
          LEFT JOIN hms_patient p ON p.hp_patientno = COALESCE(o.ho_patientno, d.hd_patientno)
          INNER JOIN hms_operation_board ob ON ob.hob_docno = o.ho_docno 
              AND (ob.hob_ho_idx = o.ho_idx OR ob.hob_ho_idx IS NULL)
              AND (ob.hob_date >= CURRENT_DATE - INTERVAL '1 day' OR DATE(ob.hob_date) = CURRENT_DATE)
          LEFT JOIN hms_roomlist r ON r.hrl_deptid = o.ho_deptid 
              AND r.hrl_id::text = COALESCE(NULLIF(ob.hob_roomid::text, ''), NULLIF(o.ho_roomid::text, ''), '0')
              AND COALESCE(NULLIF(ob.hob_roomid::text, ''), NULLIF(o.ho_roomid::text, ''), '') NOT IN ('', '0')
          LEFT JOIN hms_surgery_table t ON t.hst_idx = ob.hob_operation_table
          LEFT JOIN sys_dept sd ON sd.sd_id = o.ho_deptid
          LEFT JOIN sys_dept pd ON pd.sd_id = o.ho_pdeptid
          LEFT JOIN sys_dept rd ON rd.sd_id = ob.hob_retdept
          LEFT JOIN sys_sel ss ON ss.ss_id = 'hms_operation_status' AND ss.ss_code = COALESCE(ob.hob_status, o.ho_status, 'P')
          WHERE
               o.ho_startdate >= (NOW() - INTERVAL '8 hours')
          ORDER BY o.ho_startdate desc
        `;

        const res1 = await pool.query(strictSql);
        console.log(`📊 Strict Query Result Count: ${res1.rows.length}`);
        console.table(res1.rows);

        // Query 2: Robust COALESCE filter for ho_startdate / ho_performdate / hob_date
        const robustSql = `
            SELECT 
              o.ho_idx as id,
              o.ho_docno as doc_no,
              trim(p.hp_surname || ' ' || COALESCE(p.hp_midname,'') || ' ' || p.hp_firstname) as patient_name,
              to_char(p.hp_birthdate, 'YYYY') as birth_year,
              COALESCE(pd.sd_name, o.ho_pdeptid, r.hrl_name, 'Phòng mổ ' || COALESCE(ob.hob_roomid, o.ho_roomid, 1)) as room_name,
              COALESCE(ob.hob_roomid, o.ho_roomid) as room_id,
              to_char(o.ho_startdate, 'HH24:MI') as expected_time,
              to_char(o.ho_performdate, 'HH24:MI') as entrance_time,
              COALESCE(ob.hob_status, o.ho_status, 'P') as status,
              ss.ss_desc as status_desc,
              ob.hob_operation_table as operation_table,
              t.hst_name as table_name,
              ob.hob_rettime as return_time_minutes,
              ob.hob_retdept as return_dept_id,
              rd.sd_name as return_dept_name,
              to_char(ob.hob_conscious_date, 'HH24:MI') as conscious_time,
              o.ho_deptid as dept_id,
              sd.sd_name as dept_name,
              o.ho_doctor as doctor_id,
              o.ho_beforeopera as before_diagnosis,
              o.ho_afteropera as after_diagnosis
          FROM hms_operation o
          LEFT JOIN hms_doc d ON d.hd_docno = o.ho_docno
          LEFT JOIN hms_patient p ON p.hp_patientno = COALESCE(o.ho_patientno, d.hd_patientno)
          INNER JOIN hms_operation_board ob ON ob.hob_docno = o.ho_docno 
              AND (ob.hob_ho_idx = o.ho_idx OR ob.hob_ho_idx IS NULL)
              AND (ob.hob_date >= CURRENT_DATE - INTERVAL '1 day' OR DATE(ob.hob_date) = CURRENT_DATE)
          LEFT JOIN hms_roomlist r ON r.hrl_deptid = o.ho_deptid 
              AND r.hrl_id::text = COALESCE(NULLIF(ob.hob_roomid::text, ''), NULLIF(o.ho_roomid::text, ''), '0')
              AND COALESCE(NULLIF(ob.hob_roomid::text, ''), NULLIF(o.ho_roomid::text, ''), '') NOT IN ('', '0')
          LEFT JOIN hms_surgery_table t ON t.hst_idx = ob.hob_operation_table
          LEFT JOIN sys_dept sd ON sd.sd_id = o.ho_deptid
          LEFT JOIN sys_dept pd ON pd.sd_id = o.ho_pdeptid
          LEFT JOIN sys_dept rd ON rd.sd_id = ob.hob_retdept
          LEFT JOIN sys_sel ss ON ss.ss_id = 'hms_operation_status' AND ss.ss_code = COALESCE(ob.hob_status, o.ho_status, 'P')
          WHERE
               COALESCE(o.ho_startdate, o.ho_performdate, ob.hob_performdate, ob.hob_date) >= (NOW() - INTERVAL '8 hours')
          ORDER BY COALESCE(o.ho_startdate, o.ho_performdate) DESC NULLS LAST
        `;

        const res2 = await pool.query(robustSql);
        console.log(`\n📊 Robust Query Result Count: ${res2.rows.length}`);
        console.table(res2.rows);

    } catch (e) {
        console.error('❌ SQL Error:', e);
    } finally {
        await pool.end();
    }
}

testSurgerySQL();
