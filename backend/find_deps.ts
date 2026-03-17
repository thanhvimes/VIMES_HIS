
import { query } from './src/config/database';

async function findDeps() {
    try {
        const res = await query(`
            SELECT DISTINCT v.relname AS view_name
            FROM pg_depend d
            JOIN pg_rewrite r ON r.oid = d.objid
            JOIN pg_class v ON v.oid = r.ev_class
            JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
            JOIN pg_class t ON t.oid = d.refobjid
            WHERE t.relname = 'hms_patient'
            AND a.attname IN ('hp_surname', 'hp_midname', 'hp_firstname')
        `);
        console.log("Dependent views:", res.rows.map(r => r.view_name));

        const res2 = await query(`
            SELECT DISTINCT v.relname AS view_name
            FROM pg_depend d
            JOIN pg_rewrite r ON r.oid = d.objid
            JOIN pg_class v ON v.oid = r.ev_class
            JOIN pg_attribute a ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
            JOIN pg_class t ON t.oid = d.refobjid
            WHERE t.relname = 'hms_doc'
            AND a.attname = 'hd_object'
        `);
        console.log("Dependent views (doc):", res2.rows.map(r => r.view_name));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
findDeps();
