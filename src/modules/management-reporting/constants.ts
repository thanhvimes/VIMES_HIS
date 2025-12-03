
import React from 'react';
import { 
  Squares2X2Icon,
  ChartBarIcon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const MGMT_REPORTING_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/management-reporting/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'Báo cáo Doanh thu', path: '/management-reporting/revenue', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'Tài chính' },
    
    { name: 'Báo cáo Bệnh nhân', path: '/management-reporting/patients', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'Hoạt động' },
];