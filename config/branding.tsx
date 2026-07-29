import React from 'react';
import vimesLogoPng from '../assets/vimes_logo_tight_transparent.png';
import VimesLogo from '../components/ui/VimesLogo';

// Cấu hình thông tin thương hiệu VIMES HIS
export const BRANDING = {
    hospitalName: 'BỆNH VIỆN ĐA KHOA TỈNH',
    systemName: 'HỆ THỐNG QUẢN LÝ TỔNG THỂ BỆNH VIỆN',
    logoUrl: '',
};

export { VimesLogo };

// Component Logo Bệnh viện (Biểu tượng Y tế Bệnh viện chính thức)
export const HospitalLogo: React.FC<{ className?: string; height?: number }> = ({ className = 'w-8 h-8', height }) => (
    <svg 
        viewBox="0 0 100 100" 
        className={className} 
        style={height ? { height: `${height}px`, width: `${height}px` } : undefined}
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
    >
        {/* Vòng tròn bảo vệ Bệnh viện */}
        <circle cx="50" cy="50" r="46" fill="url(#hosp-logo-grad)" stroke="#0ea5e9" strokeWidth="3" />
        <circle cx="50" cy="50" r="38" fill="#ffffff" />
        
        {/* Chữ thập y tế màu đỏ */}
        <path d="M43 22H57V43H78V57H57V78H43V57H22V43H43V22Z" fill="#dc2626" rx="3" />
        
        {/* Nhịp tim điện tâm đồ thể hiện hoạt động y tế */}
        <path d="M26 50H36L41 40L47 60L52 44L56 50H74" stroke="#0284c7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        
        <defs>
            <linearGradient id="hosp-logo-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="1" stopColor="#0284c7" />
            </linearGradient>
        </defs>
    </svg>
);
