// ==================== STATISTICS CONTROLLER ====================
// File: backend/src/controllers/statistics/statistics.controller.ts

import { Request, Response } from 'express';
import { StatisticsService } from '../../services/statistics.service';

function normalizeDateRange(req: Request) {
    let fromDate = req.query.fromDate as string;
    let toDate = req.query.toDate as string;

    const today = new Date().toISOString().split('T')[0];
    if (!fromDate) fromDate = `${today} 00:00:00`;
    if (!toDate) toDate = `${today} 23:59:59`;

    if (/^\d{4}-\d{2}-\d{2}$/.test(fromDate)) fromDate = `${fromDate} 00:00:00`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(toDate)) toDate = `${toDate} 23:59:59`;

    return { fromDate, toDate };
}

export class StatisticsController {
    /**
     * 1. GET /api/v1/statistics/hospital-activity
     */
    async getHospitalActivity(req: Request, res: Response) {
        try {
            const { fromDate, toDate } = normalizeDateRange(req);
            const data = await StatisticsService.getHospitalActivity(fromDate, toDate);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('getHospitalActivity error:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi lấy dữ liệu hoạt động bệnh viện' });
        }
    }

    /**
     * 2. GET /api/v1/statistics/clinics
     */
    async getClinicsStatistics(req: Request, res: Response) {
        try {
            const { fromDate, toDate } = normalizeDateRange(req);
            const data = await StatisticsService.getClinicsStatistics(fromDate, toDate);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('getClinicsStatistics error:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi lấy thống kê phòng khám' });
        }
    }

    /**
     * 3. GET /api/v1/statistics/inpatient
     */
    async getInpatientStatistics(req: Request, res: Response) {
        try {
            const { fromDate, toDate } = normalizeDateRange(req);
            const data = await StatisticsService.getInpatientStatistics(fromDate, toDate);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('getInpatientStatistics error:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi lấy thống kê điều trị nội trú' });
        }
    }

    /**
     * 4. GET /api/v1/statistics/paraclinical
     */
    async getParaclinicalStatistics(req: Request, res: Response) {
        try {
            const { fromDate, toDate } = normalizeDateRange(req);
            const deptId = req.query.deptId as string | undefined;
            const data = await StatisticsService.getParaclinicalStatistics(fromDate, toDate, deptId);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('getParaclinicalStatistics error:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi lấy thống kê cận lâm sàng' });
        }
    }

    /**
     * 5. GET /api/v1/statistics/surgery
     */
    async getSurgeryStatistics(req: Request, res: Response) {
        try {
            const { fromDate, toDate } = normalizeDateRange(req);
            const data = await StatisticsService.getSurgeryStatistics(fromDate, toDate);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('getSurgeryStatistics error:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi lấy thống kê phẫu thuật thủ thuật' });
        }
    }

    /**
     * 6. GET /api/v1/statistics/department-costs
     */
    async getDepartmentCostStatistics(req: Request, res: Response) {
        try {
            const { fromDate, toDate } = normalizeDateRange(req);
            const data = await StatisticsService.getDepartmentCostStatistics(fromDate, toDate);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('getDepartmentCostStatistics error:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi lấy thống kê chi phí khoa phòng' });
        }
    }

    /**
     * 7. GET /api/v1/statistics/bed-occupancy
     */
    async getBedOccupancyStatistics(req: Request, res: Response) {
        try {
            const data = await StatisticsService.getBedOccupancyStatistics();
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('getBedOccupancyStatistics error:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi lấy thống kê công suất giường' });
        }
    }

    /**
     * 8. GET /api/v1/statistics/dashboard-charts
     */
    async getDashboardCharts(req: Request, res: Response) {
        try {
            const { fromDate, toDate } = normalizeDateRange(req);
            const data = await StatisticsService.getDashboardCharts(fromDate, toDate);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('getDashboardCharts error:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi lấy dữ liệu biểu đồ' });
        }
    }

    /**
     * 9. GET /api/v1/statistics/top-doctors
     */
    async getTopDoctors(req: Request, res: Response) {
        try {
            const { fromDate, toDate } = normalizeDateRange(req);
            const data = await StatisticsService.getTopDoctors(fromDate, toDate);
            res.json({ success: true, data });
        } catch (error: any) {
            console.error('getTopDoctors error:', error);
            res.status(500).json({ success: false, message: error.message || 'Lỗi lấy danh sách bác sĩ' });
        }
    }
}

export const statisticsController = new StatisticsController();
