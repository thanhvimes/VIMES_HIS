// Quick script to create hms_booking table
const { query } = require('./src/config/database');

async function createBookingTable() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS hms_booking (
                hb_id SERIAL PRIMARY KEY,
                hb_deptid VARCHAR(7),
                hb_roomid INTEGER,
                hb_date DATE,
                hb_time TIME,
                hb_slot_no INTEGER,
                hb_patient_name VARCHAR(100),
                hb_patient_phone VARCHAR(20),
                hb_status VARCHAR(20) DEFAULT 'PENDING'
            )
        `);
        console.log('✅ hms_booking table created');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createBookingTable();
