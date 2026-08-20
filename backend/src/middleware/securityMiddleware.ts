import { NextFunction, Request, Response } from 'express';
import authMiddleware, { AuthRequest } from './authMiddleware';

const publicRoutes = [
    // Health & System
    ['GET', /^\/api\/health$/],
    ['GET', /^\/api\/v1\/version$/],
    ['GET', /^\/api\/tts$/],

    // Auth & Logout
    ['POST', /^\/api\/v1\/auth\/login$/],
    ['POST', /^\/api\/v1\/auth\/logout$/],
    ['POST', /^\/api\/v1\/portal\/(login|activate)$/],

    // Public Settings & Info (GET only)
    ['GET', /^\/api\/(v1\/)?settings(\/.*)?$/],
    ['GET', /^\/api\/(v1\/)?his\/company$/],

    // Booking, Catalogs, Departments & Schedules (GET only)
    ['GET', /^\/api\/(v1\/)?departments(\/.*)?$/],
    ['GET', /^\/api\/(v1\/)?zoning(\/.*)?$/],
    ['GET', /^\/api\/(v1\/)?areas(\/.*)?$/],
    ['GET', /^\/api\/(v1\/)?booking\/(locations.*|departments|specialities|rooms.*|slots)$/],
    ['GET', /^\/api\/(v1\/)?schedule\/(slots|public.*)$/],
    ['GET', /^\/api\/(v1\/)?catalogs(\/.*)?$/],
    ['GET', /^\/api\/(v1\/)?room-schedules(\/.*)?$/],
    ['GET', /^\/api\/(v1\/)?sms-templates(\/.*)?$/],
    ['GET', /^\/api\/(v1\/)?statistics(\/.*)?$/],

    // Public Registration
    ['POST', /^\/api\/v1\/booking\/register$/],

    // Portal Study & PACS Public Info (GET only)
    ['GET', /^\/api\/(v1\/)?portal\/study(\/.*)?$/],
    ['GET', /^\/api\/(v1\/)?emr\/(public|catalogs)(\/.*)?$/],
    ['GET', /^\/api\/(v1\/)?(pacs|studies|worklist|tasks|dashboard|audit-logs)(\/.*)?$/],
    ['POST', /^\/api\/imaging\/(.*)?$/],

    // QMS, Queue, Kiosk, Counter, Areas & TV Displays (GET only)
    ['GET', /^\/api\/(v1\/)?(qms\/)?(public.*|counter.*|kiosk.*|queue.*|display.*|central.*|zoning.*|areas.*|departments.*)$/],
    ['POST', /^\/api\/(v1\/)?(qms\/)?(feedback|queue.*)$/]
] as const;

export function defaultApiAuthentication(req: Request, res: Response, next: NextFunction) {
    let requestPath = (req.originalUrl || req.url || req.path || '').split('?')[0];
    
    // Normalize absolute URLs (e.g. http://192.168.0.181:3000/api/departments)
    if (requestPath.startsWith('http://') || requestPath.startsWith('https://')) {
        try {
            requestPath = new URL(requestPath).pathname;
        } catch {
            // Fallback gracefully
        }
    }
    if (!requestPath.startsWith('/api')) {
        requestPath = '/api' + (requestPath.startsWith('/') ? requestPath : '/' + requestPath);
    }

    if (publicRoutes.some(([method, pattern]) => method === req.method && pattern.test(requestPath))) {
        return next();
    }

    return authMiddleware(req as AuthRequest, res, () => {
        const tokenType = (req as AuthRequest).tokenType;
        const expected = requestPath.startsWith('/api/v1/portal/') ? 'portal' : 'staff';
        if (tokenType && tokenType !== expected) return res.status(403).json({ success: false, message: 'Token is not valid for this API' });
        next();
    });
}

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' http: https: data: blob: ws: wss:; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
        "font-src 'self' https://fonts.gstatic.com data:; " +
        "img-src 'self' data: blob: http: https:; " +
        "frame-ancestors 'self'; object-src 'none'; base-uri 'self'"
    );
    next();
}

const windows = new Map<string, { count: number; resetAt: number }>();
export function apiRateLimit(req: Request, res: Response, next: NextFunction) {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const previous = windows.get(key);
    const entry = !previous || previous.resetAt <= now ? { count: 0, resetAt: now + 60_000 } : previous;
    entry.count += 1;
    windows.set(key, entry);
    res.setHeader('RateLimit-Limit', '300');
    res.setHeader('RateLimit-Remaining', String(Math.max(0, 300 - entry.count)));
    if (entry.count > 300) return res.status(429).json({ success: false, message: 'Too many requests' });
    if (windows.size > 10_000) for (const [candidate, value] of windows) if (value.resetAt <= now) windows.delete(candidate);
    next();
}
