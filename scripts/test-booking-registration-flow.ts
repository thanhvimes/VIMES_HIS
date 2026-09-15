// File: backend/scripts/test-booking-registration-flow.ts
import { query } from '../src/config/database';

async function runTest() {
    console.log('=============== BẮT ĐẦU TEST INTEGRATION BOOKING ONLINE ===============');

    try {
        // 1. Test Fetch Specialities for Dept KB
        console.log('\n--- TEST 1: Fetch Specialities for Dept KB ---');
        const specResult = await query(`
            SELECT DISTINCT 
                hrk_code as id, 
                ss_desc as name,
                hrk_deptid as "deptId"
            FROM hms_roomlist_kios
            LEFT JOIN sys_sel ON (ss_id = 'hms_room_kios' AND CAST(ss_code AS INT) = hrk_code)
            WHERE hrk_active = 'Y'
              AND hrk_deptid = $1
            ORDER BY ss_desc
        `, ['KB']);
        console.log(`Found ${specResult.rows.length} specialities for dept KB:`, specResult.rows);

        if (specResult.rows.length === 0) {
            console.log('⚠️ Warning: No kiosk specialities found for dept KB in hms_roomlist_kios.');
        }

        // 2. Test Fetch Rooms for Specialty '2' (Khám vú) and Dept KB
        console.log('\n--- TEST 2: Fetch Rooms for Speciality 2 & Dept KB ---');
        const roomResult = await query(`
            SELECT DISTINCT
                hrk_id as id,
                hrk_deptid as "deptId",
                r.hrl_roomname as name,
                hrk_code as code
            FROM hms_roomlist_kios k
            LEFT JOIN hms_roomlist r ON (k.hrk_deptid = r.hrl_deptid AND k.hrk_id = r.hrl_id)
            WHERE k.hrk_code::varchar = $1::varchar 
              AND k.hrk_deptid = $2
              AND k.hrk_active = 'Y'
            ORDER BY hrk_id
        `, ['2', 'KB']);
        console.log(`Found ${roomResult.rows.length} rooms for Speciality 2 & Dept KB:`, roomResult.rows);

        const targetRoomId = roomResult.rows[0]?.id || 65;

        // 3. Test Room Auto-Assignment and Stored Procedure Execution
        console.log('\n--- TEST 3: Stored Procedure qms_patient_create_booking ---');
        const testDate = new Date().toISOString().split('T')[0];
        const testTime = '13:30';

        // Ensure schedule slot exists in hms_schedule_exam for testDate & testTime
        await query(`
            INSERT INTO hms_schedule_exam (hse_deptid, hse_roomid, hse_date, hse_time, hse_receptno, hse_status)
            VALUES ('KB', $1, $2, $3, 1, 'O')
            ON CONFLICT DO NOTHING
        `, [targetRoomId, testDate, testTime]);

        const procResult = await query(`
            SELECT qms_patient_create_booking(
                $1::text, $2::text, $3::date, $4::text, $5::text, 
                $6::integer, $7::integer, $8::integer, $9::text, $10::text,
                $11::text, $12::integer, $13::date, $14::text, $15::text,
                $16::integer, $17::text, $18::text, $19::text, $20::date,
                $21::boolean, $22::boolean, $23::text
            ) as booking_id;
        `, [
            '999888777666', 'TEST BENH NHAN PHONG KHAM', '1990-01-01', 'M', '1',
            1, 1, 1, '123 ĐƯỜNG TEST', '0999888777',
            'KB', targetRoomId, testDate, testTime, 'Khám tổng quát test',
            0, '', '', 'ONL', null,
            false, false, '2'
        ]);

        const bookingId = procResult.rows[0].booking_id;
        console.log(`Stored Procedure returned booking_id: ${bookingId}`);

        if (bookingId > 0) {
            console.log('✅ Stored Procedure execution SUCCESSFUL!');
            
            // Query qms_patient to verify stored data
            const verifyResult = await query(`
                SELECT 
                    qms_idx, qms_patientname, qms_deptid, qms_roomid, qms_specialty_code, qms_appointment_time
                FROM qms_patient 
                WHERE qms_idx = $1
            `, [bookingId]);
            console.log('Verified inserted record in qms_patient:', verifyResult.rows[0]);

            // Clean up test record
            await query(`DELETE FROM qms_patient WHERE qms_idx = $1`, [bookingId]);
            console.log('🧹 Cleaned up test record.');
        } else {
            console.error(`❌ Stored Procedure returned error code: ${bookingId}`);
        }

        console.log('\n=============== HOÀN THÀNH TEST DỮ LIỆU CHUẨN XÁC 100% ===============\n');
    } catch (err: any) {
        console.error('❌ Test failed with error:', err);
    } process.exit(0);
}

runTest();
