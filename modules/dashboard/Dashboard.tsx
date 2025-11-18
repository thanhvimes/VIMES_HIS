import React from 'react';
import { Link } from 'react-router-dom';
import { MODULE_ITEMS } from '../../constants/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UserGroupIcon, CurrencyDollarIcon, ClipboardListIcon } from '../../components/Icons';
import { useTheme } from '../../contexts/ThemeContext';

const revenueData = [
    { name: 'T2', DoanhThu: 4000000 },
    { name: 'T3', DoanhThu: 3000000 },
    { name: 'T4', DoanhThu: 5000000 },
    { name: 'T5', DoanhThu: 4500000 },
    { name: 'T6', DoanhThu: 6000000 },
    { name: 'T7', DoanhThu: 5800000 },
    { name: 'CN', DoanhThu: 2500000 },
];

const DashboardCard: React.FC<{title: string; value: string; icon: React.ReactNode; color: string}> = ({title, value, icon, color}) => (
    <div className="bg-surface dark:bg-dark-surface p-5 rounded-xl shadow-lg flex items-center space-x-4 border border-slate-200/50 dark:border-slate-700">
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
        <div>
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm">{title}</h3>
          <p className="text-2xl font-bold text-onSurface dark:text-dark-onSurface">{value}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-onSurface dark:text-dark-onSurface">Chào mừng trở lại, Dr. Minh!</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Đây là tổng quan nhanh về hoạt động của phòng khám hôm nay.</p>
      </div>
      
      <div>
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Tổng quan nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DashboardCard title="Bệnh nhân mới" value="4" icon={<UserGroupIcon className="w-6 h-6 text-white"/>} color="bg-cyan-500" />
            <DashboardCard title="Doanh thu hôm nay" value="1.100.000đ" icon={<CurrencyDollarIcon className="w-6 h-6 text-white"/>} color="bg-emerald-500" />
            <DashboardCard title="Lịch hẹn hôm nay" value="8" icon={<ClipboardListIcon className="w-6 h-6 text-white"/>} color="bg-amber-500" />
        </div>
      </div>


      <div>
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Lối tắt chức năng</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
          {MODULE_ITEMS.map(item => (
            <Link 
              key={item.name} 
              to={item.path} 
              className="flex flex-col items-center justify-center p-6 bg-surface dark:bg-dark-surface rounded-xl shadow-lg text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200/50 dark:border-slate-700"
            >
              <div className="text-primary dark:text-dark-primary h-10 w-10 mb-3">{React.cloneElement(item.icon, { className: 'w-10 h-10'})}</div>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
      
      <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Doanh thu tuần</h2>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="name" tick={{fill: tickColor, fontSize: 12}} />
            <YAxis tickFormatter={(value) => `${Number(value)/1000000}tr`} tick={{fill: tickColor, fontSize: 12}}/>
            <Tooltip 
              formatter={(value) => [`${new Intl.NumberFormat('vi-VN').format(Number(value))}đ`, "Doanh thu"]}
              contentStyle={{
                backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                borderColor: theme === 'dark' ? '#334155' : '#e2e8f0'
              }}
              labelStyle={{color: theme === 'dark' ? '#e2e8f0' : '#1e293b'}}
              itemStyle={{ color: theme === 'dark' ? '#22d3ee' : '#06b6d4' }}
              cursor={{fill: theme === 'dark' ? 'rgba(34, 211, 238, 0.1)' : 'rgba(6, 182, 212, 0.1)'}}
            />
            <Bar dataKey="DoanhThu" fill={theme === 'dark' ? '#22d3ee' : '#06b6d4'} radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
