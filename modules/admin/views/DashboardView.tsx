import React from 'react';
import { UserGroupIcon, CogIcon } from '../../../components/Icons';

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
      <p className="text-slate-500 dark:text-slate-400 -mt-2">Tổng quan về cài đặt và quản trị hệ thống.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title="Tổng số người dùng" value="12" icon={<UserGroupIcon className="w-6 h-6 text-white"/>} color="bg-blue-500" />
        <DashboardCard title="Module hoạt động" value="8" icon={<CogIcon className="w-6 h-6 text-white"/>} color="bg-emerald-500" />
      </div>
    </div>
  );
};

export default DashboardView;