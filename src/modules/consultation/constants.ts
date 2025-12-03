
import React from 'react';
import { 
  ClipboardListIcon,
  DocumentTextIcon,
  FileSignatureIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const CONSULTATION_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/consultation/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'DS Chờ khám', path: '/consultation/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }), section: 'Khám bệnh' },
    { name: 'Hồ sơ bệnh án', path: '/consultation/record', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'Khám bệnh' },
    
    { name: 'Lịch sử khám', path: '/consultation/history', icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5" }), section: 'Tra cứu' },
    { name: 'Trình ký văn bản', path: '/consultation/signing', icon: React.createElement(FileSignatureIcon, { className: "w-5 h-5" }), section: 'Văn bản' },
];