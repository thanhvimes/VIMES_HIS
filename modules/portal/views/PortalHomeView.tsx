
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarPlusIcon, FileMedicalIcon, ReceiptTaxIcon, ChevronRightIcon, QrCodeIcon } from '../icons';

const PortalHomeView: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="p-4 space-y-6">
            {/* Desktop Banner */}
            <div className="hidden md:block bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden mb-6">
                 <div className="absolute right-0 top-0 h-full w-1/3 bg-white/10 transform skew-x-12 translate-x-10"></div>
                 <div className="relative z-10">
                     <h2 className="text-3xl font-bold mb-2">Xin chào, Lê Hoàng Cường!</h2>
                     <p className="opacity-90 text-lg max-w-xl">Chúc bạn một ngày tốt lành. Đừng quên lịch tái khám vào ngày 20/11 nhé.</p>
                 </div>
            </div>

            {/* Quick Actions - Responsive Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button 
                    onClick={() => navigate('/portal/booking')}
                    className="p-4 bg-white md:bg-teal-50 hover:bg-teal-100 border border-teal-100 md:border-transparent text-slate-800 rounded-2xl shadow-sm md:shadow-none flex flex-col items-center justify-center gap-3 active:scale-95 transition-all group h-32 md:h-40"
                >
                    <div className="bg-teal-100 md:bg-white p-3 rounded-full group-hover:scale-110 transition-transform">
                        <CalendarPlusIcon className="w-8 h-8 text-teal-600"/>
                    </div>
                    <span className="font-bold text-sm md:text-base">Đặt lịch khám</span>
                </button>
                
                <button 
                    onClick={() => navigate('/portal/records')}
                    className="p-4 bg-white hover:bg-blue-50 border border-slate-100 md:border-transparent text-slate-800 rounded-2xl shadow-sm md:shadow-none flex flex-col items-center justify-center gap-3 active:scale-95 transition-all group h-32 md:h-40"
                >
                    <div className="bg-blue-50 md:bg-blue-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                        <FileMedicalIcon className="w-8 h-8 text-blue-600"/>
                    </div>
                    <span className="font-bold text-sm md:text-base">Hồ sơ sức khỏe</span>
                </button>
                
                <button 
                    onClick={() => navigate('/portal/finance')}
                    className="p-4 bg-white hover:bg-orange-50 border border-slate-100 md:border-transparent text-slate-800 rounded-2xl shadow-sm md:shadow-none flex flex-col items-center justify-center gap-3 active:scale-95 transition-all group h-32 md:h-40"
                >
                    <div className="bg-orange-50 md:bg-orange-100 p-3 rounded-full group-hover:scale-110 transition-transform">
                        <ReceiptTaxIcon className="w-8 h-8 text-orange-600"/>
                    </div>
                    <span className="font-bold text-sm md:text-base">Thanh toán VP</span>
                </button>
                
                <div className="p-4 bg-slate-800 text-white rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 h-32 md:h-40 cursor-pointer hover:bg-slate-900 transition-colors">
                    <QrCodeIcon className="w-12 h-12"/>
                    <span className="font-bold text-sm">Mã check-in</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Appointment Card - Spans 2 cols on desktop */}
                <div className="md:col-span-2">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-slate-800 text-lg">Lịch khám sắp tới</h3>
                        <span className="text-xs text-teal-600 font-bold cursor-pointer hover:underline">Xem tất cả</span>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group hover:border-teal-200 transition-colors">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500 group-hover:bg-teal-500 transition-colors"></div>
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-orange-500 group-hover:text-teal-600 uppercase mb-1 transition-colors">Tái khám</p>
                                <h4 className="font-bold text-slate-800 text-xl">Khám Nội tổng quát</h4>
                                <p className="text-sm text-slate-500 mt-1">BS. Nguyễn Văn A • Phòng 301</p>
                            </div>
                            <div className="text-right bg-slate-50 p-3 rounded-lg group-hover:bg-teal-50 transition-colors">
                                <div className="text-2xl font-bold text-slate-800 group-hover:text-teal-700">20</div>
                                <div className="text-xs font-bold text-slate-500 uppercase">Tháng 11</div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                09:30 Sáng
                            </div>
                            <span className="text-teal-600 font-bold text-xs bg-teal-50 px-3 py-1 rounded-full">Đã xác nhận</span>
                        </div>
                    </div>
                </div>

                {/* Health Tips - Side col on desktop */}
                <div className="pb-6 md:pb-0">
                    <h3 className="font-bold text-slate-800 text-lg mb-3">Sống khỏe mỗi ngày</h3>
                    <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 flex gap-3 hover:shadow-md transition-shadow cursor-pointer">
                            <img src="https://picsum.photos/seed/health1/100/100" className="w-16 h-16 rounded-lg object-cover bg-slate-200" alt=""/>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-slate-800 line-clamp-2">5 thói quen tốt cho người bệnh tiểu đường</h4>
                                <p className="text-xs text-slate-500 mt-1">Dinh dưỡng • 5 phút đọc</p>
                            </div>
                        </div>
                         <div className="hidden md:flex bg-white p-3 rounded-xl shadow-sm border border-slate-100 gap-3 hover:shadow-md transition-shadow cursor-pointer">
                            <img src="https://picsum.photos/seed/health2/100/100" className="w-16 h-16 rounded-lg object-cover bg-slate-200" alt=""/>
                            <div className="flex-1">
                                <h4 className="font-bold text-sm text-slate-800 line-clamp-2">Lịch tiêm chủng mùa đông cho trẻ</h4>
                                <p className="text-xs text-slate-500 mt-1">Y tế dự phòng • 3 phút đọc</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortalHomeView;
