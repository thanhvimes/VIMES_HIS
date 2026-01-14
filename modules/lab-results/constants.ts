
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
