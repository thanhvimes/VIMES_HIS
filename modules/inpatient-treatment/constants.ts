
import React from 'react';
import { 
  ClipboardListIcon,
  Squares2X2Icon,
  ListBulletIcon,
  HeartIcon,
  ActivityIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

// Menu dành riêng cho Bác sĩ (Default view handles role filtering in Store)
export const INPATIENT_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/inpatient-treatment/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    
    { name: 'Danh sách nội trú', path: '/inpatient-treatment/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ BUỒNG BỆNH', iconName: 'ListBulletIcon' },
    { name: 'Tờ điều trị (Y lệnh)', path: '/inpatient-treatment/record', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ ĐIỀU TRỊ', iconName: 'ClipboardListIcon' },
    { name: 'Hội chẩn & Phẫu thuật', path: '/surgery/scheduler', icon: React.createElement(HeartIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ ĐIỀU TRỊ', iconName: 'HeartIcon' },
];

export const DOCTOR_NAV_ITEMS = [...INPATIENT_NAV_ITEMS];

export const NURSE_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/inpatient-treatment/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    { name: 'Danh sách nội trú', path: '/inpatient-treatment/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ BUỒNG BỆNH', iconName: 'ListBulletIcon' },
    { name: 'Phiếu chăm sóc', path: '/inpatient-treatment/record', icon: React.createElement(ActivityIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ ĐIỀU DƯỠNG', iconName: 'ActivityIcon' },
];
