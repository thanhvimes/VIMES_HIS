import { pool } from '../src/config/database';

async function inspect() {
    try {
        console.log('🔍 Inspecting qms_patient schema in DB...');
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'qms_patient'
            ORDER BY ordinal_position;
        `);
        console.log('📋 Columns in qms_patient:');
        console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n'));
    } catch (e) {
        console.error('❌ Error inspecting schema:', e);
    } finally {
        await pool.end();
    }
}

inspect();
