
import { query } from './src/config/database';

async function init() {
    try {
        console.log("Initializing database sequences...");

        const sequences = [
            { name: 'hms_patient_hp_patientno_seq', table: 'hms_patient', column: 'hp_patientno' },
            { name: 'hms_doc_hd_docno_seq', table: 'hms_doc', column: 'hd_docno' },
            { name: 'hms_card_hc_idx_seq', table: 'hms_card', column: 'hc_idx' }
        ];

        for (const seq of sequences) {
            console.log(`Checking sequence: ${seq.name}`);
            
            // Check if sequence exists
            const seqExists = await query(`
                SELECT EXISTS (
                    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                    WHERE c.relkind = 'S' AND c.relname = $1
                )
            `, [seq.name]);

            if (!seqExists.rows[0].exists) {
                console.log(`  Creating sequence ${seq.name}...`);
                await query(`CREATE SEQUENCE ${seq.name}`);
            }

            // Get max value from table
            const maxValRes = await query(`SELECT MAX(${seq.column}) as max_val FROM ${seq.table}`);
            const maxVal = parseInt(maxValRes.rows[0].max_val || '0');
            const nextVal = maxVal + 1;

            console.log(`  Setting ${seq.name} to ${nextVal}`);
            await query(`SELECT setval($1, $2, false)`, [seq.name, nextVal]);
        }

        console.log("Sequences initialization complete.");
        process.exit(0);
    } catch (err) {
        console.error("Error initializing sequences:", err);
        process.exit(1);
    }
}

init();
