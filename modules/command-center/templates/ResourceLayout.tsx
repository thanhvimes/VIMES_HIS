
import React from 'react';
import { 
    CpuChipIcon, 
    WrenchIcon, 
    ExclamationCircleIcon,
    CheckCircleIcon,
    ServerStackIcon
} from '../../../components/Icons';
import { KPICard } from '../components/Widgets';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock Device Status
const machines = [
    { id: 'M-01', name: 'MRI 1.5T GE', status: 'Running', uptime: '98%', maintenance: '20/12' },
    { id: 'M-02', name: 'CT 128 Slice', status: 'Running', uptime: '95%', maintenance: '15/12' },
    { id: 'M-03', name: 'X-Quang KTS 1', status: 'Running', uptime: '99%', maintenance: '01/01' },
    { id: 'M-04', name: 'X-Quang KTS 2', status: 'Maintenance', uptime: '80%', maintenance: 'Today' },
    { id: 'L-01', name: 'Cobas 6000', status: 'Running', uptime: '97%', maintenance: '30/11' },
    { id: 'L-02', name: 'Sysmex XN-1000', status: 'Error', uptime: '40%', maintenance: 'Urgent' },
];

const ResourceLayout: React.FC = () => {
    const { theme } = useTheme();

    const getStatusColor = (status: string) => {
        if (status === 'Running') return 'bg-green-500';
        if (status === 'Maintenance') return 'bg-yellow-500';
        return 'bg-red-500 animate-pulse';
    };

    return (
        <div className="grid grid-cols-12 gap-4 lg:gap-6 h-full overflow-hidden">
            
            {/* --- COLUMN 1: OVERVIEW & ALERTS (3 cols) --- */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 h-full">
                <KPICard 
                    title="Thiết bị Hoạt động" 
                    value="42/45" 
                    subtext="Hiệu suất toàn viện: 92%"
                    icon={<CpuChipIcon/>} 
                    color="text-blue-500"
                />
                <KPICard 
                    title="Cảnh báo Kỹ thuật" 
                    value="1" 
                    subtext="Máy Sysmex XN-1000 lỗi QC"
                    icon={<ExclamationCircleIcon/>} 
                    color="text-red-500"
                />

                {/* Maintenance Schedule */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex-1 shadow-sm overflow-hidden flex flex-col">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <WrenchIcon className="w-5 h-5 text-orange-500"/> Lịch Bảo trì Sắp tới
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-l-4 border-yellow-500">
                            <div>
                                <div className="font-bold text-slate-800 dark:text-white text-sm">X-Quang KTS 2</div>
                                <div className="text-xs text-slate-500">Đang bảo trì định kỳ</div>
                            </div>
                            <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Today</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-l-4 border-blue-500">
                            <div>
                                <div className="font-bold text-slate-800 dark:text-white text-sm">Cobas 6000</div>
                                <div className="text-xs text-slate-500">Thay thế hóa chất</div>
                            </div>
                            <span className="text-xs font-bold text-slate-500">30/11</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- COLUMN 2: DEVICE GRID MONITOR (9 cols) --- */}
            <div className="col-span-12 lg:col-span-9 flex flex-col gap-6 h-full overflow-hidden">
                
                {/* High Value Assets Monitor */}
                <div className="bg-slate-900 rounded-xl p-6 shadow-xl border border-slate-700 flex-1 overflow-y-auto">
                    <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-3">
                        <ServerStackIcon className="w-6 h-6 text-green-400"/>
                        Trạng thái Hệ thống Máy Y tế (Real-time)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {machines.map(machine => (
                            <div key={machine.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700 relative overflow-hidden group hover:border-slate-500 transition-colors">
                                <div className={`absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-20 transition-all ${getStatusColor(machine.status)}`}></div>
                                
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div>
                                        <h4 className="text-white font-bold text-lg">{machine.name}</h4>
                                        <p className="text-slate-400 text-sm font-mono">{machine.id}</p>
                                    </div>
                                    <div className={`w-4 h-4 rounded-full ${getStatusColor(machine.status)}`}></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm relative z-10">
                                    <div className="bg-slate-900/50 p-2 rounded">
                                        <span className="text-slate-500 block text-xs uppercase">Uptime</span>
                                        <span className={`font-bold ${machine.status === 'Error' ? 'text-red-400' : 'text-green-400'}`}>
                                            {machine.uptime}
                                        </span>
                                    </div>
                                    <div className="bg-slate-900/50 p-2 rounded">
                                        <span className="text-slate-500 block text-xs uppercase">Next PM</span>
                                        <span className="text-slate-300 font-bold">{machine.maintenance}</span>
                                    </div>
                                </div>
                                
                                {machine.status === 'Error' && (
                                    <div className="mt-4 bg-red-900/30 border border-red-900/50 p-2 rounded text-xs text-red-200 animate-pulse">
                                        ⚠ Cảnh báo: Lỗi kết nối LIS. Vui lòng kiểm tra cổng.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Facility Sensors (Mock) */}
                <div className="grid grid-cols-4 gap-4 h-32">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                         <span className="text-xs text-slate-500 uppercase font-bold">Nhiệt độ Kho Dược</span>
                         <span className="text-2xl font-bold text-blue-600">22°C</span>
                         <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Ổn định</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                         <span className="text-xs text-slate-500 uppercase font-bold">Độ ẩm Kho Dược</span>
                         <span className="text-2xl font-bold text-blue-600">45%</span>
                         <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Ổn định</span>
                    </div>
                     <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                         <span className="text-xs text-slate-500 uppercase font-bold">Áp suất Oxy Trung tâm</span>
                         <span className="text-2xl font-bold text-green-600">4.5 Bar</span>
                         <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Bình thường</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
                         <span className="text-xs text-slate-500 uppercase font-bold">Điện năng tiêu thụ</span>
                         <span className="text-2xl font-bold text-orange-600">1250 kWh</span>
                         <span className="text-xs text-orange-500">Cao điểm</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ResourceLayout;
