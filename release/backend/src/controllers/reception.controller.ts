
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
  async getPatientById(req: any, res: any) { res.json({}); }
  async updatePatient(req: any, res: any) { res.json({}); }
  async getQueueStatus(req: any, res: any) { res.json([]); }
  async callNextPatient(req: any, res: any) { res.json({ success: true }); }
}
