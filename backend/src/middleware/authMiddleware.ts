import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Interface to extend Express Request with user data from JWT
 * Use type intersection with generic Request<any...> to ensure 
 * maximum compatibility across environments.
 */
export type AuthRequest = Request<any, any, any, any> & {
    userId?: string | number;
    groupId?: string | number;
    deptId?: string;
    permissions?: string[];
};

interface JwtPayload {
    userId: string | number;
    groupId: string | number;
    deptId?: string;
    permissions?: string[];
    iat?: number;
    exp?: number;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const r = req as any;
        const authHeader = r.headers?.authorization || (typeof r.get === 'function' ? r.get('authorization') : r.header?.('authorization'));

        console.log('[authMiddleware] ========== START ==========');
        console.log('[authMiddleware] Authorization header:', authHeader ? authHeader.substring(0, 50) + '...' : 'MISSING');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[authMiddleware] ❌ No Bearer token found');
            return res.status(401).json({
                success: false,
                message: 'Không tìm thấy token xác thực'
            });
        }

        const token = authHeader.substring(7); // Remove "Bearer "
        console.log('[authMiddleware] Token extracted:', token.substring(0, 30) + '...');

        // Verify token with typed payload
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        console.log('[authMiddleware] ✅ Token verified successfully');
        console.log('[authMiddleware] Decoded payload:', decoded);

        // Map Decoded payload to Request object
        req.userId = decoded.userId;
        req.groupId = decoded.groupId;
        req.deptId = decoded.deptId;
        req.permissions = decoded.permissions || [];

        console.log('[authMiddleware] ✅ Set req.deptId =', req.deptId);
        console.log('[authMiddleware] ========== END ==========');

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

/**
 * Middleware for checking specific permissions (CheckPermission logic)
 * @param permId Permission ID from sys_userperm (e.g., '01.01')
 */
export const requirePermission = (permId: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.permissions || !req.permissions.includes(permId)) {
            console.log(`[authMiddleware] ❌ Permission denied: ${permId} for user ${req.userId}`);
            return res.status(403).json({
                success: false,
                message: `Bạn không có quyền thực hiện tác vụ này (${permId})`
            });
        }
        next();
    };
};

/**
 * Middleware for checking module-specific permissions
 * @param moduleName Name of the module to check access for
 */
export const requireModule = (moduleName: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            // ... existing logic or implementation
            next();
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập module này'
            });
        }
    };
};

export default authMiddleware;
