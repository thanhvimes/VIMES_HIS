import React from 'react';
import { 
  ListBulletIcon,
  ArrowUpTrayIcon,
  HomeIcon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const IMAGING_RESULTS_NAV_ITEMS: NavItemType[] = [
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Bảng điều khiển', path: '/imaging-results/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Danh sách KQ', path: '/imaging-results/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }) },
    // FIX: Replaced JSX with React.createElement to be valid in a .ts file
    { name: 'Tải lên KQ', path: '/imaging-results/upload', icon: React.createElement(ArrowUpTrayIcon, { className: "w-5 h-5" }) },
];