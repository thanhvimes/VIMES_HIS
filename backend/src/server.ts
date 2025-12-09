
import express from 'express';
import cors from 'cors';
import receptionRoutes from './routes/reception.routes';
import consultationRoutes from './routes/consultation.routes';
import insuranceRoutes from './routes/insurance.routes'; // Import mới

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors() as any);
app.use(express.json());

// Routes
app.use('/api/v1/reception', receptionRoutes);
app.use('/api/v1/consultation', consultationRoutes);
app.use('/api/v1/insurance', insuranceRoutes); // Route mới

// Health Check
app.get('/', (req, res) => {
  res.send('ClinicMS Backend API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
