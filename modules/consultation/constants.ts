
import React from 'react';
import { 
  ClipboardListIcon,
  DocumentTextIcon,
  HomeIcon,
  ListBulletIcon,
  FileSignatureIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const CONSULTATION_NAV_ITEMS: NavItemType[] = [
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Bảng điều khiển', path: '/consultation/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Hồ sơ', path: '/consultation/record', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }) },
    { name: 'Danh sách', path: '/consultation/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }) },
    // NEW: Document Signing
    { name: 'Tài liệu trình ký', path: '/consultation/signing', icon: React.createElement(FileSignatureIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Lịch sử bệnh án', path: '/consultation/history', icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5" }) },
];
