
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Megaphone, Users, UserPlus, SkipForward, RotateCcw, 
  Settings, Loader2, Play, History, Search, CheckCircle,
  Clock, Filter, ArrowRight, UserCheck
} from 'lucide-react';
import { AppSettings, Area, Room } from '../../types';
import { apiGetAreas, apiGetRooms, apiFetch, getBaseUrl } from '../../services/apiService';

interface TestCallingTabProps {
  settings: AppSettings;
}

const TestCallingTab: React.FC<TestCallingTabProps> = ({ settings }) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>(() => localStorage.getItem('vimes_mgr_area') || '');
  const [selectedRoom, setSelectedRoom] = useState<string>(() => localStorage.getItem('vimes_mgr_room') || '');
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'waiting' | 'history'>('waiting');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ waiting: 0, served: 0, priority: 0 });

  useEffect(() => {
    apiGetAreas().then(setAreas);
  }, []);

  useEffect(() => {
    if (selectedArea) {
      localStorage.setItem('vimes_mgr_area', selectedArea);
      apiGetRooms(selectedArea).then(data => {
        const normalized = data.map((r: any) => ({
            ...r,
            id: r.counter_id || r.id,
            name: r.counter_name || r.name
        }));
        setRooms(normalized);
      });
    }
  }, [selectedArea]);

  const fetchCurrentStatus = useCallback(async () => {
    if (!selectedRoom) return;
    try {
      const data = await apiFetch(`/api/queue/counter/${selectedRoom}`);
      if (data) {
        if (data.currentTicket) {
           setCurrentTicket({ id: data.currentTicketId, ticket_number: data.currentTicket, patient_name: data.currentName });
        }
        setWaitingList(data.waitingList || []);
        
        const statsRes = await apiFetch(`/api/queue/stats/${selectedRoom}`);
        if (statsRes.success) {
           setStats({
              waiting: statsRes.data.normal_waiting + statsRes.data.priority_waiting,
              served: statsRes.data.total_served_today,
              priority: statsRes.data.priority_waiting
           });
        }
      }
    } catch (e) { console.error(e); }
  }, [selectedRoom]);

  useEffect(() => {
    if (selectedRoom) {
      localStorage.setItem('vimes_mgr_room', selectedRoom);
      fetchCurrentStatus();

      const baseUrl = getBaseUrl();
      const eventSource = new EventSource(`${baseUrl}/api/queue/events`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'QUEUE_UPDATED' || data.type === 'NEW_CALL') {
             fetchCurrentStatus();
          }
        } catch (e) { console.error('[SSE] Error:', e); }
      };

      const interval = setInterval(fetchCurrentStatus, 30000);

      return () => {
        eventSource.close();
        clearInterval(interval);
      };
    }
  }, [selectedRoom, fetchCurrentStatus]);

  const handleCallNext = async (isPriority: boolean) => {
    if (!selectedRoom) return;
    setProcessing(isPriority ? 'call-priority' : 'call-next');
    try {
      const result = await apiFetch('/api/queue/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterId: selectedRoom, isPriority })
      });
      if (result.success && result.data) {
        setCurrentTicket(result.data);
        fetchCurrentStatus();
      } else {
        alert(result.message || "Không có bệnh nhân chờ");
      }
    } catch (e: any) {
      alert("Lỗi kết nối Server: " + e.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleRecall = async () => {
    if (!currentTicket || !selectedRoom) return;
    setProcessing('recall');
    const room = rooms.find(r => String(r.id) === selectedRoom);
    try {
      await apiFetch('/api/queue/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'CALL_AGAIN',
          areaId: selectedArea,
          counterId: selectedRoom,
          counterName: room?.name || 'Quầy phục vụ',
          ticket: currentTicket
        })
      });
    } catch (e: any) {
      console.error(e);
    } finally {
      setTimeout(() => setProcessing(null), 1000);
    }
  };

  const handleSkip = async () => {
    if (!currentTicket) return;
    if (!confirm('Bạn có chắc chắn muốn bỏ qua bệnh nhân này?')) return;
    setProcessing('skip');
    try {
      await apiFetch('/api/queue/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: currentTicket.id })
      });
      setCurrentTicket(null);
      fetchCurrentStatus();
    } catch (e: any) {
      alert("Lỗi: " + e.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleComplete = async () => {
     if (!currentTicket) return;
     setProcessing('complete');
     try {
        await apiFetch('/api/queue/complete', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ ticketId: currentTicket.id || currentTicket.ticket_number })
        });
        setCurrentTicket(null);
        fetchCurrentStatus();
     } catch (e) { console.error(e); }
     finally { setProcessing(null); }
  }

  const filteredList = (activeTab === 'waiting' ? waitingList : historyList).filter(item => 
    item.ticket_number.toString().includes(searchQuery) || 
    (item.patient_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] -m-6 p-6 overflow-hidden">
      
      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
         <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
               <Users size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đang đợi</p>
               <p className="text-2xl font-black text-slate-800">{stats.waiting}</p>
            </div>
         </div>
         <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
               <Megaphone size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ưu tiên</p>
               <p className="text-2xl font-black text-slate-800">{stats.priority}</p>
            </div>
         </div>
         <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
               <CheckCircle size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đã phục vụ</p>
               <p className="text-2xl font-black text-slate-800">{stats.served}</p>
            </div>
         </div>
         <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
               <Clock size={24} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khu vực</p>
               <p className="text-sm font-bold text-slate-800 truncate">{selectedArea ? areas.find(a => String(a.area_id || a.id) === selectedArea)?.area_name : 'Chưa chọn'}</p>
            </div>
         </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
         {/* Left Side: Controls & Counter Info */}
         <div className="w-1/3 flex flex-col gap-6">
            {/* Counter Selection */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
               <div className="flex items-center gap-2 mb-4">
                  <Settings size={18} className="text-slate-400" />
                  <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Cấu hình quầy trực</span>
               </div>
               <div className="space-y-3">
                  <select 
                    value={selectedArea} 
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">-- Chọn Khu vực --</option>
                    {areas.map(a => <option key={String(a.area_id || a.id)} value={String(a.area_id || a.id)}>{a.area_name || a.name}</option>)}
                  </select>
                  <select 
                    value={selectedRoom} 
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    disabled={!selectedArea}
                  >
                    <option value="">-- Chọn Quầy/Phòng --</option>
                    {rooms.map(r => <option key={String(r.id)} value={String(r.id)}>{r.name}</option>)}
                  </select>
               </div>
            </div>

            {/* Current Ticket - The "Big" Card */}
            <div className="flex-1 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col items-center justify-center text-center">
               <div className="absolute top-0 right-0 p-8 opacity-5">
                  <Megaphone size={160} />
               </div>
               
               <div className="relative z-10 w-full">
                  <p className="text-blue-400 font-black uppercase tracking-[0.3em] text-xs mb-4">Bệnh nhân hiện tại</p>
                  <div className="text-8xl font-black mb-4 font-mono tracking-tighter drop-shadow-2xl">
                     {currentTicket ? currentTicket.ticket_number : '---'}
                  </div>
                  <div className="text-2xl font-bold text-white mb-8 px-4 h-16 flex items-center justify-center line-clamp-2 uppercase">
                     {currentTicket ? currentTicket.patient_name : 'Đang đợi nhân viên gọi...'}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                     <button 
                        onClick={() => handleCallNext(false)}
                        disabled={!selectedRoom || !!processing}
                        className="py-4 bg-blue-600 hover:bg-blue-700 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-900/20"
                     >
                        {processing === 'call-next' ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                        TIẾP THEO
                     </button>
                     <button 
                        onClick={() => handleCallNext(true)}
                        disabled={!selectedRoom || !!processing}
                        className="py-4 bg-rose-600 hover:bg-rose-700 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-rose-900/20"
                     >
                        {processing === 'call-priority' ? <Loader2 className="animate-spin" size={18} /> : <Megaphone size={18} />}
                        ƯU TIÊN
                     </button>
                     <button 
                        onClick={handleRecall}
                        disabled={!currentTicket || !!processing}
                        className="py-4 bg-amber-500 hover:bg-amber-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                     >
                        {processing === 'recall' ? <Loader2 className="animate-spin" size={18} /> : <RotateCcw size={18} />}
                        GỌI LẠI
                     </button>
                     <button 
                        onClick={handleSkip}
                        disabled={!currentTicket || !!processing}
                        className="py-4 bg-slate-700 hover:bg-slate-600 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-30"
                     >
                        {processing === 'skip' ? <Loader2 className="animate-spin" size={18} /> : <SkipForward size={18} />}
                        BỎ QUA
                     </button>
                  </div>

                  {currentTicket && (
                     <button 
                        onClick={handleComplete}
                        disabled={!!processing}
                        className="w-full mt-3 py-5 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-900/20 border-b-4 border-emerald-800"
                     >
                        {processing === 'complete' ? <Loader2 className="animate-spin" /> : <UserCheck size={24} />}
                        HOÀN TẤT PHỤC VỤ
                     </button>
                  )}
               </div>
            </div>
         </div>

         {/* Right Side: List Management */}
         <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            {/* List Header */}
            <div className="p-6 border-b border-slate-50 flex items-center justify-between shrink-0">
               <div className="flex bg-slate-100 p-1 rounded-2xl">
                  <button 
                     onClick={() => setActiveTab('waiting')}
                     className={`px-6 py-2 rounded-xl font-black text-xs uppercase transition-all ${activeTab === 'waiting' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                     Đang chờ ({waitingList.length})
                  </button>
                  <button 
                     onClick={() => {
                        setActiveTab('history');
                        // Fetch history if needed
                        apiFetch(`/api/queue/history/${selectedRoom}`).then(data => setHistoryList(data || []));
                     }}
                     className={`px-6 py-2 rounded-xl font-black text-xs uppercase transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                     Lịch sử ({historyList.length})
                  </button>
               </div>

               <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                     type="text" 
                     placeholder="Tìm số, tên bệnh nhân..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-10 pr-6 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 w-64 outline-none"
                  />
               </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
               {loading ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300">
                     <Loader2 className="animate-spin mb-4" size={40} />
                     <p className="font-bold uppercase tracking-widest text-xs">Đang tải dữ liệu...</p>
                  </div>
               ) : filteredList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                     <Users size={64} className="mb-4 opacity-10" />
                     <p className="font-bold uppercase tracking-widest text-xs">Danh sách trống</p>
                  </div>
               ) : (
                  filteredList.map((item, idx) => (
                     <div 
                        key={item.id || idx} 
                        className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all ${
                           item.is_priority 
                           ? 'bg-rose-50 border-rose-100 hover:border-rose-200' 
                           : 'bg-white border-slate-100 hover:border-slate-200'
                        }`}
                     >
                        <div className="flex items-center gap-5">
                           <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${
                              item.is_priority ? 'bg-white text-rose-600' : 'bg-slate-50 text-slate-700'
                           }`}>
                              {item.ticket_number}
                           </div>
                           <div>
                              <div className="text-lg font-black text-slate-800 uppercase leading-none mb-1">{item.patient_name || 'Khách vãng lai'}</div>
                              <div className="flex items-center gap-3">
                                 <span className={`text-[10px] font-black uppercase tracking-widest ${item.is_priority ? 'text-rose-500' : 'text-slate-400'}`}>
                                    {item.is_priority ? 'Bệnh nhân ưu tiên' : 'Bệnh nhân thường'}
                                 </span>
                                 <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                 <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                    <Clock size={10} /> {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                 </span>
                                 {activeTab === 'history' && (
                                    <>
                                       <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${
                                          item.status === 'SERVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                       }`}>
                                          {item.status === 'SERVED' ? 'Đã xong' : 'Bỏ qua'}
                                       </span>
                                    </>
                                 )}
                              </div>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                           <button 
                              onClick={() => {
                                 // Call specific ticket
                                 apiFetch('/api/queue/call-specific', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ ticketId: item.id, counterId: selectedRoom })
                                 }).then(res => {
                                    if(res.success) {
                                       setCurrentTicket(res.data);
                                       fetchCurrentStatus();
                                    }
                                 });
                              }}
                              className="p-3 bg-white border border-slate-100 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                              title="Gọi số này ngay"
                           >
                              <Play size={18} fill="currentColor" />
                           </button>
                        </div>
                     </div>
                  ))
               )}
            </div>

            {/* Footer / Quick Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Tự động cập nhật mỗi 10 giây
               </p>
               <button 
                  onClick={async () => {
                     if (!selectedArea) return alert('Vui lòng chọn khu vực');
                     setProcessing('mock');
                     try {
                        await apiFetch('/api/queue/quick-number', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ 
                              isPriority: Math.random() > 0.8, 
                              kioskId: 'MOCK',
                              areaId: selectedArea,
                              patientName: 'BỆNH NHÂN GIẢ LẬP ' + Math.floor(Math.random()*99)
                           })
                        });
                        fetchCurrentStatus();
                     } catch (e) { console.error(e); }
                     finally { setProcessing(null); }
                  }}
                  className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase hover:bg-blue-50 px-4 py-2 rounded-lg transition-all"
               >
                  <ArrowRight size={14} /> Thêm bệnh nhân giả lập
               </button>
            </div>
         </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}} />
    </div>
  );
};

export default TestCallingTab;
