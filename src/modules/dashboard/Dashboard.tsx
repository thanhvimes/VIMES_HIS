
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MODULE_ITEMS } from '../../constants/navigation';
import { 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    ExternalLinkIcon, 
    ClockIcon, 
    UserGroupIcon,
    HospitalIcon,
    ChartBarIcon,
    BeakerIcon,
    CurrencyDollarIcon,
    CogIcon
} from '../../components/Icons';
import { useSession } from '../../contexts/SessionContext';
import { useSystem } from '../../contexts/SystemContext'; // Sửa lỗi import useSystem nếu có
import { NavItemType } from '../../types';

// --- CẤU HÌNH GIAO DIỆN CHO TỪNG NHÓM MODULE ---
const GROUP_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
    'clinical': { 
        label: 'Lâm sàng (Khám & Điều trị)', 
        icon: <HospitalIcon className="w-6 h-6"/>, 
        color: 'text-blue-600 dark:text-blue-400', 
        bg: 'bg-blue-50 dark:bg-blue-900/10',
        border: 'border-blue-200 dark:border-blue-800'
    },
    'paraclinical': { 
        label: 'Cận lâm sàng (Xét nghiệm & CĐHA)', 
        icon: <BeakerIcon className="w-6 h-6"/>, 
        color: 'text-purple-600 dark:text-purple-400', 
        bg: 'bg-purple-50 dark:bg-purple-900/10',
        border: 'border-purple-200 dark:border-purple-800'
    },
    'finance': { 
        label: 'Tài chính & Dược', 
        icon: <CurrencyDollarIcon className="w-6 h-6"/>, 
        color: 'text-emerald-600 dark:text-emerald-400', 
        bg: 'bg-emerald-50 dark:bg-emerald-900/10',
        border: 'border-emerald-200 dark:border-emerald-800'
    },
    'admin': { 
        label: 'Quản trị & Hành chính', 
        icon: <CogIcon className="w-6 h-6"/>, 
        color: 'text-slate-600 dark:text-slate-400', 
        bg: 'bg-slate-50 dark:bg-slate-800',
        border: 'border-slate-200 dark:border-slate-700'
    },
    'support': {
        label: 'Hỗ trợ & CSKH',
        icon: <UserGroupIcon className="w-6 h-6"/>,
        color: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-50 dark:bg-orange-900/10',
        border: 'border-orange-200 dark:border-orange-800'
    }
};

const Dashboard: React.FC = () => {
  const { orgInfo, user } = useSession();
  const { slides } = useSystem();
  
  const activeSlides = slides.filter(s => s.active);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Clock & Slider Timer
  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 60000);
    let slideTimer: ReturnType<typeof setInterval>;
    
    if (activeSlides.length > 1) {
        slideTimer = setInterval(() => {
          setCurrentSlideIndex((prev) => (prev + 1) % activeSlides.length);
        }, 8000);
    }

    return () => {
        clearInterval(clockTimer);
        if (slideTimer) clearInterval(slideTimer);
    };
  }, [activeSlides.length]);

  const nextSlide = () => setCurrentSlideIndex((prev) => (prev + 1) % activeSlides.length);
  const prevSlide = () => setCurrentSlideIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);

  const handleViewDetail = (url: string) => {
      if (url && (url.startsWith('http') || url.startsWith('https'))) {
          window.open(url, '_blank');
      }
  };

  // Gom nhóm các module
  const groupedModules = useMemo(() => {
      const groups: Record<string, NavItemType[]> = {
          'clinical': [], 'paraclinical': [], 'finance': [], 'admin': [], 'support': []
      };
      
      MODULE_ITEMS.forEach(item => {
          const groupKey = item.group || 'admin';
          if (groups[groupKey]) {
              groups[groupKey].push(item);
          }
      });
      return groups;
  }, []);

  // Widget Component
  const StatWidget = ({ label, value, icon, color }: any) => (
      <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 min-w-[200px] transition-transform hover:-translate-y-1 hover:shadow-md">
          <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-white shadow-inner`}>
             <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${color}`}>
                {icon}
             </div>
          </div>
          <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">{label}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{value}</p>
          </div>
      </div>
  );

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-10 animate-fade-in">
      
      {/* 1. HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[400px]">
          
          {/* Hospital Info Card */}
          <div className="lg:col-span-5 flex flex-col h-full">
              <div className="flex-1 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 dark:from-black dark:to-slate-900 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between border border-slate-700/50 group">
                  
                  {/* Decor */}
                  <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-[80px] group-hover:opacity-20 transition-opacity duration-1000"></div>
                  <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-teal-500 rounded-full opacity-10 blur-[60px]"></div>
                  
                  <div className="relative z-10">
                      <div className="flex items-start gap-5 mb-6">
                          <div className="w-20 h-20 bg-white p-2 rounded-2xl shadow-xl flex items-center justify-center shrink-0">
                             {orgInfo.logoUrl ? (
                                <img src={orgInfo.logoUrl} alt="Logo" className="w-full h-full object-contain"/>
                             ) : (
                                <HospitalIcon className="w-12 h-12 text-blue-800"/>
                             )}
                          </div>
                          <div className="pt-1">
                              <p className="text-blue-200 text-xs md:text-sm uppercase tracking-[0.2em] font-bold mb-2">{orgInfo.governingUnitName}</p>
                              <h1 className="text-2xl md:text-3xl font-black leading-tight text-white uppercase tracking-tight drop-shadow-lg">
                                  {orgInfo.hospitalName}
                              </h1>
                          </div>
                      </div>
                      
                      <div className="pl-1 space-y-1">
                          <p className="text-lg text-slate-300 font-light">
                              Xin chào, <span className="font-bold text-white text-xl">{user?.fullName}</span>
                          </p>
                          <div className="flex items-center gap-2">
                                <span className="text-[10px] uppercase font-bold bg-white/10 text-blue-100 px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                                    {user?.title}
                                </span>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-300 font-medium">{user?.departmentName}</span>
                          </div>
                      </div>
                  </div>

                  <div className="relative z-10 pt-6 border-t border-white/10 mt-auto">
                      <div className="flex justify-between items-end">
                          <div>
                              <p className="text-5xl font-extralight tracking-tighter text-white tabular-nums">
                                  {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-blue-200 text-sm font-bold mt-1 uppercase tracking-wider">
                                  {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                              </p>
                          </div>
                          <div className="text-right hidden sm:block">
                               <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Hỗ trợ kỹ thuật</p>
                               <p className="text-xl font-bold text-yellow-400 font-mono tracking-wide">{orgInfo.hotline}</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Quick Stats Strip */}
              <div className="mt-6 hidden lg:flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                  <StatWidget label="Chờ khám" value="42" color="bg-orange-500" icon={<UserGroupIcon className="w-5 h-5 text-white"/>} />
                  <StatWidget label="Nội trú" value="156" color="bg-indigo-600" icon={<HospitalIcon className="w-5 h-5 text-white"/>} />
                  <StatWidget label="Lịch mổ" value="8" color="bg-rose-500" icon={<ClockIcon className="w-5 h-5 text-white"/>} />
                  <StatWidget label="Doanh thu" value="1.2T" color="bg-emerald-500" icon={<CurrencyDollarIcon className="w-5 h-5 text-white"/>} />
              </div>
          </div>

          {/* Slider Card */}
          <div className="lg:col-span-7 h-72 lg:h-auto relative rounded-[2rem] overflow-hidden shadow-2xl group bg-slate-900 border border-slate-800">
             {activeSlides.length > 0 ? (
                 <>
                    {activeSlides.map((slide, index) => (
                        <div 
                            key={slide.id}
                            className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                            index === currentSlideIndex ? 'opacity-100 z-10 scale-100' : 'opacity-0 z-0 scale-105'
                            }`}
                        >
                            {slide.type === 'video' ? (
                                <div className="w-full h-full relative">
                                    <video src={slide.url} className="w-full h-full object-cover opacity-80" autoPlay muted loop playsInline />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90"></div>
                                </div>
                            ) : (
                                <div className="w-full h-full bg-cover bg-center relative" style={{ backgroundImage: `url('${slide.url}')` }}>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90"></div>
                                </div>
                            )}

                            <div className="absolute bottom-0 left-0 w-full p-10 md:p-14 text-white z-20 flex flex-col justify-end h-full">
                                <div className="mb-auto pt-2">
                                    <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest border border-white/20 shadow-lg">
                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                        {slide.type === 'video' ? 'Video Nổi bật' : 'Tin tức & Sự kiện'}
                                    </span>
                                </div>
                                
                                <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-4 drop-shadow-lg max-w-3xl text-white">
                                    {slide.title}
                                </h2>
                                <p className="text-base md:text-lg text-slate-200 leading-relaxed drop-shadow-md mb-8 line-clamp-2 max-w-2xl font-medium border-l-4 border-blue-500 pl-4">
                                    {slide.desc}
                                </p>
                                
                                <div>
                                    <button 
                                        onClick={() => handleViewDetail(slide.url)}
                                        className="group flex items-center gap-3 px-6 py-3 bg-white text-slate-900 hover:bg-blue-50 font-bold rounded-full backdrop-blur-md border border-transparent hover:border-blue-200 transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] text-sm"
                                    >
                                        Xem chi tiết <ExternalLinkIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform text-blue-600"/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {activeSlides.length > 1 && (
                        <>
                            <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-md z-30 opacity-0 group-hover:opacity-100 transition-all border border-white/10">
                                <ChevronLeftIcon className="w-6 h-6"/>
                            </button>
                            <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-md z-30 opacity-0 group-hover:opacity-100 transition-all border border-white/10">
                                <ChevronRightIcon className="w-6 h-6"/>
                            </button>
                            <div className="absolute bottom-10 right-10 flex gap-2 z-30">
                                {activeSlides.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentSlideIndex(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentSlideIndex ? 'w-12 bg-blue-500' : 'w-3 bg-white/30 hover:bg-white/60'}`}
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

      {/* Mobile Stats */}
      <div className="lg:hidden grid grid-cols-2 gap-3">
           <StatWidget label="Chờ khám" value="42" color="bg-orange-500" icon={<UserGroupIcon className="w-5 h-5 text-white"/>} />
           <StatWidget label="Nội trú" value="156" color="bg-blue-500" icon={<HospitalIcon className="w-5 h-5 text-white"/>} />
      </div>

      {/* 2. MODULE GRID (CATEGORIZED) */}
      <div className="space-y-8">
          {['clinical', 'paraclinical', 'finance', 'admin', 'support'].map((groupKey) => {
              const groupItems = groupedModules[groupKey];
              const config = GROUP_CONFIG[groupKey];
              
              if (!groupItems || groupItems.length === 0) return null;

              return (
                  <div key={groupKey} className="animate-fade-in-up">
                      <div className="flex items-center gap-3 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                          <div className={`p-1.5 rounded-lg ${config.bg} ${config.color}`}>
                              {config.icon}
                          </div>
                          <h2 className={`text-lg font-extrabold uppercase tracking-wide ${config.color}`}>
                             {config.label}
                          </h2>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                          {groupItems.map((item: NavItemType) => (
                              <Link
                                  key={item.name}
                                  to={item.path}
                                  className={`
                                    group relative flex flex-col items-start p-6 
                                    bg-white dark:bg-slate-800 rounded-2xl 
                                    shadow-sm hover:shadow-xl transition-all duration-300 
                                    border border-slate-100 dark:border-slate-700
                                    hover:-translate-y-1 hover:border-t-4
                                    ${config.border.replace('group-hover:', 'hover:')}
                                  `}
                              >
                                  {/* Hover Glow */}
                                  <div className={`absolute inset-0 rounded-2xl ${config.bg} opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none`}></div>

                                  {/* Icon */}
                                  <div className={`mb-4 p-3 rounded-xl ${config.bg} ${config.color} transition-transform group-hover:scale-110 duration-300 group-hover:rotate-3 shadow-sm`}>
                                    {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-7 h-7' })}
                                  </div>
                                  
                                  {/* Text */}
                                  <div className="w-full relative z-10">
                                      <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 mb-1 line-clamp-1 group-hover:text-black dark:group-hover:text-white transition-colors">
                                        {item.name}
                                      </h3>
                                      <div className="flex items-center justify-between mt-4 opacity-60 group-hover:opacity-100 transition-opacity">
                                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Truy cập</span>
                                          <ChevronRightIcon className={`w-4 h-4 ${config.color}`}/>
                                      </div>
                                  </div>
                              </Link>
                          ))}
                      </div>
                  </div>
              );
          })}
      </div>
      
    </div>
  );
};

export default Dashboard;
