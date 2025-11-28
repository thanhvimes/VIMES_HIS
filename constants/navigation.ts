
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
  HospitalIcon,
  LibraryIcon,
  ScissorsIcon,
  CpuChipIcon,
  ShieldCheckIcon,
  VideoCameraIcon
} from '../components/Icons';
import { NavItemType } from '../types';

export const MODULE_ITEMS: NavItemType[] = [
  { name: 'Tiếp nhận', path: '/reception', icon: React.createElement(UserGroupIcon, { className: "h-6 w-6" }) },
  { name: 'Khám bệnh', path: '/consultation', icon: React.createElement(HeartIcon, { className: "h-6 w-6" }) },
  { name: 'Điều trị nội trú', path: '/inpatient-treatment', icon: React.createElement(HospitalIcon, { className: "h-6 w-6" }) },
  { name: 'Quản lý phẫu thuật', path: '/surgery', icon: React.createElement(ScissorsIcon, { className: "h-6 w-6" }) },
  { name: 'Hội chẩn từ xa', path: '/telemedicine', icon: React.createElement(VideoCameraIcon, { className: "h-6 w-6" }) },
  { name: 'Bảo hiểm Y tế', path: '/insurance', icon: React.createElement(ShieldCheckIcon, { className: "h-6 w-6" }) },
  { name: 'Viện phí', path: '/billing', icon: React.createElement(CurrencyDollarIcon, { className: "h-6 w-6" }) },
  { name: 'KQ Xét nghiệm', path: '/lab-results', icon: React.createElement(BeakerIcon, { className: "h-6 w-6" }) },
  { name: 'KQ Hình ảnh', path: '/imaging-results', icon: React.createElement(PhotographIcon, { className: "h-6 w-6" }) },
  { name: 'Dược & Vật tư', path: '/pharmacy', icon: React.createElement(ArchiveIcon, { className: "h-6 w-6" }) },
  { name: 'TB Y tế', path: '/equipment', icon: React.createElement(CpuChipIcon, { className: "h-6 w-6" }) },
  { name: 'Lưu trữ hồ sơ', path: '/record-storage', icon: React.createElement(LibraryIcon, { className: "h-6 w-6" }) },
  { name: 'Quản trị hệ thống', path: '/admin', icon: React.createElement(CogIcon, { className: "h-6 w-6" }) },
  { name: 'Báo cáo Quản trị', path: '/management-reporting', icon: React.createElement(PresentationChartLineIcon, { className: "h-6 w-6" }) },
];

export const SIDEBAR_NAV_ITEMS: NavItemType[] = [
  { name: 'Bảng điều khiển', path: '/', icon: React.createElement(HomeIcon, { className: "h-6 w-6" }) },
  { name: 'Báo cáo', path: '/reports', icon: React.createElement(ChartBarIcon, { className: "h-6 w-6" }) },
  { name: 'Cài đặt', path: '/settings', icon: React.createElement(CogIcon, { className: "h-6 w-6" }) },
];
