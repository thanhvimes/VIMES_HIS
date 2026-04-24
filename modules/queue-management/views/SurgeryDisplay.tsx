import React, { useState, useEffect, useRef } from 'react';
import { getTemplate, TEMPLATE_STORAGE_KEY } from '../data/displayTemplates';

interface SurgeryDisplayProps {
  onBack: () => void;
}

interface SurgeryItem {
  id: string;
  stt: number;
  patientName: string;
  birthYear: number;
  surgeryName: string;
  roomName: string;
  surgeon: string;
  startTime: string;
  expectedTime: string;
  endTime: string | null;
  status: 'PREPARING' | 'OPERATING' | 'RECOVERY' | 'COMPLETED';
}

const MOCK_SURGERIES: SurgeryItem[] = [
  { id: '1', stt: 1, patientName: 'Nguyễn Văn A', birthYear: 1980, surgeryName: 'Mổ ruột thừa nội soi', roomName: 'PM 01', surgeon: 'BS. Lê Minh', startTime: '08:00', expectedTime: '10:00', endTime: '10:15', status: 'COMPLETED' },
  { id: '2', stt: 2, patientName: 'Trần Thị B', birthYear: 1992, surgeryName: 'Mổ lấy thai lần 2', roomName: 'PM 02', surgeon: 'BS. Phạm Hùng', startTime: '09:30', expectedTime: '11:00', endTime: null, status: 'RECOVERY' },
  { id: '3', stt: 3, patientName: 'Hoàng Quốc C', birthYear: 1975, surgeryName: 'Thay khớp gối nhân tạo', roomName: 'PM 03', surgeon: 'BS. Trần Cường', startTime: '10:00', expectedTime: '14:00', endTime: null, status: 'OPERATING' },
  { id: '4', stt: 4, patientName: 'Lê Thu D', birthYear: 1988, surgeryName: 'Cắt túi mật nội soi', roomName: 'PM 01', surgeon: 'BS. Lê Minh', startTime: '10:45', expectedTime: '12:30', endTime: null, status: 'OPERATING' },
  { id: '5', stt: 5, patientName: 'Phạm Đức E', birthYear: 1965, surgeryName: 'Tán sỏi thận laser', roomName: 'PM 04', surgeon: 'BS. Ngô Quang', startTime: '12:00', expectedTime: '13:30', endTime: null, status: 'PREPARING' },
  { id: '6', stt: 6, patientName: 'Bùi Thị F', birthYear: 2000, surgeryName: 'Chỉnh hình vách ngăn', roomName: 'PM 02', surgeon: 'BS. Vũ An', startTime: '13:30', expectedTime: '15:00', endTime: null, status: 'PREPARING' },
  { id: '7', stt: 7, patientName: 'Đặng Văn G', birthYear: 1995, surgeryName: 'Mổ kết hợp xương đùi', roomName: 'PM 03', surgeon: 'BS. Trần Cường', startTime: '14:00', expectedTime: '16:00', endTime: null, status: 'PREPARING' },
  { id: '8', stt: 8, patientName: 'Vũ Thị H', birthYear: 1982, surgeryName: 'Cắt Amidan', roomName: 'PM 01', surgeon: 'BS. Lê Minh', startTime: '14:30', expectedTime: '15:30', endTime: null, status: 'PREPARING' },
  { id: '9', stt: 9, patientName: 'Lý Quốc I', birthYear: 1970, surgeryName: 'Mổ thay thủy tinh thể', roomName: 'PM 05', surgeon: 'BS. Đào Huy', startTime: '15:00', expectedTime: '15:45', endTime: null, status: 'PREPARING' },
  { id: '10', stt: 10, patientName: 'Trịnh Xuân K', birthYear: 1968, surgeryName: 'Cắt trĩ Longo', roomName: 'PM 04', surgeon: 'BS. Ngô Quang', startTime: '15:30', expectedTime: '16:30', endTime: null, status: 'PREPARING' },
];

const ITEMS_PER_PAGE = 7;
const PAGE_DURATION = 10000; // 10 seconds per page

// Helper: Mask patient name for medical privacy (e.g. Nguyễn Văn Tài -> Nguyễn *** Tài)
const maskPatientName = (name: string) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length <= 2) {
    // If only 1 or 2 words, maybe mask the last part partially, but for simplicity keep it or mask chars
    if (parts.length === 2) return `${parts[0]} ${parts[1].charAt(0)}***`;
    return name;
  }
  // Mask middle words
  return `${parts[0]} *** ${parts[parts.length - 1]}`;
};

export const SurgeryDisplay: React.FC<SurgeryDisplayProps> = ({ onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState(getTemplate());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Auto pagination
    const totalPages = Math.ceil(MOCK_SURGERIES.length / ITEMS_PER_PAGE);
    const pageTimer = setInterval(() => {
       if (totalPages > 1) {
           setCurrentPage(prev => (prev >= totalPages ? 1 : prev + 1));
       }
    }, PAGE_DURATION);
    
    // Load template
    const savedTemplateId = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (savedTemplateId) {
      setTemplate(getTemplate(savedTemplateId));
    }

    // Listen for template changes from other tabs (Settings)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TEMPLATE_STORAGE_KEY) setTemplate(getTemplate(e.newValue || undefined));
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(timer);
      clearInterval(pageTimer);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const totalSurgeries = MOCK_SURGERIES.length;
  const totalPages = Math.ceil(totalSurgeries / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleSurgeries = MOCK_SURGERIES.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch((err) => console.error("Fullscreen error", err));
    } else {
      document.exitFullscreen();
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PREPARING': return { text: 'CHỜ PHẪU THUẬT', color: '#fbbf24', border: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
      case 'OPERATING': return { text: 'ĐANG PHẪU THUẬT', color: '#f87171', border: '#dc2626', bg: 'rgba(239,68,68,0.1)' };
      case 'RECOVERY': return { text: 'TD HẬU PHẪU', color: '#c084fc', border: '#9333ea', bg: 'rgba(168,85,247,0.1)' };
      case 'COMPLETED': return { text: 'CHUYỂN KHOA', color: '#34d399', border: '#10b981', bg: 'rgba(16,185,129,0.1)' };
      default: return { text: 'CHƯA RÕ', color: '#cbd5e1', border: '#94a3b8', bg: 'transparent' };
    }
  };

  const s = template.styles;

  // Render Classic Layout
  if (template.layout === 'classic') {
    return (
      <div ref={containerRef} className="h-screen flex flex-col font-sans select-none overflow-hidden bg-white">
        <div className="flex-shrink-0 flex items-center justify-between h-[120px] bg-white border-b border-slate-300 shadow-sm px-10 relative z-20">
            <div>
              <h1 className="text-[3rem] font-black tracking-widest uppercase" style={{ color: s.headerTextColor }}>DANH SÁCH BỆNH NHÂN PHẪU THUẬT</h1>
              <div className="flex items-center gap-4 mt-1">
                 <p className="text-xl font-bold text-slate-500 uppercase">Dành cho Thân nhân chờ tại sảnh</p>
                 {totalPages > 1 && (
                    <span className="px-3 py-1 bg-slate-100 border border-slate-300 text-slate-600 font-bold rounded-lg text-sm uppercase tracking-widest shadow-inner inline-flex gap-1 animate-pulse">
                        Trang {currentPage} / {totalPages}
                    </span>
                 )}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-3xl font-black text-slate-800 leading-none">{currentTime.toLocaleTimeString('vi-VN')}</div>
                <div className="text-lg font-bold text-slate-500 uppercase mt-1">{currentTime.toLocaleDateString('vi-VN')}</div>
              </div>
              <div className="h-12 w-[2px] bg-slate-200"></div>
              <button onClick={toggleFullscreen} className="w-14 h-14 rounded-full border-2 text-2xl font-bold flex items-center justify-center bg-slate-50 text-slate-400 border-slate-200">⛶</button>
              <button onClick={onBack} className="w-14 h-14 rounded-full border-2 text-2xl font-bold flex items-center justify-center bg-red-50 text-red-500 border-red-200">✕</button>
            </div>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col" style={{ background: s.bgColor }}>
           {/* Classic Table Header */}
           <div className="flex text-white font-black uppercase tracking-widest text-lg lg:text-xl xl:text-2xl py-6 px-4 shadow-md" style={{ background: s.callingNumberColor }}>
              <div className="w-[5%] text-center">STT</div>
              <div className="w-[20%]">HỌ TÊN NGƯỜI BỆNH</div>
              <div className="w-[5%] text-center">NS</div>
              <div className="w-[20%]">PHẪU THUẬT / EKIP</div>
              <div className="w-[10%] text-center">P.MỔ</div>
              <div className="w-[10%] text-center">B.ĐẦU</div>
              <div className="w-[10%] text-center">D.KIẾN</div>
              <div className="w-[20%] pl-8">TRẠNG THÁI</div>
           </div>
           
           {/* Table Body */}
           <div className="flex-1 overflow-hidden bg-slate-50/50 relative">
              <div key={currentPage} className="absolute inset-0 flex flex-col justify-start animate-[fadeIn_0.5s_ease-out]">
                {visibleSurgeries.map((item, idx) => {
                  const status = getStatusDisplay(item.status);
                  const isEven = idx % 2 === 0;
                return (
                  <div key={item.id} className="flex items-center py-6 px-4 border-b-2 border-slate-200" style={{ background: isEven ? '#ffffff' : '#f8fafc' }}>
                    <div className="w-[5%] text-center font-black text-3xl" style={{ color: s.rowNumberColor }}>{item.stt}</div>
                    <div className="w-[20%] font-black uppercase text-2xl lg:text-3xl xl:text-4xl" style={{ color: s.rowNameColor }}>{item.patientName}</div>
                    <div className="w-[5%] text-center font-bold text-xl text-slate-500">{item.birthYear}</div>
                    <div className="w-[20%] pr-4">
                      <div className="font-bold text-xl uppercase truncate text-slate-700">{item.surgeryName}</div>
                      <div className="font-bold text-slate-500 mt-1 tracking-wider">{item.surgeon}</div>
                    </div>
                    <div className="w-[10%] text-center">
                       <span className="inline-block px-3 py-1 bg-slate-200 text-slate-800 font-bold rounded-lg text-xl">{item.roomName}</span>
                    </div>
                    <div className="w-[10%] text-center font-black font-mono text-2xl text-slate-600">{item.startTime}</div>
                    <div className="w-[10%] text-center font-black font-mono text-2xl text-slate-600">{item.expectedTime}</div>
                    <div className="w-[20%] pl-8">
                       <div className="inline-flex items-center gap-3 px-4 py-2 border-2 rounded-xl" style={{ borderColor: status.border, background: status.bg }}>
                          {item.status === 'OPERATING' && <span className="w-3 h-3 rounded-full animate-ping" style={{ background: status.color }}></span>}
                          <span className="font-black tracking-widest text-xl whitespace-nowrap" style={{ color: status.color }}>{status.text}</span>
                       </div>
                    </div>
                  </div>
                );
              })}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Render Modern Layout (e.g. Airport, Galaxy, etc)
  return (
    <div ref={containerRef} className="h-screen flex flex-col font-sans select-none overflow-hidden transition-all duration-1000" 
         style={{ background: s.bgColor, color: s.headerTextColor, fontFamily: s.fontFamily }}>
      
      {/* Top Header */}
      <header className="flex-shrink-0 flex items-stretch justify-between border-b z-20"
        style={{ borderColor: s.headerBorder, background: s.headerBg, height: '100px' }}>
        
        <div className="flex items-center gap-6 px-8 h-full">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center border-2 shadow-sm" style={{ borderColor: s.headerBorder, background: s.bgColor }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" style={{ color: s.headerTextColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-4 mb-1">
               <div className="text-xs tracking-[0.4em] font-black uppercase" style={{ color: s.headerSubColor }}>BẢNG THEO DÕI ĐIỆN TỬ</div>
               {totalPages > 1 && (
                  <span className="px-2 py-0.5 border font-bold rounded text-[10px] uppercase tracking-widest shadow-sm inline-flex gap-1 animate-pulse" style={{ borderColor: s.headerBorder, color: s.headerTextColor, background: 'rgba(255,255,255,0.15)' }}>
                      Trang {currentPage} / {totalPages}
                  </span>
               )}
            </div>
            <h1 className="text-[2rem] font-black tracking-tight leading-none uppercase" style={{ color: s.headerTextColor }}>LỊCH TRÌNH PHẪU THUẬT</h1>
          </div>
        </div>

        <div className="flex items-center gap-8 h-full px-8 border-l" style={{ borderColor: s.headerBorder, background: s.headerBg }}>
           <div className="text-right">
             <div className="text-[2.5rem] font-black font-mono leading-none tracking-tighter" style={{ color: s.headerTextColor }}>{currentTime.toLocaleTimeString('vi-VN')}</div>
             <div className="text-sm font-bold tracking-[0.2em] uppercase mt-1" style={{ color: s.headerSubColor }}>{currentTime.toLocaleDateString('vi-VN')}</div>
           </div>
           <button onClick={toggleFullscreen} className="w-14 h-14 rounded-xl flex items-center justify-center transition-colors border font-bold text-2xl shadow-sm" style={{ borderColor: s.headerBorder, color: s.headerTextColor, background: s.bgColor }}>⛶</button>
           <button onClick={onBack} className="w-14 h-14 rounded-xl flex items-center justify-center transition-colors border font-bold text-2xl shadow-sm" style={{ borderColor: '#fca5a5', color: '#ef4444', background: '#fef2f2' }}>✕</button>
        </div>
      </header>

      {/* Modern Table Layout */}
      <div className="flex-1 overflow-hidden flex flex-col p-8">
        <div className="w-full flex-1 flex flex-col border rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md" 
             style={{ borderColor: s.sidebarBorder, background: s.sidebarBg }}>
            
            {/* Table Header */}
            <div className="flex px-6 py-5 border-b shadow-sm" style={{ borderColor: s.sidebarBorder, background: s.headerBg, color: s.headerTextColor }}>
                <div className="w-[6%] text-center text-xs font-black tracking-widest uppercase opacity-70">STT</div>
                <div className="w-[22%] text-xs font-black tracking-widest uppercase opacity-70">NGƯỜI BỆNH</div>
                <div className="w-[8%] text-center text-xs font-black tracking-widest uppercase opacity-70 truncate">NĂM SINH</div>
                <div className="w-[26%] text-xs font-black tracking-widest uppercase opacity-70">PHẪU THUẬT & TRƯỞNG EKIP</div>
                <div className="w-[8%] text-center text-xs font-black tracking-widest uppercase opacity-70">P.MỔ</div>
                <div className="w-[12%] text-center text-xs font-black tracking-widest uppercase opacity-70">BẮT ĐẦU - DỰ KIẾN</div>
                <div className="w-[18%] text-center text-xs font-black tracking-widest uppercase opacity-70">TRẠNG THÁI HIỆN TẠI</div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-hidden relative">
              <div key={currentPage} className="absolute inset-0 flex flex-col justify-start animate-[fadeIn_0.5s_ease-out]">
                {visibleSurgeries.map((item, idx) => {
                  const status = getStatusDisplay(item.status);
                  const isEven = idx % 2 === 0;
                  const isOperating = item.status === 'OPERATING';
                  
                  return (
                    <div key={item.id} className="flex items-center px-6 py-6 border-b transition-colors relative" 
                         style={{ 
                            borderColor: s.sidebarBorder, 
                            background: isEven ? s.rowEvenBg : 'transparent',
                            backgroundColor: isOperating ? s.callingBgFlash : undefined
                         }}>
                      
                      {/* Left highlight bar for active surgery */}
                      {isOperating && (
                         <div className="absolute left-0 top-0 bottom-0 w-2" style={{ background: s.callingNumberColor }}></div>
                      )}

                      <div className="w-[6%] text-center font-black font-mono text-3xl" style={{ color: isOperating ? s.callingNumberColor : s.rowFirstNumberColor }}>
                         {item.stt.toString().padStart(2, '0')}
                      </div>
                      
                      <div className="w-[22%]">
                         <div className="font-black uppercase tracking-wide text-2xl lg:text-3xl" style={{ color: s.rowNameColor }}>{item.patientName}</div>
                      </div>
                      
                      <div className="w-[8%] text-center font-bold text-xl" style={{ color: s.rowSubColor }}>
                         {item.birthYear}
                      </div>

                      <div className="w-[26%] pr-4">
                         <div className="font-bold text-xl uppercase truncate" style={{ color: s.rowNameColor }}>{item.surgeryName}</div>
                         <div className="font-bold mt-1 text-sm tracking-wider" style={{ color: s.rowSubColor }}>{item.surgeon}</div>
                      </div>

                      <div className="w-[8%] text-center">
                         <span className="inline-block px-3 py-1 font-black rounded text-lg border shadow-sm" 
                               style={{ borderColor: s.sidebarBorder, color: s.rowNameColor, background: s.bgColor }}>
                            {item.roomName}
                         </span>
                      </div>

                      <div className="w-[12%] text-center font-bold mt-1">
                         <div className="text-xl font-mono" style={{ color: s.rowNameColor }}>{item.startTime} <span className="opacity-50">→</span> {item.expectedTime}</div>
                      </div>

                      <div className="w-[18%] flex justify-center">
                         <div className="inline-flex items-center justify-center min-w-[200px] gap-3 px-5 py-2.5 border-2 rounded-xl relative overflow-hidden" 
                              style={{ borderColor: status.border, background: status.bg }}>
                            {isOperating && <span className="absolute inset-0 opacity-20 animate-pulse" style={{ background: status.color }}></span>}
                            {isOperating && <span className="w-3 h-3 rounded-full animate-ping shadow-[0_0_10px_2px_rgba(255,100,100,0.5)]" style={{ background: status.color }}></span>}
                            <span className="font-black tracking-widest uppercase text-lg relative z-10" style={{ color: status.color }}>{status.text}</span>
                         </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
        </div>
      </div>

    </div>
  );
};
