
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
    ClockIcon
} from '../../components/Icons';
import { useSession } from '../../contexts/SessionContext';
import { UserSession } from '../../types/common';

// --- TYPES & PERMISSIONS ---

type UserRole = 'admin' | 'doctor' | 'nurse' | 'technician' | 'receptionist' | 'accountant' | 'pharmacist' | 'hr';

interface ModuleCardConfig {
    id: string;
    title: string;
    description: string;
    path: string;
    icon: React.ReactElement;
    color: 'blue' | 'teal' | 'indigo' | 'rose' | 'cyan' | 'purple' | 'emerald' | 'green' | 'orange' | 'sky' | 'slate' | 'red';
    allowedRoles: UserRole[];
}

// --- DATA CONFIGURATION ---
// Removed 'group' property as requested
const MODULE_CARDS: ModuleCardConfig[] = [
    {
        id: 'reception',
        title: 'Tiếp Nhận & Điều Phối',
        description: 'Đăng ký bệnh nhân, phân luồng, lấy số và quản lý hàng đợi.',
        path: '/reception',
        icon: <UserGroupIcon className="w-10 h-10"/>,
        color: 'teal',
        allowedRoles: ['admin', 'receptionist', 'nurse', 'doctor']
    },
    {
        id: 'clinical',
        title: 'Khám Bệnh (EMR)',
        description: 'Bàn khám bác sĩ, chẩn đoán, kê đơn và hồ sơ bệnh án điện tử.',
        path: '/consultation',
        icon: <HospitalIcon className="w-10 h-10"/>,
        color: 'blue',
        allowedRoles: ['admin', 'doctor']
    },
    {
        id: 'inpatient',
        title: 'Điều Trị Nội Trú',
        description: 'Quản lý buồng bệnh, y lệnh hàng ngày và chăm sóc người bệnh.',
        path: '/inpatient-treatment',
        icon: <ClipboardListIcon className="w-10 h-10"/>,
        color: 'indigo',
        allowedRoles: ['admin', 'doctor', 'nurse']
    },
    {
        id: 'surgery',
        title: 'Phẫu Thuật - Thủ Thuật',
        description: 'Lịch mổ, quản lý ekip, tường trình phẫu thuật và vật tư tiêu hao.',
        path: '/surgery',
        icon: <VideoCameraIcon className="w-10 h-10"/>,
        color: 'rose',
        allowedRoles: ['admin', 'doctor', 'nurse']
    },
    {
        id: 'lab',
        title: 'Xét Nghiệm (LIS)',
        description: 'Quản lý chỉ định, kết nối máy xét nghiệm và trả kết quả tự động.',
        path: '/lab-results',
        icon: <BeakerIcon className="w-10 h-10"/>,
        color: 'cyan',
        allowedRoles: ['admin', 'doctor', 'technician']
    },
    {
        id: 'imaging',
        title: 'CĐHA & PACS',
        description: 'X-Quang, Siêu âm, CT, MRI. Xem hình ảnh DICOM chuyên sâu.',
        path: '/imaging-results',
        icon: <VideoCameraIcon className="w-10 h-10"/>,
        color: 'purple',
        allowedRoles: ['admin', 'doctor', 'technician']
    },
    {
        id: 'pharmacy',
        title: 'Dược & Kho Y Tế',
        description: 'Quản lý nhập xuất tồn, cấp phát thuốc, cảnh báo hạn dùng.',
        path: '/pharmacy',
        icon: <ArchiveIcon className="w-10 h-10"/>,
        color: 'emerald',
        allowedRoles: ['admin', 'pharmacist', 'accountant']
    },
    {
        id: 'billing',
        title: 'Viện Phí & Thu Ngân',
        description: 'Thanh toán chi phí, tạm ứng, quyết toán và hóa đơn điện tử.',
        path: '/billing',
        icon: <CurrencyDollarIcon className="w-10 h-10"/>,
        color: 'green',
        allowedRoles: ['admin', 'accountant', 'receptionist']
    },
    {
        id: 'insurance',
        title: 'Bảo Hiểm Y Tế',
        description: 'Giám định hồ sơ, kiểm tra thẻ Online, xuất dữ liệu cổng BHXH.',
        path: '/insurance',
        icon: <ShieldCheckIcon className="w-10 h-10"/>,
        color: 'orange',
        allowedRoles: ['admin', 'accountant', 'doctor']
    },
    {
        id: 'telehealth',
        title: 'Hội Chẩn Từ Xa',
        description: 'Telemedicine, Video Call khám bệnh và hội chẩn chuyên gia.',
        path: '/telemedicine',
        icon: <TvIcon className="w-10 h-10"/>,
        color: 'sky',
        allowedRoles: ['admin', 'doctor']
    },
    {
        id: 'hr',
        title: 'Quản lý Nhân sự (HR)',
        description: 'Hồ sơ nhân viên, chấm công FaceID, tính lương và đào tạo.',
        path: '/hr',
        icon: <UserGroupIcon className="w-10 h-10"/>,
        color: 'slate',
        allowedRoles: ['admin', 'hr']
    },
    {
        id: 'reports',
        title: 'Báo Cáo Thống Kê',
        description: 'Hệ thống báo cáo thông minh (BI), biểu đồ phân tích KPI.',
        path: '/management-reporting',
        icon: <ChartBarIcon className="w-10 h-10"/>,
        color: 'red',
        allowedRoles: ['admin', 'doctor', 'accountant']
    },
    {
        id: 'admin',
        title: 'Hệ Thống',
        description: 'Cấu hình tham số, phân quyền người dùng và nhật ký hệ thống.',
        path: '/admin',
        icon: <CogIcon className="w-10 h-10"/>,
        color: 'slate',
        allowedRoles: ['admin']
    }
];

// --- HERO SLIDES DATA ---
const HERO_SLIDES = [
    {
        id: 1,
        title: 'Bệnh viện Đa khoa Quốc tế VIMES',
        subtitle: 'Cam kết mang lại dịch vụ chăm sóc sức khỏe tốt nhất cho cộng đồng.',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80',
        label: 'Thông báo chung',
        color: 'bg-blue-600'
    },
    {
        id: 2,
        title: 'Hội thảo: Ứng dụng AI trong Chẩn đoán hình ảnh',
        subtitle: 'Thời gian: 14:00 - Thứ 6, ngày 24/11 tại Hội trường lớn.',
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80',
        label: 'Sự kiện',
        color: 'bg-purple-600'
    },
    {
        id: 3,
        title: 'Triển khai hệ thống PACS Cloud mới',
        subtitle: 'Tốc độ truy xuất hình ảnh nhanh gấp 2 lần. Hỗ trợ xem trên thiết bị di động.',
        image: 'https://images.unsplash.com/photo-1516549655169-df83a0833860?auto=format&fit=crop&w=1600&q=80',
        label: 'Công nghệ',
        color: 'bg-teal-600'
    }
];

// --- COMPONENTS ---

const BigModuleCard: React.FC<{ item: ModuleCardConfig }> = ({ item }) => {
    // Dynamic color mapping
    const colorMap: Record<string, string> = {
        teal: 'from-teal-500 to-teal-600 shadow-teal-500/20 group-hover:shadow-teal-500/40',
        blue: 'from-blue-500 to-blue-600 shadow-blue-500/20 group-hover:shadow-blue-500/40',
        indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/20 group-hover:shadow-indigo-500/40',
        rose: 'from-rose-500 to-rose-600 shadow-rose-500/20 group-hover:shadow-rose-500/40',
        cyan: 'from-cyan-500 to-cyan-600 shadow-cyan-500/20 group-hover:shadow-cyan-500/40',
        purple: 'from-purple-500 to-purple-600 shadow-purple-500/20 group-hover:shadow-purple-500/40',
        sky: 'from-sky-500 to-sky-600 shadow-sky-500/20 group-hover:shadow-sky-500/40',
        emerald: 'from-emerald-500 to-emerald-600 shadow-emerald-500/20 group-hover:shadow-emerald-500/40',
        green: 'from-green-500 to-green-600 shadow-green-500/20 group-hover:shadow-green-500/40',
        orange: 'from-orange-500 to-orange-600 shadow-orange-500/20 group-hover:shadow-orange-500/40',
        slate: 'from-slate-500 to-slate-600 shadow-slate-500/20 group-hover:shadow-slate-500/40',
        red: 'from-red-500 to-red-600 shadow-red-500/20 group-hover:shadow-red-500/40',
    };
    
    // Icon colors 
    const textMap: Record<string, string> = {
         teal: 'text-teal-600 dark:text-teal-400 group-hover:text-white',
         blue: 'text-blue-600 dark:text-blue-400 group-hover:text-white',
         indigo: 'text-indigo-600 dark:text-indigo-400 group-hover:text-white',
         rose: 'text-rose-600 dark:text-rose-400 group-hover:text-white',
         cyan: 'text-cyan-600 dark:text-cyan-400 group-hover:text-white',
         purple: 'text-purple-600 dark:text-purple-400 group-hover:text-white',
         sky: 'text-sky-600 dark:text-sky-400 group-hover:text-white',
         emerald: 'text-emerald-600 dark:text-emerald-400 group-hover:text-white',
         green: 'text-green-600 dark:text-green-400 group-hover:text-white',
         orange: 'text-orange-600 dark:text-orange-400 group-hover:text-white',
         slate: 'text-slate-600 dark:text-slate-400 group-hover:text-white',
         red: 'text-red-600 dark:text-red-400 group-hover:text-white',
    };

    const gradientClass = colorMap[item.color] || 'from-slate-500 to-slate-600 shadow-slate-500/20';
    const textClass = textMap[item.color];

    return (
        <Link 
            to={item.path}
            className={`
                group relative flex flex-col justify-between p-6 rounded-2xl 
                bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700
                hover:border-transparent transition-all duration-300
                hover:shadow-xl hover:-translate-y-2 overflow-hidden h-full min-h-[180px]
            `}
        >
            {/* Hover Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0`}></div>
            
            {/* Content */}
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-700 group-hover:bg-white/20 backdrop-blur-sm transition-colors ${textClass}`}>
                        {item.icon}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 duration-300 text-white">
                        <ChevronRightIcon className="w-6 h-6"/>
                    </div>
                </div>
                
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-white mb-1 transition-colors">
                        {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 group-hover:text-white/90 line-clamp-2 transition-colors">
                        {item.description}
                    </p>
                </div>
            </div>
        </Link>
    );
};

const DateTimeWidget = () => {
    const { user } = useSession();
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    
    // Capitalize first letter of day
    const dayName = time.toLocaleDateString('vi-VN', { weekday: 'long' });
    const dayNameCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    return (
        <div className="h-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between relative overflow-hidden border border-slate-700">
             {/* Background Effects */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
             <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>

             {/* User Welcome */}
             <div className="relative z-10">
                 <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Xin chào</p>
                 <h2 className="text-xl font-bold truncate" title={user?.fullName}>{user?.fullName}</h2>
                 <p className="text-xs text-slate-400 truncate">{user?.title} - {user?.departmentName}</p>
             </div>

             {/* Time Display */}
             <div className="relative z-10 flex flex-col items-center justify-center py-4">
                 <div className="text-6xl font-black tracking-tighter flex items-baseline gap-1">
                     <span>{hours}</span>
                     <span className="animate-pulse">:</span>
                     <span>{minutes}</span>
                     <span className="text-xl font-medium text-slate-400 ml-1">{seconds}</span>
                 </div>
             </div>

             {/* Date Display */}
             <div className="relative z-10 border-t border-white/10 pt-4">
                 <div className="flex justify-between items-end">
                     <div>
                         <p className="text-blue-400 font-bold text-sm uppercase">{dayNameCapitalized}</p>
                         <p className="text-slate-300 text-sm">
                             {time.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                         </p>
                     </div>
                     <ClockIcon className="w-8 h-8 text-slate-600"/>
                 </div>
             </div>
        </div>
    );
};

const DashboardHero = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
        }, 8000); 
        return () => clearInterval(timer);
    }, []);

    const slide = HERO_SLIDES[currentSlide];

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[420px] mb-10">
            {/* Left: Slider */}
            <div className="flex-1 relative rounded-3xl overflow-hidden shadow-2xl group bg-black">
                {HERO_SLIDES.map((s, idx) => (
                    <div 
                        key={s.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                        <img src={s.image} alt={s.title} className="w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-[10s]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
                        
                        {/* Content */}
                        <div className="absolute bottom-0 left-0 w-full p-8 md:p-10">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white mb-4 ${s.color}`}>
                                {s.label}
                            </span>
                            <h2 className="text-3xl md:text-4xl font-black text-white mb-2 leading-tight max-w-3xl drop-shadow-lg">
                                {s.title}
                            </h2>
                            <p className="text-slate-200 text-sm md:text-lg max-w-2xl drop-shadow-md">
                                {s.subtitle}
                            </p>
                        </div>
                    </div>
                ))}
                
                {/* Slide Indicators */}
                <div className="absolute bottom-8 right-8 z-20 flex gap-2">
                    {HERO_SLIDES.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentSlide(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                        ></button>
                    ))}
                </div>
            </div>

            {/* Right: Info Panel */}
            <div className="w-full lg:w-80 shrink-0 h-80 lg:h-full">
                <DateTimeWidget />
            </div>
        </div>
    );
};

const Dashboard: React.FC = () => {
  const { user } = useSession();

  // Filter modules based on user permissions
  const allowedModules = useMemo(() => {
      return MODULE_CARDS.filter(m => {
          // If user has 'admin' role, show everything.
          // Otherwise check if user's role is in the allowed list for the module.
          const userRole = (user?.role || 'guest') as UserRole;
          if (userRole === 'admin') return true;
          return m.allowedRoles.includes(userRole);
      });
  }, [user]);

  return (
    <div className="min-h-full pb-20 max-w-[1600px] mx-auto px-4 md:px-6">
      
      {/* 1. HERO SECTION (Split Layout) */}
      <DashboardHero />

      {/* 2. MODULES GRID (Flattened) */}
      <div className="animate-fade-in-up">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
             <StarIcon className="w-6 h-6 text-yellow-500 fill-yellow-500"/>
             Ứng dụng của bạn
        </h2>
        
        {allowedModules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allowedModules.map(item => (
                    <BigModuleCard key={item.id} item={item} />
                ))}
            </div>
        ) : (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-xl text-slate-400 font-medium">Không có phân hệ nào được cấp quyền.</p>
                <p className="text-sm text-slate-500 mt-2">Vui lòng liên hệ quản trị viên để được cấp quyền truy cập.</p>
            </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
