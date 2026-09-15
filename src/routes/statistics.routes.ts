// ==================== STATISTICS ROUTES ====================
// File: backend/src/routes/statistics.routes.ts

import express from 'express';
import { statisticsController } from '../controllers/statistics/statistics.controller';

const router = express.Router();

// 1. Hoạt động bệnh viện tổng thể
router.get('/hospital-activity', statisticsController.getHospitalActivity.bind(statisticsController));

// 2. Thống kê theo phòng khám
router.get('/clinics', statisticsController.getClinicsStatistics.bind(statisticsController));

// 3. Biến động bệnh nhân điều trị nội trú
router.get('/inpatient', statisticsController.getInpatientStatistics.bind(statisticsController));

// 4. Thống kê cận lâm sàng
router.get('/paraclinical', statisticsController.getParaclinicalStatistics.bind(statisticsController));

// 5. Phẫu thuật - thủ thuật
router.get('/surgery', statisticsController.getSurgeryStatistics.bind(statisticsController));

// 6. Tổng hợp chi phí khoa phòng
router.get('/department-costs', statisticsController.getDepartmentCostStatistics.bind(statisticsController));

// 7. Công suất sử dụng giường bệnh
router.get('/bed-occupancy', statisticsController.getBedOccupancyStatistics.bind(statisticsController));

// 8. Dữ liệu biểu đồ xu hướng lượt khám
router.get('/dashboard-charts', statisticsController.getDashboardCharts.bind(statisticsController));

// 9. Top 10 bác sĩ khám nhiều nhất
router.get('/top-doctors', statisticsController.getTopDoctors.bind(statisticsController));

export default router;
