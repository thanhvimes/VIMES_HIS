
import React from 'react';
import { 
  Squares2X2Icon,
  TagIcon,
  WrenchIcon,
  ClipboardListIcon,
  ChartBarIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const EQUIPMENT_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/equipment/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    
    { name: 'Danh sách thiết bị', path: '/equipment/inventory', icon: React.createElement(TagIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ TÀI SẢN', iconName: 'TagIcon' },
    { name: 'Kiểm kê & Điều chuyển', path: '/equipment/transfer', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ TÀI SẢN', iconName: 'ClipboardListIcon' },
    
    { name: 'Lịch bảo trì & Sửa chữa', path: '/equipment/maintenance', icon: React.createElement(WrenchIcon, { className: "w-5 h-5" }), section: 'KỸ THUẬT', iconName: 'WrenchIcon' },
    { name: 'Báo cáo thiết bị', path: '/equipment/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'THỐNG KÊ', iconName: 'ChartBarIcon' },
];
