
import React from 'react';
import { 
  Squares2X2Icon,
  UserGroupIcon,
  MegaphoneIcon,
  CogIcon,
  SignatureIcon,
  NewspaperIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const ADMIN_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/admin/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'Quản lý người dùng', path: '/admin/users', icon: React.createElement(UserGroupIcon, { className: "w-5 h-5" }), section: 'Nhân sự & Phân quyền' },
    { name: 'Quản lý Chữ ký số', path: '/admin/signatures', icon: React.createElement(SignatureIcon, { className: "w-5 h-5" }), section: 'Nhân sự & Phân quyền' },
    
    { name: 'Quản lý Quảng cáo', path: '/admin/advertisements', icon: React.createElement(MegaphoneIcon, { className: "w-5 h-5" }), section: 'Truyền thông' },
    { name: 'Tin tức & Sự kiện', path: '/admin/news', icon: React.createElement(NewspaperIcon, { className: "w-5 h-5" }), section: 'Truyền thông' },
    
    { name: 'Cấu hình hiển thị', path: '/admin/settings', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), section: 'Hệ thống' },
];