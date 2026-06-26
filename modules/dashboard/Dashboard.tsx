
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    ChevronRightIcon,
    UserGroupIcon,
    HospitalIcon,
    ChartBarIcon,
    BeakerIcon,
    CurrencyDollarIcon,
    CogIcon,
    ClipboardListIcon,
    ShieldCheckIcon,
    ArchiveIcon,
    VideoCameraIcon,
    TvIcon,
    PlusIcon,
    MegaphoneIcon,
    CalendarDaysIcon,
    StarIcon,
    ClockIcon,
    GlobeIcon,
    TagIcon,
    CalendarPlusIcon, // NEW
    PaperAirplaneIcon
} from '../../components/Icons';
import { useSession } from '../../contexts/SessionContext';
import { UserSession } from '../../types/common';
import { useSystemStore } from '../../stores/useSystemStore';

type UserRole = 'admin' | 'doctor' | 'nurse' | 'technician' | 'receptionist' | 'accountant' | 'pharmacist' | 'hr' | 'director';

interface ModuleCardConfig {
    id: string;
    title: string;
    description: string;
    path: string;
    icon: React.ReactElement;
    color: 'blue' | 'teal' | 'indigo' | 'rose' | 'cyan' | 'purple' | 'emerald' | 'green' | 'orange' | 'sky' | 'slate' | 'red';
    allowedRoles: UserRole[];
}

const MODULE_CARDS: ModuleCardConfig[] = [
    { id: 'command-center', title: 'TT Điều hành (HCC)', description: 'Giám sát, chỉ huy và điều hành bệnh viện theo thời gian thực.', path: '/command-center', icon: <GlobeIcon className="w-10 h-10" />, color: 'red', allowedRoles: ['admin', 'director', 'doctor'] },
    { id: 'online-booking', title: 'Đăng ký Online', description: 'Đặt lịch khám, duyệt lịch hẹn và cấu hình khung giờ tiếp nhận.', path: '/online-booking', icon: <CalendarPlusIcon className="w-10 h-10" />, color: 'sky', allowedRoles: ['admin', 'receptionist', 'doctor', 'nurse', 'technician', 'accountant', 'pharmacist', 'hr', 'director'] },
    { id: 'queue-management', title: 'QMS – Gọi số', description: 'Gọi số tự động, màn hình hiển thị phòng khám và Kiosk self-service.', path: '/queue-management', icon: <TvIcon className="w-10 h-10" />, color: 'blue', allowedRoles: ['admin', 'receptionist', 'nurse', 'doctor', 'technician'] },
    { id: 'health-check-sync', title: 'Liên thông KSK VNeID', description: 'Đồng bộ 17 mẫu biểu khám sức khỏe lên ứng dụng VNeID theo QĐ 1551.', path: '/health-check', icon: <PaperAirplaneIcon className="w-10 h-10" />, color: 'blue', allowedRoles: ['admin', 'doctor', 'accountant'] },

    { id: 'reception', title: 'Tiếp nhận & Điều phối', description: 'Đăng ký tại quầy, phân luồng khám bệnh và quản lý hàng đợi.', path: '/reception', icon: <UserGroupIcon className="w-10 h-10" />, color: 'teal', allowedRoles: ['admin', 'receptionist', 'nurse', 'doctor'] }, { id: 'clinical', title: 'Khám bệnh (EMR)', description: 'Khám, chẩn đoán, kê đơn thuốc và quản lý hồ sơ bệnh án điện tử.', path: '/consultation', icon: <HospitalIcon className="w-10 h-10" />, color: 'blue', allowedRoles: ['admin', 'doctor'] },
    { id: 'inpatient', title: 'Điều trị nội trú', description: 'Quản lý buồng bệnh, theo dõi y lệnh và chăm sóc bệnh nhân.', path: '/inpatient-treatment', icon: <ClipboardListIcon className="w-10 h-10" />, color: 'indigo', allowedRoles: ['admin', 'doctor', 'nurse'] },
    { id: 'surgery', title: 'Phẫu thuật – Thủ thuật', description: 'Lên lịch mổ, quản lý ekip và tường trình phẫu thuật.', path: '/surgery', icon: <VideoCameraIcon className="w-10 h-10" />, color: 'rose', allowedRoles: ['admin', 'doctor', 'nurse'] },
    { id: 'lab', title: 'Xét nghiệm (LIS)', description: 'Quản lý chỉ định, kết nối máy xét nghiệm và trả kết quả tự động.', path: '/lab-results', icon: <BeakerIcon className="w-10 h-10" />, color: 'cyan', allowedRoles: ['admin', 'doctor', 'technician'] },
    { id: 'imaging', title: 'CĐHA & PACS', description: 'X-Quang, Siêu âm, CT, MRI – xem ảnh DICOM trực tiếp.', path: '/imaging-results', icon: <VideoCameraIcon className="w-10 h-10" />, color: 'purple', allowedRoles: ['admin', 'doctor', 'technician'] },
    { id: 'pacs-ris', title: 'Hệ thống PACS-RIS', description: 'Trạm làm việc đọc kết quả chẩn đoán và trình xem ảnh y khoa CornerstoneJS.', path: '/pacs-ris', icon: <TvIcon className="w-10 h-10" />, color: 'indigo', allowedRoles: ['admin', 'doctor', 'technician'] },
    { id: 'pharmacy', title: 'Dược & Kho thuốc', description: 'Nhập – xuất – tồn, cấp phát thuốc và cảnh báo hạn sử dụng.', path: '/pharmacy', icon: <ArchiveIcon className="w-10 h-10" />, color: 'emerald', allowedRoles: ['admin', 'pharmacist', 'accountant'] },
    { id: 'medical-supplies', title: 'Vật tư y tế', description: 'Quản lý vật tư tiêu hao, hóa chất và công cụ dụng cụ.', path: '/medical-supplies', icon: <TagIcon className="w-10 h-10" />, color: 'indigo', allowedRoles: ['admin', 'pharmacist', 'accountant', 'nurse'] },
    { id: 'billing', title: 'Viện phí & Thu ngân', description: 'Thanh toán, tạm ứng, quyết toán và xuất hóa đơn điện tử.', path: '/billing', icon: <CurrencyDollarIcon className="w-10 h-10" />, color: 'green', allowedRoles: ['admin', 'accountant', 'receptionist'] },
    { id: 'insurance', title: 'Bảo hiểm y tế', description: 'Giám định hồ sơ, kiểm tra thẻ BHYT và xuất dữ liệu cổng BHXH.', path: '/insurance', icon: <ShieldCheckIcon className="w-10 h-10" />, color: 'orange', allowedRoles: ['admin', 'accountant', 'doctor'] },
    { id: 'hr', title: 'Nhân sự (HR)', description: 'Hồ sơ nhân viên, chấm công FaceID và tính lương tự động.', path: '/hr', icon: <UserGroupIcon className="w-10 h-10" />, color: 'slate', allowedRoles: ['admin', 'hr'] },
    { id: 'reports', title: 'Báo cáo & Thống kê', description: 'Dashboard BI, phân tích KPI và báo cáo quản trị thông minh.', path: '/management-reporting', icon: <ChartBarIcon className="w-10 h-10" />, color: 'red', allowedRoles: ['admin', 'doctor', 'accountant'] },
    { id: 'admin', title: 'Quản trị hệ thống', description: 'Cấu hình tham số, phân quyền người dùng và nhật ký hoạt động.', path: '/admin', icon: <CogIcon className="w-10 h-10" />, color: 'slate', allowedRoles: ['admin', 'doctor', 'director', 'hr', 'accountant', 'pharmacist', 'receptionist', 'nurse', 'technician'] }

];

const ROLE_LABELS: Record<string, string> = {
    admin: 'Quản trị viên',
    doctor: 'Bác sĩ',
    nurse: 'Điều dưỡng',
    technician: 'Kỹ thuật viên',
    receptionist: 'Lễ tân',
    accountant: 'Kế toán',
    pharmacist: 'Dược sĩ',
    hr: 'Nhân sự',
    director: 'Ban Giám đốc',
};

const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Xin chào buổi sáng';
    if (hour < 18) return 'Xin chào buổi chiều';
    return 'Xin chào buổi tối';
};

const DateTimeWidget = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const dayOfWeek = time.toLocaleDateString('vi-VN', { weekday: 'long' });
    const dateStr = time.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20">
            <ClockIcon className="w-6 h-6 text-white opacity-80" />
            <div className="text-white text-right">
                <div className="text-xl font-black font-mono leading-none">{time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mt-1">{dayOfWeek}, {dateStr}</div>
            </div>
        </div>
    );
};

const DashboardHero = () => {
    const { user } = useSession();
    const { hospitalName, systemName } = useSystemStore();
    const greeting = useMemo(() => getGreeting(), []);
    const roleName = ROLE_LABELS[(user?.role || 'guest') as string] || 'Nhân viên';

    return (
        <div className="relative bg-gradient-to-br from-teal-600 via-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 mb-8 shadow-lg overflow-hidden text-white">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 transform translate-x-20"></div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute top-4 left-4 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
                <div className="flex-1 min-w-0">
                    <p className="text-blue-200/80 font-semibold uppercase tracking-widest text-xs mb-2 flex items-center gap-2">
                        <span className="w-6 h-px bg-blue-300/60"></span> {hospitalName}
                    </p>
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold mb-2 tracking-tight leading-tight">
                        {greeting}, <span className="text-teal-200">{user?.fullName || 'Bạn'}</span>
                    </h1>
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 backdrop-blur-sm rounded-full text-xs font-bold text-white/90 border border-white/10">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                            {roleName}
                        </span>
                        <p className="text-blue-100/70 text-sm font-medium truncate">{systemName}</p>
                    </div>
                </div>
                <div className="hidden md:block shrink-0"><DateTimeWidget /></div>
            </div>
        </div>
    );
};

const ModuleCard: React.FC<{ item: ModuleCardConfig }> = ({ item }) => {
    const iconBgClasses: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        teal: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
        indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
        rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
        cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
        sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
        slate: 'bg-slate-100 text-slate-600 dark:bg-slate-700/40 dark:text-slate-400',
        red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    };
    const hoverBorderClasses: Record<string, string> = {
        blue: 'hover:border-blue-400', teal: 'hover:border-teal-400', indigo: 'hover:border-indigo-400',
        rose: 'hover:border-rose-400', cyan: 'hover:border-cyan-400', purple: 'hover:border-purple-400',
        emerald: 'hover:border-emerald-400', green: 'hover:border-green-400', orange: 'hover:border-orange-400',
        sky: 'hover:border-sky-400', slate: 'hover:border-slate-400', red: 'hover:border-red-400',
    };

    return (
        <Link to={item.path} className={`group block p-5 bg-white dark:bg-slate-800 rounded-2xl border-2 border-transparent transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-0.5 ${hoverBorderClasses[item.color]}`}>
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 ${iconBgClasses[item.color]}`}>
                {item.icon}
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1 group-hover:text-slate-700 dark:group-hover:text-slate-200">{item.title}</h3>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
            <div className="mt-3 flex items-center text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-blue-600 dark:text-blue-400">
                Truy cập <ChevronRightIcon className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
            </div>
        </Link>
    );
};

const Dashboard: React.FC = () => {
    const { user } = useSession();
    const allowedModules = useMemo(() => {
        return MODULE_CARDS.filter(m => {
            const userRole = (user?.role || 'guest') as UserRole;
            if (userRole === 'admin') return true;
            return m.allowedRoles.includes(userRole);
        });
    }, [user]);
    return (
        <div className="min-h-full pb-16 max-w-[1500px] mx-auto px-4 md:px-6">
            <DashboardHero />
            <div className="animate-fade-in-up">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-base font-bold text-slate-700 dark:text-white flex items-center gap-2">
                        <StarIcon className="w-5 h-5 text-amber-500 fill-amber-500" /> Phân hệ nghiệp vụ
                        <span className="ml-1 text-xs font-medium text-slate-400 dark:text-slate-500">({allowedModules.length} module)</span>
                    </h2>
                </div>
                {allowedModules.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">{allowedModules.map(item => (<ModuleCard key={item.id} item={item} />))}</div>
                ) : (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-lg text-slate-400 font-medium">Chưa có phân hệ nào được cấp quyền.</p>
                        <p className="text-sm text-slate-500 mt-2">Vui lòng liên hệ quản trị viên để được phân quyền truy cập.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
