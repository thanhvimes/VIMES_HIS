
import { Pool } from 'pg';
import dotenv from 'dotenv';

// 1. Nạp biến môi trường từ file .env
dotenv.config();

// 2. Kiểm tra chuỗi kết nối
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ LỖI: Không tìm thấy biến 'DATABASE_URL' trong file .env");
  console.error("👉 Vui lòng tạo file .env và thêm chuỗi kết nối.");
}

// 3. Cấu hình Pool
// Lưu ý: Các database Cloud (Supabase, Neon, Render) thường yêu cầu SSL.
// Localhost thường không cần SSL.
const isProductionOrCloud = connectionString && !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString: connectionString,
  ssl: isProductionOrCloud ? { rejectUnauthorized: false } : false,
});

// 4. Test kết nối khi khởi động
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ KẾT NỐI DATABASE THẤT BẠI:', err.message);
  } else {
    // Thử query đơn giản để đảm bảo mọi thứ hoạt động
    client?.query('SELECT NOW()', (qErr, result) => {
      release(); // Trả kết nối về pool
      if (qErr) {
        console.error('❌ Lỗi thực thi query test:', qErr.message);
      } else {
        console.log('✅ KẾT NỐI DATABASE THÀNH CÔNG');
        console.log(`🕒 Thời gian Server DB: ${result.rows[0].now}`);
      }
    });
  }
});

// 5. Export hàm query wrapper để dùng trong controller
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;
