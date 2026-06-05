
import React from 'react';
import { 
  Squares2X2Icon,
  CloudUploadIcon,
  DocumentReportIcon,
  ShieldCheckIcon,
  PaperAirplaneIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const INSURANCE_NAV_ITEMS: NavItemType[] = [
    { name: 'Tổng quan BHYT', path: '/insurance/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    
    { name: 'Check thẻ Online', path: '/insurance/check-card', icon: React.createElement(ShieldCheckIcon, { className: "w-5 h-5" }), section: 'XÁC THỰC THÔNG TIN', iconName: 'ShieldCheckIcon' },
    
    { name: 'Xuất dữ liệu XML 4210', path: '/insurance/xml-export', icon: React.createElement(CloudUploadIcon, { className: "w-5 h-5" }), section: 'GIÁM ĐỊNH & ĐẨY CỔNG', iconName: 'CloudUploadIcon' },
    { name: 'Gửi giấy tờ lên cổng', path: '/insurance/send-documents', icon: React.createElement(PaperAirplaneIcon, { className: "w-5 h-5" }), section: 'GIÁM ĐỊNH & ĐẨY CỔNG', iconName: 'PaperAirplaneIcon' }, 
    { name: 'Liên thông KSK VNeID', path: '/health-check', icon: React.createElement(PaperAirplaneIcon, { className: "w-5 h-5" }), section: 'GIÁM ĐỊNH & ĐẨY CỔNG', iconName: 'PaperAirplaneIcon' },
    { name: 'Báo cáo quyết toán', path: '/insurance/reports', icon: React.createElement(DocumentReportIcon, { className: "w-5 h-5" }), section: 'THỐNG KÊ', iconName: 'DocumentReportIcon' },
];
