/**
 * Script: deploy-migration.js
 * Mục đích: Chạy một file SQL migration vào PostgreSQL
 * Cách dùng: node scripts/deploy-migration.js <tên-file-migration>
 *
 * Ví dụ:
 *   node scripts/deploy-migration.js 009_create_hms_register_procedure.sql
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// --- Resolve password (giống database.js) ---
const SecurityUtils = require('../src/utils/security');
const dbUser = SecurityUtils.resolveSecret(process.env.DB_USER);
const dbPassword = SecurityUtils.resolveSecret(process.env.DB_PASSWORD);

const pool = new Pool({
    user: dbUser,
    password: dbPassword,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function run() {
    const fileName = process.argv[2];
    if (!fileName) {
        console.error('❌  Cần truyền tên file migration.\n   Ví dụ: node scripts/deploy-migration.js 009_create_hms_register_procedure.sql');
        process.exit(1);
    }

    const filePath = path.join(__dirname, '../migrations', fileName);
    if (!fs.existsSync(filePath)) {
        console.error(`❌  Không tìm thấy file: ${filePath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const client = await pool.connect();

    try {
        console.log(`\n🚀  Đang chạy migration: ${fileName}`);
        console.log(`📡  Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}:${process.env.DB_PORT}\n`);

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log(`✅  Migration "${fileName}" đã được deploy thành công!`);

        // Kiểm tra function tồn tại sau khi deploy
        if (fileName.includes('009')) {
            const checkRes = await client.query(`
                SELECT routine_name, routine_type
                FROM information_schema.routines
                WHERE routine_name = 'hms_register_patient_v2'
                  AND routine_schema = 'public'
            `);
            if (checkRes.rows.length > 0) {
                console.log(`\n✅  Xác nhận: Function "hms_register_patient_v2" đã tồn tại trong DB.`);
            } else {
                console.warn(`\n⚠️  CẢNH BÁO: Không tìm thấy function trong DB sau khi chạy migration. Kiểm tra lại SQL.`);
            }
        }
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(`\n❌  Lỗi khi chạy migration "${fileName}":\n`, err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
