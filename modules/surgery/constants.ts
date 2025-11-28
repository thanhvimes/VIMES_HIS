
import React from 'react';
import { 
  CalendarDaysIcon,
  ClipboardListIcon,
  TvIcon
} from '../../components/Icons'; // Some remain shared or moved to shared in my interpretation, but TvIcon is in reception. Let's check surgery icons.
// Wait, TvIcon was put in Reception. CalendarDays in Shared. ClipboardList in Shared.
// Surgery has specific icons too.
import { 
  HomeIcon,
  ChartBarIcon,
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const SURGERY_NAV_ITEMS: NavItemType[] = [
    { name: 'Bảng điều khiển', path: '/surgery/scheduler', icon: React.createElement(HomeIcon, { className: "w-5 h-5" }) },
    { name: 'Lịch mổ', path: '/surgery/scheduler', icon: React.createElement(CalendarDaysIcon, { className: "w-5 h-5" }) },
    // TvIcon is used here too. It is better to have it in Shared if used in multiple places or import from reception. 
    // I moved TvIcon to Reception previously. Let's assume we need it here too or move it to Shared.
    // For now, I will import it from Shared (assuming I kept it there or moved it there). 
    // Actually I removed TvIcon from Shared in the plan above. I should duplicate it or move to Shared.
    // Decision: Move TvIcon to Shared in components/Icons.tsx to be safe as it is used in multiple modules.
    // I will update components/Icons.tsx to include TvIcon again.
    { name: 'Màn hình chờ', path: '/surgery/waiting-room', icon: React.createElement(TvIcon, { className: "w-5 h-5" }) },
    { name: 'Danh sách PT', path: '/surgery/list', icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }) },
    { name: 'Báo cáo', path: '/surgery/reports', icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }) },
];
