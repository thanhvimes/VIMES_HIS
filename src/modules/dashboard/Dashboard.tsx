
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
    TvIcon
} from '../../components/Icons';
import { useSession } from '../../contexts/SessionContext';

// --- DATA CONFIGURATION ---
// Cấu hình hiển thị cho từng module (Mô tả, màu sắc, Icon)
const MODULE_CARDS = [
    {
        id: 'clinical',
        title: 'Lâm Sàng & Khám Bệnh',
        description: 'Dành cho Bác sĩ. Quản lý hàng đợi, ghi nhận sinh hiệu, chẩn đoán, kê đơn và bệnh án điện tử.',
        path: '/consultation',
        icon: <HospitalIcon className="w-8 h-8"/>,
        color: 'blue', // Tailwind color base
        group: 'Nghiệp vụ chính'
    },
    {
        id: 'reception',
        title: 'Tiếp Nhận & Điều Phối',
        description: 'Dành cho Lễ tân. Đăng ký bệnh nhân mới, phân luồng phòng khám và quản lý hàng đợi sảnh.',
        path: '/reception',
        icon: <UserGroupIcon className="w-8 h-8"/>,
        color: 'teal',
        group: 'Nghiệp vụ chính'
    },
    {
        id: 'inpatient',
        title: 'Điều Trị Nội Trú',
        description: 'Quản lý buồng bệnh, y lệnh hàng ngày, theo dõi diễn biến và thủ tục xuất viện.',
        path: '/inpatient-treatment',
        icon: <ClipboardListIcon className="w-8 h-8"/>,
        color: 'indigo',
        group: 'Nghiệp vụ chính'
    },
    {
        id: 'surgery',
        title: 'Phẫu Thuật & Thủ Thuật',
        description: 'Lịch mổ phiên, mổ cấp cứu, tường trình phẫu thuật và quản lý ekip mổ.',
        path: '/surgery',
        icon: <VideoCameraIcon className="w-8 h-8"/>,
        color: 'rose',
        group: 'Chuyên sâu'
    },
    {
        id: 'lab',
        title: 'Xét Nghiệm (LIS)',
        description: 'Quản lý chỉ định, lấy mẫu, kết nối máy xét nghiệm và trả kết quả tự động.',
        path: '/lab-results',
        icon: <BeakerIcon className="w-8 h-8"/>,
        color: 'cyan',
        group: 'Cận lâm sàng'
    },
    {
        id: 'imaging',
        title: 'Chẩn Đoán Hình Ảnh (PACS)',
        description: 'X-Quang, Siêu âm, CT, MRI. Xem hình ảnh DICOM và đọc kết quả chẩn đoán.',
        path: '/imaging-results',
        icon: <VideoCameraIcon className="w-8 h-8"/>, // Reuse icon or specific one
        color: 'purple',
        group: 'Cận lâm sàng'
    },
    {
        id: 'pharmacy',
        title: 'Dược & Kho Y Tế',
        description: 'Quản lý nhập xuất tồn, cấp phát thuốc, cảnh báo hạn dùng và tương tác thuốc.',
        path: '/pharmacy',
        icon: <ArchiveIcon className="w-8 h-8"/>,
        color: 'emerald',
        group: 'Tài chính & Dược'
    },
    {
        id: 'billing',
        title: 'Viện Phí & Thu Ngân',
        description: 'Thanh toán chi phí KCB, tạm ứng, quyết toán BHYT và hóa đơn điện tử.',
        path: '/billing',
        icon: <CurrencyDollarIcon className="w-8 h-8"/>,
        color: 'green',
        group: 'Tài chính & Dược'
    },
    {
        id: 'insurance',
        title: 'Bảo Hiểm Y Tế',
        description: 'Giám định hồ sơ, kiểm tra thẻ Online và xuất dữ liệu XML liên thông cổng BHXH.',
        path: '/insurance',
        icon: <ShieldCheckIcon className="w-8 h-8"/>,
        color: 'orange',
        group: 'Tài chính & Dược'
    },
    {
        id: 'telehealth',
        title: 'Hội Chẩn Từ Xa',
        description: 'Kết nối trực tuyến với chuyên gia, chia sẻ dữ liệu PACS và bệnh án thời gian thực.',
        path: '/telemedicine',
        icon: <TvIcon className="w-8 h-8"/>,
        color: 'sky',
        group: 'Tiện ích mở rộng'
    },
    {
        id: 'admin',
        title: 'Quản Trị Hệ Thống',
        description: 'Cấu hình người dùng, danh mục dùng chung, phân quyền và cài đặt tham số.',
        path: '/admin',
        icon: <CogIcon className="w-8 h-8"/>,
        color: 'slate',
        group: 'Quản trị'
    },
    {
        id: 'reports',
        title: 'Báo Cáo Thống Kê',
        description: 'Hệ thống báo cáo thông minh, biểu đồ phân tích hoạt động và doanh thu.',
        path: '/management-reporting',
        icon: <ChartBarIcon className="w-8 h-8"/>,
        color: 'red',
        group: 'Quản trị'
    }
];

type ModuleCardItem = typeof MODULE_CARDS[number];

// --- COMPONENTS ---

const ModernCard: React.FC<{ item: ModuleCardItem }> = ({ item }) => {
    // Dynamic Tailwind classes construction
    const bgClass = `bg-${item.color}-50 dark:bg-${item.color}-900/20`;
    const textClass = `text-${item.color}-600 dark:text-${item.color}-400`;
    const borderHover = `hover:border-${item.color}-300 dark:hover:border-${item.color}-700`;
    const iconBg = `bg-${item.color}-100 dark:bg-${item.color}-800`;

    return (
        <Link 
            to={item.path}
            className={`group relative flex flex-col h-full p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${borderHover} overflow-hidden`}
        >
            {/* Background Decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${bgClass} rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 opacity-50`}></div>

            <div className="relative z-10 flex-1 flex flex-col">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${iconBg} ${textClass} mb-6 shadow-inner group-hover:scale-105 transition-transform duration-300`}>
                    {item.icon}
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                </h3>
                
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1">
                    {item.description}
                </p>

                <div className={`flex items-center text-sm font-bold ${textClass} mt-auto`}>
                    TRUY CẬP MODULE <ChevronRightIcon className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform"/>
                </div>
            </div>
        </Link>
    );
};

const Dashboard: React.FC = () => {
  const { orgInfo, user } = useSession();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Group modules
  const groups = useMemo(() => {
      const g: Record<string, ModuleCardItem[]> = {};
      MODULE_CARDS.forEach(item => {
          if (!g[item.group]) g[item.group] = [];
          g[item.group].push(item);
      });
      return g;
  }, []);

  return (
    <div className="min-h-full pb-10">
      
      {/* 1. HERO / WELCOME SECTION */}
      <div className="mb-10">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-2">
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                    Xin chào, {user?.fullName}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                    {orgInfo.hospitalName} - {user?.departmentName}
                </p>
            </div>
            <div className="text-right hidden md:block">
                <div className="text-3xl font-light text-slate-700 dark:text-slate-300">
                    {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </div>
            </div>
          </div>
          <div className="h-1 w-20 bg-blue-600 rounded-full mt-4"></div>
      </div>

      {/* 2. MODULES GRID BY GROUP */}
      <div className="space-y-10">
          {Object.entries(groups).map(([groupName, items]) => (
              <div key={groupName} className="animate-fade-in-up">
                  <h2 className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      {groupName}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {items.map(item => (
                          <ModernCard key={item.id} item={item} />
                      ))}
                  </div>
              </div>
          ))}
      </div>

    </div>
  );
};

export default Dashboard;
