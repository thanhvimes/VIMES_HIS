
import { apiClient } from './apiClient';

// ==================== INTERFACES ====================

export interface ScheduleSlot {
    id: number;              // hse_idx
    receptNo: number;        // hse_receptno
    time: string;            // hse_time
    appointDate: string;     // hse_appointdate
    type: 'S' | 'C';        // hse_type
    doctor?: string;         // hse_doctor
    status: 'O' | 'S';      // hse_status
    docNo?: number;          // hse_docno
}

export interface SlotStatistics {
    total: number;
    available: number;
    scheduled: number;
    type: 'S' | 'C';
}

// ==================== CONFIGURATION ====================
const API_BASE_URL = '/api/v1/schedule';
const USE_MOCK = false;

export const scheduleService = {
    // Tạo slots tự động cho một ngày
    generateSlots: async (deptId: string, roomId: number, date: string): Promise<{
        success: boolean;
        slotCount: number;
        message: string;
    }> => {
        const res = await fetch(`${API_BASE_URL}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deptId, roomId, date })
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.error || 'Không thể tạo slots');
        }

        return res.json();
    },

    // Lấy tất cả slots theo ngày
    getSlotsByDate: async (deptId: string, roomId: number, date: string): Promise<ScheduleSlot[]> => {
        if (USE_MOCK) {
            return [
                { id: 1, receptNo: 1, time: '08:00', appointDate: '2026-01-20 08:00:00', type: 'S', status: 'O' },
                { id: 2, receptNo: 2, time: '08:10', appointDate: '2026-01-20 08:10:00', type: 'S', status: 'S' },
            ];
        }

        const res = await fetch(`${API_BASE_URL}/slots?deptId=${deptId}&roomId=${roomId}&date=${date}`);
        return res.json();
    },

    // Lấy slots khả dụng (chưa đặt)
    getAvailableSlots: async (deptId: string, roomId: number, date: string): Promise<ScheduleSlot[]> => {
        const res = await fetch(`${API_BASE_URL}/available?deptId=${deptId}&roomId=${roomId}&date=${date}`);
        return res.json();
    },

    // Kiểm tra slot có khả dụng không
    checkSlotAvailability: async (
        deptId: string,
        roomId: number,
        date: string,
        time: string
    ): Promise<{
        available: boolean;
        status?: string;
        receptNo?: number;
        reason: string;
    }> => {
        const res = await fetch(
            `${API_BASE_URL}/check?deptId=${deptId}&roomId=${roomId}&date=${date}&time=${time}`
        );
        return res.json();
    },

    // Thống kê slots
    getSlotStatistics: async (deptId: string, roomId: number, date: string): Promise<SlotStatistics[]> => {
        const res = await fetch(`${API_BASE_URL}/statistics?deptId=${deptId}&roomId=${roomId}&date=${date}`);
        return res.json();
    }
};
