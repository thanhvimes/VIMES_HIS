// ==================== BOOKING CONTROLLER - HIS INTEGRATION ====================
// File: backend/src/controllers/booking.controller.js
// Using: qms_patient, hms_schedule_exam, hms_roomlist

const db = require('../config/database');
const notificationService = require('../services/notification.service');

class BookingController {

    // ==================== DANH MỤC ====================

    // Lấy danh sách tỉnh/thành phố
    async getProvinces(req, res) {
        try {
            const result = await db.query(
                `SELECT sp_id as id, sp_name as name FROM sys_prov WHERE sp_isactive = 'Y' ORDER BY sp_name`
            );
            res.json(result.rows);
        } catch (error) {
            console.error('Error getting provinces:', error);
            res.status(500).json({ error: 'Không thể lấy danh sách tỉnh/TP' });
        }
    }

    // Lấy danh sách phường/xã theo tỉnh (Vietnam's new 2-level structure)
    async getWards(req, res) {
        try {
            const { provinceId } = req.params;
            const result = await db.query(
                "SELECT sv_id as id, sv_name as name FROM sys_vill WHERE sv_isactive = 'Y' AND sv_provid = $1 ORDER BY sv_name",
                [provinceId]
            );
            res.json(result.rows);
        } catch (error) {
            console.error('Error getting wards:', error);
            res.status(500).json({ error: 'Không thể lấy danh sách phường/xã' });
        }
    }

    // Lấy danh sách KHOA (từ sys_dept)
    async getDepartments(req, res) {
        try {
            const result = await db.query(`
                SELECT 
                    sd_id as id,
                    sd_name as name,
                    sd_type as type
                FROM sys_dept
                WHERE sd_type = 'KB' AND sd_isactive = 'Y'
                ORDER BY sd_name
            `);
            console.log('lay danh sach khoa', result.rows);
            res.json(result.rows);
        } catch (error) {
            console.error('Error getting departments:', error);
            res.status(500).json({ error: 'Không thể lấy danh sách khoa' });
        }
    }

    // Lấy danh sách LOẠI KHÁM CHUYÊN KHOA (hrk_code + tên từ sys_sel)
    // Lọc theo khoa của user đăng nhập
    async getSpecialities(req, res) {
        try {
            // Lấy thông tin user từ token (nếu có middleware)
            // Hoặc từ query params để test
            const userDeptId = req.query.deptId || req.user?.deptId;

            let query = `
                SELECT DISTINCT 
                    hrk_code as id, 
                    ss_desc as name,
                    hrk_deptid as "deptId"
                FROM hms_roomlist_kios
                LEFT JOIN sys_sel ON (ss_id = 'hms_room_kios' AND CAST(ss_code AS INT) = hrk_code)
                WHERE hrk_active = 'Y'
            `;

            const params = [];

            // Nếu có deptId, lọc theo khoa
            if (userDeptId) {
                query += ` AND hrk_deptid = $1`;
                params.push(userDeptId);
            }

            query += ` ORDER BY hrk_code`;
            console.log(query, params);
            const result = await db.query(query, params);

            res.json(result.rows);
        } catch (error) {
            console.error('Error getting specialities:', error);
            res.status(500).json({ error: 'Không thể lấy danh sách chuyên khoa: ' + error.message });
        }
    }

    // Lấy danh sách phòng theo LOẠI KHÁM CHUYÊN KHOA (hrk_code)
    async getRoomsBySpeciality(req, res) {
        try {
            const { specialityCode } = req.params;
            const userDeptId = req.query.deptId || req.user?.deptId;
            console.log('getRoomsBySpeciality, userDeptId', userDeptId);
            // Lấy danh sách phòng hỗ trợ loại khám này từ hms_roomlist_kios
            const result = await db.query(`
                SELECT DISTINCT
                    hrk_id as id,
                    hrk_deptid as "deptId",
                    r.hrl_roomname as name,
                    hrk_code as code
                FROM hms_roomlist_kios k
                LEFT JOIN hms_roomlist r ON (k.hrk_deptid = r.hrl_deptid AND k.hrk_id = r.hrl_id)
                WHERE hrk_code = $1 
                  AND hrk_active = 'Y'
                  AND hrk_deptid = $2
                ORDER BY hrk_id
            `, [specialityCode, userDeptId]);
            res.json(result.rows);
        } catch (error) {
            console.error('Error getting rooms by speciality:', error);
            res.status(500).json({ error: 'Không thể lấy danh sách phòng: ' + error.message });
        }
    }

    // Lấy slots khả dụng
    async getAvailableSlots(req, res) {
        try {
            const { deptId, roomId, date } = req.query;

            if (!deptId || !roomId || !date) {
                return res.status(400).json({ error: 'Thiếu deptId, roomId hoặc date' });
            }

            // Lấy slots từ hms_schedule_exam
            const result = await db.query(`
                SELECT 
                    hse_time as time,
                    hse_receptno as "receptNo",
                    hse_status as status,
                    hse_doctor as doctor,
                    hse_type as type
                FROM hms_schedule_exam
                WHERE hse_deptid = $1
                  AND hse_roomid = $2
                  AND hse_date = $3
                  AND hse_status = 'O'
                ORDER BY hse_time
            `, [deptId, roomId, date]);

            res.json(result.rows);
        } catch (error) {
            console.error('Error getting available slots:', error);
            res.status(500).json({ error: 'Không thể lấy khung giờ' });
        }
    }

    // ==================== BOOKING MANAGEMENT ====================

    // Đăng ký booking mới (SỬ DỤNG STORED PROCEDURE)
    async registerBooking(req, res) {
        try {
            const {
                idCard, name, birthDate, gender, ethnic,
                provinceId, districtId, wardId, address, phone,
                deptId, roomId, bookingDate, bookingTime, reason,
                occupation, doctor, email, idCardIssuedDate,
                isPriority, isInsurance, specialityCode
            } = req.body;

            // userDeptId might be passed in 'doctor' field from staff form
            const userDeptId = doctor || 'KB';

            console.log('📝 New registration request:', req.body);

            // Validate required fields (roomId is now OPTIONAL, phone is REQUIRED)
            if (!name || !phone || !birthDate || !gender || !deptId || !bookingDate || !bookingTime) {
                const missing = [];
                if (!name) missing.push('name');
                if (!phone) missing.push('phone');
                if (!birthDate) missing.push('birthDate');
                if (!gender) missing.push('gender');
                if (!deptId) missing.push('deptId');
                if (!bookingDate) missing.push('bookingDate');
                if (!bookingTime) missing.push('bookingTime');

                console.error('❌ Missing required fields:', missing);
                return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: ' + missing.join(', ') });
            }

            // Auto-assign room if not provided
            let assignedRoomId = roomId;
            if (!assignedRoomId) {
                console.log(`🔄 Auto-assigning room for speciality ${deptId} at ${bookingTime} with load balancing...`);

                // Get all rooms for this specialty that HAVE the requested slot AVAILABLE
                const roomsWithSlotResult = await db.query(`
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
                    console.error(`❌ No rooms available for speciality ${deptId} at ${bookingTime} on ${bookingDate}`);
                    return res.status(400).json({
                        error: `Không tìm thấy phòng khám nào có khung giờ ${bookingTime} vào ngày ${bookingDate}.`
                    });
                }

                // The first one in the list has the minimum bookings thanks to ORDER BY
                assignedRoomId = roomsWithSlotResult.rows[0].hrk_id;

                console.log('✅ Room assignment (Time-Aware load balanced):', {
                    selectedRoom: assignedRoomId,
                    availableRoomsCount: roomsWithSlotResult.rows.length,
                    reason: `Room ${assignedRoomId} has the requested slot and least total bookings.`
                });
            }

            // Gọi stored procedure qms_patient_create_booking (MỚI: 23 tham số)
            console.log('� Calling qms_patient_create_booking with fixed mapping...');

            const result = await db.query(`
                SELECT qms_patient_create_booking(
                    $1, $2, $3, $4, $5, 
                    $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15,
                    $16, $17, $18, $19, $20,
                    $21, $22, $23
                ) as booking_id;
            `, [
                idCard,             // p_cccd (1)
                name,               // p_ho_ten (2)
                birthDate,          // p_ngay_sinh (3)
                gender,             // p_gioi_tinh (4)
                ethnic || '1',      // p_dan_toc (5)
                provinceId,         // p_ma_tinh (6)
                districtId,         // p_ma_quan_huyen (7)
                wardId,             // p_ma_phuong_xa (8)
                address,            // p_dia_chi_chi_tiet (9)
                phone,              // p_so_dien_thoai (10)
                userDeptId,         // p_ma_khoa (11) (FIXED: was deptId which is specialty code)
                assignedRoomId,     // p_ma_phong_kham (12)
                bookingDate,        // p_ngay_hen (13)
                bookingTime,        // p_gio_hen (14)
                reason,             // p_ly_do_kham (15)
                occupation || 0,    // p_occupation (16)
                doctor || '',       // p_doctor (17)
                email || '',        // p_email (18)
                'ONL',                          // p_type (19)
                idCardIssuedDate === "" ? null : idCardIssuedDate, // p_ngay_cap_cccd (20)
                isPriority || false,            // p_is_priority (21)
                isInsurance || false,            // p_is_insurance (22)
                specialityCode || deptId || ''   // p_ma_chuyen_khoa (23)
            ]);

            console.log('📦 Stored procedure result:', result.rows[0]);
            console.log('📍 Assigned Room ID:', assignedRoomId);

            const bookingId = result.rows[0].booking_id;

            // Xử lý error codes từ stored procedure
            if (bookingId === -1) {
                return res.status(400).json({
                    error: 'Khung giờ này đã được đặt. Vui lòng chọn giờ khác.'
                });
            }
            if (bookingId === -2) {
                return res.status(400).json({
                    error: 'Khung giờ chưa được tạo. Vui lòng liên hệ quản trị viên.'
                });
            }
            if (bookingId === -3) {
                return res.status(400).json({
                    error: 'Bạn đã đăng ký khám trong ngày này rồi.'
                });
            }

            // ✅ Lấy đầy đủ thông tin để gửi SMS theo template chuẩn
            const bookingDetails = await db.query(`
                SELECT 
                    q.*,
                    s.ss_desc as "specialtyName",
                    rl.hrl_roomname as "roomName"
                FROM qms_patient q
                LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND k.hrk_deptid = q.qms_deptid)
                LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code = k.hrk_code::varchar)
                LEFT JOIN hms_roomlist rl ON (rl.hrl_deptid = q.qms_deptid AND rl.hrl_id = q.qms_roomid)
                WHERE q.qms_idx = $1
            `, [bookingId]);

            if (bookingDetails.rows.length > 0) {
                const fullData = bookingDetails.rows[0];
                const d = new Date(fullData.qms_appointment_date);
                const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

                await notificationService.sendSMS(
                    phone,
                    'booking_confirmation',
                    {
                        name: fullData.qms_patientname,
                        patientName: fullData.qms_patientname,
                        date: formattedDate,
                        time: fullData.qms_appointment_time,
                        bookingId: fullData.qms_idx,
                        receptNo: fullData.qms_receptno,
                        queueNumber: fullData.qms_receptno,
                        specialtyName: fullData.specialtyName || '',
                        roomName: fullData.roomName || '',
                        deptId: fullData.qms_deptid,
                        patientType: isInsurance ? 'BH' : 'DV'
                    }
                );
            }

            res.json({
                success: true,
                bookingId,
                roomId: assignedRoomId,
                message: 'Đăng ký thành công'
            });

        } catch (error) {
            console.error('❌ Error registering booking:', error);
            console.error('❌ Error stack:', error.stack);
            res.status(500).json({ error: 'Không thể đăng ký booking: ' + error.message });
        }
    }

    // Lấy danh sách bookings
    async getBookingList(req, res) {
        try {
            const { fromDate, toDate, status, speciality, search } = req.query;

            let query = `
            SELECT 
                q.qms_idx as id,
                q.qms_idx as "bookingId",
                q.qms_idcard as "idCard",
                q.qms_patientname as "patientName",
                q.qms_contact as phone,
                TO_CHAR(q.qms_birthdate, 'YYYY-MM-DD') as "birthDate",
                q.qms_sex as gender,
                q.qms_deptid as "deptId",
                d.sd_name as "deptName",
                q.qms_roomid as "roomId",
                TO_CHAR(q.qms_appointment_date, 'YYYY-MM-DD') as "bookingDate",
                q.qms_appointment_time as "bookingTime",
                q.qms_status as status,
                q.qms_reason as reason,
                q.qms_receptno as "receptNo",
                q.qms_docno as "docNo",
                q.qms_doctor as doctor,
                q.qms_createddate as "createdAt",
                q.qms_specialty_code as "specialtyCode",
                s.ss_desc as "specialityName",
                hrl.hrl_roomname as "roomName"
            FROM qms_patient q
            LEFT JOIN sys_dept d ON (d.sd_id = q.qms_deptid)
            LEFT JOIN hms_roomlist hrl ON (hrl.hrl_deptid = q.qms_deptid AND hrl.hrl_id = q.qms_roomid)
            LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND k.hrk_deptid = q.qms_deptid)
            LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code = k.hrk_code::varchar)
            WHERE q.qms_type = 'ONL'
        `;

            const params = [];
            let paramIndex = 1;

            if (fromDate) {
                query += ` AND qms_appointment_date >= $${paramIndex}`;
                params.push(fromDate);
                paramIndex++;
            }

            if (toDate) {
                query += ` AND qms_appointment_date <= $${paramIndex}`;
                params.push(toDate);
                paramIndex++;
            }

            if (status && status !== 'All') {
                query += ` AND qms_status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            if (speciality && speciality !== 'All') {
                query += ` AND qms_deptid = $${paramIndex}`;
                params.push(speciality);
                paramIndex++;
            }

            if (search) {
                query += ` AND(qms_patientname ILIKE $${paramIndex} OR qms_contact LIKE $${paramIndex} OR CAST(qms_idx AS TEXT) LIKE $${paramIndex})`;
                params.push(`% ${search} % `);
                paramIndex++;
            }

            query += ' ORDER BY qms_appointment_date DESC, qms_appointment_time DESC';
            console.log(query);
            const result = await db.query(query, params);
            console.log(result.rows);
            res.json(result.rows);

        } catch (error) {
            console.error('Error getting booking list:', error);
            res.status(500).json({ error: 'Không thể lấy danh sách booking' });
        }
    }

    // Duyệt booking
    async approveBooking(req, res) {
        try {
            const { id } = req.params;

            // Update qms_patient status
            await db.query(`
                UPDATE qms_patient 
                SET qms_status = 'S',
                qms_updateddate = NOW()
                WHERE qms_idx = $1
                `, [id]);

            // Update hms_schedule_exam slot status
            await db.query(`
                UPDATE hms_schedule_exam
                SET hse_status = 'S'
                WHERE hse_deptid = (SELECT qms_deptid FROM qms_patient WHERE qms_idx = $1)
                  AND hse_roomid = (SELECT qms_roomid FROM qms_patient WHERE qms_idx = $1)
                  AND hse_date = (SELECT qms_appointment_date FROM qms_patient WHERE qms_idx = $1)
                  AND hse_time = (SELECT qms_appointment_time FROM qms_patient WHERE qms_idx = $1)
            `, [id]);

            // Get booking info để gửi SMS
            const booking = await db.query(`
                SELECT 
                    q.*,
                    s.ss_desc as "specialtyName",
                    rl.hrl_roomname as "roomName"
                FROM qms_patient q
                LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND k.hrk_deptid = q.qms_deptid)
                LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code = k.hrk_code::varchar)
                LEFT JOIN hms_roomlist rl ON (rl.hrl_deptid = q.qms_deptid AND rl.hrl_id = q.qms_roomid)
                WHERE q.qms_idx = $1
            `, [id]);

            if (booking.rows.length > 0) {
                const bookingData = booking.rows[0];
                // Handle Date object properly (bookingData.qms_appointment_date is a Date object)
                const datePart = new Date(bookingData.qms_appointment_date).toISOString().split('T')[0];
                // Ensure time has seconds for TO_TIMESTAMP
                let timePart = bookingData.qms_appointment_time || '08:00:00';
                if (timePart.length === 5) timePart += ':00';
                const examDate = `${datePart} ${timePart}`;

                const result = await db.query(`
                SELECT * FROM qms_register_ticket_online(
                    $1, $2, $3, $4, $5, 
                    $6, $7::date, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16,
                    $17::date, $18, $19
                );`, [
                    id,                                 // p_number_idx
                    "",                                 // p_kiosk_id
                    "",                                 // p_kiosk_type
                    bookingData.qms_patientname,        // p_patient_name
                    bookingData.qms_idcard,             // p_identity_number
                    bookingData.qms_contact,            // p_phone
                    bookingData.qms_birthdate,          // p_dob
                    bookingData.qms_address,            // p_address
                    bookingData.qms_deptid,             // p_department_id
                    bookingData.qms_is_priority || false, // p_is_priority
                    bookingData.qms_is_insurance ? "BHYT" : "", // p_insurance_card
                    bookingData.qms_prov_id,            // p_province_code
                    bookingData.qms_vill_id,            // p_ward_code
                    bookingData.qms_roomid,             // p_roomid
                    bookingData.qms_receptno,           // p_receptno
                    bookingData.qms_sex,                // p_gender
                    bookingData.qms_idcard_issue_date,  // p_identitydate
                    examDate,                           // p_examdate
                    bookingData.qms_specialty_code || '',     // p_speciality_code
                ]);

                console.log('HIS Registration Result:', result.rows[0]);
                const d = new Date(bookingData.qms_appointment_date);
                const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

                // Send SMS
                await notificationService.sendSMS(
                    bookingData.qms_contact,
                    'booking_approved',
                    {
                        name: bookingData.qms_patientname,
                        patientName: bookingData.qms_patientname,
                        date: formattedDate,
                        time: bookingData.qms_appointment_time,
                        bookingId: bookingData.qms_idx,
                        receptNo: bookingData.qms_receptno,
                        queueNumber: bookingData.qms_receptno,
                        specialtyName: bookingData.specialtyName || '',
                        roomName: bookingData.roomName || '',
                        deptId: bookingData.qms_deptid,
                        patientType: bookingData.qms_is_insurance ? 'BH' : 'DV'
                    }
                );

                res.json({
                    success: true,
                    receptNo: bookingData.qms_receptno,
                    message: 'Đã duyệt booking'
                });
            } else {
                res.status(404).json({ error: 'Không tìm thấy booking' });
            }

        } catch (error) {
            console.error('Error approving booking:', error);
            res.status(500).json({ error: 'Không thể duyệt booking' });
        }
    }

    // Từ chối booking
    async rejectBooking(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            await db.query(`
                UPDATE qms_patient 
                SET qms_status = 'C',
                qms_comment = $2,
                qms_updateddate = NOW()
                WHERE qms_idx = $1
                `, [id, reason || 'Từ chối booking']);

            res.json({ success: true, message: 'Đã từ chối booking' });

        } catch (error) {
            console.error('Error rejecting booking:', error);
            res.status(500).json({ error: 'Không thể từ chối booking' });
        }
    }

    // Hủy booking
    async cancelBooking(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            // Update qms_patient
            await db.query(`
                UPDATE qms_patient 
                SET qms_status = 'C',
                qms_comment = $2,
                qms_updateddate = NOW()
                WHERE qms_idx = $1
                `, [id, reason || 'Hủy booking']);

            // Free up the slot in hms_schedule_exam
            await db.query(`
                UPDATE hms_schedule_exam
                SET hse_status = 'O'
                WHERE hse_deptid = (SELECT qms_deptid FROM qms_patient WHERE qms_idx = $1)
                  AND hse_roomid = (SELECT qms_roomid FROM qms_patient WHERE qms_idx = $1)
                  AND hse_date = (SELECT qms_appointment_date FROM qms_patient WHERE qms_idx = $1)
                  AND hse_time = (SELECT qms_appointment_time FROM qms_patient WHERE qms_idx = $1)
            `, [id]);

            res.json({ success: true, message: 'Đã hủy booking' });

        } catch (error) {
            console.error('Error cancelling booking:', error);
            res.status(500).json({ error: 'Không thể hủy booking' });
        }
    }

    // Gửi lại SMS
    async resendSMS(req, res) {
        try {
            const { id } = req.params;

            const booking = await db.query(`
                SELECT 
                    q.*,
                    s.ss_desc as "specialtyName",
                    rl.hrl_roomname as "roomName"
                FROM qms_patient q
                LEFT JOIN hms_roomlist_kios k ON (k.hrk_id = q.qms_roomid AND k.hrk_deptid = q.qms_deptid)
                LEFT JOIN sys_sel s ON (s.ss_id = 'hms_room_kios' AND s.ss_code = k.hrk_code::varchar)
                LEFT JOIN hms_roomlist rl ON (rl.hrl_deptid = q.qms_deptid AND rl.hrl_id = q.qms_roomid)
                WHERE q.qms_idx = $1
            `, [id]);

            if (booking.rows.length > 0) {
                const bookingData = booking.rows[0];
                const d = new Date(bookingData.qms_appointment_date);
                const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

                await notificationService.sendSMS(
                    bookingData.qms_contact,
                    'booking_confirmation',
                    {
                        name: bookingData.qms_patientname,
                        patientName: bookingData.qms_patientname,
                        date: formattedDate,
                        time: bookingData.qms_appointment_time,
                        bookingId: bookingData.qms_idx,
                        receptNo: bookingData.qms_receptno,
                        queueNumber: bookingData.qms_receptno,
                        specialtyName: bookingData.specialtyName || '',
                        roomName: bookingData.roomName || '',
                        deptId: bookingData.qms_deptid,
                        patientType: bookingData.qms_is_insurance ? 'BH' : 'DV'
                    }
                );

                res.json({ success: true, message: 'Đã gửi lại SMS' });
            } else {
                res.status(404).json({ error: 'Không tìm thấy booking' });
            }

        } catch (error) {
            console.error('Error resending SMS:', error);
            res.status(500).json({ error: 'Không thể gửi lại SMS' });
        }
    }

    // Thống kê
    async getStatistics(req, res) {
        try {
            const { startDate, endDate, fromDate, toDate } = req.query;
            // Chấp nhận cả startDate/endDate hoặc fromDate/toDate
            const startStr = fromDate || startDate || '2026-01-01';
            const endStr = toDate || endDate || '2026-12-31';

            // 1. KPIs
            const kpis = await db.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE qms_status = 'S') as approved,
                    COUNT(*) FILTER (WHERE qms_status = 'C') as rejected,
                    COUNT(*) FILTER (WHERE qms_chkindte IS NOT NULL) as arrived
                FROM qms_patient 
                WHERE qms_type = 'ONL' 
                AND qms_appointment_date BETWEEN $1 AND $2
            `, [startStr, endStr]);

            // Growth calculation (mock for now or compare with previous period)
            const kpiData = {
                ...kpis.rows[0],
                total: parseInt(kpis.rows[0]?.total || 0),
                approved: parseInt(kpis.rows[0]?.approved || 0),
                rejected: parseInt(kpis.rows[0]?.rejected || 0),
                arrived: parseInt(kpis.rows[0]?.arrived || 0),
                growth: 12.5 // Mock growth
            };

            // 2. Trends (Daily breakdown)
            const trends = await db.query(`
                SELECT 
                    TO_CHAR(qms_appointment_date, 'DD-MM-YYYY') as name,
                    COUNT(*) as bookings,
                    COUNT(*) FILTER (WHERE qms_chkindte IS NOT NULL) as arrived
                FROM qms_patient
                WHERE qms_type = 'ONL'
                AND qms_appointment_date BETWEEN $1 AND $2
                GROUP BY qms_appointment_date
                ORDER BY qms_appointment_date ASC
            `, [startStr, endStr]);

            // 3. By Speciality
            const specialities = await db.query(`
                SELECT 
                    COALESCE((SELECT ss_desc FROM sys_sel WHERE ss_id = 'hms_roomlist_kios_hrk_code' AND ss_code = q.qms_deptid::varchar), 'Khác') as name,
                    COUNT(*) as value
                FROM qms_patient q
                WHERE q.qms_type = 'ONL'
                AND q.qms_appointment_date BETWEEN $1 AND $2
                GROUP BY q.qms_deptid
                ORDER BY value DESC
            `, [startStr, endStr]);

            // 4. Sources (Mocking based on qms_type if multiple exist, else mock breakdown)
            const sources = [
                { name: 'Web Portal', value: Math.round(kpiData.total * 0.65), color: '#3b82f6' },
                { name: 'Mobile App', value: Math.round(kpiData.total * 0.25), color: '#10b981' },
                { name: 'Zalo MiniApp', value: Math.round(kpiData.total * 0.10), color: '#fbbf24' }
            ];

            res.json({
                kpis: kpiData,
                trends: trends.rows.map(t => ({
                    ...t,
                    bookings: parseInt(t.bookings),
                    arrived: parseInt(t.arrived)
                })),
                specialities: specialities.rows.map(s => ({
                    ...s,
                    value: parseInt(s.value)
                })),
                sources: sources
            });

        } catch (error) {
            console.error('Error getting statistics:', error);
            res.status(500).json({ error: 'Không thể lấy thống kê' });
        }
    }
}

module.exports = new BookingController();
