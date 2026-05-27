import { query } from '../src/config/database';

async function checkCompanies() {
    try {
        console.log('Querying all rows in sys_company...');
        const res = await query('SELECT * FROM sys_company');
        console.log(`Total rows: ${res.rows.length}`);
        console.log(JSON.stringify(res.rows, null, 2));

        console.log('\nQuerying tables related to companies or branch/facility...');
        const tablesRes = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name LIKE '%company%' OR table_name LIKE '%branch%' OR table_name LIKE '%facility%'
        `);
        console.log('Related tables:');
        tablesRes.rows.forEach((r: any) => console.log(`- ${r.table_name}`));
    } catch (e: any) {
        console.error('Error:', e);
    } finally {
        process.exit(0);
    }
}
checkCompanies();
