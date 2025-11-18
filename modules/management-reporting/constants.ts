import React from 'react';
import { 
  HomeIcon,
  ChartBarIcon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const MGMT_REPORTING_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/management-reporting/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    { name: 'Báo cáo Doanh thu', path: '/management-reporting/revenue', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
    { name: 'Báo cáo Bệnh nhân', path: '/management-reporting/patients', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
];