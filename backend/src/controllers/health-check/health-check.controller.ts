import { Request, Response } from 'express';
import { documentsController } from './documents';
import { hisIntegrationController } from './his-integration';

class HealthCheckController {
    // 1. Lấy danh sách hồ sơ (kèm phân trang, lọc nâng cao)
    async getDocuments(req: Request, res: Response) {
        return documentsController.getDocuments(req, res);
    }

    // 2. Lấy chi tiết một hồ sơ theo ID
    async getDocumentById(req: Request, res: Response) {
        return documentsController.getDocumentById(req, res);
    }

    // 3. Tạo mới hồ sơ khám sức khỏe (Master-Detail)
    async createDocument(req: Request, res: Response) {
        return documentsController.createDocument(req, res);
    }

    // 4. Cập nhật hồ sơ khám sức khỏe
    async updateDocument(req: Request, res: Response) {
        return documentsController.updateDocument(req, res);
    }

    // 5. Xóa hồ sơ khám sức khỏe
    async deleteDocument(req: Request, res: Response) {
        return documentsController.deleteDocument(req, res);
    }

    // 6. Ký số hồ sơ (USB / HSM)
    async signDocuments(req: Request, res: Response) {
        return documentsController.signDocuments(req, res);
    }

    async unlockDocument(req: Request, res: Response) {
        return documentsController.unlockDocument(req, res);
    }

    // 7. Đồng bộ cổng y tế
    async sendDocuments(req: Request, res: Response) {
        return documentsController.sendDocuments(req, res);
    }

    // 8. Tạo dữ liệu thử nghiệm cho 17 mẫu biểu KSK từ dữ liệu HIS
    async seedFromHis(req: Request, res: Response) {
        return hisIntegrationController.seedFromHis(req, res);
    }

    // 9. Lấy dữ liệu bệnh nhân từ HIS để đồng bộ KSK
    async getHisPatient(req: Request, res: Response) {
        return hisIntegrationController.getHisPatient(req, res);
    }

    // Đánh dấu đã in barcode
    async markBarcodePrinted(req: Request, res: Response) {
        return documentsController.markBarcodePrinted(req, res);
    }

    // Lấy hình ảnh chữ ký hàng loạt cho các bác sĩ phụ trách khám chuyên khoa
    async getDoctorSignatures(req: Request, res: Response) {
        try {
            const signatureService = require('../../services/signature.service').default;
            const codesParam = (req.query.codes as string) || (req.body?.codes as string[]);
            let codes: string[] = [];
            if (Array.isArray(codesParam)) {
                codes = codesParam;
            } else if (typeof codesParam === 'string') {
                codes = codesParam.split(',').map(c => c.trim()).filter(Boolean);
            }
            const signatures = await signatureService.getMultipleDoctorSignatures(codes);
            return res.json({ success: true, data: signatures });
        } catch (error: any) {
            console.error('Error fetching doctor signatures:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // Lưu hoặc cập nhật chữ ký điện tử bác sĩ vào sys_filedir
    async saveDoctorSignature(req: Request, res: Response) {
        try {
            const signatureService = require('../../services/signature.service').default;
            const { userId, base64, desc } = req.body;
            if (!userId || !base64) {
                return res.status(400).json({ success: false, message: 'Thiếu userId hoặc base64 ảnh chữ ký' });
            }
            const result = await signatureService.saveDoctorSignature(userId, base64, desc);
            return res.json(result);
        } catch (error: any) {
            console.error('Error saving doctor signature:', error);
            return res.status(500).json({ success: false, message: error.message });
        }
    }

}

export default new HealthCheckController();
