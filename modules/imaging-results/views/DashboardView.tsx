import React from 'react';
import { PhotographIcon, ListBulletIcon } from '../../../components/Icons';

const DashboardCard: React.FC<{title: string; value: string; icon: React.ReactNode; color: string}> = ({title, value, icon, color}) => (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
        <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${color}`}>
                {icon}
            </div>
            <div>
                <h3 className="text-slate-500 dark:text-slate-400 font-medium">{title}</h3>
                <p className="text-3xl font-bold text-onSurface dark:text-dark-onSurface">{value}</p>
            </div>
        </div>
    </div>
);

const DashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <p className="text-slate-500 dark:text-slate-400 -mt-2">Tổng quan tình hình kết quả chẩn đoán hình ảnh.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title="Tổng số CĐHA" value="10" icon={<ListBulletIcon className="w-6 h-6 text-white"/>} color="bg-cyan-500" />
        <DashboardCard title="Kết quả đang chờ" value="1" icon={<PhotographIcon className="w-6 h-6 text-white"/>} color="bg-amber-500" />
        <DashboardCard title="Hoàn thành hôm nay" value="9" icon={<PhotographIcon className="w-6 h-6 text-white"/>} color="bg-emerald-500" />
      </div>

       <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Kết quả chờ xử lý</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                <div className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div>
                        <p className="font-medium text-onSurface dark:text-dark-onSurface">Nguyễn Văn An</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Siêu âm ổ bụng</p>
                    </div>
                    <p className="text-amber-600 dark:text-amber-400 font-semibold">Đang chờ</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;
