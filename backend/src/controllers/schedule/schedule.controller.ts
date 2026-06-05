// ==================== SCHEDULE CONTROLLER ====================
// File: backend/src/controllers/schedule.controller.ts

import { Request, Response } from 'express';
import { query } from '../../config/database';

export interface TimeSlot {
    time: string;
    receptNo: number;
    type: string;
    available: number;
    max: number;
    status: 'O' | 'F';
    roomId: string | number;
}

export interface MergedSlot {
    time: string;
    receptNo: number;
    type: string;
    available: number;
    max: number;
    rooms: any[];
    status: 'O' | 'F';
}

class ScheduleController {

    // Lấy danh sách slots khả dụng
    async getAvailableSlots(req: Request, res: Response) {
        try {
            const { deptId, roomId, specialityCode, date } = (req as any).query;

            if (!deptId || !date) {
                return res.status(400).json({ error: 'Thiếu tham số: deptId, date' });
            }

            if (!roomId && !specialityCode) {
                return res.status(400).json({ error: 'Cần có roomId hoặc specialityCode' });
            }

            if (!/^\d{4}-\d{2}-\d{2}$/.test(date as string)) {
                return res.status(400).json({ error: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD' });
            }

            const selectedDate = new Date(date as string);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                return res.status(400).json({ error: 'Không thể đặt lịch cho ngày đã qua' });
            }

            let allSlots: TimeSlot[] = [];

            if (specialityCode) {
                const roomsResult = await query(`
                    SELECT DISTINCT hrk_id as room_id
                    FROM hms_roomlist_kios
                    WHERE hrk_deptid = $1 
                      AND hrk_code = $2
                      AND hrk_active = 'Y'
                `, [deptId, specialityCode]);

                if (roomsResult.rows.length === 0) {
                    return res.json({
                        success: true,
                        date: date,
                        specialityCode: specialityCode,
                        rooms: [],
                        slots: [],
                        message: 'Không có phòng nào hỗ trợ loại khám này'
                    });
                }

                for (const room of roomsResult.rows) {
                    const roomSlots = await this.getRoomSlots(deptId as string, room.room_id, date as string);
                    allSlots.push(...roomSlots);
                }

                const mergedSlots = this.mergeSlotsByTime(allSlots);

                return res.json({
                    success: true,
                    date: date,
                    specialityCode: specialityCode,
                    totalRooms: roomsResult.rows.length,
                    slots: mergedSlots
                });

            } else {
                const roomSlots = await this.getRoomSlots(deptId as string, roomId as string, date as string);
                return res.json({
                    success: true,
                    date: date,
                    room: { id: parseInt(roomId as string), deptId: deptId },
                    slots: roomSlots
                });
            }

        } catch (error: any) {
            console.error('Error getting available slots:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách slots: ' + error.message });
        }
    }

    // Helper: Lấy slots của 1 phòng
    async getRoomSlots(deptId: string, roomId: string | number, date: string): Promise<TimeSlot[]> {
        const schedules = await this.getSchedulesFromDB(deptId, roomId, date);
        if (schedules.length === 0) return [];

        const allSlots: any[] = [];
        for (const schedule of schedules) {
            const slots = this.generateTimeSlots(
                schedule.start_time,
                schedule.end_time,
                schedule.slot_duration,
                schedule.max_patients
            );
            allSlots.push(...slots);
        }

        const bookedSlots = await this.getBookedSlots(deptId, roomId, date);

        const isToday = new Date(date).toDateString() === new Date().toDateString();
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();

        return allSlots
            .filter(slot => {
                if (!isToday) return true;
                const [slotHour, slotMinute] = slot.time.split(':').map(Number);
                if (slotHour > currentHour) return true;
                if (slotHour === currentHour && slotMinute > currentMinute) return true;
                return false;
            })
            .map(slot => {
                const booked = bookedSlots.find((b: any) => b.time === slot.time);
                const bookedCount = booked ? parseInt(booked.booked_count) : 0;
                const available = slot.max - bookedCount;

                return {
                    time: slot.time,
                    receptNo: slot.receptNo,
                    type: slot.type,
                    available: available,
                    max: slot.max,
                    status: available > 0 ? 'O' : 'F',
                    roomId: roomId
                };
            });
    }

    // Helper: Merge slots cùng thời gian từ nhiều phòng
    private mergeSlotsByTime(slots: TimeSlot[]): MergedSlot[] {
        const timeMap = new Map<string, MergedSlot>();

        slots.forEach(slot => {
            if (!timeMap.has(slot.time)) {
                timeMap.set(slot.time, {
                    time: slot.time,
                    receptNo: slot.receptNo,
                    type: slot.type,
                    available: 0,
                    max: 0,
                    rooms: [],
                    status: 'F'
                });
            }

            const merged = timeMap.get(slot.time)!;
            merged.available += slot.available;
            merged.max += slot.max;
            merged.rooms.push({
                roomId: slot.roomId,
                available: slot.available,
                max: slot.max
            });
        });

        const mergedArray = Array.from(timeMap.values()).map(slot => ({
            ...slot,
            status: (slot.available > 0 ? 'O' : 'F') as 'O' | 'F'
        }));

        mergedArray.sort((a, b) => a.time.localeCompare(b.time));
        return mergedArray;
    }

    private async getSchedulesFromDB(deptId: string, roomId: string | number, date: string) {
        const result = await query(`
            SELECT hs_shift as shift, hs_start_time as start_time, hs_end_time as end_time,
                   hs_slot_duration as slot_duration, hs_max_patients as max_patients
            FROM hms_schedule
            WHERE hs_deptid = $1 AND hs_roomid = $2 AND hs_date = $3 AND hs_active = 'Y'
            ORDER BY hs_start_time
        `, [deptId, roomId, date]);
        return result.rows;
    }

    private generateTimeSlots(startTime: string, endTime: string, duration: number, maxPatients: number) {
        const slots: any[] = [];
        const parseTime = (timeStr: string) => {
            const parts = timeStr.split(':');
            return { hours: parseInt(parts[0]), minutes: parseInt(parts[1]) };
        };

        const start = parseTime(startTime);
        const end = parseTime(endTime);
        let current = { ...start };
        let slotNo = 1;
        const finalDuration = duration || 30;

        while (current.hours < end.hours || (current.hours === end.hours && current.minutes < end.minutes)) {
            const timeStr = `${String(current.hours).padStart(2, '0')}:${String(current.minutes).padStart(2, '0')}`;
            slots.push({ time: timeStr, receptNo: slotNo++, type: 'S', max: maxPatients });
            current.minutes += finalDuration;
            if (current.minutes >= 60) {
                current.hours += Math.floor(current.minutes / 60);
                current.minutes = current.minutes % 60;
            }
        }
        return slots;
    }

    private async getBookedSlots(deptId: string, roomId: string | number, date: string) {
        const result = await query(`
            SELECT qms_appointment_time as time, qms_receptno as slot_no, COUNT(*) as booked_count
            FROM qms_patient
            WHERE qms_deptid = $1 AND qms_roomid = $2 AND qms_appointment_date = $3 AND qms_status IN ('O', 'S')
            GROUP BY qms_appointment_time, qms_receptno
        `, [deptId, roomId, date]);
        return result.rows;
    }
}

export default new ScheduleController();
