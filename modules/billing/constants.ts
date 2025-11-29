
import React from 'react';
import { 
  ChartBarIcon,
  ListBulletIcon,
  Squares2X2Icon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const BILLING_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/billing/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }) },
    { name: 'Danh sách HĐ', path: '/billing/invoices', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }) },
    { name: 'Báo cáo', path: '/billing/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
];
