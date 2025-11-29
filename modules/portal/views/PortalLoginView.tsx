
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCodeIcon } from '../icons';

const PortalLoginView: React.FC = () => {
    const navigate = useNavigate();
    const [patientId, setPatientId] = useState('P003');
    const [phone, setPhone] = useState('0905123456');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Mock Login Logic
        if (patientId && phone) {
            navigate('/portal/home');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side: Branding (Desktop Only) */}
            <div className="hidden md:flex w-1/2 bg-gradient-to-br from-teal-600 to-blue-700 items-center justify-center text-white p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="relative z-10 max-w-lg">
                     <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2h2m-2-4h2m-7 4h2m-2-4h2m-2-4h2m-2-4h2" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold mb-4">Chào mừng đến với VIMES</h1>
                    <p className="text-lg text-teal-100 leading-relaxed">
                        Cổng thông tin điện tử giúp bạn quản lý hồ sơ sức khỏe, đặt lịch khám và thanh toán viện phí một cách dễ dàng, mọi lúc mọi nơi.
                    </p>
                    <div className="mt-8 flex gap-4">
                        <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20">
                            <h3 className="font-bold text-xl">15k+</h3>
                            <p className="text-sm opacity-80">Bệnh nhân tin dùng</p>
                        </div>
                        <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/20">
                            <h3 className="font-bold text-xl">24/7</h3>
                            <p className="text-sm opacity-80">Hỗ trợ trực tuyến</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side: Login Form */}
            <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-6 md:p-12 relative">
                <div className="w-full max-w-sm">
                    <div className="text-center md:text-left mb-8">
                        <div className="md:hidden w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2h2m-2-4h2m-7 4h2m-2-4h2m-2-4h2m-2-4h2" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">Đăng nhập tài khoản</h1>
                        <p className="text-slate-500 text-sm mt-2">Nhập thông tin hồ sơ để truy cập.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mã Bệnh nhân / Số BHYT</label>
                            <input 
                                type="text" 
                                value={patientId}
                                onChange={e => setPatientId(e.target.value)}
                                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none text-slate-800 font-bold bg-slate-50 focus:bg-white transition-colors"
                                placeholder="Ví dụ: P123456"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số điện thoại đăng ký</label>
                            <input 
                                type="tel" 
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-teal-500 outline-none text-slate-800 bg-slate-50 focus:bg-white transition-colors"
                                placeholder="09xx xxx xxx"
                            />
                        </div>
                        
                        <button type="submit" className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2">
                            Truy cập ngay <span className="text-teal-200">→</span>
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <div className="relative mb-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-white text-slate-400">Hoặc đăng nhập bằng</span>
                            </div>
                        </div>
                        <button className="flex items-center justify-center w-full py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 gap-2 transition-colors">
                            <QrCodeIcon className="w-5 h-5"/> Quét mã QR trên hồ sơ
                        </button>
                    </div>
                </div>
                
                <p className="absolute bottom-6 text-slate-400 text-xs">© 2023 VIMES Hospital. All rights reserved.</p>
            </div>
        </div>
    );
};

export default PortalLoginView;
