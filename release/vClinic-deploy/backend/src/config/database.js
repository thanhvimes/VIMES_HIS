// ==================== DATABASE CONNECTION ====================
// File: backend/src/config/database.js

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const SecurityUtils = require('../utils/security');

// Debug: Log env variables (SECURE: Don't log passwords)
console.log('📝 DB Config Initializing:', {
    user: process.env.DB_USER ? (SecurityUtils.isEncrypted(process.env.DB_USER) ? '[ENCRYPTED]' : process.env.DB_USER) : 'Missing',
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Resolve Secrets (Decrypt if necessary)
const dbUser = SecurityUtils.resolveSecret(process.env.DB_USER);
const dbPassword = SecurityUtils.resolveSecret(process.env.DB_PASSWORD);

// Build connection string
const connectionString = process.env.DATABASE_URL ||
    `postgresql://${dbUser}:${dbPassword}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

// Tạo connection pool
const pool = new Pool({
    connectionString,
    max: 20, // Số connection tối đa
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
    console.log(`📊 Database: ${process.env.DB_NAME || 'Not configured'}`);
});

pool.on('error', (err) => {
    console.error('❌ Unexpected error on idle client', err);
    process.exit(-1);
});

// Helper function để query
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
};

// Helper function để transaction
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    pool,
    query,
    transaction
};
