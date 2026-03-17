
import { Request, Response } from 'express';
import { query } from '../config/db';
import { notificationService } from '../services/notification.service';

export class BookingController {
  // ==================== DANH MỤC ĐỊA GIỚI ====================

  async getProvinces(req: Request, res: Response) {
    try {
      const result = await query('SELECT ma_tinh as id, ten_tinh as name FROM dm_tinh ORDER BY ten_tinh');
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getWards(req: Request, res: Response) {
    const { provinceId } = req.params;
    try {
      // Vietnam's new 2-level structure: Province -> Ward (Tỉnh -> Xã/Phường)
      // dm_huyen table now represents Wards/Communes
      const result = await query('SELECT ma_huyen as id, ten_huyen as name FROM dm_huyen WHERE ma_tinh = $1 ORDER BY ten_huyen', [provinceId]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== CHUYÊN KHOA & SLOT ====================

  async getSpecialities(req: Request, res: Response) {
    try {
      const result = await query('SELECT id, name, quota_per_slot as "quotaPerSlot", description FROM dm_chuyenkhoa_online WHERE active = true ORDER BY name');
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAvailableSlots(req: Request, res: Response) {
    const { specialityId, date } = req.query;

    // Validate required parameters
    if (!specialityId || !date) {
      return res.status(400).json({ error: 'Thiếu specialityId hoặc date' });
    }

    try {
      // Logic: Lấy danh sách khung giờ và JOIN với bảng bookings để đếm số lượng đã đặt
      const sql = `
        SELECT
          t.time_slot,
          t.max_quota,
          COALESCE(COUNT(b.id), 0)::int as current_count,
          (COALESCE(COUNT(b.id), 0) >= t.max_quota) as is_full
        FROM dm_khung_gio t
        LEFT JOIN bookings b ON t.time_slot = b.booking_time
          AND b.booking_date = $2
          AND b.speciality_id = $1
          AND b.status NOT IN ('Rejected', 'Cancelled')
        WHERE t.active = true
        GROUP BY t.time_slot, t.max_quota
        ORDER BY t.time_slot
      `;
      const result = await query(sql, [specialityId, date]);

      // Transform to camelCase format that frontend expects
      const slots = result.rows.map((row: any) => ({
        time: row.time_slot,
        maxQuota: parseInt(row.max_quota),
        currentCount: parseInt(row.current_count),
        isFull: row.is_full
      }));

      // Debug: Log the actual response format
      console.log('Available slots response:', result);

      res.json(slots);
    } catch (error: any) {
      console.error('Get available slots error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== NGHIỆP VỤ ĐẶT LỊCH ====================

  async registerBooking(req: Request, res: Response) {
    const data = req.body;
    try {
      const bookingId = `BK${Date.now().toString().slice(-6)}`;

      // Check if slot is full
      const slotCheck = await query(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE booking_date = $1 AND booking_time = $2 AND speciality_id = $3 AND status NOT IN ('Rejected', 'Cancelled')`,
        [data.date, data.time, data.specialityId]
      );

      const slotInfo = await query(
        'SELECT max_quota FROM dm_khung_gio WHERE time_slot = $1',
        [data.time]
      );

      if (slotCheck.rows[0].count >= slotInfo.rows[0].max_quota) {
        return res.status(400).json({ error: 'Khung giờ này đã đầy. Vui lòng chọn giờ khác.' });
      }

      // Check duplicate booking (same phone, same date, same time)
      const duplicateCheck = await query(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE phone = $1 AND booking_date = $2 AND booking_time = $3 AND status NOT IN ('Rejected', 'Cancelled')`,
        [data.phone, data.date, data.time]
      );

      if (duplicateCheck.rows[0].count > 0) {
        return res.status(400).json({ error: 'Bạn đã có lịch hẹn trong khung giờ này.' });
      }

      const sql = `
        INSERT INTO bookings (
          booking_id, patient_id, patient_name, phone, dob, gender, identity_card, identity_issue_date,
          province_id, district_id, ward_id, address_detail,
          speciality_id, booking_date, booking_time, reason, is_priority, status, source
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'Pending', $18)
        RETURNING booking_id
      `;
      const params = [
        bookingId, data.patientId, data.name, data.phone, data.dob, data.gender,
        data.identityCard, data.identityIssueDate,
        data.provinceId, data.districtId, data.wardId, data.addressDetail,
        data.specialityId, data.date, data.time, data.reason, data.isPriority,
        data.source || 'Portal'
      ];

      await query(sql, params);

      // Log action
      await this.logAction(bookingId, 'CREATED', null, 'Booking created via ' + (data.source || 'Portal'));

      res.json({ success: true, bookingId });
    } catch (error: any) {
      console.error('Register booking error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getBookingList(req: Request, res: Response) {
    const { fromDate, toDate, status, speciality, search } = req.query;
    try {
      let sql = `
        SELECT 
          b.*,
          s.name as speciality_name
        FROM bookings b
        LEFT JOIN dm_chuyenkhoa_online s ON b.speciality_id = s.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let idx = 1;

      if (fromDate) {
        sql += ` AND b.booking_date >= $${idx++}`;
        params.push(fromDate);
      }
      if (toDate) {
        sql += ` AND b.booking_date <= $${idx++}`;
        params.push(toDate);
      }
      if (status && status !== 'All') {
        sql += ` AND b.status = $${idx++}`;
        params.push(status);
      }
      if (speciality && speciality !== 'All') {
        sql += ` AND b.speciality_id = $${idx++}`;
        params.push(speciality);
      }
      if (search) {
        sql += ` AND (b.patient_name ILIKE $${idx} OR b.phone ILIKE $${idx})`;
        params.push(`%${search}%`);
        idx++;
      }

      sql += ' ORDER BY b.booking_date DESC, b.booking_time DESC';

      const result = await query(sql, params);

      // Transform to match frontend interface
      const bookings = result.rows.map((row: any) => ({
        id: row.booking_id,
        bookingId: row.booking_id,
        patientId: row.patient_id,
        name: row.patient_name,
        phone: row.phone,
        dob: row.dob,
        gender: row.gender,
        speciality: row.speciality_name || row.speciality_id,
        date: row.booking_date,
        time: row.booking_time,
        source: row.source,
        status: row.status,
        smsStatus: row.sms_status,
        createdAt: row.created_at,
        reason: row.reason,
        queueNumber: row.queue_number
      }));

      res.json(bookings);
    } catch (error: any) {
      console.error('Get booking list error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== DUYỆT & TỪ CHỐI ====================

  async approveBooking(req: Request, res: Response) {
    const { id } = req.params;
    try {
      // Get booking info
      const bookingResult = await query(
        `SELECT b.*, s.name as speciality_name 
         FROM bookings b 
         LEFT JOIN dm_chuyenkhoa_online s ON b.speciality_id = s.id
         WHERE b.booking_id = $1`,
        [id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const booking = bookingResult.rows[0];

      // Generate queue number (simple: count bookings on same date + 100)
      const queueResult = await query(
        `SELECT COUNT(*) as count FROM bookings 
         WHERE booking_date = $1 AND status = 'Approved'`,
        [booking.booking_date]
      );
      const queueNumber = parseInt(queueResult.rows[0].count) + 100;

      // Update status
      await query(
        `UPDATE bookings 
         SET status = 'Approved', sms_status = 'Sent', queue_number = $1, updated_at = NOW() 
         WHERE booking_id = $2`,
        [queueNumber, id]
      );

      // Log action
      await this.logAction(id, 'APPROVED', req.body.userId, `Approved with queue number ${queueNumber}`);

      // Send SMS notification
      try {
        await notificationService.sendBookingConfirmation({
          bookingId: id,
          patientName: booking.patient_name,
          phone: booking.phone,
          speciality: booking.speciality_name || booking.speciality_id,
          date: booking.booking_date,
          time: booking.booking_time,
          queueNumber
        });

        await this.logAction(id, 'SMS_SENT', 'system', 'Confirmation SMS sent successfully');
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
        await this.logAction(id, 'SMS_FAILED', 'system', 'Failed to send SMS');
      }

      res.json({ success: true, queueNumber });
    } catch (error: any) {
      console.error('Approve booking error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async rejectBooking(req: Request, res: Response) {
    const { id } = req.params;
    const { reason, userId } = req.body;

    try {
      // Get booking info
      const bookingResult = await query(
        `SELECT b.*, s.name as speciality_name 
         FROM bookings b 
         LEFT JOIN dm_chuyenkhoa_online s ON b.speciality_id = s.id
         WHERE b.booking_id = $1`,
        [id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const booking = bookingResult.rows[0];

      await query(
        'UPDATE bookings SET status = $1, updated_at = NOW() WHERE booking_id = $2',
        ['Rejected', id]
      );

      await this.logAction(id, 'REJECTED', userId, reason || 'No reason provided');

      // Send cancellation SMS
      try {
        await notificationService.sendBookingCancellation(
          {
            bookingId: id,
            patientName: booking.patient_name,
            phone: booking.phone,
            speciality: booking.speciality_name,
            date: booking.booking_date,
            time: booking.booking_time
          },
          reason || 'Bác sĩ bận'
        );
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Reject booking error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async cancelBooking(req: Request, res: Response) {
    const { id } = req.params;
    const { reason } = req.body;

    try {
      await query(
        'UPDATE bookings SET status = $1, updated_at = NOW() WHERE booking_id = $2',
        ['Cancelled', id]
      );

      await this.logAction(id, 'CANCELLED', null, reason || 'Cancelled by patient');

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async rescheduleBooking(req: Request, res: Response) {
    const { id } = req.params;
    const { newDate, newTime, userId } = req.body;

    try {
      // Get booking info
      const bookingResult = await query(
        `SELECT b.*, s.name as speciality_name 
         FROM bookings b 
         LEFT JOIN dm_chuyenkhoa_online s ON b.speciality_id = s.id
         WHERE b.booking_id = $1`,
        [id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const booking = bookingResult.rows[0];

      await query(
        `UPDATE bookings 
         SET booking_date = $1, booking_time = $2, updated_at = NOW() 
         WHERE booking_id = $3`,
        [newDate, newTime, id]
      );

      await this.logAction(id, 'RESCHEDULED', userId, `Changed from ${booking.booking_date} ${booking.booking_time} to ${newDate} ${newTime}`);

      // Send reschedule SMS
      try {
        await notificationService.sendBookingReschedule(
          {
            bookingId: id,
            patientName: booking.patient_name,
            phone: booking.phone,
            speciality: booking.speciality_name,
            date: booking.booking_date,
            time: booking.booking_time
          },
          newDate,
          newTime
        );
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Reschedule booking error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== THỐNG KÊ ====================

  async getBookingStatistics(req: Request, res: Response) {
    const { fromDate, toDate } = req.query;

    try {
      // KPIs
      const kpiResult = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending,
          COUNT(CASE WHEN status = 'Approved' THEN 1 END) as approved,
          COUNT(CASE WHEN status = 'Arrived' THEN 1 END) as arrived,
          COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected
         FROM bookings
         WHERE booking_date BETWEEN $1 AND $2`,
        [fromDate, toDate]
      );

      // Trends (last 7 days)
      const trendsResult = await query(
        `SELECT 
          booking_date as name,
          COUNT(*) as bookings,
          COUNT(CASE WHEN status = 'Arrived' THEN 1 END) as arrived
         FROM bookings
         WHERE booking_date BETWEEN $1 AND $2
         GROUP BY booking_date
         ORDER BY booking_date`,
        [fromDate, toDate]
      );

      // Sources
      const sourcesResult = await query(
        `SELECT 
          source as name,
          COUNT(*) as value
         FROM bookings
         WHERE booking_date BETWEEN $1 AND $2
         GROUP BY source`,
        [fromDate, toDate]
      );

      // Specialities
      const specialitiesResult = await query(
        `SELECT 
          s.name,
          COUNT(b.id) as value
         FROM bookings b
         LEFT JOIN dm_chuyenkhoa_online s ON b.speciality_id = s.id
         WHERE b.booking_date BETWEEN $1 AND $2
         GROUP BY s.name
         ORDER BY value DESC
         LIMIT 5`,
        [fromDate, toDate]
      );

      const kpis = kpiResult.rows[0];

      res.json({
        kpis: {
          total: parseInt(kpis.total),
          pending: parseInt(kpis.pending),
          approved: parseInt(kpis.approved),
          arrived: parseInt(kpis.arrived),
          rejected: parseInt(kpis.rejected),
          growth: 12.5 // TODO: Calculate real growth
        },
        trends: trendsResult.rows,
        sources: sourcesResult.rows.map((r: any) => ({
          name: r.name,
          value: parseInt(r.value),
          color: r.name === 'Portal' ? '#0d9488' : r.name === 'Mobile App' ? '#3b82f6' : '#8b5cf6'
        })),
        specialities: specialitiesResult.rows.map((r: any) => ({
          name: r.name,
          value: parseInt(r.value)
        }))
      });
    } catch (error: any) {
      console.error('Get statistics error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== GỬI LẠI SMS ====================

  async resendSMS(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const bookingResult = await query(
        `SELECT b.*, s.name as speciality_name 
         FROM bookings b 
         LEFT JOIN dm_chuyenkhoa_online s ON b.speciality_id = s.id
         WHERE b.booking_id = $1`,
        [id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const booking = bookingResult.rows[0];

      await notificationService.sendBookingConfirmation({
        bookingId: id,
        patientName: booking.patient_name,
        phone: booking.phone,
        speciality: booking.speciality_name,
        date: booking.booking_date,
        time: booking.booking_time,
        queueNumber: booking.queue_number
      });

      await query(
        'UPDATE bookings SET sms_status = $1 WHERE booking_id = $2',
        ['Sent', id]
      );

      await this.logAction(id, 'SMS_RESENT', req.body.userId, 'SMS resent manually');

      res.json({ success: true });
    } catch (error: any) {
      console.error('Resend SMS error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== HELPER METHODS ====================

  private async logAction(bookingId: string, action: string, userId: string | null, note: string): Promise<void> {
    try {
      await query(
        'INSERT INTO booking_logs (booking_id, action, user_id, note) VALUES ($1, $2, $3, $4)',
        [bookingId, action, userId, note]
      );
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }
}
