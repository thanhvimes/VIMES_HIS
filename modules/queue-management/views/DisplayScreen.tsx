import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX,
  Activity,
  Monitor,
  ChevronRight,
  Settings,
  X,
  Check,
  ChevronDown,
  Maximize,
  Minimize
} from 'lucide-react';
import { apiFetch, getBaseUrl } from '../services/apiService';
import { AppSettings } from '../types';

interface CounterDisplayProps {
  onBack?: () => void;
  settings?: AppSettings;
}

const CounterDisplay: React.FC<CounterDisplayProps> = ({ onBack, settings }) => {
  const [ticket, setTicket] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [counterInfo, setCounterInfo] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [allCounters, setAllCounters] = useState<any[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('vimes_counter_muted') === 'true');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 7;
  
  const [layoutMode, setLayoutMode] = useState<'fullscreen' | 'split'>(() => {
    return (localStorage.getItem('vimes_counter_display_layout') as 'fullscreen' | 'split') || 'split';
  });

  const getBirthYear = (dob: any) => {
    if (!dob) return '----';
    const str = String(dob).trim();
    if (/^\d{4}$/.test(str)) return str;
    const partsDmy = str.split('/');
    if (partsDmy.length === 3 && partsDmy[2].length === 4) return partsDmy[2];
    const partsYmd = str.split('-');
    if (partsYmd.length >= 1 && partsYmd[0].length === 4) return partsYmd[0];
    const match = str.match(/\d{4}/);
    return match ? match[0] : '----';
  };

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

  const [hasInteracted, setHasInteracted] = useState(false);
  const [clock, setClock] = useState(new Date());
  
  const [selectedAreaState, setSelectedAreaState] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem('vimes_selected_area') || 'null');
    } catch (e) {
      return null;
    }
  });
  const [allAreas, setAllAreas] = useState<any[]>([]);
  const selectedCounterId = localStorage.getItem('vimes_counter_id');

  // Interactive configurations
  const [selectedService, setSelectedService] = useState<string>(() => {
     return localStorage.getItem('vimes_selected_service') || 'REGISTRATION';
  });
  const [allDepts, setAllDepts] = useState<any[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(() => {
     return localStorage.getItem('vimes_selected_dept_id') || 'KB';
  });
  const [allRooms, setAllRooms] = useState<any[]>([]);

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
      setIsCalling(false);
    }
  }, [isMuted]);


  // Persistent Audio Element to bypass Autoplay restrictions

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processNextInQueueRef = useRef<() => void>(() => {});
  const fallbackRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();

    const handleAudioEnded = () => {
      console.log('[CounterAudio] Finished playing, checking queue...');
      fallbackRef.current = null;
      isSpeakingRef.current = false;
      setIsSpeakingUI(false);
      setIsCalling(false);
      
      processNextInQueueRef.current();
    };

    const handleAudioError = (e: any) => {
      console.error('[CounterAudio] Audio element error:', e);
      if (fallbackRef.current) {
        const fb = fallbackRef.current;
        fallbackRef.current = null;
        fb();
      } else {
        isSpeakingRef.current = false;
        setIsSpeakingUI(false);
        setIsCalling(false);
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


  const fetchAreas = async () => {
    try {
      const data = await apiFetch('/api/public/areas');
      setAllAreas(data);
    } catch (e) {
      console.error('Fetch areas error:', e);
    }
  };

  useEffect(() => {
    apiFetch('/api/departments').then(data => {
      if (Array.isArray(data)) setAllDepts(data);
    }).catch(e => console.error('Error fetching depts:', e));
  }, []);

  useEffect(() => {
    if (selectedDeptId) {
      apiFetch(`/api/departments/${selectedDeptId}/rooms`).then(data => {
        if (Array.isArray(data)) setAllRooms(data);
      }).catch(e => console.error('Error fetching rooms:', e));
    }
  }, [selectedDeptId]);

  useEffect(() => {
    fetchAllCounters();
    fetchAreas();
    if (selectedCounterId) {
      fetchCounterInfo(selectedCounterId);
    } else {
      setShowSettings(true);
    }

    // Live clock
    const clockInterval = setInterval(() => setClock(new Date()), 1000);

    // SSE for real-time updates
    const baseUrl = getBaseUrl();
    const eventSource = new EventSource(`${baseUrl}/api/queue/events`);

    eventSource.onopen = () => {
      console.log('[SSE] Connection established/restored. Syncing counter info...');
      if (selectedCounterId) {
        fetchCounterInfo(selectedCounterId);
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'QUEUE_UPDATED' || data.type === 'NEW_CALL' || data.type === 'CALL_AGAIN') {
           fetchCounterInfo(selectedCounterId!);
           if (data.type === 'NEW_CALL' || data.type === 'CALL_AGAIN') {
              const eventCounterId = String(data.counterId);
              const myCounterId = String(selectedCounterId);
              const eventDeptId = data.ticket?.dept_code || data.deptId;
              const isSameDept = selectedService !== 'EXECUTION' || !selectedDeptId || !eventDeptId || String(eventDeptId) === String(selectedDeptId);
              
              if (eventCounterId === myCounterId && isSameDept) {
                  // Cập nhật UI ngay lập tức
                  const ticketNum = data.ticket?.ticket_number || data.ticket;
                  if (ticketNum) setTicket(ticketNum);
                  if (data.patientName) setPatientName(data.patientName);
                  
                  handleNewCall(data);
              }
           }
        }
      } catch (e) {
        console.error('[SSE] Error parsing data:', e);
      }
    };

    return () => { eventSource.close(); clearInterval(clockInterval); };
  }, [selectedCounterId, selectedService, selectedDeptId]);

  // Tự động lật trang khi danh sách chờ quá dài
  useEffect(() => {
    setCurrentPage(0);
  }, [waitingList]);

  useEffect(() => {
    if (waitingList.length <= ITEMS_PER_PAGE) {
      setCurrentPage(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentPage((prev) => {
        const totalPages = Math.ceil(waitingList.length / ITEMS_PER_PAGE);
        return (prev + 1) % totalPages;
      });
    }, 8000); // Lật trang mỗi 8 giây

    return () => clearInterval(interval);
  }, [waitingList.length]);

  const paginatedList = waitingList.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const processNextInQueue = () => {
    if (isSpeakingRef.current || voiceQueueRef.current.length === 0) return;

    const nextCall = voiceQueueRef.current.shift();
    if (!nextCall) return;

    isSpeakingRef.current = true;
    setIsSpeakingUI(true);
    
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
    
    setTicket(ticketNum);
    setPatientName(pName);
    setIsCalling(true);
    
    // Phát âm thanh Ding-dong
    playDingDong();
    
    setTimeout(() => {
      console.log('[CounterAudio] Triggering speech for:', pName);
      speakPatient(ticketNum, pName);
    }, 1500);
  };

  processNextInQueueRef.current = processNextInQueue;


  const fetchAllCounters = async () => {
    try {
      const data = await apiFetch('/api/public/counters');
      setAllCounters(data);
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  const fetchCounterInfo = async (id: string) => {
    try {
      let url = `/api/counter/${id}`;
      if ((selectedService === 'EXECUTION' || selectedService === 'REGISTRATION') && selectedDeptId) {
        url += `?deptId=${selectedDeptId}`;
      }
      const data = await apiFetch(url);
      setCounterInfo(data.counter);
      setTicket(data.currentTicket);
      setPatientName(data.currentName);
      setWaitingList(data.waitingList || []);
    } catch (e) {
      console.error('Fetch error:', e);
    }
  };

  const handleSelectCounter = (counter: any) => {
    localStorage.setItem('vimes_counter_id', String(counter.counter_id));
    setCounterInfo(counter);
    setShowSettings(false);
    window.location.reload();
  };

  const handleNewCall = (data: any) => {
    console.log('[CounterAudio] New Call added to queue Ref:', data);
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

  const speakPatient = (ticket: string, name: string) => {
    if (isMutedRef.current) {
      isSpeakingRef.current = false;
      setIsSpeakingUI(false);
      processNextInQueue();
      return;
    }

    const counterName = counterInfo?.counter_name || 'quầy phục vụ';

    const doLocalTTS = () => {
        if (!window.speechSynthesis) {
            isSpeakingRef.current = false;
            setIsSpeakingUI(false);
            processNextInQueue();
            return;
        }
        window.speechSynthesis.cancel();
        
        // TỐI ƯU OFFLINE: Lược bỏ tên bệnh nhân, chỉ đọc số thứ tự và quầy
        
        // Chuẩn hóa số thứ tự: Nếu có số 0 ở đầu (06) thì bỏ số 0 đi để đọc rõ hơn (6).
        // Nếu là chữ (A01) thì tách từng ký tự để đọc rõ (A 0 1).
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
            processNextInQueue();
        };
        utterance.onerror = () => {
            isSpeakingRef.current = false;
            setIsSpeakingUI(false);
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
          console.warn('[CounterAudio] Proxy TTS loading failed, switching to Offline Mode.');
          setIsOfflineMode(true); // Bật cờ Offline
          setTimeout(() => setIsOfflineMode(false), 60000); // Thử lại Online sau 1 phút
          doLocalTTS();
        };

        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(e => {
          console.warn('[CounterAudio] Proxy play() rejected, switching to Offline Mode.');
          if (fallbackRef.current) {
            const fb = fallbackRef.current;
            fallbackRef.current = null;
            fb();
          }
        });
    }
  };

  const formatTime = (d: Date) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (d: Date) => d.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });

  const isCDHARoom = () => {
    const roomName = String(counterInfo?.counter_name || '').toLowerCase();
    const deptId = String(selectedDeptId || '').toLowerCase();
    const deptName = String(allDepts.find(d => String(d.id) === selectedDeptId)?.name || '').toLowerCase();
    const keywords = [
      'cdha', 'chẩn đoán hình ảnh', 'chan doan hinh anh', 
      'siêu âm', 'sieu am', 'x-quang', 'xquang', 'mri', 
      'ct scanner', 'điện tim', 'dien tim', 'điện não', 'dien nao', 
      'thăm dò', 'tham do', 'nội soi', 'noi soi', 'hình ảnh', 'hinh anh'
    ];
    return keywords.some(k => roomName.includes(k) || deptId.includes(k) || deptName.includes(k));
  };

  const getBannerTitle = () => {
    switch (selectedService) {
      case 'RECEPTION':
      case 'REGISTRATION':
        return 'SỐ THỰ TỰ LẤY SỐ KHÁM';
      case 'SAMPLING':
        return 'CHỜ LẤY MÁU';
      case 'PAYMENT':
        return 'CHỜ THANH TOÁN';
      case 'DRUG':
        return 'CHỜ LĨNH THUỐC';
      case 'EXECUTION':
        if (isCDHARoom()) {
          return 'CHỜ THỰC HIỆN';
        }
        return 'CHỜ KHÁM';
      default:
        return 'SỐ THỰ TỰ GỌI KHÁM';
    }
  };

  const getSidebarTitle = () => {
    return selectedService === 'EXECUTION' ? 'PHÒNG KHÁM' : 'BÀN SỐ';
  };

  const getCounterValue = () => {
    if (selectedService === 'EXECUTION') {
      return counterInfo?.counter_name || '---';
    }
    return counterInfo?.counter_name?.match(/\d+/)?.[0] || '01';
  };

  const getFontSize = () => {
    if (selectedService === 'EXECUTION') {
      const len = (counterInfo?.counter_name || '').length;
      if (len > 12) return 'clamp(1.8rem, 3.5vw, 3rem)';
      if (len > 8) return 'clamp(2.5rem, 5vw, 4.5rem)';
      if (len > 5) return 'clamp(4rem, 8vw, 6rem)';
      return 'clamp(5rem, 12vw, 9rem)';
    }
    return 'clamp(7rem, 15vw, 13rem)';
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-white flex ${layoutMode === 'split' ? 'flex-col' : ''} overflow-hidden font-sans`}>
      
      {/* Floating Controls (For Staff) */}
      <div className="absolute top-4 right-4 z-50 flex gap-2 opacity-10 hover:opacity-100 transition-opacity">
         <button onClick={onBack} className="p-3 bg-slate-800 text-white rounded-lg shadow-lg" title="Quay lại"><ChevronRight className="rotate-180" /></button>
         <button 
           onClick={() => {
             const newMuted = !isMuted;
             setIsMuted(newMuted);
             localStorage.setItem('vimes_counter_muted', String(newMuted));
           }} 
           className={`p-3 rounded-lg shadow-lg transition-all ${isMuted ? 'bg-red-600 text-red-100' : 'bg-slate-800 text-white'}`}
           title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
         >
            {isMuted ? <VolumeX /> : <Volume2 />}
         </button>

         <button 
           onClick={toggleFullscreen} 
           title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
           className="p-3 bg-slate-800 text-white rounded-lg shadow-lg transition-all hover:bg-slate-700 active:scale-95"
         >
            {isFullscreen ? <Minimize /> : <Maximize />}
         </button>

         <button onClick={() => setShowSettings(true)} className="p-3 bg-slate-800 text-white rounded-lg shadow-lg" title="Cài đặt"><Settings /></button>
      </div>

      {layoutMode === 'split' ? (
         <>
            <div className="h-28 bg-[#f0a500] flex shrink-0 border-b border-[#f0a500]/10">
               {/* Main banner block */}
               <div className="flex-1 flex items-center justify-center">
                  <h1 className="text-5xl font-black uppercase tracking-wider text-white">
                     {getBannerTitle()}
                  </h1>
               </div>
            </div>

            {/* Main Content Body */}
            <div className="flex-1 flex overflow-hidden">
               {/* Cột trái: Bệnh nhân đang phục vụ (60%) */}
               <div className="w-[60%] flex flex-col justify-center items-center p-8 bg-white border-r border-slate-200">
                  <h3 className="text-4xl font-black text-[#2e408a] uppercase mb-4 tracking-wider text-center">BỆNH NHÂN ĐANG PHỤC VỤ</h3>
                  
                  <div 
                     className={`font-black leading-none tabular-nums transition-all duration-300 text-center ${isSpeakingUI ? 'animate-call-flash text-[#2e408a]' : 'text-[#2e408a]'}`} 
                     style={{fontSize: 'clamp(12rem, 28vw, 26rem)'}}
                  >
                     {ticket || '0'}
                  </div>
                  
                  {patientName ? (
                     <div className="mt-8 text-6xl lg:text-7xl font-black text-slate-800 uppercase border-t-4 border-slate-200 pt-8 w-[90%] text-center tracking-wide leading-tight break-words">
                        {patientName}
                     </div>
                  ) : (
                     <div className="mt-8 text-4xl font-black text-slate-350 uppercase border-t-4 border-slate-200 pt-8 w-[90%] text-center tracking-wide">
                        ĐANG CHỜ GỌI SỐ
                     </div>
                  )}
               </div>

               {/* Cột phải: Danh sách bệnh nhân chờ (40%) */}
               <div className="w-[40%] flex flex-col bg-slate-50 p-8 overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 pb-4 px-4 border-b border-slate-200 mb-4">
                     <div className="col-span-9 text-xl font-black text-[#2e408a] uppercase tracking-wider">Họ và tên người bệnh</div>
                     <div className="col-span-3 text-xl font-black text-[#2e408a] uppercase tracking-wider text-right">Năm sinh</div>
                  </div>

                  {/* Table Body / Cards List */}
                  <div 
                     key={currentPage} 
                     className="flex-1 overflow-hidden space-y-4 pr-2 custom-scrollbar animate-fade-in"
                  >
                     {paginatedList && paginatedList.length > 0 ? (
                        paginatedList.map((item, index) => (
                           <div 
                              key={item.id || index}
                              className="grid grid-cols-12 gap-4 items-center bg-white border border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow transition-all duration-200 px-6 py-5 rounded-[1.5rem]"
                           >
                              {/* Ticket Number & Name */}
                              <div className="col-span-9 flex items-center gap-4 min-w-0">
                                 <span className="inline-flex items-center justify-center px-4 py-1.5 bg-[#2e408a]/10 text-[#2e408a] font-extrabold rounded-2xl text-2xl lg:text-3xl tabular-nums shrink-0">
                                    {item.ticket_number}
                                 </span>
                                 <span className="text-2xl lg:text-3xl font-extrabold text-slate-800 uppercase leading-snug truncate">
                                    {item.patient_name || 'Bệnh nhân'}
                                 </span>
                              </div>
                              {/* Year of birth */}
                              <div className="col-span-3 text-right text-2xl lg:text-3xl font-black text-slate-500 tabular-nums">
                                 {getBirthYear(item.dob)}
                              </div>
                           </div>
                        ))
                     ) : (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                           <p className="text-2xl font-black uppercase tracking-wider">Không có bệnh nhân chờ</p>
                           <p className="text-base mt-1 text-slate-350">Hàng đợi trống hoặc đã phục vụ hết</p>
                        </div>
                     )}
                  </div>

                  {/* Bộ điều khiển / Chỉ báo lật trang */}
                  {waitingList.length > ITEMS_PER_PAGE && (
                     <div className="flex items-center justify-between mt-4 px-4 pt-3 border-t border-slate-200/60">
                        <span className="text-lg font-black text-[#2e408a]/60 uppercase tracking-wider">
                           Danh sách chờ ({waitingList.length} BN)
                        </span>
                        <div className="flex items-center gap-2">
                           {Array.from({ length: Math.ceil(waitingList.length / ITEMS_PER_PAGE) }).map((_, i) => (
                              <button
                                 key={i}
                                 onClick={() => setCurrentPage(i)}
                                 className={`h-3 rounded-full transition-all duration-300 ${
                                    currentPage === i ? 'w-8 bg-[#2e408a]' : 'w-3 bg-slate-300 hover:bg-[#2e408a]/40'
                                 }`}
                                 title={`Trang ${i + 1}`}
                              />
                           ))}
                        </div>
                        <span className="text-xl font-black text-[#2e408a] bg-[#2e408a]/10 px-4 py-1 rounded-full tabular-nums">
                           {currentPage + 1} / {Math.ceil(waitingList.length / ITEMS_PER_PAGE)}
                        </span>
                     </div>
                  )}
               </div>
            </div>
         </>
      ) : (
         <>
            {/* Sidebar - BÀN SỐ / PHÒNG KHÁM */}
            <div className={`w-[300px] ${counterInfo?.is_priority ? 'bg-[#ed1c24]' : 'bg-[#2e408a]'} flex flex-col items-center justify-center text-white shrink-0 relative`}>
               {/* Area name */}
               <div className="absolute top-0 left-0 right-0 bg-white/10 py-3 text-center">
                  <p className="text-sm font-bold uppercase tracking-widest text-blue-200">{selectedAreaState?.area_name || selectedAreaState?.name || 'Khu vực chung'}</p>
               </div>

               {/* Counter / Room label & value */}
               <h2 className="text-2xl font-bold uppercase tracking-[0.2em] mb-2 text-blue-200">{getSidebarTitle()}</h2>
               <div style={{fontSize: getFontSize()}} className="font-black leading-none px-4 text-center break-words uppercase">
                  {getCounterValue()}
               </div>

               {/* Clock & Status */}
               <div className="absolute bottom-0 left-0 right-0 bg-white/10 py-4 text-center">
                  <p className="text-3xl font-extrabold tabular-nums">{formatTime(clock)}</p>
                  <p className="text-xs font-medium text-blue-200 mt-1">{formatDate(clock)}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                     <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                     <p className="text-[10px] font-bold text-green-300 uppercase tracking-widest">Đang hoạt động</p>
                  </div>
               </div>
            </div>

            {/* Main Content - SỐ THỰ TỰ */}
            <div className="flex-1 flex flex-col min-w-0">
               {/* Top Banner */}
               <div className="h-24 bg-[#f0a500] flex items-center justify-center shrink-0">
                  <h1 className="text-4xl font-extrabold uppercase tracking-wider text-white">{getBannerTitle()}</h1>
               </div>

               {/* Body */}
               <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <h3 className="text-4xl font-bold text-[#2e408a] uppercase mb-6 tracking-wide">BỆNH NHÂN ĐANG PHỤC VỤ</h3>
                  <div className={`font-black leading-none tabular-nums transition-all duration-300 ${isSpeakingUI ? 'animate-call-flash text-[#2e408a]' : 'text-[#2e408a]'}`} style={{fontSize: 'clamp(10rem, 30vw, 28rem)'}}>
                     {ticket || '0'}
                  </div>
                  
                  {patientName && (
                     <div className="mt-8 text-6xl lg:text-7xl font-black text-slate-800 uppercase border-t-4 border-slate-200 pt-8 w-3/4 text-center tracking-wide leading-tight">
                        {patientName}
                     </div>
                  )}
               </div>
            </div>
         </>
      )}

      {/* Lớp phủ kích hoạt âm thanh (Để vượt qua chính sách Autoplay) */}
      {!hasInteracted && !isMuted && (
         <div className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-20">
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
               className="bg-yellow-400 hover:bg-yellow-500 text-black px-12 py-10 rounded-[3rem] font-black text-5xl shadow-2xl flex flex-col items-center gap-6 animate-pulse"
            >
               <Volume2 size={80} /> 
               <div className="text-center">
                  <p>BẤM VÀO ĐÂY</p>
                  <p className="text-2xl mt-2">ĐỂ KÍCH HOẠT LOA TẠI QUẦY</p>
               </div>
            </button>
         </div>
      )}

      {/* Settings Modal (Overlay) */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-12">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl p-12 shadow-2xl">
            <div className="flex items-center justify-between mb-10">
               <h2 className="text-4xl font-black text-slate-800 uppercase">Cấu hình Màn hình hiển thị</h2>
               <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={40}/></button>
            </div>

            {/* Service & Dept configuration */}
            <div className={`grid ${(selectedService === 'EXECUTION' || selectedService === 'REGISTRATION') ? 'grid-cols-2' : 'grid-cols-1'} gap-6 mb-6`}>
               <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Nghiệp vụ hiển thị</label>
                  <div className="relative">
                    <select
                      value={selectedService}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedService(val);
                        localStorage.setItem('vimes_selected_service', val);
                      }}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold appearance-none uppercase tracking-wider text-slate-700 text-lg cursor-pointer animate-fade-in"
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
                     <label className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Khoa điều trị</label>
                     <div className="relative">
                       <select
                         value={selectedDeptId}
                         onChange={(e) => {
                           const val = e.target.value;
                           setSelectedDeptId(val);
                           localStorage.setItem('vimes_selected_dept_id', val);
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

            {!(selectedService === 'EXECUTION' || selectedService === 'REGISTRATION') && (
              <div className="mb-6">
                 <label className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Chọn Khu Vực Hiển Thị</label>
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

            {/* Giao diện hiển thị (Layout Mode Selector) */}
            <div className="mb-6">
              <label className="block text-sm font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Giao diện hiển thị</label>
              <div className="grid grid-cols-2 gap-6">
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('fullscreen');
                    localStorage.setItem('vimes_counter_display_layout', 'fullscreen');
                  }}
                  className={`px-6 py-4 rounded-2xl border-4 transition-all text-center font-black uppercase tracking-wider text-lg ${
                    layoutMode === 'fullscreen'
                      ? 'border-[#2e408a] bg-[#2e408a]/5 text-[#2e408a]'
                      : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  Mặc định (Toàn màn hình)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('split');
                    localStorage.setItem('vimes_counter_display_layout', 'split');
                  }}
                  className={`px-6 py-4 rounded-2xl border-4 transition-all text-center font-black uppercase tracking-wider text-lg ${
                    layoutMode === 'split'
                      ? 'border-[#2e408a] bg-[#2e408a]/5 text-[#2e408a]'
                      : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  Tách cột (Hiển thị hàng chờ)
                </button>
              </div>
            </div>

            {/* List Selection Grid */}
            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar border border-slate-100 rounded-2xl p-4 bg-slate-50">
              {(selectedService === 'EXECUTION' || selectedService === 'REGISTRATION') ? (
                <div className="grid grid-cols-2 gap-4">
                  {allRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => {
                        localStorage.setItem('vimes_counter_id', String(room.id));
                        setShowSettings(false);
                        window.location.reload();
                      }}
                      className={`p-6 rounded-2xl border-4 transition-all text-left bg-white ${
                        selectedCounterId === String(room.id) 
                        ? 'border-[#2e408a] bg-[#2e408a]/5 shadow-md scale-[1.01]' 
                        : 'border-transparent hover:border-slate-350 shadow-sm'
                      }`}
                    >
                      <p className="text-slate-400 font-bold uppercase text-[10px] mb-1">Khoa: {selectedDeptId}</p>
                      <p className="text-xl font-black text-slate-800 uppercase leading-tight">{room.name}</p>
                    </button>
                  ))}
                  {allRooms.length === 0 && (
                    <div className="col-span-2 py-8 text-center text-slate-400 uppercase font-black text-sm tracking-widest">
                       Không có phòng khám nào thuộc khoa này
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {allCounters
                    .filter(c => !selectedAreaState || String(c.area_id) === String(selectedAreaState.area_id || selectedAreaState.id))
                    .map((c) => (
                    <button
                      key={c.counter_id}
                      onClick={() => handleSelectCounter(c)}
                      className={`p-6 rounded-2xl border-4 transition-all text-left bg-white ${
                        selectedCounterId === String(c.counter_id) 
                        ? 'border-[#2e408a] bg-[#2e408a]/5 shadow-md scale-[1.01]' 
                        : 'border-transparent hover:border-slate-350 shadow-sm'
                      }`}
                    >
                      <p className="text-slate-400 font-bold uppercase text-[10px] mb-1">{c.area_name || 'Khu vực'}</p>
                      <p className="text-xl font-black text-slate-800 uppercase leading-tight">{c.counter_name}</p>
                    </button>
                  ))}
                  {allCounters.filter(c => !selectedAreaState || String(c.area_id) === String(selectedAreaState.area_id || selectedAreaState.id)).length === 0 && (
                    <div className="col-span-2 py-8 text-center">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                        Không tìm thấy quầy nào thuộc {selectedAreaState?.area_name || selectedAreaState?.name || 'khu vực này'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');
        body { font-family: 'Be Vietnam Pro', sans-serif; }
        
        @keyframes call-flash {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
          50% { transform: scale(1.03); box-shadow: 0 0 60px 20px rgba(251, 191, 36, 0.6); border-color: #fbbf24; }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(251, 191, 36, 0.7); }
        }
        .animate-call-flash {
          animation: call-flash 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          border: 6px solid #fbbf24;
          border-radius: 2rem;
          padding: 20px 40px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
};

export default CounterDisplay;
