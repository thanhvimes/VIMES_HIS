
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
    { name: 'Bảng điều khiển', path: '/imaging-results/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'Worklist (Chỉ định)', path: '/imaging-results/worklist', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'Chẩn đoán' },
    { name: 'Đọc kết quả (Reading)', path: '/imaging-results/reading', icon: React.createElement(DesktopComputerIcon, { className: "w-5 h-5" }), section: 'Chẩn đoán' },
    
    { name: 'Tra cứu Kết quả', path: '/imaging-results/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }), section: 'Lưu trữ' },
    
    { name: 'Cấu hình & Mẫu', path: '/imaging-results/config', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), section: 'Hệ thống' },
];