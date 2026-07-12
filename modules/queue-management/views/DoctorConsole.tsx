import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Play, 
  Bell, 
  Clock, 
  CheckCircle2, 
  SkipForward, 
  ArrowRightLeft, 
  Monitor,
  Activity,
  UserCheck,
  AlertCircle,
  History,
  MessageSquare,
  Search,
  LogOut,
  ArrowLeft,
  Briefcase,
  ChevronDown,
  Layers,
  MapPin,
  Phone,
  Calendar,
  Shield,
  HeartPulse,
  CalendarDays,
} from 'lucide-react';
import { apiFetch, getBaseUrl } from '../services/apiService';
import { AppSettings, KioskType } from '../types';
import { SurgeryConsole } from './SurgeryConsole';

interface OperatorConsoleProps {
  settings: AppSettings;
  counterId: number;
  counterName: string;
  onLogout: () => void;
}

const formatTicketTime = (timeStr: any, options?: Intl.DateTimeFormatOptions): string => {
  if (!timeStr) return '--:--';
  try {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], options || { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '--:--';
  }
};

const formatGender = (genderStr: any): string => {
  if (!genderStr) return 'Chưa xác định';
  const g = String(genderStr).trim().toUpperCase();
  if (g === 'M' || g === 'NAM') return 'Nam';
  if (g === 'F' || g === 'NỮ' || g === 'NU') return 'Nữ';
  return genderStr;
};

const formatDob = (dobStr: any): string => {
  if (!dobStr) return 'Chưa cập nhật';
  try {
    const d = new Date(dobStr);
    if (isNaN(d.getTime())) return dobStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const age = new Date().getFullYear() - year;
    return `${day}/${month}/${year} (${age} tuổi)`;
  } catch (e) {
    return dobStr;
  }
};

const OperatorConsole: React.FC<OperatorConsoleProps> = ({ settings, counterId, counterName, onLogout }) => {
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [concludingList, setConcludingList] = useState<any[]>([]);
  const [examinedList, setExaminedList] = useState<any[]>([]);
  const [surgeryList, setSurgeryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ waiting: 0, served: 0, avgTime: 0 });
  const [activeTab, setActiveTab] = useState<'CONSOLE' | 'WAITING' | 'CONCLUDING' | 'EXAMINED' | 'TRANSFER' | 'P' | 'S' | 'R' | 'F' | 'HIS_SURGERIES'>('CONSOLE');
  const effectiveTab = activeTab === 'CONSOLE' ? 'WAITING' : activeTab;

  // Custom dialog states
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'alert'
  });

  const showAlertDialog = (message: string, title = 'Thông báo') => {
    setDialogConfig({
      isOpen: true,
      title,
      message,
      type: 'alert',
      onConfirm: () => setDialogConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showConfirmDialog = (message: string, onConfirm: () => void, title = 'Xác nhận yêu cầu') => {
    setDialogConfig({
      isOpen: true,
      title,
      message,
      type: 'confirm',
      onConfirm: () => {
        setDialogConfig(prev => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => setDialogConfig(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic Console States
  const [departments, setDepartments] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [counters, setCounters] = useState<any[]>([]);

  const [activeService, setActiveService] = useState<KioskType>(() => {
    return (localStorage.getItem('vimes_selected_service') as KioskType) || 
           (localStorage.getItem('vimes_operator_service') as KioskType) || 
           'REGISTRATION';
  });

  const [selectedDept, setSelectedDept] = useState<string>(() => {
    return localStorage.getItem('vimes_selected_dept') || 
           localStorage.getItem('vimes_operator_dept') || 
           'KB';
  });

  const [activeCounterId, setActiveCounterId] = useState<number>(() => {
    const isRoomBased = activeService === 'EXECUTION' || activeService === 'REGISTRATION';
    if (isRoomBased) {
      try {
        const savedRoomJson = localStorage.getItem('vimes_selected_room');
        if (savedRoomJson) {
          const roomObj = JSON.parse(savedRoomJson);
          if (roomObj && roomObj.id) {
            const parsed = parseInt(roomObj.id);
            if (!isNaN(parsed)) return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to parse selected room:', e);
      }
    }
    
    const saved = localStorage.getItem('vimes_operator_counter_id');
    if (saved && saved !== 'undefined' && saved !== 'NaN') {
      const parsed = parseInt(saved);
      if (!isNaN(parsed)) return parsed;
    }
    return counterId || 1;
  });

  const [activeCounterName, setActiveCounterName] = useState<string>(() => {
    const isRoomBased = activeService === 'EXECUTION' || activeService === 'REGISTRATION';
    if (isRoomBased) {
      try {
        const savedRoomJson = localStorage.getItem('vimes_selected_room');
        if (savedRoomJson) {
          const roomObj = JSON.parse(savedRoomJson);
          if (roomObj && roomObj.name) return roomObj.name;
        }
      } catch (e) {}
    }
    return localStorage.getItem('vimes_operator_counter_name') || counterName || 'Quầy số 1';
  });

  // Fetch Departments and Counters
  useEffect(() => {
    apiFetch('/api/departments?type=DT').then(data => {
      if (Array.isArray(data)) setDepartments(data);
    }).catch(e => console.error('Error fetching depts:', e));
    
    apiFetch('/api/public/counters').then(data => {
      if (Array.isArray(data)) setCounters(data);
    }).catch(e => console.error('Error fetching counters:', e));
  }, []);

  useEffect(() => {
    if (selectedDept) {
      apiFetch(`/api/departments/${selectedDept}/rooms`).then(data => {
        if (Array.isArray(data)) setRooms(data);
      }).catch(e => console.error('Error fetching rooms:', e));
    }
  }, [selectedDept]);

  // Validate and sync activeCounterId with rooms/counters list to prevent invalid / NaN states
  useEffect(() => {
    if (activeService === 'SURGERY') return;
    if (activeService === 'EXECUTION') {
      if (rooms.length > 0) {
        const hasValidRoom = rooms.some(r => parseInt(r.id) === activeCounterId);
        if (!hasValidRoom || isNaN(activeCounterId)) {
          const r = rooms[0];
          const roomId = parseInt(r.id);
          if (!isNaN(roomId)) {
            setActiveCounterId(roomId);
            setActiveCounterName(r.name);
            localStorage.setItem('vimes_operator_counter_id', r.id.toString());
            localStorage.setItem('vimes_operator_counter_name', r.name);
          }
        }
      }
    } else {
      if (counters.length > 0) {
        const hasValidCounter = counters.some(c => c.counter_id === activeCounterId);
        if (!hasValidCounter || isNaN(activeCounterId)) {
          const c = counters[0];
          setActiveCounterId(c.counter_id);
          setActiveCounterName(c.counter_name);
          localStorage.setItem('vimes_operator_counter_id', c.counter_id.toString());
          localStorage.setItem('vimes_operator_counter_name', c.counter_name);
        }
      }
    }
  }, [activeService, rooms, counters, activeCounterId]);

  // Load Queue Data
  const loadData = useCallback(async () => {
    try {
      if (activeService === 'SURGERY') {
        try {
          const list = await apiFetch(`/api/queue/surgery-waiting-list`);
          if (Array.isArray(list)) {
            setSurgeryList(list);
          }
        } catch (err) {
          console.error('Error fetching surgery list in parent:', err);
        }
        return;
      }
      if (!activeCounterId || isNaN(activeCounterId)) return;
      
      try {
        const resObj = await apiFetch(`/api/queue/patients-by-status/${activeCounterId}?type=${activeService}&deptId=${selectedDept}`);
        if (resObj && resObj.success && resObj.data) {
          setWaitingList(resObj.data.waiting || []);
          setConcludingList(resObj.data.concluding || []);
          setExaminedList(resObj.data.examined || []);
        } else {
          // Fallback if structure is unexpected
          const waiting = await apiFetch(`/api/queue/waiting-list/${activeCounterId}?type=${activeService}&deptId=${selectedDept}`);
          if (Array.isArray(waiting)) setWaitingList(waiting);
          const historyData = await apiFetch(`/api/queue/history/${activeCounterId}?type=${activeService}&deptId=${selectedDept}`);
          if (Array.isArray(historyData)) {
            setHistory(historyData);
            setExaminedList(historyData);
          }
        }
      } catch (err) {
        console.warn('Lỗi gọi API patients-by-status, đang fallback về API cũ:', err);
        const waiting = await apiFetch(`/api/queue/waiting-list/${activeCounterId}?type=${activeService}&deptId=${selectedDept}`);
        if (Array.isArray(waiting)) setWaitingList(waiting);
        const historyData = await apiFetch(`/api/queue/history/${activeCounterId}?type=${activeService}&deptId=${selectedDept}`);
        if (Array.isArray(historyData)) {
          setHistory(historyData);
          setExaminedList(historyData);
        }
      }
      
      const statsData = await apiFetch(`/api/queue/stats/${activeCounterId}?type=${activeService}&deptId=${selectedDept}`);
      if (statsData && statsData.data) {
        const computedStats = {
          waiting: (statsData.data.normal_waiting || 0) + (statsData.data.priority_waiting || 0),
          served: statsData.data.total_served_today || 0,
          avgTime: 5
        };
        setStats(computedStats);
      }

      // Đồng bộ thông tin lượt khám hiện tại đang phục vụ tại quầy
      try {
        const counterInfo = await apiFetch(`/api/counter/${activeCounterId}?deptId=${selectedDept}`);
        if (counterInfo && counterInfo.activeTicket && counterInfo.activeTicket.ticket_number) {
          setCurrentTicket(counterInfo.activeTicket);
        } else {
          setCurrentTicket(null);
        }
      } catch (err) {
        console.error('Lỗi khi tải thông tin quầy:', err);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }, [activeCounterId, activeService, selectedDept]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  // SSE EventSource for Queue Updates
  useEffect(() => {
    const baseUrl = getBaseUrl();
    const eventSource = new EventSource(`${baseUrl}/api/queue/events`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[OperatorConsole SSE] Event received:', data);
        if (data.type === 'QUEUE_UPDATED' || data.type === 'SURGERY_UPDATED') {
          loadData();
        }
      } catch (e) {
        console.error('Error parsing SSE event:', e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [loadData]);

  // Handle Selector Changes
  const handleServiceChange = (service: KioskType) => {
    setActiveService(service);
    localStorage.setItem('vimes_operator_service', service);
    
    if (service === 'SURGERY') {
       setActiveTab('CONSOLE');
       return;
    }

    if (service !== 'EXECUTION' && activeTab === 'CONCLUDING') {
      setActiveTab('CONSOLE');
    }

    if (service === 'EXECUTION') {
      if (rooms.length > 0) {
        const r = rooms[0];
        setActiveCounterId(parseInt(r.id));
        setActiveCounterName(r.name);
        localStorage.setItem('vimes_operator_counter_id', r.id.toString());
        localStorage.setItem('vimes_operator_counter_name', r.name);
      }
    } else {
      if (counters.length > 0) {
        const c = counters[0];
        setActiveCounterId(c.counter_id);
        setActiveCounterName(c.counter_name);
        localStorage.setItem('vimes_operator_counter_id', c.counter_id.toString());
        localStorage.setItem('vimes_operator_counter_name', c.counter_name);
      }
    }
  };

  const handleDeptChange = (deptId: string) => {
    setSelectedDept(deptId);
    localStorage.setItem('vimes_operator_dept', deptId);
    
    apiFetch(`/api/departments/${deptId}/rooms`).then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setRooms(data);
        if (activeService === 'EXECUTION') {
          const r = data[0];
          setActiveCounterId(parseInt(r.id));
          setActiveCounterName(r.name);
          localStorage.setItem('vimes_operator_counter_id', r.id.toString());
          localStorage.setItem('vimes_operator_counter_name', r.name);
        }
      }
    });
  };

  const handleRoomChange = (roomIdStr: string) => {
    const room = rooms.find(r => String(r.id) === roomIdStr);
    if (room) {
      const idNum = parseInt(room.id);
      setActiveCounterId(idNum);
      setActiveCounterName(room.name);
      localStorage.setItem('vimes_operator_counter_id', room.id.toString());
      localStorage.setItem('vimes_operator_counter_name', room.name);
    }
  };

  const handleCounterChange = (counterIdStr: string) => {
    const counter = counters.find(c => String(c.counter_id) === counterIdStr);
    if (counter) {
      setActiveCounterId(counter.counter_id);
      setActiveCounterName(counter.counter_name);
      localStorage.setItem('vimes_operator_counter_id', counter.counter_id.toString());
      localStorage.setItem('vimes_operator_counter_name', counter.counter_name);
    }
  };

  // Operations
  const handleCallNext = async (isPriority = false) => {
    if (loading || currentTicket) return;
    
    let cid = activeCounterId;
    if (!cid || isNaN(cid)) {
      if (activeService === 'EXECUTION' && rooms.length > 0) {
        cid = parseInt(rooms[0].id) || 1;
      } else if (counters.length > 0) {
        cid = counters[0].counter_id || 1;
      } else {
        cid = 1;
      }
      setActiveCounterId(cid);
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/queue/call-next', {
        method: 'POST',
        body: JSON.stringify({ counterId: cid, isPriority, type: activeService, deptId: selectedDept })
      });
      if (res && res.data) {
        setCurrentTicket(res.data);
      } else {
        showAlertDialog("Hiện tại không có bệnh nhân nào trong danh sách đang chờ.", "Hết bệnh nhân");
      }
      loadData();
    } catch (e) { 
      console.error(e); 
      showAlertDialog(e instanceof Error ? e.message : 'Lỗi gọi bệnh nhân', 'Lỗi hệ thống');
    }
    finally { setLoading(false); }
  };

  const handleComplete = async () => {
    if (!currentTicket) return;
    
    let cid = activeCounterId;
    if (!cid || isNaN(cid)) {
      cid = 1;
    }
    
    setLoading(true);
    try {
      await apiFetch('/api/queue/complete', {
        method: 'POST',
        body: JSON.stringify({ ticketId: currentTicket.id, counterId: cid })
      });
      setCurrentTicket(null);
      loadData();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleRecall = async () => {
    if (!currentTicket) return;
    try {
      await apiFetch('/api/queue/call-again', {
        method: 'POST',
        body: JSON.stringify({ ticketId: currentTicket.id })
      });
    } catch (e) { console.error(e); }
  };

  const handleCallAgain = async (ticket: any) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/queue/call-again', {
        method: 'POST',
        body: JSON.stringify({ ticketId: ticket.id })
      });
      if (res && res.data) {
        setCurrentTicket(res.data);
      } else {
        setCurrentTicket({
          ...ticket,
          status: 'CALLING'
        });
      }
      loadData();
    } catch (e) {
      console.error(e);
      showAlertDialog(e instanceof Error ? e.message : 'Lỗi gọi lại bệnh nhân', 'Lỗi hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleCallSpecific = async (ticketId: string) => {
    if (loading) return;
    
    const proceedCall = async () => {
      setLoading(true);
      try {
        const res = await apiFetch('/api/queue/call-specific', {
          method: 'POST',
          body: JSON.stringify({ ticketId, counterId: activeCounterId })
        });
        if (res && res.data) {
          setCurrentTicket(res.data);
        }
        loadData();
      } catch (e) {
        console.error(e);
        showAlertDialog(e instanceof Error ? e.message : 'Lỗi gọi bệnh nhân chỉ định', 'Lỗi hệ thống');
      } finally {
        setLoading(false);
      }
    };

    if (currentTicket) {
      showConfirmDialog(
        "Đang có bệnh nhân đang phục vụ. Bạn có muốn hoàn tất bệnh nhân hiện tại và gọi bệnh nhân mới chỉ định này không?",
        async () => {
          try {
            await apiFetch('/api/queue/complete', {
              method: 'POST',
              body: JSON.stringify({ ticketId: currentTicket.id, counterId: activeCounterId })
            });
            await proceedCall();
          } catch (e) {
            console.error('Lỗi hoàn tất bệnh nhân hiện tại:', e);
            await proceedCall();
          }
        },
        "Xác nhận đổi bệnh nhân"
      );
    } else {
      await proceedCall();
    }
  };

  const handleSkip = async () => {
    if (!currentTicket) return;
    try {
      await apiFetch('/api/queue/skip', {
        method: 'POST',
        body: JSON.stringify({ ticketId: currentTicket.id })
      });
      setCurrentTicket(null);
      loadData();
    } catch (e) { console.error(e); }
  };

  const handleTransfer = async (targetAreaId: number) => {
    if (!currentTicket) return;
    try {
      await apiFetch('/api/queue/transfer', {
        method: 'POST',
        body: JSON.stringify({ ticketId: currentTicket.id, targetAreaId })
      });
      setCurrentTicket(null);
      loadData();
    } catch (e) { console.error(e); }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;
      if (activeService === 'SURGERY') return; 
      if (e.code === 'Space') { e.preventDefault(); handleCallNext(); }
      if (e.code === 'Enter') { e.preventDefault(); handleComplete(); }
      if (e.key === 'F2') { e.preventDefault(); handleRecall(); }
      if (e.key === 'F3') { e.preventDefault(); handleSkip(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTicket, loading, activeService]);

  const filteredWaitingList = waitingList.filter(t => 
    (t.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(t.ticket_number || '').includes(searchQuery)
  );

  const filteredConcludingList = concludingList.filter(t => 
    (t.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(t.ticket_number || '').includes(searchQuery)
  );

  const filteredExaminedList = examinedList.filter(t => 
    (t.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(t.ticket_number || '').includes(searchQuery)
  );

  const filteredHistory = history.filter(t => 
    (t.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(t.ticket_number || '').includes(searchQuery)
  );

  console.log('[DEBUG RENDER] currentTicket:', currentTicket);
  return (
    <div className="h-full w-full bg-slate-50 flex overflow-hidden font-sans relative">
      
      {/* Mobile Bottom Navigation Bar (Visible only on mobile < 768px) */}
      {activeService !== 'SURGERY' && (
         <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around z-50 px-4 shadow-lg">
            <button 
              onClick={() => setActiveTab('CONSOLE')}
              className={`flex flex-col items-center justify-center transition-all ${activeTab === 'CONSOLE' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}`}
            >
               <Activity size={18} />
               <span className="text-[8px] font-black uppercase mt-1">Gọi số</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('WAITING')}
              className={`flex flex-col items-center justify-center transition-all ${activeTab === 'WAITING' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}`}
            >
               <Users size={18} />
               <span className="text-[8px] font-black uppercase mt-1">
                  {activeService === 'EXECUTION' ? 'Đang chờ' : 'Đang đợi'} ({waitingList.length})
               </span>
            </button>

            {activeService === 'EXECUTION' && (
               <button 
                 onClick={() => setActiveTab('CONCLUDING')}
                 className={`flex flex-col items-center justify-center transition-all ${activeTab === 'CONCLUDING' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}`}
               >
                  <Clock size={18} />
                  <span className="text-[8px] font-black uppercase mt-1">Chờ kết luận ({concludingList.length})</span>
               </button>
            )}

            <button 
              onClick={() => setActiveTab('EXAMINED')}
              className={`flex flex-col items-center justify-center transition-all ${activeTab === 'EXAMINED' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}`}
            >
               <CheckCircle2 size={18} />
               <span className="text-[8px] font-black uppercase mt-1">
                  {activeService === 'EXECUTION' ? 'Đã khám' : 'Đã thực hiện'} ({examinedList.length})
               </span>
            </button>

            <button 
              onClick={() => setActiveTab('TRANSFER')}
              className={`flex flex-col items-center justify-center transition-all ${activeTab === 'TRANSFER' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}`}
            >
               <ArrowRightLeft size={18} />
               <span className="text-[8px] font-black uppercase mt-1">Chuyển</span>
            </button>

            <button 
              onClick={onLogout}
              className="flex flex-col items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
              title="Trở về Portal"
            >
               <ArrowLeft size={18} />
               <span className="text-[8px] font-black uppercase mt-1">Trở về</span>
            </button>
         </div>
      )}

      {/* Sidebar: Navigation & Status */}
      <aside className="w-20 bg-slate-900 hidden md:flex flex-col items-center py-8 gap-8 border-r border-slate-800 shrink-0">
         <button 
           onClick={onLogout}
           title="Quay lại Portal"
           className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
         >
            <ArrowLeft size={20} />
         </button>
         
         <div className="flex-1 flex flex-col gap-4">
            {activeService !== 'SURGERY' ? (
               <>
                  <button 
                    onClick={() => setActiveTab('WAITING')}
                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all relative ${effectiveTab === 'WAITING' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    title={activeService === 'EXECUTION' ? 'Đang chờ' : 'Đang đợi'}
                  >
                     <Users size={20} />
                     {waitingList.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-slate-900">{waitingList.length}</span>
                     )}
                  </button>
                  {activeService === 'EXECUTION' && (
                     <button 
                       onClick={() => setActiveTab('CONCLUDING')}
                       className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all relative ${effectiveTab === 'CONCLUDING' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                       title="Chờ kết luận"
                     >
                        <Clock size={20} />
                        {concludingList.length > 0 && (
                           <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-slate-900">{concludingList.length}</span>
                        )}
                     </button>
                  )}
                  <button 
                    onClick={() => setActiveTab('EXAMINED')}
                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all relative ${effectiveTab === 'EXAMINED' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    title={activeService === 'EXECUTION' ? 'Đã khám' : 'Đã thực hiện'}
                  >
                     <CheckCircle2 size={20} />
                     {examinedList.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-emerald-600 text-white rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-slate-900">{examinedList.length}</span>
                     )}
                  </button>
                  <button 
                    onClick={() => setActiveTab('TRANSFER')}
                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${effectiveTab === 'TRANSFER' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    title="Chuyển quầy"
                  >
                     <ArrowRightLeft size={20} />
                  </button>
               </>
            ) : (
               <>
                  {/* Bảng phẫu thuật (Tổng quan) */}
                  <button 
                    onClick={() => setActiveTab('CONSOLE')}
                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all relative ${activeTab === 'CONSOLE' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    title="Bảng phẫu thuật"
                  >
                     <Activity size={20} />
                     {surgeryList.filter(s => s.status !== 'F').length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-650 text-white rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-slate-900">
                           {surgeryList.filter(s => s.status !== 'F').length}
                        </span>
                     )}
                  </button>

                  {/* Chuẩn bị (P) */}
                  <button 
                    onClick={() => setActiveTab('P')}
                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all relative ${activeTab === 'P' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    title="Chuẩn bị (P)"
                  >
                     <Users size={20} />
                     {surgeryList.filter(s => s.status === 'P').length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-slate-900">
                           {surgeryList.filter(s => s.status === 'P').length}
                        </span>
                     )}
                  </button>

                  {/* Đang mổ (S) */}
                  <button 
                    onClick={() => setActiveTab('S')}
                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all relative ${activeTab === 'S' ? 'bg-slate-800 text-rose-500' : 'text-slate-500 hover:text-rose-500 hover:bg-slate-800'}`}
                    title="Đang mổ (S)"
                  >
                     <Play size={20} fill={activeTab === 'S' ? 'currentColor' : 'none'} />
                     {surgeryList.filter(s => s.status === 'S').length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-slate-900">
                           {surgeryList.filter(s => s.status === 'S').length}
                        </span>
                     )}
                  </button>

                  {/* Hồi tỉnh (R) */}
                  <button 
                    onClick={() => setActiveTab('R')}
                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all relative ${activeTab === 'R' ? 'bg-slate-800 text-amber-500' : 'text-slate-500 hover:text-amber-500 hover:bg-slate-800'}`}
                    title="Hồi tỉnh (R)"
                  >
                     <Clock size={20} />
                     {surgeryList.filter(s => s.status === 'R').length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-slate-900">
                           {surgeryList.filter(s => s.status === 'R').length}
                        </span>
                     )}
                  </button>

                  {/* Đã về khoa (F) */}
                  <button 
                    onClick={() => setActiveTab('F')}
                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all relative ${activeTab === 'F' ? 'bg-slate-800 text-emerald-500' : 'text-slate-500 hover:text-emerald-500 hover:bg-slate-800'}`}
                    title="Đã về khoa (F)"
                  >
                     <CheckCircle2 size={20} />
                     {surgeryList.filter(s => s.status === 'F').length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-emerald-600 text-white rounded-full text-[9px] font-black h-4 w-4 flex items-center justify-center border border-slate-900">
                           {surgeryList.filter(s => s.status === 'F').length}
                        </span>
                     )}
                  </button>

                  {/* Lấy ca mổ HIS */}
                  <button 
                    onClick={() => setActiveTab('HIS_SURGERIES')}
                    className={`h-12 w-12 rounded-xl flex items-center justify-center transition-all ${activeTab === 'HIS_SURGERIES' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
                    title="Lấy ca mổ HIS"
                  >
                     <CalendarDays size={20} />
                  </button>
               </>
            )}
         </div>

         <button 
           onClick={() => window.location.href = '/'}
           title="Đăng xuất hệ thống"
           className="h-12 w-12 rounded-xl flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
         >
            <LogOut size={20} />
         </button>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col overflow-hidden">
         
         {/* Header */}
         <header className="min-h-20 py-4 bg-white border-b border-slate-200 px-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shrink-0">
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 w-full md:w-auto">
               <div className="h-10 w-10 bg-slate-100 rounded-xl hidden md:flex items-center justify-center text-slate-400 shrink-0">
                  <Monitor size={20} />
               </div>
               
               {/* DYNAMIC SELECTORS IN HEADER */}
               <div className="flex flex-wrap items-center gap-2 md:gap-4 bg-slate-50 p-1.5 md:p-1 rounded-2xl border border-slate-100 shadow-inner w-full md:w-auto">
                  {/* SERVICE SELECTOR */}
                  <div className="relative flex items-center px-3 py-1 bg-white rounded-xl shadow-sm border border-slate-150">
                     <Briefcase size={14} className="text-blue-500 mr-2" />
                     <div className="text-left">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Nghiệp vụ</p>
                        <select 
                           value={activeService}
                           onChange={(e) => handleServiceChange(e.target.value as KioskType)}
                           className="bg-transparent text-[11px] font-extrabold text-slate-700 focus:outline-none cursor-pointer uppercase tracking-wider pr-6 appearance-none"
                        >
                           <option value="RECEPTION">Tiếp nhận</option>
                           <option value="SAMPLING">Lấy mẫu XN</option>
                           <option value="REGISTRATION">Lấy số khám</option>
                           <option value="PAYMENT">Thanh toán</option>
                           <option value="DRUG">Lĩnh thuốc</option>
                           <option value="EXECUTION">Khám bệnh, CĐHA</option>
                           <option value="SURGERY">Phòng mổ</option>
                        </select>
                     </div>
                     <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  {/* DEPT SELECTOR */}
                  {activeService === 'EXECUTION' && (
                     <div className="relative flex items-center px-3 py-1 bg-white rounded-xl shadow-sm border border-slate-150">
                        <Layers size={14} className="text-indigo-500 mr-2" />
                        <div className="text-left">
                           <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">Khoa</p>
                           <select 
                              value={selectedDept}
                              onChange={(e) => handleDeptChange(e.target.value)}
                              className="bg-transparent text-[11px] font-extrabold text-slate-700 focus:outline-none cursor-pointer uppercase tracking-wider pr-6 appearance-none min-w-[120px]"
                           >
                              {departments.map(dept => (
                                 <option key={dept.id} value={dept.id}>{dept.name}</option>
                              ))}
                           </select>
                        </div>
                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                     </div>
                  )}

                  {/* ROOM OR COUNTER SELECTOR */}
                  {activeService !== 'SURGERY' && (
                     <div className="relative flex items-center px-3 py-1 bg-white rounded-xl shadow-sm border border-slate-150">
                        <MapPin size={14} className="text-emerald-500 mr-2" />
                        <div className="text-left">
                           <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none">
                              {activeService === 'EXECUTION' ? 'Phòng khám' : 'Quầy gọi'}
                           </p>
                           {activeService === 'EXECUTION' ? (
                              <select 
                                 value={isNaN(activeCounterId) || !activeCounterId ? '' : activeCounterId}
                                 onChange={(e) => handleRoomChange(e.target.value)}
                                 className="bg-transparent text-[11px] font-extrabold text-emerald-600 focus:outline-none cursor-pointer uppercase tracking-wider pr-6 appearance-none min-w-[140px]"
                              >
                                 <option value="" disabled>Chọn Phòng</option>
                                 {rooms.map(room => (
                                    <option key={room.id} value={room.id}>{room.name}</option>
                                 ))}
                              </select>
                           ) : (
                              <select 
                                 value={isNaN(activeCounterId) || !activeCounterId ? '' : activeCounterId}
                                 onChange={(e) => handleCounterChange(e.target.value)}
                                 className="bg-transparent text-[11px] font-extrabold text-blue-600 focus:outline-none cursor-pointer uppercase tracking-wider pr-6 appearance-none min-w-[140px]"
                              >
                                 <option value="" disabled>Chọn Quầy</option>
                                 {counters.map(counter => (
                                    <option key={counter.counter_id} value={counter.counter_id}>{counter.counter_name}</option>
                                 ))}
                              </select>
                           )}
                        </div>
                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                     </div>
                  )}
               </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 w-full md:w-auto">
               <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <Clock size={16} className="text-slate-400" />
                  <span className="text-xs font-black text-slate-600 uppercase">{new Date().toLocaleTimeString()}</span>
               </div>
               <div className="hidden md:block h-8 w-[1px] bg-slate-200"></div>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái gọi</p>
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-wide">
                     {activeService === 'SURGERY' ? 'PHÒNG MỔ' : activeCounterName}
                  </p>
               </div>
               <div className="h-10 w-10 bg-gradient-to-tr from-blue-600 to-indigo-650 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-md">AD</div>
            </div>
         </header>

         <div className="flex-1 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden p-4 md:p-6 gap-4 md:gap-6 pb-24 md:pb-6">
            
            {activeService === 'SURGERY' ? (
               <SurgeryConsole 
                  settings={settings}
                  departments={departments}
                  surgeryRooms={rooms}
                  selectedDept={selectedDept}
                  onLogout={onLogout}
                  surgeryList={surgeryList}
                  loadData={loadData}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
               />
            ) : (
               <>
                  {/* QMS WORKSPACE: LEFT PANEL (Calling patient & Stats) */}
                  <section className={`flex-1 flex-col gap-6 md:overflow-y-auto pr-0 md:pr-2 custom-scrollbar ${activeTab === 'CONSOLE' ? 'flex' : 'hidden md:flex'}`}>
                     
                     {/* Calling Card */}
                     <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col shrink-0">
                        <div className="bg-slate-950 px-8 py-4 flex items-center justify-between">
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Bệnh nhân hiện tại</span>
                           <div className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-[9px] font-black uppercase border border-blue-500/30">Đang phục vụ</div>
                        </div>
                        
                        <div className="p-10 flex flex-col items-center text-center">
                           {currentTicket && currentTicket.ticket_number ? (
                              <>
                                 <h2 className="text-8xl font-black text-blue-600 tracking-tighter mb-4 font-mono">{currentTicket.ticket_number}</h2>
                                 <h3 className="text-3xl font-black text-slate-900 uppercase mb-2 tracking-tight">{currentTicket.patient_name || 'Khách lẻ'}</h3>
                                 <div className="flex items-center gap-4 text-slate-400 text-sm font-bold uppercase tracking-widest">
                                    <span>Mã HS: {currentTicket.doc_no || 'N/A'}</span>
                                    <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                                    <span>{currentTicket.is_priority ? '🔥 Ưu tiên' : 'Tiêu chuẩn'}</span>
                                 </div>
                              </>
                           ) : (
                              <div className="py-12 flex flex-col items-center gap-4">
                                 <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-250">
                                    <UserCheck size={40} />
                                 </div>
                                 <p className="text-slate-450 font-bold uppercase tracking-widest text-sm italic">Hệ thống đang sẵn sàng gọi số</p>
                              </div>
                           )}
                        </div>

                        <div className="p-4 md:p-8 bg-slate-50/50 border-t border-slate-100 flex flex-wrap md:flex-nowrap gap-3 md:gap-4">
                           {currentTicket && currentTicket.ticket_number ? (
                              <>
                                 <button 
                                   onClick={handleComplete}
                                   className="flex-[2] h-16 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                                 >
                                    <CheckCircle2 size={24} /> HOÀN TẤT <span className="opacity-50 font-medium text-[10px] tracking-normal ml-1">(ENTER)</span>
                                 </button>
                                 <button 
                                   onClick={handleRecall}
                                   className="flex-[1.5] h-16 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                                   title="Gọi lại (F2)"
                                 >
                                    <Bell size={24} /> GỌI LẠI <span className="opacity-50 font-medium text-[10px] tracking-normal ml-1">(F2)</span>
                                 </button>
                                 <button 
                                   onClick={handleSkip}
                                   className="h-16 w-16 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 rounded-2xl flex items-center justify-center transition-all shadow-sm active:scale-95"
                                    title="Bỏ qua (F3)"
                                 >
                                    <SkipForward size={24} />
                                 </button>
                              </>
                           ) : (
                              <button 
                                onClick={() => handleCallNext()}
                                disabled={loading}
                                className="flex-1 h-16 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-2xl font-black flex items-center justify-center gap-4 shadow-xl shadow-blue-600/20 transition-all active:scale-95"
                              >
                                 {loading ? <div className="h-6 w-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Play size={24} fill="currentColor" />}
                                 GỌI SỐ TIẾP THEO <span className="opacity-50 font-medium text-xs tracking-normal">(SPACE)</span>
                              </button>
                           )}
                        </div>
                     </div>

                     {/* Quick Stats Grid */}
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                           <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                              <Users size={24} />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                 {activeService === 'EXECUTION' ? 'Đang chờ' : 'Đang đợi'}
                              </p>
                              <p className="text-2xl font-black text-slate-900">{waitingList.length}</p>
                           </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                           <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                              <CheckCircle2 size={24} />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đã gọi</p>
                              <p className="text-2xl font-black text-slate-900">{stats.served || 0}</p>
                           </div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
                           <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                              <Clock size={24} />
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian TB</p>
                              <p className="text-2xl font-black text-slate-900">{stats.avgTime || 0}m</p>
                           </div>
                        </div>
                     </div>

                     {/* Patient Details Panel */}
                     <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                           <div className="flex items-center gap-2">
                              <div className="h-2.5 w-2.5 bg-blue-600 rounded-full animate-pulse" />
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Thông tin chi tiết bệnh nhân</h4>
                           </div>
                           <button className="text-blue-600 font-bold text-[10px] uppercase tracking-widest hover:text-blue-800 transition-colors border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-blue-50">Xem hồ sơ HIS</button>
                        </div>
                        
                        {currentTicket && currentTicket.ticket_number ? (
                           <div className="space-y-6">
                              {/* Administrative Info Grid */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-8">
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                       <UserCheck size={14} />
                                       <p className="text-[10px] font-bold uppercase tracking-wider">Giới tính</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                       {formatGender(currentTicket.gender)}
                                    </p>
                                 </div>
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                       <Calendar size={14} />
                                       <p className="text-[10px] font-bold uppercase tracking-wider">Ngày sinh / Tuổi</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                       {formatDob(currentTicket.dob)}
                                    </p>
                                 </div>
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                       <Phone size={14} />
                                       <p className="text-[10px] font-bold uppercase tracking-wider">Số điện thoại</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                       {currentTicket.phone || 'Chưa cập nhật'}
                                    </p>
                                 </div>
                                 
                                 <div className="col-span-1 sm:col-span-2 space-y-1">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                       <MapPin size={14} />
                                       <p className="text-[10px] font-bold uppercase tracking-wider">Địa chỉ liên hệ</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 leading-relaxed">
                                       {currentTicket.address || 'Đang cập nhật...'}
                                    </p>
                                 </div>
                                 <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                       <Shield size={14} />
                                       <p className="text-[10px] font-bold uppercase tracking-wider">Đối tượng / Thẻ</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                       {currentTicket.object_type === 'BHYT' 
                                          ? `BHYT (${currentTicket.insurance_number || 'Thiếu số thẻ'})` 
                                          : 'Viện phí / Dịch vụ'}
                                    </p>
                                 </div>
                              </div>

                              {/* Reason / Diagnostic section */}
                              <div className="border-t border-slate-100 pt-4 space-y-1">
                                 <div className="flex items-center gap-1.5 text-slate-400">
                                    <MessageSquare size={14} />
                                    <p className="text-[10px] font-bold uppercase tracking-wider">Lý do khám / Chẩn đoán sơ bộ</p>
                                 </div>
                                 <p className="text-sm font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                                    {currentTicket.reason || 'Khám sức khỏe / Theo dõi định kỳ'}
                                 </p>
                              </div>

                              {/* Vitals Section */}
                              <div className="border-t border-slate-100 pt-4 space-y-3">
                                 <div className="flex items-center gap-1.5 text-slate-400">
                                    <HeartPulse size={14} />
                                    <p className="text-[10px] font-bold uppercase tracking-wider">Thông số sinh hiệu tiếp đón</p>
                                 </div>
                                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="bg-rose-50/50 border border-rose-100/80 p-3 rounded-2xl flex flex-col justify-center">
                                       <span className="text-[9px] font-bold text-rose-500 uppercase tracking-widest mb-1">Huyết áp</span>
                                       <span className="text-sm font-black text-rose-700">
                                          {currentTicket.bp_sys > 0 || currentTicket.bp_dia > 0 
                                             ? `${currentTicket.bp_sys}/${currentTicket.bp_dia} mmHg` 
                                             : '--/--'}
                                       </span>
                                    </div>
                                    <div className="bg-amber-50/50 border border-amber-100/80 p-3 rounded-2xl flex flex-col justify-center">
                                       <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest mb-1">Mạch</span>
                                       <span className="text-sm font-black text-amber-800">
                                          {currentTicket.pulse > 0 ? `${currentTicket.pulse} lần/phút` : '--'}
                                       </span>
                                    </div>
                                    <div className="bg-blue-50/50 border border-blue-100/80 p-3 rounded-2xl flex flex-col justify-center">
                                       <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1">Nhiệt độ</span>
                                       <span className="text-sm font-black text-blue-800">
                                          {currentTicket.temperature > 0 ? `${currentTicket.temperature} °C` : '--'}
                                       </span>
                                    </div>
                                    <div className="bg-emerald-50/50 border border-emerald-100/80 p-3 rounded-2xl flex flex-col justify-center">
                                       <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Cân nặng / BMI</span>
                                       <span className="text-sm font-black text-emerald-800">
                                          {currentTicket.weight > 0 
                                             ? `${currentTicket.weight} kg (${currentTicket.bmi || '--'})` 
                                             : '--'}
                                       </span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ) : (
                           <div className="py-12 text-center text-slate-300 text-sm font-medium italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                              Vui lòng gọi bệnh nhân để xem chi tiết thông tin lâm sàng
                           </div>
                        )}
                     </div>

                  </section>

                  {/* QMS WORKSPACE: RIGHT PANEL (Tabbed waiting/history) */}
                  <aside className={`w-full md:w-80 lg:w-96 flex-col gap-6 shrink-0 ${activeTab !== 'CONSOLE' ? 'flex' : 'hidden md:flex'}`}>
                     
                     <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                           <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
                              {effectiveTab === 'WAITING' 
                                 ? (activeService === 'EXECUTION' ? 'Danh sách đang chờ' : 'Danh sách đang đợi') 
                                 : effectiveTab === 'CONCLUDING' 
                                    ? 'Danh sách chờ kết luận' 
                                    : effectiveTab === 'EXAMINED' 
                                       ? (activeService === 'EXECUTION' ? 'Danh sách đã khám' : 'Danh sách đã thực hiện') 
                                       : effectiveTab === 'TRANSFER' 
                                          ? 'Chuyển quầy' 
                                          : 'Lịch sử phục vụ'}
                           </h3>
                           <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                              effectiveTab === 'WAITING' 
                                 ? 'bg-blue-100 text-blue-600' 
                                 : effectiveTab === 'CONCLUDING' 
                                    ? 'bg-amber-100 text-amber-600' 
                                    : effectiveTab === 'EXAMINED' 
                                       ? 'bg-emerald-100 text-emerald-600' 
                                       : 'bg-slate-100 text-slate-600'
                           }`}>
                              {effectiveTab === 'WAITING' 
                                 ? waitingList.length 
                                 : effectiveTab === 'CONCLUDING' 
                                    ? concludingList.length 
                                    : effectiveTab === 'EXAMINED' 
                                       ? examinedList.length 
                                       : history.length}
                           </div>
                        </div>

                        <div className="flex-1 md:overflow-y-auto p-4 custom-scrollbar min-h-[300px]">
                           {effectiveTab === 'WAITING' && (
                              <div className="space-y-3">
                                 {waitingList.length === 0 ? (
                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                       <AlertCircle size={32} className="text-slate-200" />
                                       <p className="text-xs text-slate-400 font-bold uppercase italic">
                                          {activeService === 'EXECUTION' ? 'Không có bệnh nhân đang chờ' : 'Không có ai đang đợi'}
                                       </p>
                                    </div>
                                 ) : (
                                    filteredWaitingList.map((t) => (
                                       <div 
                                          key={t.id} 
                                          onClick={() => handleCallSpecific(t.id)}
                                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${t.is_priority ? 'bg-amber-50 border-amber-100 hover:border-amber-300' : 'bg-slate-50 border-slate-100 hover:border-blue-300'} group`}
                                       >
                                          <div className="flex justify-between items-start mb-2">
                                             <span className={`text-xl font-black ${t.is_priority ? 'text-amber-600' : 'text-slate-800'}`}>{t.ticket_number}</span>
                                             <span className="text-[9px] font-black text-slate-400 uppercase">{formatTicketTime(t.created_at)}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                             <span className="text-xs font-bold text-slate-600 uppercase line-clamp-1">{t.patient_name || 'Khách lẻ'}</span>
                                             <button className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all">
                                                <Play size={14} fill="currentColor" />
                                             </button>
                                          </div>
                                       </div>
                                    ))
                                 )}
                              </div>
                           )}

                           {effectiveTab === 'CONCLUDING' && (
                              <div className="space-y-3">
                                 {concludingList.length === 0 ? (
                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                       <AlertCircle size={32} className="text-slate-200" />
                                       <p className="text-xs text-slate-400 font-bold uppercase italic">Không có bệnh nhân chờ kết luận</p>
                                    </div>
                                 ) : (
                                    filteredConcludingList.map((t) => (
                                       <div 
                                          key={t.id} 
                                          onClick={() => handleCallSpecific(t.id)}
                                          className="p-4 rounded-2xl border border-amber-100 bg-amber-50/35 hover:border-amber-300 transition-all cursor-pointer group"
                                       >
                                          <div className="flex justify-between items-start mb-2">
                                             <span className="text-xl font-black text-amber-700">{t.ticket_number}</span>
                                             <span className="text-[9px] font-black text-slate-400 uppercase">{formatTicketTime(t.served_at || t.created_at)}</span>
                                          </div>
                                          <div className="flex justify-between items-center">
                                             <span className="text-xs font-bold text-slate-600 uppercase line-clamp-1">{t.patient_name || 'Khách lẻ'}</span>
                                             <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-amber-600 uppercase bg-amber-100/50 px-2 py-0.5 rounded-full">Chờ kết luận</span>
                                                <button className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 hover:text-amber-600 transition-all">
                                                   <Play size={14} fill="currentColor" />
                                                </button>
                                             </div>
                                          </div>
                                       </div>
                                    ))
                                 )}
                              </div>
                           )}

                           {effectiveTab === 'EXAMINED' && (
                              <div className="space-y-3">
                                 {examinedList.length === 0 ? (
                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                       <AlertCircle size={32} className="text-slate-250" />
                                       <p className="text-xs text-slate-400 font-bold uppercase italic">
                                          {activeService === 'EXECUTION' ? 'Không có bệnh nhân đã khám' : 'Chưa thực hiện ca nào'}
                                       </p>
                                    </div>
                                 ) : (
                                    filteredExaminedList.map((t) => (
                                       <div 
                                          key={t.id} 
                                          onClick={() => handleCallSpecific(t.id)}
                                          className="p-4 rounded-2xl border border-slate-100 bg-white hover:border-emerald-300 transition-all cursor-pointer group flex justify-between items-center opacity-85 hover:opacity-100"
                                       >
                                          <div>
                                             <div className="font-black text-slate-800 tracking-tight">{t.ticket_number}</div>
                                             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.patient_name || 'Khách lẻ'}</div>
                                          </div>
                                          <div className="text-right flex flex-col items-end gap-1">
                                             <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">
                                                {activeService === 'EXECUTION' ? 'Đã khám' : 'Đã thực hiện'}
                                             </span>
                                             <div className="text-[9px] text-slate-400">{formatTicketTime(t.served_at || t.created_at)}</div>
                                          </div>
                                       </div>
                                    ))
                                 )}
                              </div>
                           )}

                           {effectiveTab === 'TRANSFER' && (
                              <div className="py-12 text-center text-slate-350 text-xs font-bold uppercase italic">
                                 Chức năng chuyển quầy khám bệnh
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Quick Search */}
                     <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3">
                        <Search size={18} className="text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Tìm kiếm số / bệnh nhân..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 bg-transparent text-xs font-bold focus:outline-none placeholder:text-slate-300"
                        />
                     </div>

                  </aside>
               </>
            )}
         </div>

      </main>

      {/* Custom Dialog Modal */}
      {dialogConfig.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all duration-300">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${dialogConfig.type === 'confirm' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                <AlertCircle size={18} />
              </div>
              <h5 className="text-xs font-black text-slate-800 uppercase tracking-widest">{dialogConfig.title}</h5>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 pt-4">
              <p className="text-slate-600 text-xs font-bold leading-relaxed">{dialogConfig.message}</p>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
              {dialogConfig.type === 'confirm' && (
                <button
                  onClick={dialogConfig.onCancel}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                >
                  Hủy bỏ
                </button>
              )}
              <button
                onClick={dialogConfig.onConfirm}
                className={`px-5 py-2.5 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 shadow-lg ${
                  dialogConfig.type === 'confirm' 
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OperatorConsole;
