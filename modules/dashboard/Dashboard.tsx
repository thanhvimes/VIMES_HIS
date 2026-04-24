
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
    CalendarPlusIcon // NEW
} from '../../components/Icons';
import { useSession } from '../../contexts/SessionContext';
import { UserSession } from '../../types/common';

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
    // TEMPORARY: Only showing Online Booking module for initial deployment
    // Uncomment other modules when ready to deploy them

    { id: 'command-center', title: 'TT Điều hành (HCC)', description: 'Hệ thống giám sát, chỉ huy và điều hành bệnh viện thời gian thực (Real-time).', path: '/command-center', icon: <GlobeIcon className="w-10 h-10" />, color: 'red', allowedRoles: ['admin', 'director', 'doctor'] },
    { id: 'online-booking', title: 'Đăng ký Online', description: 'Cầu nối giữa bệnh nhân và phòng khám. Quản lý đặt lịch, duyệt lịch và cấu hình khung giờ.', path: '/online-booking', icon: <CalendarPlusIcon className="w-10 h-10" />, color: 'sky', allowedRoles: ['admin', 'receptionist', 'doctor', 'nurse', 'technician', 'accountant', 'pharmacist', 'hr', 'director'] }, // TEMP: Open to all roles for testing
    { id: 'reception', title: 'Tiếp Nhận & Điều Phối', description: 'Đăng ký bệnh nhân tại quầy, phân luồng, lấy số và quản lý hàng đợi.', path: '/reception', icon: <UserGroupIcon className="w-10 h-10" />, color: 'teal', allowedRoles: ['admin', 'receptionist', 'nurse', 'doctor'] },
    { id: 'queue-management', title: 'QMS - Gọi số', description: 'Hệ thống gọi số trung tâm, màn hình hiển thị tại phòng khám và Kiosk tự phục vụ.', path: '/queue-management', icon: <TvIcon className="w-10 h-10" />, color: 'blue', allowedRoles: ['admin', 'receptionist', 'nurse', 'doctor', 'technician'] },
    { id: 'clinical', title: 'Khám Bệnh (EMR)', description: 'Bàn khám bác sĩ, chẩn đoán, kê đơn và hồ sơ bệnh án điện tử.', path: '/consultation', icon: <HospitalIcon className="w-10 h-10" />, color: 'blue', allowedRoles: ['admin', 'doctor'] },
    { id: 'inpatient', title: 'Điều Trị Nội Trú', description: 'Quản lý buồng bệnh, y lệnh hàng ngày và chăm sóc người bệnh.', path: '/inpatient-treatment', icon: <ClipboardListIcon className="w-10 h-10" />, color: 'indigo', allowedRoles: ['admin', 'doctor', 'nurse'] },
    { id: 'surgery', title: 'Phẫu Thuật - Thủ Thuật', description: 'Lịch mổ, quản lý ekip, tường trình phẫu thuật và vật tư tiêu hao.', path: '/surgery', icon: <VideoCameraIcon className="w-10 h-10" />, color: 'rose', allowedRoles: ['admin', 'doctor', 'nurse'] },
    { id: 'lab', title: 'Xét Nghiệm (LIS)', description: 'Quản lý chỉ định, kết nối máy xét nghiệm và trả kết quả tự động.', path: '/lab-results', icon: <BeakerIcon className="w-10 h-10" />, color: 'cyan', allowedRoles: ['admin', 'doctor', 'technician'] },
    { id: 'imaging', title: 'CĐHA & PACS', description: 'X-Quang, Siêu âm, CT, MRI. Xem hình ảnh DICOM chuyên sâu.', path: '/imaging-results', icon: <VideoCameraIcon className="w-10 h-10" />, color: 'purple', allowedRoles: ['admin', 'doctor', 'technician'] },
    { id: 'pharmacy', title: 'Dược & Kho Y Tế', description: 'Quản lý nhập xuất tồn, cấp phát thuốc, cảnh báo hạn dùng.', path: '/pharmacy', icon: <ArchiveIcon className="w-10 h-10" />, color: 'emerald', allowedRoles: ['admin', 'pharmacist', 'accountant'] },
    { id: 'medical-supplies', title: 'Vật tư Y tế', description: 'Quản lý vật tư tiêu hao, hóa chất xét nghiệm và công cụ dụng cụ.', path: '/medical-supplies', icon: <TagIcon className="w-10 h-10" />, color: 'indigo', allowedRoles: ['admin', 'pharmacist', 'accountant', 'nurse'] },
    { id: 'billing', title: 'Viện Phí & Thu Ngân', description: 'Thanh toán chi phí, tạm ứng, quyết toán và hóa đơn điện tử.', path: '/billing', icon: <CurrencyDollarIcon className="w-10 h-10" />, color: 'green', allowedRoles: ['admin', 'accountant', 'receptionist'] },
    { id: 'insurance', title: 'Bảo Hiểm Y Tế', description: 'Giám định hồ sơ, kiểm tra thẻ Online, xuất dữ liệu cổng BHXH.', path: '/insurance', icon: <ShieldCheckIcon className="w-10 h-10" />, color: 'orange', allowedRoles: ['admin', 'accountant', 'doctor'] },
    { id: 'hr', title: 'Quản lý Nhân sự (HR)', description: 'Hồ sơ nhân viên, chấm công FaceID, tính lương và đào tạo.', path: '/hr', icon: <UserGroupIcon className="w-10 h-10" />, color: 'slate', allowedRoles: ['admin', 'hr'] },
    { id: 'reports', title: 'Báo Cáo Thống Kê', description: 'Hệ thống báo cáo thông minh (BI), biểu đồ phân tích KPI.', path: '/management-reporting', icon: <ChartBarIcon className="w-10 h-10" />, color: 'red', allowedRoles: ['admin', 'doctor', 'accountant'] },
    { id: 'admin', title: 'Hệ Thống', description: 'Cấu hình tham số, phân quyền người dùng và nhật ký hệ thống.', path: '/admin', icon: <CogIcon className="w-10 h-10" />, color: 'slate', allowedRoles: ['admin'] }
];

const DateTimeWidget = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-xl border border-white/20">
            <ClockIcon className="w-6 h-6 text-white opacity-80" />
            <div className="text-white">
                <div className="text-xl font-black font-mono leading-none">{time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-60 mt-0.5">{time.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}</div>
            </div>
        </div>
    );
};

const DashboardHero = () => {
    const { user } = useSession();
    return (
        <div className="relative bg-gradient-to-br from-teal-600 via-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 mb-8 shadow-lg overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 transform translate-x-20"></div>
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <p className="text-blue-200/80 font-semibold uppercase tracking-widest text-xs mb-2 flex items-center gap-2"><span className="w-6 h-px bg-blue-300/60"></span> Bệnh viện đa khoa quốc tế VIMES</p>
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight leading-tight">Chào ngày mới, <span className="text-teal-200">{user?.fullName || 'Bác sĩ'}</span></h1>
                    <p className="text-blue-100/80 text-sm max-w-md font-medium">Hệ thống đã sẵn sàng. Chúc bạn một ngày làm việc hiệu quả và tràn đầy năng lượng.</p>
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
        <Link to={item.path} className={`group bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700 hover:shadow-lg ${hoverBorderClasses[item.color]} transition-all duration-200 flex flex-col h-full`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 ${iconBgClasses[item.color]}`}>
                {React.cloneElement(item.icon, { className: 'w-6 h-6' })}
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">{item.title}</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mb-4 line-clamp-2">{item.description}</p>
            <div className="mt-auto flex items-center text-blue-500 dark:text-blue-400 font-semibold text-xs">
                <span>Truy cập</span>
                <ChevronRightIcon className="w-4 h-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
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
                <h2 className="text-base font-bold text-slate-700 dark:text-white mb-5 flex items-center gap-2">
                    <StarIcon className="w-5 h-5 text-amber-500 fill-amber-500" /> Ứng dụng của bạn
                </h2>
                {allowedModules.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">{allowedModules.map(item => (<ModuleCard key={item.id} item={item} />))}</div>
                ) : (
                    <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                        <p className="text-lg text-slate-400 font-medium">Không có phân hệ nào được cấp quyền.</p>
                        <p className="text-sm text-slate-500 mt-2">Vui lòng liên hệ quản trị viên để được cấp quyền truy cập.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
