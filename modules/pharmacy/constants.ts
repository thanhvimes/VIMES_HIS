
import React from 'react';
import { 
  ArchiveIcon,
  TruckIcon,
  ChartBarIcon,
  Squares2X2Icon,
  ExclamationCircleIcon,
  CogIcon,
  ClipboardListIcon,
  SwitchHorizontalIcon,
  ArrowUturnLeftIcon,
  SyringeIcon,
  DocumentPlusIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const PHARMACY_NAV_ITEMS: NavItemType[] = [
    // Mục tiêu điểm (Giống "Bảng tin" trong hình)
    { name: 'Bảng điều khiển', path: '/pharmacy/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    
    // Nhóm 1: Quản lý kho
    { name: 'Tồn kho hiện tại', path: '/pharmacy/inventory', icon: React.createElement(ArchiveIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ KHO', iconName: 'ArchiveIcon' },
    { name: 'Quản lý Nhập - Xuất', path: '/pharmacy/transactions', icon: React.createElement(TruckIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ KHO', iconName: 'TruckIcon' },
    { name: 'Dự trù & Lĩnh thuốc', path: '/pharmacy/requisitions', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ KHO', iconName: 'ClipboardListIcon' },
    { name: 'Điều chuyển kho', path: '/pharmacy/transfer', icon: React.createElement(SwitchHorizontalIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ KHO', iconName: 'SwitchHorizontalIcon' },
    { name: 'Bổ sung tủ trực', path: '/pharmacy/replenishments', icon: React.createElement(SyringeIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ KHO', iconName: 'SyringeIcon' },
    { name: 'Phiếu hoàn trả', path: '/pharmacy/returns', icon: React.createElement(ArrowUturnLeftIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ KHO', iconName: 'ArrowUturnLeftIcon' },
    
    // Nhóm 2: An toàn
    { name: 'Cảnh báo tương tác', path: '/pharmacy/interactions', icon: React.createElement(ExclamationCircleIcon, { className: "w-5 h-5" }), section: 'AN TOÀN & CHẤT LƯỢNG', iconName: 'ExclamationCircleIcon' },
    
    // Nhóm 3: Thống kê
    { name: 'Báo cáo Dược', path: '/pharmacy/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'THỐNG KÊ', iconName: 'ChartBarIcon' },
    
    // Nhóm 4: Cấu hình
    { name: 'Thiết lập danh mục', path: '/pharmacy/setup', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), section: 'CẤU HÌNH HỆ THỐNG', iconName: 'CogIcon' },
];
