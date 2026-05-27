import { query } from '../src/config/database';

async function checkHmsConfig() {
    try {
        console.log('Querying schema of hms_config...');
        const schemaRes = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'hms_config'
        `);
        schemaRes.rows.forEach((r: any) => console.log(`- ${r.column_name} (${r.data_type})`));

        console.log('\nQuerying data in hms_config...');
        const dataRes = await query(`
            SELECT * FROM hms_config LIMIT 1
        `);
        console.log('Data in hms_config:');
        console.log(JSON.stringify(dataRes.rows, null, 2));
    } catch (e) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}

checkHmsConfig();
