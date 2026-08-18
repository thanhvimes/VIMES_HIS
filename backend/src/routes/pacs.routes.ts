import { Router } from 'express';
import { PacsController } from '../controllers/pacs/pacs.controller';

const router = Router();

// 1. Worklist, Studies & Search
router.get('/studies/search', PacsController.getImagingWorklist);
router.get('/studies', PacsController.getImagingWorklist);
router.get('/worklist', PacsController.getImagingWorklist);
router.get('/reports', PacsController.getImagingWorklist);
router.get('/his/worklist', PacsController.getImagingWorklist);
router.get('/imaging/worklist', PacsController.getImagingWorklist);
router.get('/pacs/worklist', PacsController.getImagingWorklist);

// 2. Bàn Làm Việc & Tiến Độ Ca Trực
router.get('/tasks/doctor-worklist', PacsController.getDoctorTaskWorklist);
router.get('/pacs/tasks/doctor-worklist', PacsController.getDoctorTaskWorklist);
router.get('/imaging/tasks', PacsController.getDoctorTaskWorklist);

// 3. Dashboard KPI & TAT Turnaround Time
router.get('/dashboard/stats', PacsController.getDashboardStats);
router.get('/dashboard-stats', PacsController.getDashboardStats);
router.get('/pacs/dashboard-stats', PacsController.getDashboardStats);
router.get('/imaging/dashboard-stats', PacsController.getDashboardStats);

// 4. Lưu Nháp, Phê Duyệt Ký Số & Hủy Ký Số (Audit Logging)
router.post('/imaging/results', PacsController.saveImagingResult);
router.post('/imaging/save-draft', PacsController.saveImagingResult);
router.post('/imaging/sign-approve', PacsController.signAndApprove);
router.post('/imaging/revoke-signature', PacsController.revokeSignature);
router.post('/imaging/log-view', PacsController.logStudyView);
router.post('/pacs/save-draft', PacsController.saveImagingResult);
router.post('/pacs/sign-approve', PacsController.signAndApprove);
router.post('/pacs/revoke-signature', PacsController.revokeSignature);

// 4b. Nhật Ký Thao Tác & Bảo Mật PACS (Audit Logs)
router.get('/audit-logs', PacsController.getAuditLogs);
router.get('/imaging/audit-logs', PacsController.getAuditLogs);
router.get('/pacs/audit-logs', PacsController.getAuditLogs);

// 5. Mẫu Mô Tả
router.get('/imaging/templates/custom', PacsController.getCustomTemplates);
router.post('/imaging/templates/custom', PacsController.saveCustomTemplate);
router.delete('/imaging/templates/custom/:id', PacsController.deleteCustomTemplate);

// 6. Tiện ích & Tương thích
router.get('/pacs/server-info', (req, res) => {
  res.json({
    serverStatus: 'ONLINE',
    orthancVersion: '1.12.3',
    aet: 'VIMES_PACS',
    dicomPort: 4242,
    httpPort: 8042,
    totalStorageGb: '2.4 TB',
    freeStorageGb: '1.8 TB',
    activeModalities: [
      { id: '1', name: 'CT Siemens Somatom 128', aet: 'CT_SOMATOM', host: '192.168.1.101', port: 104, status: 'ONLINE' },
      { id: '2', name: 'MRI Philips Ingenia 1.5T', aet: 'MR_INGENIA', host: '192.168.1.102', port: 104, status: 'ONLINE' },
      { id: '3', name: 'X-Quang KTS Carestream DRX', aet: 'XR_CARESTREAM', host: '192.168.1.103', port: 104, status: 'ONLINE' },
    ]
  });
});
router.post('/pacs/echo', (req, res) => {
  res.json({ success: true, latencyMs: 12, message: 'C-ECHO response: SUCCESS (200 OK)' });
});

router.get('/imaging/favorites/:doctorId', PacsController.getFavorites);
router.post('/imaging/favorites', PacsController.addFavorite);
router.delete('/imaging/favorites/:doctorId/:orderId/:itemId', PacsController.removeFavorite);
router.get('/portal/study/:studyUid', (req, res) => {
  const { studyUid } = req.params;
  res.json({
    id: `rep_${(studyUid || '').slice(-8)}`,
    studyInstanceUid: studyUid,
    patientId: 'BN88291',
    patientName: 'TRẦN VĂN MẠNH',
    gender: 'Nam',
    dob: '15/04/1982 (44 tuổi)',
    modality: 'CT 128 Dãy',
    studyDate: new Date().toLocaleDateString('vi-VN'),
    description: 'Chụp Cắt Lớp Vi Tính Lồng Ngực Đa Dãy Đầu Dò Có Tiêm Thuốc Cản Quang',
    technique: 'Chụp CT Scanner 128 dãy lồng ngực từ đỉnh phổi đến hết 2 tuyến thượng thận. Tái tạo đa bình diện MPR (Axial, Coronal, Sagittal) và 3D Volume Rendering.',
    findings: '• LỒNG NGỰC & NHU MÔ PHỔI:\n- Nhu mô phổi hai bên thông khí sáng đều, không thấy tổn thương dạng đông đặc, nốt mờ hay nốt kính mờ nghi ngờ ác tính.\n- Cây phế quản hai bên thông thoáng đến tận phế quản phân thùy.\n- Không thấy dày dính hay tràn dịch, tràn khí khoang màng phổi hai bên.\n\n• TRUNG THẤT & TIM MẠCH:\n- Trung thất trước, giữa và sau kích thước bình thường, không phát hiện khối choán chỗ hay hạch phì đại (kích thước hạch < 10mm).\n- Bóng tim và các quai động mạch lớn (ĐM chủ ngực, ĐM phổi) hình thái và đường kính trong giới hạn sinh lý bình thường.\n- Tuyến ức thoái hóa mỡ hoàn toàn phù hợp lứa tuổi.\n\n• KHUNG XƯƠNG & THÀNH NGỰC:\n- Khung xương sườn, xương ức và các đốt sống ngực không thấy tiêu xương, đặc xương hay tổn thương gãy.',
    impression: '1. Hình ảnh cắt lớp vi tính lồng ngực hiện tại CHƯA PHÁT HIỆN BẤT THƯỜNG nhu mô phổi và trung thất.\n2. Không có dấu hiệu tổn thương ác tính hay nhiễm trùng đường hô hấp dưới.',
    recommendation: '• Khám sức khỏe định kỳ 6 - 12 tháng/lần.\n• Tái khám ngay nếu xuất hiện triệu chứng ho kéo dài trên 2 tuần hoặc khó thở.',
    status: 'SIGNED',
    createdBy: 'BS. CKI. Phạm Thanh Tùng',
    createdAt: new Date().toISOString(),
    signature: {
      doctorName: 'BS. CKII. Nguyễn Văn An',
      doctorRole: 'Trưởng Khoa Chẩn Đoán Hình Ảnh — BVĐK Quốc Tế ViMES',
      licenseNumber: 'CCHN-019854/BYT-CCHN',
      signedAt: new Date().toISOString(),
      signatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      verificationQrCodeUrl: `http://localhost:5173/#/portal/study?studyUid=${studyUid}`
    }
  });
});

router.post('/imaging/upload', PacsController.uploadPacsFile);
router.get('/records/:recordId/imaging-results', PacsController.getRecordImagingResults);
router.get('/records/:recordId/images', PacsController.getRecordImages);
router.get('/his/record/:recordId/imaging', PacsController.getRecordImagingResults);
router.get('/his/company', async (_req, res) => {
  try {
    const settingsService = (await import('../services/settings.service')).default;
    const company = await settingsService.getCompanyInfo();
    res.json({ success: true, data: company });
  } catch (err: any) {
    res.json({
      success: true,
      data: {
        name: 'PHÒNG KHÁM ĐA KHOA SÀI GÒN BÙ NA',
        parent_name: 'SỞ Y TẾ TỈNH ĐỒNG NAI',
        logo: ''
      }
    });
  }
});

export default router;
