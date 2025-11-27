
import React from 'react';
import { 
    ChartBarIcon, 
    ScissorsIcon, 
    ClockIcon, 
    CheckCircleIcon, 
    ExclamationCircleIcon 
} from '../../../components/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock Data for Charts
const surgeriesByRoom = [
    { name: 'Phòng Mổ 1', value: 45 },
    { name: 'Phòng Mổ 2', value: 62 },
    { name: 'Phòng Mổ 3', value: 38 },
    { name: 'Phòng Tiểu Phẫu', value: 85 },
];

const surgeriesByType = [
    { name: 'Mổ Phiên', value: 150 },
    { name: 'Cấp Cứu', value: 35 },
];

const COLORS = ['#06b6d4', '#ef4444'];
const ROOM_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const KPICard = ({ title, value, subtext, icon, color }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-start justify-between">
        <div>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{value}</h3>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-full ${color} shadow-sm`}>
            {icon}
        </div>
    </div>
);

const SurgeryReportsView: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const tickColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <ChartBarIcon className="w-8 h-8 text-blue-600"/> Báo cáo Phòng mổ
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Thống kê hiệu suất và tình hình hoạt động phẫu thuật.</p>
                </div>
                <div className="flex gap-2">
                    <select className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm shadow-sm focus:ring-2 focus:ring-blue-500">
                        <option>Tháng này</option>
                        <option>Quý này</option>
                        <option>Năm nay</option>
                    </select>
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                    title="Tổng số ca mổ" 
                    value="185" 
                    subtext="+12% so với tháng trước" 
                    icon={<ScissorsIcon className="w-6 h-6 text-white"/>} 
                    color="bg-blue-500"
                />
                <KPICard 
                    title="Tỷ lệ Cấp cứu" 
                    value="18.9%" 
                    subtext="35 ca cấp cứu" 
                    icon={<ExclamationCircleIcon className="w-6 h-6 text-white"/>} 
                    color="bg-red-500"
                />
                <KPICard 
                    title="Thời gian mổ TB" 
                    value="95p" 
                    subtext="Trung bình mỗi ca" 
                    icon={<ClockIcon className="w-6 h-6 text-white"/>} 
                    color="bg-orange-500"
                />
                <KPICard 
                    title="Hoàn thành an toàn" 
                    value="99.5%" 
                    subtext="1 ca tai biến nhẹ" 
                    icon={<CheckCircleIcon className="w-6 h-6 text-white"/>} 
                    color="bg-green-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6">Số lượng ca theo Phòng mổ</h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={surgeriesByRoom} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor}/>
                                <XAxis type="number" tick={{fill: tickColor}}/>
                                <YAxis dataKey="name" type="category" width={100} tick={{fill: tickColor, fontSize: 12}}/>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor, color: isDark ? '#fff' : '#000' }}
                                    cursor={{fill: 'transparent'}}
                                />
                                <Bar dataKey="value" name="Số ca" radius={[0, 4, 4, 0]}>
                                    {surgeriesByRoom.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={ROOM_COLORS[index % ROOM_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6">Tỷ lệ Mổ Phiên vs Cấp Cứu</h3>
                    <div className="flex-1 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={surgeriesByType}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {surgeriesByType.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderColor: gridColor }} />
                                <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SurgeryReportsView;
