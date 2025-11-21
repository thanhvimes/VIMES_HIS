
import React from 'react';
import { 
  ClipboardListIcon,
  DocumentTextIcon,
  HomeIcon,
  ListBulletIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const INPATIENT_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/inpatient-treatment/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    { name: 'Hồ sơ bệnh án', path: '/inpatient-treatment/record', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }) },
    { name: 'Danh sách nội trú', path: '/inpatient-treatment/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }) },
    { name: 'Lịch sử điều trị', path: '/inpatient-treatment/history', icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5" }) },
];
