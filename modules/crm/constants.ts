
import React from 'react';
import { 
  Squares2X2Icon,
  MegaphoneIcon,
  UserGroupIcon,
  ChartBarIcon,
  FunnelIcon,
  GiftIcon,
  TicketIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const CRM_NAV_ITEMS: NavItemType[] = [
    { name: 'Tổng quan CRM', path: '/crm/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    
    { name: 'Danh sách Khách hàng', path: '/crm/customers', icon: React.createElement(UserGroupIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ DỮ LIỆU', iconName: 'UserGroupIcon' },
    { name: 'Khách hàng Tiềm năng', path: '/crm/leads', icon: React.createElement(FunnelIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ DỮ LIỆU', iconName: 'FunnelIcon' },
    
    { name: 'Chiến dịch Marketing', path: '/crm/marketing', icon: React.createElement(MegaphoneIcon, { className: "w-5 h-5" }), section: 'CHĂM SÓC KHÁCH HÀNG', iconName: 'MegaphoneIcon' },
    { name: 'Tiếp nhận phản hồi', path: '/crm/care', icon: React.createElement(TicketIcon, { className: "w-5 h-5" }), section: 'CHĂM SÓC KHÁCH HÀNG', iconName: 'TicketIcon' },
    { name: 'Chương trình Loyalty', path: '/crm/loyalty', icon: React.createElement(GiftIcon, { className: "w-5 h-5" }), section: 'CHĂM SÓC KHÁCH HÀNG', iconName: 'GiftIcon' },
    
    { name: 'Báo cáo hiệu quả', path: '/crm/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'THỐNG KÊ', iconName: 'ChartBarIcon' },
];
