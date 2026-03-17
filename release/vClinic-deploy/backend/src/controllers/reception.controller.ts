
import { query } from '../config/db';

export class ReceptionController {
  async getPatients(req: any, res: any) {
    try {
      // Ví dụ query đơn giản, bạn có thể sửa lại theo tên bảng thật trong DB của bạn
      // Lưu ý: Nếu bảng chưa tồn tại, nó sẽ báo lỗi, nhưng kết nối DB vẫn thành công.
      const result = await query('SELECT NOW() as time');
      res.json({
        message: "Kết nối DB thành công. Chưa có bảng dữ liệu.",
        serverTime: result.rows[0].time,
        data: []
      });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
  async createPatient(req: any, res: any) { res.json({ id: 'MOCK-ID', ...req.body }); }
  async getPatientById(req: any, res: any) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ error: 'Mã định danh không được để trống' });
      }

      console.log('🔍 Searching patient with identifier:', id);

      // Tìm kiếm theo Mã BN, CCCD hoặc Số điện thoại
      const result = await query(`
        SELECT 
          hp_patientno as "id",
          hp_patientno as "recordNumber",
          (COALESCE(hp_surname, '') || ' ' || COALESCE(hp_midname, '') || ' ' || COALESCE(hp_firstname, '')) as "name",
          to_char(hp_birthdate, 'DD/MM/YYYY') as "dob",
          hp_sex as "gender",
          hp_sin as "identityCard",
          hp_dtladdr as "address",
          hp_provid as "provinceId",
          hp_distid as "districtId",
          hp_villid as "wardId"
        FROM hms_patient
        WHERE hp_patientno::text = $1 
           OR hp_sin = $1           
        LIMIT 1
      `, [id]);

      if (result.rows.length === 0) {
        console.log('📭 No patient found for:', id);
        return res.json(null);
      }

      const patient = result.rows[0];

      // Chuyển đổi giới tính NAM/NỮ sang M/F nếu cần
      if (patient.gender) {
        if (patient.gender.toLowerCase().includes('nam')) patient.gender = 'M';
        else if (patient.gender.toLowerCase().includes('nữ') || patient.gender.toLowerCase().includes('nu')) patient.gender = 'F';
      }

      console.log('✅ Found patient:', patient.name);
      res.json(patient);
    } catch (error: any) {
      console.error('❌ Error in getPatientById:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async updatePatient(req: any, res: any) { res.json({}); }
  async getQueueStatus(req: any, res: any) { res.json([]); }
  async callNextPatient(req: any, res: any) { res.json({ success: true }); }
}
