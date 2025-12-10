
import React, { useState, useEffect } from 'react';
import { 
    UserGroupIcon, 
    CalendarIcon, 
    CheckCircleIcon,
    ClockIcon,
    UserPlusIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { receptionService, QueueStatus } from '../../../services/receptionService';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../../utils/dateFormatter';

const hourlyData = [
    { hour: '7h', patients: 3 },
    { hour: '8h', patients: 12 },
    { hour: '9h', patients: 18 },
    { hour: '10h', patients: 15 },
    { hour: '11h', patients: 8 },
    { hour: '13h', patients: 10 },
    { hour: '14h', patients: 14 },
    { hour: '15h', patients: 9 },
];

const DashboardCard: React.FC<{title: string; value: string; subtext?: string; icon: React.ReactNode; color: string}> = ({title, value, subtext, icon, color}) => (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 relative overflow-hidden group">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-110 ${color.replace('text-', 'bg-')}`}></div>
        <div className="flex items-start justify-between relative z-10">
            <div>
                <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">{title}</h3>
                <p className="text-3xl font-black text-onSurface dark:text-dark-onSurface mt-2">{value}</p>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color} text-white shadow-md`}>
                {icon}
            </div>
        </div>
    </div>
);

const DashboardView: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  
  // Use custom formatter to ensure consistent date display
  const todayStr = formatDate(new Date());
  
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tổng quan Tiếp nhận</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Theo dõi lưu lượng bệnh nhân và điều phối phòng khám.</p>
          </div>
          <div className="text-sm text-slate-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-blue-500"/>
              {todayStr}
          </div>
      </div>
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
            title="Đã tiếp nhận" 
            value="89" 
            subtext="+15% so với hôm qua"
            icon={<UserGroupIcon className="w-6 h-6"/>} 
            color="bg-cyan-500" 
        />
        <DashboardCard 
            title="Đang chờ khám" 
            value="12" 
            subtext="Thời gian chờ TB: 15p"
            icon={<ClockIcon className="w-6 h-6"/>} 
            color="bg-amber-500" 
        />
        <DashboardCard 
            title="Đã hoàn tất" 
            value="45" 
            subtext="Doanh thu ước tính: 15M"
            icon={<CheckCircleIcon className="w-6 h-6"/>} 
            color="bg-emerald-500" 
        />
        <DashboardCard 
            title="Đặt lịch trước" 
            value="24" 
            subtext="Qua App/Web"
            icon={<CalendarIcon className="w-6 h-6"/>} 
            color="bg-purple-500" 
        />
      </div>

      <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 min-h-[300px]">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <UserPlusIcon className="w-5 h-5 text-blue-500"/>
                    Lưu lượng bệnh nhân theo giờ
                </h2>
                <select className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-xs font-bold px-3 py-1 cursor-pointer outline-none">
                    <option>Hôm nay</option>
                    <option>Hôm qua</option>
                </select>
            </div>
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                    <XAxis dataKey="hour" tick={{fill: tickColor, fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis allowDecimals={false} tick={{fill: tickColor, fontSize: 12}} axisLine={false} tickLine={false} />
                    <Tooltip 
                        cursor={{fill: theme === 'dark' ? '#334155' : '#f8fafc', opacity: 0.4}}
                        contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        labelStyle={{color: theme === 'dark' ? '#e2e8f0' : '#64748b', fontWeight: 'bold', marginBottom: '5px'}}
                    />
                    <Bar dataKey="patients" name="Bệnh nhân" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={32} />
                </BarChart>
            </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DashboardView;
