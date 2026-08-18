import React from 'react';
import { 
  Squares2X2Icon,
  VideoCameraIcon,
  ClipboardListIcon,
  TvIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  CogIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const IMAGING_RESULTS_NAV_ITEMS: NavItemType[] = [
  // TỔNG QUAN
  { 
    name: 'Bảng Điều Khiển', 
    path: '/imaging-results/dashboard', 
    icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), 
    iconName: 'Squares2X2Icon', 
    section: 'TỔNG QUAN' 
  },
  
  // CHẨN ĐOÁN HÌNH ẢNH
  { 
    name: 'Danh Sách Ca Chụp', 
    path: '/imaging-results/studies', 
    icon: React.createElement(VideoCameraIcon, { className: "w-5 h-5" }), 
    iconName: 'VideoCameraIcon', 
    section: 'CHẨN ĐOÁN HÌNH ẢNH' 
  },
  { 
    name: 'Quản Lý Công Việc', 
    path: '/imaging-results/tasks', 
    icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), 
    iconName: 'ClipboardListIcon', 
    section: 'CHẨN ĐOÁN HÌNH ẢNH' 
  },
  
  // HỆ THỐNG & BẢO MẬT
  { 
    name: 'Máy Chủ & Hạ Tầng PACS', 
    path: '/imaging-results/pacs-server', 
    icon: React.createElement(TvIcon, { className: "w-5 h-5" }), 
    iconName: 'TvIcon', 
    section: 'HỆ THỐNG & BẢO MẬT' 
  },
  { 
    name: 'Nhật Ký Bảo Mật', 
    path: '/imaging-results/audit-logs', 
    icon: React.createElement(ShieldCheckIcon, { className: "w-5 h-5" }), 
    iconName: 'ShieldCheckIcon', 
    section: 'HỆ THỐNG & BẢO MẬT',
    adminOnly: true 
  },
  { 
    name: 'Cổng Tra Cứu Bệnh Nhân', 
    path: '/imaging-results/portal', 
    icon: React.createElement(UserGroupIcon, { className: "w-5 h-5" }), 
    iconName: 'UserGroupIcon', 
    section: 'HỆ THỐNG & BẢO MẬT' 
  },
  { 
    name: 'Cấu Hình Hệ Thống', 
    path: '/imaging-results/settings', 
    icon: React.createElement(CogIcon, { className: "w-5 h-5" }), 
    iconName: 'CogIcon', 
    section: 'HỆ THỐNG & BẢO MẬT' 
  },
];
