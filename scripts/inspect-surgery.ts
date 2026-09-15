import { query } from '../src/config/database';

async function inspect() {
  try {
    const docNo = '260149064';
    console.log(`=== Inspecting Operation/Surgery for docNo: ${docNo} ===`);

    const opRes = await query('SELECT * FROM hms_operation WHERE ho_docno = $1', [docNo]);
    console.log('hms_operation row count:', opRes.rows.length);
    console.log('hms_operation rows:', JSON.stringify(opRes.rows, null, 2));

    if (opRes.rows.length > 0) {
      const deptId = opRes.rows[0].ho_deptid;
      const roomId = opRes.rows[0].ho_roomid;
      console.log(`ho_deptid: ${deptId}, ho_roomid: ${roomId}`);

      const roomRes = await query('SELECT * FROM hms_roomlist WHERE hrl_deptid = $1', [deptId]);
      console.log(`Rooms in dept ${deptId}:`, JSON.stringify(roomRes.rows, null, 2));

      const roomMatchRes = await query('SELECT * FROM hms_roomlist WHERE hrl_id::text = $1', [String(roomId)]);
      console.log(`Rooms matching hrl_id = ${roomId}:`, JSON.stringify(roomMatchRes.rows, null, 2));
    }

    // Run the actual query from getHisSurgeries
    const { rows } = await query(`
          SELECT 
              o.ho_idx as id,
              o.ho_docno as doc_no,
              trim(p.hp_surname || ' ' || COALESCE(p.hp_midname,'') || ' ' || p.hp_firstname) as patient_name,
              to_char(p.hp_birthdate, 'YYYY') as birth_year,
              COALESCE(r.hrl_name, 'Phòng mổ ' || COALESCE(ob.hob_roomid, o.ho_roomid, 1)) as room_name,
              COALESCE(ob.hob_roomid, o.ho_roomid) as room_id,
              to_char(o.ho_startdate, 'YYYY-MM-DD HH24:MI') as expected_time,
              o.ho_deptid as dept_id,
              sd.sd_name as dept_name,
              (ob.hob_operation_board_id IS NOT NULL) as is_on_board,
              ob.hob_status as board_status
          FROM hms_operation o
          LEFT JOIN hms_doc d ON d.hd_docno = o.ho_docno
          LEFT JOIN hms_patient p ON p.hp_patientno = COALESCE(o.ho_patientno, d.hd_patientno)
          LEFT JOIN sys_dept sd ON sd.sd_id = o.ho_deptid
          LEFT JOIN hms_operation_board ob ON ob.hob_docno = o.ho_docno AND DATE(ob.hob_date) = CURRENT_DATE
          LEFT JOIN hms_roomlist r ON  hrl_deptid = o.ho_deptid AND r.hrl_id::text = COALESCE(ob.hob_roomid::text, o.ho_roomid::text)
          WHERE o.ho_docno = $1
    `, [docNo]);

    console.log('Result from query:', JSON.stringify(rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
