
import { query } from './src/config/database';

async function testInsert() {
    try {
        console.log("Testing hms_patient insert...");
        const v_user = 'admin';
        const v_patientno = 999123;
        
        const sql = `
            INSERT INTO hms_patient (
                hp_createdby, hp_createddate, hp_patientno, hp_patientid, 
                hp_surname, hp_midname, hp_firstname, hp_birthdate, hp_sex, 
                hp_ethnic, hp_sin, hp_provid, hp_distid, hp_villid, hp_dtladdr, 
                hp_occupation, hp_workplace, hp_workplaceid, hp_status, hp_rank, 
                hp_position, hp_yearofbirth, hp_nationality
            ) VALUES (
                $1, NOW(), $2, $3,
                $4, $5, $6, 
                $7::DATE, $8,
                $9::INT, $10, 
                $11::INT, $12::INT, 
                $13::INT, $14,
                $15::INT, $16, 
                $17, $18, 
                $19::INT,
                $20::INT, $21, 
                $22
            ) RETURNING hp_patientno;
        `;

        const res = await query(sql, [
            v_user, v_patientno, v_patientno.toString(),
            'BN', 'T', 'BHYT',
            '1985-02-02', 'F',
            1, 'SIN' + Date.now(),
            1, 1, 1, 'Addr',
            1, '', '', 'A', null, null, '1985', 'VN'
        ]);

        console.log("SUCCESS, inserted:", res.rows[0].hp_patientno);
        process.exit(0);
    } catch (e: any) {
        console.error("FAIL:", e.message);
        process.exit(1);
    }
}

testInsert();
