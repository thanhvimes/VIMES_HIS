import React from 'react';

// Cấu hình thông tin thương hiệu của Bệnh viện
export const BRANDING = {
    hospitalName: 'BỆNH VIỆN K',
    systemName: 'HỆ THỐNG QUẢN LÝ TỔNG THỂ BỆNH VIỆN',
    logoUrl: '', // Đường dẫn hình ảnh logo nếu cấu hình ảnh tĩnh ngoài
};

// Component Logo Vector SVG chất lượng cao của bệnh viện
export const HospitalLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="vClinicLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0ea5e9" />
                <stop offset="50%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <linearGradient id="vClinicCrossGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        <path
            d="M24 2L40 11V31L24 46L8 31V11L24 2Z"
            fill="url(#vClinicLogoGrad)"
        />
        <path
            d="M24 5L37 12.5V29.5L24 42L11 29.5V12.5L24 5Z"
            fill="#ffffff"
            opacity="0.95"
        />
        <rect x="15" y="21" width="18" height="6" rx="2" fill="url(#vClinicCrossGrad)" />
        <rect x="21" y="15" width="6" height="18" rx="2" fill="url(#vClinicCrossGrad)" />
        <path
            d="M17 22.5C17 19 21.5 18 24 21C26.5 18 31 19 31 22.5C31 26.5 24 31 24 31C24 31 17 26.5 17 22.5Z"
            stroke="#4f46e5"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ filter: 'url(#logoGlow)' }}
        />
        <circle cx="24" cy="24" r="1" fill="#ffffff" />
    </svg>
);
