
import React from 'react';
import { 
  Squares2X2Icon,
  ChartBarIcon
} from '../../components/Icons';
import { BriefcaseIcon, UserCircleIcon, CalendarDaysIcon, CashIcon, AcademicCapIcon, UserAddIcon, StarIcon } from './icons';
import { VideoCameraIcon } from '../../components/Icons'; // Reuse generic icon or import FaceID icon if available
import { NavItemType } from '../../types';

// FIX: Define local type to support section until global type is updated in non-src path
interface ExtendedNavItemType extends NavItemType {
    section?: string;
}

export const HR_NAV_ITEMS: ExtendedNavItemType[] = [
    { name: 'Tổng quan HR', path: '/hr/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), section: 'Tổng quan' },
    
    { name: 'Chấm công FaceID', path: '/hr/timekeeping', icon: React.createElement(VideoCameraIcon, { className: "w-5 h-5" }), section: 'Tiện ích nhân viên' }, // New Item

    { name: 'Hồ sơ Nhân sự', path: '/hr/staff', icon: React.createElement(UserCircleIcon, { className: "w-5 h-5" }), section: 'Nhân sự' },
    { name: 'Chấm công & Ca trực', path: '/hr/scheduling', icon: React.createElement(CalendarDaysIcon, { className: "w-5 h-5" }), section: 'Nhân sự' },
    { name: 'Lương & Phúc lợi', path: '/hr/payroll', icon: React.createElement(CashIcon, { className: "w-5 h-5" }), section: 'Nhân sự' },
    
    { name: 'Tuyển dụng', path: '/hr/recruitment', icon: React.createElement(UserAddIcon, { className: "w-5 h-5" }), section: 'Phát triển' },
    { name: 'Đào tạo & Đánh giá', path: '/hr/training', icon: React.createElement(StarIcon, { className: "w-5 h-5" }), section: 'Phát triển' },
    
    { name: 'Báo cáo HR', path: '/hr/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'Quản lý' },
];
