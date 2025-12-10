
export class ConsultationController {
  async saveClinicalRecord(req: any, res: any) { res.json({ success: true }); }
  async getClinicalHistory(req: any, res: any) { res.json([]); }
  async getRecordDetail(req: any, res: any) { res.json({}); }
  async savePrescription(req: any, res: any) { res.json({ success: true }); }
}
