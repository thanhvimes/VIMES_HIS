
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
  CpuChipIcon,
  TagIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const MEDICAL_SUPPLIES_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/medical-supplies/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    { name: 'Tồn kho VTYT', path: '/medical-supplies/inventory', icon: React.createElement(ArchiveIcon, { className: "w-5 h-5" }), iconName: 'ArchiveIcon' },
    
    { name: 'Nhập - Xuất vật tư', path: '/medical-supplies/transactions', icon: React.createElement(TruckIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ kho', iconName: 'TruckIcon' },
    { name: 'Dự trù vật tư', path: '/medical-supplies/requisitions', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ kho', iconName: 'ClipboardListIcon' },
    { name: 'Điều chuyển nội bộ', path: '/medical-supplies/transfer', icon: React.createElement(SwitchHorizontalIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ kho', iconName: 'SwitchHorizontalIcon' },
    
    { name: 'Theo dõi tiêu hao', path: '/medical-supplies/consumption', icon: React.createElement(CpuChipIcon, { className: "w-5 h-5" }), section: 'Quản lý', iconName: 'CpuChipIcon' },
    { name: 'Báo cáo VTYT', path: '/medical-supplies/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'Thống kê', iconName: 'ChartBarIcon' },
    { name: 'Danh mục vật tư', path: '/medical-supplies/setup', icon: React.createElement(TagIcon, { className: "w-5 h-5" }), section: 'Cấu hình', iconName: 'TagIcon' },
];
