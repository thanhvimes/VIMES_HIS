// ==================== ROOM SERVICE ====================
// File: services/roomService.ts

import { apiClient } from './apiClient';

// ==================== INTERFACES ====================
export interface Room {
    id: number;
    code: string;
    name: string;
    deptId?: string;
    deptName?: string;
    location?: string;
    description?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface RoomSchedule {
    deptId: string;
    roomId: number;
    type: 'S' | 'C'; // S=Sáng, C=Chiều
    avgTime: number; // Thời gian khám trung bình (phút)
    maxSlot: number; // Số lượng BN tối đa mỗi slot
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    isActive?: boolean; // Trạng thái hoạt động
    roomCode?: string;
    roomName?: string;
    deptName?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface RoomScheduleStats {
    totalSlots: number; // Tổng số slot trong ca
    maxPatients: number; // Tổng số BN tối đa
}

// ==================== CONFIGURATION ====================
const API_BASE_URL = '/api/v1';
const USE_MOCK = false; // Set to true for development

export const roomService = {
    // --- DANH MỤC PHÒNG KHÁM ---

    getRooms: async (filters?: { deptId?: string; isActive?: boolean }): Promise<Room[]> => {
        if (USE_MOCK) {
            return [
                {
                    id: 1,
                    code: 'KB',
                    name: 'Phòng khám bệnh',
                    deptId: 'S01',
                    deptName: 'Nội tổng quát',
                    location: 'Tầng 1',
                    isActive: true
                },
                {
                    id: 2,
                    code: 'P01',
                    name: 'Phòng khám 01',
                    deptId: 'S01',
                    deptName: 'Nội tổng quát',
                    location: 'Tầng 1',
                    isActive: true
                }
            ];
        }

        const params = new URLSearchParams();
        if (filters?.deptId) params.append('deptId', filters.deptId);
        if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

        const res = await fetch(`${API_BASE_URL}/rooms?${params}`);
        return res.json();
    },

    getRoomById: async (id: number): Promise<Room> => {
        if (USE_MOCK) {
            return {
                id: 1,
                code: 'KB',
                name: 'Phòng khám bệnh',
                deptId: 'S01',
                deptName: 'Nội tổng quát',
                location: 'Tầng 1',
                description: 'Phòng khám nội tổng quát',
                isActive: true
            };
        }

        const res = await fetch(`${API_BASE_URL}/rooms/${id}`);
        return res.json();
    },

    createRoom: async (data: Partial<Room>): Promise<{ success: boolean; room: Room; message: string }> => {
        if (USE_MOCK) {
            return {
                success: true,
                room: { id: Date.now(), ...data } as Room,
                message: 'Tạo phòng khám thành công'
            };
        }

        const res = await fetch(`${API_BASE_URL}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    updateRoom: async (id: number, data: Partial<Room>): Promise<{ success: boolean; room: Room; message: string }> => {
        if (USE_MOCK) {
            return {
                success: true,
                room: { id, ...data } as Room,
                message: 'Cập nhật phòng khám thành công'
            };
        }

        const res = await fetch(`${API_BASE_URL}/rooms/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    deleteRoom: async (id: number): Promise<{ success: boolean; message: string }> => {
        if (USE_MOCK) {
            return { success: true, message: 'Xóa phòng khám thành công' };
        }

        const res = await fetch(`${API_BASE_URL}/rooms/${id}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    // --- CẤU HÌNH LỊCH KHÁM ---

    getSchedules: async (filters?: { deptId?: string; roomId?: number; type?: 'S' | 'C' }): Promise<RoomSchedule[]> => {
        if (USE_MOCK) {
            return [
                {
                    deptId: 'S01',
                    roomId: 1,
                    type: 'S',
                    avgTime: 6,
                    maxSlot: 10,
                    startTime: '07:30',
                    endTime: '11:18',
                    roomCode: 'KB',
                    roomName: 'Phòng khám bệnh',
                    deptName: 'Nội tổng quát'
                },
                {
                    deptId: 'S01',
                    roomId: 1,
                    type: 'C',
                    avgTime: 6,
                    maxSlot: 10,
                    startTime: '13:00',
                    endTime: '15:30',
                    roomCode: 'KB',
                    roomName: 'Phòng khám bệnh',
                    deptName: 'Nội tổng quát'
                }
            ];
        }

        const params = new URLSearchParams();
        if (filters?.deptId) params.append('deptId', filters.deptId);
        if (filters?.roomId) params.append('roomId', filters.roomId.toString());
        if (filters?.type) params.append('type', filters.type);

        const res = await fetch(`${API_BASE_URL}/room-schedules?${params}`);
        return res.json();
    },

    getScheduleByRoom: async (deptId: string, roomId: number): Promise<RoomSchedule[]> => {
        if (USE_MOCK) {
            return [
                {
                    deptId,
                    roomId,
                    type: 'S',
                    avgTime: 6,
                    maxSlot: 10,
                    startTime: '07:30',
                    endTime: '11:18'
                },
                {
                    deptId,
                    roomId,
                    type: 'C',
                    avgTime: 6,
                    maxSlot: 10,
                    startTime: '13:00',
                    endTime: '15:30'
                }
            ];
        }

        const res = await fetch(`${API_BASE_URL}/room-schedules/${deptId}/${roomId}`);
        return res.json();
    },

    upsertSchedule: async (data: RoomSchedule): Promise<{ success: boolean; schedule: RoomSchedule; message: string }> => {
        if (USE_MOCK) {
            return {
                success: true,
                schedule: data,
                message: 'Lưu cấu hình thành công'
            };
        }

        const res = await fetch(`${API_BASE_URL}/room-schedules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return res.json();
    },

    deleteSchedule: async (deptId: string, roomId: number, type: 'S' | 'C'): Promise<{ success: boolean; message: string }> => {
        if (USE_MOCK) {
            return { success: true, message: 'Xóa cấu hình thành công' };
        }

        const res = await fetch(`${API_BASE_URL}/room-schedules/${deptId}/${roomId}/${type}`, {
            method: 'DELETE'
        });
        return res.json();
    },

    // --- HELPER FUNCTIONS ---

    calculateScheduleStats: (schedule: RoomSchedule): RoomScheduleStats => {
        const [startHour, startMin] = schedule.startTime.split(':').map(Number);
        const [endHour, endMin] = schedule.endTime.split(':').map(Number);

        const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
        const totalSlots = Math.floor(totalMinutes / schedule.avgTime);
        const maxPatients = totalSlots * schedule.maxSlot;

        return { totalSlots, maxPatients };
    }
};
