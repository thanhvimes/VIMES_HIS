
import React from 'react';
import { 
    CpuChipIcon, 
    WrenchIcon, 
    ExclamationCircleIcon, 
    CheckBadgeIcon,
    TagIcon,
    ClipboardDocumentCheckIcon
} from '../../../components/Icons';
import { mockEquipment } from '../data';

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
    const totalAssets = mockEquipment.length;
    const brokenAssets = mockEquipment.filter(e => e.status === 'broken').length;
    const maintenanceAssets = mockEquipment.filter(e => e.status === 'maintenance').length;
    const activeAssets = mockEquipment.filter(e => e.status === 'active').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tổng quan Trang thiết bị</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Theo dõi tình trạng, bảo trì và hiệu suất sử dụng.</p>
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
                    title="Đang bảo trì / Sửa chữa" 
                    value={maintenanceAssets + brokenAssets} 
                    icon={<WrenchIcon className="w-6 h-6 text-white"/>} 
                    color="bg-orange-500" 
                    subtext="Cần xử lý gấp: 1"
                />
                <DashboardCard 
                    title="Hết hạn bảo hành" 
                    value={2} 
                    icon={<ExclamationCircleIcon className="w-6 h-6 text-white"/>} 
                    color="bg-red-500" 
                    subtext="Trong tháng này"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Status Breakdown */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <TagIcon className="w-5 h-5 text-blue-600"/> Phân bố theo Khoa / Phòng
                    </h3>
                    <div className="space-y-4">
                        {/* Mock Chart Bars */}
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

                {/* Right: Upcoming Maintenance */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <ClipboardDocumentCheckIcon className="w-5 h-5 text-orange-500"/> Lịch bảo trì sắp tới
                    </h3>
                    <div className="space-y-4">
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
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center font-bold text-xs flex-col">
                                <span>22</span>
                                <span>NOV</span>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">Cobas 6000</p>
                                <p className="text-xs text-slate-500 mt-0.5">Sửa chữa: Lỗi kim hút</p>
                            </div>
                        </div>
                        <button className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition font-medium">
                            Xem tất cả lịch
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EquipmentDashboardView;
