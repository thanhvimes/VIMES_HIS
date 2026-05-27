
import React from 'react';
import { Check } from 'lucide-react';
import { Area } from './types';

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingArea: Area | null;
  areaName: string;
  setAreaName: (name: string) => void;
  deptId: string;
  setDeptId: (code: string) => void;
  departments: any[];
}

const AreaModal: React.FC<AreaModalProps> = ({
  isOpen, onClose, onSave, editingArea, areaName, setAreaName, deptId, setDeptId, departments
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl border border-white/20">
        <h3 className="text-2xl font-black uppercase tracking-tight mb-8">
          {editingArea ? 'Cập nhật Khu vực' : 'Thêm Khu vực mới'}
        </h3>
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Thuộc Khoa (Danh mục hệ thống)</label>
            <select 
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold mb-4 appearance-none"
            >
                <option value="">--- Chọn khoa làm việc ---</option>
                {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
            </select>

            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Tên khu vực</label>
            <input 
              type="text" 
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
              placeholder="VD: Khu vực A, Tầng 1..."
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 font-bold"
            />
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
            <Check size={18} className="inline mr-2" /> Lưu lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default AreaModal;
