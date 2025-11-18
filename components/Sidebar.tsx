import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ClipboardListIcon, XIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from './Icons';
import { NavItemType } from '../types';

interface SidebarProps {
  isMobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  moduleNavItems: NavItemType[] | null;
}

const NavItem: React.FC<NavItemType & { isCollapsed: boolean }> = ({ name, path, icon, isCollapsed }) => (
  <NavLink
    to={path}
    title={name} // Tooltip added here
    end // Use `end` for exact path matching
    className={({ isActive }) =>
      `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
        isCollapsed ? 'justify-center' : ''
      } ${
        isActive
          ? 'bg-primary text-white shadow-md'
          : 'text-slate-600 dark:text-slate-300 hover:bg-primary-light/20 hover:text-primary-dark dark:hover:bg-dark-primary/20 dark:hover:text-dark-primary'
      }`
    }
  >
    {React.cloneElement(icon, { className: "w-6 h-6 flex-shrink-0" })}
    <span className={`ml-3 font-medium whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'lg:opacity-0 lg:w-0 lg:hidden' : 'opacity-100'}`}>
      {name}
    </span>
  </NavLink>
);


const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setMobileOpen, isCollapsed, onToggleCollapse, moduleNavItems }) => {

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-30 lg:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-surface text-onSurface dark:bg-dark-surface dark:text-dark-onSurface shadow-lg fixed lg:relative lg:translate-x-0 h-full z-40 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        }`}
      >
        <div className={`flex items-center p-4 border-b border-slate-200 dark:border-slate-700 h-[65px] flex-shrink-0 ${isCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
          <Link to="/" className="flex items-center overflow-hidden" onClick={() => setMobileOpen(false)}>
            <ClipboardListIcon className="h-8 w-8 text-primary dark:text-dark-primary flex-shrink-0" />
            <span className={`ml-2 text-xl font-bold text-onSurface dark:text-dark-onSurface whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'lg:opacity-0 lg:hidden' : 'opacity-100'}`}>
              ClinicMS
            </span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-500 hover:text-primary dark:hover:text-dark-primary">
            <XIcon className="h-6 w-6"/>
          </button>
        </div>
        
        <nav className="flex-1 p-2 overflow-y-auto">
          {moduleNavItems && moduleNavItems.length > 0 ? (
             <div>
               <h3 className={`px-3 mb-2 text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase ${isCollapsed ? 'lg:text-center' : ''}`}>
                 <span className={`${isCollapsed ? 'lg:hidden' : ''}`}>Chức năng</span>
               </h3>
              <ul>
                {moduleNavItems.map((item) => (
                  <li key={item.name}>
                    <NavItem {...item} isCollapsed={isCollapsed} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
             <div className={`p-4 text-sm text-center text-slate-500 ${isCollapsed ? 'lg:hidden' : ''}`}>
               Module không có chức năng nào.
             </div>
          )}
        </nav>
        
        {/* --- Collapse Toggle Button --- */}
        <div className="p-2 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-full p-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            title={isCollapsed ? "Mở rộng" : "Thu gọn"}
          >
            {isCollapsed ? 
              <ChevronDoubleRightIcon className="w-6 h-6" /> : 
              <ChevronDoubleLeftIcon className="w-6 h-6" /> 
            }
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;