import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, CheckCircle2, SkipForward, RefreshCcw, 
  Users, Activity, Monitor, LogOut 
} from 'lucide-react';
import { apiFetch } from '../services/apiService';
import { AppSettings } from '../types';

interface CounterConsoleProps {
  settings: AppSettings;
  counterId: number;
  counterName: string;
  onLogout: () => void;
}

const CounterConsole: React.FC<CounterConsoleProps> = ({ settings, counterId, counterName, onLogout }) => {
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [missedTickets, setMissedTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch initial state
  const loadState = useCallback(async () => {
    try {
      const statsReq = await apiFetch(`/api/queue/stats/${counterId}`);
      if (statsReq && statsReq.data) {
        setWaitingCount(parseInt(statsReq.data.normal_waiting) + parseInt(statsReq.data.priority_waiting));
      }
      
      const waitingReq = await apiFetch(`/api/queue/waiting-list/${counterId}`);
      if (waitingReq && Array.isArray(waitingReq)) {
          // This API usually returns only WAITING. We might need a separate API for missed/skipped if needed.
          // For now, we rely on SSE or just basic counts.
          setWaitingCount(waitingReq.length);
      }
    } catch (e) {
      console.error("Lỗi tải dữ liệu quầy:", e);
    }
  }, [counterId]);

  useEffect(() => {
    loadState();
    const interval = setInterval(loadState, 15000);
    return () => clearInterval(interval);
  }, [loadState]);

  // Actions
  const callNext = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/queue/call-next', {
        method: 'POST',
        body: JSON.stringify({ counterId, isPriority: false })
      });
      if (res && res.data) {
        setCurrentTicket(res.data);
      } else {
        alert(res?.message || 'Hết bệnh nhân chờ');
      }
      loadState();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const completeTicket = async () => {
    if (!currentTicket) return;
    setLoading(true);
    try {
      await apiFetch('/api/queue/complete', {
        method: 'POST',
        body: JSON.stringify({ counterId, ticketId: currentTicket.id })
      });
      setCurrentTicket(null);
      loadState();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const skipTicket = async () => {
    if (!currentTicket) return;
    setLoading(true);
    try {
      await apiFetch('/api/queue/skip', {
        method: 'POST',
        body: JSON.stringify({ ticketId: currentTicket.id })
      });
      setMissedTickets(prev => [...prev, currentTicket]);
      setCurrentTicket(null);
      loadState();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const callAgain = async () => {
    if (!currentTicket) return;
    setLoading(true);
    try {
      await apiFetch('/api/queue/call-again', {
        method: 'POST',
        body: JSON.stringify({ ticketId: currentTicket.id })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        callNext();
      } else if (e.code === 'Enter') {
        e.preventDefault();
        completeTicket();
      } else if (e.key === 'F3') {
        e.preventDefault();
        skipTicket();
      } else if (e.key === 'F2') {
        e.preventDefault();
        callAgain();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTicket, loading]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Left Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Monitor className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-bold text-slate-800">
              VIMES QMS - {counterName}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Đang hoạt động
            </div>
            <button onClick={onLogout} className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-red-50">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 flex flex-col items-center justify-center relative">
          
          {/* Current Ticket Display */}
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden mb-12 border border-emerald-100">
            <div className="bg-slate-800 text-white text-center py-4 font-semibold text-xl tracking-wide uppercase">
              Bệnh nhân đang phục vụ
            </div>
            <div className="p-12 text-center">
              {currentTicket ? (
                <>
                  <div className="text-8xl font-black text-emerald-600 mb-6 font-mono tracking-tighter">
                    {currentTicket.ticket_number}
                  </div>
                  <div className="text-3xl font-bold text-slate-700 uppercase">
                    {currentTicket.patient_name || 'KHÁCH LẺ'}
                  </div>
                </>
              ) : (
                <div className="text-3xl text-slate-400 font-medium py-12">
                  Chưa có bệnh nhân nào tại quầy
                </div>
              )}
            </div>
          </div>

          {/* Huge Call Next Button */}
          <button
            onClick={callNext}
            disabled={loading || !!currentTicket}
            className={`w-full max-w-3xl h-32 rounded-2xl flex items-center justify-center gap-4 text-4xl font-bold shadow-lg transition-all duration-200 ${
              loading || currentTicket
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-95'
            }`}
          >
            <Play className="w-12 h-12 fill-current" />
            GỌI SỐ TIẾP THEO <span className="text-emerald-100 text-2xl font-normal ml-4">(Phím Space)</span>
          </button>

          {/* Action Row */}
          {currentTicket && (
            <div className="flex gap-6 mt-8 w-full max-w-3xl">
              <button onClick={completeTicket} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-3 shadow-md transition-transform active:scale-95">
                <CheckCircle2 className="w-7 h-7" />
                HOÀN TẤT <span className="opacity-70 text-base font-normal ml-2">(Enter)</span>
              </button>
              <button onClick={callAgain} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-3 shadow-md transition-transform active:scale-95">
                <RefreshCcw className="w-7 h-7" />
                GỌI LẠI <span className="opacity-70 text-base font-normal ml-2">(F2)</span>
              </button>
              <button onClick={skipTicket} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-5 rounded-xl font-bold text-xl flex items-center justify-center gap-3 shadow-md transition-transform active:scale-95">
                <SkipForward className="w-7 h-7" />
                BỎ QUA <span className="opacity-70 text-base font-normal ml-2">(F3)</span>
              </button>
            </div>
          )}

        </main>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col shadow-[-10px_0_15px_-5px_rgba(0,0,0,0.05)] z-10">
        <div className="p-6 border-b border-gray-100 bg-emerald-50/50">
          <div className="flex items-center gap-3 text-emerald-800 mb-2">
            <Users className="w-6 h-6" />
            <h2 className="text-lg font-bold">Hàng chờ hiện tại</h2>
          </div>
          <div className="text-5xl font-black text-emerald-600">{waitingCount}</div>
          <div className="text-sm text-emerald-600/70 mt-1 font-medium">Bệnh nhân đang đợi</div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="font-semibold text-slate-700 mb-4 px-2">Lịch sử gọi nhỡ</h3>
          {missedTickets.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm italic">
              Không có bệnh nhân bị nhỡ
            </div>
          ) : (
            <div className="space-y-3">
              {missedTickets.map((t, idx) => (
                <div key={idx} className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex justify-between items-center group hover:border-rose-300 transition-colors">
                  <div>
                    <div className="font-bold text-rose-700 text-lg">{t.ticket_number}</div>
                    <div className="text-sm text-rose-600/80 line-clamp-1">{t.patient_name || 'Khách lẻ'}</div>
                  </div>
                  <button className="p-2 bg-white rounded-lg shadow-sm text-rose-500 hover:bg-rose-500 hover:text-white transition-colors" title="Gọi lại">
                    <RefreshCcw className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CounterConsole;

