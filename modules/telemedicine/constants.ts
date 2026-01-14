
import React from 'react';
import { 
  Squares2X2Icon,
  VideoCameraIcon,
  ClipboardListIcon,
  CalendarDaysIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const TELEMEDICINE_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/telemedicine/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    { name: 'Yêu cầu hội chẩn', path: '/telemedicine/requests', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), iconName: 'ClipboardListIcon' },
    { name: 'Lịch hội chẩn', path: '/telemedicine/schedule', icon: React.createElement(CalendarDaysIcon, { className: "w-5 h-5" }), iconName: 'CalendarDaysIcon' },
    { name: 'Phòng trực tuyến', path: '/telemedicine/live', icon: React.createElement(VideoCameraIcon, { className: "w-5 h-5" }), iconName: 'VideoCameraIcon' },
];
