import React from 'react';
import { 
    Squares2X2Icon,
    DocumentPlusIcon,
    DocumentTextIcon,
    PrinterIcon,
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
        name: 'Hồ sơ sức khỏe',
        path: '/health-check?step=create',
        section: 'QUY TRÌNH LIÊN THÔNG',
        icon: React.createElement(DocumentPlusIcon, { className: "w-5 h-5" }),
        iconName: 'DocumentPlusIcon'
    },
    {
        name: 'Danh sách hồ sơ',
        path: '/health-check?step=manage',
        section: 'QUY TRÌNH LIÊN THÔNG',
        icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5" }),
        iconName: 'DocumentTextIcon'
    },
    {
        name: 'Quản lý in code',
        path: '/health-check?step=print-code',
        section: 'QUY TRÌNH LIÊN THÔNG',
        icon: React.createElement(PrinterIcon, { className: "w-5 h-5" }),
        iconName: 'PrinterIcon'
    },
    {
        name: 'Đồng bộ dữ liệu',
        path: '/health-check?step=sync',
        section: 'QUY TRÌNH LIÊN THÔNG',
        icon: React.createElement(CloudUploadIcon, { className: "w-5 h-5" }),
        iconName: 'CloudUploadIcon'
    },
    {
        name: 'Cấu hình VNeID',
        path: '/health-check?step=settings-vneid',
        section: 'CẤU HÌNH THIẾT LẬP',
        icon: React.createElement(CloudUploadIcon, { className: "w-5 h-5" }),
        iconName: 'CloudUploadIcon'
    },
    {
        name: 'Cấu hình in Barcode',
        path: '/health-check?step=settings-barcode',
        section: 'CẤU HÌNH THIẾT LẬP',
        icon: React.createElement(PrinterIcon, { className: "w-5 h-5" }),
        iconName: 'PrinterIcon'
    }
];


