// ==================== PROTECTED ROUTE ====================
// File: components/ProtectedRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredModule?: string; // Optional: check if user has permission for specific module
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredModule }) => {
    const { isAuthenticated, isLoading, user } = useAuth();

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Đang tải...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check module permission if required
    if (requiredModule && user) {
        const hasPermission = (user.modules as any)[requiredModule];
        if (!hasPermission) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                    <div className="text-center max-w-md p-8">
                        <div className="text-6xl mb-4">🔒</div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                            Không có quyền truy cập
                        </h2>
                        <p className="text-slate-600 dark:text-slate-400">
                            Bạn không có quyền truy cập module này. Vui lòng liên hệ quản trị viên.
                        </p>
                    </div>
                </div>
            );
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute;
