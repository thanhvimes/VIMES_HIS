
import React from 'react';
import { 
  CalendarDaysIcon,
  ClipboardListIcon,
  TvIcon
} from '../../components/Icons';
import { 
  Squares2X2Icon,
  ChartBarIcon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const SURGERY_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/surgery/scheduler', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'Lịch mổ', path: '/surgery/scheduler', icon: React.createElement(CalendarDaysIcon, { className: "w-5 h-5" }), section: 'Điều phối' },
    { name: 'Danh sách PT', path: '/surgery/list', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'Điều phối' },
    
    { name: 'Màn hình chờ', path: '/surgery/waiting-room', icon: React.createElement(TvIcon, { className: "w-5 h-5" }), section: 'Tiện ích' },
    
    { name: 'Báo cáo', path: '/surgery/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'Quản lý' },
];