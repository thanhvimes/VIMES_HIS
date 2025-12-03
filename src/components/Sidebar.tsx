
import React, { useMemo } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { XIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, HomeIcon } from './Icons';
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
    title={name}
    end={path === '/' || path.split('/').length === 2} // Exact match only for root/dashboard links to allow sub-routes active state
    className={({ isActive }) =>
      `flex items-center p-2.5 my-1 mx-2 rounded-lg transition-all duration-200 border border-transparent ${
        isCollapsed ? 'justify-center px-2' : ''
      } ${
        isActive
          ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light font-bold shadow-sm border-primary/20'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-200'
      }`
    }
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: "w-5 h-5 flex-shrink-0" })}
    <span className={`ml-3 font-medium whitespace-nowrap transition-all duration-200 overflow-hidden text-sm ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
      {name}
    </span>
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setMobileOpen, isCollapsed, onToggleCollapse, moduleNavItems }) => {
  
  // Group items by their 'section' property
  const groupedNavItems = useMemo(() => {
      const groups: Record<string, NavItemType[]> = {};
      if (!moduleNavItems) return groups;
      
      moduleNavItems.forEach(item => {
          const section = item.section || 'Chức năng'; // Default section name
          if (!groups[section]) {
              groups[section] = [];
          }
          groups[section].push(item);
      });
      return groups;
  }, [moduleNavItems]);

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${
          isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-surface text-onSurface dark:bg-dark-surface dark:text-dark-onSurface shadow-xl fixed lg:relative lg:translate-x-0 h-full z-40 transition-all duration-300 ease-in-out no-print border-r border-slate-200 dark:border-slate-800 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          isCollapsed ? 'lg:w-20' : 'lg:w-72'
        }`}
      >
        {/* Logo Area */}
        <div className={`flex items-center px-4 border-b border-slate-200 dark:border-slate-800 h-[72px] flex-shrink-0 ${isCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
          <Link to="/staff-dashboard" className="flex items-center overflow-hidden group" onClick={() => setMobileOpen(false)} title="Về trang chủ">
             <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
                <HomeIcon className="h-6 w-6 text-primary dark:text-primary-light flex-shrink-0" />
             </div>
            <span className={`ml-3 text-lg font-extrabold text-slate-800 dark:text-white whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'lg:opacity-0 lg:hidden' : 'opacity-100'}`}>
              VIMES
            </span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <XIcon className="h-5 w-5"/>
          </button>
        </div>
        
        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-6">
          {moduleNavItems && moduleNavItems.length > 0 ? (
             Object.entries(groupedNavItems).map(([section, items]) => (
                 <div key={section}>
                     {/* Section Header */}
                     {!isCollapsed && (items as NavItemType[]).length > 0 && (
                         <div className="px-4 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                             {section}
                         </div>
                     )}
                     
                     {/* Divider for Collapsed Mode */}
                     {isCollapsed && (
                         <div className="mx-4 my-2 border-t border-slate-200 dark:border-slate-700" />
                     )}

                     <ul>
                        {(items as NavItemType[]).map((item) => (
                          <li key={item.name}>
                            <NavItem {...item} isCollapsed={isCollapsed} />
                          </li>
                        ))}
                     </ul>
                 </div>
             ))
          ) : (
             <div className="px-6 py-8 text-center">
                {!isCollapsed && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 italic">
                        Vui lòng chọn một phân hệ từ Bảng điều khiển.
                    </p>
                )}
             </div>
          )}
        </nav>
        
        {/* --- Collapse Toggle Button --- */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-full p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            title={isCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
          >
            {isCollapsed ? 
              <ChevronDoubleRightIcon className="w-5 h-5" /> : 
              <div className="flex items-center gap-2">
                <ChevronDoubleLeftIcon className="w-5 h-5" />
                <span className="text-xs font-bold uppercase">Thu gọn</span>
              </div>
            }
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;