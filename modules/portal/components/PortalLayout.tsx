
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, LogoutIcon } from '../../../components/Icons';
import { UserCircleIcon, CalendarPlusIcon, FileMedicalIcon, ReceiptTaxIcon } from '../icons';

const PortalLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isHome = location.pathname === '/portal/home';

    const navItems = [
        { path: '/portal/home', icon: HomeIcon, label: 'Trang chủ' },
        { path: '/portal/booking', icon: CalendarPlusIcon, label: 'Đặt lịch' },
        { path: '/portal/records', icon: FileMedicalIcon, label: 'Hồ sơ' },
        { path: '/portal/finance', icon: ReceiptTaxIcon, label: 'Viện phí' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative">
            {/* --- DESKTOP HEADER (Web) --- */}
            <header className="hidden md:flex bg-teal-700 text-white px-8 py-4 justify-between items-center shadow-md sticky top-0 z-30">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/portal/home')}>
                        <div className="bg-white p-1.5 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m8-2h2m-2-4h2m-7 4h2m-2-4h2m-2-4h2m-2-4h2" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-bold text-xl leading-none">VIMES PORTAL</h1>
                            <p className="text-xs text-teal-200 opacity-80">Cổng thông tin bệnh nhân</p>
                        </div>
                    </div>

                    {/* Desktop Nav Items */}
                    <nav className="flex gap-1">
                        {navItems.map(item => {
                            const isActive = location.pathname === item.path;
                            return (
                                <button 
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium text-sm ${isActive ? 'bg-teal-800 text-white shadow-inner' : 'text-teal-100 hover:bg-teal-600 hover:text-white'}`}
                                >
                                    <item.icon className="w-5 h-5"/>
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden lg:block">
                        <p className="text-sm font-bold">LÊ HOÀNG CƯỜNG</p>
                        <p className="text-xs text-teal-200">BN: 251050296</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-teal-800 flex items-center justify-center border-2 border-teal-500">
                         <UserCircleIcon className="w-6 h-6 text-white"/>
                    </div>
                    <button 
                        onClick={() => navigate('/portal/login')}
                        className="p-2 hover:bg-teal-600 rounded-full transition-colors"
                        title="Đăng xuất"
                    >
                        <LogoutIcon className="w-5 h-5"/>
                    </button>
                </div>
            </header>

            {/* --- MOBILE HEADER --- */}
            <header className={`md:hidden px-4 py-3 flex items-center justify-between ${isHome ? 'bg-teal-600 text-white' : 'bg-white text-slate-800 border-b border-slate-200'} transition-colors sticky top-0 z-20 shadow-sm`}>
                {isHome ? (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                             <UserCircleIcon className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                            <p className="text-xs opacity-80">Xin chào,</p>
                            <p className="font-bold text-sm">LÊ HOÀNG CƯỜNG</p>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                )}
                
                <button onClick={() => navigate('/portal/login')} className={`p-2 rounded-full ${isHome ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
                    <LogoutIcon className="w-6 h-6"/>
                </button>
            </header>

            {/* --- MAIN CONTENT --- */}
            {/* max-w-md for mobile-like feel is removed on desktop breakpoints */}
            <main className="flex-1 overflow-y-auto pb-20 md:pb-0 w-full max-w-md md:max-w-7xl mx-auto md:p-6">
                <Outlet />
            </main>

            {/* --- MOBILE BOTTOM NAV --- */}
            <nav className="md:hidden bg-white border-t border-slate-200 fixed bottom-0 w-full z-20 pb-safe flex justify-around py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {navItems.map(item => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button 
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center p-1 w-16 transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <item.icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`}/>
                            <span className="text-[10px] font-bold mt-1">{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};

export default PortalLayout;
