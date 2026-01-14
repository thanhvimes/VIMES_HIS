
import React, { useMemo } from 'react';
import { 
    CpuChipIcon, 
    WrenchIcon, 
    ExclamationCircleIcon, 
    CheckBadgeIcon,
    TagIcon,
    ClipboardDocumentCheckIcon,
    ClockIcon,
    ChevronRightIcon
} from '../../../components/Icons';
import { mockEquipment } from '../data';
import { formatDate } from '../../../utils/formatters';

const DashboardCard: React.FC<{title: string; value: number; icon: React.ReactNode; color: string; subtext?: string}> = ({title, value, icon, color, subtext}) => (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 flex items-start justify-between">
        <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">{title}</h3>
            <p className="text-3xl font-bold text-onSurface dark:text-dark-onSurface mt-2">{value}</p>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-full ${color} shadow-sm`}>
            {icon}
        </div>
    </div>
);

const EquipmentDashboardView: React.FC = () => {
    const today = new Date();

    // Logic tự động theo dõi thiết bị quá hạn
    const { totalAssets, activeAssets, maintenanceAssets, brokenAssets, overdueAssets } = useMemo(() => {
        const overdue = mockEquipment.filter(e => {
            if (!e.nextMaintenanceDate) return false;
            const maintenanceDate = new Date(e.nextMaintenanceDate);
            return maintenanceDate < today && e.status !== 'maintenance';
        });

        return {
            totalAssets: mockEquipment.length,
            activeAssets: mockEquipment.filter(e => e.status === 'active').length,
            maintenanceAssets: mockEquipment.filter(e => e.status === 'maintenance').length,
            brokenAssets: mockEquipment.filter(e => e.status === 'broken').length,
            overdueAssets: overdue
        };
    }, [today]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tổng quan Trang thiết bị</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Hệ thống theo dõi tình trạng và bảo trì tự động.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow transition">
                        + Thêm mới
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard 
                    title="Tổng tài sản" 
                    value={totalAssets} 
                    icon={<CpuChipIcon className="w-6 h-6 text-white"/>} 
                    color="bg-blue-500" 
                    subtext="Giá trị ước tính: 15.2 tỷ"
                />
                <DashboardCard 
                    title="Đang hoạt động" 
                    value={activeAssets} 
                    icon={<CheckBadgeIcon className="w-6 h-6 text-white"/>} 
                    color="bg-green-500" 
                    subtext={`${((activeAssets/totalAssets)*100).toFixed(0)}% công suất`}
                />
                <DashboardCard 
                    title="Bảo trì / Sửa chữa" 
                    value={maintenanceAssets + brokenAssets} 
                    icon={<WrenchIcon className="w-6 h-6 text-white"/>} 
                    color="bg-orange-500" 
                    subtext={`Hỏng hóc: ${brokenAssets}`}
                />
                <DashboardCard 
                    title="Bảo trì quá hạn" 
                    value={overdueAssets.length} 
                    icon={<ExclamationCircleIcon className="w-6 h-6 text-white"/>} 
                    color="bg-red-500" 
                    subtext="Cần lập phiếu bảo trì ngay"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Dành riêng cho thiết bị quá hạn bảo trì */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {overdueAssets.length > 0 && (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2 uppercase tracking-wide text-sm">
                                    <ExclamationCircleIcon className="w-5 h-5"/> Danh sách quá hạn bảo trì
                                </h3>
                                <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded-full animate-pulse">
                                    {overdueAssets.length} Cảnh báo
                                </span>
                            </div>
                            <div className="space-y-3">
                                {overdueAssets.map(item => (
                                    <div key={item.id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-lg border border-red-100 dark:border-red-900/30 hover:shadow-md transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                                <CpuChipIcon className="w-6 h-6"/>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">{item.name}</p>
                                                <p className="text-xs text-slate-500 flex items-center gap-2">
                                                    ID: {item.id} • Khoa: {item.department}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Hạn bảo trì</p>
                                                <p className="text-sm font-bold text-red-600">{formatDate(item.nextMaintenanceDate)}</p>
                                            </div>
                                            <button className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm transition group-hover:translate-x-1">
                                                <WrenchIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                            <TagIcon className="w-5 h-5 text-blue-600"/> Phân bổ theo Khoa / Phòng
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600 dark:text-slate-300">Chẩn đoán hình ảnh</span>
                                    <span className="font-bold text-slate-800 dark:text-white">12 thiết bị</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{width: '45%'}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600 dark:text-slate-300">Hồi sức tích cực (ICU)</span>
                                    <span className="font-bold text-slate-800 dark:text-white">8 thiết bị</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{width: '30%'}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-600 dark:text-slate-300">Khoa Xét nghiệm</span>
                                    <span className="font-bold text-slate-800 dark:text-white">5 thiết bị</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                                    <div className="bg-teal-500 h-2.5 rounded-full" style={{width: '20%'}}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Upcoming Maintenance */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-wide text-sm">
                        <ClipboardDocumentCheckIcon className="w-5 h-5 text-orange-500"/> Kế hoạch bảo trì tới
                    </h3>
                    <div className="space-y-4 flex-1">
                        <div className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center font-bold text-xs flex-col">
                                <span>20</span>
                                <span>NOV</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">Máy Siêu âm Voluson E8</p>
                                <p className="text-xs text-slate-500 mt-0.5">Bảo dưỡng định kỳ (PM)</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-xs flex-col">
                                <span>15</span>
                                <span>DEC</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">Máy giúp thở Carescape</p>
                                <p className="text-xs text-slate-500 mt-0.5">Kiểm định hằng năm</p>
                            </div>
                        </div>
                    </div>
                    <button className="w-full mt-6 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition font-bold flex items-center justify-center gap-1">
                        Xem tất cả lịch <ChevronRightIcon className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EquipmentDashboardView;
