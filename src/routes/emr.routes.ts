import { Router, Request, Response } from 'express';
import { EmrDocumentService } from '../emr-engine/emr-document.service';
import { EnterpriseEmrService } from '../emr-engine/enterprise-emr.service';

const router = Router();

// 1. Lấy danh sách văn bản trong bệnh án của bệnh nhân
router.get('/documents', async (req: Request, res: Response) => {
  try {
    const list = await EmrDocumentService.listPatientDocuments(req.query as any);
    return res.json({ success: true, data: list });
  } catch (err: any) {
    console.error('[EMR listDocuments error]:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Danh mục Mã loại biểu mẫu EMR chuẩn BYT
router.get('/catalogs/form-types', async (req: Request, res: Response) => {
  try {
    const catalog = await EmrDocumentService.getFormTypeCatalog();
    return res.json({ success: true, data: catalog });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Danh mục 42 Mẫu Bệnh án Chuyên khoa BYT (QĐ 4069)
router.get('/catalogs/specialties', async (req: Request, res: Response) => {
  try {
    const catalog = await EnterpriseEmrService.getSpecialtyCatalog();
    return res.json({ success: true, data: catalog });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Sinh hiệu & Chức năng sống (Vital Signs)
router.get('/vital-signs/:docNo', async (req: Request, res: Response) => {
  try {
    const vitals = await EnterpriseEmrService.getVitalSigns(req.params.docNo as string);
    return res.json({ success: true, data: vitals });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/vital-signs', async (req: Request, res: Response) => {
  try {
    const vital = await EnterpriseEmrService.recordVitalSigns(req.body);
    return res.json({ success: true, data: vital });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Tổng kết bệnh án khi ra viện (Clinical Summary)
router.get('/clinical-summary/:docNo', async (req: Request, res: Response) => {
  try {
    const summary = await EnterpriseEmrService.getClinicalSummary(req.params.docNo as string);
    return res.json({ success: true, data: summary });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/clinical-summary', async (req: Request, res: Response) => {
  try {
    const summary = await EnterpriseEmrService.saveClinicalSummary(req.body);
    return res.json({ success: true, data: summary });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// Mượn đọc & Trích sao hồ sơ bệnh án (Research & Legal Disclosure)
router.get('/lending', async (req: Request, res: Response) => {
  try {
    const requests = await EnterpriseEmrService.listLendingRequests(req.query.docNo as string);
    return res.json({ success: true, data: requests });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/lending', async (req: Request, res: Response) => {
  try {
    const result = await EnterpriseEmrService.createLendingRequest(req.body);
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 2. Lấy chi tiết 1 văn bản EMR theo ID
router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const doc = await EmrDocumentService.getDocumentById(req.params.id as string);
    if (!doc) return res.status(404).json({ error: 'Không tìm thấy tài liệu EMR' });
    return res.json({ success: true, data: doc });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Tạo mới hoặc cập nhật bản nháp
router.post('/documents/draft', async (req: Request, res: Response) => {
  try {
    const draft = await EmrDocumentService.createOrUpdateDraft(req.body);
    return res.json({ success: true, data: draft });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// 4. Ký số hàng loạt cho Bác sĩ (Batch Signing)
router.post('/documents/batch-sign', async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || (req.socket?.remoteAddress ?? '127.0.0.1');
    const result = await EmrDocumentService.batchSignDocuments({
      ...req.body,
      clientIp
    });
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 5. Bệnh nhân ký tay trên Tablet
router.post('/documents/patient-touch-sign', async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || (req.socket?.remoteAddress ?? '127.0.0.1');
    const result = await EmrDocumentService.patientTabletSign({
      ...req.body,
      clientIp
    });
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 6. Đính chính / Lập bản sửa đổi (Addendum)
router.post('/documents/amend', async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || (req.socket?.remoteAddress ?? '127.0.0.1');
    const result = await EmrDocumentService.amendDocument({
      ...req.body,
      clientIp
    });
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 7. Đóng bệnh án & Khóa WORM khi xuất viện (Medical Record Closure)
router.post('/bundles/close', async (req: Request, res: Response) => {
  try {
    const clientIp = req.ip || (req.socket?.remoteAddress ?? '127.0.0.1');
    const result = await EmrDocumentService.closeAndBundleMedicalRecord({
      ...req.body,
      clientIp
    });
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// 8. Tra cứu công khai tính toàn vẹn (Quét mã QR)
router.get('/public/verify/:id', async (req: Request, res: Response) => {
  try {
    const verification = await EmrDocumentService.verifyPublicDocument(req.params.id as string);
    if (!verification) return res.status(404).json({ error: 'Không tìm thấy hồ sơ hoặc mã QR không hợp lệ' });
    return res.json({ success: true, data: verification });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
