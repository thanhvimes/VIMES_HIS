const db = require('./src/config/database');
const fs = require('fs');

async function checkCols(table) {
    const res = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [table]);
    let out = `\n### ${table} ###\n`;
    out += res.rows.map(r => r.column_name).sort().join(', ');
    return out;
}

(async () => {
    let output = '';
    output += await checkCols('hms_patient');
    output += await checkCols('hms_doc');
    output += await checkCols('hms_card');
    fs.writeFileSync('schema_output.txt', output, 'utf8');
    process.exit(0);
})();
