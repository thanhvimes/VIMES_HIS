
import React from 'react';
import { 
  PlusIcon,
  ListBulletIcon,
  CalendarIcon,
  TvIcon,
  ChartBarIcon,
  CogIcon,
  Squares2X2Icon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const RECEPTION_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/reception/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'Đăng ký KCB', path: '/reception/register', icon: React.createElement(PlusIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ' },
    { name: 'Danh sách Chờ', path: '/reception/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ' },
    { name: 'Lịch hẹn', path: '/reception/schedule', icon: React.createElement(CalendarIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ' },
    
    { name: 'Hàng đợi & Gọi số', path: '/reception/queue', icon: React.createElement(TvIcon, { className: "w-5 h-5" }), section: 'Tiện ích' },
    
    { name: 'Báo cáo', path: '/reception/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'Quản lý' },
    { name: 'Cấu hình', path: '/reception/settings', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), section: 'Quản lý' },
];