
import { Request, Response } from 'express';
import { query } from '../config/db';

export class BookingController {
  // 1. Danh mục địa giới
  async getProvinces(req: Request, res: Response) {
    try {
      const result = await query('SELECT ma_tinh as id, ten_tinh as name FROM dm_tinh ORDER BY ten_tinh');
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getDistricts(req: Request, res: Response) {
    const { provinceId } = req.params;
    try {
      const result = await query('SELECT ma_huyen as id, ten_huyen as name FROM dm_huyen WHERE ma_tinh = $1 ORDER BY ten_huyen', [provinceId]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getWards(req: Request, res: Response) {
    const { districtId } = req.params;
    try {
      const result = await query('SELECT ma_xa as id, ten_xa as name FROM dm_xa WHERE ma_huyen = $1 ORDER BY ten_xa', [districtId]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // 2. Chuyên khoa và Slot
  async getSpecialities(req: Request, res: Response) {
    try {
      const result = await query('SELECT id, name, quota_per_slot as "quotaPerSlot" FROM dm_chuyenkhoa_online WHERE active = true');
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAvailableSlots(req: Request, res: Response) {
    const { specialityId, date } = req.query;
    try {
      // Logic: Lấy danh sách khung giờ và JOIN với bảng bookings để đếm số lượng đã đặt
      const sql = `
        SELECT 
          t.time_slot as "time",
          t.max_quota as "maxQuota",
          COUNT(b.id) as "currentCount",
          (COUNT(b.id) >= t.max_quota) as "isFull"
        FROM dm_khung_gio t
        LEFT JOIN bookings b ON t.time_slot = b.booking_time AND b.booking_date = $2 AND b.speciality_id = $1 AND b.status != 'Rejected'
        GROUP BY t.time_slot, t.max_quota
        ORDER BY t.time_slot
      `;
      const result = await query(sql, [specialityId, date]);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // 3. Nghiệp vụ đặt lịch
  async registerBooking(req: Request, res: Response) {
    const data = req.body;
    try {
      const bookingId = `BK${Date.now().toString().slice(-6)}`;
      const sql = `
        INSERT INTO bookings (
          booking_id, patient_id, patient_name, phone, dob, gender, identity_card,
          province_id, district_id, ward_id, address_detail,
          speciality_id, booking_date, booking_time, reason, is_priority, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'Pending')
        RETURNING booking_id
      `;
      const params = [
        bookingId, data.patientId, data.name, data.phone, data.dob, data.gender, data.identityCard,
        data.provinceId, data.districtId, data.wardId, data.addressDetail,
        data.specialityId, data.date, data.time, data.reason, data.isPriority
      ];
      await query(sql, params);
      res.json({ success: true, bookingId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getBookingList(req: Request, res: Response) {
    const { date, status, search } = req.query;
    try {
      let sql = 'SELECT * FROM bookings WHERE 1=1';
      const params = [];
      let idx = 1;
      if (date) { sql += ` AND booking_date = $${idx++}`; params.push(date); }
      if (status && status !== 'All') { sql += ` AND status = $${idx++}`; params.push(status); }
      if (search) { 
          sql += ` AND (patient_name ILIKE $${idx} OR phone ILIKE $${idx})`; 
          params.push(`%${search}%`); 
          idx++;
      }
      sql += ' ORDER BY booking_time ASC';
      const result = await query(sql, params);
      res.json(result.rows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;
    try {
      await query('UPDATE bookings SET status = $1, updated_at = NOW() WHERE booking_id = $2', [status, id]);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
