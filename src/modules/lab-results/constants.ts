
import React from 'react';
import { 
  Squares2X2Icon,
  ClipboardListIcon,
  MicroscopeIcon,
  DesktopComputerIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  CogIcon,
  ServerStackIcon,
  CalendarDaysIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const LAB_RESULTS_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/lab-results/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'Lịch & Tiếp nhận', path: '/lab-results/reception', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'Quy trình' },
    { name: 'Thực hiện & Duyệt', path: '/lab-results/processing', icon: React.createElement(MicroscopeIcon, { className: "w-5 h-5" }), section: 'Quy trình' },
    { name: 'Lịch lấy mẫu', path: '/lab-results/schedule', icon: React.createElement(CalendarDaysIcon, { className: "w-5 h-5" }), section: 'Quy trình' },
    
    { name: 'Kiểm chuẩn (QC)', path: '/lab-results/qc', icon: React.createElement(CheckBadgeIcon, { className: "w-5 h-5" }), section: 'Kỹ thuật' },
    { name: 'Kết nối LIS', path: '/lab-results/connections', icon: React.createElement(ServerStackIcon, { className: "w-5 h-5" }), section: 'Hệ thống' },
    { name: 'Danh mục & Cấu hình', path: '/lab-results/dictionary', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), section: 'Hệ thống' },
    
    { name: 'Báo cáo', path: '/lab-results/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'Báo cáo' },
];