import React from 'react';
import { ArchiveIcon, BellIcon, CurrencyDollarIcon } from '../../../components/Icons';

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
      <p className="text-slate-500 dark:text-slate-400 -mt-2">Tổng quan tình hình dược và vật tư y tế.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title="Thuốc sắp hết" value="3" icon={<BellIcon className="w-6 h-6 text-white"/>} color="bg-red-500" />
        <DashboardCard title="Tổng loại thuốc" value="128" icon={<ArchiveIcon className="w-6 h-6 text-white"/>} color="bg-cyan-500" />
        <DashboardCard title="Giá trị kho" value="150.000.000đ" icon={<CurrencyDollarIcon className="w-6 h-6 text-white"/>} color="bg-emerald-500" />
      </div>

       <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Các mặt hàng sắp hết</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                <div className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <p className="font-medium text-onSurface dark:text-dark-onSurface">Omeprazol 20mg</p>
                    <p className="font-bold text-red-500">Còn lại: 25</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;
