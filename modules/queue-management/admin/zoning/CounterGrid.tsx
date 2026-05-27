
import React from 'react';
import { Monitor, Edit2, Trash2, Volume2, Play, CheckCircle2 } from 'lucide-react';
import { Counter } from './types';

interface CounterGridProps {
  counters: Counter[];
  activeAreaId: number | null;
  activeAreaName?: string;
  onEditCounter: (counter: Counter) => void;
  onDeleteCounter: (id: number) => void;
  onResetFilter: () => void;
  onTestCall: (id: number) => void;
  onTestComplete: (id: number) => void;
  onTestBroadcast: (counter: Counter) => void;
}

const CounterGrid: React.FC<CounterGridProps> = ({
  counters, activeAreaId, activeAreaName, 
  onEditCounter, onDeleteCounter, onResetFilter,
  onTestCall, onTestComplete, onTestBroadcast
}) => {
  return (
    <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
          <Monitor className="text-blue-600" /> Quản lý Quầy/Phòng
          {activeAreaId && (
            <span className="text-blue-600/40 text-sm font-bold">
              / {activeAreaName}
            </span>
          )}
        </h3>
        <div className="flex gap-3">
          <button 
            onClick={onResetFilter}
            className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!activeAreaId ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
          >
            Tất cả
          </button>
          <div className="px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
            {counters.length} Thiết bị
          </div>
        </div>
      </div>

      <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {counters.map(counter => (
            <div key={counter.counter_id} className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all group relative">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                    {counter.area_name || 'Khu vực'}
                  </span>
                  <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                    {counter.counter_name}
                  </h4>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEditCounter(counter)}
                    className="p-3 bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600 rounded-xl transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => onDeleteCounter(counter.counter_id)}
                    className="p-3 bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-4 mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  {counter.is_priority ? (
                    <span className="px-3 py-1 bg-red-100 text-red-600 text-[10px] font-black uppercase rounded-full">Ưu tiên</span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-full">Thường</span>
                  )}
                  <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Hoạt động</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => onTestBroadcast(counter)}
                    className="py-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl transition-all flex flex-col items-center justify-center gap-1 text-[9px] font-black uppercase group/btn"
                    title="Thử phát loa gọi số"
                  >
                    <Volume2 size={16} className="group-hover/btn:scale-110 transition-transform" /> 
                    <span>Thử loa</span>
                  </button>
                  <button 
                    onClick={() => onTestCall(counter.counter_id)}
                    className="py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xl transition-all flex flex-col items-center justify-center gap-1 text-[9px] font-black uppercase group/btn"
                    title="Gọi bệnh nhân tiếp theo trong hàng chờ"
                  >
                    <Play size={16} className="group-hover/btn:scale-110 transition-transform" />
                    <span>Gọi vé</span>
                  </button>
                  <button 
                    onClick={() => onTestComplete(counter.counter_id)}
                    className="py-2 bg-slate-50 hover:bg-slate-800 text-slate-500 hover:text-white rounded-xl transition-all flex flex-col items-center justify-center gap-1 text-[9px] font-black uppercase group/btn"
                    title="Hoàn tất vé đang gọi"
                  >
                    <CheckCircle2 size={16} className="group-hover/btn:scale-110 transition-transform" />
                    <span>Xong</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {counters.length === 0 && (
            <div className="col-span-2 py-20 flex flex-col items-center justify-center text-slate-300 gap-4">
              <Monitor size={64} className="opacity-20" />
              <p className="font-bold text-lg">Chưa có quầy nào được thiết lập</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CounterGrid;
