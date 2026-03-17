
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ LỖI: Không tìm thấy biến 'DATABASE_URL' trong file .env");
}

// Cấu hình Pool kết nối
const pool = new Pool({
  connectionString: connectionString,
  // Tự động tắt SSL nếu chạy localhost hoặc IP nội bộ (10.x.x.x), bật nếu dùng cloud public
  ssl: connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1') && !connectionString.includes('10.') 
    ? { rejectUnauthorized: false } 
    : false,
});

// Test kết nối ngay khi file này được import
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ KẾT NỐI DATABASE THẤT BẠI:', err.message);
    console.error('👉 Vui lòng kiểm tra lại: 1. VPN/Mạng nội bộ 2. Username/Password 3. Firewall');
  } else {
    client?.query('SELECT NOW()', (qErr, result) => {
      release();
      if (qErr) {
        console.error('❌ Lỗi thực thi query test:', qErr.message);
      } else {
        console.log('✅ KẾT NỐI DATABASE THÀNH CÔNG');
        console.log(`🕒 Thời gian Server DB: ${result.rows[0].now}`);
      }
    });
  }
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;
