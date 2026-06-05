
import { pool } from '../config/database';

export class QueueService {
  /**
   * Generate Ticket based on Department (Area)
   */
  static async generateTicket(departmentId: string, patientData: { name: string, age?: number, reason?: string, isPriority?: boolean }) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      await client.query('LOCK TABLE clinic_queue_patients IN SHARE ROW EXCLUSIVE MODE');

      // 1. Get Department Prefix
      const deptRes = await client.query('SELECT code_prefix FROM clinic_queue_departments WHERE id = $1', [departmentId]);
      const prefix = (deptRes.rows[0] && deptRes.rows[0].code_prefix) ? deptRes.rows[0].code_prefix : departmentId;

      // 2. Count distinct codes for this Department today
      const maxRes = await client.query(
        `SELECT COUNT(*) as total_today 
         FROM clinic_queue_patients 
         WHERE department_id = $1 AND created_at::date = CURRENT_DATE`,
        [departmentId]
      );
      
      let nextNum = parseInt(maxRes.rows[0].total_today || '0') + 1;
      let fullCode = `${prefix}-${nextNum.toString().padStart(3, '0')}`;

      // 3. Insert data
      const insertRes = await client.query(
        `INSERT INTO clinic_queue_patients (department_id, code, name, age, reason, is_priority, status, room_id) 
         VALUES ($1, $2, $3, $4, $5, $6, 'WAITING', NULL) RETURNING *`,
        [departmentId, fullCode, patientData.name, patientData.age || 0, patientData.reason || '', patientData.isPriority || false]
      );

      await client.query('COMMIT');
      return insertRes.rows[0];

    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async getRoom(id: string) {
    const res = await pool.query('SELECT * FROM clinic_queue_rooms WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  static async createRoomLazy(id: string, name: string, deptId: string = 'KKB') {
    const res = await pool.query(
        `INSERT INTO clinic_queue_rooms (id, department_id, name, doctor_name) 
         VALUES ($1, $2, $3, 'Bác sĩ trực') 
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name 
         RETURNING *`, 
        [id, deptId, name]
    );
    return res.rows[0];
  }
}

export default QueueService;
