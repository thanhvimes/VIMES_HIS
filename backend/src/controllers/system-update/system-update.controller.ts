import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { exec } from 'child_process';
import axios from 'axios';
import migrationService from '../../services/migration.service';
import { query } from '../../config/database';

interface UpdateManifest {
    version: string;
    buildDate?: string;
    releaseDate?: string;
    changelog?: string[] | string;
    downloadUrl: string;
    sha256?: string;
    minDbVersion?: number;
    requiredDbMigration?: boolean;
}

class SystemUpdateController {
    private getAppRootDir(): string {
        // Find the root of the project where package.json and dist/ live
        const candidates = [
            path.resolve(process.cwd(), '..'),
            process.cwd(),
            path.resolve(__dirname, '../../..'),
            path.resolve(__dirname, '../../../..')
        ];
        for (const dir of candidates) {
            if (fs.existsSync(path.join(dir, 'package.json')) && (fs.existsSync(path.join(dir, 'backend')) || fs.existsSync(path.join(dir, 'dist')))) {
                return dir;
            }
        }
        return process.cwd();
    }

    private getCurrentVersion(): string {
        try {
            const rootDir = this.getAppRootDir();
            const pkgPath = path.join(rootDir, 'package.json');
            if (fs.existsSync(pkgPath)) {
                const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
                return pkg.version || '1.0.0';
            }
            const backendPkgPath = path.join(rootDir, 'backend', 'package.json');
            if (fs.existsSync(backendPkgPath)) {
                const bPkg = JSON.parse(fs.readFileSync(backendPkgPath, 'utf8'));
                return bPkg.version || '1.0.0';
            }
        } catch (err) {
            console.warn('[SystemUpdate] Failed to read version from package.json:', err);
        }
        return '1.0.0';
    }

    private getUpdateServerUrl(): string {
        return process.env.UPDATE_SERVER_URL || 'https://raw.githubusercontent.com/thanhvimes/VIMES_HIS/main/releases/version.json';
    }

    private compareVersions(v1: string, v2: string): number {
        const cleanV1 = v1.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
        const cleanV2 = v2.replace(/^v/, '').split('.').map(n => parseInt(n, 10) || 0);
        const len = Math.max(cleanV1.length, cleanV2.length);
        for (let i = 0; i < len; i++) {
            const num1 = cleanV1[i] || 0;
            const num2 = cleanV2[i] || 0;
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        return 0;
    }

    private async ensureUpdateHistoryTable(): Promise<void> {
        try {
            await query(`
                CREATE TABLE IF NOT EXISTS sys_system_updates (
                    id SERIAL PRIMARY KEY,
                    version VARCHAR(50) NOT NULL,
                    source_type VARCHAR(20) DEFAULT 'OTA',
                    download_url TEXT,
                    backup_dir TEXT,
                    status VARCHAR(20) DEFAULT 'SUCCESS',
                    error_message TEXT,
                    changelog TEXT,
                    executed_by VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
        } catch (err) {
            console.warn('[SystemUpdate] Could not initialize sys_system_updates table:', err);
        }
    }

    /**
     * 1. GET /api/v1/system-update/info
     * Lấy thông tin hệ thống và phiên bản hiện tại
     */
    public getSystemInfo = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const currentVersion = this.getCurrentVersion();
            const rootDir = this.getAppRootDir();
            const osInfo = {
                platform: process.platform,
                arch: process.arch,
                nodeVersion: process.version,
                uptime: process.uptime(),
                rootDir: rootDir
            };

            res.json({
                success: true,
                currentVersion,
                systemName: 'VIMES HIS - Core Hospital Information System',
                updateServerUrl: this.getUpdateServerUrl(),
                os: osInfo,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * 2. GET /api/v1/system-update/check
     * Kiểm tra cập nhật từ Máy chủ phát hành trung tâm (Central Release Server)
     */
    public checkUpdate = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const currentVersion = this.getCurrentVersion();
            const serverUrl = (req.query.serverUrl as string) || this.getUpdateServerUrl();

            let manifest: UpdateManifest | null = null;
            let checkError = null;

            try {
                const response = await axios.get<UpdateManifest>(serverUrl, {
                    timeout: 7000,
                    headers: { 'User-Agent': `VIMES-HIS-Updater/${currentVersion}` }
                });
                manifest = response.data;
            } catch (err: any) {
                checkError = err.message || 'Không thể kết nối đến máy chủ cập nhật';
            }

            if (!manifest || !manifest.version) {
                return res.json({
                    success: false,
                    hasUpdate: false,
                    currentVersion,
                    message: checkError || 'Không nhận được dữ liệu phiên bản từ máy chủ cập nhật.',
                    serverUrl
                });
            }

            const hasUpdate = this.compareVersions(manifest.version, currentVersion) > 0;

            res.json({
                success: true,
                hasUpdate,
                currentVersion,
                latestVersion: manifest.version,
                releaseDate: manifest.buildDate || manifest.releaseDate || new Date().toISOString(),
                changelog: Array.isArray(manifest.changelog) ? manifest.changelog : [manifest.changelog || 'Bản nâng cấp tối ưu hệ thống'],
                downloadUrl: manifest.downloadUrl,
                sha256: manifest.sha256 || '',
                requiredDbMigration: manifest.requiredDbMigration !== false,
                serverUrl
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * 3. POST /api/v1/system-update/perform-ota
     * Thực hiện cập nhật trực tuyến tự động (Tải -> Backup -> Giải nén -> Migrate DB -> Khởi động lại)
     */
    public performOtaUpdate = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await this.ensureUpdateHistoryTable();
            const { downloadUrl, version, sha256, changelog } = req.body;

            if (!downloadUrl) {
                return res.status(400).json({ success: false, message: 'Thiếu đường dẫn tải bản cập nhật (downloadUrl)' });
            }

            const targetVersion = version || 'latest';
            const rootDir = this.getAppRootDir();
            const tempDir = path.join(rootDir, 'temp_update');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }

            const downloadFilePath = path.join(tempDir, `update_${Date.now()}.tar.gz`);

            console.log(`🚀 [OTA-Update] Bắt đầu tải bản cập nhật từ: ${downloadUrl}`);
            const response = await axios({
                method: 'GET',
                url: downloadUrl,
                responseType: 'stream',
                timeout: 60000
            });

            const writer = fs.createWriteStream(downloadFilePath);
            (response.data as any).pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            console.log(`✅ [OTA-Update] Đã tải xong file cập nhật: ${downloadFilePath}`);

            // Xác thực mã băm SHA-256 (nếu được cung cấp)
            if (sha256) {
                const fileBuffer = fs.readFileSync(downloadFilePath);
                const computedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
                if (computedHash.toLowerCase() !== sha256.toLowerCase()) {
                    fs.unlinkSync(downloadFilePath);
                    return res.status(400).json({
                        success: false,
                        message: `Mã băm SHA-256 không khớp! File có thể bị lỗi trong quá trình tải. (Nhận: ${computedHash}, Kỳ vọng: ${sha256})`
                    });
                }
            }

            // Tạo thư mục sao lưu dự phòng (Backup)
            const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(rootDir, 'backups', `backup_${backupTimestamp}`);
            fs.mkdirSync(backupDir, { recursive: true });

            const distDir = path.join(rootDir, 'dist');
            const backendDistDir = path.join(rootDir, 'backend', 'dist');
            const migrationsDir = path.join(rootDir, 'backend', 'migrations');

            if (fs.existsSync(distDir)) {
                fs.cpSync(distDir, path.join(backupDir, 'dist'), { recursive: true });
            }
            if (fs.existsSync(backendDistDir)) {
                fs.cpSync(backendDistDir, path.join(backupDir, 'backend_dist'), { recursive: true });
            }
            if (fs.existsSync(migrationsDir)) {
                fs.cpSync(migrationsDir, path.join(backupDir, 'migrations'), { recursive: true });
            }

            console.log(`📦 [OTA-Update] Đã tạo bản sao lưu tại: ${backupDir}`);

            // Giải nén gói cập nhật đè vào thư mục ứng dụng
            await new Promise<void>((resolve, reject) => {
                const extractCmd = process.platform === 'win32'
                    ? `tar -xzf "${downloadFilePath}" -C "${rootDir}"`
                    : `tar -xzf "${downloadFilePath}" -C "${rootDir}"`;

                exec(extractCmd, (err, stdout, stderr) => {
                    if (err) {
                        console.error('❌ [OTA-Update] Lỗi giải nén:', stderr || err.message);
                        return reject(new Error('Lỗi giải nén gói cập nhật: ' + (stderr || err.message)));
                    }
                    console.log('✅ [OTA-Update] Giải nén thành công:', stdout);
                    resolve();
                });
            });

            // Xóa file tải tạm thời
            try { fs.unlinkSync(downloadFilePath); } catch (_) {}

            // Tự động chạy Database Migrations
            let migrationSuccess = true;
            let migrationError = null;
            try {
                console.log('🗄️ [OTA-Update] Đang chạy Database Migrations tự động...');
                await migrationService.runMigrations();
                console.log('🎉 [OTA-Update] Database Migrations hoàn tất thành công!');
            } catch (mErr: any) {
                migrationSuccess = false;
                migrationError = mErr.message;
                console.error('❌ [OTA-Update] Lỗi chạy migration:', mErr);
            }

            // Ghi nhật ký lịch sử cập nhật vào DB
            try {
                await query(
                    `INSERT INTO sys_system_updates (version, source_type, download_url, backup_dir, status, error_message, changelog, executed_by)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        targetVersion,
                        'OTA',
                        downloadUrl,
                        backupDir,
                        migrationSuccess ? 'SUCCESS' : 'WARNING_MIGRATION',
                        migrationError,
                        Array.isArray(changelog) ? changelog.join('\n') : (changelog || ''),
                        (req as any).user?.name || (req as any).user?.username || 'admin'
                    ]
                );
            } catch (dbErr) {
                console.warn('Could not record update history:', dbErr);
            }

            // Kích hoạt khởi động lại dịch vụ nếu chạy trên Linux PM2
            if (process.platform !== 'win32') {
                setTimeout(() => {
                    exec('pm2 reload all || pm2 restart all || systemctl restart vimes-his', (restartErr) => {
                        if (restartErr) {
                            console.warn('[OTA-Update] Không thể tự restart qua pm2/systemctl:', restartErr.message);
                        }
                    });
                }, 1500);
            }

            res.json({
                success: true,
                message: `Cập nhật lên phiên bản ${targetVersion} thành công! Hệ thống đang tự động khởi động lại...`,
                targetVersion,
                backupDir,
                migrationSuccess
            });
        } catch (error: any) {
            console.error('❌ [OTA-Update] Thất bại:', error);
            res.status(500).json({
                success: false,
                message: 'Quá trình cập nhật thất bại: ' + (error.message || 'Lỗi không xác định')
            });
        }
    };

    /**
     * 4. POST /api/v1/system-update/upload-package
     * Cập nhật ngoại tuyến bằng cách upload file .tar.gz hoặc .zip trực tiếp từ Web UI
     */
    public uploadOfflinePackage = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await this.ensureUpdateHistoryTable();
            const file = req.file;
            if (!file) {
                return res.status(400).json({ success: false, message: 'Vui lòng chọn tệp tin cập nhật (.tar.gz hoặc .zip)' });
            }

            const rootDir = this.getAppRootDir();
            const uploadedFilePath = file.path;

            console.log(`📦 [Offline-Update] Tiếp nhận file cập nhật: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

            // Tạo thư mục sao lưu dự phòng (Backup)
            const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(rootDir, 'backups', `backup_offline_${backupTimestamp}`);
            fs.mkdirSync(backupDir, { recursive: true });

            const distDir = path.join(rootDir, 'dist');
            const backendDistDir = path.join(rootDir, 'backend', 'dist');
            const migrationsDir = path.join(rootDir, 'backend', 'migrations');

            if (fs.existsSync(distDir)) {
                fs.cpSync(distDir, path.join(backupDir, 'dist'), { recursive: true });
            }
            if (fs.existsSync(backendDistDir)) {
                fs.cpSync(backendDistDir, path.join(backupDir, 'backend_dist'), { recursive: true });
            }
            if (fs.existsSync(migrationsDir)) {
                fs.cpSync(migrationsDir, path.join(backupDir, 'migrations'), { recursive: true });
            }

            // Giải nén file
            await new Promise<void>((resolve, reject) => {
                const isZip = file.originalname.endsWith('.zip');
                const extractCmd = isZip
                    ? `tar -xf "${uploadedFilePath}" -C "${rootDir}"`
                    : `tar -xzf "${uploadedFilePath}" -C "${rootDir}"`;

                exec(extractCmd, (err, stdout, stderr) => {
                    if (err) {
                        console.error('❌ [Offline-Update] Lỗi giải nén:', stderr || err.message);
                        return reject(new Error('Lỗi giải nén tệp cập nhật: ' + (stderr || err.message)));
                    }
                    console.log('✅ [Offline-Update] Giải nén thành công:', stdout);
                    resolve();
                });
            });

            // Xóa file upload tạm
            try { fs.unlinkSync(uploadedFilePath); } catch (_) {}

            // Chạy Database Migrations tự động
            let migrationSuccess = true;
            let migrationError = null;
            try {
                console.log('🗄️ [Offline-Update] Đang chạy Database Migrations tự động...');
                await migrationService.runMigrations();
                console.log('🎉 [Offline-Update] Database Migrations hoàn tất!');
            } catch (mErr: any) {
                migrationSuccess = false;
                migrationError = mErr.message;
                console.error('❌ [Offline-Update] Lỗi chạy migration:', mErr);
            }

            const newVersion = this.getCurrentVersion();

            // Ghi nhật ký vào DB
            try {
                await query(
                    `INSERT INTO sys_system_updates (version, source_type, download_url, backup_dir, status, error_message, changelog, executed_by)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [
                        newVersion,
                        'OFFLINE_UPLOAD',
                        file.originalname,
                        backupDir,
                        migrationSuccess ? 'SUCCESS' : 'WARNING_MIGRATION',
                        migrationError,
                        `Cập nhật ngoại tuyến từ file: ${file.originalname}`,
                        (req as any).user?.name || (req as any).user?.username || 'admin'
                    ]
                );
            } catch (dbErr) {
                console.warn('Could not record update history:', dbErr);
            }

            // Khởi động lại dịch vụ nếu trên Linux PM2
            if (process.platform !== 'win32') {
                setTimeout(() => {
                    exec('pm2 reload all || pm2 restart all || systemctl restart vimes-his', (restartErr) => {
                        if (restartErr) {
                            console.warn('[Offline-Update] Không thể tự restart qua pm2/systemctl:', restartErr.message);
                        }
                    });
                }, 1500);
            }

            res.json({
                success: true,
                message: `Cập nhật hệ thống thành công (Phiên bản: ${newVersion})! Hệ thống đang tự động khởi động lại...`,
                newVersion,
                backupDir,
                migrationSuccess
            });
        } catch (error: any) {
            console.error('❌ [Offline-Update] Thất bại:', error);
            res.status(500).json({
                success: false,
                message: 'Quá trình cập nhật ngoại tuyến thất bại: ' + (error.message || 'Lỗi không xác định')
            });
        }
    };

    /**
     * 5. GET /api/v1/system-update/history
     * Xem lịch sử các lần cập nhật hệ thống
     */
    public getUpdateHistory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await this.ensureUpdateHistoryTable();
            const result = await query(`
                SELECT id, version, source_type, download_url, backup_dir, status, error_message, changelog, executed_by, created_at
                FROM sys_system_updates
                ORDER BY created_at DESC
                LIMIT 50
            `);

            res.json({
                success: true,
                history: result.rows
            });
        } catch (error) {
            next(error);
        }
    };
}

export default new SystemUpdateController();
