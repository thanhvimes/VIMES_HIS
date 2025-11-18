import React from 'react';
import { 
  DocumentPlusIcon,
  DocumentTextIcon,
  HomeIcon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const CONSULTATION_NAV_ITEMS: NavItemType[] = [
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Bảng điều khiển', path: '/consultation/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Ghi nhận khám', path: '/consultation/record', icon: React.createElement(DocumentPlusIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Lịch sử bệnh án', path: '/consultation/history', icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5" }) },
];