
import React from 'react';
import { 
  ClipboardListIcon,
  DocumentTextIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const INPATIENT_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/inpatient-treatment/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'Danh sách nội trú', path: '/inpatient-treatment/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }), section: 'Điều trị' },
    { name: 'Hồ sơ bệnh án', path: '/inpatient-treatment/record', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'Điều trị' },
    
    { name: 'Lịch sử & Lưu trữ', path: '/inpatient-treatment/history', icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5" }), section: 'Quản lý' },
];