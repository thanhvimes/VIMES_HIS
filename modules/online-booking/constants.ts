
import React from 'react';
import { 
  CalendarDaysIcon,
  ClipboardListIcon,
  CogIcon,
  Squares2X2Icon,
  UserPlusIcon,
  SearchIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  DocumentTextIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const ONLINE_BOOKING_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/online-booking/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    
    { name: 'Đăng ký mới', path: '/online-booking/register', icon: React.createElement(UserPlusIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ', iconName: 'UserPlusIcon' },
    { name: 'Duyệt đăng ký', path: '/online-booking/management', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ', iconName: 'ClipboardListIcon' },
    
    { name: 'Báo cáo tổng hợp', path: '/online-booking/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'TRA CỨU', iconName: 'ChartBarIcon' },
    { name: 'Danh sách tiếp nhận', path: '/online-booking/reception-list', icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5" }), section: 'TRA CỨU', iconName: 'DocumentTextIcon' },
    
    { name: 'Thiết lập phòng hoạt động', path: '/online-booking/active-rooms', icon: React.createElement(BuildingOfficeIcon, { className: "w-5 h-5" }), section: 'QUẢN TRỊ', iconName: 'BuildingOfficeIcon' },
    { name: 'Cấu hình lịch khám', path: '/online-booking/config', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), section: 'QUẢN TRỊ', iconName: 'CogIcon' },
];
