// ==================== DATABASE CONNECTION ====================
// File: backend/src/config/database.ts

import { Pool, PoolClient, QueryResult } from 'pg';
import path from 'path';
import dotenv from 'dotenv';
import SecurityUtils from '../utils/security';

// Load .env from root
dotenv.config({ path: path.join(__dirname, '../../.env') });

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
    console.error('❌ Unexpected DB error on idle client', err);
    process.exit(-1);
});

/**
 * Executes a database query within a context of user and ip (for auditing)
 */
export const queryWithContext = async (
    text: string, 
    params: any[] | undefined, 
    context: { userId: string | number, ip?: string, module?: string }
): Promise<QueryResult> => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // Set session local settings for the trigger to pick up
        await client.query("SELECT set_config('app.current_user_id', $1, true)", [String(context.userId)]);
        if (context.ip) await client.query("SELECT set_config('app.client_ip', $1, true)", [context.ip]);
        if (context.module) await client.query("SELECT set_config('app.context_module', $1, true)", [context.module]);
        
        const res = await client.query(text, params);
        await client.query('COMMIT');
        return res;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Database context query error:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Standard query for general use
 */
export const query = async (text: string, params?: any[]): Promise<QueryResult> => {
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

export default {
    pool,
    query,
    queryWithContext,
    hmsQuery,
    transaction
};
