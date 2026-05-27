
import React from 'react';
import { Check } from 'lucide-react';
import { Area, Counter } from './types';

interface CounterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingCounter: Counter | null;
  counterName: string;
  setCounterName: (name: string) => void;
  isPriority: boolean;
  setIsPriority: (p: boolean) => void;
  selectedAreaId: number;
  setSelectedAreaId: (id: number) => void;
  areas: Area[];
}

const CounterModal: React.FC<CounterModalProps> = ({
  isOpen, onClose, onSave, editingCounter, 
  counterName, setCounterName,
  isPriority, setIsPriority,
  selectedAreaId, setSelectedAreaId,
  areas
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl border border-white/20">
        <h3 className="text-2xl font-black uppercase tracking-tight mb-8">
          {editingCounter ? 'Cập nhật Quầy/Phòng' : 'Thêm Quầy mới'}
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Tên quầy/phòng</label>
            <input 
              type="text" 
              value={counterName}
              onChange={(e) => setCounterName(e.target.value)}
              placeholder="VD: Quầy tiếp đón 01, Phòng khám 102..."
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Thuộc khu vực</label>
            <select 
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(Number(e.target.value))}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold appearance-none"
            >
              <option value="0">-- Chọn khu vực --</option>
              {areas.map(area => (
                <option key={String(area.area_id || area.id)} value={Number(area.area_id || area.id)}>
                    {area.area_name || area.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div>
              <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Ưu tiên phục vụ</h4>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Quầy này sẽ ưu tiên các phiếu có đánh dấu Ưu tiên</p>
            </div>
            <button 
              onClick={() => setIsPriority(!isPriority)}
              className={`w-14 h-8 rounded-full transition-all relative ${isPriority ? 'bg-blue-600' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${isPriority ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={onSave}
            className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <Check size={18} className="inline mr-2" /> Lưu quầy
          </button>
        </div>
      </div>
    </div>
  );
};

export default CounterModal;
