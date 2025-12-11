
import React from 'react';
import { 
    BeakerIcon, 
    UserGroupIcon, 
    CheckBadgeIcon, 
    ExclamationCircleIcon,
    ClockIcon
} from '../../../components/Icons';
import { KPICard } from '../components/Widgets';

// Mock Data for Oncology
const machines = [
    { id: 'LINAC1', name: 'Máy gia tốc LINAC 1', status: 'Running', queue: 5, timePerPatient: '10p' },
    { id: 'LINAC2', name: 'Máy gia tốc LINAC 2', status: 'Running', queue: 3, timePerPatient: '12p' },
    { id: 'CT-SIM', name: 'CT Mô phỏng', status: 'Maintenance', queue: 0, timePerPatient: '-' },
];

const chemoChairs = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    status: i < 15 ? 'Occupied' : 'Empty', // 15 ghế đang dùng
    patient: i < 15 ? `BN-${1000+i}` : null,
    endTime: i < 15 ? '11:00' : null
}));

const OncologyLayout: React.FC = () => {
    return (
        <div className="grid grid-cols-12 gap-4 lg:gap-6 h-full overflow-hidden">
            
            {/* LEFT COLUMN: RADIOTHERAPY (XẠ TRỊ) */}
            <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
                <KPICard 
                    title="Lượt Xạ trị trong ngày" 
                    value="85" 
                    subtext="Kế hoạch: 120 ca"
                    icon={<div className="font-bold text-xl">☢</div>} 
                    color="text-yellow-600"
                />
                
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex-1 shadow-sm overflow-hidden flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 uppercase flex items-center gap-2">
                         Trạng thái Máy Xạ (LINAC)
                    </h3>
                    <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                        {machines.map(m => (
                            <div key={m.id} className={`p-4 rounded-lg border-l-4 shadow-sm ${
                                m.status === 'Running' ? 'bg-green-50 border-green-500 dark:bg-green-900/10' : 'bg-red-50 border-red-500 dark:bg-red-900/10'
                            }`}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{m.name}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                                        m.status === 'Running' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                                    }`}>
                                        {m.status}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                                    <span>Hàng đợi: <strong>{m.queue}</strong> BN</span>
                                    <span>TB: {m.timePerPatient}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MIDDLE COLUMN: CHEMOTHERAPY (HÓA CHẤT) */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 dark:text-white uppercase flex items-center gap-2">
                            <BeakerIcon className="w-5 h-5 text-purple-500"/> Đơn vị Hóa chất (Day-care)
                        </h3>
                        <div className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {chemoChairs.filter(c => c.status === 'Occupied').length}/20 Ghế
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 flex-1 overflow-y-auto content-start">
                        {chemoChairs.map(chair => (
                            <div key={chair.id} className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 border text-center transition-all ${
                                chair.status === 'Occupied' 
                                ? 'bg-purple-100 border-purple-300 text-purple-800 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-200' 
                                : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/50 dark:border-slate-700'
                            }`}>
                                <span className="font-bold text-sm">G{chair.id}</span>
                                {chair.status === 'Occupied' ? (
                                    <>
                                        <div className="w-2 h-2 bg-green-500 rounded-full my-1 animate-pulse"></div>
                                        <span className="text-[10px] font-mono leading-none">{chair.endTime}</span>
                                    </>
                                ) : (
                                    <span className="text-[10px] mt-1">Trống</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 flex gap-4 justify-center">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-200 rounded"></div> Đang truyền</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-200 rounded"></div> Trống</span>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: QUEUE & ALERTS */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
                 <KPICard 
                    title="Chờ khám Ung bướu" 
                    value="42" 
                    subtext="Tại phòng khám"
                    icon={<UserGroupIcon/>} 
                    color="text-blue-500"
                />
                 <KPICard 
                    title="Hội chẩn Tumor Board" 
                    value="3" 
                    subtext="Ca khó hôm nay"
                    icon={<CheckBadgeIcon/>} 
                    color="text-indigo-500"
                />
                
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex-1 shadow-sm overflow-hidden flex flex-col">
                    <h3 className="font-bold text-slate-700 dark:text-white mb-3 uppercase text-sm flex items-center gap-2">
                        <ExclamationCircleIcon className="w-4 h-4 text-orange-500"/> Lưu ý Dược lâm sàng
                    </h3>
                    <div className="space-y-3 flex-1 overflow-y-auto pr-1 text-xs">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900 rounded">
                            <span className="font-bold block text-orange-700 dark:text-orange-400">Thiếu thuốc: Cisplatin 50mg</span>
                            <span className="text-slate-500">Kho nội trú báo hết. Đang điều chuyển.</span>
                        </div>
                         <div className="p-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded">
                            <span className="font-bold block text-blue-700 dark:text-blue-400">Pha chế hóa chất</span>
                            <span className="text-slate-500">Đã hoàn thành 15/20 liều sáng nay.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OncologyLayout;
