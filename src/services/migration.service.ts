import { query } from '../config/database';
import fs from 'fs';
import path from 'path';

class MigrationService {
    private getMigrationsDir(): string {
        const candidates = [
            path.join(__dirname, '../../migrations'),
            path.join(__dirname, '../migrations'),
            path.join(process.cwd(), 'migrations'),
            path.join(process.cwd(), 'backend/migrations')
        ];
        for (const cand of candidates) {
            if (fs.existsSync(cand)) {
                return cand;
            }
        }
        return candidates[0];
    }

    /**
     * Tự động khởi tạo bảng sys_migrations nếu chưa tồn tại
     */
    private async ensureMigrationTable(): Promise<void> {
        await query(`
            CREATE TABLE IF NOT EXISTS sys_migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    /**
     * Lấy danh sách các file migration đã chạy từ Database
     */
    private async getExecutedMigrations(): Promise<string[]> {
        const result = await query(`
            SELECT filename FROM sys_migrations ORDER BY id ASC
        `);
        return result.rows.map(row => row.filename);
    }

    /**
     * Đọc và chạy các file migration mới
     */
    public async runMigrations(): Promise<void> {
        try {
            console.log('🔄 Đang kiểm tra Database Migrations...');
            await query('SET search_path TO public, oracle');
            await this.ensureMigrationTable();

            const migrationsDir = this.getMigrationsDir();

            // Nếu không có thư mục migrations thì bỏ qua
            if (!fs.existsSync(migrationsDir)) {
                console.log('⚠️ Không tìm thấy thư mục migrations:', migrationsDir);
                return;
            }

            // Đọc tất cả các file .sql hợp lệ (bắt đầu bằng số, vd: 001_..., 037_...)
            const files = fs.readdirSync(migrationsDir)
                .filter(f => /^\d+.*\.sql$/i.test(f))
                .sort((a, b) => {
                    const numA = parseInt(a.match(/^(\d+)/)?.[1] || '0', 10);
                    const numB = parseInt(b.match(/^(\d+)/)?.[1] || '0', 10);
                    return numA - numB;
                });

            if (files.length === 0) {
                console.log('✅ Không có file migration hợp lệ nào.');
                return;
            }

            const executedMigrations = await this.getExecutedMigrations();
            const pendingMigrations = files.filter(f => !executedMigrations.includes(f));

            if (pendingMigrations.length === 0) {
                console.log('✅ Database đã được cập nhật bản mới nhất. (No new migrations to apply)');
                return;
            }

            console.log(`🚀 Tìm thấy ${pendingMigrations.length} file migration cần chạy...`);

            for (const file of pendingMigrations) {
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf-8');

                console.log(`⏳ Đang áp dụng migration: ${file}...`);
                
                // Bắt đầu Transaction cho mỗi file
                await query('BEGIN');
                try {
                    await query(sql);
                    
                    // Ghi nhận file đã chạy vào lịch sử
                    await query(
                        `INSERT INTO sys_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING`,
                        [file]
                    );
                    
                    await query('COMMIT');
                    console.log(`✅ Hoàn tất migration: ${file}`);
                } catch (error: any) {
                    await query('ROLLBACK');
                    
                    // Kiểm tra lỗi cấu trúc/cột/bảng đã tồn tại sẵn trong DB (Idempotent Recovery)
                    const isAlreadyExistsError = 
                        error.code === '42701' || // duplicate_column
                        error.code === '42P07' || // duplicate_table / duplicate_relation
                        error.code === '42710' || // duplicate_object
                        (error.message && error.message.toLowerCase().includes('already exists'));

                    if (isAlreadyExistsError) {
                        console.log(`⚠️ Migration ${file}: Cấu trúc/cột/bảng đã tồn tại sẵn trong DB, tự động ghi nhận vào sys_migrations...`);
                        await query(
                            `INSERT INTO sys_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING`,
                            [file]
                        );
                        console.log(`✅ Đã đánh dấu ${file} là đã hoàn tất.`);
                    } else {
                        console.error(`❌ Lỗi khi chạy migration ${file}:`, error.message);
                        console.error('⛔ Đã Rollback. Dừng quá trình Migration!');
                        throw error;
                    }
                }
            }

            console.log('🎉 Tất cả migrations đã chạy thành công!');
        } catch (error) {
            console.error('💥 Migration runner failed:', error);
            throw error;
        }
    }
}

export default new MigrationService();
