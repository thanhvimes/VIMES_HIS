
import React, { useState, useRef, useEffect } from 'react';
import { MenuIcon, BellIcon, CheckCircleIcon, ExclamationCircleIcon, InfoIcon, UserGroupIcon, ChatBubbleIcon, MicrophoneIcon, MicrophoneOffIcon, LogoutIcon, HospitalIcon } from './Icons';
import ThemeSwitcher from './ThemeSwitcher';
import { useNotification } from '../contexts/NotificationContext';
import { useSystemStore } from '../stores/useSystemStore';
import { useSession } from '../contexts/SessionContext';
import { useVoiceInput } from '../contexts/VoiceInputContext';
import { useNavigate } from 'react-router-dom';
import Tooltip from './ui/Tooltip';
import UserProfileModal from './business/UserProfileModal';
import SystemSettingsModal from './business/SystemSettingsModal';
import ReAuthModal from './business/ReAuthModal';

interface HeaderProps {
    pageTitle?: string;
    onToggleSidebar: () => void;
    onLogout: () => void;
    showSidebarToggle?: boolean;
    showBranding?: boolean;
    isChatVisible?: boolean;
    onToggleChat?: () => void;
}

const AnnouncementSlider = () => {
    const slides = useSystemStore(state => state.slides);
    const activeSlides = slides.filter(s => s.active);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (activeSlides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [activeSlides.length]);

    if (activeSlides.length === 0) {
        return (
            <div className="relative w-full h-32 overflow-hidden rounded-lg mb-3 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <p className="text-slate-400 text-xs">Chưa có thông báo nào.</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-36 overflow-hidden rounded-xl mb-3 group shadow-sm bg-black">
            {activeSlides.map((item, index) => (
                <div key={item.id} className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
                    {item.type === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover brightness-75" autoPlay muted loop playsInline />
                    ) : (
                        <img src={item.url} alt={item.title} className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-700" />
                    )}
                    <div className="absolute bottom-0 left-0 w-full p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                            <p className="text-[10px] font-bold uppercase text-blue-300 tracking-wider">Tin tức & Sự kiện</p>
                        </div>
                        <h4 className="font-bold text-sm truncate drop-shadow-md">{item.title}</h4>
                        <p className="text-xs opacity-90 drop-shadow-sm line-clamp-2 whitespace-normal leading-tight">{item.desc}</p>
                    </div>
                </div>
            ))}
            {activeSlides.length > 1 && (
                <div className="absolute bottom-2 right-2 flex gap-1 z-20">
                    {activeSlides.map((_, idx) => (
                        <button key={idx} onClick={() => setCurrentIndex(idx)} className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-blue-500' : 'w-2 bg-white/40 hover:bg-white/80'}`}></button>
                    ))}
                </div>
            )}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ pageTitle, onToggleSidebar, onLogout, showSidebarToggle = true, showBranding = false, isChatVisible, onToggleChat }) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isNotifOpen, setNotifOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isReAuthOpen, setIsReAuthOpen] = useState(false);

    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotification();
    const { user } = useSession();
    const { isListening, toggleListening, hasSupport } = useVoiceInput();

    const notifRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const historyNotifications = notifications.filter(n => !n.autoClose);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) setNotifOpen(false);
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpenProfileRequested = () => {
        setDropdownOpen(false);
        setIsReAuthOpen(true);
    };

    const handleReAuthSuccess = () => {
        setIsReAuthOpen(false);
        setIsProfileOpen(true);
    };

    const handleNotifClick = (id: string, link?: string) => {
        markAsRead(id);
        if (link) { navigate(link); setNotifOpen(false); }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircleIcon className="w-5 h-5 text-emerald-500" />;
            case 'error': return <ExclamationCircleIcon className="w-5 h-5 text-rose-500" />;
            case 'warning': return <ExclamationCircleIcon className="w-5 h-5 text-amber-500" />;
            default: return <InfoIcon className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <header className="flex items-center justify-between h-14 px-4 sticky top-0 z-30 no-print transition-all duration-300 azure-header">
            <div className="flex items-center gap-4">
                {showSidebarToggle && (
                    <button onClick={onToggleSidebar} className="p-2 -ml-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white lg:hidden transition-colors">
                        <MenuIcon className="h-7 w-7" />
                    </button>
                )}
                {showBranding ? (
                    <div className="flex items-center gap-3 group cursor-pointer select-none" onClick={() => navigate('/staff-dashboard')} title="Về trang chủ">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shadow-lg group-hover:rotate-3 transition-transform border border-white/20">
                            <HospitalIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex flex-col justify-center">
                            <h1 className="text-lg font-extrabold text-white tracking-tight leading-none uppercase">BỆNH VIỆN K</h1>
                            <p className="text-[10px] font-bold text-blue-100 uppercase tracking-wider">HỆ THỐNG QUẢN LÝ PHÒNG KHÁM TOÀN DIỆN</p>
                        </div>
                    </div>
                ) : (
                    pageTitle && (
                        <div className="flex items-center animate-fade-in">
                            <h2 className="text-xl font-bold text-white tracking-tight">{pageTitle}</h2>
                        </div>
                    )
                )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
                {hasSupport && (
                    <Tooltip content={isListening ? "Đang ghi âm (Nhấn để tắt)" : "Nhập liệu giọng nói (Nhấn để bật)"}>
                        <button onClick={toggleListening} className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300 relative shadow-sm border ${isListening ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-400 shadow-[0_0_15px_rgba(244,63,94,0.6)] animate-pulse ring-2 ring-red-200 dark:ring-red-900 scale-110' : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:shadow-md'}`}>
                            {isListening ? (
                                <><span className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-ping"></span><MicrophoneIcon className="h-5 w-5 drop-shadow-md" /></>
                            ) : (
                                <MicrophoneOffIcon className="h-5 w-5" />
                            )}
                        </button>
                    </Tooltip>
                )}
                <Tooltip content={isChatVisible ? "Tắt cửa sổ Chat" : "Bật cửa sổ Chat"}>
                    <button onClick={onToggleChat} className={`p-2.5 rounded-full transition-all relative group ${isChatVisible ? 'bg-white/20 text-white ring-1 ring-white/30' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                        <ChatBubbleIcon className="h-5 w-5" />
                        {isChatVisible && <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-blue-600"></span>}
                    </button>
                </Tooltip>
                <div className="text-white/70 hover:text-white transition-colors"><ThemeSwitcher /></div>
                <div className="relative" ref={notifRef}>
                    <Tooltip content="Thông báo">
                        <button onClick={() => setNotifOpen(!isNotifOpen)} className={`p-2.5 rounded-full transition-all duration-200 relative ${isNotifOpen ? 'bg-white/20 text-white ring-1 ring-white/30' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
                            <BellIcon className={`h-5 w-5 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
                            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-blue-600 animate-pulse"></span>}
                        </button>
                    </Tooltip>
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden animate-fade-in-up origin-top-right">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                                <h3 className="font-bold text-slate-800 dark:text-white">Thông báo {unreadCount > 0 && <span className="text-rose-600 text-[10px] ml-1">{unreadCount}</span>}</h3>
                                <button onClick={markAllAsRead} className="text-xs text-blue-600 font-medium">Đọc hết</button>
                            </div>
                            <div className="max-h-[480px] overflow-y-auto p-2"><AnnouncementSlider />
                                {historyNotifications.map(note => (
                                    <div key={note.id} onClick={() => handleNotifClick(note.id, note.link)} className={`p-3 rounded-xl cursor-pointer flex gap-3 ${!note.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50'}`}>
                                        <div className="mt-1">{getIcon(note.type)}</div>
                                        <div><p className="text-sm font-bold truncate">{note.title}</p><p className="text-xs text-slate-500 line-clamp-2">{note.message}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center gap-3 p-1 pr-3 rounded-full hover:bg-white/10 transition-all border border-transparent">
                        <img className="h-8 w-8 rounded-full border border-white/40" src={user?.avatarUrl || "https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff"} alt="Avatar" />
                        <div className="hidden sm:block text-left text-white">
                            <p className="text-xs font-bold leading-none truncate max-w-[100px]">{user?.fullName || "Khách"}</p>
                            <p className="text-[10px] opacity-80 mt-1 uppercase truncate max-w-[100px]">{user?.departmentName || "Staff"}</p>
                        </div>
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden animate-fade-in-up">
                            <div className="p-1">
                                <button onClick={handleOpenProfileRequested} className="w-full flex items-center px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                                    <UserGroupIcon className="w-4 h-4 mr-3 text-slate-400" /> Tài khoản
                                </button>
                                <button onClick={() => { onLogout(); setDropdownOpen(false); }} className="w-full flex items-center px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg border-t border-slate-100">
                                    <LogoutIcon className="h-4 w-4 mr-3" /> Đăng xuất
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            <SystemSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <ReAuthModal isOpen={isReAuthOpen} onClose={() => setIsReAuthOpen(false)} onSuccess={handleReAuthSuccess} />
        </header>
    );
};
export default Header;
