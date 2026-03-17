
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { XIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon, HomeIcon } from './Icons';
import { NavItemType } from '../types';

interface SidebarProps {
  isMobileOpen: boolean;
  setMobileOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  moduleNavItems: NavItemType[] | null;
}

const NavItem: React.FC<NavItemType & { isCollapsed: boolean }> = ({ name, path, icon, isCollapsed }) => (
  <NavLink
    to={path}
    title={name}
    className={({ isActive }) =>
      `flex items-center p-2.5 my-0.5 rounded-md transition-all duration-150 ${isCollapsed ? 'justify-center' : ''
      } ${isActive
        ? 'bg-white/10 text-white font-semibold'
        : 'text-white/60 hover:bg-white/5 hover:text-white'
      }`
    }
  >
    {React.cloneElement(icon as React.ReactElement<any>, { className: "w-[18px] h-[18px] flex-shrink-0" })}
    <span className={`ml-3 font-medium whitespace-nowrap transition-all duration-200 overflow-hidden text-[13px] ${isCollapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}`}>
      {name}
    </span>
  </NavLink>
);

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setMobileOpen, isCollapsed, onToggleCollapse, moduleNavItems }) => {

  // Logic render menu có phân nhóm
  const renderNavItems = () => {
    if (!moduleNavItems || moduleNavItems.length === 0) {
      return (
        <div className="px-6 py-8 text-center">
          {!isCollapsed && (
            <p className="text-sm text-slate-500 dark:text-slate-400 italic">
              Vui lòng chọn một phân hệ từ Bảng điều khiển.
            </p>
          )}
        </div>
      );
    }

    const elements: React.ReactNode[] = [];
    let currentSection: string | undefined = undefined;

    moduleNavItems.forEach((item, index) => {
      // Nếu mục này có section và khác với section trước đó -> Chèn Header
      if (item.section && item.section !== currentSection) {
        currentSection = item.section;
        if (!isCollapsed) {
          elements.push(
            <div key={`section-${item.section}`} className="px-4 mt-6 mb-2">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em]">
                {item.section}
              </span>
            </div>
          );
        } else {
          // Khi thu gọn, chỉ chèn một đường kẻ mờ
          elements.push(<div key={`divider-${index}`} className="mx-4 my-3 border-t border-slate-100 dark:border-slate-800"></div>);
        }
      }

      // Nếu là mục đầu tiên và không có section (như Bảng điều khiển) -> Style đặc biệt "Highlight"
      const isHighlight = index === 0 && !item.section;

      elements.push(
        <li key={item.path} className={isHighlight ? "px-3 mb-2" : "px-3"}>
          {isHighlight ? (
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `flex items-center p-2.5 rounded-lg transition-all ${isActive
                  ? 'bg-white/10 text-white font-bold ring-1 ring-white/20 shadow-sm'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
            >
              {React.cloneElement(item.icon as React.ReactElement<any>, { className: "w-[18px] h-[18px] flex-shrink-0" })}
              {!isCollapsed && <span className="ml-3 font-bold text-[13px] uppercase tracking-tight">{item.name}</span>}
            </NavLink>
          ) : (
            <NavItem {...item} isCollapsed={isCollapsed} />
          )}
        </li>
      );
    });

    return <ul>{elements}</ul>;
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMobileOpen(false)}
      ></div>

      {/* Sidebar Container */}
      <aside
        className={`flex flex-col zendesk-sidebar shadow-xl fixed lg:relative lg:translate-x-0 h-full z-40 transition-all duration-300 ease-in-out no-print border-r border-slate-700/30 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          } ${isCollapsed ? 'lg:w-16' : 'lg:w-60'
          }`}
      >
        {/* Logo Area - Merged with Azure Header for a seamless top bar */}
        <div className={`flex items-center px-4 h-14 flex-shrink-0 azure-header border-b border-white/10 ${isCollapsed ? 'lg:justify-center' : 'justify-between'}`}>
          <Link to="/staff-dashboard" className="flex items-center group" onClick={() => setMobileOpen(false)} title="Về trang chủ">
            <div className="bg-white/10 p-2 rounded-lg group-hover:bg-white/20 transition-all border border-white/20 shadow-sm group-hover:scale-105">
              <HomeIcon className="h-5 w-5 text-white flex-shrink-0" />
            </div>
            <span className={`ml-3 text-lg font-bold text-white whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'lg:opacity-0 lg:hidden' : 'opacity-100'}`}>
              VIMES
            </span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4">
          {renderNavItems()}
        </nav>

        {/* Collapse Toggle Button */}
        <div className="p-3 border-t border-white/10 bg-black/10">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-full p-2 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition-all"
            title={isCollapsed ? "Mở rộng Sidebar" : "Thu gọn Sidebar"}
          >
            {isCollapsed ?
              <ChevronDoubleRightIcon className="h-5 w-5" /> :
              <div className="flex items-center gap-2">
                <ChevronDoubleLeftIcon className="h-5 w-5" />
                <span className="text-[12px] font-medium uppercase tracking-wider">Thu gọn</span>
              </div>
            }
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
