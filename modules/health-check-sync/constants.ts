import React from 'react';
import { 
    Squares2X2Icon,
    DocumentPlusIcon,
    DocumentTextIcon,
    PrinterIcon,
    SignatureIcon,
    CloudUploadIcon,
    CheckBadgeIcon,
    AdjustmentsHorizontalIcon,
    UserGroupIcon
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
        name: 'Tiếp nhận',
        path: '/health-check?step=reception',
        section: 'TIẾP NHẬN',
        icon: React.createElement(UserGroupIcon, { className: "w-5 h-5" }),
        iconName: 'UserGroupIcon'
    },
    {
        name: 'Quản lý gói khám',
        path: '/health-check?step=contracts',
        section: 'TIẾP NHẬN',
        icon: React.createElement(DocumentTextIcon, { className: "w-5 h-5" }),
        iconName: 'DocumentTextIcon'
    },
    {
        name: 'Đồng bộ dữ liệu',
        path: '/health-check?step=sync',
        section: 'TIẾP NHẬN',
        icon: React.createElement(CloudUploadIcon, { className: "w-5 h-5" }),
        iconName: 'CloudUploadIcon'
    },

    {
        name: 'Quản lý in code',
        path: '/health-check?step=print-code',
        section: 'QUẢN LÝ MẪU',
        icon: React.createElement(PrinterIcon, { className: "w-5 h-5" }),
        iconName: 'PrinterIcon'
    },
    {
        name: 'Giao nhận mẫu',
        path: '/health-check?step=sample-tracking',
        section: 'QUẢN LÝ MẪU',
        icon: React.createElement(CheckBadgeIcon, { className: "w-5 h-5" }),
        iconName: 'CheckBadgeIcon'
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
        name: 'Cấu hình VNeID',
        path: '/health-check?step=settings-vneid',
        section: 'CẤU HÌNH THIẾT LẬP',
        icon: React.createElement(CloudUploadIcon, { className: "w-5 h-5" }),
        iconName: 'CloudUploadIcon',
        adminOnly: true
    },
    {
        name: 'Cấu hình in Barcode',
        path: '/health-check?step=settings-barcode',
        section: 'CẤU HÌNH THIẾT LẬP',
        icon: React.createElement(PrinterIcon, { className: "w-5 h-5" }),
        iconName: 'PrinterIcon',
        adminOnly: true
    }
];

export interface TargetGroupItem {
    id: string;
    code: string;
    name: string;
    label: string;
}

export const TARGET_GROUPS: TargetGroupItem[] = [
    { id: '1', code: '1', name: 'Người cao tuổi', label: '1 - Người cao tuổi' },
    { id: '2', code: '2', name: 'Người khuyết tật', label: '2 - Người khuyết tật' },
    { id: '3', code: '3', name: 'Người thuộc hộ nghèo, cận nghèo', label: '3 - Người thuộc hộ nghèo, cận nghèo' },
    { id: '4', code: '4', name: 'Người có công', label: '4 - Người có công' },
    { id: '5', code: '5', name: 'Người mắc bệnh mạn tính', label: '5 - Người mắc bệnh mạn tính' },
    { id: '6', code: '6', name: 'Người sống tại vùng đồng bào dân tộc thiểu số và miền núi', label: '6 - Người sống tại vùng đồng bào dân tộc thiểu số và miền núi' },
    { id: '7', code: '7', name: 'Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn', label: '7 - Người sống tại vùng có điều kiện kinh tế - xã hội khó khăn, đặc biệt khó khăn' },
    { id: '8', code: '8', name: 'Người sống tại xã đảo', label: '8 - Người sống tại xã đảo' },
    { id: '9', code: '9', name: 'Người sống tại đặc khu', label: '9 - Người sống tại đặc khu' },
    { id: '10', code: '10', name: 'Trẻ em trong cơ sở giáo dục mầm non', label: '10 - Trẻ em trong cơ sở giáo dục mầm non' },
    { id: '11', code: '11', name: 'Học sinh trong các cơ sở giáo dục phổ thông', label: '11 - Học sinh trong các cơ sở giáo dục phổ thông' },
    { id: '12', code: '12', name: 'Sinh viên', label: '12 - Sinh viên' },
    { id: '13', code: '13', name: 'Người lao động', label: '13 - Người lao động' },
    { id: '14', code: '14', name: 'Người lao động không chính thức', label: '14 - Người lao động không chính thức' },
    { id: '15', code: '15', name: 'Người chưa có Bảo hiểm y tế', label: '15 - Người chưa có Bảo hiểm y tế' },
    { id: '16', code: '16', name: 'Các đối tượng khác', label: '16 - Các đối tượng khác' }
];


