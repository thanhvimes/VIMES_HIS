import { pool } from '../config/database';

async function main() {
  try {
    console.log("--- QUERYING USERS ---");
    const users = await pool.query('SELECT su_userid, su_name, su_xorg_id FROM sys_user LIMIT 10');
    console.log("Users:", JSON.stringify(users.rows, null, 2));

    console.log("\n--- QUERYING SURGERY TABLES ---");
    const tables = await pool.query('SELECT hst_idx, hst_name, hst_xorg_id FROM hms_surgery_table LIMIT 20');
    console.log("Surgery Tables:", JSON.stringify(tables.rows, null, 2));

  } catch (error) {
    console.error("Database query failed:", error);
  } finally {
    await pool.end();
  }
}

main();
