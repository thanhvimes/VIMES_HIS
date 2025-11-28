
import React from 'react';
import { 
  HomeIcon,
  UserGroupIcon,
  MegaphoneIcon,
  CogIcon,
  SignatureIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const ADMIN_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/admin/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    { name: 'Quản lý người dùng', path: '/admin/users', icon: React.createElement(UserGroupIcon, { className: "w-5 h-5" }) },
    { name: 'Quản lý Chữ ký số', path: '/admin/signatures', icon: React.createElement(SignatureIcon, { className: "w-5 h-5" }) },
    { name: 'Quản lý Quảng cáo', path: '/admin/advertisements', icon: React.createElement(MegaphoneIcon, { className: "w-5 h-5" }) },
    { name: 'Cấu hình hiển thị', path: '/admin/settings', icon: React.createElement(CogIcon, { className: "w-5 h-5" }) },
];
