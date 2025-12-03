
import React, { useState, useEffect, useMemo } from 'react';
import { 
    AreaChart, 
    Area, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer 
} from 'recharts';
import { invoiceService, RevenueStat } from '../../../../services/invoiceService';
import { RefreshIcon, ChartBarIcon, CurrencyDollarIcon, DocumentTextIcon, CalendarIcon } from '../../../../components/Icons';
import { useTheme } from '../../../../contexts/ThemeContext';

const ElectronicInvoiceReport: React.FC = () => {
    const { fontSettings } = useTheme();
    const [reportType, setReportType] = useState<'day' | 'month'>('day');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    
    const [data, setData] = useState<RevenueStat[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchReport = async () => {
        setIsLoading(true);
        try {
            const result = await invoiceService.getRevenueStats(reportType, selectedYear, selectedMonth);
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [reportType, selectedYear, selectedMonth]);

    const stats = useMemo(() => {
        const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
        const totalCount = data.reduce((sum, item) => sum + item.count, 0);
        const avgValue = totalCount > 0 ? totalAmount / totalCount : 0;
        return { totalAmount, totalCount, avgValue };
    }, [data]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 rounded shadow-lg text-sm">
                    <p className="font-bold mb-2 text-slate-700 dark:text-slate-200">{label}</p>
                    <p className="text-blue-600 dark:text-blue-400 font-bold">
                        Doanh thu: {formatCurrency(payload[0].value)}
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                        Số lượng: {payload[0].payload.count} hóa đơn
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <ChartBarIcon className="w-6 h-6 text-blue-600"/>
                        Báo cáo Doanh thu
                    </h3>
                </div>
                
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                        <button 
                            onClick={() => setReportType('day')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${reportType === 'day' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            Theo Ngày
                        </button>
                        <button 
                            onClick={() => setReportType('month')}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${reportType === 'month' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                        >
                            Theo Tháng
                        </button>
                    </div>

                    {reportType === 'day' && (
                        <div className="relative">
                            <select 
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className={`pl-3 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm ${fontSettings.controls}`}
                            >
                                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>Tháng {m}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="relative">
                        <select 
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className={`pl-3 pr-8 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm ${fontSettings.controls}`}
                        >
                            <option value={2023}>Năm 2023</option>
                            <option value={2024}>Năm 2024</option>
                            <option value={2025}>Năm 2025</option>
                        </select>
                    </div>
                    
                    <button onClick={fetchReport} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition" title="Làm mới">
                        <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}/>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-100 text-xs font-bold uppercase mb-1">Tổng Doanh Thu</p>
                            <h3 className="text-3xl font-black tracking-tight">
                                {isLoading ? '...' : formatCurrency(stats.totalAmount)}
                            </h3>
                        </div>
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <CurrencyDollarIcon className="w-6 h-6 text-white"/>
                        </div>
                    </div>
                </div>
                
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Số lượng Hóa đơn</p>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                                {isLoading ? '...' : stats.totalCount.toLocaleString()}
                            </h3>
                        </div>
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500">
                            <DocumentTextIcon className="w-6 h-6"/>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-1">Giá trị TB / Hóa đơn</p>
                            <h3 className="text-3xl font-bold text-slate-800 dark:text-white">
                                {isLoading ? '...' : formatCurrency(stats.avgValue)}
                            </h3>
                        </div>
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-500">
                            <ChartBarIcon className="w-6 h-6"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 min-h-[400px] flex flex-col">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6 text-sm uppercase">
                    Biểu đồ doanh thu {reportType === 'day' ? `Tháng ${selectedMonth}/${selectedYear}` : `Năm ${selectedYear}`}
                </h3>
                <div className="flex-1 w-full h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis 
                                dataKey="label" 
                                tick={{fill: '#94a3b8', fontSize: 12}} 
                                axisLine={false} 
                                tickLine={false}
                            />
                            <YAxis 
                                tick={{fill: '#94a3b8', fontSize: 12}} 
                                axisLine={false} 
                                tickLine={false}
                                tickFormatter={(value) => 
                                    new Intl.NumberFormat('vi-VN', { notation: "compact", compactDisplay: "short" }).format(value)
                                }
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <Tooltip content={<CustomTooltip />} cursor={{stroke: '#3b82f6', strokeWidth: 1, strokeDasharray: '4 4'}} />
                            <Area 
                                type="monotone" 
                                dataKey="amount" 
                                stroke="#3b82f6" 
                                strokeWidth={3}
                                fillOpacity={1} 
                                fill="url(#colorRevenue)" 
                                animationDuration={1500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ElectronicInvoiceReport;
