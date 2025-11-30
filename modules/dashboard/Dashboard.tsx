
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MODULE_ITEMS } from '../../constants/navigation';
import { ClipboardListIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/Icons';
import { useSession } from '../../contexts/SessionContext';
import { useSystem } from '../../contexts/SystemContext';

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Branding Section */}
      <div className="flex items-center gap-6">
        <ClipboardListIcon className="h-16 w-16 text-primary dark:text-dark-primary" />
        <div>
          <h1 className="text-4xl font-bold text-onSurface dark:text-dark-onSurface tracking-tight">
            {orgInfo.hospitalName}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
            {orgInfo.governingUnitName} - Hệ thống quản lý bệnh viện (HIS/EMR)
          </p>
        </div>
      </div>

      {/* 2. Dynamic Announcement Slider */}
      {activeSlides.length > 0 ? (
          <div className="relative w-full h-72 md:h-96 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-700 group">
            {/* Slides */}
            {activeSlides.map((slide, index) => (
              <div 
                key={slide.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out transform ${
                  index === currentSlideIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
              >
                 {slide.type === 'video' ? (
                    <div className="w-full h-full relative bg-black">
                        <video 
                            src={slide.url} 
                            className="w-full h-full object-cover opacity-90" 
                            autoPlay 
                            muted 
                            loop 
                            playsInline
                        />
                        {/* Video Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
                    </div>
                 ) : (
                    <div 
                        className="w-full h-full bg-cover bg-center transform transition-transform duration-[10000ms]"
                        style={{ backgroundImage: `url('${slide.url}')` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent"></div>
                    </div>
                 )}

                 {/* Content Content */}
                 <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-16 text-white max-w-2xl z-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-blue-600/80 text-blue-100 text-xs font-bold uppercase tracking-widest mb-4 w-fit backdrop-blur-sm border border-blue-400/30">
                        {slide.type === 'video' ? 'Video nổi bật' : 'Tin tức & Sự kiện'}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight drop-shadow-lg mb-4 animate-fade-in-up">
                        {slide.title}
                    </h2>
                    <p className="text-lg md:text-xl text-slate-200 leading-relaxed drop-shadow-md mb-8 line-clamp-3 opacity-90">
                        {slide.desc}
                    </p>
                    <div>
                        <button className="px-8 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-full backdrop-blur-md border border-white/30 transition-all hover:scale-105 hover:shadow-lg shadow-black/20">
                            Xem chi tiết
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
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm border border-white/10 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 z-20"
                    >
                        <ChevronLeftIcon className="w-6 h-6"/>
                    </button>
                    <button 
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 hover:bg-black/50 text-white rounded-full backdrop-blur-sm border border-white/10 transition-all opacity-0 group-hover:opacity-100 hover:scale-110 z-20"
                    >
                        <ChevronRightIcon className="w-6 h-6"/>
                    </button>

                    {/* Indicators */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {activeSlides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentSlideIndex(idx)}
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                    idx === currentSlideIndex ? 'w-10 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'w-3 bg-white/40 hover:bg-white/70'
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
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-5 flex items-center gap-3">
           <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span> Chọn chức năng để bắt đầu
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {MODULE_ITEMS.map(item => (
            <Link
              key={item.name}
              to={item.path}
              className="group flex flex-col items-center justify-center p-6 bg-surface dark:bg-dark-surface rounded-2xl shadow-lg text-center hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-200/50 dark:border-slate-700 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative z-10 flex items-center justify-center h-20 w-20 mb-4 rounded-2xl bg-slate-50 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700 shadow-inner group-hover:shadow-lg transition-all duration-300">
                <div className="text-primary dark:text-dark-primary h-12 w-12 group-hover:scale-110 transition-transform duration-300">
                  {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-12 h-12' })}
                </div>
              </div>
              <span className="relative z-10 font-bold text-lg text-slate-700 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-dark-primary transition-colors">
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
