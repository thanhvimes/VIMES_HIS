
import React from 'react';
import { LibraryIcon, ClipboardListIcon, SwitchHorizontalIcon, ExclamationCircleIcon } from '../../../components/Icons';

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

const RecordDashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <p className="text-slate-500 dark:text-slate-400 -mt-2">Tổng quan hoạt động lưu trữ hồ sơ bệnh án.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Tổng hồ sơ lưu trữ" value="15,420" icon={<LibraryIcon className="w-6 h-6 text-white"/>} color="bg-orange-500" />
        <DashboardCard title="Chờ tiếp nhận" value="12" icon={<ClipboardListIcon className="w-6 h-6 text-white"/>} color="bg-blue-500" />
        <DashboardCard title="Đang cho mượn" value="8" icon={<SwitchHorizontalIcon className="w-6 h-6 text-white"/>} color="bg-teal-500" />
        <DashboardCard title="Hết hạn lưu trữ" value="45" icon={<ExclamationCircleIcon className="w-6 h-6 text-white"/>} color="bg-red-500" />
      </div>

       <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Hoạt động gần đây</h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                <div className="flex justify-between items-center text-sm p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div>
                        <p className="font-medium text-onSurface dark:text-dark-onSurface">Tiếp nhận HS: Nguyễn Văn An (21024061)</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Khoa Nội tổng hợp - Kho lưu trữ</p>
                    </div>
                    <span className="text-xs text-slate-400">10 phút trước</span>
                </div>
                 <div className="flex justify-between items-center text-sm p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div>
                        <p className="font-medium text-onSurface dark:text-dark-onSurface">Xuất mượn HS: Trần Thị Bích (21024062)</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Người mượn: BS. Lê Văn C (Phòng KHTH)</p>
                    </div>
                    <span className="text-xs text-slate-400">30 phút trước</span>
                </div>
                 <div className="flex justify-between items-center text-sm p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div>
                        <p className="font-medium text-onSurface dark:text-dark-onSurface">Số hóa HS: Lê Hoàng Cường (21024067)</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Scan hoàn tất - File PDF đã đính kèm</p>
                    </div>
                    <span className="text-xs text-slate-400">1 giờ trước</span>
                </div>
            </div>
        </div>
    </div>
  );
};

export default RecordDashboardView;
