
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
    { id: 'command-center', title: 'TT Điều hành (HCC)', description: 'Hệ thống giám sát, chỉ huy và điều hành bệnh viện thời gian thực (Real-time).', path: '/command-center', icon: <GlobeIcon className="w-10 h-10"/>, color: 'red', allowedRoles: ['admin', 'director', 'doctor'] },
    { id: 'online-booking', title: 'Đăng ký Online', description: 'Cầu nối giữa bệnh nhân và phòng khám. Quản lý đặt lịch, duyệt lịch và cấu hình khung giờ.', path: '/online-booking', icon: <CalendarPlusIcon className="w-10 h-10"/>, color: 'sky', allowedRoles: ['admin', 'receptionist', 'doctor'] },
    { id: 'reception', title: 'Tiếp Nhận & Điều Phối', description: 'Đăng ký bệnh nhân tại quầy, phân luồng, lấy số và quản lý hàng đợi.', path: '/reception', icon: <UserGroupIcon className="w-10 h-10"/>, color: 'teal', allowedRoles: ['admin', 'receptionist', 'nurse', 'doctor'] },
    { id: 'clinical', title: 'Khám Bệnh (EMR)', description: 'Bàn khám bác sĩ, chẩn đoán, kê đơn và hồ sơ bệnh án điện tử.', path: '/consultation', icon: <HospitalIcon className="w-10 h-10"/>, color: 'blue', allowedRoles: ['admin', 'doctor'] },
    { id: 'inpatient', title: 'Điều Trị Nội Trú', description: 'Quản lý buồng bệnh, y lệnh hàng ngày và chăm sóc người bệnh.', path: '/inpatient-treatment', icon: <ClipboardListIcon className="w-10 h-10"/>, color: 'indigo', allowedRoles: ['admin', 'doctor', 'nurse'] },
    { id: 'surgery', title: 'Phẫu Thuật - Thủ Thuật', description: 'Lịch mổ, quản lý ekip, tường trình phẫu thuật và vật tư tiêu hao.', path: '/surgery', icon: <VideoCameraIcon className="w-10 h-10"/>, color: 'rose', allowedRoles: ['admin', 'doctor', 'nurse'] },
    { id: 'lab', title: 'Xét Nghiệm (LIS)', description: 'Quản lý chỉ định, kết nối máy xét nghiệm và trả kết quả tự động.', path: '/lab-results', icon: <BeakerIcon className="w-10 h-10"/>, color: 'cyan', allowedRoles: ['admin', 'doctor', 'technician'] },
    { id: 'imaging', title: 'CĐHA & PACS', description: 'X-Quang, Siêu âm, CT, MRI. Xem hình ảnh DICOM chuyên sâu.', path: '/imaging-results', icon: <VideoCameraIcon className="w-10 h-10"/>, color: 'purple', allowedRoles: ['admin', 'doctor', 'technician'] },
    { id: 'pharmacy', title: 'Dược & Kho Y Tế', description: 'Quản lý nhập xuất tồn, cấp phát thuốc, cảnh báo hạn dùng.', path: '/pharmacy', icon: <ArchiveIcon className="w-10 h-10"/>, color: 'emerald', allowedRoles: ['admin', 'pharmacist', 'accountant'] },
    { id: 'medical-supplies', title: 'Vật tư Y tế', description: 'Quản lý vật tư tiêu hao, hóa chất xét nghiệm và công cụ dụng cụ.', path: '/medical-supplies', icon: <TagIcon className="w-10 h-10"/>, color: 'indigo', allowedRoles: ['admin', 'pharmacist', 'accountant', 'nurse'] },
    { id: 'billing', title: 'Viện Phí & Thu Ngân', description: 'Thanh toán chi phí, tạm ứng, quyết toán và hóa đơn điện tử.', path: '/billing', icon: <CurrencyDollarIcon className="w-10 h-10"/>, color: 'green', allowedRoles: ['admin', 'accountant', 'receptionist'] },
    { id: 'insurance', title: 'Bảo Hiểm Y Tế', description: 'Giám định hồ sơ, kiểm tra thẻ Online, xuất dữ liệu cổng BHXH.', path: '/insurance', icon: <ShieldCheckIcon className="w-10 h-10"/>, color: 'orange', allowedRoles: ['admin', 'accountant', 'doctor'] },
    { id: 'hr', title: 'Quản lý Nhân sự (HR)', description: 'Hồ sơ nhân viên, chấm công FaceID, tính lương và đào tạo.', path: '/hr', icon: <UserGroupIcon className="w-10 h-10"/>, color: 'slate', allowedRoles: ['admin', 'hr'] },
    { id: 'reports', title: 'Báo Cáo Thống Kê', description: 'Hệ thống báo cáo thông minh (BI), biểu đồ phân tích KPI.', path: '/management-reporting', icon: <ChartBarIcon className="w-10 h-10"/>, color: 'red', allowedRoles: ['admin', 'doctor', 'accountant'] },
    { id: 'admin', title: 'Hệ Thống', description: 'Cấu hình tham số, phân quyền người dùng và nhật ký hệ thống.', path: '/admin', icon: <CogIcon className="w-10 h-10"/>, color: 'slate', allowedRoles: ['admin'] }
];

const DateTimeWidget = () => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20">
            <ClockIcon className="w-8 h-8 text-white opacity-80" />
            <div className="text-white">
                <div className="text-2xl font-black font-mono leading-none">{time.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-[10px] font-bold uppercase tracking-wider opacity-70 mt-1">{time.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' })}</div>
            </div>
        </div>
    );
};

const DashboardHero = () => {
    const { user } = useSession();
    return (
        <div className="relative bg-gradient-to-br from-teal-600 to-blue-700 rounded-[40px] p-8 md:p-12 mb-12 shadow-2xl overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 skew-x-12 transform translate-x-20"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                    <h2 className="text-blue-100 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2"><span className="w-8 h-px bg-blue-300"></span> Bệnh viện đa khoa quốc tế VIMES</h2>
                    <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Chào ngày mới, <br/> <span className="text-teal-200">{user?.fullName || 'Bác sĩ'}</span></h1>
                    <p className="text-blue-100 text-lg max-w-md font-medium opacity-90">Hệ thống đã sẵn sàng. Chúc bạn một ngày làm việc hiệu quả và tràn đầy năng lượng.</p>
                </div>
                <div className="hidden md:block"><DateTimeWidget /></div>
            </div>
        </div>
    );
};

const BigModuleCard: React.FC<{ item: ModuleCardConfig }> = ({ item }) => {
    const colorClasses = {
        blue: 'bg-blue-600 shadow-blue-500/20',
        teal: 'bg-teal-600 shadow-teal-500/20',
        indigo: 'bg-indigo-600 shadow-indigo-500/20',
        rose: 'bg-rose-600 shadow-rose-500/20',
        cyan: 'bg-cyan-600 shadow-cyan-500/20',
        purple: 'bg-purple-600 shadow-purple-500/20',
        emerald: 'bg-emerald-600 shadow-emerald-500/20',
        green: 'bg-green-600 shadow-green-500/20',
        orange: 'bg-orange-600 shadow-orange-500/20',
        sky: 'bg-sky-600 shadow-sky-500/20',
        slate: 'bg-slate-600 shadow-slate-500/20',
        red: 'bg-red-600 shadow-red-500/20',
    };
    return (
        <Link to={item.path} className="group bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300 ${colorClasses[item.color]}`}>{item.icon}</div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{item.description}</p>
            <div className="mt-auto flex items-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                <span>Truy cập</span>
                <ChevronRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
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
    <div className="min-h-full pb-20 max-w-[1600px] mx-auto px-4 md:px-6">
      <DashboardHero />
      <div className="animate-fade-in-up">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><StarIcon className="w-6 h-6 text-yellow-500 fill-yellow-500"/> Ứng dụng của bạn</h2>
        {allowedModules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{allowedModules.map(item => (<BigModuleCard key={item.id} item={item} />))}</div>
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
