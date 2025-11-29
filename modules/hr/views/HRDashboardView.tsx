
import React from 'react';
import { UserCircleIcon, BriefcaseIcon, AcademicCapIcon, CashIcon } from '../icons';
import { ChartBarIcon, UserGroupIcon, ClockIcon, ExclamationCircleIcon } from '../../../components/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const staffByDept = [
    { name: 'Khoa Nội', value: 15 },
    { name: 'Khoa Ngoại', value: 10 },
    { name: 'CĐHA', value: 8 },
    { name: 'Xét nghiệm', value: 6 },
    { name: 'Dược', value: 5 },
    { name: 'Hành chính', value: 4 },
];
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const DashboardCard = ({ title, value, subtext, icon, color }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 flex justify-between items-start">
        <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">{title}</h3>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{value}</p>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-full ${color} shadow-sm`}>
            {icon}
        </div>
    </div>
);

const HRDashboardView: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tổng quan Nhân sự</h1>
                    <p className="text-slate-500 text-sm">Theo dõi tình hình nhân lực, công và lương thưởng.</p>
                </div>
                <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow transition text-sm">
                    Xuất báo cáo tháng
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard 
                    title="Tổng nhân sự" 
                    value="48" 
                    subtext="Chính thức: 42 | Thử việc: 6" 
                    icon={<UserGroupIcon className="w-6 h-6 text-white"/>} 
                    color="bg-blue-500"
                />
                <DashboardCard 
                    title="Đang nghỉ phép" 
                    value="3" 
                    subtext="2 Nghỉ ốm | 1 Nghỉ phép năm" 
                    icon={<ClockIcon className="w-6 h-6 text-white"/>} 
                    color="bg-orange-500"
                />
                <DashboardCard 
                    title="Sắp hết hạn CCHN" 
                    value="2" 
                    subtext="Cần gia hạn trong 30 ngày" 
                    icon={<AcademicCapIcon className="w-6 h-6 text-white"/>} 
                    color="bg-red-500"
                />
                <DashboardCard 
                    title="Quỹ lương (Est)" 
                    value="850M" 
                    subtext="Tháng 11/2023" 
                    icon={<CashIcon className="w-6 h-6 text-white"/>} 
                    color="bg-green-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6">Phân bổ Nhân sự theo Khoa/Phòng</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={staffByDept} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} name="Số lượng" barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Alerts */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <ExclamationCircleIcon className="w-5 h-5 text-red-500"/> Cảnh báo & Nhắc việc
                    </h3>
                    <div className="space-y-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
                            <div className="text-sm font-bold text-red-700 dark:text-red-400">Hết hạn CCHN: BS. Nguyễn Văn A</div>
                            <div className="text-xs text-red-600/80 mt-1">Ngày hết hạn: 15/12/2023. Cần nộp hồ sơ gia hạn ngay.</div>
                        </div>
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-lg">
                            <div className="text-sm font-bold text-yellow-700 dark:text-yellow-400">Đánh giá thử việc: ĐD. Phạm Thu Hà</div>
                            <div className="text-xs text-yellow-600/80 mt-1">Hết hạn thử việc: 30/11/2023.</div>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                            <div className="text-sm font-bold text-blue-700 dark:text-blue-400">Sinh nhật tháng 11</div>
                            <div className="text-xs text-blue-600/80 mt-1">3 nhân viên có sinh nhật trong tuần tới.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HRDashboardView;
