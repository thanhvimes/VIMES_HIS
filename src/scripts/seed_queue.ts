
import { pool } from '../config/database';

async function seedQueueData() {
    try {
        console.log('🌱 Trình gieo mầm dữ liệu QMS đang bắt đầu (Prefix: clinic_queue_)...');

        // 1. Gieo mầm Khoa
        const depts = [
            ['KKB', 'Khoa Khám Bệnh', 'K'],
            ['CDHA', 'Chẩn Đoán Hình Ảnh', 'HA'],
            ['XN', 'Khoa Xét Nghiệm', 'XN'],
            ['PK', 'Phòng Khám Sản', 'S']
        ];

        for (const [id, name, prefix] of depts) {
            await pool.query(
                'INSERT INTO clinic_queue_departments (id, name, code_prefix) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
                [id, name, prefix]
            );
        }

        // 2. Gieo mầm Phòng
        const rooms = [
            ['KKB-P101', 'KKB', 'P.101 - Khám Nội', 'BS. Nguyễn Văn An'],
            ['KKB-P102', 'KKB', 'P.102 - Khám Ngoại', 'BS. Trần Thị Bình'],
            ['CDHA-SA1', 'CDHA', 'P.Siêu âm 1', 'BS. Lê Văn Cường'],
            ['CDHA-XQ1', 'CDHA', 'P.X-Quang 1', 'KTV. Phạm Minh Đức'],
            ['PK-S01', 'PK', 'Khám Sản 1', 'BS. Hoàng Thị Kim']
        ];

        for (const [id, deptId, name, docName] of rooms) {
            await pool.query(
                'INSERT INTO clinic_queue_rooms (id, department_id, name, doctor_name) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                [id, deptId, name, docName]
            );
        }

        // 3. Gieo mầm Bệnh nhân (Chờ)
        const patients = [
            ['KKB-P101', 'KKB', 'K-001', 'Nguyễn Văn A', 30, 'Khám định kỳ', false, 'WAITING'],
            ['KKB-P101', 'KKB', 'K-002', 'Trần Thị B', 45, 'Đau đầu', true, 'SERVING'],
            ['KKB-P102', 'KKB', 'K-003', 'Lê Văn C', 22, 'Khám sức khỏe', false, 'WAITING']
        ];

        for (const [roomId, deptId, code, name, age, reason, isPriority, status] of patients) {
            await pool.query(
                `INSERT INTO clinic_queue_patients (room_id, department_id, code, name, age, reason, is_priority, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [roomId, deptId, code, name, age, reason, isPriority, status]
            );
        }

        console.log('✅ Gieo mầm dữ liệu QMS thành công (Prefix: clinic_queue_)!');
    } catch (error) {
        console.error('❌ Lỗi gieo mầm dữ liệu QMS:', error);
    } finally {
        process.exit(0);
    }
}

seedQueueData();
