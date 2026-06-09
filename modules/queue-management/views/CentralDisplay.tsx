import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Settings,
  X,
  ChevronRight,
  Check,
  Activity,
  ChevronDown,
  Maximize,
  Minimize
} from 'lucide-react';
import { apiFetch, getBaseUrl } from '../services/apiService';
import { AppSettings } from '../types';

interface CounterState {
  counter_id: number;
  counter_name: string;
  is_priority: boolean;
  area_id: number;
  area_name: string;
  current_ticket: string | null;
  current_name: string | null;
}

interface CentralDisplayProps {
  onBack?: () => void;
  settings?: AppSettings;
}

const CentralDisplay: React.FC<CentralDisplayProps> = ({ onBack, settings }) => {
  const [counters, setCounters] = useState<CounterState[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('vimes_central_muted') === 'true');

  const [hasInteracted, setHasInteracted] = useState(false);
  const [callingCounterId, setCallingCounterId] = useState<any | null>(null);
  const [clock, setClock] = useState(new Date());
  const [showSettings, setShowSettings] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error enabling fullscreen:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };
  const [gridCols, setGridCols] = useState(() => {
    const saved = localStorage.getItem('vimes_central_cols');
    return parseInt(saved || '2');
  });
  const [selectedCounterIds, setSelectedCounterIds] = useState<any[]>(() => {
    const saved = localStorage.getItem('vimes_central_selected_counters');
    return saved ? JSON.parse(saved) : [];
  });

  // Interactive configurations
  const [selectedService, setSelectedService] = useState<string>(() => {
     return localStorage.getItem('vimes_central_selected_service') || 'REGISTRATION';
  });
  const [allDepts, setAllDepts] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(() => {
     return localStorage.getItem('vimes_central_selected_dept_id') || 'KB';
  });
  const [allAreas, setAllAreas] = useState<any[]>([]);
  const [selectedAreaState, setSelectedAreaState] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('vimes_selected_area') || 'null');
    } catch (e) {
      return null;
    }
  });

  // Queue for voice announcements using Refs to avoid race conditions
  const voiceQueueRef = useRef<any[]>([]);
  const isSpeakingRef = useRef(false);
  const [isSpeakingUI, setIsSpeakingUI] = useState(false); // For UI flashing only
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    isMutedRef.current = isMuted;
    if (isMuted) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      // Reset speaking state if muted
      isSpeakingRef.current = false;
      setIsSpeakingUI(false);
    }
  }, [isMuted]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processNextInQueueRef = useRef<() => void>(() => {});
  const fallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();

    const handleAudioEnded = () => {
      console.log('[CentralAudio] Finished playing, checking queue...');
      fallbackRef.current = null;
      isSpeakingRef.current = false;
      setIsSpeakingUI(false);
      
      processNextInQueueRef.current();
    };

    const handleAudioError = (e: any) => {
      console.error('[CentralAudio] Audio element error:', e);
      if (fallbackRef.current) {
        const fb = fallbackRef.current;
        fallbackRef.current = null;
        fb();
      } else {
        isSpeakingRef.current = false;
        setIsSpeakingUI(false);
        processNextInQueueRef.current();
      }
    };

    audioRef.current.addEventListener('ended', handleAudioEnded);
    audioRef.current.addEventListener('error', handleAudioError);
    return () => {
      audioRef.current?.removeEventListener('ended', handleAudioEnded);
      audioRef.current?.removeEventListener('error', handleAudioError);
    };
  }, []);

  useEffect(() => {
    apiFetch('/api/departments').then(data => {
      if (Array.isArray(data)) setAllDepts(data);
    }).catch(e => console.error('Error fetching depts:', e));

    apiFetch('/api/public/areas').then(data => {
      if (Array.isArray(data)) setAllAreas(data);
    }).catch(e => console.error('Error fetching areas:', e));
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [selectedCounterIds, selectedService, selectedDeptId, selectedAreaState]);

  useEffect(() => {
    // SSE for real-time updates
    const baseUrl = getBaseUrl();
    const eventSource = new EventSource(`${baseUrl}/api/queue/events`);

    eventSource.onopen = () => {
      console.log('[CentralDisplay SSE] Connection established/restored. Syncing data...');
      fetchInitialData();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[CentralDisplay SSE] Event received:', data);
        
        if (data.type === 'QUEUE_UPDATED' || data.type === 'NEW_CALL' || data.type === 'CALL_AGAIN') {
            // Re-fetch current states for all active counters
            fetchInitialData();
            
            if (data.type === 'NEW_CALL' || data.type === 'CALL_AGAIN') {
                // Only queue if this counter is one of our selected counters and matches department
                const eventCounterId = String(data.counterId);
                const eventDeptId = data.ticket?.dept_code || data.deptId;
                const isRoomBased = selectedService === 'EXECUTION' || selectedService === 'REGISTRATION';
                const isSameDept = !isRoomBased || !selectedDeptId || !eventDeptId || String(eventDeptId) === String(selectedDeptId);
                
                if (isSameDept && (selectedCounterIds.length === 0 || selectedCounterIds.map(String).includes(eventCounterId))) {
                   handleNewCall(data);
                }
             }
        }
      } catch (e) {
        console.error('[SSE] Error parsing data:', e);
      }
    };

    // Live clock
    const clockInterval = setInterval(() => setClock(new Date()), 1000);

    return () => { eventSource.close(); clearInterval(clockInterval); };
  }, [selectedCounterIds, selectedService, selectedDeptId, selectedAreaState]);

  const processNextInQueue = () => {
    if (isSpeakingRef.current || voiceQueueRef.current.length === 0) return;

    const nextCall = voiceQueueRef.current.shift();
    if (!nextCall) return;

    isSpeakingRef.current = true;
    setIsSpeakingUI(true);
    setCallingCounterId(nextCall.counterId);
    
    const getTicketNumber = (call: any) => {
        if (!call) return '---';
        const fromTicket = call.ticket?.ticket_number || call.ticket?.ticketNumber || call.ticket?.ticket_no || call.ticket?.number;
        if (fromTicket) return String(fromTicket);
        const topLevel = call.ticketNumber || call.ticket_number || call.ticket_no;
        if (topLevel) return String(topLevel);
        if (call.ticket && (typeof call.ticket === 'string' || typeof call.ticket === 'number')) return String(call.ticket);
        return '---';
      };
    
    const ticketNum = getTicketNumber(nextCall);
    const pName = nextCall.ticket?.patient_name || nextCall.patientName || 'Bệnh nhân';
    
    // Phát âm thanh Ding-dong
    playDingDong();
    
    setTimeout(() => {
      console.log('[CentralAudio] Triggering speech for:', pName);
      speakPatient(ticketNum, pName, nextCall.counterName || 'quầy phục vụ');
    }, 1500);
  };

  processNextInQueueRef.current = processNextInQueue;

  const fetchInitialData = async () => {
     try {
        const isRoomBased = selectedService === 'EXECUTION' || selectedService === 'REGISTRATION';
        let url = `/api/queue/central?serviceType=${selectedService}&deptId=${selectedDeptId}`;
        if (!isRoomBased && selectedAreaState) {
           url += `&areaId=${selectedAreaState.area_id || selectedAreaState.id}`;
        }
        const data = await apiFetch(url);
        
        // Filter by selectedCounterIds if configured
        let activeCounters = data.counters || [];
        if (selectedCounterIds.length > 0) {
           activeCounters = activeCounters.filter((c: any) => 
              selectedCounterIds.map(String).includes(String(c.counter_id))
           );
        }
        
        setCounters(activeCounters);
     } catch (e) {
        console.error('[CentralDisplay] Fetch error:', e);
     }
  };

  const handleNewCall = (data: any) => {
    console.log('[CentralAudio] New Call added to queue Ref:', data);
    voiceQueueRef.current.push(data);
    processNextInQueue();
  };

  const playDingDong = () => {
    if (isMutedRef.current) return;

    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
        gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + startTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + startTime);
        osc.stop(ctx.currentTime + startTime + duration);
      };
      playTone(659.25, 0, 0.6); // E5
      playTone(523.25, 0.4, 0.8); // C5
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  const parseCallingTemplate = (template: string | undefined, name: string, ticket: string, counter: string) => {
    const defaultTpl = 'Mời bệnh nhân {name}, số thứ tự {ticket}, đến {counter}';
    const tpl = template || defaultTpl;
    return tpl
      .replace(/{name}/g, name)
      .replace(/{ticket}/g, ticket)
      .replace(/{number}/g, ticket)
      .replace(/{counter}/g, counter);
  };

  const speakPatient = (ticket: string, name: string, counterName: string) => {
    if (isMutedRef.current) {
      isSpeakingRef.current = false;
      setIsSpeakingUI(false);
      setCallingCounterId(null);
      processNextInQueue();
      return;
    }

    const doLocalTTS = () => {
        if (!window.speechSynthesis) {
            isSpeakingRef.current = false;
            setIsSpeakingUI(false);
            setCallingCounterId(null);
            processNextInQueue();
            return;
        }
        window.speechSynthesis.cancel();
        
        let safeTicket = String(ticket || '0');
        if (/^\d+$/.test(safeTicket)) {
            safeTicket = String(parseInt(safeTicket, 10)); // 06 -> 6
        } else {
            safeTicket = safeTicket.split('').join(' '); // A01 -> A 0 1
        }
        const offlineText = `Mời bệnh nhân có số thứ tự, ${safeTicket}, đến, ${counterName}`;
        
        const utterance = new SpeechSynthesisUtterance(offlineText);
        utterance.lang = 'vi-VN';
        utterance.rate = 0.9;
        
        const voices = window.speechSynthesis.getVoices();
        const viVoice = voices.find(v => v.lang.toLowerCase().includes('vi') || v.name.toLowerCase().includes('vietnam'));
        if (viVoice) utterance.voice = viVoice;
        
        utterance.onend = () => {
            isSpeakingRef.current = false;
            setIsSpeakingUI(false);
            setCallingCounterId(null);
            processNextInQueue();
        };
        utterance.onerror = () => {
            isSpeakingRef.current = false;
            setIsSpeakingUI(false);
            setCallingCounterId(null);
            processNextInQueue();
        };
        window.speechSynthesis.speak(utterance);
    };

    if (isOfflineMode) {
        doLocalTTS();
        return;
    }
    
    const text = parseCallingTemplate(settings?.callingTemplate, name, ticket, counterName);
    
    const baseUrl = getBaseUrl();
    const audioUrl = `${baseUrl}/api/tts?text=${encodeURIComponent(text)}`;
    
    if (audioRef.current) {
        fallbackRef.current = () => {
          console.warn('[Audio] Proxy TTS loading failed, switching to Offline Mode.');
          setIsOfflineMode(true); // Bật cờ Offline
          setTimeout(() => setIsOfflineMode(false), 60000); // Thử lại Online sau 1 phút
          doLocalTTS();
        };

        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(e => {
          console.warn('[Audio] Proxy play() rejected, switching to Offline Mode.');
          if (fallbackRef.current) {
            const fb = fallbackRef.current;
            fallbackRef.current = null;
            fb();
          }
        });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden font-sans">
      
      {/* Header */}
      <div className="h-24 bg-[#2e408a] flex items-center px-8 shrink-0 relative">
        {/* Left: Back + Area */}
        <div className="flex items-center gap-6 w-1/3">
           <button 
             onClick={onBack}
             className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all opacity-40 hover:opacity-100"
           >
             <ChevronRight className="rotate-180 text-white" size={24} />
           </button>
            <div className="text-left">
               <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                  {(selectedService === 'EXECUTION' || selectedService === 'REGISTRATION') ? 'Khoa điều trị' : 'Khu vực'}
               </p>
                <p className="text-white text-lg font-bold">
                   {((selectedService === 'EXECUTION' || selectedService === 'REGISTRATION') 
                      ? (allDepts.find(d => String(d.id) === String(selectedDeptId))?.name || selectedDeptId)
                      : (selectedAreaState?.area_name || selectedAreaState?.name || 'Tất cả')
                   ).normalize('NFC').toUpperCase()}
                </p>
            </div>
        </div>

        {/* Center: Title */}
        <div className="flex-1 text-center">
           <h1 className="text-4xl font-black uppercase text-white tracking-tighter">
             BẢNG ĐIỀU KHIỂN TRUNG TÂM
           </h1>
        </div>

        {/* Right: Clock + Settings */}
        <div className="flex items-center justify-end gap-6 w-1/3">
           <div className="text-right">
              <p className="text-white text-3xl font-black tabular-nums leading-none">
                 {clock.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
              <p className="text-blue-200 text-[10px] font-bold uppercase tracking-widest mt-1">
                 {clock.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
           </div>
           <div className="h-12 w-[1px] bg-white/20"></div>
           <div className="flex gap-2">
               <button 
                 onClick={() => {
                   const newMuted = !isMuted;
                   setIsMuted(newMuted);
                   localStorage.setItem('vimes_central_muted', String(newMuted));
                 }}
                 className={`p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500/20 text-red-200' : 'bg-white/10 text-white hover:bg-white/20'}`}
                 title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
               >
                 {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
               </button>
               <button 
                 onClick={toggleFullscreen}
                 title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
                 className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
               >
                 {isFullscreen ? <Minimize size={24} className="text-white" /> : <Maximize size={24} className="text-white" />}
               </button>
               <button 
                 onClick={() => setShowSettings(true)}
                 className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                 title="Cài đặt"
               >
                 <Settings size={24} className="text-white" />
               </button>
           </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-hidden p-1 bg-black/10">
              {counters.length > 0 ? (
                 <div className={`grid h-full gap-1 ${
                    gridCols === 2 ? 'grid-cols-2' : 
                    gridCols === 3 ? 'grid-cols-3' : 
                    gridCols === 4 ? 'grid-cols-4' : 'grid-cols-2'
                 }`}>
                   {counters.map((counter, index) => {
                     const isThisCalling = isSpeakingUI && String(callingCounterId) === String(counter.counter_id);
                     console.log(`[Display] Counter ${counter.counter_id} calling status:`, isThisCalling);
                     // Blue for normal, Red for priority
                     const bgColor = counter.is_priority ? 'bg-[#ed1c24]' : 'bg-[#2e408a]';
                     
                     return (
                       <div 
                         key={counter.counter_id}
                         className={`flex flex-col border-2 border-black/20 relative ${bgColor} ${isThisCalling ? 'animate-call-flash ring-inset ring-[20px] ring-white z-50 scale-105 shadow-2xl' : ''}`}
                       >
                         <div className="h-16 flex items-center justify-center border-b-2 border-white/20 shrink-0">
                            <h2 className="text-3xl font-extrabold text-white truncate px-4 py-1 leading-normal">{(counter.counter_name || '').normalize('NFC').toUpperCase()}</h2>
                         </div>
                         <div className="flex-1 flex flex-col items-center justify-center py-4 min-h-0">
                            <div className="font-black text-white leading-none tabular-nums drop-shadow-lg" style={{fontSize: 'clamp(5rem, 15vw, 13rem)'}}>
                               {counter.current_ticket || '---'}
                            </div>
                            {counter.current_name && (
                               <div className="text-3xl lg:text-4xl font-extrabold text-white mt-4 px-4 text-center max-w-[95%] tracking-wider break-words leading-tight">
                                  {(counter.current_name || '').normalize('NFC').toUpperCase()}
                               </div>
                            )}
                         </div>
                       </div>
                     );
                   })}
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center bg-white/50 text-slate-400 p-20 text-center">
                    <Activity size={100} className="mb-8 opacity-20" />
                    <h2 className="text-4xl font-black uppercase mb-4">Chưa chọn quầy hiển thị</h2>
                    <p className="text-xl font-bold max-w-xl">Vui lòng bấm vào biểu tượng bánh răng ở góc trên bên phải để chọn các quầy bạn muốn theo dõi.</p>
                 </div>
              )}
      </div>

      {/* Lớp phủ kích hoạt âm thanh (Để vượt qua chính sách Autoplay) */}
      {!hasInteracted && !isMuted && (
        <div className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <button 
            onClick={() => {
              setHasInteracted(true);
              playDingDong(); // Kích hoạt AudioContext
              
              // Mở khóa Audio HTML5 bằng cách phát một file rỗng
              if (audioRef.current) {
                 audioRef.current.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
                 audioRef.current.play().catch(()=>{});
              }
            }}
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-12 py-8 rounded-[3rem] font-black text-4xl shadow-2xl flex items-center gap-6 animate-bounce"
          >
            <Volume2 size={60} /> BẤM ĐỂ BẬT ÂM THANH GỌI SỐ
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-12">
            <div className="bg-white rounded-[3rem] w-full max-w-4xl p-12 shadow-2xl flex flex-col max-h-[90vh]">
               <div className="flex items-center justify-between mb-10 shrink-0">
                  <div>
                     <h2 className="text-3xl font-black text-slate-800 uppercase">Cấu hình bảng trung tâm</h2>
                     <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Tùy chỉnh quầy và lưới hiển thị</p>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="p-3 hover:bg-slate-100 rounded-full transition-all"><X size={40}/></button>
               </div>
               
               <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                  <div className="mb-10">
                     <p className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-l-4 border-blue-600 pl-4">1. Số cột hiển thị</p>
                     <div className="grid grid-cols-3 gap-4">
                        {[2, 3, 4].map(cols => (
                           <button
                              key={cols}
                              onClick={() => {
                                 setGridCols(cols);
                                 localStorage.setItem('vimes_central_cols', String(cols));
                              }}
                              className={`py-8 rounded-2xl border-4 font-black text-2xl transition-all ${
                                 gridCols === cols 
                                 ? 'border-[#2e408a] bg-[#2e408a] text-white shadow-xl scale-105' 
                                 : 'border-slate-100 text-slate-400 hover:border-slate-200 bg-slate-50'
                              }`}
                           >
                              {cols} CỘT
                           </button>
                        ))}
                     </div>
                  </div>

                  {/* 2. Chọn nghiệp vụ & Khoa điều trị */}
                  <div className="mb-10">
                     <p className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-l-4 border-blue-600 pl-4">2. Nghiệp vụ & Khoa điều trị</p>
                     <div className={`grid ${(selectedService === 'EXECUTION' || selectedService === 'REGISTRATION') ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
                        <div>
                           <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Nghiệp vụ hiển thị</label>
                           <div className="relative">
                             <select
                               value={selectedService}
                               onChange={(e) => {
                                 const val = e.target.value;
                                 setSelectedService(val);
                                 localStorage.setItem('vimes_central_selected_service', val);
                                 setSelectedCounterIds([]);
                                 localStorage.setItem('vimes_central_selected_counters', '[]');
                               }}
                               className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold appearance-none uppercase tracking-wider text-slate-700 text-lg cursor-pointer"
                             >
                               <option value="RECEPTION">Tiếp nhận</option>
                               <option value="SAMPLING">Lấy mẫu XN</option>
                               <option value="REGISTRATION">Lấy số khám</option>
                               <option value="PAYMENT">Thanh toán</option>
                               <option value="DRUG">Lĩnh thuốc</option>
                               <option value="EXECUTION">Khám bệnh, CĐHA</option>
                             </select>
                             <ChevronDown size={24} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                           </div>
                        </div>

                        {(selectedService === 'EXECUTION' || selectedService === 'REGISTRATION') && (
                           <div>
                              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Khoa điều trị</label>
                              <div className="relative">
                                <select
                                  value={selectedDeptId}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedDeptId(val);
                                    localStorage.setItem('vimes_central_selected_dept_id', val);
                                    setSelectedCounterIds([]);
                                    localStorage.setItem('vimes_central_selected_counters', '[]');
                                  }}
                                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold appearance-none uppercase tracking-wider text-slate-700 text-lg cursor-pointer"
                                >
                                  {allDepts.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                  ))}
                                </select>
                                <ChevronDown size={24} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* 3. Khu vực hiển thị */}
                  {!(selectedService === 'EXECUTION' || selectedService === 'REGISTRATION') && (
                     <div className="mb-10">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-l-4 border-blue-600 pl-4">3. Khu vực hiển thị</p>
                        <div className="relative">
                          <select
                            value={selectedAreaState?.area_id || selectedAreaState?.id || ''}
                            onChange={(e) => {
                              const areaId = e.target.value;
                              const area = allAreas.find(a => String(a.area_id || a.id) === areaId);
                              if (area) {
                                localStorage.setItem('vimes_selected_area', JSON.stringify(area));
                                setSelectedAreaState(area);
                              } else {
                                localStorage.removeItem('vimes_selected_area');
                                setSelectedAreaState(null);
                              }
                              setSelectedCounterIds([]);
                              localStorage.setItem('vimes_central_selected_counters', '[]');
                            }}
                            className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold appearance-none uppercase tracking-wider text-slate-700 text-lg cursor-pointer"
                          >
                            <option value="">--- Tất cả khu vực ---</option>
                            {allAreas.map(area => (
                              <option key={area.area_id || area.id} value={area.area_id || area.id}>
                                {area.area_name || area.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={24} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                     </div>
                  )}

                  {/* 4. Chọn danh sách hiển thị */}
                  <div>
                     <p className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 border-l-4 border-blue-600 pl-4">
                        {(selectedService === 'EXECUTION' || selectedService === 'REGISTRATION') ? '3. Chọn các phòng khám hiển thị' : '4. Chọn các quầy hiển thị'}
                     </p>
                     <CounterPicker 
                        selectedService={selectedService}
                        selectedDeptId={selectedDeptId}
                        areaId={selectedAreaState?.area_id || selectedAreaState?.id} 
                        selectedIds={selectedCounterIds}
                        onToggle={(id) => {
                           const newIds = selectedCounterIds.map(String).includes(String(id)) 
                              ? selectedCounterIds.filter(x => String(x) !== String(id))
                              : [...selectedCounterIds, id];
                           setSelectedCounterIds(newIds);
                           localStorage.setItem('vimes_central_selected_counters', JSON.stringify(newIds));
                        }}
                     />
                  </div>
               </div>
               
               <div className="mt-10 pt-8 border-t border-slate-100 flex justify-end shrink-0">
                  <button 
                     onClick={() => {
                        setShowSettings(false);
                        fetchInitialData();
                     }}
                     className="px-12 py-5 bg-[#2e408a] text-white rounded-2xl font-black text-lg uppercase shadow-xl hover:scale-105 active:scale-95 transition-all"
                  >
                     Áp dụng cấu hình
                  </button>
               </div>
            </div>
         </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Be Vietnam Pro', sans-serif; overflow: hidden; }
        
        @keyframes call-flash {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
          50% { transform: scale(1.03); box-shadow: 0 0 60px 20px rgba(251, 191, 36, 0.6); border-color: #fbbf24; }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
        }
        .animate-call-flash {
          animation: call-flash 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          border: 6px solid #fbbf24 !important;
          border-radius: 1.5rem !important;
          z-index: 100 !important;
          overflow: hidden;
        }
      `}} />
    </div>
  );
};

interface CounterPickerProps {
  selectedService: string;
  selectedDeptId: string;
  areaId?: number | null;
  selectedIds: any[];
  onToggle: (id: any) => void;
}

const CounterPicker: React.FC<CounterPickerProps> = ({ 
  selectedService, 
  selectedDeptId, 
  areaId, 
  selectedIds, 
  onToggle 
}) => {
   const [items, setItems] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      setLoading(true);
      if (selectedService === 'EXECUTION' || selectedService === 'REGISTRATION') {
         apiFetch(`/api/departments/${selectedDeptId}/rooms`).then(data => {
            if (Array.isArray(data)) {
               const mapped = data.map((room: any) => ({
                  id: room.id,
                  name: room.name,
                  subname: `Khoa: ${selectedDeptId}`
               }));
               setItems(mapped);
            } else {
               setItems([]);
            }
            setLoading(false);
         }).catch(e => {
            console.error('Error fetching rooms:', e);
            setItems([]);
            setLoading(false);
         });
      } else {
         apiFetch('/api/public/counters').then(data => {
            const filtered = areaId 
               ? data.filter((c: any) => String(c.area_id) === String(areaId))
               : data;
            const mapped = filtered.map((c: any) => ({
               id: c.counter_id,
               name: c.counter_name,
               subname: c.area_name
            }));
            setItems(mapped);
            setLoading(false);
         }).catch(e => {
            console.error('Error fetching counters:', e);
            setItems([]);
            setLoading(false);
         });
      }
   }, [selectedService, selectedDeptId, areaId]);

   if (loading) return <div className="p-10 text-center font-bold text-slate-400 animate-pulse uppercase tracking-widest">Đang tải danh sách...</div>;

   return (
      <div className="grid grid-cols-2 gap-3">
         {items.map(item => {
            const isSelected = selectedIds.map(String).includes(String(item.id));
            return (
               <button
                  key={item.id}
                  onClick={() => onToggle(item.id)}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                     isSelected 
                     ? 'border-blue-600 bg-blue-50' 
                     : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
               >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${
                     isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-transparent'
                  }`}>
                     <Check size={18} strokeWidth={4} />
                  </div>
                  <div>
                     <p className="text-sm font-black text-slate-800 leading-none">{(item.name || '').normalize('NFC').toUpperCase()}</p>
                     <p className="text-[10px] font-bold text-slate-400 mt-1">{(item.subname || '').normalize('NFC').toUpperCase()}</p>
                  </div>
               </button>
            );
         })}
         {items.length === 0 && (
            <div className="col-span-2 py-8 text-center text-slate-400 uppercase font-black text-sm tracking-widest">
               {(selectedService === 'EXECUTION' || selectedService === 'REGISTRATION') ? 'Không có phòng khám nào thuộc khoa này' : 'Không có quầy nào'}
            </div>
         )}
      </div>
   );
};

export default CentralDisplay;

