
import React from 'react';
import { 
  ClipboardListIcon,
  DocumentTextIcon,
  SignatureIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const CONSULTATION_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/consultation/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    
    { name: 'Danh sách chờ khám', path: '/consultation/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }), section: 'PHÒNG KHÁM LÂM SÀNG', iconName: 'ListBulletIcon' },
    { name: 'Hồ sơ bệnh án điện tử', path: '/consultation/record', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'PHÒNG KHÁM LÂM SÀNG', iconName: 'ClipboardListIcon' },
    
    { name: 'Tài liệu trình ký', path: '/consultation/signing', icon: React.createElement(SignatureIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ VĂN BẢN', iconName: 'SignatureIcon' },
    { name: 'Tra cứu lịch sử bệnh án', path: '/consultation/history', icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5" }), section: 'TRA CỨU', iconName: 'DocumentTextIcon' },
];
