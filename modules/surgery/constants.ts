
import React from 'react';
import { 
  CalendarDaysIcon,
  ClipboardListIcon,
  TvIcon,
  Squares2X2Icon,
  ChartBarIcon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const SURGERY_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/surgery/scheduler', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    
    { name: 'Lịch mổ hôm nay', path: '/surgery/scheduler', icon: React.createElement(CalendarDaysIcon, { className: "w-5 h-5" }), section: 'ĐIỀU HÀNH PHÒNG MỔ', iconName: 'CalendarDaysIcon' },
    { name: 'Màn hình chờ thân nhân', path: '/surgery/waiting-room', icon: React.createElement(TvIcon, { className: "w-5 h-5" }), section: 'ĐIỀU HÀNH PHÒNG MỔ', iconName: 'TvIcon' },
    
    { name: 'Danh sách ca phẫu thuật', path: '/surgery/list', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ CHUYÊN MÔN', iconName: 'ClipboardListIcon' },
    { name: 'Báo cáo phẫu thuật', path: '/surgery/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'THỐNG KÊ', iconName: 'ChartBarIcon' },
];
