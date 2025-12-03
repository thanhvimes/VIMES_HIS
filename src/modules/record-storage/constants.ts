
import React from 'react';
import { 
  Squares2X2Icon,
  ClipboardListIcon,
  LibraryIcon,
  SwitchHorizontalIcon,
  ScannerIcon,
  ChartBarIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const RECORD_STORAGE_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/record-storage/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'Tiếp nhận & Bổ sung', path: '/record-storage/reception', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ' },
    { name: 'Kho lưu trữ', path: '/record-storage/storage', icon: React.createElement(LibraryIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ' },
    { name: 'Lưu thông (Mượn/Trả)', path: '/record-storage/circulation', icon: React.createElement(SwitchHorizontalIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ' },
    
    { name: 'Số hóa hồ sơ', path: '/record-storage/digitization', icon: React.createElement(ScannerIcon, { className: "w-5 h-5" }), section: 'Công nghệ' },
    
    { name: 'Báo cáo & Nhật ký', path: '/record-storage/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'Quản lý' },
];