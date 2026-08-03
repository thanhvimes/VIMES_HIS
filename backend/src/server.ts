// ==================== MAIN SERVER ====================
// File: backend/src/server.ts

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

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
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files (e.g. PACS files)
const uploadsPath = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));


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
import queueRoutes from './routes/queue.routes';
import qmsRoutes from './routes/qms.routes';
import pacsRoutes from './routes/pacs.routes';


// API Health check
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'VIMES Backend API (TypeScript)',
        version: '1.0.0'
    });
});

app.post('/api/debug-log', (req: Request, res: Response) => {
    const { message } = req.body;
    console.log(`[FRONTEND DEBUG] ${new Date().toISOString()} - ${message}`);
    res.json({ success: true });
});

// Register API routes

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
app.use('/api/v1', queueRoutes);
app.use('/api', qmsRoutes);
app.use('/api', pacsRoutes);

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('❌ Server Error:', err);
    res.status(err.status || 500).json({
        error: 'Internal server error',
        message: err.message || 'Unknown error'
    });
});

// Serve static files from frontend build (production mode)
const frontendPath = path.join(__dirname, '../../dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    console.log('📂 Serving frontend from:', frontendPath);

    // SPA fallback
    app.get('*', (req: Request, res: Response) => {
        if (!req.path.startsWith('/api/')) {
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
        
        // Run SQL migrations via the new Migration Runner
        await migrationService.runMigrations();

        // Specific Node.js data seeding logic (cannot be done via SQL easily due to bcrypt encryption)
        const SecurityUtils = (await import('./utils/security')).default;
        const encryptedPass = SecurityUtils.encrypt('Abc@1234');
        const checkSettings = await query(`SELECT id FROM health_check_settings LIMIT 1`);
        if (checkSettings.rows.length === 0) {
            await query(`
                INSERT INTO health_check_settings (
                    vneid_url, vneid_username, vneid_password, ma_cskcb, ma_gtin_cskcb, auto_sync_enabled, auto_sync_interval
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                'https://api-sandbox.emrhub.vn/api',
                '8934285008135_api',
                encryptedPass,
                '8934285008135',
                '8934285008135',
                true,
                15
            ]);
            console.log('✅ Health check settings initialized with credentials.');
        }

        console.log('✅ Migrations applied successfully');
        console.log('📊 Server started successfully');

        // Verify health_check_service_mappings table
        try {
            const checkRes = await query(`SELECT COUNT(*) FROM health_check_service_mappings`);
            console.log(`📊 health_check_service_mappings table has ${checkRes.rows[0].count} rows.`);
            const verifyFilePath = require('path').join(__dirname, '../db_check_result.txt');
            const fs = require('fs');
            if (fs.existsSync(verifyFilePath)) {
                fs.unlinkSync(verifyFilePath);
            }
        } catch (diagErr: any) {
            console.error('⚠️ Failed to query health_check_service_mappings:', diagErr.message);
        }

    } catch (e: any) {
        console.error('⚠️  Migration runner error:', e);
        throw e;
    }
}

// Start server
async function startServer() {
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

startServer();
export default app;

