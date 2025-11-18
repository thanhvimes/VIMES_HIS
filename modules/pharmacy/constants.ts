import React from 'react';
import { 
  ArchiveIcon,
  TruckIcon,
  ChartBarIcon,
  HomeIcon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const PHARMACY_NAV_ITEMS: NavItemType[] = [
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Bảng điều khiển', path: '/pharmacy/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Tồn kho', path: '/pharmacy/inventory', icon: React.createElement(ArchiveIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Nhập/Xuất', path: '/pharmacy/import-export', icon: React.createElement(TruckIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Báo cáo', path: '/pharmacy/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
];