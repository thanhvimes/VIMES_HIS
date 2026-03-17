// ==================== LOGIN VIEW ====================
// File: views/LoginView.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

const LoginView: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { addNotification } = useNotification();

    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId || !password) {
            addNotification('Lỗi', 'Vui lòng nhập đầy đủ thông tin', 'warning', undefined, true);
            return;
        }

        setIsLoading(true);
        try {
            await login(userId, password);
            addNotification('Thành công', 'Đăng nhập thành công', 'success', undefined, true);
            navigate('/');
        } catch (error: any) {
            addNotification('Lỗi đăng nhập', error.message || 'Đăng nhập thất bại', 'error', undefined, true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo & Hospital Info */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-600 rounded-2xl mb-4 shadow-xl">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2">
                        VIMES HIS
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">
                        Hệ thống Quản lý Bệnh viện
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 text-center">
                        Đăng nhập
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* User ID */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Tên đăng nhập
                            </label>
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => setUserId(e.target.value)}
                                placeholder="Nhập mã người dùng"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Nhập mật khẩu"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang đăng nhập...
                                </>
                            ) : (
                                'Đăng nhập'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                            Bệnh viện Đa khoa Quốc tế VIMES
                        </p>
                        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-1">
                            © 2026 VIMES HIS. All rights reserved.
                        </p>
                    </div>
                </div>

                {/* Demo Credentials */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                    <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-2">
                        🔐 Tài khoản demo:
                    </p>
                    <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                        <p>• User: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">admin</code> / Pass: <code className="bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">password</code></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginView;
