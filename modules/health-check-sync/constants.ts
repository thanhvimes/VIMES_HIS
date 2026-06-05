import React from 'react';
import { 
    Squares2X2Icon,
    DocumentPlusIcon,
    SignatureIcon,
    CloudUploadIcon,
    CheckBadgeIcon,
    AdjustmentsHorizontalIcon
} from '../../components/Icons';
import { NavItemType } from '../../types/common';

export const HEALTH_CHECK_NAV_ITEMS: NavItemType[] = [
    { 
        name: 'Bảng điều khiển & Thống kê', 
        path: '/health-check?step=dashboard', 
        icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), 
        iconName: 'Squares2X2Icon' 
    },
    {
        name: '1. Tạo mới hồ sơ KSK',
        path: '/health-check?step=create',
        section: 'QUY TRÌNH LIÊN THÔNG',
        icon: React.createElement(DocumentPlusIcon, { className: "w-5 h-5" }),
        iconName: 'DocumentPlusIcon'
    },
    {
        name: '2. Hồ sơ chờ ký số',
        path: '/health-check?step=pending-sign',
        section: 'QUY TRÌNH LIÊN THÔNG',
        icon: React.createElement(SignatureIcon, { className: "w-5 h-5" }),
        iconName: 'SignatureIcon'
    },
    {
        name: '3. Hồ sơ chờ đồng bộ',
        path: '/health-check?step=pending-send',
        section: 'QUY TRÌNH LIÊN THÔNG',
        icon: React.createElement(CloudUploadIcon, { className: "w-5 h-5" }),
        iconName: 'CloudUploadIcon'
    },
    {
        name: '4. Lịch sử liên thông',
        path: '/health-check?step=history',
        section: 'QUY TRÌNH LIÊN THÔNG',
        icon: React.createElement(CheckBadgeIcon, { className: "w-5 h-5" }),
        iconName: 'CheckBadgeIcon'
    },
    {
        name: '5. Thiết lập liên thông',
        path: '/health-check?step=settings',
        section: 'QUY TRÌNH LIÊN THÔNG',
        icon: React.createElement(AdjustmentsHorizontalIcon, { className: "w-5 h-5" }),
        iconName: 'AdjustmentsHorizontalIcon'
    }
];


