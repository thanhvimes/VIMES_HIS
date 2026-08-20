// ==================== HOSPITAL STATISTICS API SERVICE ====================
// File: modules/hospital-statistics/services/statisticsService.ts

import {
    HospitalActivityData,
    ClinicStatisticsItem,
    InpatientStatisticsItem,
    ParaclinicalStatisticsItem,
    SurgeryStatisticsItem,
    DepartmentCostItem,
    BedOccupancyItem,
    ChartDayItem,
    TopDoctorItem
} from '../types';

const API_BASE_URL = '/api/v1/statistics';

function getAuthHeaders(): HeadersInit {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    try {
        const userSession = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        if (userSession) {
            const parsed = JSON.parse(userSession);
            if (parsed.token) {
                headers['Authorization'] = `Bearer ${parsed.token}`;
            }
        }
    } catch {
        // Fallback gracefully
    }
    return headers;
}

export const statisticsService = {
    async getHospitalActivity(fromDate: string, toDate: string): Promise<HospitalActivityData> {
        const res = await fetch(`${API_BASE_URL}/hospital-activity?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, {
            headers: getAuthHeaders()
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Lỗi tải dữ liệu hoạt động bệnh viện');
        return json.data;
    },

    async getClinicsStatistics(fromDate: string, toDate: string): Promise<ClinicStatisticsItem[]> {
        const res = await fetch(`${API_BASE_URL}/clinics?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, {
            headers: getAuthHeaders()
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Lỗi tải dữ liệu phòng khám');
        return json.data || [];
    },

    async getInpatientStatistics(fromDate: string, toDate: string): Promise<InpatientStatisticsItem[]> {
        const res = await fetch(`${API_BASE_URL}/inpatient?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, {
            headers: getAuthHeaders()
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Lỗi tải dữ liệu điều trị nội trú');
        return json.data || [];
    },

    async getParaclinicalStatistics(fromDate: string, toDate: string, deptId?: string): Promise<ParaclinicalStatisticsItem[]> {
        let url = `${API_BASE_URL}/paraclinical?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
        if (deptId) url += `&deptId=${encodeURIComponent(deptId)}`;
        const res = await fetch(url, {
            headers: getAuthHeaders()
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Lỗi tải dữ liệu cận lâm sàng');
        return json.data || [];
    },

    async getSurgeryStatistics(fromDate: string, toDate: string): Promise<SurgeryStatisticsItem[]> {
        const res = await fetch(`${API_BASE_URL}/surgery?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, {
            headers: getAuthHeaders()
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Lỗi tải dữ liệu phẫu thuật thủ thuật');
        return json.data || [];
    },

    async getDepartmentCostStatistics(fromDate: string, toDate: string): Promise<DepartmentCostItem[]> {
        const res = await fetch(`${API_BASE_URL}/department-costs?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, {
            headers: getAuthHeaders()
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Lỗi tải dữ liệu tổng hợp chi phí');
        return json.data || [];
    },

    async getBedOccupancyStatistics(): Promise<BedOccupancyItem[]> {
        const res = await fetch(`${API_BASE_URL}/bed-occupancy`, {
            headers: getAuthHeaders()
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Lỗi tải dữ liệu công suất giường');
        return json.data || [];
    },

    async getDashboardCharts(fromDate: string, toDate: string): Promise<ChartDayItem[]> {
        const res = await fetch(`${API_BASE_URL}/dashboard-charts?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, {
            headers: getAuthHeaders()
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Lỗi tải biểu đồ');
        return json.data || [];
    },

    async getTopDoctors(fromDate: string, toDate: string): Promise<TopDoctorItem[]> {
        const res = await fetch(`${API_BASE_URL}/top-doctors?fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`, {
            headers: getAuthHeaders()
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.message || 'Lỗi tải danh sách bác sĩ');
        return json.data || [];
    }
};
