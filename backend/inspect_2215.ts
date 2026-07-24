import { query } from './src/config/database';

async function inspectDoc2215() {
    const res = await query(`SELECT xml_data FROM health_check_masters WHERE id = 2215`);
    console.log("=== XML DATA FOR DOC 2215 ===");
    console.log(res.rows[0].xml_data);
    process.exit(0);
}

inspectDoc2215();
