import React, { useState } from 'react';
import { ClipboardListIcon } from '../../components/Icons';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('demo@clinicms.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

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
    <div className="flex items-center justify-center min-h-screen bg-background dark:bg-dark-background p-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-surface dark:bg-dark-surface rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700">
        <div className="flex flex-col items-center text-center">
          <ClipboardListIcon className="h-12 w-12 text-primary dark:text-dark-primary" />
          <h1 className="mt-4 text-3xl font-bold text-onSurface dark:text-dark-onSurface">ClinicMS</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Chào mừng! Vui lòng đăng nhập.</p>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-600 dark:text-slate-300">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-inherit border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password"className="text-sm font-medium text-slate-600 dark:text-slate-300">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-inherit border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-light transition-transform transform hover:scale-105"
            >
              Đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
