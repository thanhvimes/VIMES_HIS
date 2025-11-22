
import React from 'react';
import { 
  HomeIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  ChartBarIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const SURGERY_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/surgery/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    { name: 'Lịch mổ', path: '/surgery/scheduler', icon: React.createElement(CalendarDaysIcon, { className: "w-5 h-5" }) },
    { name: 'Danh sách PT', path: '/surgery/list', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }) },
    { name: 'Báo cáo', path: '/surgery/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
];
