import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

const envPath = fs.existsSync(path.join(__dirname, '../.env'))
    ? path.join(__dirname, '../.env')
    : fs.existsSync(path.join(__dirname, '../../.env'))
        ? path.join(__dirname, '../../.env')
        : fs.existsSync(path.join(process.cwd(), 'backend', '.env'))
            ? path.join(process.cwd(), 'backend', '.env')
            : null;

if (envPath) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

export function requireEnv(name: string): string {
    const value = process.env[name]?.trim();
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

export function validateEnvironment(): void {
    const missing = ['JWT_SECRET', 'VIMES_SECURITY_KEY'].filter(name => !process.env[name]?.trim());
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
    const hasDatabaseParts = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
        .every(name => Boolean(process.env[name]?.trim()));
    if (!hasDatabaseUrl && !hasDatabaseParts) missing.push('DATABASE_URL or complete DB_* settings');
    if (missing.length) throw new Error(`Missing required environment configuration: ${missing.join(', ')}`);
    if ((process.env.JWT_SECRET?.length || 0) < 32 || (process.env.VIMES_SECURITY_KEY?.length || 0) < 32) {
        throw new Error('JWT_SECRET and VIMES_SECURITY_KEY must each contain at least 32 characters');
    }
}

export const env = {
    port: Number(process.env.PORT || 3000),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,https://localhost,capacitor://localhost')
        .split(',').map(v => v.trim().replace(/\/$/, '')).filter(Boolean),
    bodyLimit: process.env.REQUEST_BODY_LIMIT || '2mb',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h'
};
