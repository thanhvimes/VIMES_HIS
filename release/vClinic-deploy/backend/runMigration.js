/**
 * Migration Runner Script
 * Run this script to apply database migrations
 * Usage: node runMigration.js 006_update_cccd_authentication.sql
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const SecurityUtils = require('./src/utils/security').default;

// Decrypt credentials if encrypted
const dbUser = SecurityUtils.resolveSecret(process.env.DB_USER);
const dbPassword = SecurityUtils.resolveSecret(process.env.DB_PASSWORD);

// Database configuration
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'vimes_jsc',
    user: dbUser,
    password: dbPassword
});

async function runMigration(migrationFile) {
    const client = await pool.connect();

    try {
        const migrationPath = path.join(__dirname, 'migrations', migrationFile);

        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Migration file not found: ${migrationPath}`);
            process.exit(1);
        }

        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log(`🔄 Running migration: ${migrationFile}`);
        console.log('━'.repeat(60));

        await client.query('BEGIN');
        await client.query(sql);
        await client.query('COMMIT');

        console.log('━'.repeat(60));
        console.log(`✅ Migration completed successfully: ${migrationFile}`);

        // Run verification queries
        console.log('\n📊 Verification Results:');
        const totalProfiles = await client.query('SELECT COUNT(*) as total FROM portal_patient_profiles');
        const withCCCD = await client.query('SELECT COUNT(*) as count FROM portal_patient_profiles WHERE id_card IS NOT NULL');
        const withoutCCCD = await client.query('SELECT COUNT(*) as count FROM portal_patient_profiles WHERE id_card IS NULL');

        console.log(`   Total profiles: ${totalProfiles.rows[0].total}`);
        console.log(`   Profiles with CCCD: ${withCCCD.rows[0].count}`);
        console.log(`   Profiles without CCCD: ${withoutCCCD.rows[0].count}`);

        if (parseInt(withoutCCCD.rows[0].count) > 0) {
            console.log('\n⚠️  WARNING: Some profiles are missing CCCD data.');
            console.log('   These profiles need manual update before setting id_card to NOT NULL.');
        }

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
    console.error('Usage: node runMigration.js <migration_file.sql>');
    console.error('Example: node runMigration.js 006_update_cccd_authentication.sql');
    process.exit(1);
}

runMigration(migrationFile);
