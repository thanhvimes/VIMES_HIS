
import { apiClient } from './apiClient';

export interface BookingSlot {
    time: string;
    maxQuota: number;
    currentCount: number;
    isFull: boolean;
}

export interface BookingSpeciality {
    id: string;
    name: string;
    description?: string;
    quotaPerSlot: number;
}

export interface OnlineBookingRecord {
    id: string;
    patientId?: string;
    name: string;
    phone: string;
    dob: string;
    gender: string;
    speciality: string;
    date: string;
    time: string;
    source: 'Portal' | 'Mobile App' | 'Zalo';
    status: 'Pending' | 'Approved' | 'Rejected' | 'Arrived';
    smsStatus: 'Sent' | 'Failed' | 'Pending';
    createdAt: string;
    reason: string;
    queueNumber?: number;
}

export interface BookingStatistics {
    kpis: {
        total: number;
        pending: number;
        approved: number;
        arrived: number;
        rejected: number;
        growth: number;
    };
    trends: Array<{ name: string; bookings: number; arrived: number }>;
    sources: Array<{ name: string; value: number; color: string }>;
    specialities: Array<{ name: string; value: number }>;
}

export interface LocationItem {
    id: string;
    name: string;
    parentId?: string;
}

const USE_MOCK = true;

export const bookingService = {
    // --- DANH MỤC ---
    getSpecialities: async (): Promise<BookingSpeciality[]> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300));
            return [
                { id: 'S1', name: 'Nội tổng quát', quotaPerSlot: 10 },
                { id: 'S2', name: 'Ngoại khoa', quotaPerSlot: 5 },
                { id: 'S3', name: 'Nhi khoa', quotaPerSlot: 15 },
                { id: 'S4', name: 'Sản phụ khoa', quotaPerSlot: 8 },
            ];
        }
        return await apiClient.get<BookingSpeciality[]>('/booking/specialities');
    },

    getAvailableSlots: async (specialityId: string, date: string): Promise<BookingSlot[]> => {
        if (USE_MOCK) {
            const times = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'];
            return times.map(t => ({
                time: t,
                maxQuota: 10,
                currentCount: Math.floor(Math.random() * 8),
                isFull: false
            }));
        }
        return await apiClient.get<BookingSlot[]>('/booking/slots', { specialityId, date });
    },

    // --- QUẢN LÝ DANH SÁCH & BÁO CÁO ---
    getBookingList: async (params: { 
        fromDate?: string; 
        toDate?: string; 
        status?: string; 
        speciality?: string;
        search?: string;
    }): Promise<OnlineBookingRecord[]> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 600));
            return [
                { id: 'BK1001', patientId: 'P003', name: 'LÊ HOÀNG CƯỜNG', phone: '0905123456', dob: '10/02/1978', gender: 'Nam', speciality: 'Nội tổng quát', date: '2023-11-28', time: '08:30', source: 'Portal', status: 'Pending', smsStatus: 'Pending', createdAt: '2023-11-27 10:00', reason: 'Tái khám định kỳ' },
                { id: 'BK1002', name: 'NGUYỄN THỊ MAI', phone: '0912777888', dob: '15/11/1992', gender: 'Nữ', speciality: 'Nhi khoa', date: '2023-11-28', time: '09:00', source: 'Mobile App', status: 'Approved', smsStatus: 'Sent', createdAt: '2023-11-27 11:30', reason: 'Bé sốt nhẹ' },
                { id: 'BK1003', name: 'TRẦN VĂN HÙNG', phone: '0933444555', dob: '20/05/1988', gender: 'Nam', speciality: 'Sản phụ khoa', date: '2023-11-28', time: '14:00', source: 'Zalo', status: 'Pending', smsStatus: 'Pending', createdAt: '2023-11-27 14:00', reason: 'Khám thai' },
            ];
        }
        return await apiClient.get<OnlineBookingRecord[]>('/booking/list', params);
    },

    getBookingStatistics: async (params: { fromDate: string; toDate: string }): Promise<BookingStatistics> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 800));
            return {
                kpis: { total: 1240, pending: 68, approved: 1172, arrived: 980, rejected: 45, growth: 12.5 },
                trends: [
                    { name: '01/11', bookings: 45, arrived: 38 },
                    { name: '02/11', bookings: 52, arrived: 42 },
                    { name: '03/11', bookings: 48, arrived: 40 },
                    { name: '04/11', bookings: 70, arrived: 65 },
                    { name: '05/11', bookings: 61, arrived: 55 },
                ],
                sources: [
                    { name: 'Web Portal', value: 450, color: '#0d9488' },
                    { name: 'Mobile App', value: 210, color: '#3b82f6' },
                    { name: 'Zalo/Social', value: 140, color: '#8b5cf6' },
                ],
                specialities: [
                    { name: 'Nội tổng quát', value: 120 },
                    { name: 'Nhi khoa', value: 85 },
                    { name: 'Sản phụ khoa', value: 65 },
                    { name: 'Tai mũi họng', value: 45 },
                    { name: 'Da liễu', value: 30 },
                ]
            };
        }
        return await apiClient.get<BookingStatistics>('/booking/statistics', params);
    },

    // --- NGHIỆP VỤ DUYỆT PUSH HIS ---
    approveAndPushToHIS: async (bookingId: string): Promise<{ success: boolean; queueNumber?: number }> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 1500));
            return { success: true, queueNumber: Math.floor(Math.random() * 100) + 100 };
        }
        return await apiClient.post(`/booking/${bookingId}/approve`, {});
    },

    rejectBooking: async (bookingId: string, reason: string): Promise<boolean> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 500));
            return true;
        }
        await apiClient.post(`/booking/${bookingId}/reject`, { reason });
        return true;
    },

    resendSMS: async (bookingId: string): Promise<boolean> => {
        await new Promise(r => setTimeout(r, 1000));
        return true;
    },

    getProvinces: async (): Promise<LocationItem[]> => {
        if (USE_MOCK) {
            return [{ id: 'T01', name: 'Hà Nội' }, { id: 'T02', name: 'TP. Hồ Chí Minh' }];
        }
        return await apiClient.get<LocationItem[]>('/booking/locations/provinces');
    },

    getWards: async (provinceId: string): Promise<LocationItem[]> => {
        if (USE_MOCK) {
            return [{ id: 'W01', name: 'Phường 1', parentId: provinceId }, { id: 'W02', name: 'Phường 2', parentId: provinceId }];
        }
        return await apiClient.get<LocationItem[]>(`/booking/locations/wards/${provinceId}`);
    },

    submitBooking: async (data: any): Promise<{ success: boolean; bookingId: string }> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 1000));
            return { success: true, bookingId: `BK${Date.now().toString().slice(-6)}` };
        }
        return await apiClient.post('/booking/register', data);
    }
};
