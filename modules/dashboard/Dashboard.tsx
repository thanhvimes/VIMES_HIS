
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
    subtitle: string;
    description: string;
    path: string;
    icon: React.ReactElement;
    color: string; // Tailored hex or name
    iconBg: string; // Light version for bg
    allowedRoles: UserRole[];
}

const MODULE_CARDS: ModuleCardConfig[] = [
    { 
        id: 'reception', 
        title: 'Quy trình', 
        subtitle: 'tiếp đón bệnh nhân', 
        description: 'Đăng ký bệnh nhân tại quầy, phân luồng, lấy số và quản lý hàng đợi tiếp đón.', 
        path: '/reception', 
        icon: <ClipboardListIcon className="w-7 h-7" />, 
        color: 'text-blue-600', 
        iconBg: 'bg-blue-50',
        allowedRoles: ['admin', 'receptionist', 'nurse', 'doctor'] 
    },
    { 
        id: 'clinical', 
        title: 'Quy trình', 
        subtitle: 'khám bệnh (EMR)', 
        description: 'Bàn khám bác sĩ, chẩn đoán điện tử, kê đơn và quản lý hồ sơ bệnh án điện tử.', 
        path: '/consultation', 
        icon: <HospitalIcon className="w-7 h-7" />, 
        color: 'text-emerald-600', 
        iconBg: 'bg-emerald-50',
        allowedRoles: ['admin', 'doctor'] 
    },
    { 
        id: 'lab', 
        title: 'Kết quả', 
        subtitle: 'cận lâm sàng', 
        description: 'Tra cứu nhanh kết quả xét nghiệm, chẩn đoán hình ảnh và trả lời kết quả trực tuyến.', 
        path: '/lab-results', 
        icon: <ChartBarIcon className="w-7 h-7" />, 
        color: 'text-emerald-600', 
        iconBg: 'bg-emerald-50',
        allowedRoles: ['admin', 'doctor', 'technician'] 
    },
    { 
        id: 'billing', 
        title: 'Thanh toán', 
        subtitle: 'viện phí', 
        description: 'Thanh toán bảo mật qua mã QR, thẻ ngân hàng mà không cần xếp hàng chờ đợi.', 
        path: '/billing', 
        icon: <CurrencyDollarIcon className="w-7 h-7" />, 
        color: 'text-orange-600', 
        iconBg: 'bg-orange-50',
        allowedRoles: ['admin', 'accountant', 'receptionist'] 
    },
    { 
        id: 'online-booking', 
        title: 'Đặt lịch', 
        subtitle: 'khám bệnh online', 
        description: 'Chủ động chọn ngày, giờ và bác sĩ chuyên khoa phù hợp với nhu cầu thăm khám của bạn.', 
        path: '/online-booking', 
        icon: <CalendarPlusIcon className="w-7 h-7" />, 
        color: 'text-purple-600', 
        iconBg: 'bg-purple-50',
        allowedRoles: ['admin', 'receptionist', 'doctor', 'nurse', 'technician', 'accountant', 'pharmacist', 'hr', 'director'] 
    },
    { 
        id: 'documents', 
        title: 'Văn bản', 
        subtitle: 'chờ ký duyệt', 
        description: 'Ký số trên các văn bản điện tử, biên bản đồng ý phẫu thuật một cách an toàn và tiện lợi.', 
        path: '/documents', 
        icon: <ShieldCheckIcon className="w-7 h-7" />, 
        color: 'text-teal-600', 
        iconBg: 'bg-teal-50',
        allowedRoles: ['admin', 'doctor', 'nurse', 'director'] 
    },
    { 
        id: 'crm', 
        title: 'Hỗ trợ', 
        subtitle: 'khách hàng', 
        description: 'Giải đáp các thắc mắc thường gặp và liên hệ tổng đài viên hỗ trợ bệnh nhân 24/7.', 
        path: '/crm', 
        icon: <StarIcon className="w-7 h-7" />, 
        color: 'text-rose-600', 
        iconBg: 'bg-rose-50',
        allowedRoles: ['admin', 'hr', 'director'] 
    },
    { 
        id: 'pharmacy', 
        title: 'Kho thuốc', 
        subtitle: 'dược bệnh viện', 
        description: 'Quản lý kho dược, cấp phát thuốc theo đơn và theo dõi hạn sử dụng thuốc.', 
        path: '/pharmacy', 
        icon: <ArchiveIcon className="w-7 h-7" />, 
        color: 'text-blue-600', 
        iconBg: 'bg-blue-50',
        allowedRoles: ['admin', 'pharmacist', 'accountant'] 
    }
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
    return (
        <Link to={item.path} className="group relative bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-slate-100/50 dark:border-slate-700 overflow-hidden flex flex-col min-h-[220px]">
            {/* Background decorative blob */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${item.iconBg.replace('bg-', 'bg-opacity-40 bg-')} rounded-full -mr-12 -mt-12 blur-3xl group-hover:scale-125 transition-transform duration-500`}></div>
            
            <div className="flex items-start gap-5 relative z-10 mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${item.iconBg} ${item.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">{item.title}</h3>
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">{item.subtitle}</p>
                </div>
            </div>
            
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed relative z-10 flex-1">
                {item.description}
            </p>
            
            <div className="mt-6 flex items-center text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors relative z-10">
                <div className="w-full h-px bg-slate-100 dark:bg-slate-700 mr-4"></div>
                <ChevronRightIcon className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">{allowedModules.map(item => (<ModuleCard key={item.id} item={item} />))}</div>
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
