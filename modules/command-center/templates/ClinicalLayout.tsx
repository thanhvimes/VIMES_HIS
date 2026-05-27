
import React from 'react';
import { 
    ActivityIcon, 
    HeartIcon, 
    UserGroupIcon,
    ExclamationCircleIcon,
    ClockIcon
} from '../../../components/Icons';
import { KPICard } from '../components/Widgets';

const ClinicalLayout: React.FC = () => {
    return (
        <div className="grid grid-cols-12 gap-6 h-full overflow-hidden">
            {/* SIDEBAR: CRITICAL ALERTS & CODE BLUE (3/12) */}
            <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2">
                <div className="bg-rose-500 rounded-2xl p-6 text-white shadow-xl shadow-rose-500/20 relative overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                        <h3 className="font-black text-white uppercase tracking-widest text-sm">CODE BLUE STATUS</h3>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                            <div className="flex justify-between text-[10px] font-black uppercase text-rose-100 mb-2">
                                <span>Phòng 402 • ICU</span>
                                <span>10:32 AM</span>
                            </div>
                            <p className="font-black text-white text-sm mb-1 uppercase tracking-tight">Ngừng tuần hoàn</p>
                            <p className="text-[10px] text-rose-100 font-bold">Ekip trực: BS. Nam, ĐD. Lan</p>
                            <div className="mt-3 h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white w-2/3 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 flex-1 shadow-sm">
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase mb-6 flex items-center gap-2">
                        <ClockIcon className="w-4 h-4 text-blue-500"/> Chờ Nhập Viện
                    </h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[11px] font-black dark:text-slate-200">BN. Nguyễn Văn {item}</span>
                                    <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-black">ƯU TIÊN</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Khoa chỉ định: Nội Tổng Quát</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT: ICU MONITORING (9/12) */}
            <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
                
                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-6">
                     <KPICard 
                        title="Bệnh nhân nặng (ICU)" 
                        value="14" 
                        subtext="Công suất: 94%"
                        icon={<ActivityIcon/>} 
                        color="text-rose-500"
                    />
                    <KPICard 
                        title="Đang thở máy" 
                        value="8" 
                        subtext="6 Xâm lấn | 2 Không XL"
                        icon={<HeartIcon/>} 
                        color="text-amber-500"
                    />
                     <KPICard 
                        title="Nhân lực trực" 
                        value="12" 
                        subtext="4 BS | 8 ĐD"
                        icon={<UserGroupIcon/>} 
                        color="text-indigo-500"
                    />
                </div>

                {/* ICU Bed Grid */}
                <div className="bg-white dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-6 shadow-sm flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase flex items-center gap-2">
                            <ActivityIcon className="w-5 h-5 text-rose-500"/> Giám sát Giường Hồi sức (Real-time)
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase">Có BN</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                                <span className="text-[10px] font-black text-slate-400 uppercase">Trống</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-4 xl:grid-cols-8 gap-4 flex-1 overflow-y-auto custom-scrollbar p-1">
                        {Array.from({length: 16}).map((_, i) => (
                            <div key={i} className={`group relative rounded-2xl p-4 border transition-all duration-300 ${
                                i < 14 
                                ? 'bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/50' 
                                : 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/50'
                            }`}>
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-[10px] font-black ${i < 14 ? 'text-rose-600' : 'text-emerald-600'}`}>G{i+1}</span>
                                    {i < 14 && <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>}
                                </div>
                                <div className="flex flex-col items-center justify-center py-4">
                                    {i < 14 ? (
                                        <>
                                            <ActivityIcon className="w-8 h-8 text-rose-400 opacity-20 group-hover:opacity-100 transition-opacity duration-500"/>
                                            <div className="mt-3 text-[10px] font-black text-rose-800 dark:text-rose-300 uppercase tracking-tighter">Monitoring</div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-xl font-black text-emerald-600">FREE</span>
                                            <div className="mt-1 text-[9px] font-bold text-emerald-600/60 uppercase">Sẵn sàng</div>
                                        </>
                                    )}
                                </div>
                                <div className="absolute inset-x-4 bottom-2 h-1 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${i < 14 ? 'bg-rose-500 w-3/4' : 'w-0'}`}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicalLayout;
