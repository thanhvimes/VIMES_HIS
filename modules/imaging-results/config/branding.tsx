import React, { useState, useEffect } from 'react';
import axios from 'axios';
import vimesLogoPng from '../assets/vimes_logo_tight_transparent.png';
import VimesLogo from '../components/ui/VimesLogo';

// Cấu hình mặc định
export const BRANDING = {
    hospitalName: 'PHÒNG KHÁM ĐA KHOA SÀI GÒN BÙ NA',
    parentName: 'SỞ Y TẾ TỈNH ĐỒNG NAI',
    systemName: 'HỆ THỐNG CHẨN ĐOÁN HÌNH ẢNH & PACS VIEWER',
    logoUrl: '',
};

export { VimesLogo };

export interface CompanyInfo {
    id?: string;
    name: string;
    parent_name?: string;
    address?: string;
    phone?: string;
    website?: string;
    email?: string;
    logo?: string;
}

let cachedCompany: CompanyInfo = {
    name: BRANDING.hospitalName,
    parent_name: BRANDING.parentName,
    logo: ''
};

const listeners = new Set<(c: CompanyInfo) => void>();

export function getCachedCompany(): CompanyInfo {
    return cachedCompany;
}

export async function fetchCompanyInfo(): Promise<CompanyInfo> {
    try {
        const res = await axios.get('/api/v1/settings/company-info').catch(() => axios.get('/api/his/company'));
        if (res.data?.success && res.data.data) {
            cachedCompany = res.data.data;
            BRANDING.hospitalName = res.data.data.name || BRANDING.hospitalName;
            BRANDING.parentName = res.data.data.parent_name || BRANDING.parentName;
            BRANDING.logoUrl = res.data.data.logo || '';
            listeners.forEach(l => l(cachedCompany));
            return cachedCompany;
        }
    } catch (e) {
        console.warn('Could not fetch company info from sys_company:', e);
    }
    return cachedCompany;
}

// Tự động nạp thông tin từ sys_company khi khởi chạy
fetchCompanyInfo();

export function useCompanyInfo() {
    const [company, setCompany] = useState<CompanyInfo>(cachedCompany);

    useEffect(() => {
        const handler = (newComp: CompanyInfo) => setCompany({ ...newComp });
        listeners.add(handler);
        fetchCompanyInfo();
        return () => {
            listeners.delete(handler);
        };
    }, []);

    return company;
}

// Component Logo Bệnh viện (Ưu tiên lấy ảnh Logo từ sys_company.sc_logo)
export const HospitalLogo: React.FC<{ className?: string; height?: number }> = ({ className = 'w-8 h-8', height }) => {
    const company = useCompanyInfo();
    const [imgError, setImgError] = useState(false);

    if (company.logo && !imgError) {
        return (
            <img 
                src={company.logo} 
                alt={company.name || 'Logo'} 
                className={`${className} object-contain`}
                style={height ? { height: `${height}px`, width: `${height}px` } : undefined}
                onError={() => setImgError(true)}
            />
        );
    }

    return (
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
            <path d="M43 22H57V43H78V57H57V78H43V57H22V43H43V22Z" fill="#dc2626" />
            
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
};
