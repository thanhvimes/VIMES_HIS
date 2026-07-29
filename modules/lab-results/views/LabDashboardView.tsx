import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MicroscopeIcon, 
    ClipboardListIcon, 
    CheckBadgeIcon, 
    ExclamationCircleIcon,
    ServerStackIcon,
    ChartBarIcon,
    CogIcon,
    CalendarDaysIcon,
    BeakerIcon,
    SearchIcon
} from '../../../components/Icons';
import { WarningTriangleIcon } from '../icons';
import { LAB_COLORS } from '../constants';

// --- COMPONENTS ---
const AppIcon: React.FC<{
    title: string; 
    subText?: string;
    icon: React.ReactNode; 
    color: string; 
    badge?: number;
    onClick: () => void;
}> = ({title, subText, icon, color, badge, onClick}) => (
    <div 
        onClick={onClick}
        className="flex flex-col items-center justify-center p-4 cursor-pointer hover:-translate-y-1 transition-transform group"
    >
        <div 
            className="w-20 h-20 rounded-2xl shadow-sm flex items-center justify-center mb-2 relative border border-slate-200/50 dark:border-slate-700 group-hover:shadow-md transition-shadow"
            style={{ backgroundColor: color }}
        >
            {icon}
            {badge !== undefined && badge > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow border-2 border-white dark:border-slate-900 animate-pulse">
                    {badge > 99 ? '99+' : badge}
                </div>
            )}
        </div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {title}
        </h3>
        {subText && <p className="text-[10px] text-slate-500 mt-1">{subText}</p>}
    </div>
);

const SectionHeader: React.FC<{title: string}> = ({title}) => (
    <div className="flex items-center gap-4 mb-4 mt-8 first:mt-0">
        <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200">{title}</h2>
        <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
    </div>
);

const LabDashboardView: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-white dark:bg-slate-900 min-h-full rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-8 font-sans">
            
            {/* Header / Brand */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: LAB_COLORS.primary }}>VIMES LIS Control Center</h1>
                    <p className="text-sm text-slate-500">Phân hệ Quản lý Xét nghiệm Trung tâm</p>
                </div>
                <div className="flex gap-4">
                     <div className="text-right">
                         <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Trực chính: KTV. Nguyễn Văn A</div>
                         <div className="text-xs text-green-600 flex items-center justify-end gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Đang trực</div>
                     </div>
                </div>
            </div>

            {/* Modules Grid */}
            <SectionHeader title="Modules Quy trình (Workflow)" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                <AppIcon 
                    title="Lịch hẹn mẫu" 
                    subText="12 ca hôm nay"
                    icon={<CalendarDaysIcon className="w-10 h-10 text-white"/>} 
                    color={LAB_COLORS.secondary} 
                    onClick={() => navigate('/lab-results/schedule')}
                />
                <AppIcon 
                    title="Tiếp nhận" 
                    subText="Barcode/QR"
                    icon={<ClipboardListIcon className="w-10 h-10 text-white"/>} 
                    color={LAB_COLORS.secondary} 
                    onClick={() => navigate('/lab-results/reception')}
                />
                <AppIcon 
                    title="Phân tích & Xử lý" 
                    subText="Trả kết quả"
                    icon={<MicroscopeIcon className="w-10 h-10 text-white"/>} 
                    color={LAB_COLORS.primary} 
                    badge={4} // Example critical pending
                    onClick={() => navigate('/lab-results/processing')}
                />
                <AppIcon 
                    title="Tìm kiếm nâng cao" 
                    icon={<SearchIcon className="w-10 h-10 text-white"/>} 
                    color={LAB_COLORS.secondary} 
                    onClick={() => {}}
                />
            </div>

            <SectionHeader title="Kiểm chuẩn & Kết nối (Add-Ons)" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                <AppIcon 
                    title="Chạy QC" 
                    subText="Lưu đồ Levey-Jennings"
                    icon={<CheckBadgeIcon className="w-10 h-10 text-white"/>} 
                    color="#10b981" // emerald-500
                    onClick={() => navigate('/lab-results/qc')}
                />
                <AppIcon 
                    title="VIMESLIS Gateway" 
                    subText="Máy XN (TCP/COM)"
                    icon={<ServerStackIcon className="w-10 h-10 text-white"/>} 
                    color="#8b5cf6" // violet-500
                    badge={1} // Example machine down
                    onClick={() => navigate('/lab-results/connections')}
                />
                <AppIcon 
                    title="Hóa chất (Reagents)" 
                    subText="Tồn kho"
                    icon={<BeakerIcon className="w-10 h-10 text-white"/>} 
                    color="#f59e0b" // amber-500
                    onClick={() => {}}
                />
            </div>

            <SectionHeader title="Quản trị & Cấu hình (Admin)" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                <AppIcon 
                    title="Báo cáo & Thống kê" 
                    icon={<ChartBarIcon className="w-10 h-10 text-white"/>} 
                    color="#64748b" // slate-500
                    onClick={() => navigate('/lab-results/reports')}
                />
                <AppIcon 
                    title="Danh mục LIS" 
                    subText="Chỉ số, Giá trị BT"
                    icon={<CogIcon className="w-10 h-10 text-white"/>} 
                    color="#64748b" 
                    onClick={() => navigate('/lab-results/dictionary')}
                />
            </div>

            {/* Live Alerts Area */}
            <div className="mt-12 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 rounded-xl p-4 flex items-start gap-4 shadow-sm">
                <div className="mt-1"><WarningTriangleIcon className="w-8 h-8 text-red-500"/></div>
                <div>
                    <h3 className="font-bold text-red-700 dark:text-red-400">Cảnh báo Hệ thống</h3>
                    <ul className="text-sm text-red-600 dark:text-red-300 mt-2 space-y-1">
                        <li>• Máy <strong>UriSys 2400 (Nước tiểu)</strong> mất kết nối lúc 10:45 AM. Vui lòng kiểm tra COM Port.</li>
                        <li>• Có <strong>4 mẫu Huyết học</strong> CẤP CỨU đã quá 30 phút chưa có kết quả.</li>
                        <li>• Lô hóa chất <strong>Glucose (Cobas)</strong> sắp hết hạn trong 3 ngày.</li>
                    </ul>
                </div>
            </div>

        </div>
    );
};

export default LabDashboardView;
