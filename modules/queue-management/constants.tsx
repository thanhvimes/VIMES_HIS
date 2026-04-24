
import React from 'react';
import { NavItemType } from '../../types/common';
import { 
  Squares2X2Icon, 
  UserIcon, 
  ComputerDesktopIcon, 
  ReceiptTextIcon, 
  ClockIcon, 
  AdjustmentsHorizontalIcon,
} from '../../components/Icons';
import { Department } from './types';

export const QUEUE_NAV_ITEMS: NavItemType[] = [
    { 
        name: 'Trung tâm hàng đợi', 
        path: '/queue-management', 
        icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), 
        iconName: 'Squares2X2Icon',
        group: 'clinical'
    },
    { 
        name: 'Bàn Bác sĩ', 
        path: '/queue-management/doctor', 
        icon: React.createElement(UserIcon, { className: "w-5 h-5" }), 
        iconName: 'UserIcon',
        group: 'clinical'
    },
    { 
        name: 'Màn hình hiển thị', 
        path: '/queue-management/display', 
        icon: React.createElement(ComputerDesktopIcon, { className: "w-5 h-5" }), 
        iconName: 'ComputerDesktopIcon',
        group: 'clinical'
    },
    { 
        name: 'Màn hình tổng', 
        path: '/queue-management/central-display', 
        icon: React.createElement(Squares2X2Icon, { className: "w-5 h-5" }), 
        iconName: 'Squares2X2Icon',
        group: 'clinical'
    },
    { 
        name: 'Kiosk lấy số', 
        path: '/queue-management/kiosk', 
        icon: React.createElement(ReceiptTextIcon, { className: "w-5 h-5" }), 
        iconName: 'ReceiptTextIcon',
        group: 'support'
    },
    { 
        name: 'Hẹn lịch khám', 
        path: '/queue-management/appointments', 
        icon: React.createElement(ClockIcon, { className: "w-5 h-5" }), 
        iconName: 'ClockIcon',
        group: 'support'
    },
    { 
        name: 'Cài đặt', 
        path: '/queue-management/settings', 
        icon: React.createElement(AdjustmentsHorizontalIcon, { className: "w-5 h-5" }), 
        iconName: 'AdjustmentsHorizontalIcon',
        group: 'admin'
    },
];

export const DEFAULT_ADS = [
  {
    id: 'def-1',
    title: 'Khám Sức Khỏe Định Kỳ',
    subtitle: 'Bảo vệ sức khỏe cho bạn và gia đình',
    desc: 'Gói khám tổng quát giảm giá 20% cho người cao tuổi. Đăng ký ngay tại quầy lễ tân để được tư vấn chi tiết.',
    bg: 'bg-gradient-to-br from-blue-600 to-indigo-800',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
  },
  {
    id: 'def-2',
    title: 'Giữ Gìn Vệ Sinh Chung',
    subtitle: 'Vì một môi trường bệnh viện sạch đẹp',
    desc: 'Vui lòng không hút thuốc, vứt rác đúng nơi quy định và giữ trật tự trong khu vực chờ khám.',
    bg: 'bg-gradient-to-br from-emerald-600 to-teal-800',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
  },
  {
    id: 'def-3',
    title: 'Tải Ứng Dụng Đặt Lịch',
    subtitle: 'Không cần xếp hàng, lấy số tại nhà',
    desc: 'Quét mã QR tại quầy để tải ứng dụng. Đặt lịch khám, xem kết quả xét nghiệm trực tuyến tiện lợi.',
    bg: 'bg-gradient-to-br from-purple-600 to-fuchsia-800',
    icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
  }
];

export const DEPARTMENTS: Department[] = [
  {
    id: 'TN',
    name: 'Khu Tiếp Đón',
    type: 'RECEPTION',
    codePrefix: 'TN',
    image: 'https://images.unsplash.com/photo-1516387938699-a93567ec168e?auto=format&fit=crop&q=80&w=300',
    rooms: [
        { id: 'TN01', name: 'Quầy 01 - Tiếp Đón' },
        { id: 'TN02', name: 'Quầy 02 - Tiếp Đón BHYT' },
    ]
  },
  {
    id: 'KKB',
    name: 'Khoa Khám Bệnh',
    type: 'CLINIC',
    codePrefix: 'K',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=300',
    rooms: [
      { id: 'P101', name: 'P.101 - Khám Nội Tổng Quát' },
      { id: 'P102', name: 'P.102 - Khám Tiêu Hóa' },
      { id: 'P103', name: 'P.103 - Khám Tim Mạch' },
      { id: 'P104', name: 'P.104 - Khám Hô Hấp' },
    ]
  },
  {
    id: 'CDHA',
    name: 'Chẩn Đoán Hình Ảnh',
    type: 'IMAGING',
    codePrefix: 'HA',
    image: 'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?auto=format&fit=crop&q=80&w=300',
    rooms: [
      { id: 'XQ01', name: 'Phòng X-Quang 1' },
      { id: 'SA01', name: 'Phòng Siêu Âm 1' },
      { id: 'CT01', name: 'Phòng CT-Scanner' },
      { id: 'MRI1', name: 'Phòng MRI' },
    ]
  },
  {
    id: 'XN',
    name: 'Khoa Xét Nghiệm',
    type: 'LAB',
    codePrefix: 'XN',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=300',
    rooms: [
      { id: 'LM01', name: 'Phòng Lấy Mẫu Máu' },
      { id: 'LM02', name: 'Phòng Lấy Mẫu Nước Tiểu' },
    ]
  },
  {
    id: 'TC',
    name: 'Tài Chính & Dược',
    type: 'PHARMACY',
    codePrefix: 'DP',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&q=80&w=300',
    rooms: [
        { id: 'HP01', name: 'Quầy 03 - Thu Viện Phí' },
        { id: 'BHYT', name: 'Quầy 04 - Duyệt BHYT' },
        { id: 'DUOC', name: 'Quầy 05 - Cấp Phát Thuốc' },
    ]
  },
  {
    id: 'PT',
    name: 'Khu Phẫu Thuật',
    type: 'SURGERY',
    codePrefix: 'PT',
    image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=300',
    rooms: [
      { id: 'GMHS', name: 'Phòng Hồi Tỉnh (Recovery)' },
      { id: 'PM01', name: 'Phòng Mổ Số 1 (OR 1)' },
      { id: 'PM02', name: 'Phòng Mổ Số 2 (OR 2)' },
    ]
  }
];
