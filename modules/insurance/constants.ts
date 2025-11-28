
import React from 'react';
import { 
  HomeIcon,
  CreditCardIcon,
  CloudUploadIcon,
  DocumentReportIcon,
  ShieldCheckIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const INSURANCE_NAV_ITEMS: NavItemType[] = [
    { name: 'Tổng quan BHYT', path: '/insurance/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    { name: 'Check thẻ Online', path: '/insurance/check-card', icon: React.createElement(ShieldCheckIcon, { className: "w-5 h-5" }) },
    { name: 'Xuất XML & Gửi Hồ sơ', path: '/insurance/xml-export', icon: React.createElement(CloudUploadIcon, { className: "w-5 h-5" }) },
    { name: 'Báo cáo Giám định', path: '/insurance/reports', icon: React.createElement(DocumentReportIcon, { className: "w-5 h-5" }) },
];
