
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Patient, PatientStatus, Room, THEME_PRESETS } from '../../types';

interface SurgeryDisplayProps {
  patients: Patient[];
  room: Room;
  onBack: () => void;
}

const ITEMS_PER_PAGE = 7; 
const PAGE_DURATION = 15000;
const STORAGE_KEY_THEME = 'CLINIC_THEME_GLOBAL';

export const SurgeryDisplay: React.FC<SurgeryDisplayProps> = ({ patients, room, onBack }) => {
    const [time, setTime] = useState(new Date());
    const [currentPage, setCurrentPage] = useState(0);
    const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [currentThemeId, setCurrentThemeId] = useState<string>(
        localStorage.getItem(STORAGE_KEY_THEME) || room.themeId || 'hospital-light'
    );

    const currentTheme = useMemo(() => 
        THEME_PRESETS.find(t => t.id === currentThemeId) || THEME_PRESETS[0]
    , [currentThemeId]);

    const styles = useMemo(() => {
        const isProfessionalBlue = currentTheme.id === 'professional-blue';
        return {
            appBgColor: room.styleConfig?.appBgColor || (currentTheme.type === 'light' ? '#f8fafc' : (isProfessionalBlue ? '#004b87' : '#0f172a')),
            appBgImage: room.styleConfig?.appBgImage || '',
            clockColor: room.styleConfig?.clockColor || (currentTheme.type === 'light' ? '#1e293b' : '#ffffff'),
            headerBg: room.styleConfig?.headerBgColor || (isProfessionalBlue ? '#003366' : '#005EB8'), 
            headerText: room.styleConfig?.headerTextColor || '#FFFFFF',
            headerHeight: room.styleConfig?.headerHeight ? `${room.styleConfig.headerHeight}px` : 'auto',
            tableHeaderBg: room.styleConfig?.tableHeaderBg || (currentTheme.type === 'light' ? '#e2e8f0' : (isProfessionalBlue ? '#003366' : '#1e293b')),
            tableHeaderText: room.styleConfig?.tableHeaderColor || (currentTheme.type === 'light' ? '#334155' : '#ffffff'),
            tableBorder: room.styleConfig?.tableBorderColor || (currentTheme.type === 'light' ? '#cbd5e1' : (isProfessionalBlue ? '#4da6ff' : '#334155')),
            tableHeaderFontSize: room.styleConfig?.tableHeaderFontSize ? `${room.styleConfig.tableHeaderFontSize}px` : '1.125rem',
            servingRowBg: room.styleConfig?.servingRowBg || '#BE1233', 
            servingRowText: room.styleConfig?.servingRowText || '#FFFFFF',
            waitingRowBg: room.styleConfig?.waitingRowBg || (currentTheme.type === 'light' ? '#fff' : (isProfessionalBlue ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)')),
            waitingRowText: room.styleConfig?.waitingRowText || (currentTheme.type === 'light' ? '#0f172a' : '#ffffff'),
            rowFontSize: room.styleConfig?.rowFontSize ? `${room.styleConfig.rowFontSize}px` : '1.5rem',
            statusServingColor: room.styleConfig?.statusServingColor || '#9F1239', 
            statusRecoveryColor: room.styleConfig?.statusRecoveryColor || '#0369A1', 
            statusWaitingColor: room.styleConfig?.statusWaitingColor || '#B45309', 
            statusCompletedColor: room.styleConfig?.statusCompletedColor || '#15803D', 
            marqueeBg: room.styleConfig?.marqueeBgColor || (isProfessionalBlue ? '#003366' : '#0f172a'),
            marqueeText: room.styleConfig?.marqueeTextColor || '#fbbf24',
            marqueeHeight: room.styleConfig?.marqueeHeight ? `${room.styleConfig.marqueeHeight}px` : 'auto',
            marqueeFontSize: room.styleConfig?.marqueeFontSize ? `${room.styleConfig.marqueeFontSize}px` : '1.25rem',
        };
    }, [room.styleConfig, currentTheme]);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const maskName = (name: string) => { 
        const parts = name.trim().split(' '); 
        if (parts.length >= 3) { 
            const last = parts.pop(); 
            return parts.join(' ') + ' ' + last?.charAt(0) + '***'; 
        } 
        return name; 
    };

    const sortedPatients = useMemo(() => {
        return [...patients].sort((a, b) => {
            const score = (status: PatientStatus) => {
                if (status === PatientStatus.SERVING) return 1;
                if (status === PatientStatus.CONCLUSION) return 2;
                if (status === PatientStatus.WAITING) return 3;
                if (status === PatientStatus.COMPLETED) return 4;
                return 5;
            };
            return score(a.status) - score(b.status);
        });
    }, [patients]);

    const totalPages = Math.ceil(sortedPatients.length / ITEMS_PER_PAGE) || 1;

    useEffect(() => {
        if (totalPages <= 1) return;
        const interval = setInterval(() => { setCurrentPage(prev => (prev + 1) % totalPages); }, PAGE_DURATION);
        return () => clearInterval(interval);
    }, [totalPages]);

    const displayedPatients = sortedPatients.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

    const renderStatusBadge = (status: PatientStatus) => {
        let bgColor = ''; let text = '';
        switch (status) {
            case PatientStatus.SERVING: bgColor = styles.statusServingColor; text = "Đang phẫu thuật"; break;
            case PatientStatus.CONCLUSION: bgColor = styles.statusRecoveryColor; text = "Hồi tỉnh"; break;
            case PatientStatus.WAITING: bgColor = styles.statusWaitingColor; text = "Chuẩn bị"; break;
            case PatientStatus.COMPLETED: bgColor = styles.statusCompletedColor; text = "Về khoa"; break;
            default: return null;
        }
        return (
            <div className="font-bold px-4 py-2 rounded-full text-center uppercase text-sm tracking-widest w-40 shadow-md ring-2 ring-white/20" style={{ backgroundColor: bgColor, color: '#fff' }}>
                {text}
            </div>
        );
    };

    return (
        <div className="h-screen w-screen font-sans flex flex-col overflow-hidden bg-cover bg-center" style={{ backgroundColor: styles.appBgColor, backgroundImage: styles.appBgImage ? `url(${styles.appBgImage})` : undefined }}>
            <div className="flex-shrink-0 px-8 py-6 flex justify-between items-center z-20 relative shadow-md border-b" style={{ backgroundColor: styles.headerBg, borderColor: styles.tableBorder, height: styles.headerHeight }}>
                <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                     </div>
                     <div><h1 className="text-3xl font-black uppercase text-white leading-none">{room.customDisplayName || "Khu Vực Phẫu Thuật"}</h1><p className="text-lg font-bold uppercase text-white/70 mt-1">{room.name}</p></div>
                </div>
                <div className="text-right">
                    <div className="text-5xl font-mono font-bold text-white shadow-sm">{time.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</div>
                    <div className="font-bold uppercase mt-1 text-white/80 text-sm">{time.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                </div>
            </div>

            <div className="flex-1 p-6 overflow-hidden flex flex-col relative z-10">
                <div className="flex-1 flex flex-col rounded-xl overflow-hidden border shadow-xl relative" style={{ backgroundColor: currentTheme.type === 'light' ? '#fff' : 'rgba(15, 23, 42, 0.6)', borderColor: styles.tableBorder }}>
                    <div className="grid grid-cols-12 gap-4 px-6 py-5 font-black uppercase tracking-wider border-b text-lg" style={{ backgroundColor: styles.tableHeaderBg, color: styles.tableHeaderText, borderColor: styles.tableBorder, fontSize: styles.tableHeaderFontSize }}>
                        <div className="col-span-5 pl-4">Họ và tên người bệnh</div>
                        <div className="col-span-2 text-center">Phòng Mổ</div>
                        <div className="col-span-2 text-center">Giờ vào</div>
                        <div className="col-span-3 text-center">Trạng thái</div>
                    </div>
                    <div className="flex-1 flex flex-col bg-transparent">
                        {displayedPatients.map((patient, index) => {
                            const isSer = patient.status === PatientStatus.SERVING;
                            return (
                                <div key={patient.id} className="grid grid-cols-12 gap-4 items-center px-6 border-b transition-colors duration-300" style={{ height: `calc(100% / ${ITEMS_PER_PAGE})`, borderColor: styles.tableBorder, backgroundColor: isSer ? styles.servingRowBg : styles.waitingRowBg, color: isSer ? styles.servingRowText : styles.waitingRowText }}>
                                    <div className="col-span-5 pl-4 flex flex-col justify-center">
                                        <div className="font-bold truncate uppercase tracking-tight leading-tight" style={{ fontSize: styles.rowFontSize }}>{maskName(patient.name)}</div>
                                        <div className="flex items-center gap-4 mt-1 opacity-90 text-base font-medium"><span className="font-mono">NS: {new Date().getFullYear() - patient.age}</span>{isSer && (<span className="uppercase border-l-2 pl-3 ml-2 border-white/30">PTV: {room.doctorName}</span>)}</div>
                                    </div>
                                    <div className="col-span-2 text-center"><div className="text-3xl font-mono font-bold tracking-tighter">{patient.roomId || 'OR-01'}</div></div>
                                    <div className="col-span-2 text-center"><div className="text-3xl font-mono font-bold tracking-tighter">{patient.startedAt || '--:--'}</div></div>
                                    <div className="col-span-3 flex justify-center px-4">{renderStatusBadge(patient.status)}</div>
                                </div>
                            );
                        })}
                        {Array.from({ length: Math.max(0, ITEMS_PER_PAGE - displayedPatients.length) }).map((_, idx) => (
                             <div key={`empty-${idx}`} className="flex-1 border-b" style={{ borderColor: styles.tableBorder, backgroundColor: (idx + displayedPatients.length) % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }} />
                        ))}
                    </div>
                </div>
            </div>

            <div className="py-3 flex items-center shadow-lg border-t overflow-hidden relative z-20" style={{ backgroundColor: styles.marqueeBg, color: styles.marqueeText, borderColor: styles.tableBorder, height: styles.marqueeHeight }}>
                 <div className="animate-marquee inline-block font-bold font-mono whitespace-nowrap" style={{ fontSize: styles.marqueeFontSize }}>
                     <span className="mx-20">{room.marqueeMessage || "*** THÔNG TIN TRÊN MÀN HÌNH CHỈ MANG TÍNH CHẤT THAM KHẢO ***"}</span>
                     <span className="mx-20">{room.marqueeMessage || "*** THÔNG TIN TRÊN MÀN HÌNH CHỈ MANG TÍNH CHẤT THAM KHẢO ***"}</span>
                 </div>
            </div>
            <style>{`@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } } .animate-marquee { animation: marquee 30s linear infinite; }`}</style>
        </div>
    );
};
