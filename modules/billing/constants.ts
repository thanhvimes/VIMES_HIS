import React from 'react';
import { 
  ChartBarIcon,
  ListBulletIcon,
  HomeIcon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const BILLING_NAV_ITEMS: NavItemType[] = [
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Bảng điều khiển', path: '/billing/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Danh sách HĐ', path: '/billing/invoices', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Báo cáo', path: '/billing/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
];