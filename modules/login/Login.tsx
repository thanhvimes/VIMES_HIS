
import React, { useState } from 'react';
import { ClipboardListIcon } from '../../components/Icons';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('demo@clinicms.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (email === 'demo@clinicms.com' && password === 'password') {
      onLogin();
    } else {
      setError('Tài khoản hoặc mật khẩu không đúng.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background dark:bg-dark-background p-4 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        
        <div className="w-full max-w-sm p-8 space-y-6 bg-surface dark:bg-dark-surface rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700 relative z-10">
            <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-full mb-4">
                <ClipboardListIcon className="h-10 w-10 text-primary dark:text-dark-primary" />
            </div>
            <h1 className="text-3xl font-bold text-onSurface dark:text-dark-onSurface tracking-tight">ClinicMS</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Hệ thống Quản lý Bệnh viện</p>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
                <label htmlFor="email" className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1.5">Email / Tài khoản</label>
                <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
                />
            </div>
            <div>
                <label htmlFor="password"className="text-sm font-bold text-slate-600 dark:text-slate-300 block mb-1.5">Mật khẩu</label>
                <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
                />
            </div>
            
            {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-400 text-center">{error}</div>}
            
            <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all transform active:scale-95"
            >
                Đăng nhập Hệ thống
            </button>
            </form>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 text-center">
                <button 
                    onClick={() => navigate('/portal/home')}
                    className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary-light transition-colors font-medium"
                >
                    <span>←</span> Quay lại Cổng Bệnh nhân
                </button>
            </div>
        </div>
    </div>
  );
};

export default Login;
