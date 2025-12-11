
import React from 'react';

// --- COMPONENT THẺ KPI (KPI CARD) ---
// Dùng để hiển thị các chỉ số quan trọng (Số lượng bệnh nhân, Doanh thu...)
export const KPICard = ({ title, value, subtext, icon, color, trend }: any) => (
    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg dark:shadow-none relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]">
        {/* Icon mờ làm nền */}
        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color.replace('text-', 'bg-')}`}>
            {React.cloneElement(icon, { className: "w-16 h-16" })}
        </div>
        <div className="relative z-10">
            <h3 className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">{title}</h3>
            <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-slate-800 dark:text-white">{value}</span>
                {trend && (
                    <span className={`text-xs font-bold mb-1 ${trend > 0 ? 'text-emerald-600 dark:text-green-400' : 'text-rose-600 dark:text-red-400'}`}>
                        {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            {subtext && <p className="text-xs text-slate-500 dark:text-slate-500 mt-1 font-medium">{subtext}</p>}
        </div>
    </div>
);

// --- COMPONENT TRẠNG THÁI PHÒNG MỔ (OR STATUS) ---
// Hiển thị danh sách phòng mổ dạng list
export const ORStatusBoard = ({ data }: { data: any[] }) => {
    return (
        <div className="space-y-2">
            {data.map((or) => (
                <div key={or.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${
                            or.status === 'In Use' ? 'bg-red-500 animate-pulse' : 
                            or.status === 'Cleaning' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">{or.name}</span>
                    </div>
                    {or.status === 'In Use' ? (
                        <div className="text-right">
                            <div className="text-slate-900 dark:text-white font-medium">{or.procedure}</div>
                            <div className="text-slate-500">{or.time}</div>
                        </div>
                    ) : (
                        <span className={`font-bold ${or.status === 'Available' ? 'text-green-600 dark:text-green-500' : 'text-yellow-600 dark:text-yellow-500'}`}>
                            {or.status === 'Available' ? 'Sẵn sàng' : 'Đang vệ sinh'}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
};

// --- COMPONENT BIỂU ĐỒ GIƯỜNG BỆNH (BED MAP) ---
// Hiển thị thanh tiến trình sử dụng giường
export const BedHeatmap = ({ data }: { data: any[] }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {data.map((dept) => {
                const percent = Math.round((dept.occupied / dept.total) * 100);
                const isCritical = percent >= 90;
                return (
                    <div key={dept.id} className={`p-3 rounded-lg border transition-all ${
                        isCritical 
                        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
                        : 'bg-slate-50 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'
                    }`}>
                        <div className="flex justify-between items-center mb-2">
                            <span className={`text-xs font-bold ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>{dept.name}</span>
                            <span className={`text-xs font-mono font-bold ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>{dept.occupied}/{dept.total}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-1000 ${dept.color}`} 
                                style={{ width: `${percent}%` }}
                            ></div>
                        </div>
                        {isCritical && <div className="mt-1.5 text-[10px] text-red-600 dark:text-red-500 font-bold animate-pulse uppercase">Cảnh báo quá tải</div>}
                    </div>
                );
            })}
        </div>
    );
};
