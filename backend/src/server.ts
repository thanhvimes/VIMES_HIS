// ==================== MAIN SERVER ====================
// File: backend/src/server.ts

// Polyfill Web Streams API for Node.js < 18 compatibility (@google/genai, fetch, etc.)
if (typeof (globalThis as any).ReadableStream === 'undefined') {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const streamWeb = require('node:stream/web');
        if (streamWeb) {
            if (streamWeb.ReadableStream) (globalThis as any).ReadableStream = streamWeb.ReadableStream;
            if (streamWeb.WritableStream) (globalThis as any).WritableStream = streamWeb.WritableStream;
            if (streamWeb.TransformStream) (globalThis as any).TransformStream = streamWeb.TransformStream;
        }
    } catch {
        // Fallback gracefully if node:stream/web module is missing
    }
}

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { env, validateEnvironment } from './config/env';
import { apiRateLimit, defaultApiAuthentication, securityHeaders } from './middleware/securityMiddleware';
import templateStudioRoutes from './routes/template-studio.routes';

// ==================== GLOBAL ERROR HANDLERS ====================
process.on('uncaughtException', (error) => {
    console.error('🚨 [CRITICAL] Uncaught Exception:', error);
    // Keep running to allow auto-reconnects and retry logics to work.
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 [CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});
// ===============================================================

// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', true); // Trust first proxy for IP tracking
const PORT = env.port;

export function isAllowedCorsOrigin(origin?: string): boolean {
    if (!origin) return true;
    const normalizedOrigin = origin.replace(/\/$/, '');
    if (env.corsOrigins.includes('*') || env.corsOrigins.includes(normalizedOrigin)) return true;
    try {
        const url = new URL(normalizedOrigin);
        if (['http:', 'https:'].includes(url.protocol)) {
            const host = url.hostname;
            if (['localhost', '127.0.0.1', '::1'].includes(host)) return true;
            if (/^(10|172\.(1[6-9]|2[0-9]|3[0-1])|192\.168)\./.test(host)) return true;
        }
    } catch {
        return false;
    }
    return false;
}

// Middleware
app.disable('x-powered-by');
app.use(securityHeaders);
app.use(cors({
    origin(origin, callback) {
        if (isAllowedCorsOrigin(origin)) return callback(null, true);
        const error: any = new Error(`Origin is not allowed by CORS: ${origin}`);
        error.status = 403;
        error.code = 'CORS_ORIGIN_DENIED';
        callback(error);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: env.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: env.bodyLimit }));

// Serve uploaded files (e.g. PACS files)
const uploadsPath = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', defaultApiAuthentication, express.static(uploadsPath, { dotfiles: 'deny', index: false }));


// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const originalJson = res.json;
    let responseBody: any = null;

    res.json = function(body) {
        responseBody = body;
        return originalJson.apply(this, arguments as any);
    };

    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLine = `${new Date().toISOString()} - ${req.method} ${req.originalUrl || req.url} - Status: ${res.statusCode} - Duration: ${duration}ms\n`;
        
        let extraInfo = '';
        if (req.path.includes('/catalogs') || req.path.includes('/reception/catalogs')) {
            if (res.statusCode >= 400) {
                extraInfo += `  Error Body: ${JSON.stringify(responseBody)}\n`;
            } else if (responseBody) {
                const count = Array.isArray(responseBody) ? responseBody.length : 'not an array';
                extraInfo += `  Response Count: ${count}\n`;
            }
        }
        
        // Log request info directly to console to avoid writing to db_debug.log (stops Vite HMR loops)
        if (extraInfo) {
            console.log(extraInfo.trim());
        }
    });

    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Import routes (All migrated to TS)
import authRoutes from './routes/auth.routes';
import bookingRoutes from './routes/booking.routes';
import roomRoutes from './routes/room.routes';
import scheduleRoutes from './routes/schedule.routes';
import settingsRoutes from './routes/settings.routes';
import smsTemplateRoutes from './routes/sms-template.routes';
import receptionRoutes from './routes/reception.routes';
import portalRoutes from './routes/portal.routes';
import catalogRoutes from './routes/catalog.routes';
import commandCenterRoutes from './routes/command_center.routes';
import consultationRoutes from './routes/consultation.routes';
import insuranceRoutes from './routes/insurance.routes';
import healthCheckRoutes from './routes/health-check.routes';
import auditRoutes from './routes/audit.routes';
import qmsRoutes from './routes/qms.routes';
import pacsRoutes from './routes/pacs.routes';
import aiRoutes from './routes/ai.routes';
import documentRoutes from './routes/document.routes';


const SERVER_BUILD_TIME = Date.now();

// API Health check & Version check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'VIMES Backend API (TypeScript)',
        version: '1.0.0',
        buildTime: SERVER_BUILD_TIME
    });
});

app.get('/api/v1/version', (req: Request, res: Response) => {
    res.json({
        success: true,
        version: '1.0.0',
        buildTime: SERVER_BUILD_TIME
    });
});

// Register API routes

app.use('/api', apiRateLimit);
app.use('/api', defaultApiAuthentication);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/booking', bookingRoutes);
app.use('/api/v1', roomRoutes);
app.use('/api/v1/schedule', scheduleRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/sms-templates', smsTemplateRoutes);
app.use('/api/v1/reception', receptionRoutes);
app.use('/api/v1/portal', portalRoutes);
app.use('/api/v1/catalogs', catalogRoutes);
app.use('/api/v1/command-center', commandCenterRoutes);
app.use('/api/v1/consultation', consultationRoutes);
app.use('/api/v1/insurance', insuranceRoutes);
app.use('/api/v1/health-check-sync', healthCheckRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api', qmsRoutes);
app.use('/api', pacsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/template-studio', templateStudioRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code === 'CORS_ORIGIN_DENIED') {
        console.warn(`[CORS] Rejected origin ${req.get('origin') || 'unknown'}`);
        return res.status(403).json({ error: 'CORS origin denied' });
    }
    console.error('❌ Server Error:', err);
    res.status(err.status || 500).json({
        error: 'Internal server error',
        message: err.message || 'Unknown error'
    });
});

// Serve static files from frontend build (production mode)
const frontendPath = path.join(__dirname, '../../dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath, {
        setHeaders: (res: Response, filePath: string) => {
            if (filePath.endsWith('index.html')) {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            } else {
                res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            }
        }
    }));
    console.log('📂 Serving frontend from:', frontendPath);

    // SPA fallback
    app.get('*', (req: Request, res: Response) => {
        if (!req.path.startsWith('/api/')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            res.sendFile(path.join(frontendPath, 'index.html'));
        } else {
            res.status(404).json({ error: 'API route not found' });
        }
    });
}

import { runDbDiagnostics } from './utils/debugDb';
import { startKeepAlivePing } from './config/database';

// Start automated jobs
import migrationService from './services/migration.service';
import scheduleService from './services/schedule.service';
import { loadBHXHConfig } from './config/bhxh';
import { loadHealthCheckSettings } from './config/health-check-settings';
import { startHealthCheckSyncWorker } from './services/health-check-sync.service';

async function applyPendingMigrations() {
    try {
        const { query } = await import('./config/database');
        
        // Only auto-run migrations if AUTO_RUN_MIGRATIONS=true in .env
        if (process.env.AUTO_RUN_MIGRATIONS === 'true') {
            console.log('🔄 AUTO_RUN_MIGRATIONS=true: Checking for pending database migrations...');
            await migrationService.runMigrations();
            console.log('✅ Migrations applied successfully');
        } else {
            console.log('ℹ️ Auto DB migrations on startup is DISABLED (Set AUTO_RUN_MIGRATIONS=true in .env to enable or run "npm run migrate").');
        }

        // Verify health_check_service_mappings table
        try {
            const checkRes = await query(`SELECT COUNT(*) FROM health_check_service_mappings`);
            console.log(`📊 health_check_service_mappings table has ${checkRes.rows[0].count} rows.`);
        } catch (diagErr: any) {
            // Table may not exist yet if migrations have not been executed
        }

    } catch (e: any) {
        console.error('⚠️ Migration runner encountered an error:', e.message);
        // Do not crash production server on non-fatal migration check errors
    }
}

// Start server
async function startServer() {
    validateEnvironment();
    console.log('='.repeat(50));
    console.log(`🚀 Starting VIMES Backend initialization...`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: ${process.env.DB_NAME || 'Not configured'}`);
    console.log('='.repeat(50));

    // 1. Apply pending DB migrations first (BLOCKING)
    await applyPendingMigrations();

    // 2. Start listening for HTTP requests ONLY AFTER DB is ready
    app.listen(PORT, async () => {
        console.log(`🌐 HTTP Server is now listening on port ${PORT}`);
        
        // 3. Load background workers and memory configs
        scheduleService.setupAutomatedJobs();
        loadBHXHConfig(); // Tải cấu hình BHXH vào memory
        await loadHealthCheckSettings(); // Tải cấu hình VNeID KSK vào memory
        startHealthCheckSyncWorker(); // Khởi chạy auto sync VNeID chạy ngầm
        startKeepAlivePing(); // Khởi chạy Ping DB định kỳ
    });
}

if (require.main === module) {
    startServer().catch(error => {
        console.error('Server failed to start:', error instanceof Error ? error.message : error);
        process.exit(1);
    });
}
export default app;
