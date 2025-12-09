
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Tạo kết nối Pool tới Database
// Đảm bảo bạn đã có biến môi trường DATABASE_URL trong file .env
// Ví dụ: DATABASE_URL="postgresql://user:password@localhost:5432/clinic_db"
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Hàm helper để chạy query
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export default pool;
