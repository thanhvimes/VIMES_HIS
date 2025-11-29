
import React, { useState, useMemo, useEffect } from 'react';
import { 
    XIcon, 
    PresentationChartLineIcon, 
    CheckIcon, 
    RefreshIcon,
    CalendarIcon
} from '../../../../../components/Icons';
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    ReferenceLine
} from 'recharts';
import { useTheme } from '../../../../../contexts/ThemeContext';

interface LabTrendModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
}

// Configuration for available metrics to chart
const LAB_METRICS = [
    { code: 'GLU', name: 'Glucose (Máu)', unit: 'mmol/L', color: '#3b82f6', min: 3.9, max: 6.4, group: 'Sinh hóa' },
    { code: 'HBA1C', name: 'HbA1c', unit: '%', color: '#8b5cf6', min: 4.0, max: 6.0, group: 'Sinh hóa' },
    { code: 'CRE', name: 'Creatinine', unit: 'µmol/L', color: '#ef4444', min: 62, max: 106, group: 'Sinh hóa' },
    { code: 'AST', name: 'AST (GOT)', unit: 'U/L', color: '#f59e0b', min: 0, max: 37, group: 'Sinh hóa' },
    { code: 'ALT', name: 'ALT (GPT)', unit: 'U/L', color: '#10b981', min: 0, max: 40, group: 'Sinh hóa' },
    { code: 'WBC', name: 'Bạch cầu (WBC)', unit: 'G/L', color: '#6366f1', min: 4.0, max: 10.0, group: 'Huyết học' },
    { code: 'RBC', name: 'Hồng cầu (RBC)', unit: 'T/L', color: '#ec4899', min: 3.8, max: 5.8, group: 'Huyết học' },
    { code: 'PLT', name: 'Tiểu cầu (PLT)', unit: 'G/L', color: '#14b8a6', min: 150, max: 450, group: 'Huyết học' },
];

const LabTrendModal: React.FC<LabTrendModalProps> = ({ isOpen, onClose, patientId, patientName }) => {
    const { fontSettings } = useTheme();
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['GLU', 'HBA1C']);
    const [dateRange, setDateRange] = useState('6M'); // 3M, 6M, 1Y
    const [chartData, setChartData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Generate Mock Data based on Patient ID and Date Range
    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            // Simulate API Fetch
            setTimeout(() => {
                const data = [];
                const points = dateRange === '3M' ? 5 : dateRange === '6M' ? 8 : 12;
                const now = new Date();
                
                for (let i = points; i >= 0; i--) {
                    const date = new Date(now);
                    date.setDate(date.getDate() - (i * 14 + Math.floor(Math.random() * 5))); // Roughly every 2 weeks
                    
                    // Randomize values somewhat realistically
                    data.push({
                        date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                        timestamp: date.getTime(),
                        GLU: parseFloat((Math.random() * (7.5 - 4.0) + 4.0).toFixed(2)),
                        HBA1C: parseFloat((Math.random() * (7.0 - 5.0) + 5.0).toFixed(1)),
                        CRE: Math.floor(Math.random() * (120 - 60) + 60),
                        AST: Math.floor(Math.random() * (50 - 15) + 15),
                        ALT: Math.floor(Math.random() * (60 - 15) + 15),
                        WBC: parseFloat((Math.random() * (11.0 - 4.0) + 4.0).toFixed(1)),
                        RBC: parseFloat((Math.random() * (5.5 - 3.8) + 3.8).toFixed(2)),
                        PLT: Math.floor(Math.random() * (350 - 150) + 150),
                    });
                }
                setChartData(data);
                setIsLoading(false);
            }, 600);
        }
    }, [isOpen, dateRange, patientId]);

    const toggleMetric = (code: string) => {
        setSelectedMetrics(prev => 
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-6xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border border-slate-200 dark:border-slate-700">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <PresentationChartLineIcon className="w-6 h-6 text-blue-600"/>
                            Biểu đồ diễn biến Xét nghiệm
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Bệnh nhân: <span className="font-bold text-slate-700 dark:text-slate-200">{patientName}</span> ({patientId})
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 p-1">
                            {['3M', '6M', '1Y'].map(range => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                                        dateRange === range 
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                            <XIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    
                    {/* Sidebar: Metrics Selector */}
                    <div className="w-64 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 overflow-y-auto p-4">
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 flex items-center gap-2">
                            <CheckIcon className="w-4 h-4"/> Chọn chỉ số
                        </h3>
                        
                        <div className="space-y-4">
                            {['Sinh hóa', 'Huyết học'].map(group => (
                                <div key={group}>
                                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 ml-1">{group}</h4>
                                    <div className="space-y-1">
                                        {LAB_METRICS.filter(m => m.group === group).map(metric => {
                                            const isSelected = selectedMetrics.includes(metric.code);
                                            return (
                                                <div 
                                                    key={metric.code}
                                                    onClick={() => toggleMetric(metric.code)}
                                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                                                        isSelected 
                                                        ? 'bg-white dark:bg-slate-800 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' 
                                                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 opacity-60 hover:opacity-100'
                                                    }`}
                                                >
                                                    <div 
                                                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                            isSelected ? '' : 'border-slate-400 bg-transparent'
                                                        }`}
                                                        style={{ 
                                                            backgroundColor: isSelected ? metric.color : undefined,
                                                            borderColor: isSelected ? metric.color : undefined
                                                        }}
                                                    >
                                                        {isSelected && <CheckIcon className="w-3 h-3 text-white"/>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{metric.name}</div>
                                                        <div className="text-xs text-slate-500">{metric.unit}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Chart Area */}
                    <div className="flex-1 p-6 flex flex-col bg-white dark:bg-slate-800 relative">
                        {isLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-800/80 z-10">
                                <div className="flex flex-col items-center">
                                    <RefreshIcon className="w-8 h-8 text-blue-500 animate-spin mb-2"/>
                                    <span className="text-sm text-slate-500">Đang tải dữ liệu...</span>
                                </div>
                            </div>
                        ) : selectedMetrics.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <PresentationChartLineIcon className="w-16 h-16 mb-4 opacity-20"/>
                                <p>Vui lòng chọn ít nhất một chỉ số để xem biểu đồ.</p>
                            </div>
                        ) : (
                            <div className="w-full h-full min-h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                        <XAxis 
                                            dataKey="date" 
                                            tick={{fill: '#94a3b8', fontSize: 12}} 
                                            axisLine={{stroke: '#e2e8f0'}} 
                                            tickLine={false}
                                            padding={{ left: 20, right: 20 }}
                                        />
                                        <YAxis 
                                            tick={{fill: '#94a3b8', fontSize: 12}} 
                                            axisLine={false} 
                                            tickLine={false}
                                            label={{ value: 'Giá trị', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                                        />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                            itemStyle={{ fontSize: '13px', fontWeight: 500, padding: '2px 0' }}
                                            labelStyle={{ color: '#64748b', marginBottom: '8px', fontWeight: 'bold' }}
                                        />
                                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '13px' }}/>
                                        
                                        {selectedMetrics.map(code => {
                                            const metric = LAB_METRICS.find(m => m.code === code);
                                            if (!metric) return null;
                                            return (
                                                <Line 
                                                    key={code}
                                                    type="monotone" 
                                                    dataKey={code} 
                                                    name={metric.name}
                                                    stroke={metric.color} 
                                                    strokeWidth={3}
                                                    dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                    animationDuration={1000}
                                                />
                                            );
                                        })}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        
                        {/* Annotations / Notes */}
                         <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedMetrics.slice(0, 4).map(code => {
                                const metric = LAB_METRICS.find(m => m.code === code);
                                if (!metric) return null;
                                const latestValue = chartData.length > 0 ? chartData[0][code] : 0;
                                return (
                                    <div key={code} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <div>
                                            <span className="text-xs font-bold text-slate-500 block">{metric.name}</span>
                                            <span className="text-xs text-slate-400">CSBT: {metric.min} - {metric.max} {metric.unit}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-lg font-bold text-slate-800 dark:text-white">{latestValue}</span>
                                            <span className="text-xs text-slate-500 ml-1">{metric.unit}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabTrendModal;
