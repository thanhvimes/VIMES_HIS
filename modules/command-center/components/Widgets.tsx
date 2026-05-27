
import React from 'react';
import { 
    ActivityIcon, 
    UserGroupIcon, 
    ShieldCheckIcon,
    ExclamationCircleIcon,
    ClockIcon
} from '../../../components/Icons';

// --- COMPONENT THẺ KPI (KPI CARD) ---
export const KPICard = ({ title, value, subtext, icon, color, trend }: any) => (
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-none relative overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
        <div className={`absolute -right-4 -top-4 p-8 opacity-[0.03] group-hover:opacity-10 transition-all duration-700 group-hover:scale-150 ${color.replace('text-', 'bg-')}`}>
            {React.cloneElement(icon, { className: "w-24 h-24" })}
        </div>
        
        <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-').replace('500', '500/10')}`}>
                    {React.cloneElement(icon, { className: `w-5 h-5 ${color}` })}
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest">{title}</h3>
            </div>
            
            <div className="flex items-baseline gap-3">
                <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">{value}</span>
                {trend && (
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
                    </div>
                )}
            </div>
            
            {subtext && (
                <div className="mt-3 flex items-center gap-1.5">
                    <ClockIcon className="w-3 h-3 text-slate-400"/>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{subtext}</p>
                </div>
            )}
        </div>
    </div>
);

export const ORStatusBoard = ({ data }: { data: any[] }) => {
    // Sắp xếp: Đang mổ -> Đang vệ sinh -> Sẵn sàng
    const sortedData = [...data].sort((a, b) => {
        const priority: any = { 'In Use': 1, 'Cleaning': 2, 'Available': 3 };
        return priority[a.status] - priority[b.status];
    });

    return (
        <div className="space-y-3">
            {sortedData.map((or) => {
                const isInUse = or.status === 'In Use';
                const isCleaning = or.status === 'Cleaning';
                
                return (
                    <div key={or.id} className={`group flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                        isInUse 
                        ? 'bg-rose-50/80 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800 shadow-sm' 
                        : isCleaning
                        ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    }`}>
                        <div className="flex items-center gap-4">
                            <div className={`relative w-10 h-10 rounded-full flex items-center justify-center ${
                                isInUse ? 'bg-rose-100 text-rose-600' : isCleaning ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                                <span className="text-[10px] font-black">{or.name.replace('Phòng ', '')}</span>
                                {isInUse && <div className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-25"></div>}
                            </div>
                            <div>
                                <div className="font-black text-slate-800 dark:text-white text-sm">{or.name}</div>
                                <div className={`text-[10px] font-black uppercase tracking-widest ${
                                    isInUse ? 'text-rose-500' : isCleaning ? 'text-amber-500' : 'text-slate-400'
                                }`}>
                                    {or.status}
                                </div>
                            </div>
                        </div>
                        
                        {isInUse ? (
                            <div className="text-right">
                                <div className="text-slate-900 dark:text-white font-bold text-xs">{or.procedure}</div>
                                <div className="text-[10px] text-indigo-500 font-black">{or.surgeon}</div>
                            </div>
                        ) : (
                            <div className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                {isCleaning ? 'Sắp xong' : 'Sẵn sàng'}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

// --- COMPONENT LOG FEED (REALTIME LOGS) ---
export const RealtimeLogFeed = ({ logs }: { logs: any[] }) => (
    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {logs.map((log) => (
            <div key={log.id} className="flex gap-3 text-[11px] group">
                <div className="text-slate-400 font-mono font-bold whitespace-nowrap mt-0.5">{log.time}</div>
                <div className="flex-1">
                    <div className={`p-2 rounded-lg border-l-2 transition-all ${
                        log.type === 'alert' ? 'bg-rose-50/50 border-rose-500 text-rose-800 dark:bg-rose-900/10 dark:text-rose-200' :
                        log.type === 'operation' ? 'bg-indigo-50/50 border-indigo-500 text-indigo-800 dark:bg-indigo-900/10 dark:text-indigo-200' :
                        'bg-slate-50 border-slate-400 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300'
                    }`}>
                        {log.event}
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// --- COMPONENT RESOURCE GRID (THIẾT BỊ) ---
export const ResourceGrid = ({ resources }: { resources: any[] }) => (
    <div className="grid grid-cols-2 gap-3">
        {resources.map((res, i) => {
            const percent = (res.inUse / res.total) * 100;
            return (
                <div key={i} className="p-3 bg-white dark:bg-slate-900/40 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase leading-tight">{res.name}</span>
                        <span className="text-xs font-mono font-bold dark:text-white">{res.inUse}/{res.total}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className={`h-full rounded-full ${percent > 80 ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                </div>
            );
        })}
    </div>
);

// --- COMPONENT BIỂU ĐỒ GIƯỜNG BỆNH (BED MAP) ---
export const BedHeatmap = ({ data }: { data: any[] }) => (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((dept) => {
            const percent = Math.round((dept.occupied / dept.total) * 100);
            const isCritical = percent >= 90;
            return (
                <div key={dept.id} className={`relative p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isCritical 
                    ? 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/50' 
                    : 'bg-slate-50/50 border-slate-200 dark:bg-slate-900/30 dark:border-slate-800'
                }`}>
                    <div className="flex justify-between items-center mb-3">
                        <span className={`text-[11px] font-black uppercase tracking-tight ${isCritical ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}>{dept.name}</span>
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${isCritical ? 'bg-rose-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                            {percent}%
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-3">
                        <span className="text-2xl font-black text-slate-800 dark:text-white">{dept.occupied}</span>
                        <span className="text-[10px] text-slate-400 font-bold">/ {dept.total} Giường</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-rose-500' : dept.color}`} 
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                    {isCritical && (
                        <div className="absolute top-0 right-0">
                            <div className="w-16 h-16 bg-rose-500/10 rounded-full -mr-8 -mt-8 flex items-center justify-center">
                                <ExclamationCircleIcon className="w-4 h-4 text-rose-500 mt-4 mr-4 animate-pulse"/>
                            </div>
                        </div>
                    )}
                </div>
            );
        })}
    </div>
);
