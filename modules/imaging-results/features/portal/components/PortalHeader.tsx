import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Sun, Moon, Phone, ArrowLeft } from 'lucide-react';
import { HospitalLogo, BRANDING } from '../../../config/branding';

interface PortalHeaderProps {
  theme: string;
  toggleTheme: () => void;
}

export const PortalHeader: React.FC<PortalHeaderProps> = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#081225]/85 backdrop-blur-xl border-b border-slate-200 dark:border-[#1c3258]/70 shadow-sm dark:shadow-2xl transition-all">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Hospital Brand & Trust Badges */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#005a9e] to-[#008A5E] p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-[#081225] rounded-[14px] flex items-center justify-center">
              <HospitalLogo className="w-6 h-6" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-slate-900 dark:text-white uppercase font-sans">
                {BRANDING.hospitalName}
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[9px] bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                <ShieldCheck className="w-3 h-3" /> Cổng Bệnh Nhân 5 Sao
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
              <span>Hệ Thống Trả Kết Quả CĐHA Trực Tuyến Mã Hóa SSL 256-Bit</span>
            </p>
          </div>
        </div>

        {/* Right Header: Theme Switcher + Doctor Portal Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-300 border border-slate-300 dark:border-slate-600 transition cursor-pointer"
            title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng (Light Mode)' : 'Chuyển sang Giao diện Tối (Dark Mode)'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
          </button>

          <a
            href="tel:19008888"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition"
          >
            <Phone className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Hotline: 1900 8888</span>
          </a>

          <button
            onClick={() => navigate('/login')}
            className="px-3.5 py-1.5 rounded-xl bg-sky-50 dark:bg-[#0f274a] hover:bg-sky-100 dark:hover:bg-[#163868] text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-[#1e4e8c]/70 text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Khu vực dành riêng cho Bác sĩ & Nhân viên y tế ViMES"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Bác Sĩ Đăng Nhập</span>
          </button>
        </div>
      </div>
    </header>
  );
};
