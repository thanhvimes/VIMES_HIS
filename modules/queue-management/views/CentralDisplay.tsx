
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Room, Patient, PatientStatus } from '../types';
import { DEPARTMENTS } from '../constants.tsx';
import { DEFAULT_ADS } from '../context/QueueContext';
import { queueService } from '../data/queueService';
import { socketService } from '../../../services/socketService';
import { subscribeToUpdates, subscribeToAudioTriggers } from '../data/syncService';
import { announcePatient } from '../data/audioService';
import { getTemplate, TEMPLATE_STORAGE_KEY } from '../data/displayTemplates';

interface CentralDisplayProps {
  onBack: () => void;
}

interface RoomSummary {
  room: Room;
  currentPatient: Patient | null;
  waitingCount: number;
}

interface AudioQueueItem {
  roomId: string;
  patientName: string;
  roomName: string;
  code: string;
}

/* ─── Scanline overlay ─────────────────────────────────────── */
const Scanline = () => (
  <div className="pointer-events-none fixed inset-0 z-[200] opacity-[0.025]"
    style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,#000 2px,#000 4px)' }} />
);

/* ─── Blinking live dot ─────────────────────────────────────── */
const LiveDot: React.FC<{ color?: string }> = ({ color = '#34d399' }) => (
  <span className="relative flex h-3 w-3">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
      style={{ background: color }} />
    <span className="relative inline-flex rounded-full h-3 w-3" style={{ background: color }} />
  </span>
);

/* ─── Ticker ─────────────────────────────────────────────────── */
const Ticker: React.FC<{ message: string; template: any }> = ({ message, template }) => (
  <div className="overflow-hidden whitespace-nowrap w-full h-full flex items-center">
    <span className="font-bold tracking-widest text-lg uppercase animate-marquee"
      style={{ 
        animationDuration: `${Math.max(14, message.length * 0.22)}s`,
        color: template.styles.tickerTextColor 
      }}>
      {message}&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;{message}&nbsp;&nbsp;&nbsp;✦&nbsp;&nbsp;&nbsp;{message}
    </span>
  </div>
);

/* ─── Flip number ─────────────────────────────────────────────── */
const FlipNumber: React.FC<{ value: string; size?: string; color?: string }> = ({
  value, size = '5rem', color = '#ffffff'
}) => {
  const [displayed, setDisplayed] = useState(value);
  const [flip, setFlip] = useState(false);
  const prev = useRef(value);

  useEffect(() => {
    if (value !== prev.current) {
      setFlip(true);
      const t = setTimeout(() => { setDisplayed(value); prev.current = value; setFlip(false); }, 200);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span style={{ display: 'inline-block', fontSize: size, fontFamily: 'monospace', fontWeight: 900, color,
      transition: flip ? 'transform 0.2s ease' : 'none',
      transform: flip ? 'rotateX(-90deg)' : 'rotateX(0deg)', letterSpacing: '-0.02em', transformOrigin: '50% 50%' }}>
      {displayed}
    </span>
  );
};

/* ─── Single room card ─────────────────────────────────────── */
const RoomCard: React.FC<{
  roomId: string;
  data: RoomSummary | undefined;
  isAnnouncing: boolean;
  compact: boolean;
  template: any;
}> = ({ roomId, data, isAnnouncing, compact, template }) => {
  const [flash, setFlash] = useState(false);
  const prevCode = useRef<string | null>(null);

  const code = data?.currentPatient?.code;
  useEffect(() => {
    if (code && code !== prevCode.current) {
      prevCode.current = code;
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 2500);
      return () => clearTimeout(t);
    }
  }, [code]);

  const active = data?.room?.isActive ?? false;
  const hasPatient = !!data?.currentPatient;
  const s = template.styles;

  return (
    <div
      className="relative flex flex-col overflow-hidden border transition-all duration-500 rounded-none"
      style={{
        borderColor: (flash || isAnnouncing) ? s.rowFirstBorderColor : s.sidebarBorder,
        background: flash
          ? s.callingBgFlash
          : (active ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)'),
        filter: active ? 'none' : 'grayscale(70%) opacity(0.5)',
        boxShadow: flash ? `0 0 40px ${s.rowFirstBorderColor}20 inset` : 'none',
      }}
    >
      {/* Calling flash bar */}
      {(flash || isAnnouncing) && (
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: s.rowFirstBorderColor, boxShadow: `0 0 20px ${s.rowFirstBorderColor}` }} />
      )}

      {/* Room name header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b"
        style={{ borderColor: s.sidebarBorder, background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex items-center gap-2">
          <LiveDot color={active ? s.activeBadgeText : '#ef4444'} />
          <span className="text-xs font-extrabold tracking-[0.2em] uppercase truncate" style={{ color: s.headerSubColor }}>
            {data?.room?.name || roomId}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(flash || isAnnouncing) && (
            <span className="text-xs font-extrabold tracking-widest uppercase animate-pulse" style={{ color: s.rowFirstBorderColor }}>ĐANG GỌI</span>
          )}
          <span className="text-xs font-bold border rounded-full px-2 py-0.5" style={{ color: s.rowSubColor, borderColor: s.rowSubColor + '40' }}>
            {data?.waitingCount ?? 0} chờ
          </span>
        </div>
      </div>

      {/* Main number */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 text-center gap-3">
        {hasPatient ? (
          <>
            <FlipNumber
              value={data!.currentPatient!.code}
              size={compact ? '4rem' : '7rem'}
              color={flash ? s.rowFirstBorderColor : s.rowFirstNumberColor}
            />
            <div className="flex flex-col items-center gap-1">
              <div className="font-bold text-center uppercase truncate px-2 max-w-full"
                style={{ fontSize: compact ? '0.85rem' : '1.1rem', color: s.rowNameColor }}>
                {data!.currentPatient!.name}
              </div>
              {data?.room?.doctorName && (
                <div className="text-xs font-medium" style={{ color: s.rowSubColor }}>BS. {data.room.doctorName}</div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <span style={{ fontSize: compact ? '3rem' : '5rem', fontWeight: 900, fontFamily: 'monospace', color: s.rowSubColor }}>—</span>
            <span className="text-xs tracking-widest uppercase font-bold" style={{ color: s.rowSubColor }}>Chờ gọi số</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Mock data for Demo Mode ───────────────────────────────── */
const DEMO_ROOMS: Record<string, RoomSummary> = {
  'KKB-P101': { room: { id: 'KKB-P101', code: 'P101', name: 'Phòng KHÁM NỘI', description: '', doctorName: 'Nguyễn Văn Minh', startTime: '07:00', endTime: '17:00', avgDuration: 15, maxCapacity: 50, isActive: true, enabledDefaultAds: [] }, currentPatient: { id: 'd1', code: 'K-024', name: 'Trần Thị Lan', age: 62, birthYear: 1962, gender: 'Nữ', reason: 'Tái khám huyết áp', status: PatientStatus.SERVING, isPriority: false, timestamp: Date.now() - 2000 }, waitingCount: 7 },
  'KKB-P102': { room: { id: 'KKB-P102', code: 'P102', name: 'Phòng TIM MẠCH', description: '', doctorName: 'Phạm Thùy Dương', startTime: '07:00', endTime: '17:00', avgDuration: 20, maxCapacity: 40, isActive: true, enabledDefaultAds: [] }, currentPatient: { id: 'd2', code: 'K-008', name: 'Hoàng Văn Tú', age: 55, birthYear: 1969, gender: 'Nam', reason: 'Siêu âm tim', status: PatientStatus.SERVING, isPriority: true, timestamp: Date.now() - 5000 }, waitingCount: 4 },
  'KKB-P103': { room: { id: 'KKB-P103', code: 'P103', name: 'Phòng NHÃN KHOA', description: '', doctorName: 'Lê Thị Hoa', startTime: '07:00', endTime: '12:00', avgDuration: 10, maxCapacity: 30, isActive: true, enabledDefaultAds: [] }, currentPatient: null, waitingCount: 2 },
  'XN-SA01': { room: { id: 'XN-SA01', code: 'SA01', name: 'Siêu Âm 1', description: '', doctorName: 'Vũ Quốc Hùng', startTime: '07:00', endTime: '17:00', avgDuration: 25, maxCapacity: 20, isActive: true, enabledDefaultAds: [] }, currentPatient: { id: 'd3', code: 'X-015', name: 'Nguyễn Minh Khôi', age: 38, birthYear: 1986, gender: 'Nam', reason: 'Siêu âm bụng tổng quát', status: PatientStatus.SERVING, isPriority: false, timestamp: Date.now() - 3000 }, waitingCount: 5 },
  'XQ-XQ01': { room: { id: 'XQ-XQ01', code: 'XQ01', name: 'X-Quang số 1', description: '', doctorName: 'Trần Hải Long', startTime: '07:00', endTime: '17:00', avgDuration: 12, maxCapacity: 60, isActive: true, enabledDefaultAds: [] }, currentPatient: { id: 'd4', code: 'X-007', name: 'Đặng Thị Mai Anh', age: 45, birthYear: 1979, gender: 'Nữ', reason: 'Chụp X-quang phổi', status: PatientStatus.SERVING, isPriority: false, timestamp: Date.now() - 1000 }, waitingCount: 11 },
  'KKB-TN01': { room: { id: 'KKB-TN01', code: 'TN01', name: 'Tiếp Nhận 1', description: '', doctorName: '', startTime: '06:30', endTime: '17:30', avgDuration: 5, maxCapacity: 100, isActive: true, enabledDefaultAds: [] }, currentPatient: { id: 'd5', code: 'A-002', name: 'Phan Văn Nam', age: 30, birthYear: 1994, gender: 'Nam', reason: 'Đăng ký khám mới', status: PatientStatus.SERVING, isPriority: false, timestamp: Date.now() }, waitingCount: 18 },
  'XN-LM01': { room: { id: 'XN-LM01', code: 'LM01', name: 'Lấy Mẫu Máu', description: '', doctorName: '', startTime: '07:00', endTime: '11:00', avgDuration: 5, maxCapacity: 80, isActive: true, enabledDefaultAds: [] }, currentPatient: null, waitingCount: 0 },
  'KKB-P104': { room: { id: 'KKB-P104', code: 'P104', name: 'Phòng THẦN KINH', description: '', doctorName: 'Bùi Thanh Sơn', startTime: '07:00', endTime: '17:00', avgDuration: 20, maxCapacity: 35, isActive: false, enabledDefaultAds: [] }, currentPatient: null, waitingCount: 0 },
};

const DEMO_ROOM_IDS = Object.keys(DEMO_ROOMS);

/* ─── Main Component ─────────────────────────────────────────── */
export const CentralDisplay: React.FC<CentralDisplayProps> = ({ onBack }) => {
  const STORAGE_KEY_CONFIG = 'clinic_central_display_config';

  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  /* ── Template State ── */
  const [templateId, setTemplateId] = useState<string>(() => localStorage.getItem(TEMPLATE_STORAGE_KEY) || 'airport-dark');
  const template = useMemo(() => getTemplate(templateId), [templateId]);

  useEffect(() => {
    const handleTemplateChange = (e: any) => { if (e.detail) setTemplateId(e.detail); };
    window.addEventListener('qms-template-change', handleTemplateChange as any);
    return () => window.removeEventListener('qms-template-change', handleTemplateChange as any);
  }, []);

  /* Demo: cycle which rooms are "announcing" */
  const [demoAnnouncingIdx, setDemoAnnouncingIdx] = useState(0);
  useEffect(() => {
    if (!isDemoMode) return;
    const t = setInterval(() => setDemoAnnouncingIdx(p => (p + 1) % DEMO_ROOM_IDS.length), 3000);
    return () => clearInterval(t);
  }, [isDemoMode]);

  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [isConfigMode, setIsConfigMode] = useState(false);
  const [roomDataMap, setRoomDataMap] = useState<Record<string, RoomSummary>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [audioQueue, setAudioQueue] = useState<AudioQueueItem[]>([]);
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [announcingRoomId, setAnnouncingRoomId] = useState<string | null>(null);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [adVisible, setAdVisible] = useState(false);

  /* Fullscreen API */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'F11' || e.key === 'f') toggleFullscreen(); };
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('keydown', keyHandler);
    return () => { document.removeEventListener('fullscreenchange', handler); document.removeEventListener('keydown', keyHandler); };
  }, []);

  /* Derived: what to show */
  const effectiveRoomIds = isDemoMode ? DEMO_ROOM_IDS : (selectedRoomIds || []);
  const effectiveRoomDataMap = isDemoMode ? DEMO_ROOMS : roomDataMap;
  const effectiveAnnouncingRoomId = isDemoMode ? DEMO_ROOM_IDS[demoAnnouncingIdx] : announcingRoomId;

  /* Clock */
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Load saved config */
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) { setSelectedRoomIds(JSON.parse(saved).selectedRoomIds || []); }
    else { setIsConfigMode(true); }
  }, []);

  const s = template.styles;

  /* Fetch queue data for each selected room */
  useEffect(() => {
    if ((selectedRoomIds || []).length === 0) return;

    const loadInitial = async () => {
      const map: Record<string, RoomSummary> = {};
      for (const rid of selectedRoomIds) {
        try {
          const [patients, room] = await Promise.all([queueService.getQueue(rid), queueService.getRoom(rid)]);
          if (room) {
            map[rid] = {
              room,
              currentPatient: (patients || []).find(p => p.status === PatientStatus.SERVING) || null,
              waitingCount: (patients || []).filter(p => p.status === PatientStatus.WAITING).length,
            };
          }
          socketService.emit('join_room', rid);
        } catch (_) {}
      }
      setRoomDataMap(map);
    };
    loadInitial();

    const unsubs: (() => void)[] = [];
    selectedRoomIds.forEach(rid => {
      const unsub = subscribeToUpdates(rid, data => {
        setRoomDataMap(prev => ({
          ...prev,
          [rid]: {
            room: data.room,
            currentPatient: (data.patients || []).find((p: Patient) => p.status === PatientStatus.SERVING) || null,
            waitingCount: (data.patients || []).filter((p: Patient) => p.status === PatientStatus.WAITING).length,
          },
        }));
      });
      unsubs.push(unsub);
    });

    const unsubAudio = subscribeToAudioTriggers(data => {
      if ((selectedRoomIds || []).includes(data.roomId)) {
        setAudioQueue(prev => [...prev, data]);
      }
    });
    unsubs.push(unsubAudio);

    return () => unsubs.forEach(fn => fn());
  }, [selectedRoomIds]);

  /* Audio queue */
  useEffect(() => {
    const process = async () => {
      if (audioQueue.length === 0 || isAnnouncing) return;
      const item = audioQueue[0];
      try {
        setIsAnnouncing(true); setAnnouncingRoomId(item.roomId);
        const roomData = roomDataMap[item.roomId];
        await announcePatient(item.patientName, item.roomName, item.code, roomData?.room?.voiceConfig);
      } catch (_) {}
      finally { setAudioQueue(prev => prev.slice(1)); setIsAnnouncing(false); setAnnouncingRoomId(null); }
    };
    process();
  }, [audioQueue, isAnnouncing, roomDataMap]);

  /* Idle detection → show rotating ads */
  const isIdle = useMemo(() =>
    !isDemoMode && effectiveRoomIds.length > 0 && effectiveRoomIds.every(rid => {
      const d = effectiveRoomDataMap[rid];
      return !d || !d.room?.isActive || (!d.currentPatient && d.waitingCount === 0);
    }), [isDemoMode, effectiveRoomIds, effectiveRoomDataMap]);

  useEffect(() => {
    if (!isIdle) { setAdVisible(false); return; }
    const t = setTimeout(() => setAdVisible(true), 5000);
    return () => clearTimeout(t);
  }, [isIdle]);

  useEffect(() => {
    if (!adVisible) return;
    const t = setInterval(() => setCurrentAdIndex(p => (p + 1) % DEFAULT_ADS.length), 12000);
    return () => clearInterval(t);
  }, [adVisible]);

  /* Config helpers */
  const toggleRoom = (rid: string) =>
    setSelectedRoomIds(prev => (prev || []).includes(rid) ? prev.filter(x => x !== rid) : [...(prev || []), rid]);
  const saveConfig = () => { localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify({ selectedRoomIds })); setIsConfigMode(false); };

  /* Layout */
  const n = effectiveRoomIds.length;
  const compact = n > 4;
  const gridCols = n <= 1 ? '1fr' : n <= 2 ? '1fr 1fr' : n <= 4 ? '1fr 1fr' : n <= 6 ? '1fr 1fr 1fr' : '1fr 1fr 1fr 1fr';
  const gridRows = n <= 2 ? '1fr' : n <= 4 ? '1fr 1fr' : n <= 6 ? '1fr 1fr' : '1fr 1fr';
  const currentAd = DEFAULT_ADS[currentAdIndex];

  return (
    <>
      {template.layout === 'classic' ? (
        <div ref={containerRef} className="h-screen flex flex-col font-sans select-none overflow-hidden bg-white">
          {adVisible && (
            <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center text-center transition-all duration-1000"
              style={{ background: 'radial-gradient(ellipse at center, #0a1628 0%, #000 100%)' }}>
              <div className="text-[8rem] opacity-10 mb-6 animate-pulse">{(currentAd as any).icon}</div>
              <h1 className="text-7xl font-black text-amber-300 tracking-widest uppercase leading-tight max-w-5xl mb-8">{(currentAd as any).title}</h1>
              <button onClick={() => setAdVisible(false)} className="absolute bottom-10 right-10 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm border border-white/20">Đóng quảng cáo</button>
            </div>
          )}

          <div className="flex-shrink-0 flex items-center justify-center h-[120px] bg-white border-b border-slate-300 shadow-sm relative z-20">
              <h1 className="text-[3rem] font-black tracking-widest uppercase" style={{ color: s.tickerTextColor }}>BẢNG ĐIỀU KHIỂN TRUNG TÂM</h1>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-4">
                <button onClick={() => setIsDemoMode(p => !p)} className={`w-12 h-12 rounded-full border-2 text-xl font-bold flex items-center justify-center transition-all ${isDemoMode ? 'bg-amber-100 text-amber-600 border-amber-400' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>🎭</button>
                <button onClick={toggleFullscreen} className="w-12 h-12 rounded-full border-2 text-xl font-bold flex items-center justify-center bg-slate-50 text-slate-400 border-slate-200">⛶</button>
                <button onClick={onBack} className="w-12 h-12 rounded-full border-2 text-xl font-bold flex items-center justify-center bg-red-50 text-red-500 border-red-200">✕</button>
              </div>
          </div>
          
          <div className="flex-1 overflow-hidden" style={{ background: s.rowNumberColor || '#1e3a8a' }}>
             {effectiveRoomIds.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-4xl text-white font-bold uppercase opacity-50 gap-6">
                  Chưa có phòng
                  <button onClick={() => setIsConfigMode(true)} className="px-8 py-3 rounded-xl border border-white text-white font-bold text-xl pointer-events-auto">Mở cấu hình</button>
               </div>
             ) : (
               <div className="w-full h-full grid gap-[2px] bg-white" style={{ gridTemplateColumns: gridCols, gridTemplateRows: gridRows }}>
                 {effectiveRoomIds.map((rid, idx) => {
                   const data = effectiveRoomDataMap[rid];
                   const code = data?.currentPatient?.code;
                   const flash = effectiveAnnouncingRoomId === rid;
                   return (
                     <div key={rid} className="flex flex-col items-center justify-center px-2 py-4 lg:py-8 relative transition-colors duration-500 overflow-hidden"
                       style={{ backgroundColor: flash ? s.callingNumberColor : (s.rowNumberColor || '#1e3a8a') }}>
                        <div className="font-bold text-white uppercase tracking-widest text-center leading-normal truncate w-full px-1 text-xl lg:text-3xl xl:text-4xl pt-2 lg:pt-3 pb-1">
                          {data?.room?.customDisplayName || "BÀN SỐ " + (idx + 1)}
                        </div>
                        <div className="font-bold text-white font-mono leading-none tracking-tighter mt-4 lg:mt-6 block w-full text-center text-5xl lg:text-7xl xl:text-[5.5rem] 2xl:text-[6.5rem]" 
                             style={{ textShadow: flash ? '0 0 60px rgba(255,255,255,0.7)' : 'none' }}>
                          {code || '—'}
                        </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="h-screen flex flex-col font-sans select-none overflow-hidden transition-all duration-1000" 
            style={{ background: s.bgColor, color: s.headerTextColor, fontFamily: s.fontFamily }}>
          <Scanline />

      {/* ── AD OVERLAY ── */}
      {adVisible && (
        <div className="fixed inset-0 z-[150] flex flex-col items-center justify-center text-center transition-all duration-1000"
          style={{ background: 'radial-gradient(ellipse at center, #0a1628 0%, #000 100%)' }}>
          <div className="text-[8rem] opacity-10 mb-6 animate-pulse">{(currentAd as any).icon}</div>
          <h1 className="text-7xl font-black text-amber-300 tracking-widest uppercase leading-tight max-w-5xl mb-8">
            {(currentAd as any).title}
          </h1>
          <p className="text-2xl text-slate-400 max-w-3xl">{(currentAd as any).desc}</p>
          <button onClick={() => setAdVisible(false)}
            className="absolute bottom-10 right-10 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm border border-white/20">
            Đóng quảng cáo
          </button>
        </div>
      )}

      {/* ── TOP HEADER ── */}
      <header className="flex-shrink-0 flex items-stretch justify-between border-b z-20"
        style={{ borderColor: s.headerBorder, background: s.headerBg, height: '90px' }}>

        {/* Hospital name / brand */}
        <div className="flex items-center gap-5 px-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center border"
            style={{ background: 'rgba(59,130,246,0.15)', borderColor: 'rgba(59,130,246,0.4)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.35em] font-extrabold uppercase mb-0.5" style={{ color: template.preview.accent }}>HỆ THỐNG QUẢN LÝ HÀNG ĐỢI</div>
            <h1 className="text-2xl font-black tracking-tight leading-none" style={{ color: s.headerTextColor }}>BẢNG GỌI SỐ TRUNG TÂM</h1>
          </div>
        </div>

        {/* Center: status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {isDemoMode && (
              <span className="text-xs font-extrabold tracking-[0.25em] px-3 py-1 rounded-lg uppercase animate-pulse"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.4)' }}>
                🎭 DEMO
              </span>
          )}
        </div>

        {/* Right: clock + buttons */}
        <div className="flex items-center gap-6 px-8">
          <div className="text-right">
            <div className="text-4xl font-mono font-black tabular-nums" style={{ color: s.headerTextColor }}>
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-xs tracking-widest uppercase mt-0.5" style={{ color: s.headerSubColor }}>
              {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsDemoMode(p => !p)}
              className="p-3 rounded-lg border text-xl transition-all"
              style={isDemoMode
                ? { background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)', color: '#fbbf24' }
                : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#64748b' }}
            >
              🎭
            </button>
            <button onClick={() => setIsConfigMode(true)}
              className="p-3 rounded-lg border border-white/10 bg-white/5 text-slate-400 text-xl">
              ⚙
            </button>
            <button onClick={onBack}
              className="p-3 rounded-lg border border-red-900/40 bg-red-900/10 text-red-400 text-xl">
              ✕
            </button>
          </div>
        </div>
      </header>

      {/* ── TICKER ── */}
      <div className="flex-shrink-0 flex items-center h-10 px-4 gap-4 border-b transition-all duration-500"
        style={{ background: s.tickerBg, borderColor: s.headerBorder }}>
        <span className="flex-shrink-0 text-[10px] font-extrabold tracking-[0.3em] uppercase px-2 py-0.5 rounded border"
            style={{ background: s.tickerAccentBg, color: s.tickerAccentText, borderColor: s.tickerAccentText + '40' }}>
          THÔNG BÁO
        </span>
        <Ticker template={template} message="Kính mời quý bệnh nhân chú ý theo dõi thẻ số trên bảng hiển thị. Vui lòng đến đúng phòng khám khi được gọi tên. Mọi thắc mắc xin liên hệ quầy lễ tân." />
      </div>

      {/* ── MAIN GRID ── */}
      <div className="flex-1 overflow-hidden">
        {effectiveRoomIds.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-6 opacity-30">
            <p className="text-3xl font-bold tracking-widest uppercase">Chưa có phòng nào được cấu hình</p>
            <button onClick={() => setIsConfigMode(true)} className="px-8 py-3 rounded-xl border border-blue-500 text-blue-500 font-bold">Mở cấu hình</button>
          </div>
        ) : (
          n <= 3 ? (
            <div className="h-full flex flex-col divide-y" style={{ borderColor: s.sidebarBorder }}>
              {effectiveRoomIds.map((rid, idx) => {
                const data = effectiveRoomDataMap[rid];
                const isAnn = effectiveAnnouncingRoomId === rid;
                const hasPatient = !!data?.currentPatient;
                const active = data?.room?.isActive ?? false;
                return (
                  <div key={rid}
                    className="flex-1 grid items-center border-b transition-all duration-500 relative overflow-hidden px-10"
                    style={{
                      gridTemplateColumns: 'minmax(300px, 340px) 1.5fr 2fr auto',
                      borderColor: s.sidebarBorder,
                      background: isAnn ? s.callingBgFlash : (idx % 2 === 0 ? s.rowEvenBg : 'transparent'),
                      borderLeft: isAnn ? `5px solid ${s.rowFirstBorderColor}` : '5px solid transparent',
                    }}
                  >
                    {isAnn && <div className="absolute top-0 left-0 w-full h-px" style={{ background: s.rowFirstBorderColor, boxShadow: `0 0 20px ${s.rowFirstBorderColor}` }} />}
                    
                    <div className="flex items-center gap-4">
                      <LiveDot color={active ? s.activeBadgeText : '#475569'} />
                      <div>
                        <div className="text-lg font-extrabold uppercase tracking-wide leading-tight" style={{ color: s.rowNameColor }}>
                          {data?.room?.name || rid}
                        </div>
                        {data?.room?.doctorName && (
                          <div className="text-sm font-medium mt-0.5" style={{ color: s.rowSubColor }}>BS. {data.room.doctorName}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      <FlipNumber
                        value={hasPatient ? data!.currentPatient!.code : '——'}
                        size="5.5rem"
                        color={isAnn ? s.rowFirstBorderColor : (hasPatient ? s.rowFirstNumberColor : s.rowSubColor)}
                      />
                    </div>

                    <div className="px-4">
                      <div className="text-xl font-bold uppercase truncate" style={{ color: hasPatient ? s.rowNameColor : s.rowSubColor }}>
                        {hasPatient ? data!.currentPatient!.name : 'Chưa gọi'}
                      </div>
                      {hasPatient && data?.currentPatient?.isPriority && (
                        <span className="text-xs font-extrabold tracking-widest px-3 py-1 rounded-full uppercase mt-1 inline-block border"
                          style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', borderColor: 'rgba(245,158,11,0.3)' }}>
                          ⭐ Ưu tiên
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      {isAnn ? (
                        <span className="text-amber-400 font-extrabold tracking-widest text-sm uppercase animate-pulse">ĐANG GỌI</span>
                      ) : (
                        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: s.rowSubColor }}>
                          {data?.waitingCount ?? 0} chờ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-full p-4 grid gap-3" style={{ gridTemplateColumns: gridCols, gridTemplateRows: gridRows }}>
              {effectiveRoomIds.map(rid => (
                <RoomCard key={rid} roomId={rid} data={effectiveRoomDataMap[rid]} isAnnouncing={effectiveAnnouncingRoomId === rid} compact={compact} template={template} />
              ))}
            </div>
          )
        )}
      </div>

      {/* ── BOTTOM BAR ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 border-t"
        style={{ height: '40px', borderColor: s.headerBorder, background: s.bottomBg, fontSize: '11px', color: s.bottomText }}>
        <span className="font-bold tracking-widest uppercase">vClinic QMS — CENTRAL DISPLAY</span>
        <span className="font-mono">{currentTime.toLocaleString('vi-VN')}</span>
        <span className="font-bold">{effectiveRoomIds.length} phòng đang hiển thị</span>
      </div>

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-block; animation: marquee linear infinite; }
      `}</style>
    </div>
    )}
    </>
  );
};
