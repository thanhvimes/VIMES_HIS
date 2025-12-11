
import React from 'react';
import { 
    HeartIcon, 
    UserGroupIcon, 
    ClockIcon,
    CheckCircleIcon
} from '../../../components/Icons';
import { KPICard } from '../components/Widgets';

// Mock Data cho Khối Nội
const wards = [
    { id: 'N01', name: 'Nội Tim Mạch', beds: 45, occupied: 42, dischargeToday: 5, new: 4, status: 'Overload' },
    { id: 'N02', name: 'Nội Hô Hấp', beds: 40, occupied: 35, dischargeToday: 3, new: 6, status: 'High' },
    { id: 'N03', name: 'Nội Tiêu Hóa', beds: 35, occupied: 20, dischargeToday: 8, new: 2, status: 'Normal' },
    { id: 'N04', name: 'Nội Thần Kinh', beds: 30, occupied: 28, dischargeToday: 1, new: 3, status: 'High' },
    { id: 'N05', name: 'Nội Tiết', beds: 25, occupied: 15, dischargeToday: 4, new: 1, status: 'Normal' },
];

const InternalLayout: React.FC = () => {
    return (
        <div className="grid grid-cols-12 gap-4 lg:gap-6 h-full overflow-hidden">
            
            {/* LEFT COLUMN: OVERVIEW KPI (3 cols) */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-4">
                <KPICard 
                    title="Tổng BN Nội trú" 
                    value="140" 
                    subtext="Công suất sử dụng: 80%"
                    trend={2.5}
                    icon={<UserGroupIcon/>} 
                    color="text-blue-600"
                />
                <KPICard 
                    title="Nhập viện hôm nay" 
                    value="16" 
                    subtext="Từ Cấp cứu & Phòng khám"
                    icon={<ClockIcon/>} 
                    color="text-green-600"
                />
                <KPICard 
                    title="Dự kiến Xuất viện" 
                    value="21" 
                    subtext="Cần hoàn tất hồ sơ"
                    icon={<CheckCircleIcon/>} 
                    color="text-orange-500"
                />
            </div>

            {/* RIGHT COLUMN: WARD STATUS (9 cols) */}
            <div className="col-span-12 lg:col-span-9 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2 uppercase">
                        <HeartIcon className="w-6 h-6 text-rose-500"/> Trạng thái các Khoa Nội
                    </h3>
                    <div className="flex gap-2 text-xs font-bold">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-sm"></span> Quá tải (&gt;90%)</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-400 rounded-sm"></span> Cao (&gt;80%)</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> Bình thường</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2">
                    {wards.map(ward => {
                        const occupancy = Math.round((ward.occupied / ward.beds) * 100);
                        let barColor = 'bg-blue-500';
                        if (occupancy >= 90) barColor = 'bg-red-500';
                        else if (occupancy >= 80) barColor = 'bg-orange-400';

                        return (
                            <div key={ward.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-hidden">
                                {occupancy >= 90 && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 rounded-bl-full"></div>}
                                
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-slate-700 dark:text-slate-200">{ward.name}</h4>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${occupancy >= 90 ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>
                                        {occupancy}%
                                    </span>
                                </div>
                                
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-4">
                                    <div className={`h-full rounded-full transition-all duration-1000 ${barColor}`} style={{ width: `${occupancy}%` }}></div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-600">
                                        <div className="text-slate-500">Giường</div>
                                        <div className="font-bold text-lg text-slate-800 dark:text-white">{ward.occupied}/{ward.beds}</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-600">
                                        <div className="text-green-600">Vào</div>
                                        <div className="font-bold text-lg text-green-700">+{ward.new}</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-100 dark:border-slate-600">
                                        <div className="text-orange-500">Ra</div>
                                        <div className="font-bold text-lg text-orange-600">-{ward.dischargeToday}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default InternalLayout;
