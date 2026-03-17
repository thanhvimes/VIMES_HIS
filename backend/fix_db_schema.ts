
import { query } from './src/config/database';

async function fix() {
    try {
        console.log("Fixing database schema for patient registration...");

        // 1. Fix name column lengths in hms_patient
        console.log("  Altering hms_patient name columns...");
        await query(`ALTER TABLE hms_patient ALTER COLUMN hp_surname TYPE VARCHAR(100)`);
        await query(`ALTER TABLE hms_patient ALTER COLUMN hp_midname TYPE VARCHAR(100)`);
        await query(`ALTER TABLE hms_patient ALTER COLUMN hp_firstname TYPE VARCHAR(100)`);

        // 2. Fix hd_object type in hms_doc
        console.log("  Checking and altering hms_doc.hd_object type...");
        const res = await query(`
            SELECT data_type FROM information_schema.columns 
            WHERE table_name = 'hms_doc' AND column_name = 'hd_object'
        `);
        
        if (res.rows.length > 0 && res.rows[0].data_type === 'integer') {
            console.log("  hd_object is integer, converting to VARCHAR...");
            // Need to handle conversion carefully if data exists
            await query(`ALTER TABLE hms_doc ALTER COLUMN hd_object TYPE VARCHAR(10)`);
        }

        // 3. Ensure other columns have enough space
        await query(`ALTER TABLE hms_doc ALTER COLUMN hd_telephone TYPE VARCHAR(50)`);
        await query(`ALTER TABLE hms_doc ALTER COLUMN hd_cardno TYPE VARCHAR(50)`);

        console.log("Schema fixes complete.");
        process.exit(0);
    } catch (err) {
        console.error("Error fixing schema:", err);
        process.exit(1);
    }
}

fix();
