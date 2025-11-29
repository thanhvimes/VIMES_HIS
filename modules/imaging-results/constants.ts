
import React from 'react';
import { 
  ListBulletIcon,
  ArrowUpTrayIcon,
  Squares2X2Icon,
  ClipboardListIcon,
  DesktopComputerIcon,
  CogIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const IMAGING_RESULTS_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/imaging-results/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }) },
    { name: 'DS Chỉ định (Worklist)', path: '/imaging-results/worklist', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }) },
    { name: 'Đọc kết quả (Reading)', path: '/imaging-results/reading', icon: React.createElement(DesktopComputerIcon, { className: "w-5 h-5" }) },
    { name: 'Tra cứu KQ', path: '/imaging-results/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }) },
    { name: 'Cấu hình RIS', path: '/imaging-results/config', icon: React.createElement(CogIcon, { className: "w-5 h-5" }) },
];
