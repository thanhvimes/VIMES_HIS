// ==================== HOSPITAL STATISTICS CONSTANTS ====================
// File: modules/hospital-statistics/constants.ts

import React from 'react';
import { 
    Squares2X2Icon, 
    ChartBarIcon, 
    ClipboardListIcon,
    BuildingOfficeIcon,
    HeartIcon,
    ScissorsIcon,
    CurrencyDollarIcon,
    BeakerIcon
} from '../../components/Icons';
import { NavItemType } from '../../types';

export const HOSPITAL_STATISTICS_NAV_ITEMS: NavItemType[] = [
    { 
        name: 'Bảng điều khiển', 
        path: '/hospital-statistics/dashboard', 
        icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), 
        iconName: 'Squares2X2Icon' 
    },
    { 
        name: 'Hoạt động Bệnh viện', 
        path: '/hospital-statistics/hospital-activity', 
        icon: React.createElement(ClipboardListIcon, { className: "w-5 h-5" }), 
        iconName: 'ClipboardListIcon' 
    },
    { 
        name: 'Phòng khám', 
        path: '/hospital-statistics/clinics', 
        icon: React.createElement(BuildingOfficeIcon, { className: "w-5 h-5" }), 
        iconName: 'BuildingOfficeIcon' 
    },
    { 
        name: 'Điều trị nội trú', 
        path: '/hospital-statistics/inpatient', 
        icon: React.createElement(HeartIcon, { className: "w-5 h-5" }), 
        iconName: 'HeartIcon' 
    },
    { 
        name: 'Cận lâm sàng', 
        path: '/hospital-statistics/paraclinical', 
        icon: React.createElement(BeakerIcon, { className: "w-5 h-5" }), 
        iconName: 'BeakerIcon' 
    },
    { 
        name: 'Phẫu thuật - Thủ thuật', 
        path: '/hospital-statistics/surgery', 
        icon: React.createElement(ScissorsIcon, { className: "w-5 h-5" }), 
        iconName: 'ScissorsIcon' 
    },
    { 
        name: 'Tổng hợp chi phí', 
        path: '/hospital-statistics/department-costs', 
        icon: React.createElement(CurrencyDollarIcon, { className: "w-5 h-5" }), 
        iconName: 'CurrencyDollarIcon' 
    },
    { 
        name: 'Công suất giường', 
        path: '/hospital-statistics/bed-occupancy', 
        icon: React.createElement(ChartBarIcon, { className: "w-5 h-5" }), 
        iconName: 'ChartBarIcon' 
    },
];
