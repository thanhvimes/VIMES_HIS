
import React from 'react';
import { 
  ArchiveIcon,
  TruckIcon,
  ChartBarIcon,
  Squares2X2Icon,
  ExclamationCircleIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const PHARMACY_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/pharmacy/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }) },
    { name: 'Tồn kho', path: '/pharmacy/inventory', icon: React.createElement(ArchiveIcon, { className: "w-5 h-5" }) },
    { name: 'Nhập/Xuất', path: '/pharmacy/import-export', icon: React.createElement(TruckIcon, { className: "w-5 h-5" }) },
    { name: 'Cảnh báo tương tác', path: '/pharmacy/interactions', icon: React.createElement(ExclamationCircleIcon, { className: "w-5 h-5" }) },
    { name: 'Báo cáo', path: '/pharmacy/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
];
