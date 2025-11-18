import React from 'react';
import { CurrencyDollarIcon, UserGroupIcon, CalendarIcon, HeartIcon } from '../../../components/Icons';

// FIX: Explicitly typed the 'icon' prop as React.ReactElement<any> to allow adding props with React.cloneElement, resolving the type error.
const DashboardCard: React.FC<{title: string; value: string; icon: React.ReactElement<any>; color: string; note?: string}> = ({title, value, icon, color, note}) => (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="text-slate-500 dark:text-slate-400 font-medium">{title}</h3>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
                 {note && <p className="text-xs text-slate-400 mt-1">{note}</p>}
            </div>
            <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('text-', 'bg-')}`}>
                {React.cloneElement(icon, { className: `w-6 h-6 ${color}` })}
            </div>
        </div>
    </div>
);

const DashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Báo cáo tổng quan cho Lãnh đạo</h1>
      <p className="text-slate-500 dark:text-slate-400 -mt-4">Các chỉ số hiệu suất chính (KPIs) về hoạt động của phòng khám.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Tổng doanh thu (Tháng)" value="25.8M" icon={<CurrencyDollarIcon/>} color="text-emerald-500" note="+15% so với tháng trước" />
        <DashboardCard title="Bệnh nhân mới (Tháng)" value="124" icon={<UserGroupIcon/>} color="text-blue-500" note="+5% so với tháng trước"/>
        <DashboardCard title="Tỷ lệ lấp đầy lịch hẹn" value="85%" icon={<CalendarIcon/>} color="text-cyan-500" note="Mục tiêu: 90%" />
        <DashboardCard title="Khoa đông nhất" value="Khám nội" icon={<HeartIcon/>} color="text-amber-500" note="Chiếm 30% tổng lượt khám" />
      </div>

       <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Biểu đồ tổng quan (Đang phát triển)</h2>
            <div className="flex items-center justify-center h-80 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-slate-400">Biểu đồ so sánh doanh thu và lượt khám theo thời gian</p>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;