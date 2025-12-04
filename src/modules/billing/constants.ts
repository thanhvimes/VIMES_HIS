
import React from 'react';
import { 
  ChartBarIcon,
  ListBulletIcon,
  Squares2X2Icon,
  CreditCardIcon,
  DocumentTextIcon,
  CogIcon,
  CurrencyDollarIcon,
  ReceiptIcon,
  CloudUploadIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const BILLING_NAV_ITEMS: NavItemType[] = [
    // Nhóm 1: Tổng quan
    { name: 'Bảng điều khiển', path: '/billing/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },

    // Nhóm 2: Nghiệp vụ hàng ngày
    { name: 'Hồ sơ thanh toán', path: '/billing/record', icon: React.createElement(CreditCardIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ Thu ngân' },
    { name: 'Danh sách HĐ', path: '/billing/invoices', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ Thu ngân' },
    { name: 'Hóa đơn điện tử', path: '/billing/e-invoices', icon: React.createElement(CloudUploadIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ Thu ngân' },
    { name: 'Danh sách Tạm ứng', path: '/billing/deposits', icon: React.createElement(ReceiptIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ Thu ngân' },
    
    // Nhóm 3: Quản lý & Báo cáo
    { name: 'Quản lý Thu Chi', path: '/billing/cash-flow', icon: React.createElement(CurrencyDollarIcon, { className: "w-5 h-5" }), section: 'Quản lý Tài chính' },
    { name: 'Báo cáo Tài chính', path: '/billing/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'Quản lý Tài chính' },
    { name: 'Cấu hình', path: '/billing/settings', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), section: 'Quản lý Tài chính' },
];
