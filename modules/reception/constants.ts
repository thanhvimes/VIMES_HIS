
import React from 'react';
import {
  PlusIcon,
  ListBulletIcon,
  CalendarIcon,
  TvIcon,
  ChartBarIcon,
  CogIcon,
  Squares2X2Icon,
  PhoneIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const RECEPTION_NAV_ITEMS: NavItemType[] = [
  { name: 'Bảng điều khiển', path: '/reception/dashboard', icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), iconName: 'Squares2X2Icon' },

  // Nhóm NGHIỆP VỤ TẠI QUẦY
  { name: 'Đăng ký mới', path: '/reception/register', icon: React.createElement(PlusIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ TẠI QUẦY', iconName: 'PlusIcon' },
  { name: 'Danh sách bệnh nhân', path: '/reception/list', icon: React.createElement(ListBulletIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ TẠI QUẦY', iconName: 'ListBulletIcon' },

  // Nhóm NGHIỆP VỤ TỪ XA
  { name: 'Lịch hẹn khám', path: '/reception/schedule', icon: React.createElement(CalendarIcon, { className: "w-5 h-5" }), section: 'NGHIỆP VỤ TỪ XA', iconName: 'CalendarIcon' },

  // Nhóm ĐIỀU PHỐI PHÒNG KHÁM
  { name: 'Hàng đợi & Gọi số', path: '/reception/queue', icon: React.createElement(TvIcon, { className: "w-5 h-5" }), section: 'ĐIỀU PHỐI PHÒNG KHÁM', iconName: 'TvIcon' },

  // Thống kê & Cấu hình
  { name: 'Báo cáo tiếp đón', path: '/reception/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), section: 'THỐNG KÊ', iconName: 'ChartBarIcon' },
  { name: 'Cấu hình tiếp đón', path: '/reception/settings', icon: React.createElement(CogIcon, { className: "w-5 h-5" }), section: 'CẤU HÌNH', iconName: 'CogIcon' },
];
