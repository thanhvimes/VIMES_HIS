
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MODULE_ITEMS } from '../../../constants/navigation';
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, HospitalIcon } from '../../components/Icons';
import { useSession } from '../../contexts/SessionContext';
import { useSystem } from '../../../contexts/SystemContext';

const Dashboard: React.FC = () => {
  const { orgInfo } = useSession();
  const { slides } = useSystem();
  const activeSlides = slides.filter(s => s.active);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Auto-rotate slides
  useEffect(() => {
    if (activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % activeSlides.length);
    }, 8000); // 8 seconds per slide
    return () => clearInterval(interval);
  }, [activeSlides.length]);

  const nextSlide = () => setCurrentSlideIndex((prev) => (prev + 1) % activeSlides.length);
  const prevSlide = () => setCurrentSlideIndex((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);

  const handleViewDetail = (url: string) => {
      if (url && (url.startsWith('http') || url.startsWith('https'))) {
          window.open(url, '_blank');
      } else {
          // Fallback or handle internal links
          console.log("Opening slide link:", url);
      }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Branding Section (Hospital Info) */}
      <div className="flex items-center gap-5 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
        {/* Logo Box */}
        <div className="w-20 h-20 md:w-24 md:h-24 flex-shrink-0 bg-slate-50 dark:bg-slate-900 rounded-xl p-2 border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-inner">
            {orgInfo.logoUrl ? (
                <img 
                    src={orgInfo.logoUrl} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                />
            ) : (
                <HospitalIcon className="w-12 h-12 text-slate-400"/>
            )}
        </div>
        
        <div className="flex flex-col justify-center">
          <h1 className="text-2xl md:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight uppercase leading-tight">
            {orgInfo.hospitalName}
          </h1>
          <p className="text-slate-500 dark:text-slate-300 text-base md:text-lg font-medium mt-1">
            {orgInfo.governingUnitName}
          </p>
        </div>
      </div>

      {/* 2. Dynamic Announcement Slider */}
      {activeSlides.length > 0 ? (
          <div className="relative w-full h-72 md:h-[380px] rounded-3xl overflow-hidden shadow-xl border border-slate-200/50 dark:border-slate-700 group bg-slate-900">
            {/* Slides */}
            {activeSlides.map((slide, index) => (
              <div 
                key={slide.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                  index === currentSlideIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                 {slide.type === 'video' ? (
                    <div className="w-full h-full relative bg-black">
                        <video 
                            src={slide.url} 
                            className="w-full h-full object-cover opacity-80" 
                            autoPlay 
                            muted 
                            loop 
                            playsInline
                        />
                        {/* Video Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-transparent"></div>
                    </div>
                 ) : (
                    <div 
                        className="w-full h-full bg-cover bg-center transform transition-transform duration-[20000ms] scale-105 hover:scale-100"
                        style={{ backgroundImage: `url('${slide.url}')` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/40 to-transparent"></div>
                    </div>
                 )}

                 {/* Content Content - Optimized Sizes for better visibility */}
                 <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-16 text-white w-full md:max-w-4xl z-20">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block py-1 px-3 rounded-full bg-blue-600/90 text-white text-[10px] md:text-xs font-bold uppercase tracking-widest border border-blue-400/30 shadow-sm">
                            {slide.type === 'video' ? 'Video Nổi bật' : 'Tin tức & Sự kiện'}
                        </span>
                    </div>
                    
                    {/* Reduced Title Size for better balance and to prevent truncation */}
                    <h2 className="text-xl md:text-3xl font-bold tracking-tight leading-tight drop-shadow-lg mb-3 animate-fade-in-up line-clamp-2 text-white/95 max-w-2xl">
                        {slide.title}
                    </h2>
                    
                    {/* Description with better spacing and smaller font */}
                    <p className="text-sm md:text-base text-slate-300 leading-relaxed drop-shadow-md mb-6 opacity-95 whitespace-normal line-clamp-3 max-w-xl font-medium">
                        {slide.desc}
                    </p>
                    
                    <div>
                        <button 
                            onClick={() => handleViewDetail(slide.url)}
                            className="group flex items-center gap-2 px-6 py-2.5 bg-white text-slate-900 hover:bg-blue-50 font-bold rounded-full backdrop-blur-md border border-white/30 transition-all hover:scale-105 hover:shadow-lg shadow-black/20 text-sm"
                        >
                            Xem chi tiết
                            <ExternalLinkIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-600"/>
                        </button>
                    </div>
                 </div>
              </div>
            ))}

            {/* Navigation Controls */}
            {activeSlides.length > 1 && (
                <>
                    <button 
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-sm border border-white/10 transition-all opacity-0 group-hover:opacity-100 z-20"
                    >
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                    <button 
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 hover:bg-black/50 text-white rounded-full backdrop-blur-sm border border-white/10 transition-all opacity-0 group-hover:opacity-100 z-20"
                    >
                        <ChevronRightIcon className="w-6 h-6"/>
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-6 left-8 flex gap-2 z-20">
                        {activeSlides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlideIndex(idx)}
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                    idx === currentSlideIndex ? 'w-8 bg-blue-500' : 'w-2 bg-white/30 hover:bg-white/60'
                                }`}
                            />
                        ))}
                    </div>
                </>
            )}
          </div>
      ) : (
          <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700">
              <div className="text-center text-slate-400">
                  <p className="text-lg font-bold">Chưa có Slide nào.</p>
                  <p className="text-sm">Vui lòng thêm trong Cấu hình hệ thống.</p>
              </div>
          </div>
      )}

      {/* 3. Module List */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-3">
           <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span> Chức năng nghiệp vụ
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {MODULE_ITEMS.map(item => (
            <Link
              key={item.name}
              to={item.path}
              className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-200/60 dark:border-slate-700 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10 flex items-center justify-center h-16 w-16 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-700/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 shadow-inner transition-colors duration-300">
                <div className="text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 transform group-hover:scale-110">
                  {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-10 h-10' })}
                </div>
              </div>
              <span className="relative z-10 font-bold text-sm text-slate-600 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors text-center">
                {item.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
