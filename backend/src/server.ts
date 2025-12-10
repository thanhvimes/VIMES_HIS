
import express, { NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// QUAN TRỌNG: Import file db config để chạy lệnh kiểm tra kết nối
import './config/db'; 

import receptionRoutes from './routes/reception.routes';
import consultationRoutes from './routes/consultation.routes';
import insuranceRoutes from './routes/insurance.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors() as any);
app.use(express.json() as any);

// Logging request
app.use((req: any, res: any, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/v1/reception', receptionRoutes);
app.use('/api/v1/consultation', consultationRoutes);
app.use('/api/v1/insurance', insuranceRoutes);

app.get('/', (req: any, res: any) => {
  res.send('ClinicMS Backend API is running...');
});

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 BACKEND SERVER ĐANG CHẠY TẠI PORT ${PORT}`);
  console.log(`👉 Đang thử kết nối đến: ${process.env.DATABASE_URL?.split('@')[1]}`); // Log host để debug (ẩn pass)
  console.log(`=================================`);
});
