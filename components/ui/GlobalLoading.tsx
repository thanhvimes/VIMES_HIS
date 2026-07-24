import React from 'react';
import VimesLogo from './VimesLogo';

const GlobalLoading: React.FC<{ message?: string }> = ({ message = "Đang tải dữ liệu hệ thống..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="relative">
        {/* Ambient Glow */}
        <div className="absolute -inset-4 bg-teal-500/10 dark:bg-teal-400/10 rounded-3xl animate-pulse blur-xl pointer-events-none"></div>

        {/* Logo Card */}
        <div className="relative z-10 bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-slate-200/80 dark:shadow-slate-900/60 border border-slate-100 dark:border-slate-700/80 flex items-center justify-center px-8 py-5">
          <VimesLogo height={72} />
        </div>
      </div>

      {/* Loading message */}
      <p className="mt-7 text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide">{message}</p>

      {/* Shimmer progress bar */}
      <div className="mt-4 w-52 h-1.5 bg-slate-200 dark:bg-slate-700/60 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 via-blue-500 to-cyan-400 w-1/2 rounded-full"
          style={{ animation: 'shimmer 1.5s infinite linear' }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default GlobalLoading;
