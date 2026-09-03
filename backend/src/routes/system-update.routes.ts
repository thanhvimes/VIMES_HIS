import express from 'express';
import path from 'path';
import fs from 'fs';
import systemUpdateController from '../controllers/system-update/system-update.controller';

const router = express.Router();

// Cấu hình thư mục lưu file upload tạm thời
const tempUploadDir = path.resolve(process.cwd(), 'temp_uploads');
if (!fs.existsSync(tempUploadDir)) {
    try {
        fs.mkdirSync(tempUploadDir, { recursive: true });
    } catch (e) {
        // ignore
    }
}

// Middleware upload an toàn với fallback nếu chưa cài multer
const safeUploadMiddleware = (req: any, res: any, next: any) => {
    try {
        const multer = require('multer');
        const upload = multer({
            dest: tempUploadDir,
            limits: {
                fileSize: 200 * 1024 * 1024 // Tối đa 200 MB
            }
        });
        return upload.single('package')(req, res, next);
    } catch (err: any) {
        return res.status(500).json({
            success: false,
            message: 'Thư viện multer chưa được cài đặt trong môi trường Node.js máy chủ. Vui lòng chạy "npm install" tại thư mục backend.'
        });
    }
};

// 1. Thông tin hệ thống và phiên bản
router.get('/info', systemUpdateController.getSystemInfo);

// 2. Kiểm tra phiên bản mới từ Update Server
router.get('/check', systemUpdateController.checkUpdate);

// 3. Thực hiện cập nhật trực tuyến tự động (OTA)
router.post('/perform-ota', systemUpdateController.performOtaUpdate);

// 4. Tải lên tệp tin cập nhật ngoại tuyến (.tar.gz / .zip)
router.post('/upload-package', safeUploadMiddleware, systemUpdateController.uploadOfflinePackage);

// 5. Lịch sử cập nhật hệ thống
router.get('/history', systemUpdateController.getUpdateHistory);

export default router;
