
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
  VideoCameraIcon,
  GlobeIcon,
  TagIcon
} from '../components/Icons';
import { FunnelIcon } from '../modules/crm/icons';
import { BriefcaseIcon } from '../modules/hr/icons';
import { UserCircleIcon } from '../modules/portal/icons'; 
import { NavItemType } from '../types';

export const MODULE_ITEMS: NavItemType[] = [
  { name: 'TT Điều hành (HCC)', path: '/command-center', icon: React.createElement(GlobeIcon, { className: "h-6 w-6" }), group: 'admin' },
  { name: 'Tiếp nhận', path: '/reception', icon: React.createElement(UserGroupIcon, { className: "h-6 w-6" }), group: 'clinical' },
  { name: 'Khám bệnh', path: '/consultation', icon: React.createElement(HeartIcon, { className: "h-6 w-6" }), group: 'clinical' },
  { name: 'Điều trị nội trú', path: '/inpatient-treatment', icon: React.createElement(HospitalIcon, { className: "h-6 w-6" }), group: 'clinical' },
  { name: 'Phẫu thuật', path: '/surgery', icon: React.createElement(ScissorsIcon, { className: "w-6 h-6" }), group: 'clinical' },
  { name: 'Hội chẩn xa', path: '/telemedicine', icon: React.createElement(VideoCameraIcon, { className: "h-6 w-6" }), group: 'clinical' },
  { name: 'KQ Xét nghiệm', path: '/lab-results', icon: React.createElement(BeakerIcon, { className: "h-6 w-6" }), group: 'paraclinical' },
  { name: 'KQ Hình ảnh', path: '/imaging-results', icon: React.createElement(PhotographIcon, { className: "h-6 w-6" }), group: 'paraclinical' },
  { name: 'Dược & Kho', path: '/pharmacy', icon: React.createElement(ArchiveIcon, { className: "h-6 w-6" }), group: 'finance' },
  { name: 'Vật tư Y tế', path: '/medical-supplies', icon: React.createElement(TagIcon, { className: "h-6 w-6" }), group: 'finance' }, // NEW
  { name: 'Viện phí', path: '/billing', icon: React.createElement(CurrencyDollarIcon, { className: "h-6 w-6" }), group: 'finance' },
  { name: 'BHYT', path: '/insurance', icon: React.createElement(ShieldCheckIcon, { className: "h-6 w-6" }), group: 'finance' },
  { name: 'CRM & CSKH', path: '/crm', icon: React.createElement(FunnelIcon, { className: "h-6 w-6" }), group: 'support' },
  { name: 'Nhân sự (HR)', path: '/hr', icon: React.createElement(BriefcaseIcon, { className: "h-6 w-6" }), group: 'admin' },
  { name: 'TB Y tế', path: '/equipment', icon: React.createElement(CpuChipIcon, { className: "h-6 w-6" }), group: 'support' },
  { name: 'Lưu trữ HS', path: '/record-storage', icon: React.createElement(LibraryIcon, { className: "h-6 w-6" }), group: 'admin' },
  { name: 'Báo cáo', path: '/management-reporting', icon: React.createElement(PresentationChartLineIcon, { className: "h-6 w-6" }), group: 'admin' },
  { name: 'Hệ thống', path: '/admin', icon: React.createElement(CogIcon, { className: "h-6 w-6" }), group: 'admin' },
  { name: 'Cổng Bệnh nhân', path: '/portal/home', icon: React.createElement(UserCircleIcon, { className: "h-6 w-6" }), group: 'support' },
];

export const SIDEBAR_NAV_ITEMS: NavItemType[] = [
  { name: 'Bảng điều khiển', path: '/', icon: React.createElement(HomeIcon, { className: "h-6 w-6" }) },
  { name: 'Báo cáo', path: '/reports', icon: React.createElement(ChartBarIcon, { className: "h-6 w-6" }) },
  { name: 'Cài đặt', path: '/settings', icon: React.createElement(CogIcon, { className: "h-6 w-6" }) },
];
