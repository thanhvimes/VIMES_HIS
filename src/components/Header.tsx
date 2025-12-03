
import React, { useState, useRef, useEffect } from 'react';
import { MenuIcon, BellIcon, LogoutIcon, CheckCircleIcon, ExclamationCircleIcon, InfoIcon, CogIcon, UserGroupIcon, ChatBubbleIcon, MicrophoneIcon, MicrophoneOffIcon, CubeIcon } from './Icons';
import ThemeSwitcher from './ThemeSwitcher';
import { useNotification } from '../contexts/NotificationContext';
import { useSystem } from '../contexts/SystemContext';
import { useSession } from '../contexts/SessionContext';
import { useVoiceInput } from '../contexts/VoiceInputContext';
import { useNavigate } from 'react-router-dom';
import Tooltip from './shared/Tooltip';
import UserProfileModal from './shared/UserProfileModal';
import SystemSettingsModal from './shared/SystemSettingsModal';

interface HeaderProps {
    pageTitle?: string;
    onToggleSidebar: () => void;
    onLogout: () => void;
    showSidebarToggle?: boolean;
    showBranding?: boolean;
    isChatVisible?: boolean;
    onToggleChat?: () => void;
}

// --- DYNAMIC ANNOUNCEMENT SLIDER COMPONENT ---
const AnnouncementSlider = () => {
    const { slides } = useSystem();
    const activeSlides = slides.filter(s => s.active);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (activeSlides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % activeSlides.length);
        }, 6000); // Auto slide every 6s
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
                <div 
                    key={item.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    {item.type === 'video' ? (
                        <video 
                            src={item.url} 
                            className="w-full h-full object-cover brightness-75" 
                            autoPlay 
                            muted 
                            loop 
                            playsInline
                        />
                    ) : (
                        <img 
                            src={item.url} 
                            alt={item.title} 
                            className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-700" 
                        />
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
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`h-1 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-6 bg-blue-500' : 'w-2 bg-white/40 hover:bg-white/80'}`}
                        ></button>
                    ))}
                </div>
            )}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ 
    pageTitle, 
    onToggleSidebar, 
    onLogout, 
    showSidebarToggle = true, 
    showBranding = false,
    isChatVisible,
    onToggleChat
}) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isNotifOpen, setNotifOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotification();
    const { user, orgInfo } = useSession(); 
    const { isListening, toggleListening, hasSupport } = useVoiceInput();
    
    const notifRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const historyNotifications = notifications.filter(n => !n.autoClose);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setNotifOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotifClick = (id: string, link?: string) => {
        markAsRead(id);
        if (link) {
            navigate(link);
            setNotifOpen(false);
        }
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
        <header className="flex items-center justify-between h-[72px] px-4 sticky top-0 z-30 no-print transition-all duration-300
            bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/80 shadow-sm"
        >
            {/* --- Left Side: Title, Toggle & BRANDING --- */}
            <div className="flex items-center gap-4">
                {showSidebarToggle && (
                    <button 
                        onClick={onToggleSidebar} 
                        className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-dark-primary lg:hidden transition-colors"
                    >
                        <MenuIcon className="h-7 w-7" />
                    </button>
                )}
                
                {/* --- SYSTEM BRANDING (On Dashboard) OR PAGE TITLE --- */}
                {showBranding ? (
                    <div 
                        className="flex items-center gap-3 group cursor-pointer select-none" 
                        onClick={() => navigate('/staff-dashboard')}
                        title="Về trang chủ"
                    >
                       <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:rotate-3 transition-transform">
                            <CubeIcon className="w-6 h-6 text-white" />
                       </div>
                       <div className="flex flex-col justify-center">                          
                            <h1 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight leading-none">
                                VIMES - Hệ thống quản lý tổng thể
                            </h1>
                            <p className="text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Giải pháp Bệnh viện thông minh</p>
                       </div>
                    </div>
                ) : (
                    pageTitle && (
                        <div className="flex items-center animate-fade-in">
                            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 tracking-tight">
                                {pageTitle}
                            </h2>
                        </div>
                    )
                )}
            </div>

            {/* --- Right Side: Actions & Profile --- */}
            <div className="flex items-center space-x-2 sm:space-x-4">
                
                {/* Voice to Text Toggle */}
                {hasSupport && (
                    <Tooltip content={isListening ? "Tắt nhận dạng giọng nói" : "Bật nhận dạng giọng nói"}>
                        <button 
                            onClick={toggleListening}
                            className={`p-2.5 rounded-full transition-all relative group ${
                                isListening 
                                ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse ring-1 ring-red-200' 
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            {isListening ? (
                                <MicrophoneIcon className="h-5 w-5" />
                            ) : (
                                <MicrophoneOffIcon className="h-5 w-5" />
                            )}
                        </button>
                    </Tooltip>
                )}

                {/* Chat Widget Toggle */}
                <Tooltip content={isChatVisible ? "Tắt cửa sổ Chat" : "Bật cửa sổ Chat"}>
                    <button 
                        onClick={onToggleChat}
                        className={`p-2.5 rounded-full transition-all relative group ${
                            isChatVisible
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-blue-200'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                        }`}
                    >
                        <ChatBubbleIcon className="h-5 w-5" />
                        {isChatVisible && (
                            <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-slate-900"></span>
                        )}
                    </button>
                </Tooltip>

                <Tooltip content="Đổi giao diện">
                    <div className="relative">
                        <ThemeSwitcher />
                    </div>
                </Tooltip>

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                    <Tooltip content="Thông báo">
                        <button 
                            onClick={() => setNotifOpen(!isNotifOpen)}
                            className={`p-2.5 rounded-full transition-all duration-200 relative 
                                ${isNotifOpen 
                                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 ring-1 ring-blue-200' 
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                                }`
                            }
                        >
                            <BellIcon className={`h-5 w-5 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                            )}
                        </button>
                    </Tooltip>

                    {/* Notification Dropdown */}
                    {isNotifOpen && (
                        <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-50 overflow-hidden animate-fade-in-up origin-top-right">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    Thông báo
                                    {unreadCount > 0 && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[10px] rounded-full">{unreadCount} mới</span>}
                                </h3>
                                <div className="flex gap-3 text-xs font-medium">
                                    <button onClick={markAllAsRead} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline">Đọc tất cả</button>
                                    <button onClick={clearAll} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:underline">Xóa</button>
                                </div>
                            </div>
                            <div className="max-h-[480px] overflow-y-auto custom-scrollbar p-2">
                                <AnnouncementSlider />
                                <div className="space-y-1">
                                    {historyNotifications.length === 0 ? (
                                        <div className="p-8 text-center flex flex-col items-center text-slate-400">
                                            <BellIcon className="w-10 h-10 mb-2 opacity-20"/>
                                            <span className="text-sm">Không có thông báo nào.</span>
                                        </div>
                                    ) : (
                                        historyNotifications.map(note => (
                                            <div 
                                                key={note.id}
                                                onClick={() => handleNotifClick(note.id, note.link)}
                                                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 flex gap-3 group relative overflow-hidden
                                                    ${!note.isRead 
                                                        ? 'bg-blue-50/80 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30' 
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                                    }`
                                                }
                                            >
                                                {!note.isRead && <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full"></div>}
                                                <div className={`mt-1 p-1.5 rounded-full bg-white dark:bg-slate-700 shadow-sm h-fit ${!note.isRead ? 'ml-2' : ''}`}>
                                                    {getIcon(note.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <p className={`text-sm font-bold truncate pr-2 ${!note.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                            {note.title}
                                                        </p>
                                                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{new Date(note.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{note.message}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-center">
                                <button className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline py-1">
                                    Xem tất cả hoạt động
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Profile Dropdown */}
                <div className="relative" ref={userMenuRef}>
                    <button 
                        onClick={() => setDropdownOpen(!isDropdownOpen)} 
                        className={`flex items-center gap-2 sm:gap-3 p-1 pr-3 rounded-full transition-all border 
                            ${isDropdownOpen 
                                ? 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-600' 
                                : 'border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                            }`
                        }
                    >
                        <div className="relative">
                            <img 
                                className="h-9 w-9 rounded-full border-2 border-white dark:border-slate-700 shadow-sm object-cover" 
                                src={user?.avatarUrl || "https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff"} 
                                alt="Avatar" 
                            />
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800"></span>
                        </div>
                        <div className="hidden sm:block text-left">
                           <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-none truncate max-w-[120px]">{user?.fullName || "Khách"}</p>
                           <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wide truncate max-w-[120px]">{user?.departmentName || "Chưa phân khoa"}</p>
                        </div>
                    </button>

                    {/* User Dropdown Menu */}
                    {isDropdownOpen && (
                        <div 
                          className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-50 overflow-hidden animate-fade-in-up origin-top-right"
                        >
                           <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                               <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.fullName}</p>
                               <p className="text-xs text-slate-500 truncate">{user?.title} - {user?.departmentName}</p>
                           </div>
                           
                           <div className="p-1">
                               <button 
                                    onClick={() => { setDropdownOpen(false); setIsProfileOpen(true); }}
                                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors group text-left"
                                >
                                   <UserGroupIcon className="w-4 h-4 mr-3 text-slate-400 group-hover:text-blue-500"/> Hồ sơ cá nhân
                               </button>
                               <button 
                                    onClick={() => { setDropdownOpen(false); setIsSettingsOpen(true); }}
                                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors group text-left"
                                >
                                   <CogIcon className="w-4 h-4 mr-3 text-slate-400 group-hover:text-blue-500"/> Cài đặt hệ thống
                               </button>
                           </div>
                           
                           <div className="p-1 border-t border-slate-100 dark:border-slate-700">
                               <button 
                                 onClick={() => {
                                     onLogout();
                                     setDropdownOpen(false);
                                 }}
                                 className="w-full flex items-center px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                               >
                                <LogoutIcon className="h-4 w-4 mr-3"/>
                                 Đăng xuất
                               </button>
                           </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Modals --- */}
            <UserProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
            <SystemSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </header>
    );
};

export default Header;
