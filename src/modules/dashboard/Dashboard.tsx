
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MODULE_ITEMS } from '../../constants/navigation';
import { 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    ExternalLinkIcon, 
    ClockIcon, 
    UserGroupIcon,
    HospitalIcon,
    ChartBarIcon
} from '../../components/Icons';
import { useSession } from '../../contexts/SessionContext';
import { useSystem } from '../../contexts/SystemContext';
import { NavItemType } from '../../types';

// --- HÀM HỖ TRỢ (HELPER FUNCTION) ---
// Hàm này nhận vào tên nhóm (group) và trả về các class CSS màu sắc tương ứng.
// Giúp phân biệt màu sắc cho các thẻ module: Lâm sàng (xanh dương), Tài chính (xanh ngọc), v.v.
const getGroupStyles = (group?: string) => {
    switch (group) {
        case 'clinical': // Nhóm Lâm sàng
            return {
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                text: 'text-blue-700 dark:text-blue-300',
                border: 'group-hover:border-blue-300 dark:group-hover:border-blue-500',
                iconBg: 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-200 shadow-sm',
                gradient: 'from-blue-500 to-indigo-600'
            };
        case 'finance': // Nhóm Tài chính
            return {
                bg: 'bg-teal-50 dark:bg-teal-900/20',
                text: 'text-teal-700 dark:text-teal-300',
                border: 'group-hover:border-teal-300 dark:group-hover:border-teal-500',
                iconBg: 'bg-teal-100 dark:bg-teal-800 text-teal-600 dark:text-teal-200 shadow-sm',
                gradient: 'from-teal-500 to-emerald-600'
            };
        case 'support': // Nhóm Hỗ trợ
            return {
                bg: 'bg-indigo-50 dark:bg-indigo-900/20',
                text: 'text-indigo-700 dark:text-indigo-300',
                border: 'group-hover:border-indigo-300 dark:group-hover:border-indigo-500',
                iconBg: 'bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-200 shadow-sm',
                gradient: 'from-indigo-500 to-violet-600'
            };
        default: // Nhóm Quản trị (Admin) & Mặc định
            return {
                bg: 'bg-slate-50 dark:bg-slate-800',
                text: 'text-slate-700 dark:text-slate-300',
                border: 'group-hover:border-slate-400 dark:group-hover:border-slate-500',
                iconBg: 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm',
                gradient: 'from-slate-500 to-gray-600'
            };
    }
};

const Dashboard: React.FC = () => {
  // --- KHAI BÁO STATE & HOOKS ---
  const { orgInfo, user } = useSession(); // Lấy thông tin bệnh viện và người dùng đang đăng nhập
  const { slides } = useSystem(); // Lấy danh sách slide quảng cáo từ hệ thống
  
  // Lọc ra các slide đang hoạt động (active = true)
  const activeSlides = slides.filter(s => s.active);
  
  // State lưu chỉ số của slide đang hiển thị
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  
  // State lưu thời gian hiện tại (để hiển thị đồng hồ)
  const [currentTime, setCurrentTime] = useState(new Date());

  // --- USE EFFECT (XỬ LÝ SIDE EFFECTS) ---
  useEffect(() => {
    // 1. Tạo bộ đếm cập nhật đồng hồ mỗi 60 giây (60000ms)
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    
    // 2. Tạo bộ đếm tự động chuyển slide mỗi 8 giây (8000ms)
    let slideTimer: ReturnType<typeof setInterval>;
    if (activeSlides.length > 1) {
        slideTimer = setInterval(() => {
          setCurrentSlideIndex((prev) => (prev + 1) % activeSlides.length);
        }, 8000);
    }

    // Dọn dẹp bộ đếm khi component bị hủy (unmount) để tránh lỗi bộ nhớ
    return () => {
        clearInterval(timer);
        if (slideTimer) clearInterval(slideTimer);
    };
  }, [activeSlides.length]);

  // --- CÁC HÀM XỬ LÝ SỰ KIỆN (HANDLERS) ---
  // Chuyển sang slide tiếp theo
  const nextSlide = () => setCurrentSlideIndex((prev) => (prev + 1) % activeSlides.length);
  
  // Quay lại slide trước đó
  const prevSlide = () => setCurrentSlideIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);

  // Mở link khi click vào nút "Xem chi tiết" trên slide
  const handleViewDetail = (url: string) => {
      if (url && (url.startsWith('http') || url.startsWith('https'))) {
          window.open(url, '_blank');
      }
  };

  // --- COMPONENT CON (Widget thống kê nhỏ) ---
  // Dùng để hiển thị các ô số liệu nhanh (ví dụ: Chờ khám: 42)
  const StatWidget = ({ label, value, icon, color }: any) => (
      <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 min-w-[180px] transition-transform hover:-translate-y-1">
          <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-white`}>
             <div className={`w-8 h-8 flex items-center justify-center rounded-md shadow-md ${color}`}>
                {icon}
             </div>
          </div>
          <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">{label}</p>
              <p className="text-xl font-extrabold text-slate-800 dark:text-white">{value}</p>
          </div>
      </div>
  );

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10">
      
      {/* 1. KHU VỰC HERO (BANNER CHÍNH) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[380px]">
          
          {/* --- CỘT TRÁI: THÔNG TIN BỆNH VIỆN (Chiếm 5 phần) --- */}
          <div className="lg:col-span-5 flex flex-col h-full">
              <div className="flex-1 bg-gradient-to-br from-slate-900 to-blue-900 dark:from-black dark:to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between border border-slate-700/50 group">
                  
                  {/* Hiệu ứng nền (Background Effects) */}
                  <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-[100px] group-hover:opacity-20 transition-opacity duration-1000"></div>
                  <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-60 h-60 bg-teal-500 rounded-full opacity-10 blur-[80px]"></div>
                  
                  <div className="relative z-10">
                      {/* Logo và Tên bệnh viện */}
                      <div className="flex items-center gap-5 mb-8">
                          <div className="w-20 h-20 bg-white p-2 rounded-2xl shadow-lg flex items-center justify-center shrink-0">
                             {orgInfo.logoUrl ? (
                                <img src={orgInfo.logoUrl} alt="Logo" className="w-full h-full object-contain"/>
                             ) : (
                                <HospitalIcon className="w-12 h-12 text-blue-800"/>
                             )}
                          </div>
                          <div>
                              <p className="text-blue-200 text-xs md:text-sm uppercase tracking-widest font-bold mb-1">{orgInfo.governingUnitName}</p>
                              <h1 className="text-2xl md:text-3xl font-extrabold leading-tight text-white uppercase tracking-tight drop-shadow-md">
                                  '{orgInfo.hospitalName}'
                              </h1>
                          </div>
                      </div>
                      
                      {/* Thông tin Người dùng (Bác sĩ/Nhân viên) */}
                      <div className="space-y-2 mb-6">
                          <p className="text-lg text-slate-300 font-light">
                              Xin chào, <span className="font-bold text-white text-xl">{user?.fullName}</span>
                          </p>
                          <div className="flex items-center gap-2">
                                <span className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-sm">
                                    {user?.title}
                                </span>
                                <span className="text-xs text-slate-300">•</span>
                                <span className="text-xs text-slate-300 font-medium">{user?.departmentName}</span>
                          </div>
                      </div>
                  </div>

                  {/* Đồng hồ & Hotline (Phía dưới cùng thẻ) */}
                  <div className="relative z-10 pt-6 border-t border-white/10 mt-auto">
                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-4xl font-light tracking-tighter text-white">
                                  {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-blue-200 text-sm font-bold mt-1 uppercase tracking-wide">
                                  {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </p>
                          </div>
                          <div className="text-right hidden sm:block">
                               <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Hotline Hỗ trợ</p>
                               <p className="text-xl font-bold text-yellow-400 font-mono tracking-wide">{orgInfo.hotline}</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Dải thống kê nhanh (Chỉ hiện trên màn hình lớn) */}
              <div className="mt-6 hidden lg:flex gap-4 overflow-x-auto pb-2">
                  <StatWidget label="Đang chờ khám" value="42" color="bg-orange-500" icon={<UserGroupIcon className="w-5 h-5 text-white"/>} />
                  <StatWidget label="Nội trú hiện diện" value="156" color="bg-indigo-600" icon={<HospitalIcon className="w-5 h-5 text-white"/>} />
                  <StatWidget label="Lịch mổ hôm nay" value="8" color="bg-rose-500" icon={<ClockIcon className="w-5 h-5 text-white"/>} />
              </div>
          </div>

          {/* --- CỘT PHẢI: SLIDER QUẢNG CÁO/THÔNG BÁO (Chiếm 7 phần) --- */}
          <div className="lg:col-span-7 h-72 lg:h-auto relative rounded-3xl overflow-hidden shadow-2xl group bg-slate-900 border border-slate-800">
             {activeSlides.length > 0 ? (
                 <>
                    {activeSlides.map((slide, index) => (
                        <div 
                            key={slide.id}
                            className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                            index === currentSlideIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
                            }`}
                        >
                            {/* Hiển thị Video hoặc Hình ảnh */}
                            {slide.type === 'video' ? (
                                <div className="w-full h-full relative">
                                    <video src={slide.url} className="w-full h-full object-cover opacity-90" autoPlay muted loop playsInline />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-90"></div>
                                </div>
                            ) : (
                                <div className="w-full h-full bg-cover bg-center relative" style={{ backgroundImage: `url('${slide.url}')` }}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90"></div>
                                </div>
                            )}

                            {/* Nội dung Text trên Slide */}
                            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 text-white z-20 flex flex-col justify-end h-full">
                                <div className="mb-auto pt-4">
                                    <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-blue-600/90 backdrop-blur-md text-[10px] md:text-xs font-bold uppercase tracking-widest border border-blue-400/50 shadow-lg">
                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                                        {slide.type === 'video' ? 'Video Nổi bật' : 'Tin tức & Sự kiện'}
                                    </span>
                                </div>
                                
                                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight mb-3 drop-shadow-lg max-w-4xl text-white/95">
                                    {slide.title}
                                </h2>
                                <p className="text-sm md:text-base text-slate-200 leading-relaxed drop-shadow-md mb-6 line-clamp-2 max-w-2xl font-medium border-l-4 border-blue-500 pl-4">
                                    {slide.desc}
                                </p>
                                
                                <div>
                                    <button 
                                        onClick={() => handleViewDetail(slide.url)}
                                        className="group flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 hover:bg-blue-50 font-bold rounded-full backdrop-blur-md border border-transparent hover:border-blue-200 transition-all hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] text-sm"
                                    >
                                        Xem chi tiết <ExternalLinkIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform text-blue-600"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Nút điều hướng Slide (Previous/Next) */}
                    {activeSlides.length > 1 && (
                        <>
                            <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-sm z-30 opacity-0 group-hover:opacity-100 transition-all border border-white/10">
                                <ChevronLeftIcon className="w-6 h-6"/>
                            </button>
                            <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-sm z-30 opacity-0 group-hover:opacity-100 transition-all border border-white/10">
                                <ChevronRightIcon className="w-6 h-6"/>
                            </button>
                            {/* Dấu chấm chỉ số trang (Pagination Dots) */}
                            <div className="absolute bottom-8 right-10 flex gap-2 z-30">
                                {activeSlides.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentSlideIndex(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentSlideIndex ? 'w-10 bg-blue-500' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                 </>
             ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-100 dark:bg-slate-900">
                     <p>Chưa có nội dung hiển thị</p>
                 </div>
             )}
          </div>
      </div>

      {/* Thống kê trên Mobile (Chỉ hiện khi màn hình nhỏ) */}
      <div className="lg:hidden grid grid-cols-2 gap-3">
           <StatWidget label="Chờ khám" value="42" color="bg-orange-500" icon={<UserGroupIcon className="w-5 h-5 text-white"/>} />
           <StatWidget label="Nội trú" value="156" color="bg-blue-500" icon={<HospitalIcon className="w-5 h-5 text-white"/>} />
      </div>

      {/* 2. DANH SÁCH CÁC MODULE (Lưới chức năng) */}
      <div>
        <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
            <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white uppercase tracking-wide">
               Chức năng nghiệp vụ
            </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
          {/* Lặp qua danh sách module và hiển thị dưới dạng thẻ (Card) */}
          {MODULE_ITEMS.map((item: NavItemType) => {
            const styles = getGroupStyles(item.group); // Lấy màu sắc dựa theo nhóm
            return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    group relative flex flex-col items-start p-5 
                    bg-white dark:bg-slate-800 rounded-2xl 
                    shadow-sm hover:shadow-xl transition-all duration-300 
                    border border-slate-200/80 dark:border-slate-700 
                    hover:-translate-y-1 hover:border-t-4 ${styles.border}
                  `}
                >
                  {/* Hiệu ứng nền khi di chuột (Hover Effect) */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${styles.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`}></div>

                  {/* Icon Box */}
                  <div className={`mb-4 p-3.5 rounded-2xl ${styles.iconBg} transition-transform group-hover:scale-110 duration-300 group-hover:rotate-3`}>
                    {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-8 h-8' })}
                  </div>
                  
                  {/* Tên Module & Nút điều hướng */}
                  <div className="w-full relative z-10">
                      <h3 className={`text-base font-bold ${styles.text} mb-1 line-clamp-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors`} title={item.name}>
                        {item.name}
                      </h3>
                      <div className="flex items-center justify-between mt-3">
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                             Truy cập
                          </p>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-700 group-hover:${styles.bg} transition-colors`}>
                                <ChevronRightIcon className={`w-3 h-3 text-slate-400 group-hover:${styles.text}`}/>
                          </div>
                      </div>
                  </div>
                </Link>
            );
          })}
        </div>
      </div>
      
    </div>
  );
};

export default Dashboard;
