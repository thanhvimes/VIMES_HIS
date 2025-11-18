import React from 'react';
import { Link } from 'react-router-dom';
import { MODULE_ITEMS } from '../../constants/navigation';
import { ClipboardListIcon } from '../../components/Icons';

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Branding Section */}
      <div className="flex items-center gap-6">
        <ClipboardListIcon className="h-16 w-16 text-primary dark:text-dark-primary" />
        <div>
          <h1 className="text-4xl font-bold text-onSurface dark:text-dark-onSurface tracking-tight">
            Clinic Management System
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-lg">
            Hệ thống quản lý phòng khám chuyên nghiệp
          </p>
        </div>
      </div>

      {/* 2. Announcement/Slideshow Banner */}
      <div className="relative w-full h-64 rounded-2xl overflow-hidden shadow-xl border border-slate-200/50 dark:border-slate-700">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://picsum.photos/seed/healthtech/1200/400')",
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30"></div>
        <div className="relative z-10 h-full flex flex-col justify-center p-8 md:p-12 text-white">
          <h2 className="text-3xl font-bold tracking-tight">Chào mừng đến với ClinicMS</h2>
          <p className="mt-2 max-w-lg text-slate-200">
            Thông báo: Hệ thống sẽ được bảo trì vào lúc 23:00 tối Chủ Nhật.
            Vui lòng lưu lại công việc trước thời gian này.
          </p>
          <div className="mt-6">
            <button className="px-5 py-2.5 text-sm font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-colors">
              Xem chi tiết
            </button>
          </div>
        </div>
      </div>

      {/* 3. Module List */}
      <div>
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-5">
          Chọn chức năng để bắt đầu
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {MODULE_ITEMS.map(item => (
            <Link
              key={item.name}
              to={item.path}
              className="group flex flex-col items-center justify-center p-6 bg-surface dark:bg-dark-surface rounded-2xl shadow-lg text-center hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 border border-slate-200/50 dark:border-slate-700"
            >
              <div className="flex items-center justify-center h-20 w-20 mb-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                <div className="text-primary dark:text-dark-primary h-12 w-12">
                  {React.cloneElement(item.icon, { className: 'w-12 h-12' })}
                </div>
              </div>
              <span className="font-bold text-lg text-slate-700 dark:text-slate-200">
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
