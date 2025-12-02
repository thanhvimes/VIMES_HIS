
import React from 'react';
import { 
  ChartBarIcon,
  ListBulletIcon,
  Squares2X2Icon,
  CreditCardIcon,
  DocumentTextIcon,
  CogIcon,
  CurrencyDollarIcon,
  ReceiptIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const BILLING_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/billing/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }) },
    { name: 'Hồ sơ thanh toán', path: '/billing/record', icon: React.createElement(CreditCardIcon, { className: "w-5 h-5" }) },
    { name: 'Danh sách HĐ', path: '/billing/invoices', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }) },
    { name: 'Danh sách Tạm ứng', path: '/billing/deposits', icon: React.createElement(ReceiptIcon, { className: "w-5 h-5" }) },
    { name: 'Quản lý Thu Chi', path: '/billing/cash-flow', icon: React.createElement(CurrencyDollarIcon, { className: "w-5 h-5" }) },
    { name: 'Báo cáo', path: '/billing/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
    { name: 'Thiết lập', path: '/billing/settings', icon: React.createElement(CogIcon, { className: "w-5 h-5" }) },
];
