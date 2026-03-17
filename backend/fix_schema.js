const db = require('./src/config/database');

async function fixSchema() {
    try {
        console.log('Adding missing columns to hms_schedule_exam_setup...');

        await db.query(`
            ALTER TABLE hms_schedule_exam_setup 
            ADD COLUMN IF NOT EXISTS hses_slot INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
        `);

        console.log('✅ Schema fixed successfully.');

        // Verify again
        const result = await db.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'hms_schedule_exam_setup'
        `);
        console.table(result.rows);

    } catch (err) {
        console.error('❌ Error fixing schema:', err);
    } finally {
        process.exit();
    }
}

fixSchema();
