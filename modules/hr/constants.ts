
import React from 'react';
import { 
  HomeIcon,
  ChartBarIcon
} from '../../components/Icons';
import { BriefcaseIcon, UserCircleIcon, CalendarDaysIcon, CashIcon, AcademicCapIcon } from './icons';
import { NavItemType } from '../../types';

export const HR_NAV_ITEMS: NavItemType[] = [
    { name: 'Tổng quan HR', path: '/hr/dashboard', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    { name: 'Hồ sơ Nhân sự', path: '/hr/staff', icon: React.createElement(UserCircleIcon, { className: "w-5 h-5" }) },
    { name: 'Xếp ca & Chấm công', path: '/hr/scheduling', icon: React.createElement(CalendarDaysIcon, { className: "w-5 h-5" }) },
    { name: 'Lương & Phúc lợi', path: '/hr/payroll', icon: React.createElement(CashIcon, { className: "w-5 h-5" }) },
    { name: 'Đào tạo & CCHN', path: '/hr/training', icon: React.createElement(AcademicCapIcon, { className: "w-5 h-5" }) },
    { name: 'Báo cáo HR', path: '/hr/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
];
