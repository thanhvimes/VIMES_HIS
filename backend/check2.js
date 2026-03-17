const pool = require('./src/config/database');
const fs = require('fs');
async function run() {
    const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'hms_card'`);
    fs.writeFileSync('check_output.txt', JSON.stringify(res.rows, null, 2));
    process.exit(0);
}
run();
