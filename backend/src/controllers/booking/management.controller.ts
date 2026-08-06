// ==================== BOOKING MANAGEMENT CONTROLLER ====================
// File: backend/src/controllers/booking/management.controller.ts

import { Request, Response } from 'express';
import { query } from '../../config/database';
import notificationService from '../../services/notification.service';
import smsTemplateService from '../../services/sms-template.service';
import { AuthRequest } from '../../middleware/authMiddleware';

export interface BookingStats {
    total: number;
    pending: number;
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
                const targetSpecCode = specialityCode || deptId;
                const targetDeptId = (deptId && isNaN(Number(deptId))) ? deptId : 'KB';

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
                        (hse.hse_deptid = k.hrk_deptid OR hse.hse_deptid = 'KB') AND 
                        hse.hse_roomid = k.hrk_id AND 
                        hse.hse_date = $3 AND 
                        hse.hse_time = $4
                    )
                    WHERE k.hrk_code::varchar = $1::varchar
                      AND (k.hrk_deptid = $2 OR k.hrk_deptid = 'KB')
                      AND k.hrk_active = 'Y'
                      AND hse.hse_status = 'O'
                      AND NOT EXISTS (
                          SELECT 1 FROM qms_patient q
                          WHERE q.qms_deptid = hse.hse_deptid
                            AND q.qms_roomid = hse.hse_roomid
                            AND q.qms_appointment_date = hse.hse_date
                            AND q.qms_appointment_time = hse.hse_time
                            AND q.qms_status IN ('O', 'S')
                      )
                    ORDER BY current_bookings ASC, k.hrk_id ASC
                `, [targetSpecCode, targetDeptId, bookingDate, bookingTime]);

                if (roomsWithSlotResult.rows.length === 0) {
                    // Fallback to query any kiosk room for targetSpecCode
                    const fallbackRoomResult = await query(`
                        SELECT hrk_id FROM hms_roomlist_kios 
                        WHERE hrk_code::varchar = $1::varchar AND hrk_active = 'Y' 
                        LIMIT 1
                    `, [targetSpecCode]);

                    if (fallbackRoomResult.rows.length > 0) {
                        assignedRoomId = fallbackRoomResult.rows[0].hrk_id;
                    } else {
                        return res.status(400).json({
                            error: `Không tìm thấy phòng khám nào cho chuyên khoa này vào khung giờ ${bookingTime} ngày ${bookingDate}.`
                        });
                    }
                } else {
                    assignedRoomId = roomsWithSlotResult.rows[0].hrk_id;
                }
            }

            // Normalize gender to 'M' or 'F' before stored procedure call (fallback to 'F')
            const dbGender = (gender && (gender.toLowerCase() === 'm' || gender.toLowerCase().includes('nam'))) ? 'M' : 'F';

            // Call stored procedure qms_patient_create_booking with explicit parameter type casts
            const result = await query(`
                SELECT qms_patient_create_booking(
                    $1::text, $2::text, $3::date, $4::text, $5::text, 
                    $6::integer, $7::integer, $8::integer, $9::text, $10::text,
                    $11::text, $12::integer, $13::date, $14::text, $15::text,
                    $16::integer, $17::text, $18::text, $19::text, $20::date,
                    $21::boolean, $22::boolean, $23::text
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
                SELECT q.*, s.ss_desc as "specialtyName", COALESCE(rl.hrl_name, rl.hrl_roomname) as "roomName"
                FROM qms_patient q
                LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND (k.hrk_deptid = q.qms_deptid OR k.hrk_deptid = 'KB') AND k.hrk_code::varchar = q.qms_specialty_code::varchar)
                LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code::varchar = COALESCE(k.hrk_code::varchar, q.qms_specialty_code::varchar))
                LEFT JOIN hms_roomlist rl ON (rl.hrl_id = q.qms_roomid AND (rl.hrl_deptid = q.qms_deptid OR rl.hrl_deptid = 'KB'))
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
                    patientType: fullData.qms_is_insurance ? 'BH' : 'DV'
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
            const { fromDate, toDate, status, speciality, search, deptId } = (req as any).query;

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
                COALESCE(s.ss_desc, s_kb.ss_desc) as "specialityName",
                COALESCE(hrl.hrl_roomname, hrl_kb.hrl_roomname) as "roomName"
            FROM qms_patient q
            LEFT JOIN sys_dept d ON (d.sd_id = q.qms_deptid)
            LEFT JOIN hms_roomlist hrl ON (hrl.hrl_id = q.qms_roomid AND hrl.hrl_deptid = q.qms_deptid)
            LEFT JOIN hms_roomlist hrl_kb ON (hrl_kb.hrl_id = q.qms_roomid AND hrl_kb.hrl_deptid = 'KB')
            LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND k.hrk_deptid = q.qms_deptid AND k.hrk_code::varchar = q.qms_specialty_code::varchar)
            LEFT JOIN hms_roomlist_kios k_kb ON (k_kb.hrk_id = q.qms_roomid AND k_kb.hrk_deptid = 'KB' AND k_kb.hrk_code::varchar = q.qms_specialty_code::varchar)
            LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code = k.hrk_code::varchar)
            LEFT JOIN sys_sel s_kb ON (s_kb.ss_id = 'hms_room_kios' AND s_kb.ss_code = k_kb.hrk_code::varchar)
            WHERE q.qms_type = 'ONL'
        `;

            const params: any[] = [];
            let paramIndex = 1;

            if (fromDate) { sql += ` AND qms_appointment_date >= $${paramIndex++}`; params.push(fromDate); }
            if (toDate) { sql += ` AND qms_appointment_date <= $${paramIndex++}`; params.push(toDate); }
            if (status && status !== 'All') { sql += ` AND qms_status = $${paramIndex++}`; params.push(status); }
            if (deptId && deptId !== 'All') {
                sql += ` AND (q.qms_deptid = $${paramIndex} OR q.qms_specialty_code = $${paramIndex} OR d.sd_id = $${paramIndex})`;
                params.push(deptId);
                paramIndex++;
            }
            if (speciality && speciality !== 'All') {
                sql += ` AND (q.qms_specialty_code = $${paramIndex} OR s.ss_desc ILIKE '%' || $${paramIndex} || '%' OR q.qms_deptid = $${paramIndex})`;
                params.push(speciality);
                paramIndex++;
            }
            if (search) {
                sql += ` AND (qms_patientname ILIKE $${paramIndex} OR qms_contact LIKE $${paramIndex} OR CAST(qms_idx AS TEXT) LIKE $${paramIndex} OR qms_docno ILIKE $${paramIndex})`;
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

            // 1. Update hms_schedule_exam status to Scheduled ('S') using the current qms_deptid before modifying qms_deptid
            await query(`
                UPDATE hms_schedule_exam SET hse_status = 'S'
                WHERE hse_deptid = (SELECT qms_deptid FROM qms_patient WHERE qms_idx = $1)
                  AND hse_roomid = (SELECT qms_roomid FROM qms_patient WHERE qms_idx = $1)
                  AND hse_date = (SELECT qms_appointment_date FROM qms_patient WHERE qms_idx = $1)
                  AND hse_time = (SELECT qms_appointment_time FROM qms_patient WHERE qms_idx = $1)
            `, [id]);

            // 2. Update qms_patient status to Scheduled ('S'), and update qms_deptid to the staff's working department if authenticated
            const staffDeptId = (req as any).deptId;
            if (staffDeptId) {
                await query(`UPDATE qms_patient SET qms_status = 'S', qms_deptid = $2, qms_updateddate = NOW() WHERE qms_idx = $1`, [id, staffDeptId]);
            } else {
                await query(`UPDATE qms_patient SET qms_status = 'S', qms_updateddate = NOW() WHERE qms_idx = $1`, [id]);
            }

            // 3. Fetch the updated booking details
            const bookingResult = await query(`
                SELECT q.*, s.ss_desc as "specialtyName", COALESCE(rl.hrl_name, rl.hrl_roomname) as "roomName"
                FROM qms_patient q
                LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND (k.hrk_deptid = q.qms_deptid OR k.hrk_deptid = 'KB') AND k.hrk_code::varchar = q.qms_specialty_code::varchar)
                LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code::varchar = COALESCE(k.hrk_code::varchar, q.qms_specialty_code::varchar))
                LEFT JOIN hms_roomlist rl ON (rl.hrl_id = q.qms_roomid AND (rl.hrl_deptid = q.qms_deptid OR rl.hrl_deptid = 'KB'))
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
            
            // Release the slot in hms_schedule_exam if no other active bookings exist for it
            await query(`
                UPDATE hms_schedule_exam hse
                SET hse_status = 'O', hse_updateddate = NOW()
                WHERE hse_deptid = (SELECT qms_deptid FROM qms_patient WHERE qms_idx = $1)
                  AND hse_roomid = (SELECT qms_roomid FROM qms_patient WHERE qms_idx = $1)
                  AND hse_date = (SELECT qms_appointment_date FROM qms_patient WHERE qms_idx = $1)
                  AND hse_time = (SELECT qms_appointment_time FROM qms_patient WHERE qms_idx = $1)
                  AND NOT EXISTS (
                      SELECT 1 FROM qms_patient q
                      WHERE q.qms_deptid = hse.hse_deptid
                        AND q.qms_roomid = hse.hse_roomid
                        AND q.qms_appointment_date = hse.hse_date
                        AND q.qms_appointment_time = hse.hse_time
                        AND q.qms_status IN ('O', 'S')
                        AND q.qms_idx != $1
                  )
            `, [id]);

            // Query booking details to send cancellation SMS
            const bookingDetails = await query(`
                SELECT q.*, s.ss_desc as "specialtyName", rl.hrl_roomname as "roomName"
                FROM qms_patient q
                LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND (k.hrk_deptid = q.qms_deptid OR k.hrk_deptid = 'KB') AND k.hrk_code::varchar = q.qms_specialty_code::varchar)
                LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code = k.hrk_code::varchar)
                LEFT JOIN hms_roomlist rl ON (rl.hrl_id = q.qms_roomid AND (rl.hrl_deptid = q.qms_deptid OR rl.hrl_deptid = 'KB'))
                WHERE q.qms_idx = $1
            `, [id]);

            if (bookingDetails.rows.length > 0) {
                const bookingData = bookingDetails.rows[0];
                const d = new Date(bookingData.qms_appointment_date);
                const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

                try {
                    await notificationService.sendSMS(bookingData.qms_contact, 'booking_cancellation', {
                        name: bookingData.qms_patientname, patientName: bookingData.qms_patientname,
                        date: formattedDate, time: bookingData.qms_appointment_time,
                        bookingId: bookingData.qms_idx, receptNo: bookingData.qms_receptno,
                        queueNumber: bookingData.qms_receptno, specialtyName: bookingData.specialtyName || '',
                        roomName: bookingData.roomName || '', deptId: bookingData.qms_deptid,
                        patientType: bookingData.qms_is_insurance ? 'BH' : 'DV',
                        reason: reason || 'Bệnh viện từ chối lịch hẹn'
                    });
                } catch (smsErr: any) {
                    console.warn('⚠️ Warning: Failed to send rejection SMS:', smsErr.message);
                }
            }

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

            // Query booking data BEFORE updating so we still have it for SMS
            const bookingDetails = await query(`
                SELECT q.*, rl.hrl_roomname as "roomName"
                FROM qms_patient q
                LEFT JOIN hms_roomlist rl ON (rl.hrl_id = q.qms_roomid AND rl.hrl_deptid = q.qms_deptid)
                WHERE q.qms_idx = $1
            `, [id]);

            await query(`UPDATE qms_patient SET qms_status = 'C', qms_comment = $2, qms_updateddate = NOW() WHERE qms_idx = $1`, [id, reason || 'Người dùng hủy']);
            
            // Release the slot in hms_schedule_exam if no other active bookings exist for it
            await query(`
                UPDATE hms_schedule_exam hse
                SET hse_status = 'O', hse_updateddate = NOW()
                WHERE hse_deptid = (SELECT qms_deptid FROM qms_patient WHERE qms_idx = $1)
                  AND hse_roomid = (SELECT qms_roomid FROM qms_patient WHERE qms_idx = $1)
                  AND hse_date = (SELECT qms_appointment_date FROM qms_patient WHERE qms_idx = $1)
                  AND hse_time = (SELECT qms_appointment_time FROM qms_patient WHERE qms_idx = $1)
                  AND NOT EXISTS (
                      SELECT 1 FROM qms_patient q
                      WHERE q.qms_deptid = hse.hse_deptid
                        AND q.qms_roomid = hse.hse_roomid
                        AND q.qms_appointment_date = hse.hse_date
                        AND q.qms_appointment_time = hse.hse_time
                        AND q.qms_status IN ('O', 'S')
                        AND q.qms_idx != $1
                  )
            `, [id]);

            // Send cancellation SMS
            if (bookingDetails.rows.length > 0) {
                const bookingData = bookingDetails.rows[0];
                const d = new Date(bookingData.qms_appointment_date);
                const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                try {
                    await notificationService.sendSMS(bookingData.qms_contact, 'booking_cancellation', {
                        name: bookingData.qms_patientname, patientName: bookingData.qms_patientname,
                        date: formattedDate, time: bookingData.qms_appointment_time,
                        bookingId: bookingData.qms_idx, receptNo: bookingData.qms_receptno,
                        queueNumber: bookingData.qms_receptno, roomName: bookingData.roomName || '',
                        deptId: bookingData.qms_deptid,
                        patientType: bookingData.qms_is_insurance ? 'BH' : 'DV',
                        reason: reason || 'Người dùng yêu cầu hủy'
                    });
                } catch (smsErr: any) {
                    console.warn('⚠️ Warning: Failed to send cancellation SMS:', smsErr.message);
                }
            }

            return res.json({ success: true, message: 'Đã hủy lịch hẹn' });
        } catch (error) {
            console.error('Error cancelling booking:', error);
            return res.status(500).json({ error: 'Không thể hủy lịch hẹn' });
        }
    }

    /**
     * Resend booking SMS confirmation/approved
     */
    async resendSMS(req: Request, res: Response) {
        try {
            const { id } = (req as any).params;

            const bookingResult = await query(`
                SELECT q.*, s.ss_desc as "specialtyName", COALESCE(rl.hrl_name, rl.hrl_roomname) as "roomName"
                FROM qms_patient q
                LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND (k.hrk_deptid = q.qms_deptid OR k.hrk_deptid = 'KB') AND k.hrk_code::varchar = q.qms_specialty_code::varchar)
                LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code::varchar = COALESCE(k.hrk_code::varchar, q.qms_specialty_code::varchar))
                LEFT JOIN hms_roomlist rl ON (rl.hrl_id = q.qms_roomid AND (rl.hrl_deptid = q.qms_deptid OR rl.hrl_deptid = 'KB'))
                WHERE q.qms_idx = $1
            `, [id]);

            if (bookingResult.rows.length === 0) {
                return res.status(404).json({ error: 'Không tìm thấy booking' });
            }

            const bookingData = bookingResult.rows[0];
            const d = new Date(bookingData.qms_appointment_date);
            const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

            // Determine if it was approved ('S') or pending ('O')
            const smsType = bookingData.qms_status === 'S' ? 'booking_approved' : 'booking_confirmation';

            await notificationService.sendSMS(bookingData.qms_contact, smsType, {
                name: bookingData.qms_patientname, patientName: bookingData.qms_patientname,
                date: formattedDate, time: bookingData.qms_appointment_time,
                bookingId: bookingData.qms_idx, receptNo: bookingData.qms_receptno,
                queueNumber: bookingData.qms_receptno, specialtyName: bookingData.specialtyName || '',
                roomName: bookingData.roomName || '', deptId: bookingData.qms_deptid,
                patientType: bookingData.qms_is_insurance ? 'BH' : 'DV'
            });

            return res.json({ success: true, message: 'Đã gửi lại tin nhắn thành công' });
        } catch (error: any) {
            console.error('Error resending SMS:', error);
            return res.status(500).json({ error: 'Không thể gửi lại tin nhắn: ' + error.message });
        }
    }

    /**
     * Get SMS history for a specific booking
     */
    async getSMSHistory(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const bookingIdNum = Number(id);
            let logs = await smsTemplateService.getSMSLogsByBooking(bookingIdNum);

            if (!logs || logs.length === 0) {
                // Fetch booking details from qms_patient with verified column names
                const bookingRes = await query(`
                    SELECT q.*, s.ss_desc as "specialtyName", rl.hrl_roomname as "roomName"
                    FROM qms_patient q
                    LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND (k.hrk_deptid = q.qms_deptid OR k.hrk_deptid = 'KB') AND k.hrk_code::varchar = q.qms_specialty_code::varchar)
                    LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code = k.hrk_code::varchar)
                    LEFT JOIN hms_roomlist rl ON (rl.hrl_id = q.qms_roomid AND (rl.hrl_deptid = q.qms_deptid OR rl.hrl_deptid = 'KB'))
                    WHERE q.qms_idx = $1 OR q.qms_docno = $1
                    ORDER BY q.qms_idx DESC
                    LIMIT 1
                `, [bookingIdNum]);

                if (bookingRes.rows.length > 0) {
                    const b = bookingRes.rows[0];
                    const d = b.qms_appointment_date ? new Date(b.qms_appointment_date) : null;
                    const dateStr = d ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` : '';
                    const timeStr = b.qms_appointment_time || '';
                    const roomInfo = b.roomName ? ` (${b.roomName})` : '';
                    const specInfo = b.specialtyName ? ` CK: ${b.specialtyName}` : '';
                    const brand = process.env.SMS_BRAND_NAME || 'VIMES';
                    const patientType = b.qms_is_insurance ? 'BH' : 'DV';

                    let previewContent = `[${brand}] Chuc mung ${b.qms_patientname}! Lich kham vao ${dateStr} luc ${timeStr}${specInfo}${roomInfo} da duoc duyet. STT: ${b.qms_receptno || 'Dự kiến'}.`;

                    try {
                        const template = await smsTemplateService.getTemplate('approved', b.qms_deptid, patientType);
                        if (template && template.template_content) {
                            previewContent = notificationService.formatMessage(template.template_content, {
                                patientName: b.qms_patientname,
                                bookingDate: dateStr,
                                date: dateStr,
                                bookingTime: timeStr,
                                time: timeStr,
                                queueNumber: b.qms_receptno || '',
                                receptNo: b.qms_receptno || '',
                                deptId: b.qms_deptid,
                                roomName: b.roomName,
                                specialtyName: b.specialtyName
                            });
                        }
                    } catch (tplErr) {
                        // Fallback
                    }

                    logs = [{
                        log_id: 0,
                        booking_id: bookingIdNum,
                        patient_name: b.qms_patientname,
                        phone: b.qms_contact,
                        dept_code: b.qms_deptid,
                        patient_type: patientType,
                        sms_type: 'approved',
                        message_content: previewContent,
                        provider: 'SYSTEM_PREVIEW',
                        provider_message_id: null,
                        status: 'PREVIEW' as any,
                        error_message: null,
                        sent_at: new Date().toISOString()
                    }];
                }
            }

            return res.json({ success: true, data: logs });
        } catch (error: any) {
            console.error('Error fetching SMS history:', error);
            return res.status(500).json({ error: 'Không thể lấy lịch sử SMS: ' + error.message });
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
                    COUNT(*) FILTER (WHERE qms_status = 'O') as pending,
                    COUNT(*) FILTER (WHERE qms_status = 'S') as approved,
                    COUNT(*) FILTER (WHERE qms_status = 'C') as rejected,
                    COUNT(*) FILTER (WHERE qms_chkindte IS NOT NULL) as arrived
                FROM qms_patient 
                WHERE qms_type = 'ONL' AND qms_appointment_date BETWEEN $1 AND $2
            `, [startStr, endStr]);

            const rawKpi = kpis.rows[0];
            const kpiData: BookingStats = {
                total: parseInt(String(rawKpi?.total || 0)),
                pending: parseInt(String(rawKpi?.pending || 0)),
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

    /**
     * Get ghost bookings - bookings in status 'O' (pending) with past appointment dates
     * or pending bookings that are blocking slots but have no SMS confirmation
     */
    async getGhostBookings(req: Request, res: Response) {
        try {
            const { date, deptId, hoursThreshold = 2 } = (req as any).query;

            // A "ghost booking" is defined as:
            // 1. A booking with status 'O' (pending) whose appointment date is BEFORE today (expired)
            // 2. OR a booking with status 'O' created more than N hours ago for TODAY, that still hasn't been approved
            let sql = `
                SELECT 
                    q.qms_idx as id,
                    q.qms_patientname as "patientName",
                    q.qms_contact as phone,
                    TO_CHAR(q.qms_birthdate, 'YYYY-MM-DD') as "birthDate",
                    TO_CHAR(q.qms_appointment_date, 'YYYY-MM-DD') as "bookingDate",
                    q.qms_appointment_time as "bookingTime",
                    q.qms_status as status,
                    q.qms_deptid as "deptId",
                    q.qms_roomid as "roomId",
                    d.sd_name as "deptName",
                    hrl.hrl_roomname as "roomName",
                    q.qms_createddate as "createdAt",
                    CASE 
                        WHEN q.qms_appointment_date < CURRENT_DATE THEN 'EXPIRED'
                        WHEN q.qms_createddate < NOW() - INTERVAL '${parseInt(String(hoursThreshold)) || 2} hours' THEN 'STALE'
                        ELSE 'RECENT'
                    END as "ghostType",
                    EXTRACT(EPOCH FROM (NOW() - q.qms_createddate))/3600 as "ageHours"
                FROM qms_patient q
                LEFT JOIN sys_dept d ON (d.sd_id = q.qms_deptid)
                LEFT JOIN hms_roomlist hrl ON (hrl.hrl_deptid = q.qms_deptid AND hrl.hrl_id = q.qms_roomid)
                WHERE q.qms_type = 'ONL'
                  AND q.qms_status = 'O'
                  AND (
                      q.qms_appointment_date < CURRENT_DATE
                      OR (
                          q.qms_appointment_date = CURRENT_DATE
                          AND q.qms_createddate < NOW() - INTERVAL '${parseInt(String(hoursThreshold)) || 2} hours'
                      )
                  )
            `;

            const params: any[] = [];
            let paramIndex = 1;

            if (date) {
                sql += ` AND q.qms_appointment_date = $${paramIndex++}`;
                params.push(date);
            }
            if (deptId && deptId !== 'All') {
                sql += ` AND q.qms_deptid = $${paramIndex++}`;
                params.push(deptId);
            }

            sql += ' ORDER BY q.qms_appointment_date ASC, q.qms_appointment_time ASC';

            const result = await query(sql, params);

            // Also count how many slots would be freed
            const slotCount = result.rows.length;

            return res.json({
                success: true,
                count: slotCount,
                ghosts: result.rows,
                message: slotCount > 0
                    ? `Tìm thấy ${slotCount} số ảo cần hủy`
                    : 'Không có số ảo nào cần xử lý'
            });

        } catch (error: any) {
            console.error('Error getting ghost bookings:', error);
            return res.status(500).json({ error: 'Không thể tìm số ảo: ' + error.message });
        }
    }

    /**
     * Cancel ghost bookings in bulk - releases slots back to available
     */
    async cancelGhostBookings(req: Request, res: Response) {
        try {
            const { ids, reason, deptId, date, hoursThreshold = 2 } = (req as any).body;

            let targetIds: number[] = [];

            if (ids && Array.isArray(ids) && ids.length > 0) {
                // Cancel specific IDs
                targetIds = ids.map(Number).filter(id => !isNaN(id));
            } else {
                // Auto-detect and cancel all ghost bookings matching criteria
                let sql = `
                    SELECT qms_idx FROM qms_patient
                    WHERE qms_type = 'ONL'
                      AND qms_status = 'O'
                      AND (
                          qms_appointment_date < CURRENT_DATE
                          OR (
                              qms_appointment_date = CURRENT_DATE
                              AND qms_createddate < NOW() - INTERVAL '${parseInt(String(hoursThreshold)) || 2} hours'
                          )
                      )
                `;
                const params: any[] = [];
                let paramIndex = 1;
                if (date) { sql += ` AND qms_appointment_date = $${paramIndex++}`; params.push(date); }
                if (deptId && deptId !== 'All') { sql += ` AND qms_deptid = $${paramIndex++}`; params.push(deptId); }

                const autoResult = await query(sql, params);
                targetIds = autoResult.rows.map((r: any) => r.qms_idx);
            }

            if (targetIds.length === 0) {
                return res.json({ success: true, cancelled: 0, message: 'Không có số ảo nào để hủy' });
            }

            const cancelReason = reason || 'Hủy số ảo tự động - quá hạn';
            let cancelledCount = 0;
            let slotsFreed = 0;

            for (const id of targetIds) {
                try {
                    // Cancel the booking
                    await query(`
                        UPDATE qms_patient 
                        SET qms_status = 'C', 
                            qms_comment = $2, 
                            qms_updateddate = NOW() 
                        WHERE qms_idx = $1 AND qms_status = 'O'
                    `, [id, cancelReason]);

                    // Release the slot in hms_schedule_exam if no other active bookings
                    const slotResult = await query(`
                        UPDATE hms_schedule_exam hse
                        SET hse_status = 'O', hse_updateddate = NOW()
                        WHERE hse_deptid = (SELECT qms_deptid FROM qms_patient WHERE qms_idx = $1)
                          AND hse_roomid = (SELECT qms_roomid FROM qms_patient WHERE qms_idx = $1)
                          AND hse_date = (SELECT qms_appointment_date FROM qms_patient WHERE qms_idx = $1)
                          AND hse_time = (SELECT qms_appointment_time FROM qms_patient WHERE qms_idx = $1)
                          AND NOT EXISTS (
                              SELECT 1 FROM qms_patient q
                              WHERE q.qms_deptid = hse.hse_deptid
                                AND q.qms_roomid = hse.hse_roomid
                                AND q.qms_appointment_date = hse.hse_date
                                AND q.qms_appointment_time = hse.hse_time
                                AND q.qms_status IN ('O', 'S')
                                AND q.qms_idx != $1
                          )
                    `, [id]);

                    cancelledCount++;
                    if (slotResult.rowCount && slotResult.rowCount > 0) slotsFreed++;
                } catch (itemErr) {
                    console.error(`Error cancelling ghost booking ${id}:`, itemErr);
                }
            }

            return res.json({
                success: true,
                cancelled: cancelledCount,
                slotsFreed,
                message: `Đã hủy ${cancelledCount} số ảo, giải phóng ${slotsFreed} khung giờ`
            });

        } catch (error: any) {
            console.error('Error cancelling ghost bookings:', error);
            return res.status(500).json({ error: 'Không thể hủy số ảo: ' + error.message });
        }
    }
}

export default new BookingManagementController();
