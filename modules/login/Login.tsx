
import React, { useState } from 'react';
import { 
    HospitalIcon, 
    UserCircleIcon, 
    KeyIcon, 
    EyeIcon,
    ExclamationCircleIcon
} from '../../components/Icons';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../contexts/SessionContext';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { login } = useSession();
  const [email, setEmail] = useState('admin');
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

    try {
        await login(email, password);
        onLogin(); // Gọi callback để chuyển trang
    } catch (err: any) {
        setError(err.message || 'Tài khoản hoặc mật khẩu không chính xác.');
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
        <div className="w-full max-w-5xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
            {/* LEFT SIDE: BRANDING */}
            <div className="md:w-1/2 bg-gradient-to-br from-teal-600 to-blue-700 relative p-12 text-white flex flex-col justify-between overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/medical-icons.png')]"></div>
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
                    <div className="mt-8 p-4 bg-white/10 rounded-xl border border-white/20 text-xs">
                        <p className="font-bold mb-1">Tài khoản thử nghiệm:</p>
                        <p>• Admin: <span className="font-mono">admin / password</span> (14 Module)</p>
                        <p>• Bác sĩ: <span className="font-mono">demo / password</span> (10 Module)</p>
                    </div>
                </div>
                <div className="relative z-10 text-sm text-blue-100/60 mt-12 md:mt-0">
                    <p>© 2023 VIMES Medical Group. All rights reserved.</p>
                </div>
            </div>

            {/* RIGHT SIDE: LOGIN FORM */}
            <div className="md:w-1/2 p-8 md:p-14 flex flex-col justify-center relative bg-white dark:bg-slate-800">
                <div className="max-w-md mx-auto w-full">
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">Đăng nhập</h2>
                        <p className="text-slate-500 dark:text-slate-400">Dành cho Cán bộ nhân viên y tế</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Tên đăng nhập</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserCircleIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin hoặc demo..."
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mật khẩu</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyIcon className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="block w-full pl-10 pr-10 py-3 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <EyeIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 text-sm text-red-600 flex items-center gap-2">
                                <ExclamationCircleIcon className="h-5 w-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all transform active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Đang xác thực...' : 'Đăng nhập ngay'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Login;
