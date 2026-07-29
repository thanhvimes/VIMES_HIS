
import React from 'react';
import { 
  Squares2X2Icon,
  ClipboardListIcon,
  MicroscopeIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  CogIcon,
  ServerStackIcon,
  CalendarDaysIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const LAB_RESULTS_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/lab-results/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    
    { name: 'Lịch lấy mẫu BN', path: '/lab-results/schedule', icon: React.createElement(CalendarDaysIcon, { className: "w-5 h-5" }), section: 'QUY TRÌNH XÉT NGHIỆM', iconName: 'CalendarDaysIcon' },
    { name: 'Tiếp nhận & Lấy mẫu', path: '/lab-results/reception', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'QUY TRÌNH XÉT NGHIỆM', iconName: 'ClipboardListIcon' },
    { name: 'Thực hiện & Duyệt KQ', path: '/lab-results/processing', icon: React.createElement(MicroscopeIcon, { className: "w-5 h-5" }), section: 'QUY TRÌNH XÉT NGHIỆM', iconName: 'MicroscopeIcon' },
    
    { name: 'Kiểm chuẩn (QC)', path: '/lab-results/qc', icon: React.createElement(CheckBadgeIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ CHẤT LƯỢNG', iconName: 'CheckBadgeIcon' },
    { name: 'Kết nối LIS', path: '/lab-results/connections', icon: React.createElement(ServerStackIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ CHẤT LƯỢNG', iconName: 'ServerStackIcon' },
    
    { name: 'Báo cáo khoa XN', path: '/lab-results/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'THỐNG KÊ', iconName: 'ChartBarIcon' },
    { name: 'Danh mục & Cấu hình', path: '/lab-results/dictionary', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), section: 'THIẾT LẬP', iconName: 'CogIcon' },
];

// LIS Specific Theme Colors (Inspired by LabCollector: Orange/Blue)
export const LAB_COLORS = {
    primary: '#f97316', // Tailwind orange-500
    primaryHover: '#ea580c', // Tailwind orange-600
    primaryLight: '#ffedd5', // Tailwind orange-100
    secondary: '#0284c7', // Tailwind sky-600
    secondaryLight: '#e0f2fe', // Tailwind sky-100
    
    // Status Colors
    pending: '#94a3b8', // slate-400
    processing: '#3b82f6', // blue-500
    review: '#eab308', // yellow-500
    completed: '#22c55e', // green-500
    
    // Flag Colors
    flagHigh: '#f97316', // orange-500
    flagLow: '#3b82f6', // blue-500
    flagCritical: '#ef4444', // red-500
    flagCriticalBg: '#fef2f2', // red-50
    flagDelta: '#eab308', // yellow-500
};
