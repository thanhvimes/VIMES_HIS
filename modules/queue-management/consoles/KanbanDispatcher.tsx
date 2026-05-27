import React, { useState, useEffect } from 'react';
import { 
  Users, Activity, Monitor, LogOut, ArrowRight, Clock, AlertTriangle 
} from 'lucide-react';
import { apiFetch } from '../services/apiService';
import { AppSettings } from '../types';

interface KanbanDispatcherProps {
  settings: AppSettings;
  areaId: number;
  areaName: string;
  onLogout: () => void;
}

const KanbanDispatcher: React.FC<KanbanDispatcherProps> = ({ settings, areaId, areaName, onLogout }) => {
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomActiveTickets, setRoomActiveTickets] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      // 1. Lấy danh sách quầy/phòng và trạng thái hiện tại (Real-time từ API Display)
      const res = await apiFetch(`/api/queue/display/${areaId}`);
      if (res && res.data) {
        setRooms(res.data.counters);
        
        // Cập nhật mapping ticket đang khám ở mỗi phòng
        const activeMapping: Record<number, any> = {};
        res.data.counters.forEach((room: any) => {
          if (room.current_ticket) {
            activeMapping[room.counter_id] = {
              id: room.current_ticket.id,
              ticket_number: room.current_ticket.ticketNumber,
              patient_name: room.current_ticket.patientName,
              is_priority: room.current_ticket.isPriority
            };
          }
        });
        setRoomActiveTickets(activeMapping);
      }

      // 2. Lấy danh sách chờ chung của cả khu vực
      const waitingRes = await apiFetch(`/api/queue/waiting-list/area/${areaId}`);
      if (waitingRes) setWaitingList(waitingRes);

    } catch (e) {
      console.error('Kanban load error:', e);
    }
  };

  useEffect(() => {
    loadData();
    // Vẫn giữ polling dự phòng, nhưng lát nữa ta sẽ thêm SSE để cập nhật tức thì
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [areaId]);

  const assignToRoom = async (ticket: any, roomId: number) => {
    setLoading(true);
    try {
      // Gọi API gọi số đích danh (Call Specific)
      await apiFetch('/api/queue/call-specific', {
        method: 'POST',
        body: JSON.stringify({ ticketId: ticket.id, counterId: roomId })
      });
      
      // Update Local State for fast UI
      setRoomActiveTickets(prev => ({ ...prev, [roomId]: ticket }));
      setWaitingList(prev => prev.filter(t => t.id !== ticket.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const completeRoom = async (roomId: number) => {
    const ticket = roomActiveTickets[roomId];
    if (!ticket) return;
    setLoading(true);
    try {
      await apiFetch('/api/queue/complete', {
        method: 'POST',
        body: JSON.stringify({ counterId: roomId, ticketId: ticket.id })
      });
      setRoomActiveTickets(prev => {
        const next = { ...prev };
        delete next[roomId];
        return next;
      });
    } catch (e) {} finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-md h-16 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-emerald-400" />
          <h1 className="text-xl font-bold">
            Điều Phối Cận Lâm Sàng - {areaName}
          </h1>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded bg-slate-800 hover:bg-rose-600 transition-colors">
          <LogOut className="w-4 h-4" /> Thoát
        </button>
      </header>

      {/* Main Kanban Board */}
      <main className="flex-1 flex p-6 gap-6 overflow-hidden">
        
        {/* Column 1: WAITING LIST */}
        <div className="w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" /> Hàng Chờ Chung
            </h2>
            <span className="bg-slate-800 text-white text-xs px-2 py-1 rounded-full font-bold">{waitingList.length}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50">
            {waitingList.map((ticket) => (
              <div key={ticket.id} className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-grab">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl font-black text-slate-800">{ticket.ticket_number}</span>
                  {ticket.is_priority && (
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Ưu tiên
                    </span>
                  )}
                </div>
                <div className="font-semibold text-slate-700">{ticket.patient_name || 'Khách lẻ'}</div>
                <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Chờ từ {new Date(ticket.created_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                </div>
                
                {/* Fast Action Buttons (Instead of full drag drop for simplicity in this version) */}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {rooms.slice(0, 4).map(room => (
                    <button 
                      key={room.counter_id}
                      onClick={() => assignToRoom(ticket, room.counter_id)}
                      disabled={loading || roomActiveTickets[room.counter_id]}
                      className={`text-xs py-1.5 rounded font-medium border transition-colors ${
                        roomActiveTickets[room.counter_id] 
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      Gọi {room.counter_name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            {waitingList.length === 0 && (
              <div className="text-center p-8 text-slate-400 text-sm">Trống hàng chờ</div>
            )}
          </div>
        </div>

        {/* Column 2: ROOMS (Máy chụp) */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full">
            {rooms.map(room => {
              const activeTicket = roomActiveTickets[room.counter_id];
              return (
                <div key={room.counter_id} className="min-w-[300px] w-1/3 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
                  <div className={`p-4 border-b ${activeTicket ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'} rounded-t-xl transition-colors`}>
                    <h2 className="font-bold text-lg">{room.counter_name}</h2>
                    <div className="text-xs opacity-80">{activeTicket ? 'Đang thực hiện' : 'Sẵn sàng'}</div>
                  </div>
                  
                  <div className="flex-1 p-6 flex flex-col items-center justify-center">
                    {activeTicket ? (
                      <div className="w-full animate-in zoom-in-95 duration-300">
                        <div className="text-6xl font-black text-center text-emerald-600 mb-4">{activeTicket.ticket_number}</div>
                        <div className="text-xl font-bold text-center text-slate-700">{activeTicket.patient_name || 'Khách lẻ'}</div>
                        
                        <button 
                          onClick={() => completeRoom(room.counter_id)}
                          className="mt-8 w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-lg font-bold shadow-lg"
                        >
                          HOÀN TẤT
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Monitor className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-slate-400 font-medium">Phòng đang trống</p>
                        <p className="text-sm text-slate-400 mt-2">Bấm "Gọi" từ hàng chờ để chỉ định bệnh nhân vào đây.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default KanbanDispatcher;

