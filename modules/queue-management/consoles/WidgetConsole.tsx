import React, { useState, useEffect } from 'react';
import { 
  Play, CheckCircle2, SkipForward, RefreshCcw, 
  ChevronRight, ChevronLeft, Activity, ArrowRightLeft 
} from 'lucide-react';
import { apiFetch } from '../services/apiService';
import { AppSettings } from '../types';

interface WidgetConsoleProps {
  settings: AppSettings;
  counterId: number;
  counterName: string;
}

const WidgetConsole: React.FC<WidgetConsoleProps> = ({ settings, counterId, counterName }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadState = async () => {
    try {
      const statsReq = await apiFetch(`/api/queue/stats/${counterId}`);
      if (statsReq && statsReq.data) {
        setWaitingCount(parseInt(statsReq.data.normal_waiting) + parseInt(statsReq.data.priority_waiting));
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadState();
    const interval = setInterval(loadState, 20000);
    return () => clearInterval(interval);
  }, [counterId]);

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
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <div 
        onClick={() => setIsExpanded(true)}
        className="fixed right-0 top-1/3 bg-emerald-600 text-white p-3 rounded-l-xl shadow-2xl cursor-pointer hover:bg-emerald-700 transition-colors flex flex-col items-center gap-2 z-50"
      >
        <ChevronLeft className="w-5 h-5" />
        <div className="vertical-text font-bold tracking-widest" style={{ writingMode: 'vertical-rl' }}>QMS VIMES</div>
        <div className="bg-white text-emerald-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs mt-2">
          {waitingCount}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed right-4 top-24 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in slide-in-from-right-10">
      {/* Header */}
      <div className="bg-slate-800 text-white p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-sm">{counterName}</span>
        </div>
        <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bệnh nhân đang khám</span>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold">Chờ: {waitingCount}</span>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center shadow-sm mb-4">
          {currentTicket ? (
            <>
              <div className="text-4xl font-black text-emerald-600 mb-1">{currentTicket.ticket_number}</div>
              <div className="text-sm font-bold text-slate-700">{currentTicket.patient_name || 'Khách lẻ'}</div>
            </>
          ) : (
            <div className="py-4 text-gray-400 text-sm font-medium">Chưa gọi bệnh nhân</div>
          )}
        </div>

        {/* Actions */}
        {!currentTicket ? (
          <button 
            onClick={callNext}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Play className="w-5 h-5 fill-current" />
            GỌI SỐ TIẾP THEO
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={completeTicket}
              className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              HOÀN TẤT KHÁM
            </button>
            <button className="bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl font-semibold text-sm flex justify-center items-center gap-1 transition-all shadow-sm">
              <RefreshCcw className="w-4 h-4" /> Gọi lại
            </button>
            <button className="bg-slate-700 hover:bg-slate-800 text-white py-2 rounded-xl font-semibold text-sm flex justify-center items-center gap-1 transition-all shadow-sm">
              <ArrowRightLeft className="w-4 h-4" /> Chuyển
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WidgetConsole;

