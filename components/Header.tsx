
import React, { useState, useRef, useEffect } from 'react';
import { MenuIcon, BellIcon, LogoutIcon, ClipboardListIcon, CheckCircleIcon, ExclamationCircleIcon, InfoIcon } from './Icons';
import ThemeSwitcher from './ThemeSwitcher';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
    pageTitle?: string;
    onToggleSidebar: () => void;
    onLogout: () => void;
    showSidebarToggle?: boolean;
    showBranding?: boolean;
}

const Header: React.FC<HeaderProps> = ({ pageTitle, onToggleSidebar, onLogout, showSidebarToggle = true, showBranding = false }) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isNotifOpen, setNotifOpen] = useState(false);
    const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotification();
    const notifRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Filter out autoClose notifications (toasts) from the dropdown history list
    const historyNotifications = notifications.filter(n => !n.autoClose);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setNotifOpen(false);
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
            case 'success': return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'error': return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
            case 'warning': return <ExclamationCircleIcon className="w-5 h-5 text-orange-500" />;
            default: return <InfoIcon className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <header className="flex items-center justify-between h-[65px] bg-surface dark:bg-dark-surface border-b border-slate-200 dark:border-slate-700 px-4 sm:px-6 lg:px-8 sticky top-0 z-20 no-print">
            {/* Left side */}
            <div className="flex items-center">
                {showSidebarToggle && (
                    <button onClick={onToggleSidebar} className="text-slate-500 hover:text-primary dark:hover:text-dark-primary lg:hidden mr-4">
                        <MenuIcon className="h-6 w-6" />
                    </button>
                )}
                {showBranding ? (
                    <div className="flex items-center">
                       <ClipboardListIcon className="h-8 w-8 text-primary dark:text-dark-primary" />
                       <span className="ml-2 text-xl font-bold text-onSurface dark:text-dark-onSurface">ClinicMS Dashboard</span>
                    </div>
                ) : (
                    <h1 className="text-xl sm:text-2xl font-bold text-onSurface dark:text-dark-onSurface">{pageTitle}</h1>
                )}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-2 sm:space-x-4">
                <ThemeSwitcher />

                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                    <button 
                        onClick={() => setNotifOpen(!isNotifOpen)}
                        className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-dark-primary relative"
                    >
                        <BellIcon className="h-6 w-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-800">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {isNotifOpen && (
                        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-lg shadow-xl z-50 border border-slate-200 dark:border-slate-700 overflow-hidden animate-fade-in-up origin-top-right">
                            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                                <h3 className="font-bold text-slate-800 dark:text-white">Thông báo</h3>
                                <div className="flex gap-2 text-xs">
                                    <button onClick={markAllAsRead} className="text-blue-600 hover:text-blue-700 dark:text-blue-400">Đọc tất cả</button>
                                    <span className="text-slate-300">|</span>
                                    <button onClick={clearAll} className="text-slate-500 hover:text-slate-700 dark:text-slate-400">Xóa hết</button>
                                </div>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {historyNotifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                                        Không có thông báo nào.
                                    </div>
                                ) : (
                                    historyNotifications.map(note => (
                                        <div 
                                            key={note.id}
                                            onClick={() => handleNotifClick(note.id, note.link)}
                                            className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex gap-3 ${!note.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                        >
                                            <div className="flex-shrink-0 mt-1">{getIcon(note.type)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className={`text-sm font-bold truncate ${!note.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                        {note.title}
                                                    </p>
                                                    {!note.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>}
                                                </div>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{note.message}</p>
                                                <p className="text-[10px] text-slate-400 mt-1">{note.timestamp.toLocaleTimeString()} - {note.timestamp.toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Dropdown */}
                <div className="relative">
                    <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2">
                        <img className="h-9 w-9 rounded-full border-2 border-slate-200 dark:border-slate-600" src="https://ui-avatars.com/api/?name=Dr+Minh&background=06b6d4&color=fff" alt="Avatar" />
                        <div className="hidden sm:block text-left">
                           <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">Dr. Minh</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
                        </div>
                    </button>
                    {isDropdownOpen && (
                        <div 
                          className="absolute right-0 mt-2 w-48 bg-surface dark:bg-slate-800 rounded-lg shadow-xl z-10 border border-slate-200/50 dark:border-slate-600"
                          onMouseLeave={() => setDropdownOpen(false)}
                        >
                           <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Hồ sơ</a>
                           <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700">Cài đặt</a>
                           <div className="border-t border-slate-200 dark:border-slate-600"></div>
                           <button 
                             onClick={() => {
                                 onLogout();
                                 setDropdownOpen(false);
                             }}
                             className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"
                           >
                            <LogoutIcon className="h-4 w-4 mr-2"/>
                             Đăng xuất
                           </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
