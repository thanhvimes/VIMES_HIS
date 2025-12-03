
import React from 'react';
import { 
  Squares2X2Icon,
  MegaphoneIcon,
  UserGroupIcon,
  ChartBarIcon
} from '../../components/Icons';
import { FunnelIcon, GiftIcon, TicketIcon } from './icons';
import { NavItemType } from '../../types';

export const CRM_NAV_ITEMS: NavItemType[] = [
    { name: 'Tổng quan CRM', path: '/crm/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'Danh sách Khách hàng', path: '/crm/customers', icon: React.createElement(UserGroupIcon, { className: "w-5 h-5" }), section: 'Khách hàng' },
    { name: 'Tiềm năng (Leads)', path: '/crm/leads', icon: React.createElement(FunnelIcon, { className: "w-5 h-5" }), section: 'Khách hàng' },
    { name: 'Khách hàng thân thiết', path: '/crm/loyalty', icon: React.createElement(GiftIcon, { className: "w-5 h-5" }), section: 'Khách hàng' },
    
    { name: 'Chiến dịch Marketing', path: '/crm/marketing', icon: React.createElement(MegaphoneIcon, { className: "w-5 h-5" }), section: 'Marketing & CSKH' },
    { name: 'CSKH & Phản hồi', path: '/crm/care', icon: React.createElement(TicketIcon, { className: "w-5 h-5" }), section: 'Marketing & CSKH' },
    
    { name: 'Báo cáo Hiệu quả', path: '/crm/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'Quản lý' },
];