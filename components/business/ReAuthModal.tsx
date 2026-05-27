import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { useSession } from '../../contexts/SessionContext';
import { LockIcon, UserGroupIcon, ShieldCheckIcon } from '../Icons';


interface ReAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    description?: string;
}

const ReAuthModal: React.FC<ReAuthModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    title = "Xác nhận danh tính",
    description = "Để tiếp tục xem hoặc chỉnh sửa thông tin nhạy cảm, vui lòng xác nhận mật khẩu tài khoản của bạn."
}) => {
    const { user } = useSession();
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setError('Vui lòng nhập mật khẩu');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (!user?.username) throw new Error('Không tìm thấy thông tin người dùng');
            
            // Re-login to verify password
            await authService.login(user.username, password);
            
            // If successful, reset and call success callback
            setPassword('');
            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Mật khẩu không chính xác. Vui lòng thử lại.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 min-h-screen animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-bounce-in border border-slate-200 dark:border-slate-700">
                <div className="p-6">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-inner">
                            <ShieldCheckIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl mb-6 border border-slate-100 dark:border-slate-700">
                        <img 
                            className="h-10 w-10 rounded-full border border-white dark:border-slate-700 shadow-sm" 
                            src={user?.avatarUrl || "https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff"} 
                            alt="Avatar" 
                        />
                        <div className="text-left">
                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">{user?.fullName}</p>
                            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{user?.role || 'Nhân viên'}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <LockIcon className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (error) setError(null);
                                }}
                                className={`block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500'} rounded-xl text-sm transition-all focus:outline-none focus:ring-4 text-slate-900 dark:text-white placeholder-slate-400`}
                                placeholder="Nhập mật khẩu của bạn..."
                                autoFocus
                            />
                        </div>

                        {error && (
                            <p className="text-[12px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 animate-fade-in">
                                <span className="flex-shrink-0 w-1 h-1 bg-red-600 rounded-full"></span>
                                {error}
                            </p>
                        )}

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 ${isLoading ? 'opacity-80' : ''}`}
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>Xác nhận danh tính</>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full h-11 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
                            >
                                Hủy bỏ
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ReAuthModal;
