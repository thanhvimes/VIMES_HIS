// ==================== AUTH MIDDLEWARE ====================
// File: backend/src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthToken } from '../types/user.types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        // Lấy token từ header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }

        const token = authHeader.substring(7); // Bỏ "Bearer "

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as AuthToken;

        // Gắn userId vào request để các controller sử dụng
        (req as any).userId = decoded.userId;
        (req as any).groupId = decoded.groupId;
        (req as any).deptId = decoded.deptId;

        next();
    } catch (error: any) {
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
export const requireModule = (moduleName: string) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = (req as any).userId;

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
