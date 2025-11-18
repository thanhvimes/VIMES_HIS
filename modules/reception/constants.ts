import React from 'react';
import { 
  UserPlusIcon,
  ListBulletIcon,
  CalendarIcon,
  ChartBarIcon,
  CogIcon,
  HomeIcon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const RECEPTION_NAV_ITEMS: NavItemType[] = [
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Bảng điều khiển', path: '/reception/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Đăng ký', path: '/reception/register', icon: React.createElement(UserPlusIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Danh sách', path: '/reception/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Hẹn khám', path: '/reception/schedule', icon: React.createElement(CalendarIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Báo cáo', path: '/reception/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Cài đặt', path: '/reception/settings', icon: React.createElement(CogIcon, { className: "w-5 h-5" }) },
];