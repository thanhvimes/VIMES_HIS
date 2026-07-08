import { pool } from '../src/config/database';

async function check() {
  try {
    // 1. Get CREATE TABLE statement (or foreign keys / columns details)
    const columnsRes = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'hms_schedule_exam'
      ORDER BY ordinal_position;
    `);
    console.log("COLUMNS OF hms_schedule_exam:");
    columnsRes.rows.forEach(r => {
      console.log(`- ${r.column_name}: ${r.data_type} (nullable: ${r.is_nullable})`);
    });

    // 2. Check foreign keys
    const fkRes = await pool.query(`
      SELECT
          tc.table_schema, 
          tc.constraint_name, 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_schema AS foreign_table_schema,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='hms_schedule_exam';
    `);
    console.log("\nFOREIGN KEYS OF hms_schedule_exam:");
    fkRes.rows.forEach(r => {
      console.log(`- ${r.column_name} references ${r.foreign_table_name}(${r.foreign_column_name}) (Constraint: ${r.constraint_name})`);
    });

    // 3. Check unique keys or primary key
    const pkRes = await pool.query(`
      SELECT tc.constraint_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'hms_schedule_exam' AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE');
    `);
    console.log("\nCONSTRAINTS OF hms_schedule_exam:");
    pkRes.rows.forEach(r => {
      console.log(`- ${r.constraint_name}: ${r.column_name}`);
    });

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

check();
