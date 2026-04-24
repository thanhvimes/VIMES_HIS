
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQueue } from '../../context/QueueContext';
import { DEFAULT_ADS } from '../../context/QueueContext';
import { PatientStatus, Patient } from '../../types';
import { DEPARTMENTS } from '../../constants';
import { getTemplate, TEMPLATE_STORAGE_KEY } from '../../data/displayTemplates';

interface StandardDisplayProps {
  onBack: () => void;
}

/* ──────────────────────────────────────────────────────────── */
/*  Flip-tile animation for individual characters               */
/* ──────────────────────────────────────────────────────────── */
const FlipChar: React.FC<{ char: string; delay?: number }> = ({ char, delay = 0 }) => {
  const [displayed, setDisplayed] = useState(char);
  const [flipping, setFlipping] = useState(false);
  const prevRef = useRef(char);

  useEffect(() => {
    if (char !== prevRef.current) {
      setFlipping(true);
      const t = setTimeout(() => {
        setDisplayed(char);
        prevRef.current = char;
        setFlipping(false);
      }, 220);
      return () => clearTimeout(t);
    }
  }, [char]);

  return (
    <span className="inline-block" style={{ perspective: '200px', animationDelay: `${delay}ms` }}>
      <span style={{
          display: 'inline-block',
          transition: flipping ? 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          transform: flipping ? 'rotateX(-90deg)' : 'rotateX(0deg)',
          transformOrigin: '50% 50%',
        }}>
        {displayed}
      </span>
    </span>
  );
};

const FlipText: React.FC<{ value: string; className?: string }> = ({ value, className }) => {
  const safeValue = typeof value === 'string' ? value : String(value || '');
  return (
    <span className={className}>
      {safeValue.split('').map((char, i) => (
        <FlipChar key={i} char={char} delay={i * 30} />
      ))}
    </span>
  );
};

const LiveDot = ({ color = '#10b981' }) => (
  <span className="relative flex h-3 w-3">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: color }} />
    <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: color }} />
  </span>
);

const DEMO_PATIENTS: Patient[] = [
  { id: 'd1', code: 'K-001', name: 'Nguyễn Văn An', age: 45, birthYear: 1979, gender: 'Nam', reason: 'Khám nội tổng quát', status: PatientStatus.SERVING,  isPriority: false, timestamp: Date.now() - 5000 },
  { id: 'd2', code: 'K-002', name: 'Trần Thị Bình', age: 72, birthYear: 1952, gender: 'Nữ', reason: 'Tái khám tim mạch',  status: PatientStatus.WAITING,  isPriority: true,  timestamp: Date.now() - 4000 },
  { id: 'd3', code: 'K-003', name: 'Lê Hoàng Cường', age: 34, birthYear: 1990, gender: 'Nam', reason: 'Khám hô hấp',        status: PatientStatus.WAITING,  isPriority: false, timestamp: Date.now() - 3000 },
  { id: 'd4', code: 'K-004', name: 'Phạm Thị Dung',  age: 58, birthYear: 1966, gender: 'Nữ', reason: 'Khám định kỳ',       status: PatientStatus.WAITING,  isPriority: false, timestamp: Date.now() - 2000 },
];

export const StandardDisplay: React.FC<StandardDisplayProps> = ({ onBack }) => {
  const queueContext = useQueue();
  
  /* Safe mapping of context values */
  const livePatients = queueContext?.patients || [];
  const room = queueContext?.room;
  const liveCurrentPatient = queueContext?.currentPatient || null;
  const adMedia = queueContext?.adMedia || [];

  const [templateId, setTemplateId] = useState<string>(() => localStorage.getItem(TEMPLATE_STORAGE_KEY) || 'airport-dark');
  const template = useMemo(() => getTemplate(templateId), [templateId]);

  useEffect(() => {
    const handleTemplateChange = (e: any) => { if (e.detail) setTemplateId(e.detail); };
    window.addEventListener('qms-template-change', handleTemplateChange as any);
    return () => window.removeEventListener('qms-template-change', handleTemplateChange as any);
  }, []);

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [calledFlash, setCalledFlash] = useState(false);
  const prevCalledId = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const patients = isDemoMode ? DEMO_PATIENTS : livePatients;
  const currentPatient = isDemoMode
    ? DEMO_PATIENTS.find(p => p.status === PatientStatus.SERVING)
    : liveCurrentPatient;

  useEffect(() => {
    const cid = currentPatient?.id;
    if (cid && cid !== prevCalledId.current) {
      prevCalledId.current = cid;
      setCalledFlash(true);
      const t = setTimeout(() => setCalledFlash(false), 2400);
      return () => clearTimeout(t);
    }
  }, [currentPatient?.id]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen().catch(() => {});
    else document.exitFullscreen().catch(() => {});
  };

  const screenTypeLabel = useMemo(() => {
    if (!room || !room.id) return 'PHÒNG KHÁM';
    const dept = (DEPARTMENTS || []).find(d => d.id === room.departmentId || (d.rooms && d.rooms.some(r => r.id === room.id)));
    const type = dept?.type || 'CLINIC';
    const labels: Record<string, string> = { LAB: 'LẤY MẪU XÉT NGHIỆM', IMAGING: 'CHẨN ĐOÁN HÌNH ẢNH', PHARMACY: 'CẤP PHÁT THUỐC', RECEPTION: 'LỄ TÂN / ĐĂNG KÝ' };
    return labels[type] || 'PHÒNG KHÁM BỆNH';
  }, [room]);

  const waiting = useMemo(() => patients
    .filter(p => p.status === PatientStatus.WAITING || p.status === PatientStatus.CONCLUSION)
    .sort((a, b) => (a.isPriority ? -1 : 1) - (b.isPriority ? -1 : 1) || (a.timestamp || 0) - (b.timestamp || 0))
  , [patients]);

  const completed = useMemo(() => patients.filter(p => p.status === PatientStatus.COMPLETED).slice(-3).reverse(), [patients]);

  const isIdle = !isDemoMode && !currentPatient && waiting.length === 0;
  const showAds = !isDemoMode && (!room?.isActive || isIdle);
  
  const activePlaylist = (adMedia && adMedia.length > 0) ? adMedia : DEFAULT_ADS;
  const currentAd = activePlaylist[currentAdIndex] as any;

  useEffect(() => {
    if (!showAds || activePlaylist.length <= 1) return;
    const t = setInterval(() => setCurrentAdIndex(p => (p + 1) % activePlaylist.length), 10000);
    return () => clearInterval(t);
  }, [showAds, activePlaylist.length]);

  const s = template.styles;
  const message = room?.marqueeMessage || `Kính mời quý bệnh nhân chú ý theo dõi số thứ tự. Vui lòng ngồi đợi tại khu vực chờ • ${room?.name} • ${room?.doctorName ? 'BS. ' + room.doctorName : ''}`;

  if (!room) return <div className="h-screen bg-black text-white p-20 font-bold">Vui lòng khởi tạo QueueContext...</div>;

  return (
    <>
      {template.layout === 'classic' ? (
        <div ref={containerRef} className="h-screen flex flex-col font-sans select-none overflow-hidden bg-[#f8fafc]">
          {/* Ads overlay */}
          {showAds && (
            <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center p-20 text-center bg-white">
                 {currentAd?.icon && <div className="text-[10rem] opacity-10 mb-8 animate-pulse text-blue-900">{currentAd.icon}</div>}
                 <h2 className="text-5xl font-black text-amber-500 uppercase tracking-widest mb-6">{currentAd?.title || 'ĐANG CHỜ BỆNH NHÂN'}</h2>
                 <button onClick={onBack} className="absolute right-8 top-8 px-6 py-3 border-2 border-slate-300 text-slate-500 font-bold rounded-xl">Đóng</button>
            </div>
          )}

          {/* Top Header */}
          <div className="flex justify-between items-center px-10 py-5 bg-white">
            <div className="font-bold text-2xl text-slate-800 tracking-wider w-1/4">
              <span className="block text-xl">{currentTime.toLocaleDateString('vi-VN')}</span>
              <span className="block text-3xl mt-1 font-black"><FlipText value={currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} /></span>
            </div>
            <div className="w-2/4 text-center">
               <div className="text-[3rem] font-black uppercase tracking-widest text-[#1e3a8a]">{room.customDisplayName || room.name}</div>
            </div>
            <div className="w-1/4 flex justify-end gap-3 pointer-events-auto">
              <button onClick={() => setIsDemoMode(p => !p)} className={`w-14 h-14 rounded-xl border-2 text-2xl font-bold flex items-center justify-center transition-all ${isDemoMode ? 'bg-amber-100 text-amber-600 border-amber-400' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>🎭</button>
              <button onClick={toggleFullscreen} className="w-14 h-14 rounded-xl border-2 text-xl font-bold flex items-center justify-center bg-slate-50 text-slate-400 border-slate-200">⛶</button>
              <button onClick={onBack} className="w-14 h-14 rounded-xl border-2 text-xl font-bold flex items-center justify-center bg-red-50 text-red-500 border-red-200">✕</button>
            </div>
          </div>

          <div className="w-full h-1 bg-slate-200"></div>

          {/* Calling Section (Red/Primary) */}
          <div className="mt-6 px-10 flex-shrink-0">
            <div className="flex rounded-t-xl overflow-hidden shadow-sm" style={{ background: s.callingNumberColor }}>
               <div className="w-[30%] py-4 text-center text-white font-black tracking-widest border-r border-white/30 truncate text-2xl lg:text-3xl xl:text-4xl">SỐ THỨ TỰ</div>
               <div className="w-[70%] py-4 text-center text-white font-black tracking-widest uppercase truncate text-2xl lg:text-3xl xl:text-4xl">NGƯỜI BỆNH ĐANG KHÁM</div>
            </div>
            <div className="flex border-2 border-t-0 rounded-b-xl overflow-hidden shadow-md bg-white relative transition-colors duration-500" style={{ borderColor: s.callingNumberColor, background: calledFlash ? s.callingBgFlash : 'white' }}>
               <div className="w-[30%] flex items-center justify-center py-6 lg:py-10 border-r border-slate-200 overflow-hidden">
                 {currentPatient ? (
                    <span className="font-black tracking-tighter leading-none text-[5rem] lg:text-[7rem] xl:text-[9rem] block w-full text-center" style={{ color: s.callingNumberColor }}>
                      <FlipText value={currentPatient.code} />
                    </span>
                 ) : (
                    <span className="font-black text-slate-200 text-[5rem] lg:text-[7rem] xl:text-[9rem] block w-full text-center">—</span>
                 )}
               </div>
               <div className="w-[70%] flex flex-col justify-center px-10 lg:px-16 py-6 lg:py-10 overflow-hidden min-w-0">
                 {currentPatient ? (
                   <div className="w-full min-w-0">
                     <div className="font-black uppercase leading-normal truncate text-4xl lg:text-5xl xl:text-6xl pt-2 lg:pt-3 pb-1" style={{ color: s.callingNumberColor }}>{currentPatient.name}</div>
                     <div className="flex items-center gap-6 mt-2 lg:mt-4">
                       <div className="font-bold uppercase truncate text-2xl lg:text-3xl xl:text-4xl pt-2 pb-1" style={{ color: s.callingNumberColor, opacity: 0.8 }}>
                         {(currentPatient.gender || 'Bệnh nhân').toUpperCase()} / {currentPatient.birthYear ? (new Date().getFullYear() - currentPatient.birthYear) : currentPatient.age} TUỔI
                       </div>
                     </div>
                   </div>
                 ) : (
                   <div className="font-black uppercase text-slate-300 truncate text-4xl lg:text-5xl xl:text-6xl">Chưa gọi</div>
                 )}
               </div>
            </div>
          </div>

          {/* Waiting Section (Blue/Secondary) */}
          <div className="mt-6 px-10 flex-1 flex flex-col pb-8 min-h-0">
            <div className="flex rounded-t-xl overflow-hidden shadow-sm" style={{ background: s.rowNumberColor }}>
               <div className="w-[30%] py-4 text-center text-white font-black tracking-widest border-r border-white/30 truncate text-2xl lg:text-3xl xl:text-4xl">SỐ THỨ TỰ</div>
               <div className="w-[70%] py-4 text-center text-white font-black tracking-widest uppercase truncate text-2xl lg:text-3xl xl:text-4xl">NGƯỜI BỆNH ĐANG CHỜ</div>
            </div>
            <div className="flex-1 border-2 border-t-0 rounded-b-xl overflow-hidden shadow-md bg-white flex flex-col" style={{ borderColor: s.rowNumberColor }}>
              {waiting.length === 0 ? (
                 <div className="flex-1 flex items-center justify-center font-bold text-slate-300 text-3xl lg:text-5xl">Không có người chờ</div>
              ) : (
                 <div className="flex-1 flex flex-col">
                   {waiting.slice(0, 3).map((p, idx) => (
                     <div key={p.id} className="flex-1 flex items-center border-b border-slate-200">
                        <div className="w-[30%] flex items-center justify-center border-r border-slate-200 h-full overflow-hidden">
                           <span className="font-bold tracking-tighter text-[4rem] lg:text-[5.5rem] xl:text-[6.5rem] block w-full text-center" style={{ fontFamily: 'monospace', color: s.rowNumberColor }}>{p.code}</span>
                        </div>
                        <div className="w-[70%] flex items-center justify-between px-10 lg:px-16 h-full overflow-hidden min-w-0">
                           <div className="flex flex-col justify-center w-full min-w-0">
                              <div className="font-bold uppercase leading-normal truncate text-3xl lg:text-4xl xl:text-5xl pt-2 lg:pt-3 pb-1" style={{ color: s.rowNumberColor }}>{p.name}</div>
                              <div className="font-bold mt-1 uppercase truncate text-xl lg:text-2xl xl:text-3xl pt-2 pb-1" style={{ color: s.rowNumberColor, opacity: 0.7 }}>
                                 {(p.gender || 'Bệnh nhân').toUpperCase()} / {p.birthYear ? (new Date().getFullYear() - p.birthYear) : p.age} TUỔI
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                   {/* Fill empty spaces if waiting < 3 */}
                   {Array.from({ length: Math.max(0, 3 - waiting.length) }).map((_, idx) => (
                     <div key={`empty-${idx}`} className="flex-1 flex items-center border-b border-slate-100 bg-slate-50 opacity-50">
                        <div className="w-[30%] border-r border-slate-100 h-full"></div>
                        <div className="w-[70%]"></div>
                     </div>
                   ))}
                 </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="h-screen flex flex-col overflow-hidden select-none" style={{ background: s.bgColor, color: s.rowNameColor, fontFamily: s.fontFamily }}>
      
      {/* ── HEADER ── */}
      <header className="flex-shrink-0 flex items-center justify-between border-b px-8" style={{ height: '90px', background: s.headerBg, borderColor: s.headerBorder, color: s.headerTextColor }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/20 bg-blue-500/10">
            <svg className="w-7 h-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <div className="text-[10px] font-black tracking-widest uppercase opacity-60">{screenTypeLabel}</div>
            <h1 className="text-2xl font-black uppercase tracking-tight leading-none">{room.customDisplayName || room.name}</h1>
            {room.doctorName && <p className="text-xs font-semibold mt-1 opacity-50 uppercase">BS. {room.doctorName}</p>}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-3 px-5 py-2.5 rounded-xl border" style={{ background: room.isActive ? s.activeBadgeBg : 'rgba(239,68,68,0.1)', borderColor: room.isActive ? s.activeBadgeBorder : 'rgba(239,68,68,0.3)' }}>
            <LiveDot color={room.isActive ? s.activeBadgeText : '#ef4444'} />
            <span className="text-sm font-black tracking-widest uppercase" style={{ color: room.isActive ? s.activeBadgeText : '#f87171' }}>{room.isActive ? 'Đang hoạt động' : 'Tạm ngưng'}</span>
          </div>
          <div className="text-right ml-4">
            <div className="text-4xl font-mono font-black tabular-nums tracking-tighter">
              <FlipText value={currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} />
            </div>
            <div className="text-[10px] font-bold uppercase opacity-40 mt-0.5">{currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
          <div className="flex gap-2 ml-2">
            <button onClick={() => setIsDemoMode(p => !p)} className={`w-10 h-10 rounded-lg border text-lg transition-all ${isDemoMode ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-white/5 border-white/10 text-slate-500'}`}>🎭</button>
            <button onClick={toggleFullscreen} className="w-10 h-10 rounded-lg border border-white/10 bg-white/5 text-slate-500 text-lg">⛶</button>
            <button onClick={onBack} className="w-10 h-10 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-lg">✕</button>
          </div>
        </div>
      </header>

      {/* ── TICKER ── */}
      <div className="flex-shrink-0 h-9 flex items-center px-4 gap-4 border-b overflow-hidden" style={{ background: s.tickerBg, borderColor: s.headerBorder }}>
        <span className="flex-shrink-0 text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded border" style={{ background: s.tickerAccentBg, color: s.tickerAccentText, borderColor: s.tickerAccentText + '40' }}>Thông báo</span>
        <div className="overflow-hidden whitespace-nowrap w-full">
          <span className="font-bold tracking-widest text-lg uppercase animate-marquee inline-block" style={{ color: s.tickerTextColor, animationDuration: '30s' }}>{message}&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;{message}</span>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Calling Section */}
        <div className="flex-1 flex flex-col border-r relative" style={{ borderColor: s.headerBorder }}>
          {showAds ? (
             <div className="absolute inset-0 bg-black flex flex-col items-center justify-center p-20 text-center z-50">
               {currentAd?.icon && <div className="text-[10rem] opacity-10 mb-8 animate-pulse text-white">{currentAd.icon}</div>}
               <h2 className="text-5xl font-black text-amber-300 uppercase tracking-[0.2em] mb-6">{currentAd?.title || 'ĐANG CHỜ BỆNH NHÂN'}</h2>
               <p className="text-xl text-slate-500 max-w-4xl">{currentAd?.desc || 'Vui lòng chuẩn bị sẵn thẻ khám bệnh'}</p>
             </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center transition-colors duration-500" style={{ background: calledFlash ? s.callingBgFlash : 'transparent' }}>
              {currentPatient ? (
                <>
                  <div className="text-[14rem] font-black font-mono leading-none tracking-tighter" style={{ color: calledFlash ? s.tickerAccentText : s.callingNumberColor, textShadow: s.callingNumberGlow }}>
                    <FlipText value={currentPatient.code} />
                  </div>
                  <div className="mt-8 text-center px-10">
                    <h2 className="text-5xl font-black uppercase tracking-widest mb-4" style={{ color: s.rowNameColor }}>{currentPatient.name}</h2>
                    <div className="flex items-center justify-center gap-5">
                      <span className="text-2xl font-mono opacity-50 uppercase">Năm sinh: {currentPatient.birthYear || (new Date().getFullYear() - (currentPatient.age || 0))}</span>
                      {currentPatient.isPriority && <span className="px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/40 text-sm font-black tracking-widest uppercase">⭐ Ưu tiên</span>}
                    </div>
                    {currentPatient.reason && <div className="mt-8 px-6 py-2 rounded-xl border text-xl font-bold font-mono inline-block" style={{ background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.2)', color: s.rowNumberColor }}>{currentPatient.reason}</div>}
                  </div>
                </>
              ) : (
                <div className="opacity-10 scale-150 flex flex-col items-center gap-4">
                  <svg className="w-48 h-48" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  <p className="text-4xl font-black uppercase tracking-[0.3em]">Chờ gọi số</p>
                </div>
              )}
            </div>
          )}
          {completed.length > 0 && (
              <div className="h-16 flex items-center px-8 border-t gap-6 overflow-hidden opacity-40 grayscale" style={{ borderColor: s.headerBorder, background: 'rgba(0,0,0,0.2)' }}>
                <span className="text-[10px] font-black tracking-widest uppercase text-slate-500">Vừa khám xong:</span>
                {completed.map(p => <div key={p.id} className="flex items-center gap-3"><span className="font-mono font-bold text-lg line-through text-emerald-500">{p.code}</span><span className="text-xs uppercase font-medium">{p.name}</span></div>)}
              </div>
          )}
        </div>

        {/* Sidebar Section */}
        <div className="w-[420px] flex flex-col" style={{ background: s.sidebarBg }}>
          <div className="h-14 flex items-center justify-between px-6 border-b" style={{ borderColor: s.sidebarBorder }}>
            <span className="text-[11px] font-black tracking-widest uppercase opacity-40">Danh sách chờ</span>
            <span className="text-[11px] font-black border px-2 py-0.5 rounded-lg opacity-40" style={{ borderColor: s.sidebarBorder }}>{waiting.length} BN</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {waiting.slice(0, 10).map((p, i) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-5 border-b transition-all duration-300" style={{ 
                  borderColor: s.sidebarBorder, 
                  background: i % 2 === 0 ? s.rowEvenBg : 'transparent',
                  borderLeft: i === 0 ? `4px solid ${s.rowFirstBorderColor}` : '4px solid transparent'
                }}>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-black font-mono tracking-tighter" style={{ color: i === 0 ? s.rowFirstNumberColor : s.rowNumberColor }}>{p.code}</span>
                  <div>
                    <div className="font-bold text-lg leading-tight uppercase truncate max-w-[180px]" style={{ color: s.rowNameColor }}>{p.name}</div>
                    <div className="text-[10px] font-bold opacity-40 mt-1 uppercase">Năm sinh: {p.birthYear || (new Date().getFullYear() - (p.age || 0))}</div>
                  </div>
                </div>
                {p.isPriority && <span className="text-[9px] font-black px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded border border-amber-500/30 uppercase">UT</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-9 flex items-center justify-between px-8 border-t text-[10px] font-bold tracking-widest opacity-30 uppercase" style={{ background: s.bottomBg, borderColor: s.headerBorder, color: s.bottomText }}>
        <span>vClinic QMS • {room.name}</span>
        <span>© 2026 MediTech Solutions</span>
      </footer>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-block; animation: marquee linear infinite; }
      `}</style>
    </div>
    )}
    </>
  );
};
