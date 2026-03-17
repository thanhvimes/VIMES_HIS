
import { apiClient } from './apiClient';

// ==================== INTERFACES (HIS SCHEMA) ====================

export interface BookingSlot {
    receptNo: number;
    time: string;
    type: 'S' | 'O';
    status: 'S' | 'O' | 'F';  // S=Scheduled, O=Open, F=Full
    available?: number;        // Số lượng còn trống
    max?: number;              // Số lượng tối đa
}

export interface BookingSpeciality {
    id: string;
    name: string;
    description?: string;
}

export interface Room {
    id: number;            // hrl_id
    name: string;          // hrl_roomname
    code?: number;         // hrl_code
    doctor?: string;       // hrl_doctor
}

export interface OnlineBookingRecord {
    id: number;                    // qms_idx
    bookingId: number;             // qms_idx (same as id)
    idCard?: string;               // qms_idcard
    idCardIssuedDate?: string;     // qms_idcard_issue_date
    patientName: string;           // qms_patientname
    phone: string;                 // qms_contact
    birthDate: string;             // qms_birthdate
    gender: 'M' | 'F';             // qms_sex
    ethnic?: string;               // qms_ethnic
    deptId: string;                // qms_deptid
    roomId: number;                // qms_roomid
    bookingDate: string;           // qms_appointment_date
    bookingTime: string;           // qms_appointment_time
    status: 'O' | 'S' | 'C';       // qms_status (O=Open, S=Scheduled, C=Cancelled)
    reason?: string;               // qms_reason
    receptNo?: number;               // qms_receptno
    docNo?: string;                  // qms_docno
    doctor?: string;               // qms_doctor
    specialityName?: string;       // from join
    specialityCode?: string;       // qms_specialty_code
    deptName?: string;             // from sys_dept join
    roomName?: string;             // from hms_roomlist join
    createdAt?: string;            // qms_createddate
    isInsurance?: boolean;         // qms_is_insurance
    isPriority?: boolean;          // qms_is_priority
    smsStatus?: string;            // sms delivery status
    address?: string;              // qms_address
    provinceId?: number;           // qms_prov_id
    wardId?: number;               // qms_vill_id
    occupation?: number;           // qms_occupation
    email?: string;                // qms_email
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
    trends: Array<{
        name: string;
        bookings: number;
        arrived: number;
    }>;
    sources: Array<{
        name: string;
        value: number;
        color: string;
    }>;
    specialities: Array<{
        name: string;
        value: number;
    }>;
}

export interface LocationItem {
    id: string | number;
    name: string;
}

// ==================== CONFIGURATION ====================
const API_BASE_URL = '/api/v1/booking';
const SCHEDULE_API_URL = '/api/v1/schedule';
const USE_MOCK = false;

export const bookingService = {
    // --- DANH MỤC ---
    getSpecialities: async (deptId?: string): Promise<BookingSpeciality[]> => {
        if (USE_MOCK) {
            return [
                { id: '00001', name: 'Nội tổng quát' },
                { id: '00002', name: 'Ngoại tổng quát' },
            ];
        }
        const url = deptId
            ? `${API_BASE_URL}/specialities?deptId=${deptId}`
            : `${API_BASE_URL}/specialities`;
        const res = await fetch(url);
        return res.json();
    },

    getRoomsBySpeciality: async (specialityCode: string): Promise<Room[]> => {
        if (USE_MOCK) {
            return [
                { id: 65, name: 'Phòng khám 1', code: 1 },
                { id: 66, name: 'Phòng khám 2', code: 2 },
            ];
        }
        const res = await fetch(`${API_BASE_URL}/rooms/${specialityCode}`);
        if (!res.ok) return [];
        return res.json();
    },

    getProvinces: async (): Promise<LocationItem[]> => {
        const res = await fetch(`${API_BASE_URL}/locations/provinces`);
        if (!res.ok) return [];
        return res.json();
    },

    getWards: async (provinceId: string): Promise<LocationItem[]> => {
        const res = await fetch(`${API_BASE_URL}/locations/wards/${provinceId}`);
        if (!res.ok) return [];
        return res.json();
    },

    getDepartments: async (): Promise<LocationItem[]> => {
        const res = await fetch(`${API_BASE_URL}/departments`);
        if (!res.ok) return [];
        return res.json();
    },

    // --- SLOTS ---
    getAvailableSlots: async (deptId: string, specialityCode: string, date: string, roomId?: string): Promise<BookingSlot[]> => {
        if (USE_MOCK) {
            return [
                { time: '08:00', receptNo: 1, type: 'S', available: 3, max: 3, status: 'O' },
                { time: '08:15', receptNo: 2, type: 'S', available: 2, max: 3, status: 'O' },
                { time: '08:30', receptNo: 3, type: 'S', available: 0, max: 3, status: 'F' },
            ];
        }

        try {
            let url = `/api/v1/schedule/slots?deptId=${deptId}&date=${date}`;
            if (specialityCode) url += `&specialityCode=${specialityCode}`;
            if (roomId) url += `&roomId=${roomId}`;

            console.log('Fetching slots:', url);
            const res = await fetch(url);
            const data = await res.json();
            console.log('Slots response:', data);

            if (!data.success && data.error) { // Backend returns array on success, or object with error on fail? 
                // Wait, Controller returns res.json(result.rows) which is array.
                // If error, it returns { error: ... }
                // So if it's array, it's success.
            }

            if (Array.isArray(data)) {
                return data;
            } else if (data && data.success && Array.isArray(data.slots)) {
                return data.slots;
            } else if (data.error) {
                console.error('Slots API error:', data.error);
                return [];
            }

            return [];
        } catch (error) {
            console.error('Error fetching slots:', error);
            return [];
        }
    },

    // --- ĐĂNG KÝ ---
    registerBooking: async (data: {
        idCard?: string;
        name: string;
        birthDate: string;
        gender: 'M' | 'F';
        ethnic?: string;
        provinceId?: number;
        districtId?: number;
        wardId?: number;
        address?: string;
        phone: string;
        email?: string;
        deptId: string;
        roomId?: number;
        bookingDate: string;
        bookingTime: string;
        reason?: string;
        occupation?: number;
        doctor?: string;
        idCardIssuedDate?: string;
        isPriority?: boolean;
        isInsurance?: boolean;
        specialityCode?: string;
    }): Promise<{ success: boolean; bookingId: number; message: string }> => {
        const res = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Đăng ký thất bại');
        }

        return res.json();
    },

    // --- QUẢN LÝ DANH SÁCH ---
    getBookingList: async (filters: {
        fromDate?: string;
        toDate?: string;
        status?: string;
        speciality?: string;
        search?: string;
    }): Promise<OnlineBookingRecord[]> => {
        if (USE_MOCK) {
            return [
                {
                    id: 1,
                    bookingId: 1,
                    patientName: 'NGUYEN VAN A',
                    phone: '0901234567',
                    birthDate: '1990-01-01',
                    gender: 'M',
                    deptId: '00001',
                    roomId: 65,
                    bookingDate: '2026-01-20',
                    bookingTime: '08:00',
                    status: 'O',
                    specialityName: 'Nội tổng quát'
                }
            ];
        }

        const params = new URLSearchParams();
        if (filters.fromDate) params.append('fromDate', filters.fromDate);
        if (filters.toDate) params.append('toDate', filters.toDate);
        if (filters.status) params.append('status', filters.status);
        if (filters.speciality) params.append('speciality', filters.speciality);
        if (filters.search) params.append('search', filters.search);

        const res = await fetch(`${API_BASE_URL}/list?${params.toString()}`);
        if (!res.ok) {
            console.error('getBookingList error:', await res.text());
            return [];
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    },

    approveBooking: async (id: number): Promise<{ success: boolean; receptNo: number; message: string }> => {
        const res = await fetch(`${API_BASE_URL}/${id}/approve`, {
            method: 'POST'
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Duyệt thất bại');
        }

        return res.json();
    },

    rejectBooking: async (id: number, reason?: string): Promise<{ success: boolean; message: string }> => {
        const res = await fetch(`${API_BASE_URL}/${id}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Từ chối thất bại');
        }

        return res.json();
    },

    cancelBooking: async (id: number, reason?: string): Promise<{ success: boolean; message: string }> => {
        const res = await fetch(`${API_BASE_URL}/${id}/cancel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Hủy thất bại');
        }

        return res.json();
    },

    resendSMS: async (id: number): Promise<{ success: boolean; message: string }> => {
        const res = await fetch(`${API_BASE_URL}/${id}/resend-sms`, {
            method: 'POST'
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Gửi SMS thất bại');
        }

        return res.json();
    },

    // --- THỐNG KÊ ---
    getBookingStatistics: async (filters: { fromDate?: string; toDate?: string }): Promise<BookingStatistics> => {
        const params = new URLSearchParams();
        if (filters.fromDate) params.append('fromDate', filters.fromDate);
        if (filters.toDate) params.append('toDate', filters.toDate);

        const res = await fetch(`${API_BASE_URL}/statistics?${params.toString()}`);
        if (!res.ok) throw new Error('Không thể tải thống kê');
        return res.json();
    },

    initSlots: async (days: number = 30): Promise<{ success: boolean; message: string }> => {
        return apiClient.post(`/schedule/init`, { days });
    }
};
