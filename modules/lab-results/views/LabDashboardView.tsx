
import React from 'react';
import { MicroscopeIcon, ClipboardListIcon, CheckBadgeIcon, ExclamationCircleIcon } from '../../../components/Icons';

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

const LabDashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <p className="text-slate-500 dark:text-slate-400 -mt-2">Tổng quan hoạt động khoa Xét nghiệm (LIS).</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Chờ lấy mẫu" value="12" icon={<ClipboardListIcon className="w-6 h-6 text-white"/>} color="bg-blue-500" />
        <DashboardCard title="Đang thực hiện" value="8" icon={<MicroscopeIcon className="w-6 h-6 text-white"/>} color="bg-orange-500" />
        <DashboardCard title="Đã trả KQ" value="45" icon={<CheckBadgeIcon className="w-6 h-6 text-white"/>} color="bg-green-500" />
        <DashboardCard title="Chỉ số QC lỗi" value="2" icon={<ExclamationCircleIcon className="w-6 h-6 text-white"/>} color="bg-red-500" />
      </div>

       <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Trạng thái máy xét nghiệm</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-green-700 dark:text-green-400">Sysmex XN-1000</h3>
                        <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">Online</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Huyết học: Sẵn sàng</p>
                </div>
                <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-green-700 dark:text-green-400">Cobas 6000</h3>
                        <span className="text-xs px-2 py-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">Online</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Sinh hóa: Đang chạy mẫu (5/40)</p>
                </div>
                <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-red-700 dark:text-red-400">UriSys 2400</h3>
                        <span className="text-xs px-2 py-1 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-full">Maintenance</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Nước tiểu: Bảo trì định kỳ</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default LabDashboardView;
