import React from 'react';
import { HeartIcon, UserGroupIcon, SparklesIcon } from '../../../components/Icons';

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
      <p className="text-slate-500 dark:text-slate-400 -mt-2">Tổng quan hoạt động khám và chẩn đoán trong ngày.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title="Bệnh nhân đang chờ" value="5" icon={<UserGroupIcon className="w-6 h-6 text-white"/>} color="bg-amber-500" />
        <DashboardCard title="Đã khám xong" value="12" icon={<HeartIcon className="w-6 h-6 text-white"/>} color="bg-emerald-500" />
        <DashboardCard title="Lượt dùng AI" value="8" icon={<SparklesIcon className="w-6 h-6 text-white"/>} color="bg-blue-500" />
      </div>

       <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Danh sách chờ khám</h2>
            <div className="space-y-3 max-h-80 overflow-y-auto">
                <div className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <p className="font-medium text-onSurface dark:text-dark-onSurface">Lê Hoàng Cường</p>
                    <p className="text-slate-500 dark:text-slate-400">Lý do: Đau đầu, chóng mặt</p>
                    <button className="text-sm bg-primary text-white px-3 py-1 rounded-md hover:bg-primary-dark">Bắt đầu khám</button>
                </div>
                 <div className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <p className="font-medium text-onSurface dark:text-dark-onSurface">Phạm Thị Dung</p>
                    <p className="text-slate-500 dark:text-slate-400">Lý do: Tái khám định kỳ</p>
                    <button className="text-sm bg-primary text-white px-3 py-1 rounded-md hover:bg-primary-dark">Bắt đầu khám</button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;
