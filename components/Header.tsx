

import React, { useState } from 'react';
import { MenuIcon, BellIcon, LogoutIcon, ClipboardListIcon } from './Icons';
import ThemeSwitcher from './ThemeSwitcher';

interface HeaderProps {
    pageTitle?: string;
    onToggleSidebar: () => void;
    onLogout: () => void;
    showSidebarToggle?: boolean;
    showBranding?: boolean;
}

const Header: React.FC<HeaderProps> = ({ pageTitle, onToggleSidebar, onLogout, showSidebarToggle = true, showBranding = false }) => {
    const [isDropdownOpen, setDropdownOpen] = useState(false);

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

                <button className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-primary dark:hover:text-dark-primary">
                    <BellIcon className="h-6 w-6" />
                </button>

                <div className="relative">
                    <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2">
                        <img className="h-9 w-9 rounded-full" src="https://picsum.photos/100" alt="Avatar" />
                        <div className="hidden sm:block text-left">
                           <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">Dr. Minh</p>
                           <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
                        </div>
                    </button>
                    {isDropdownOpen && (
                        <div 
                          className="absolute right-0 mt-2 w-48 bg-surface dark:bg-slate-700 rounded-lg shadow-xl z-10 border border-slate-200/50 dark:border-slate-600"
                          onMouseLeave={() => setDropdownOpen(false)}
                        >
                           <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Hồ sơ</a>
                           <a href="#" className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600">Cài đặt</a>
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
