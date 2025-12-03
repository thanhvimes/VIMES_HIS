
import React from 'react';
import { 
  Squares2X2Icon,
  ChartBarIcon
} from '../../components/Icons';
import { BriefcaseIcon, UserCircleIcon, CalendarDaysIcon, CashIcon, AcademicCapIcon, UserAddIcon, StarIcon } from './icons';
import { NavItemType } from '../../types';

export const HR_NAV_ITEMS: NavItemType[] = [
    { name: 'Tổng quan HR', path: '/hr/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'Hồ sơ Nhân sự', path: '/hr/staff', icon: React.createElement(UserCircleIcon, { className: "w-5 h-5" }), section: 'Nhân sự' },
    { name: 'Chấm công & Ca trực', path: '/hr/scheduling', icon: React.createElement(CalendarDaysIcon, { className: "w-5 h-5" }), section: 'Nhân sự' },
    { name: 'Lương & Phúc lợi', path: '/hr/payroll', icon: React.createElement(CashIcon, { className: "w-5 h-5" }), section: 'Nhân sự' },
    
    { name: 'Tuyển dụng', path: '/hr/recruitment', icon: React.createElement(UserAddIcon, { className: "w-5 h-5" }), section: 'Phát triển' },
    { name: 'Đào tạo & Đánh giá', path: '/hr/training', icon: React.createElement(StarIcon, { className: "w-5 h-5" }), section: 'Phát triển' },
    
    { name: 'Báo cáo HR', path: '/hr/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'Quản lý' },
];