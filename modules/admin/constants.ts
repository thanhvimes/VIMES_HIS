
import React from 'react';
import { 
  Squares2X2Icon,
  UserGroupIcon,
  MegaphoneIcon,
  CogIcon,
  SignatureIcon,
  HospitalIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const ADMIN_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/admin/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    
    { name: 'Quản lý người dùng', path: '/admin/users', icon: React.createElement(UserGroupIcon, { className: "w-5 h-5" }), section: 'BẢO MẬT & PHÂN QUYỀN', iconName: 'UserGroupIcon' },
    { name: 'Quản lý Chữ ký số', path: '/admin/signatures', icon: React.createElement(SignatureIcon, { className: "w-5 h-5" }), section: 'BẢO MẬT & PHÂN QUYỀN', iconName: 'SignatureIcon' },
    
    { name: 'Thiết lập Phòng khám', path: '/admin/clinics', icon: React.createElement(HospitalIcon, { className: "w-5 h-5" }), section: 'CẤU HÌNH DANH MỤC', iconName: 'HospitalIcon' },
    { name: 'Quản lý nội dung ADS', path: '/admin/advertisements', icon: React.createElement(MegaphoneIcon, { className: "w-5 h-5" }), section: 'GIAO DIỆN & TRUYỀN THÔNG', iconName: 'MegaphoneIcon' },
    { name: 'Cấu hình hệ thống', path: '/admin/settings', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), section: 'THIẾT LẬP CHUNG', iconName: 'CogIcon' },
];
