import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { ClipboardListIcon, XIcon } from './Icons';
import { NavItemType } from '../types';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  moduleNavItems: NavItemType[] | null;
}

const NavItem: React.FC<NavItemType> = ({ name, path, icon }) => (
  <NavLink
    to={path}
    end={path.endsWith('/')} // Adjust for nested routes
    className={({ isActive }) =>
      `flex items-center p-3 my-1 rounded-lg transition-colors duration-200 ${
        isActive
          ? 'bg-primary text-white shadow-md'
          : 'text-slate-600 dark:text-slate-300 hover:bg-primary-light/20 hover:text-primary-dark dark:hover:bg-dark-primary/20 dark:hover:text-dark-primary'
      }`
    }
  >
    {React.cloneElement(icon, { className: "w-5 h-5" })}
    <span className="ml-3 font-medium">{name}</span>
  </NavLink>
);


const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen, moduleNavItems }) => {

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 z-30 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      ></div>
      <aside
        className={`flex flex-col w-64 bg-surface text-onSurface dark:bg-dark-surface dark:text-dark-onSurface shadow-lg fixed lg:relative lg:translate-x-0 h-full z-40 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 h-[65px]">
          <Link to="/" className="flex items-center" onClick={() => setIsOpen(false)}>
            <ClipboardListIcon className="h-8 w-8 text-primary dark:text-dark-primary" />
            <span className="ml-2 text-xl font-bold text-onSurface dark:text-dark-onSurface">ClinicMS</span>
          </Link>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-500 hover:text-primary dark:hover:text-dark-primary">
            <XIcon className="h-6 w-6"/>
          </button>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          {moduleNavItems && moduleNavItems.length > 0 ? (
             <div>
               <h3 className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                 Chức năng
               </h3>
              <ul>
                {moduleNavItems.map((item) => (
                  <li key={item.name}>
                    <NavItem {...item} />
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="p-4 text-sm text-slate-500">Module không có chức năng nào.</div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
