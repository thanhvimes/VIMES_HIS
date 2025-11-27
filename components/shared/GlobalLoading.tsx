
import React from 'react';
import { ClipboardListIcon } from '../Icons';

const GlobalLoading: React.FC<{ message?: string }> = ({ message = "Đang tải dữ liệu hệ thống..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="relative">
        {/* Pulsing Background */}
        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-full animate-ping opacity-75"></div>
        
        <div className="relative z-10 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
            <ClipboardListIcon className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-pulse" />
        </div>
      </div>
      
      <h2 className="mt-8 text-xl font-bold text-slate-700 dark:text-slate-200 tracking-tight animate-pulse">
        ClinicMS
      </h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{message}</p>
      
      <div className="mt-6 w-48 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 w-1/2 animate-[shimmer_1.5s_infinite_linear] rounded-full"></div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default GlobalLoading;
