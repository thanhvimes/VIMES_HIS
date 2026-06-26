import React from 'react';
import { 
  ListBulletIcon,
  Squares2X2Icon,
  ClipboardListIcon,
  DesktopComputerIcon,
  CogIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const PACS_RIS_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/pacs-ris/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    { name: 'DS Chỉ định (Worklist)', path: '/pacs-ris/worklist', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), iconName: 'ClipboardListIcon' },
    { name: 'Đọc kết quả (Workstation)', path: '/pacs-ris/reading', icon: React.createElement(DesktopComputerIcon, { className: "w-5 h-5" }), iconName: 'DesktopComputerIcon' },
    { name: 'Tra cứu lịch sử', path: '/pacs-ris/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }), iconName: 'ListBulletIcon' },
    { name: 'Cấu hình PACS Node', path: '/pacs-ris/config', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), iconName: 'CogIcon' },
];
