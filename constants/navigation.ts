import React from 'react';
import { 
  UserGroupIcon, 
  HeartIcon, 
  CurrencyDollarIcon, 
  BeakerIcon, 
  PhotographIcon, 
  ArchiveIcon,
  HomeIcon,
  ChartBarIcon,
  CogIcon,
  PresentationChartLineIcon,
} from '../components/Icons';
import { NavItemType } from '../types';

export const MODULE_ITEMS: NavItemType[] = [
  // FIX: Replaced JSX with React.createElement to be valid in a .ts file
  { name: 'Tiếp nhận', path: '/reception', icon: React.createElement(UserGroupIcon, { className: "h-6 w-6" }) },
  // FIX: Replaced JSX with React.createElement to be valid in a .ts file
  { name: 'Khám bệnh', path: '/consultation', icon: React.createElement(HeartIcon, { className: "h-6 w-6" }) },
  // FIX: Replaced JSX with React.createElement to be valid in a .ts file
  { name: 'Viện phí', path: '/billing', icon: React.createElement(CurrencyDollarIcon, { className: "h-6 w-6" }) },
  // FIX: Replaced JSX with React.createElement to be valid in a .ts file
  { name: 'KQ Xét nghiệm', path: '/lab-results', icon: React.createElement(BeakerIcon, { className: "h-6 w-6" }) },
  // FIX: Replaced JSX with React.createElement to be valid in a .ts file
  { name: 'KQ Hình ảnh', path: '/imaging-results', icon: React.createElement(PhotographIcon, { className: "h-6 w-6" }) },
  // FIX: Replaced JSX with React.createElement to be valid in a .ts file
  { name: 'Dược & Vật tư', path: '/pharmacy', icon: React.createElement(ArchiveIcon, { className: "h-6 w-6" }) },
  // FIX: Replaced JSX with React.createElement to be valid in a .ts file
  { name: 'Quản trị hệ thống', path: '/admin', icon: React.createElement(CogIcon, { className: "h-6 w-6" }) },
  // FIX: Replaced JSX with React.createElement to be valid in a .ts file
  { name: 'Báo cáo Quản trị', path: '/management-reporting', icon: React.createElement(PresentationChartLineIcon, { className: "h-6 w-6" }) },
];

export const SIDEBAR_NAV_ITEMS: NavItemType[] = [
  // FIX: Replaced JSX with React.createElement to be valid in a .ts file
  { name: 'Bảng điều khiển', path: '/', icon: React.createElement(HomeIcon, { className: "h-6 w-6" }) },
  // FIX: Replaced JSX with React.createElement to be valid in a .ts file
  { name: 'Báo cáo', path: '/reports', icon: React.createElement(ChartBarIcon, { className: "h-6 w-6" }) },
  // FIX: Replaced JSX with React.createElement to be valid in a .ts file
  { name: 'Cài đặt', path: '/settings', icon: React.createElement(CogIcon, { className: "h-6 w-6" }) },
];