// ==================== CREATE & SEED SCHEDULE ====================
// File: backend/src/scripts/setup-schedule.js

const { query } = require('../config/database');

async function setupSchedule() {
    try {
        console.log('🏗️  Setting up hms_schedule table...');

        // Drop existing table
        await query('DROP TABLE IF EXISTS hms_schedule CASCADE');
        console.log('✅ Dropped existing table (if any)');

        // Create table
        await query(`
            CREATE TABLE IF NOT EXISTS public.hms_schedule (
                hs_id SERIAL PRIMARY KEY,
                hs_createdby VARCHAR(15),
                hs_createddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                hs_updatedby VARCHAR(15),
                hs_updateddate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                hs_deptid VARCHAR(7) NOT NULL,
                hs_roomid INTEGER NOT NULL,
                
                hs_date DATE NOT NULL,
                hs_dayofweek INTEGER,
                hs_shift VARCHAR(10),
                
                hs_start_time TIME NOT NULL,
                hs_end_time TIME NOT NULL,
                hs_slot_duration INTEGER DEFAULT 15,
                
                hs_max_patients INTEGER DEFAULT 3,
                hs_total_slots INTEGER,
                
                hs_active VARCHAR(1) DEFAULT 'Y',
                hs_note TEXT
            );
        `);

        console.log('✅ Table created');

        // Create indexes
        await query(`CREATE INDEX IF NOT EXISTS idx_schedule_dept_room ON hms_schedule(hs_deptid, hs_roomid)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_schedule_date ON hms_schedule(hs_date)`);
        await query(`CREATE INDEX IF NOT EXISTS idx_schedule_active ON hms_schedule(hs_active)`);

        console.log('✅ Indexes created');

        console.log('\n🌱 Seeding schedule data...');

        // Clear existing data
        await query('TRUNCATE TABLE hms_schedule RESTART IDENTITY CASCADE');

        // Seed data - Khoa KB, Phòng 65
        for (let i = 0; i < 7; i++) {
            // Morning shift
            await query(`
                INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients)
                VALUES ('KB', 65, CURRENT_DATE + $1, EXTRACT(DOW FROM CURRENT_DATE + $1), 'MORNING', '08:00', '12:00', 15, 3)
            `, [i]);

            // Afternoon shift
            await query(`
                INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients)
                VALUES ('KB', 65, CURRENT_DATE + $1, EXTRACT(DOW FROM CURRENT_DATE + $1), 'AFTERNOON', '13:00', '17:00', 15, 3)
            `, [i]);
        }

        // Khoa KB, Phòng 66
        for (let i = 0; i < 5; i++) {
            await query(`
                INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients)
                VALUES ('KB', 66, CURRENT_DATE + $1, EXTRACT(DOW FROM CURRENT_DATE + $1), 'MORNING', '08:00', '12:00', 15, 3)
            `, [i]);

            await query(`
                INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients)
                VALUES ('KB', 66, CURRENT_DATE + $1, EXTRACT(DOW FROM CURRENT_DATE + $1), 'AFTERNOON', '13:00', '17:00', 15, 3)
            `, [i]);
        }

        // Khoa 00001, Phòng 65
        for (let i = 0; i < 7; i++) {
            await query(`
                INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients)
                VALUES ('00001', 65, CURRENT_DATE + $1, EXTRACT(DOW FROM CURRENT_DATE + $1), 'MORNING', '08:00', '12:00', 15, 3)
            `, [i]);

            await query(`
                INSERT INTO hms_schedule (hs_deptid, hs_roomid, hs_date, hs_shift, hs_start_time, hs_end_time, hs_slot_duration, hs_max_patients)
                VALUES ('00001', 65, CURRENT_DATE + $1, EXTRACT(DOW FROM CURRENT_DATE + $1), 'AFTERNOON', '13:00', '17:00', 15, 3)
            `, [i]);
        }

        console.log('✅ Seed data inserted');

        // Verify
        const result = await query(`
            SELECT 
                hs_deptid,
                hs_roomid,
                COUNT(*) as total_schedules,
                MIN(hs_date) as first_date,
                MAX(hs_date) as last_date
            FROM hms_schedule
            GROUP BY hs_deptid, hs_roomid
            ORDER BY hs_deptid, hs_roomid
        `);

        console.log('\n📊 Summary:');
        result.rows.forEach(row => {
            console.log(`  - Khoa ${row.hs_deptid}, Phòng ${row.hs_roomid}: ${row.total_schedules} schedules (${row.first_date} → ${row.last_date})`);
        });

        console.log('\n🎉 Setup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

setupSchedule();
