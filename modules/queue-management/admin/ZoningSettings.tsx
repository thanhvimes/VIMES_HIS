
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Settings2, 
  Monitor,
  Activity,
  Info
} from 'lucide-react';
import { apiFetch } from '../services/apiService';
import { Area, Counter } from './zoning/types';
import AreaList from './zoning/AreaList';
import CounterGrid from './zoning/CounterGrid';
import AreaModal from './zoning/AreaModal';
import CounterModal from './zoning/CounterModal';

interface ZoningSettingsProps {
  settings: any;
}

const ZoningSettings: React.FC<ZoningSettingsProps> = ({ settings }) => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeAreaId, setActiveAreaId] = useState<number | null>(null);
  
  // Modals state
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [editingCounter, setEditingCounter] = useState<Counter | null>(null);
  
  // Form state
  const [areaName, setAreaName] = useState('');
  const [deptId, setDeptId] = useState('');
  const [counterName, setCounterName] = useState('');
  const [isPriority, setIsPriority] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [areasData, countersData, deptsData] = await Promise.all([
        apiFetch('/api/zoning/areas'),
        apiFetch('/api/public/counters'),
        apiFetch('/api/departments')
      ]);
      setAreas(areasData);
      setCounters(countersData);
      setDepartments(deptsData);
      
      if (areasData.length > 0 && activeAreaId === null) {
        setActiveAreaId(areasData[0].area_id || areasData[0].id);
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAreaModal = (area?: Area) => {
    if (area) {
      setEditingArea(area);
      setAreaName(area.area_name || area.name || '');
      setDeptId(area.dept_id || '');
    } else {
      setEditingArea(null);
      setAreaName('');
      setDeptId('');
    }
    setShowAreaModal(true);
  };

  const handleSaveArea = async () => {
    if (!areaName.trim()) return;
    try {
      const method = editingArea ? 'PUT' : 'POST';
      const endpoint = '/api/zoning/areas';
      await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            id: editingArea?.area_id || editingArea?.id, 
            name: areaName,
            deptId: deptId
        })
      });
      setShowAreaModal(false);
      fetchData();
    } catch (e) {
      alert('Lỗi lưu khu vực');
    }
  };

  const handleDeleteArea = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa khu vực này? Tất cả các quầy thuộc khu vực này cũng sẽ bị ảnh hưởng.')) return;
    try {
      await apiFetch(`/api/zoning/areas/${id}`, { method: 'DELETE' });
      if (activeAreaId === id) setActiveAreaId(null);
      fetchData();
    } catch (e) {
      alert('Lỗi xóa khu vực');
    }
  };

  const handleOpenCounterModal = (counter?: Counter) => {
    if (counter) {
      setEditingCounter(counter);
      setCounterName(counter.counter_name);
      setIsPriority(counter.is_priority);
      setSelectedAreaId(counter.area_id);
    } else {
      setEditingCounter(null);
      setCounterName('');
      setIsPriority(false);
      setSelectedAreaId(activeAreaId || areas[0]?.area_id || areas[0]?.id || 0);
    }
    setShowCounterModal(true);
  };

  const handleSaveCounter = async () => {
    if (!counterName.trim() || !selectedAreaId) return;
    try {
      const method = editingCounter ? 'PUT' : 'POST';
      const endpoint = '/api/zoning/counters';
      await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCounter?.counter_id,
          name: counterName,
          areaId: selectedAreaId,
          isPriority
        })
      });
      setShowCounterModal(false);
      fetchData();
    } catch (e) {
      alert('Lỗi lưu quầy');
    }
  };

  const handleDeleteCounter = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa quầy này?')) return;
    try {
      await apiFetch(`/api/zoning/counters/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (e) {
      alert('Lỗi xóa quầy');
    }
  };

  const handleTestCallNext = async (counterId: number) => {
    try {
      const res = await apiFetch('/api/queue/call-next', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterId, isPriority: false })
      });
      if (res.success) {
        if (res.data) {
           alert(`Thành công: Đã gọi vé ${res.data.ticket_number}`);
        } else {
           alert(`Thông báo: ${res.message || 'Không có vé chờ'}`);
        }
      }
    } catch(e: any) { alert(`Lỗi gọi vé: ${e.message}`); }
  };

  const handleTestComplete = async (counterId: number) => {
    try {
      await apiFetch('/api/queue/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ counterId })
      });
      alert('Đã hoàn tất vé tại quầy này!');
    } catch(e: any) { alert(`Lỗi hoàn tất: ${e.message}`); }
  };

  const handleTestBroadcast = async (counter: Counter) => {
    try {
      await apiFetch('/api/queue/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NEW_CALL',
          ticket: { ticket_number: '999', patient_name: 'Người Dùng Test' },
          counterId: counter.counter_id,
          counterName: counter.counter_name,
          areaId: counter.area_id
        })
      });
    } catch(e: any) { alert(`Lỗi phát loa: ${e.message}`); }
  };

  const filteredCounters = activeAreaId 
    ? counters.filter(c => c.area_id === activeAreaId)
    : counters;

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-700">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Phân vùng & Thiết lập Quầy</h2>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
             <Settings2 size={16} className="text-blue-500" /> Cấu trúc sơ đồ bệnh viện real-time
           </p>
        </div>
        <div className="flex gap-4">
           <button 
            onClick={() => handleOpenAreaModal()}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
           >
              <Plus size={18} /> Khu vực mới
           </button>
           <button 
            onClick={() => handleOpenCounterModal()}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
           >
              <Monitor size={18} /> Quầy mới
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-6">
          <AreaList 
            areas={areas}
            activeAreaId={activeAreaId}
            onSelectArea={setActiveAreaId}
            onEditArea={handleOpenAreaModal}
            onDeleteArea={handleDeleteArea}
          />

          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/30 relative overflow-hidden">
            <Activity className="absolute bottom-[-20%] right-[-10%] w-40 h-40 opacity-10" />
            <div className="relative z-10">
                <Info className="mb-4" />
                <h4 className="text-lg font-black uppercase tracking-tight mb-2">Thông tin Phân vùng</h4>
                <p className="text-blue-100 text-sm leading-relaxed font-medium">
                  Các khu vực giúp bạn nhóm các quầy phục vụ lại với nhau. Màn hình trung tâm sẽ lọc thông tin theo khu vực này.
                </p>
            </div>
          </div>
        </div>

        <CounterGrid 
          counters={filteredCounters}
          activeAreaId={activeAreaId}
          activeAreaName={areas.find(a => (a.area_id || a.id) === activeAreaId)?.area_name || areas.find(a => (a.area_id || a.id) === activeAreaId)?.name}
          onEditCounter={handleOpenCounterModal}
          onDeleteCounter={handleDeleteCounter}
          onResetFilter={() => setActiveAreaId(null)}
          onTestCall={handleTestCallNext}
          onTestComplete={handleTestComplete}
          onTestBroadcast={handleTestBroadcast}
        />
      </div>

      <AreaModal 
        isOpen={showAreaModal}
        onClose={() => setShowAreaModal(false)}
        onSave={handleSaveArea}
        editingArea={editingArea}
        areaName={areaName}
        setAreaName={setAreaName}
        deptId={deptId}
        setDeptId={setDeptId}
        departments={departments}
      />

      <CounterModal 
        isOpen={showCounterModal}
        onClose={() => setShowCounterModal(false)}
        onSave={handleSaveCounter}
        editingCounter={editingCounter}
        counterName={counterName}
        setCounterName={setCounterName}
        isPriority={isPriority}
        setIsPriority={setIsPriority}
        selectedAreaId={selectedAreaId}
        setSelectedAreaId={setSelectedAreaId}
        areas={areas}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
      `}} />
    </div>
  );
};

export default ZoningSettings;

