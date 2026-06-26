// ==================== BOOKING MANAGEMENT CONTROLLER ====================
// File: backend/src/controllers/booking/management.controller.ts

import { Request, Response } from 'express';
import { query } from '../../config/database';
import notificationService from '../../services/notification.service';
import { AuthRequest } from '../../middleware/authMiddleware';

export interface BookingStats {
    total: number;
    approved: number;
    rejected: number;
    arrived: number;
    growth: number;
}

class BookingManagementController {
    /**
     * Register new booking (using stored procedure)
     */
    async registerBooking(req: Request, res: Response) {
        try {
            const {
                idCard, name, birthDate, gender, ethnic,
                provinceId, districtId, wardId, address, phone,
                deptId, roomId, bookingDate, bookingTime, reason,
                occupation, doctor, email, idCardIssuedDate,
                isPriority, isInsurance, specialityCode
            } = (req as any).body;

            const userDeptId = doctor || 'KB';

            if (!name || !phone || !birthDate || !gender || !deptId || !bookingDate || !bookingTime) {
                return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
            }

            // Auto-assign room if not provided (Load balancing)
            let assignedRoomId = roomId;
            if (!assignedRoomId) {
                const roomsWithSlotResult = await query(`
                    SELECT 
                        k.hrk_id,
                        (
                            SELECT COUNT(*) 
                            FROM qms_patient 
                            WHERE qms_roomid = k.hrk_id 
                              AND qms_appointment_date = $3
                              AND qms_status != 'C'
                        ) as current_bookings
                    FROM hms_roomlist_kios k
                    JOIN hms_schedule_exam hse ON (
                        hse.hse_deptid = k.hrk_deptid AND 
                        hse.hse_roomid = k.hrk_id AND 
                        hse.hse_date = $3 AND 
                        hse.hse_time = $4
                    )
                    WHERE k.hrk_code = $1 
                      AND k.hrk_deptid = $2 
                      AND k.hrk_active = 'Y'
                      AND hse.hse_status = 'O'
                    ORDER BY current_bookings ASC, k.hrk_id ASC
                `, [deptId, userDeptId, bookingDate, bookingTime]);

                if (roomsWithSlotResult.rows.length === 0) {
                    return res.status(400).json({
                        error: `Không tìm thấy phòng khám nào có khung giờ ${bookingTime} vào ngày ${bookingDate}.`
                    });
                }
                assignedRoomId = roomsWithSlotResult.rows[0].hrk_id;
            }

            // Normalize gender to 'M' or 'F' before stored procedure call (fallback to 'F')
            const dbGender = (gender && (gender.toLowerCase() === 'm' || gender.toLowerCase().includes('nam'))) ? 'M' : 'F';

            // Call stored procedure qms_patient_create_booking
            const result = await query(`
                SELECT qms_patient_create_booking(
                    $1, $2, $3, $4, $5, 
                    $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15,
                    $16, $17, $18, $19, $20,
                    $21, $22, $23
                ) as booking_id;
            `, [
                idCard, name, birthDate, dbGender, ethnic || '1',
                provinceId, districtId, wardId, address, phone,
                userDeptId, assignedRoomId, bookingDate, bookingTime, reason,
                occupation || 0, doctor || '', email || '', 'ONL',
                idCardIssuedDate === "" ? null : idCardIssuedDate,
                isPriority || false, isInsurance || false,
                specialityCode || deptId || ''
            ]);

            const bookingId = result.rows[0].booking_id;

            // Handle Error codes
            if (bookingId === -1) return res.status(400).json({ error: 'Khung giờ này đã được đặt.' });
            if (bookingId === -2) return res.status(400).json({ error: 'Khung giờ chưa được tạo.' });
            if (bookingId === -3) return res.status(400).json({ error: 'Bạn đã đăng ký lịch hẹn cho chuyên khoa này hôm nay rồi.' });

            // Send Confirmation SMS
            const bookingDetails = await query(`
                SELECT q.*, s.ss_desc as "specialtyName", rl.hrl_roomname as "roomName"
                FROM qms_patient q
                LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND k.hrk_deptid = q.qms_deptid AND k.hrk_code::varchar = q.qms_specialty_code::varchar)
                LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code = k.hrk_code::varchar)
                LEFT JOIN hms_roomlist rl ON (rl.hrl_deptid = q.qms_deptid AND rl.hrl_id = q.qms_roomid)
                WHERE q.qms_idx = $1
            `, [bookingId]);

            if (bookingDetails.rows.length > 0) {
                const fullData = bookingDetails.rows[0];
                const d = new Date(fullData.qms_appointment_date);
                const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

                await notificationService.sendSMS(phone as string, 'booking_confirmation', {
                    name: fullData.qms_patientname, patientName: fullData.qms_patientname,
                    date: formattedDate, time: fullData.qms_appointment_time,
                    bookingId: fullData.qms_idx, receptNo: fullData.qms_receptno,
                    queueNumber: fullData.qms_receptno, specialtyName: fullData.specialtyName || '',
                    roomName: fullData.roomName || '', deptId: fullData.qms_deptid,
                    patientType: isInsurance ? 'BH' : 'DV'
                });
            }

            return res.json({ success: true, bookingId, roomId: assignedRoomId, message: 'Đăng ký thành công' });

        } catch (error: any) {
            console.error('❌ Error registering booking:', error);
            return res.status(500).json({ error: 'Không thể đăng ký booking: ' + error.message });
        }
    }

    /**
     * Get booking list with filters
     */
    async getBookingList(req: Request, res: Response) {
        try {
            const { fromDate, toDate, status, speciality, search } = (req as any).query;

            let sql = `
            SELECT 
                q.qms_idx as id, q.qms_idx as "bookingId", q.qms_idcard as "idCard",
                TO_CHAR(q.qms_idcard_issuedate, 'YYYY-MM-DD') as "idCardIssuedDate",
                q.qms_patientname as "patientName", q.qms_contact as phone,
                TO_CHAR(q.qms_birthdate, 'YYYY-MM-DD') as "birthDate", q.qms_sex as gender,
                q.qms_ethnic as ethnic, q.qms_deptid as "deptId", d.sd_name as "deptName",
                q.qms_roomid as "roomId",
                TO_CHAR(q.qms_appointment_date, 'YYYY-MM-DD') as "bookingDate",
                q.qms_appointment_time as "bookingTime", q.qms_status as status,
                q.qms_reason as reason, q.qms_receptno as "receptNo", q.qms_docno as "docNo",
                q.qms_doctor as doctor, q.qms_createddate as "createdAt",
                q.qms_specialty_code as "specialityCode", q.qms_is_insurance as "isInsurance",
                q.qms_is_priority as "isPriority", q.qms_address as address,
                q.qms_prov_id as "provinceId", q.qms_vill_id as "wardId",
                q.qms_occupation as occupation, q.qms_email as email,
                s.ss_desc as "specialityName", hrl.hrl_roomname as "roomName"
            FROM qms_patient q
            LEFT JOIN sys_dept d ON (d.sd_id = q.qms_deptid)
            LEFT JOIN hms_roomlist hrl ON (hrl.hrl_deptid = q.qms_deptid AND hrl.hrl_id = q.qms_roomid)
            LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND k.hrk_deptid = q.qms_deptid AND k.hrk_code::varchar = q.qms_specialty_code::varchar)
            LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code = k.hrk_code::varchar)
            WHERE q.qms_type = 'ONL'
        `;

            const params: any[] = [];
            let paramIndex = 1;

            if (fromDate) { sql += ` AND qms_appointment_date >= $${paramIndex++}`; params.push(fromDate); }
            if (toDate) { sql += ` AND qms_appointment_date <= $${paramIndex++}`; params.push(toDate); }
            if (status && status !== 'All') { sql += ` AND qms_status = $${paramIndex++}`; params.push(status); }
            if (speciality && speciality !== 'All') { sql += ` AND qms_deptid = $${paramIndex++}`; params.push(speciality); }
            if (search) {
                sql += ` AND(qms_patientname ILIKE $${paramIndex} OR qms_contact LIKE $${paramIndex} OR CAST(qms_idx AS TEXT) LIKE $${paramIndex})`;
                params.push(`%${search}%`);
                paramIndex++;
            }

            sql += ' ORDER BY qms_appointment_date ASC, qms_appointment_time ASC';
            const result = await query(sql, params);
            return res.json(result.rows);

        } catch (error) {
            console.error('Error getting booking list:', error);
            return res.status(500).json({ error: 'Không thể lấy danh sách booking' });
        }
    }

    /**
     * Approve booking and push to HIS
     */
    async approveBooking(req: Request, res: Response) {
        try {
            const { id } = (req as any).params;

            await query(`UPDATE qms_patient SET qms_status = 'S', qms_updateddate = NOW() WHERE qms_idx = $1`, [id]);

            await query(`
                UPDATE hms_schedule_exam SET hse_status = 'S'
                WHERE hse_deptid = (SELECT qms_deptid FROM qms_patient WHERE qms_idx = $1)
                  AND hse_roomid = (SELECT qms_roomid FROM qms_patient WHERE qms_idx = $1)
                  AND hse_date = (SELECT qms_appointment_date FROM qms_patient WHERE qms_idx = $1)
                  AND hse_time = (SELECT qms_appointment_time FROM qms_patient WHERE qms_idx = $1)
            `, [id]);

            const bookingResult = await query(`
                SELECT q.*, s.ss_desc as "specialtyName", rl.hrl_roomname as "roomName"
                FROM qms_patient q
                LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND k.hrk_deptid = q.qms_deptid AND k.hrk_code::varchar = q.qms_specialty_code::varchar)
                LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code = k.hrk_code::varchar)
                LEFT JOIN hms_roomlist rl ON (rl.hrl_deptid = q.qms_deptid AND rl.hrl_id = q.qms_roomid)
                WHERE q.qms_idx = $1
            `, [id]);

            if (bookingResult.rows.length > 0) {
                const bookingData = bookingResult.rows[0];
                const dObj = new Date(bookingData.qms_appointment_date);
                const datePart = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
                let timePart = bookingData.qms_appointment_time || '08:00:00';
                if (timePart.length === 5) timePart += ':00';
                const examDate = `${datePart} ${timePart}`;

                await query(`
                SELECT * FROM qms_register_ticket_online(
                    $1, $2, $3, $4, $5, 
                    $6, $7::date, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16,
                    $17::date, $18, $19
                );`, [
                    id, "", "", bookingData.qms_patientname, bookingData.qms_idcard,
                    bookingData.qms_contact, bookingData.qms_birthdate, bookingData.qms_address,
                    bookingData.qms_deptid, bookingData.qms_is_priority || false,
                    bookingData.qms_is_insurance ? "BHYT" : "", bookingData.qms_prov_id,
                    bookingData.qms_vill_id, bookingData.qms_roomid, bookingData.qms_receptno,
                    bookingData.qms_sex, bookingData.qms_idcard_issuedate,
                    examDate, bookingData.qms_specialty_code || '',
                ]);

                // Notify user
                const d = new Date(bookingData.qms_appointment_date);
                const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

                await notificationService.sendSMS(bookingData.qms_contact, 'booking_approved', {
                    name: bookingData.qms_patientname, patientName: bookingData.qms_patientname,
                    date: formattedDate, time: bookingData.qms_appointment_time,
                    bookingId: bookingData.qms_idx, receptNo: bookingData.qms_receptno,
                    queueNumber: bookingData.qms_receptno, specialtyName: bookingData.specialtyName || '',
                    roomName: bookingData.roomName || '', deptId: bookingData.qms_deptid,
                    patientType: bookingData.qms_is_insurance ? 'BH' : 'DV'
                });

                return res.json({ success: true, receptNo: bookingData.qms_receptno, message: 'Đã duyệt booking' });
            } else {
                return res.status(404).json({ error: 'Không tìm thấy booking' });
            }
        } catch (error) {
            console.error('Error approving booking:', error);
            return res.status(500).json({ error: 'Không thể duyệt booking' });
        }
    }

    /**
     * Reject booking
     */
    async rejectBooking(req: Request, res: Response) {
        try {
            const { id } = (req as any).params;
            const { reason } = (req as any).body;
            await query(`UPDATE qms_patient SET qms_status = 'C', qms_comment = $2, qms_updateddate = NOW() WHERE qms_idx = $1`, [id, reason || 'Từ chối booking']);
            return res.json({ success: true, message: 'Đã từ chối booking' });
        } catch (error) {
            console.error('Error rejecting booking:', error);
            return res.status(500).json({ error: 'Không thể từ chối booking' });
        }
    }

    /**
     * Cancel booking (User side)
     */
    async cancelBooking(req: Request, res: Response) {
        try {
            const { id } = (req as any).params;
            const { reason } = (req as any).body;
            await query(`UPDATE qms_patient SET qms_status = 'C', qms_comment = $2, qms_updateddate = NOW() WHERE qms_idx = $1`, [id, reason || 'Người dùng hủy']);
            return res.json({ success: true, message: 'Đã hủy lịch hẹn' });
        } catch (error) {
            console.error('Error cancelling booking:', error);
            return res.status(500).json({ error: 'Không thể hủy lịch hẹn' });
        }
    }

    /**
     * Get management statistics
     */
    async getStatistics(req: Request, res: Response) {
        try {
            const { startDate, endDate, fromDate, toDate } = (req as any).query;
            const startStr = fromDate || startDate || '2026-01-01';
            const endStr = toDate || endDate || '2026-12-31';

            const kpis = await query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE qms_status = 'S') as approved,
                    COUNT(*) FILTER (WHERE qms_status = 'C') as rejected,
                    COUNT(*) FILTER (WHERE qms_chkindte IS NOT NULL) as arrived
                FROM qms_patient 
                WHERE qms_type = 'ONL' AND qms_appointment_date BETWEEN $1 AND $2
            `, [startStr, endStr]);

            const rawKpi = kpis.rows[0];
            const kpiData: BookingStats = {
                total: parseInt(String(rawKpi?.total || 0)),
                approved: parseInt(String(rawKpi?.approved || 0)),
                rejected: parseInt(String(rawKpi?.rejected || 0)),
                arrived: parseInt(String(rawKpi?.arrived || 0)),
                growth: 12.5
            };

            const trends = await query(`
                SELECT TO_CHAR(qms_appointment_date, 'DD-MM-YYYY') as name,
                    COUNT(*) as bookings,
                    COUNT(*) FILTER (WHERE qms_chkindte IS NOT NULL) as arrived
                FROM qms_patient
                WHERE qms_type = 'ONL' AND qms_appointment_date BETWEEN $1 AND $2
                GROUP BY qms_appointment_date ORDER BY qms_appointment_date ASC
            `, [startStr, endStr]);

            const specialities = await query(`
                SELECT 
                    COALESCE((SELECT ss_desc FROM sys_sel WHERE ss_id = 'hms_roomlist_kios_hrk_code' AND ss_code = q.qms_deptid::varchar), 'Khác') as name,
                    COUNT(*) as value
                FROM qms_patient q
                WHERE q.qms_type = 'ONL' AND q.qms_appointment_date BETWEEN $1 AND $2
                GROUP BY q.qms_deptid ORDER BY value DESC
            `, [startStr, endStr]);

            return res.json({
                kpis: kpiData,
                trends: trends.rows.map((t: any) => ({ ...t, bookings: parseInt(String(t.bookings)), arrived: parseInt(String(t.arrived)) })),
                specialities: specialities.rows.map((s: any) => ({ ...s, value: parseInt(String(s.value)) })),
                sources: [
                    { name: 'Web Portal', value: Math.round(kpiData.total * 0.65), color: '#3b82f6' },
                    { name: 'Mobile App', value: Math.round(kpiData.total * 0.25), color: '#10b981' },
                    { name: 'Zalo MiniApp', value: Math.round(kpiData.total * 0.10), color: '#fbbf24' }
                ]
            });
        } catch (error) {
            console.error('Error getting statistics:', error);
            return res.status(500).json({ error: 'Không thể lấy thống kê' });
        }
    }
}

export default new BookingManagementController();
