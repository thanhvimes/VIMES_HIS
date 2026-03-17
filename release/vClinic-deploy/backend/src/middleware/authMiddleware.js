// ==================== AUTH MIDDLEWARE ====================
// File: backend/src/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = (req, res, next) => {
    try {
        // Lấy token từ header
        const authHeader = req.headers.authorization;

        console.log('[authMiddleware] ========== START ==========');
        console.log('[authMiddleware] Authorization header:', authHeader ? authHeader.substring(0, 50) + '...' : 'MISSING');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[authMiddleware] ❌ No Bearer token found');
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }

        const token = authHeader.substring(7); // Bỏ "Bearer "
        console.log('[authMiddleware] Token extracted:', token.substring(0, 30) + '...');

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('[authMiddleware] ✅ Token verified successfully');
        console.log('[authMiddleware] Decoded payload:', decoded);

        // Gắn userId vào request để các controller sử dụng
        req.userId = decoded.userId;
        req.groupId = decoded.groupId;
        req.deptId = decoded.deptId;

        console.log('[authMiddleware] ✅ Set req.deptId =', req.deptId);
        console.log('[authMiddleware] ========== END ==========');

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token đã hết hạn'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ'
        });
    }
};

// Middleware kiểm tra quyền module
const requireModule = (moduleName) => {
    return async (req, res, next) => {
        try {
            const userId = req.userId;

            // TODO: Query database để kiểm tra user có quyền module này không
            // Hiện tại skip, có thể implement sau

            next();
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập module này'
            });
        }
    };
};

module.exports = {
    authMiddleware,
    requireModule
};
