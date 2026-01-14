
import React from 'react';
import { 
  ChartBarIcon,
  ListBulletIcon,
  Squares2X2Icon,
  CreditCardIcon,
  CogIcon,
  CurrencyDollarIcon,
  ReceiptIcon,
  CloudUploadIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const BILLING_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/billing/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    
    { name: 'Hồ sơ thanh toán', path: '/billing/record', icon: React.createElement(CreditCardIcon, { className: "w-5 h-5" }), section: 'KẾ TOÁN VIỆN PHÍ', iconName: 'CreditCardIcon' },
    { name: 'Danh sách hóa đơn', path: '/billing/invoices', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }), section: 'KẾ TOÁN VIỆN PHÍ', iconName: 'ListBulletIcon' },
    { name: 'Quản lý HĐ điện tử', path: '/billing/e-invoices', icon: React.createElement(CloudUploadIcon, { className: "w-5 h-5" }), section: 'KẾ TOÁN VIỆN PHÍ', iconName: 'CloudUploadIcon' },
    
    { name: 'Quản lý Tạm ứng', path: '/billing/deposits', icon: React.createElement(ReceiptIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ DÒNG TIỀN', iconName: 'ReceiptIcon' },
    { name: 'Thu chi tiền mặt', path: '/billing/cash-flow', icon: React.createElement(CurrencyDollarIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ DÒNG TIỀN', iconName: 'CurrencyDollarIcon' },
    
    { name: 'Báo cáo tài chính', path: '/billing/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'THỐNG KÊ', iconName: 'ChartBarIcon' },
    { name: 'Thiết lập danh mục', path: '/billing/settings', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), section: 'CẤU HÌNH', iconName: 'CogIcon' },
];
