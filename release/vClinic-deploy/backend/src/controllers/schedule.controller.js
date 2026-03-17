// ==================== SCHEDULE CONTROLLER ====================
// File: backend/src/controllers/schedule.controller.js

const db = require('../config/database');

class ScheduleController {

    // Lấy danh sách slots khả dụng
    // Nếu có specialityCode: lấy slots của TẤT CẢ phòng hỗ trợ loại khám đó
    // Nếu có roomId: lấy slots của phòng cụ thể
    async getAvailableSlots(req, res) {
        try {
            const { deptId, roomId, specialityCode, date } = req.query;

            if (!deptId || !date) {
                return res.status(400).json({
                    error: 'Thiếu tham số: deptId, date'
                });
            }

            if (!roomId && !specialityCode) {
                return res.status(400).json({
                    error: 'Cần có roomId hoặc specialityCode'
                });
            }

            // Validate date format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return res.status(400).json({
                    error: 'Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD'
                });
            }

            // Check if date is in the past
            const selectedDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                return res.status(400).json({
                    error: 'Không thể đặt lịch cho ngày đã qua'
                });
            }

            let allSlots = [];

            if (specialityCode) {
                // Lấy danh sách phòng hỗ trợ loại khám này
                const roomsResult = await db.query(`
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

                // Lấy slots của TẤT CẢ phòng
                for (const room of roomsResult.rows) {
                    const roomSlots = await this.getRoomSlots(deptId, room.room_id, date);
                    allSlots.push(...roomSlots);
                }

                // Merge slots cùng thời gian
                const mergedSlots = this.mergeSlotsByTime(allSlots);

                res.json({
                    success: true,
                    date: date,
                    specialityCode: specialityCode,
                    totalRooms: roomsResult.rows.length,
                    slots: mergedSlots
                });

            } else {
                // Lấy slots của 1 phòng cụ thể
                const roomSlots = await this.getRoomSlots(deptId, roomId, date);

                res.json({
                    success: true,
                    date: date,
                    room: { id: parseInt(roomId), deptId: deptId },
                    slots: roomSlots
                });
            }

        } catch (error) {
            console.error('Error getting available slots:', error);
            res.status(500).json({
                error: 'Không thể lấy danh sách slots: ' + error.message
            });
        }
    }

    // Helper: Lấy slots của 1 phòng
    async getRoomSlots(deptId, roomId, date) {
        console.log(`[getRoomSlots] deptId=${deptId}, roomId=${roomId}, date=${date}`);

        // 1. Lấy schedule của phòng
        const schedules = await this.getSchedules(deptId, roomId, date);
        console.log(`[getRoomSlots] Found ${schedules.length} schedules`);

        if (schedules.length === 0) {
            console.log(`[getRoomSlots] No schedules found, returning empty array`);
            return [];
        }

        // 2. Generate all time slots
        const allSlots = [];
        for (const schedule of schedules) {
            console.log(`[getRoomSlots] Generating slots for shift ${schedule.shift}: ${schedule.start_time} - ${schedule.end_time}`);
            const slots = this.generateTimeSlots(
                schedule.start_time,
                schedule.end_time,
                schedule.slot_duration,
                schedule.max_patients
            );
            console.log(`[getRoomSlots] Generated ${slots.length} slots`);
            allSlots.push(...slots);
        }
        console.log(`[getRoomSlots] Total slots generated: ${allSlots.length}`);

        // 3. Lấy slots đã đặt
        const bookedSlots = await this.getBookedSlots(deptId, roomId, date);
        console.log(`[getRoomSlots] Found ${bookedSlots.length} booked slots`);

        // 4. Tính available
        const availableSlots = allSlots.map(slot => {
            const booked = bookedSlots.find(b => b.time === slot.time);
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

        console.log(`[getRoomSlots] Returning ${availableSlots.length} slots`);
        return availableSlots;
    }

    // Helper: Merge slots cùng thời gian từ nhiều phòng
    mergeSlotsByTime(slots) {
        const timeMap = new Map();

        slots.forEach(slot => {
            if (!timeMap.has(slot.time)) {
                timeMap.set(slot.time, {
                    time: slot.time,
                    receptNo: slot.receptNo,
                    type: slot.type,
                    available: 0,
                    max: 0,
                    rooms: []
                });
            }

            const merged = timeMap.get(slot.time);
            merged.available += slot.available;
            merged.max += slot.max;
            merged.rooms.push({
                roomId: slot.roomId,
                available: slot.available,
                max: slot.max
            });
        });

        // Convert map to array và sort by time
        const mergedArray = Array.from(timeMap.values()).map(slot => ({
            ...slot,
            status: slot.available > 0 ? 'O' : 'F'
        }));

        mergedArray.sort((a, b) => a.time.localeCompare(b.time));

        return mergedArray;
    }

    // Helper: Lấy schedule từ database
    async getSchedules(deptId, roomId, date) {
        const result = await db.query(`
            SELECT 
                hs_shift as shift,
                hs_start_time as start_time,
                hs_end_time as end_time,
                hs_slot_duration as slot_duration,
                hs_max_patients as max_patients
            FROM hms_schedule
            WHERE hs_deptid = $1 
              AND hs_roomid = $2 
              AND hs_date = $3
              AND hs_active = 'Y'
            ORDER BY hs_start_time
        `, [deptId, roomId, date]);

        return result.rows;
    }

    // Helper: Generate time slots
    generateTimeSlots(startTime, endTime, duration, maxPatients) {
        const slots = [];

        // Parse time strings (HH:MM:SS or HH:MM)
        const parseTime = (timeStr) => {
            const parts = timeStr.split(':');
            return {
                hours: parseInt(parts[0]),
                minutes: parseInt(parts[1])
            };
        };

        const start = parseTime(startTime);
        const end = parseTime(endTime);

        let current = { ...start };
        let slotNo = 1;

        // ✅ SAFETY CHECK: Prevent infinite loop if duration is missing or zero
        if (!duration || duration <= 0) {
            console.error(`[generateTimeSlots] Invalid duration: ${duration}. Forcing to 30 mins.`);
            duration = 30;
        }

        while (current.hours < end.hours ||
            (current.hours === end.hours && current.minutes < end.minutes)) {

            const timeStr = `${String(current.hours).padStart(2, '0')}:${String(current.minutes).padStart(2, '0')}`;

            slots.push({
                time: timeStr,
                receptNo: slotNo,
                type: 'S', // S=Scheduled
                max: maxPatients
            });

            // Add duration
            current.minutes += duration;
            if (current.minutes >= 60) {
                current.hours += Math.floor(current.minutes / 60);
                current.minutes = current.minutes % 60;
            }

            slotNo++;
        }

        return slots;
    }

    // Helper: Lấy slots đã đặt
    async getBookedSlots(deptId, roomId, date) {
        const result = await db.query(`
            SELECT 
                qms_appointment_time as time,
                qms_receptno as slot_no,
                COUNT(*) as booked_count
            FROM qms_patient
            WHERE qms_deptid = $1 
              AND qms_roomid = $2 
              AND qms_appointment_date = $3
              AND qms_status IN ('O', 'S')
            GROUP BY qms_appointment_time, qms_receptno
        `, [deptId, roomId, date]);

        return result.rows;
    }
}

module.exports = new ScheduleController();
