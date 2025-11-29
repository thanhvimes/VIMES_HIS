
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
    { name: 'Tổng quan CRM', path: '/crm/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }) },
    { name: 'Tiềm năng (Leads)', path: '/crm/leads', icon: React.createElement(FunnelIcon, { className: "w-5 h-5" }) },
    { name: 'Chiến dịch Marketing', path: '/crm/marketing', icon: React.createElement(MegaphoneIcon, { className: "w-5 h-5" }) },
    { name: 'CSKH & Phản hồi', path: '/crm/care', icon: React.createElement(TicketIcon, { className: "w-5 h-5" }) },
    { name: 'Khách hàng thân thiết', path: '/crm/loyalty', icon: React.createElement(GiftIcon, { className: "w-5 h-5" }) },
    { name: 'Báo cáo Hiệu quả', path: '/crm/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
];
