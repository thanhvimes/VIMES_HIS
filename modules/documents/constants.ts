import React from 'react';
import { DocumentTextIcon, Squares2X2Icon } from '../../components/Icons';
import { NavItemType } from '../../types';

export const DOCUMENTS_NAV_ITEMS: NavItemType[] = [
  { name: 'Tổng quan biểu mẫu', path: '/documents/template-studio', icon: React.createElement(Squares2X2Icon, { className: 'w-5 h-5' }), iconName: 'Squares2X2Icon' },
  { name: 'Template Studio', path: '/documents/template-studio', icon: React.createElement(DocumentTextIcon, { className: 'w-5 h-5' }), section: 'BIỂU MẪU', iconName: 'DocumentTextIcon' }
];

