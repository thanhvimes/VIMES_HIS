
import React from 'react';
import { 
  HomeIcon,
  ClipboardListIcon,
  MicroscopeIcon,
  DesktopComputerIcon,
  CheckBadgeIcon,
  ChartBarIcon,
  CogIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const LAB_RESULTS_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/lab-results/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    { name: 'Tiếp nhận & Lấy mẫu', path: '/lab-results/reception', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }) },
    { name: 'Thực hiện & Duyệt KQ', path: '/lab-results/processing', icon: React.createElement(MicroscopeIcon, { className: "w-5 h-5" }) },
    { name: 'Kiểm chuẩn (QC)', path: '/lab-results/qc', icon: React.createElement(CheckBadgeIcon, { className: "w-5 h-5" }) },
    { name: 'Báo cáo', path: '/lab-results/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
    { name: 'Danh mục & Cấu hình', path: '/lab-results/dictionary', icon: React.createElement(CogIcon, { className: "w-5 h-5" }) },
];
