
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

export interface BookingRequest {
    id?: string;
    patientId?: string;
    name: string;
    phone: string;
    dob: string;
    gender: string;
    identityCard?: string;
    provinceId?: string;
    districtId?: string;
    wardId?: string;
    addressDetail?: string;
    specialityId: string;
    date: string;
    time: string;
    reason: string;
    isPriority: boolean;
    status?: 'Pending' | 'Approved' | 'Rejected' | 'Arrived';
}

export interface LocationItem {
    id: string;
    name: string;
}

const USE_MOCK = true;

export const bookingService = {
    // --- DANH MỤC ĐỊA GIỚI HÀNH CHÍNH ---
    getProvinces: async (): Promise<LocationItem[]> => {
        if (USE_MOCK) {
            return [
                { id: '01', name: 'Thành phố Hà Nội' },
                { id: '79', name: 'Thành phố Hồ Chí Minh' },
                { id: '48', name: 'Thành phố Đà Nẵng' }
            ];
        }
        return await apiClient.get<LocationItem[]>('/booking/locations/provinces');
    },

    getDistricts: async (provinceId: string): Promise<LocationItem[]> => {
        if (USE_MOCK) {
            return [
                { id: '001', name: 'Quận Ba Đình' },
                { id: '002', name: 'Quận Hoàn Kiếm' }
            ];
        }
        return await apiClient.get<LocationItem[]>(`/booking/locations/districts/${provinceId}`);
    },

    getWards: async (districtId: string): Promise<LocationItem[]> => {
        if (USE_MOCK) {
            return [
                { id: '00001', name: 'Phường Phúc Xá' },
                { id: '00004', name: 'Phường Trúc Bạch' }
            ];
        }
        return await apiClient.get<LocationItem[]>(`/booking/locations/wards/${districtId}`);
    },

    // --- DANH MỤC CHUYÊN KHOA & SLOT ---
    getSpecialities: async (): Promise<BookingSpeciality[]> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300));
            return [
                { id: 'S1', name: 'Nội tổng quát', quotaPerSlot: 10 },
                { id: 'S2', name: 'Ngoại khoa', quotaPerSlot: 5 },
                { id: 'S3', name: 'Nhi khoa', quotaPerSlot: 15 },
                { id: 'S4', name: 'Sản phụ khoa', quotaPerSlot: 8 },
                { id: 'S5', name: 'Tai mũi họng', quotaPerSlot: 10 },
                { id: 'S6', name: 'Da liễu', quotaPerSlot: 10 },
            ];
        }
        return await apiClient.get<BookingSpeciality[]>('/booking/specialities');
    },

    getAvailableSlots: async (specialityId: string, date: string): Promise<BookingSlot[]> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 400));
            const times = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'];
            return times.map(t => ({
                time: t,
                maxQuota: 10,
                currentCount: Math.floor(Math.random() * 11),
                isFull: Math.random() > 0.8
            }));
        }
        return await apiClient.get<BookingSlot[]>('/booking/slots', { specialityId, date });
    },

    // --- NGHIỆP VỤ ĐĂNG KÝ (Dành cho Patient/Staff) ---
    submitBooking: async (data: BookingRequest): Promise<{ success: boolean; bookingId: string }> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 1000));
            return { success: true, bookingId: `BK${Date.now().toString().slice(-6)}` };
        }
        return await apiClient.post('/booking/register', data);
    },

    // --- QUẢN LÝ LỊCH HẸN (Dành cho Staff) ---
    getBookingList: async (params: { date?: string, status?: string, search?: string }): Promise<BookingRequest[]> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 500));
            return []; // Màn hình ManagementView đã có mockData nội bộ
        }
        return await apiClient.get<BookingRequest[]>('/booking/list', params);
    },

    updateBookingStatus: async (id: string, status: string): Promise<boolean> => {
        if (USE_MOCK) {
            await new Promise(r => setTimeout(r, 300));
            return true;
        }
        return await apiClient.put(`/booking/${id}/status`, { status });
    },

    deleteBooking: async (id: string): Promise<boolean> => {
        if (USE_MOCK) {
            return true;
        }
        return await apiClient.delete(`/booking/${id}`);
    }
};
