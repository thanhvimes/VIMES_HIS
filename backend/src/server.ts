
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// Import db để kích hoạt kết nối ngay khi server chạy
import './config/db'; 
import receptionRoutes from './routes/reception.routes';
import consultationRoutes from './routes/consultation.routes';
import insuranceRoutes from './routes/insurance.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
// Fix TS error: Argument of type 'NextHandleFunction' is not assignable to parameter of type 'PathParams'
app.use(cors() as any);
app.use(express.json() as any);

// Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/v1/reception', receptionRoutes);
app.use('/api/v1/consultation', consultationRoutes);
app.use('/api/v1/insurance', insuranceRoutes);

// Health Check
app.get('/', (req: Request, res: Response) => {
  res.send('ClinicMS Backend API is running...');
});

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 BACKEND SERVER ĐANG CHẠY!`);
  console.log(`👉 URL: http://localhost:${PORT}`);
  console.log(`👉 Đang kết nối Database... (Xem log bên dưới)`);
  console.log(`=================================`);
});
