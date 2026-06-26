import React from 'react';
import { PhotographIcon, ListBulletIcon } from '../../../components/Icons';

interface DashboardCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    textColor: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color, textColor }) => (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md border border-slate-200/50 dark:border-slate-800 flex items-center space-x-4 hover:shadow-lg transition-shadow duration-300">
        <div className={`p-4 rounded-xl ${color} ${textColor} flex items-center justify-center`}>
            {icon}
        </div>
        <div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide">{title}</h3>
            <p className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1 leading-none">{value}</p>
        </div>
    </div>
);

const DashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white">Bảng Thống kê Hoạt động (PACS-RIS)</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tổng quan tình hình tiếp nhận, chỉ định và duyệt kết quả chẩn đoán hình ảnh.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Chỉ định Trong Ngày" value="12 ca" icon={<ListBulletIcon className="w-6 h-6"/>} color="bg-cyan-50 dark:bg-cyan-950/30" textColor="text-cyan-600 dark:text-cyan-400" />
        <DashboardCard title="Chưa có Kết quả (Hàng chờ)" value="5 ca" icon={<PhotographIcon className="w-6 h-6"/>} color="bg-amber-50 dark:bg-amber-950/30" textColor="text-amber-600 dark:text-amber-400" />
        <DashboardCard title="Đã Duyệt & Ký số" value="7 ca" icon={<PhotographIcon className="w-6 h-6"/>} color="bg-emerald-50 dark:bg-emerald-950/30" textColor="text-emerald-600 dark:text-emerald-400" />
      </div>

       <div className="bg-surface dark:bg-dark-surface p-6 rounded-2xl shadow-md border border-slate-200/50 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                Các ca đang đọc / chờ xử lý khẩn cấp
            </h2>
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">Nguyễn Văn Mạnh</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">X-Quang Ngực thẳng kỹ thuật số • 45 tuổi</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200/30">
                        Đang chụp (Acquired)
                    </span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">Lê Thị Hồng</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Siêu âm ổ bụng tổng quát • 38 tuổi</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200/30">
                        Đang đọc (Processing)
                    </span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;
