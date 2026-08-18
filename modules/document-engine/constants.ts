import React from 'react';
import { DocumentTextIcon, Squares2X2Icon, BeakerIcon, DocumentReportIcon, ClockIcon } from '../../components/Icons';
import { NavItemType } from '../../types';

export const DOCUMENTS_NAV_ITEMS: NavItemType[] = [
  { name: 'Tổng quan biểu mẫu', path: '/documents/template-studio', icon: React.createElement(Squares2X2Icon, { className: 'w-5 h-5' }), iconName: 'Squares2X2Icon' },
  { name: 'Danh sách & Trường', path: '/documents/template-studio?tab=fields', icon: React.createElement(DocumentTextIcon, { className: 'w-5 h-5' }), section: 'THIẾT LẬP MẪU', iconName: 'DocumentTextIcon' },
  { name: 'Phòng kiểm thử (Test Lab)', path: '/documents/template-studio?tab=test', icon: React.createElement(BeakerIcon, { className: 'w-5 h-5' }), iconName: 'BeakerIcon' },
  { name: 'Quản lý phiên bản', path: '/documents/template-studio?tab=versions', icon: React.createElement(DocumentReportIcon, { className: 'w-5 h-5' }), section: 'QUY TRÌNH & VẬN HÀNH', iconName: 'DocumentReportIcon' },
  { name: 'Nhật ký Audit & Rollback', path: '/documents/template-studio?tab=audit', icon: React.createElement(ClockIcon, { className: 'w-5 h-5' }), iconName: 'ClockIcon' }
];

