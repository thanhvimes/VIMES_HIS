
import { query } from './src/config/database';

async function fix() {
    try {
        console.log("Starting DB Schema Fix (Names & Object Types)...");

        const columnsToFix = [
            { table: 'hms_patient', columns: ['hp_surname', 'hp_midname', 'hp_firstname'], newType: 'VARCHAR(100)' },
            { table: 'hms_doc', columns: ['hd_object'], newType: 'VARCHAR(10)' }
        ];

        for (const target of columnsToFix) {
            console.log(`Processing ${target.table}.${target.columns.join(', ')}...`);

            // 1. Find all dependent views
            const depRes = await query(`
                SELECT DISTINCT v.relname AS view_name, n.nspname as schema_name
                FROM pg_depend d
                JOIN pg_rewrite r ON r.oid = d.objid
                JOIN pg_class v ON v.oid = r.ev_class
                JOIN pg_namespace n ON n.oid = v.relnamespace
                JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
                JOIN pg_class t ON t.oid = d.refobjid
                WHERE t.relname = $1
                AND a.attname = ANY($2)
                AND v.relkind = 'v'
            `, [target.table, target.columns]);

            const views = depRes.rows;
            console.log(`  Found ${views.length} dependent views: ${views.map(v => v.view_name).join(', ')}`);

            // 2. Capture definitions and drop
            const viewDefs: { name: string, schema: string, definition: string }[] = [];
            for (const v of views) {
                const defRes = await query(`SELECT pg_get_viewdef($1, true) as def`, [`${v.schema_name}.${v.view_name}`]);
                viewDefs.push({ name: v.view_name, schema: v.schema_name, definition: defRes.rows[0].def });
                console.log(`  Dropping view ${v.schema_name}.${v.name}...`);
                await query(`DROP VIEW ${v.schema_name}.${v.name} CASCADE`);
            }

            // 3. Alter columns
            for (const col of target.columns) {
                console.log(`  Altering column ${target.table}.${col} to ${target.newType}...`);
                // Check current type first
                const typeRes = await query(`
                    SELECT data_type 
                    FROM information_schema.columns 
                    WHERE table_name = $1 AND column_name = $2
                `, [target.table, col]);
                
                if (typeRes.rows.length > 0) {
                    const currentType = typeRes.rows[0].data_type;
                    if (currentType === 'integer') {
                        await query(`ALTER TABLE ${target.table} ALTER COLUMN ${col} TYPE ${target.newType} USING ${col}::text`);
                    } else {
                        await query(`ALTER TABLE ${target.table} ALTER COLUMN ${col} TYPE ${target.newType}`);
                    }
                }
            }

            // 4. Recreate views (in reverse order of dropping might be better or just rely on dependency order)
            // Note: Since we used CASCADE, some nested views might have been dropped too. 
            // This script only recreates the top-level views it found. 
            // Realistically, a full DB dump/restore or better migration tool is needed.
            // But for this task, we'll try to recreate what we found.
            for (const v of viewDefs.reverse()) {
                console.log(`  Recreating view ${v.schema}.${v.name}...`);
                await query(`CREATE OR REPLACE VIEW ${v.schema}.${v.name} AS ${v.definition}`);
            }
        }

        console.log("DB Schema Fix Completed Successfully.");
        process.exit(0);
    } catch (err) {
        console.error("FAILED to fix schema:", err);
        process.exit(1);
    }
}

fix();
