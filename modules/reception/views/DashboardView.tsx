import React from 'react';
import { UserGroupIcon, CalendarIcon, ClipboardListIcon } from '../../../components/Icons';

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
      <p className="text-slate-500 dark:text-slate-400 -mt-2">Tổng quan hoạt động tiếp nhận bệnh nhân trong ngày.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title="Bệnh nhân hôm nay" value="25" icon={<UserGroupIcon className="w-6 h-6 text-white"/>} color="bg-cyan-500" />
        <DashboardCard title="Lịch hẹn chờ" value="8" icon={<CalendarIcon className="w-6 h-6 text-white"/>} color="bg-amber-500" />
        <DashboardCard title="Check-in hoàn tất" value="17" icon={<ClipboardListIcon className="w-6 h-6 text-white"/>} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Lượng bệnh nhân theo giờ</h2>
            <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-slate-400">Biểu đồ đang được phát triển</p>
            </div>
        </div>
        <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Đăng ký gần đây</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                <div className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <p className="font-medium text-onSurface dark:text-dark-onSurface">Nguyễn Thị Ngọ</p>
                    <p className="text-slate-500 dark:text-slate-400">07:16 - Chờ khám</p>
                </div>
                 <div className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <p className="font-medium text-onSurface dark:text-dark-onSurface">Nguyễn Huỳnh Th...</p>
                    <p className="text-slate-500 dark:text-slate-400">07:08 - Đã khám</p>
                </div>
                 <div className="flex justify-between items-center text-sm p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <p className="font-medium text-onSurface dark:text-dark-onSurface">Trương Thị Hồng Vân</p>
                    <p className="text-slate-500 dark:text-slate-400">08:30 - Chờ khám</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;