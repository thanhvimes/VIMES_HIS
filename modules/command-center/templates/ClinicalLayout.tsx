
import React from 'react';
import { 
    ActivityIcon, 
    HeartIcon, 
    UserGroupIcon 
} from '../../../components/Icons';
import { KPICard } from '../components/Widgets';

const ClinicalLayout: React.FC = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full overflow-hidden">
            {/* SIDEBAR: CRITICAL ALERTS */}
            <div className="col-span-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-xl p-4 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-red-200 dark:border-red-800">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                    <h3 className="font-bold text-red-700 dark:text-red-400 uppercase">CODE BLUE (Cấp cứu)</h3>
                </div>
                <div className="space-y-4 flex-1 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border-l-4 border-red-600 shadow-sm">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span className="font-bold text-red-600">P.301 - Hồi Sức</span>
                            <span>09:15:30</span>
                        </div>
                        <p className="font-bold text-slate-800 dark:text-white">Ngừng tuần hoàn</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Ekip trực: BS. Nam, ĐD. Lan</p>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border-l-4 border-orange-500 shadow-sm">
                         <div className="flex justify-between text-xs text-slate-500 mb-1">
                            <span className="font-bold text-orange-600">P. Cấp Cứu</span>
                            <span>09:10:00</span>
                        </div>
                        <p className="font-bold text-slate-800 dark:text-white">Tai nạn hàng loạt (3 BN)</p>
                         <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Đa chấn thương - Cần hỗ trợ Ngoại</p>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT: ICU & WARDS */}
            <div className="col-span-3 grid grid-rows-2 gap-6">
                
                {/* Top Row: KPIs */}
                <div className="grid grid-cols-3 gap-4">
                     <KPICard 
                        title="Bệnh nhân nặng (ICU)" 
                        value="14" 
                        subtext="Giường trống: 1"
                        icon={<ActivityIcon/>} 
                        color="text-red-600"
                    />
                    <KPICard 
                        title="Đang thở máy" 
                        value="8" 
                        subtext="Xâm lấn: 6 | Không XL: 2"
                        icon={<HeartIcon/>} 
                        color="text-orange-500"
                    />
                     <KPICard 
                        title="Chờ nhập viện" 
                        value="5" 
                        subtext="Từ phòng khám/Cấp cứu"
                        icon={<UserGroupIcon/>} 
                        color="text-blue-500"
                    />
                </div>

                {/* Bottom Row: Ward Status (Grid of beds) */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm overflow-hidden flex flex-col">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase text-sm">Trạng thái Giường Hồi sức (Real-time)</h3>
                    <div className="grid grid-cols-8 gap-3 flex-1 overflow-y-auto p-1">
                        {Array.from({length: 16}).map((_, i) => (
                            <div key={i} className={`rounded-lg p-2 border flex flex-col items-center justify-center text-center aspect-square ${
                                i < 14 
                                ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' 
                                : 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                            }`}>
                                <span className={`text-xs font-bold ${i < 14 ? 'text-red-700 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                                    G{i+1}
                                </span>
                                {i < 14 && <ActivityIcon className="w-4 h-4 text-red-500 mt-1 animate-pulse"/>}
                                {i >= 14 && <span className="text-[10px] text-green-600 dark:text-green-400 font-bold mt-1">Trống</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicalLayout;
