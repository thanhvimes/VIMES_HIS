
import React, { useState } from 'react';
import { 
    HospitalIcon, 
    UserCircleIcon, 
    KeyIcon, 
    EyeIcon, 
    ArrowUpTrayIcon // Using generic icon as placeholder for back icon if needed
} from '../../components/Icons';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('demo@clinicms.com');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
        if (email === 'demo@clinicms.com' && password === 'password') {
            onLogin();
        } else {
            setError('Tài khoản hoặc mật khẩu không chính xác.');
            setIsLoading(false);
        }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
        
        <div className="w-full max-w-5xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
            
            {/* LEFT SIDE: BRANDING */}
            <div className="md:w-1/2 bg-gradient-to-br from-teal-600 to-blue-700 relative p-12 text-white flex flex-col justify-between overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')]"></div>
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/30">
                            <HospitalIcon className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-xl font-bold tracking-wide">VIMES HIS</h2>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
                        BỆNH VIỆN ĐA KHOA <br/> <span className="text-teal-200">QUỐC TẾ VIMES</span>
                    </h1>
                    <p className="text-blue-100 text-lg max-w-md font-light">
                        Hệ thống quản lý bệnh viện thông minh, toàn diện và hiện đại.
                    </p>
                </div>

                <div className="relative z-10 text-sm text-blue-100/60 mt-12 md:mt-0">
                    <p>© 2023 VIMES Medical Group. All rights reserved.</p>
                    <p>Phiên bản 2.5.0 (Build 20231120)</p>
                </div>
            </div>

            {/* RIGHT SIDE: LOGIN FORM */}
            <div className="md:w-1/2 p-8 md:p-14 flex flex-col justify-center relative bg-white dark:bg-slate-800">
                <div className="max-w-md mx-auto w-full">
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Đăng nhập Hệ thống</h2>
                        <p className="text-slate-500 dark:text-slate-400">Dành cho Cán bộ nhân viên y tế</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tên đăng nhập</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserCircleIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="text" // Changed to text to allow username or email
                                    autoComplete="username"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Nhập tài khoản hoặc email..."
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300">Mật khẩu</label>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    <EyeIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 focus:ring-offset-0 cursor-pointer"
                                />
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Ghi nhớ đăng nhập</span>
                            </label>
                            <a href="#" className="text-sm font-bold text-teal-600 hover:text-teal-700 hover:underline">Quên mật khẩu?</a>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2 animate-shake">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all transform active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
                        <p className="text-sm text-slate-500 mb-3">Bạn là bệnh nhân?</p>
                        <button 
                            onClick={() => navigate('/portal/home')}
                            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold transition-colors"
                        >
                            Truy cập Cổng Bệnh nhân
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;
