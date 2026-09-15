#!/usr/bin/env node
/**
 * SCRIPT: Generate Schedule Data for Next N Days
 * 
 * This script creates schedule entries in hms_schedule table for all active rooms
 * for the next N days. Each room will have 2 shifts per day (morning & afternoon).
 * 
 * Usage: node generate-schedule.js [deptId] [days]
 * Example: node generate-schedule.js KB 30
 *          node generate-schedule.js KBYC 14
 */

require('dotenv').config({ path: '../.env' });
const db = require('../src/config/database');

// Configuration
const DEPT_ID = process.argv[2]; // Mã khoa (BẮT BUỘC)
const DAYS_TO_GENERATE = parseInt(process.argv[3]) || 30;

if (!DEPT_ID) {
    console.error('❌ Lỗi: Thiếu tham số deptId');
    console.error('');
    console.error('Cách sử dụng: node generate-schedule.js [deptId] [days]');
    console.error('Ví dụ: node generate-schedule.js KB 30');
    console.error('');
    process.exit(1);
}



async function generateSchedule() {
    console.log('🚀 Starting schedule generation...');
    console.log(`   Department: ${DEPT_ID}`);
    console.log(`   Days: ${DAYS_TO_GENERATE}`);
    console.log('');

    try {
        // 1. Get shift configurations from hms_schedule_exam_setup
        console.log('📋 Step 1: Fetching shift configurations from HIS...');
        const setupResult = await db.query(`
            SELECT 
                hses_deptid,
                hses_roomid,
                hses_type,
                hses_starttime,
                hses_endtime,
                hses_time as slot_duration,
                hses_slot as max_patients
            FROM hms_schedule_exam_setup
            WHERE hses_deptid = $1 AND is_active = true
            ORDER BY hses_roomid, hses_type
        `, [DEPT_ID]);

        if (setupResult.rows.length === 0) {
            console.log('❌ No shift configurations found in hms_schedule_exam_setup!');
            console.log('   Please configure shifts in HIS first.');
            process.exit(1);
        }

        console.log(`   Found ${setupResult.rows.length} shift configurations`);
        setupResult.rows.forEach(s => console.log(`   - Room ${s.hses_roomid}, Shift ${s.hses_type}: ${s.hses_starttime} - ${s.hses_endtime}`));
        console.log('');

        // 2. Generate dates
        console.log('📅 Step 2: Generating date range...');
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const dates = [];
        for (let i = 0; i < DAYS_TO_GENERATE; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        console.log(`   From: ${dates[0]}`);
        console.log(`   To: ${dates[dates.length - 1]}`);
        console.log('');

        // 3. Delete existing schedules in this range
        console.log('🗑️  Step 3: Cleaning existing schedules...');
        const deleteResult = await db.query(`
            DELETE FROM hms_schedule
            WHERE hs_deptid = $1 
              AND hs_date >= $2 
              AND hs_date <= $3
        `, [DEPT_ID, dates[0], dates[dates.length - 1]]);
        console.log(`   Deleted ${deleteResult.rowCount} existing records`);
        console.log('');

        // 4. Insert new schedules based on setup configuration
        console.log('✨ Step 4: Creating new schedules from HIS configuration...');
        let totalInserted = 0;

        for (const setup of setupResult.rows) {
            for (const date of dates) {
                await db.query(`
                    INSERT INTO hms_schedule (
                        hs_deptid, hs_roomid, hs_date, hs_shift,
                        hs_start_time, hs_end_time, hs_slot_duration,
                        hs_max_patients, hs_active, hs_created_by, hs_created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Y', 'SYSTEM', NOW())
                `, [
                    setup.hses_deptid,
                    setup.hses_roomid,
                    date,
                    setup.hses_type,
                    setup.hses_starttime,
                    setup.hses_endtime,
                    setup.slot_duration,
                    setup.max_patients
                ]);

                totalInserted++;
            }
            console.log(`   ✓ Room ${setup.hses_roomid} - Shift ${setup.hses_type}: ${DAYS_TO_GENERATE} days`);
        }

        console.log('');
        console.log(`✅ Successfully created ${totalInserted} schedule entries!`);
        console.log('');

        // 5. Verify
        console.log('🔍 Step 5: Verification...');
        const verifyResult = await db.query(`
            SELECT 
                hs_date,
                COUNT(*) as total_shifts,
                COUNT(DISTINCT hs_roomid) as total_rooms
            FROM hms_schedule
            WHERE hs_deptid = $1 
              AND hs_date >= $2 
              AND hs_date <= $3
            GROUP BY hs_date
            ORDER BY hs_date
            LIMIT 5
        `, [DEPT_ID, dates[0], dates[dates.length - 1]]);

        console.log('   First 5 days:');
        console.table(verifyResult.rows);

        console.log('');
        console.log('🎉 Schedule generation completed successfully!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Test the slots API: GET /api/v1/schedule/slots?deptId=KB&specialityCode=1&date=2026-01-28');
        console.log('2. Check the frontend booking form to see available slots');
        console.log('');

        process.exit(0);

    } catch (error) {
        console.error('');
        console.error('❌ Error generating schedule:');
        console.error(error);
        console.error('');
        process.exit(1);
    }
}

// Run the script
generateSchedule();
