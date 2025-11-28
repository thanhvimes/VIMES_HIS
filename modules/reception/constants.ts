
import React from 'react';
import { 
  PlusIcon,
  ListBulletIcon,
  CalendarIcon,
  TvIcon,
  ChartBarIcon,
  CogIcon,
  HomeIcon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const RECEPTION_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/reception/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    { name: 'Đăng ký', path: '/reception/register', icon: React.createElement(PlusIcon, { className: "w-5 h-5" }) },
    { name: 'Danh sách', path: '/reception/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }) },
    { name: 'Hẹn khám', path: '/reception/schedule', icon: React.createElement(CalendarIcon, { className: "w-5 h-5" }) },
    { name: 'Hàng đợi & Gọi số', path: '/reception/queue', icon: React.createElement(TvIcon, { className: "w-5 h-5" }) },
    { name: 'Báo cáo', path: '/reception/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
    { name: 'Cài đặt', path: '/reception/settings', icon: React.createElement(CogIcon, { className: "w-5 h-5" }) },
];
