import React from 'react';
import vimesLogoPng from '../assets/vimes_logo_tight_transparent.png';
import VimesLogo from '../components/ui/VimesLogo';

// Cấu hình thông tin thương hiệu VIMES HIS
export const BRANDING = {
    hospitalName: 'VIMES HIS',
    systemName: 'HỆ THỐNG QUẢN LÝ TỔNG THỂ BỆNH VIỆN',
    logoUrl: vimesLogoPng,
};

// Component Logo Vector/Image chính thức của hệ thống VIMES HIS
export const HospitalLogo: React.FC<{ className?: string; height?: number }> = ({ className = '', height = 32 }) => (
    <VimesLogo className={className} height={height} />
);
