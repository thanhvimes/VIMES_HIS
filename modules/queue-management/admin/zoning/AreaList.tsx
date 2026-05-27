
import React from 'react';
import { MapPin, Edit2, Trash2 } from 'lucide-react';
import { Area } from './types';

interface AreaListProps {
  areas: Area[];
  activeAreaId: number | null;
  onSelectArea: (id: number) => void;
  onEditArea: (area: Area) => void;
  onDeleteArea: (id: number) => void;
}

const AreaList: React.FC<AreaListProps> = ({ 
  areas, activeAreaId, onSelectArea, onEditArea, onDeleteArea 
}) => {
  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-200">
      <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
        <MapPin className="text-blue-600" /> Danh sách Khu vực
      </h3>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
        {areas.map(area => {
          const id = area.area_id || area.id;
          const name = area.area_name || area.name;
          return (
            <div 
              key={id} 
              onClick={() => onSelectArea(id)}
              className={`group flex items-center justify-between p-5 border-2 rounded-2xl transition-all cursor-pointer ${
                activeAreaId === id 
                ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-500/10' 
                : 'border-slate-50 bg-slate-50 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${activeAreaId === id ? 'bg-blue-600 animate-pulse' : 'bg-slate-300'}`}></div>
                <div>
                    <span className={`font-black uppercase tracking-tight block ${activeAreaId === id ? 'text-blue-700' : 'text-slate-700'}`}>
                        {name}
                    </span>
                    {area.dept_id && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{area.dept_id}</span>
                    )}
                </div>
              </div>
              
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); onEditArea(area); }}
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteArea(id); }}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {areas.length === 0 && (
          <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
            Chưa có dữ liệu khu vực
          </div>
        )}
      </div>
    </div>
  );
};

export default AreaList;
