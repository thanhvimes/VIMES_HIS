
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
    { name: 'Bảng điều khiển', path: '/equipment/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'Danh sách thiết bị', path: '/equipment/inventory', icon: React.createElement(TagIcon, { className: "w-5 h-5" }), section: 'Tài sản' },
    { name: 'Kiểm kê & Điều chuyển', path: '/equipment/transfer', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'Tài sản' },
    
    { name: 'Bảo trì & Sửa chữa', path: '/equipment/maintenance', icon: React.createElement(WrenchIcon, { className: "w-5 h-5" }), section: 'Kỹ thuật' },
    
    { name: 'Báo cáo', path: '/equipment/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'Quản lý' },
];