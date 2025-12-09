
import React from 'react';
import { 
  Squares2X2Icon,
  CreditCardIcon,
  CloudUploadIcon,
  DocumentReportIcon,
  ShieldCheckIcon,
  PaperAirplaneIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const INSURANCE_NAV_ITEMS: NavItemType[] = [
    { name: 'Tổng quan BHYT', path: '/insurance/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'Check thẻ Online', path: '/insurance/check-card', icon: React.createElement(ShieldCheckIcon, { className: "w-5 h-5" }), section: 'Nghiệp vụ' },
    
    { name: 'Xuất XML 4210', path: '/insurance/xml-export', icon: React.createElement(CloudUploadIcon, { className: "w-5 h-5" }), section: 'Giám định' },
    { name: 'Gửi giấy tờ', path: '/insurance/send-documents', icon: React.createElement(PaperAirplaneIcon, { className: "w-5 h-5" }), section: 'Giám định' }, // New Item
    { name: 'Báo cáo Giám định', path: '/insurance/reports', icon: React.createElement(DocumentReportIcon, { className: "w-5 h-5" }), section: 'Giám định' },
];
