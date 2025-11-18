import React, { useState } from 'react';
import { Invoice } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const mockInvoices: Invoice[] = [
  { id: 'INV001', patientName: 'Nguyễn Văn An', date: '2023-10-27', amount: 350000, status: 'Paid', items: [{description: 'Phí khám', cost: 150000}, {description: 'Thuốc', cost: 200000}] },
  { id: 'INV002', patientName: 'Trần Thị Bích', date: '2023-10-27', amount: 200000, status: 'Unpaid', items: [{description: 'Tái khám', cost: 100000}, {description: 'Thuốc ho', cost: 100000}] },
  { id: 'INV003', patientName: 'Lê Hoàng Cường', date: '2023-10-26', amount: 750000, status: 'Paid', items: [{description: 'Xét nghiệm máu', cost: 500000}, {description: 'Phí khám', cost: 150000}, {description: 'Thuốc', cost: 100000}] },
  { id: 'INV004', patientName: 'Phạm Thị Dung', date: '2023-10-25', amount: 150000, status: 'Paid', items: [{description: 'Phí khám', cost: 150000}] },
];

const revenueData = [
    { name: 'T2', DoanhThu: 4000000 }, { name: 'T3', DoanhThu: 3000000 }, { name: 'T4', DoanhThu: 5000000 }, { name: 'T5', DoanhThu: 4500000 }, { name: 'T6', DoanhThu: 6000000 }, { name: 'T7', DoanhThu: 5800000 }, { name: 'CN', DoanhThu: 2500000 },
];

const DashboardCard: React.FC<{title: string; value: string; color: string}> = ({title, value, color}) => (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
        <h3 className="text-slate-500 dark:text-slate-400 font-medium">{title}</h3>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
);

const DashboardView: React.FC = () => {
  const [invoices] = useState<Invoice[]>(mockInvoices);
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <p className="text-slate-500 dark:text-slate-400">Tạo và quản lý hóa đơn, theo dõi tình hình tài chính.</p>
        <button className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105">
          + Tạo Hóa đơn mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Doanh thu hôm nay" value="1.100.000đ" color="text-secondary" />
        <DashboardCard title="Hóa đơn chưa thanh toán" value="2" color="text-yellow-500" />
        <DashboardCard title="Tổng bệnh nhân" value="4" color="text-cyan-500 dark:text-cyan-400" />
        <DashboardCard title="Doanh thu tháng" value="25.800.000đ" color="text-blue-500 dark:text-blue-400" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Doanh thu tuần</h2>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" tick={{fill: tickColor}} />
                <YAxis tickFormatter={(value) => new Intl.NumberFormat('vi-VN').format(Number(value))} tick={{fill: tickColor}}/>
                <Tooltip 
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0' }}
                  labelStyle={{color: theme === 'dark' ? '#e2e8f0' : '#1e293b'}}
                  formatter={(value) => [`${new Intl.NumberFormat('vi-VN').format(Number(value))}đ`, "Doanh thu"]}
                />
                <Legend wrapperStyle={{color: tickColor}} />
                <Bar dataKey="DoanhThu" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
        <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Hóa đơn gần đây</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                            <th className="p-2">Mã HĐ</th><th className="p-2">Bệnh nhân</th><th className="p-2">Số tiền</th><th className="p-2">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.slice(0, 5).map(inv => (
                            <tr key={inv.id} className="border-b border-slate-100 dark:border-slate-700">
                                <td className="p-2 font-mono text-primary dark:text-dark-primary">{inv.id}</td>
                                <td className="p-2 font-medium text-onSurface dark:text-dark-onSurface">{inv.patientName}</td>
                                <td className="p-2 text-slate-600 dark:text-slate-300">{new Intl.NumberFormat('vi-VN').format(inv.amount)}đ</td>
                                <td className="p-2">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${inv.status === 'Paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'}`}>
                                        {inv.status === 'Paid' ? 'Đã trả' : 'Chưa trả'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
