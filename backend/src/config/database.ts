// ==================== DATABASE CONNECTION ====================
// File: backend/src/config/database.ts

import { Pool, PoolClient, QueryResult } from 'pg';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import SecurityUtils from '../utils/security';

// Load .env robustly from multiple fallback locations
const envPath = fs.existsSync(path.join(__dirname, '../../.env'))
    ? path.join(__dirname, '../../.env')
    : fs.existsSync(path.join(process.cwd(), '.env'))
        ? path.join(process.cwd(), '.env')
        : fs.existsSync(path.join(process.cwd(), 'backend', '.env'))
            ? path.join(process.cwd(), 'backend', '.env')
            : null;

if (envPath) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

// Resolve DB User and Password with Security Utils
const dbUser = SecurityUtils.resolveSecret(process.env.DB_USER || '');
const dbPassword = SecurityUtils.resolveSecret(process.env.DB_PASSWORD || '');

// Debug: Log DB Initializing (Safe way)
console.log('📝 TS DB Config Initializing:', {
    user: process.env.DB_USER ? (SecurityUtils.isEncrypted(process.env.DB_USER) ? '[ENCRYPTED]' : process.env.DB_USER) : 'Missing',
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Configure Database Connection Pool
export const pool = new Pool({
    user: dbUser,
    password: dbPassword,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

// Event Handlers for Connection
pool.on('connect', () => {
    console.log('✅ TS Database: Connected successfully');
});

pool.on('error', (err: Error) => {
    console.error('❌ Unexpected DB error on idle client. Pool will auto-reconnect on next query.', err);
});

/**
 * Checks if a DB error is a retryable network/connection error or replication conflict.
 */
const isRetryableError = (error: any): boolean => {
    if (!error) return false;
    const code = String(error.code || '');
    const message = String(error.message || '').toLowerCase();
    
    const retryableCodes = [
        '40001', '08000', '08003', '08006', '08001', '08004', '57P01', '57P02', '57P03',
        'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'EPIPE'
    ];

    if (retryableCodes.includes(code)) return true;
    if (message.includes('conflict with recovery')) return true;
    if (message.includes('connection terminated')) return true;
    if (message.includes('socket hung up')) return true;
    if (message.includes('timeout')) return true;
    if (message.includes('read econnreset')) return true;

    return false;
};

let keepAliveInterval: NodeJS.Timeout | null = null;
/**
 * Starts a background keep-alive ping to ensure the DB connection stays active
 * and logs early if the database goes down.
 */
export const startKeepAlivePing = () => {
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    console.log('🔄 Starting DB Keep-Alive Ping (every 30s)...');
    keepAliveInterval = setInterval(async () => {
        try {
            await pool.query('SELECT 1 AS ping');
        } catch (error: any) {
            console.error('⚠️ DB Keep-Alive Ping Failed. Network might be down:', error.message);
        }
    }, 30000);
};

/**
 * Executes a database query within a context of user and ip (for auditing)
 */
export const queryWithContext = async (
    text: string, 
    params: any[] | undefined, 
    context: { userId: string | number, ip?: string, module?: string }
): Promise<QueryResult> => {
    const maxRetries = 5;
    let attempt = 0;
    while (true) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            // Set session local settings for the trigger to pick up
            await client.query("SELECT set_config('app.current_user_id', $1, true)", [String(context.userId)]);
            if (context.ip) await client.query("SELECT set_config('app.client_ip', $1, true)", [context.ip]);
            if (context.module) await client.query("SELECT set_config('app.context_module', $1, true)", [context.module]);
            
            const res = await client.query(text, params);
            await client.query('COMMIT');
            client.release();
            return res;
        } catch (error: any) {
            try {
                await client.query('ROLLBACK');
            } catch (rbError) {
                // Ignore rollback errors
            }
            client.release();

            attempt++;
            if (attempt < maxRetries && isRetryableError(error)) {
                const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); 
                console.warn(`⚠️ DB queryWithContext Network/Conflict Error (${error.code || error.message}). Retrying in ${retryDelay}ms... (Attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            console.error('Database context query error:', error);
            throw error;
        }
    }
};

/**
 * Standard query for general use
 */
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
    const maxRetries = 5;
    let attempt = 0;
    while (true) {
        const start = Date.now();
        try {
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            if (process.env.DEBUG_DB === 'true') {
                console.log('Executed query', { text: text.substring(0, 50) + '...', duration, rows: res.rowCount });
            }
            return res;
        } catch (error: any) {
            attempt++;
            if (attempt < maxRetries && isRetryableError(error)) {
                const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); 
                console.warn(`⚠️ DB query Network/Conflict Error (${error.code || error.message}). Retrying in ${retryDelay}ms... (Attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            console.error('Database query error:', error);
            throw error;
        }
    }
};

/**
 * Convenience method to decide which query to use
 */
export const hmsQuery = async (req: any, text: string, params?: any[]): Promise<QueryResult> => {
    if (req?.userId) {
        return queryWithContext(text, params, { 
            userId: req.userId, 
            ip: (req as any).ip || (req as any).headers?.['x-forwarded-for'] || (typeof (req as any).get === 'function' ? (req as any).get('x-forwarded-for') : (req as any).header?.('x-forwarded-for')) || (req as any).connection?.remoteAddress,
            module: req.baseUrl 
        });
    }
    return query(text, params);
};

/**
 * Helper function for transactional operations.
 * @param callback Async function that uses the client for transaction steps.
 * @returns Result of the callback function.
 */
export const transaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
    const maxRetries = 5;
    let attempt = 0;
    while (true) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            client.release();
            return result;
        } catch (error: any) {
            try {
                await client.query('ROLLBACK');
            } catch (rbError) {
                // Ignore rollback errors
            }
            client.release();

            attempt++;
            if (attempt < maxRetries && isRetryableError(error)) {
                const retryDelay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); 
                console.warn(`⚠️ DB transaction Network/Conflict Error (${error.code || error.message}). Retrying in ${retryDelay}ms... (Attempt ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                continue;
            }
            throw error;
        }
    }
};

export default {
    pool,
    query,
    queryWithContext,
    hmsQuery,
    transaction,
    startKeepAlivePing
};
