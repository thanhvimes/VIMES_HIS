
import React from 'react';
import { 
  Squares2X2Icon,
  ChartBarIcon,
  UserCircleIcon, 
  CalendarDaysIcon, 
  CashIcon, 
  UserAddIcon, 
  StarIcon,
  VideoCameraIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const HR_NAV_ITEMS: NavItemType[] = [
    { name: 'Tổng quan Nhân sự', path: '/hr/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },
    
    { name: 'Hồ sơ nhân viên', path: '/hr/staff', icon: React.createElement(UserCircleIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ NHÂN LỰC', iconName: 'UserCircleIcon' },
    { name: 'Lịch trực & Chấm công', path: '/hr/scheduling', icon: React.createElement(CalendarDaysIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ NHÂN LỰC', iconName: 'CalendarDaysIcon' },
    { name: 'Chấm công FaceID', path: '/hr/timekeeping', icon: React.createElement(VideoCameraIcon, { className: "w-5 h-5" }), section: 'QUẢN LÝ NHÂN LỰC', iconName: 'VideoCameraIcon' }, 

    { name: 'Lương & Phụ cấp', path: '/hr/payroll', icon: React.createElement(CashIcon, { className: "w-5 h-5" }), section: 'TÀI CHÍNH NHÂN SỰ', iconName: 'CashIcon' },
    
    { name: 'Quy trình Tuyển dụng', path: '/hr/recruitment', icon: React.createElement(UserAddIcon, { className: "w-5 h-5" }), section: 'PHÁT TRIỂN & ĐÀO TẠ', iconName: 'UserAddIcon' },
    { name: 'Đào tạo & Đánh giá', path: '/hr/training', icon: React.createElement(StarIcon, { className: "w-5 h-5" }), section: 'PHÁT TRIỂN & ĐÀO TẠ', iconName: 'StarIcon' },
    
    { name: 'Báo cáo nhân sự', path: '/hr/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'THỐNG KÊ', iconName: 'ChartBarIcon' },
];
