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

}

export default new HealthCheckController();
