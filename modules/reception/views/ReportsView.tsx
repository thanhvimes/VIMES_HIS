import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DocumentArrowDownIcon } from '../../../components/Icons';
import { FormDateInput } from '../../../components/shared/forms';

const hourlyData = [
    { hour: '7-8h', registrations: 5 }, { hour: '8-9h', registrations: 12 }, { hour: '9-10h', registrations: 18 }, { hour: '10-11h', registrations: 15 }, { hour: '11-12h', registrations: 7 }, { hour: '13-14h', registrations: 6 }, { hour: '14-15h', registrations: 10 }, { hour: '15-16h', registrations: 9 },
];
const patientTypeData = [{ name: 'Dịch vụ', value: 58 }, { name: 'Bảo hiểm', value: 24 }];
const COLORS = ['#06b6d4', '#10b981'];

const kpiData = [
    { title: 'Tổng lượt đăng ký', value: '82' },
    { title: 'Bệnh nhân mới', value: '15' },
    { title: 'Bệnh nhân tái khám', value: '67' },
    { title: 'Tỷ lệ BHYT', value: '29%' },
];
const detailedReportData = Array.from({ length: 15 }, (_, i) => ({
    id: `BN${1001 + i}`,
    name: `Bệnh Nhân ${i + 1}`,
    time: `09:${(10 + i * 3) % 60}`,
    type: i % 3 === 0 ? 'Bảo hiểm' : 'Dịch vụ',
    status: 'Đã khám',
}));


const ReportsView: React.FC = () => {
    const { theme } = useTheme();
    const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';

    return (
        <div className="space-y-6">
            {/* Header and Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Báo cáo Tiếp nhận</h1>
                    <p className="text-slate-500 dark:text-slate-400">Phân tích hoạt động đăng ký bệnh nhân.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <FormDateInput className="!p-2 text-sm bg-inherit border border-slate-300 dark:border-slate-600 rounded-md w-36" defaultValue="01/10/2023" />
                    <span>-</span>
                    <FormDateInput className="!p-2 text-sm bg-inherit border border-slate-300 dark:border-slate-600 rounded-md w-36" defaultValue={new Date().toLocaleDateString('vi-VN')} />
                    <button className="px-6 py-2 text-sm bg-primary text-white font-semibold rounded-md hover:bg-primary-dark">Lọc</button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiData.map(kpi => (
                    <div key={kpi.title} className="bg-surface dark:bg-dark-surface p-5 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                        <h3 className="text-slate-500 dark:text-slate-400 font-medium">{kpi.title}</h3>
                        <p className="text-3xl font-bold text-onSurface dark:text-dark-onSurface">{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Lượt đăng ký theo giờ</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                            <XAxis dataKey="hour" tick={{ fill: tickColor, fontSize: 12 }} />
                            <YAxis allowDecimals={false} tick={{ fill: tickColor, fontSize: 12 }} />
                            <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff' }} />
                            <Bar dataKey="registrations" name="Lượt đăng ký" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Phân loại bệnh nhân</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={patientTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                {patientTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff' }} />
                            <Legend wrapperStyle={{ color: tickColor }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Report Table */}
            <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Báo cáo chi tiết</h2>
                    <button
                        onClick={() => alert('Đang xuất dữ liệu ra Excel...')}
                        className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-md shadow-sm bg-green-600 hover:bg-green-700 text-white"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        <span>Xuất Excel</span>
                    </button>
                </div>
                <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-sm whitespace-nowrap">
                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                            <tr>
                                {['Mã BN', 'Tên Bệnh Nhân', 'Giờ ĐK', 'Đối tượng', 'Trạng thái'].map(h =>
                                    <th key={h} className="p-3 font-semibold text-left text-slate-600 dark:text-slate-300">{h}</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {detailedReportData.map((row) => (
                                <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-mono text-primary dark:text-dark-primary">{row.id}</td>
                                    <td className="p-3 font-medium">{row.name}</td>
                                    <td className="p-3">{row.time}</td>
                                    <td className="p-3">{row.type}</td>
                                    <td className="p-3">
                                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                                            {row.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
