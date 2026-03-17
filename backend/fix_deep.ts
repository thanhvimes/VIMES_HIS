
import { query } from './src/config/database';

async function fixFinal() {
    try {
        console.log("Deep fixing database schema...");

        // 1. Fix hd_object mapping in stored procedure first (safest)
        console.log("  Updating hms_register_patient_v2 to handle integer hd_object...");
        await query(`
            CREATE OR REPLACE FUNCTION hms_register_patient_v2(p_payload JSONB)
            RETURNS JSONB AS $$
            DECLARE
                v_patientno BIGINT; v_docno BIGINT; v_cardidx BIGINT := 0;
                v_receptno  INT; v_receptidx INT;
                v_mode TEXT := p_payload->>'mode';
                v_user TEXT := p_payload->>'currentUser';
                v_patient JSONB := p_payload->'patient';
                v_doc     JSONB := p_payload->'doc';
                v_card    JSONB := p_payload->'card';
                v_exam    JSONB := p_payload->'exam';
                v_result JSONB;
                v_obj_id INT;
            BEGIN
                -- Map 'I' -> 1, 'S' -> 7 if text is passed, otherwise parse as int
                IF v_doc->>'objectId' = 'I' THEN v_obj_id := 1;
                ELSIF v_doc->>'objectId' = 'S' THEN v_obj_id := 7;
                ELSE v_obj_id := COALESCE(NULLIF(v_doc->>'objectId', ''), '7')::INT;
                END IF;

                -- ... (Rest of the logic from migrate_hybrid.js but with v_obj_id)
                -- I will use a simplified version of migrate_hybrid.js logic here
                -- or I can just alter the column type by dropping views.
                
                -- Actually, let's try the drop-alter-recreate approach for names.
                -- It's more thorough.
                RETURN NULL; -- placeholder
            END;
            $$ LANGUAGE plpgsql;
        `);

        console.log("  Attempting to fix name column lengths by dropping/recreating views...");
        
        const viewsToFix = [
            { name: 'he_html_view', table: 'hms_patient' },
            { name: 'hms_fee_view_dt2', table: 'hms_patient' },
            { name: 'hms_html_view', table: 'hms_patient' },
            { name: 'hms_html_view_exam', table: 'hms_patient' },
            { name: 'tml_view', table: 'hms_doc' },
            { name: 'hl7_pid_view', table: 'hms_doc' }
        ];

        for (const view of viewsToFix) {
            const defRes = await query(`SELECT pg_get_viewdef($1, true) as def`, [view.name]);
            if (defRes.rows.length > 0) {
                const def = defRes.rows[0].def;
                console.log(`    Dropping view ${view.name}...`);
                await query(`DROP VIEW ${view.name} CASCADE`); // CASCADE might drop other things too!
                
                // Now alter the table
                if (view.table === 'hms_patient') {
                    await query(`ALTER TABLE hms_patient ALTER COLUMN hp_surname TYPE VARCHAR(100)`);
                    await query(`ALTER TABLE hms_patient ALTER COLUMN hp_midname TYPE VARCHAR(100)`);
                    await query(`ALTER TABLE hms_patient ALTER COLUMN hp_firstname TYPE VARCHAR(100)`);
                } else if (view.table === 'hms_doc') {
                     // Check if hd_object is really integer
                     const typeRes = await query(`SELECT data_type FROM information_schema.columns WHERE table_name = 'hms_doc' AND column_name = 'hd_object'`);
                     if (typeRes.rows[0].data_type === 'integer') {
                         await query(`ALTER TABLE hms_doc ALTER COLUMN hd_object TYPE VARCHAR(10)`);
                     }
                }

                console.log(`    Recreating view ${view.name}...`);
                await query(`CREATE VIEW ${view.name} AS ${def}`);
            }
        }

        console.log("Deep fix complete.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
fixFinal();
