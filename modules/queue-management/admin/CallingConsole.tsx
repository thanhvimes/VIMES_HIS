import React, { useState, useEffect } from 'react';
import { Monitor, MapPin, ChevronRight, CheckCircle2, Layout, ScanBarcode, LayoutGrid, Pill } from 'lucide-react';
import { apiFetch } from '../services/apiService';
import { AppSettings } from '../types';

import CounterConsole from '../consoles/CounterConsole';
import WidgetConsole from '../consoles/WidgetConsole';
import KanbanDispatcher from '../consoles/KanbanDispatcher';
import PharmacyConsole from '../consoles/PharmacyConsole';

interface CallingConsoleProps {
  settings: AppSettings;
}

export type UIMode = 'COUNTER' | 'WIDGET' | 'KANBAN' | 'PHARMACY';

const CallingConsole: React.FC<CallingConsoleProps> = ({ settings }) => {
  const [selectedArea, setSelectedArea] = useState<number | null>(null);
  const [areaName, setAreaName] = useState<string>('Mặc định');
  const [selectedCounter, setSelectedCounter] = useState<number | null>(null);
  const [counters, setCounters] = useState<any[]>([]);
  
  const [isConfigured, setIsConfigured] = useState(false);
  const [uiMode, setUiMode] = useState<UIMode>('COUNTER');

  // Load saved config
  useEffect(() => {
    const savedCounter = localStorage.getItem('vimes_console_counter');
    const savedUiMode = localStorage.getItem('vimes_console_uimode') as UIMode;
    const portalAreaJson = localStorage.getItem('vimes_selected_area');
    const portalRoomJson = localStorage.getItem('vimes_selected_room');
    const activeService = localStorage.getItem('vimes_selected_service');

    let portalArea = null;
    let portalRoom = null;
    try { portalArea = portalAreaJson ? JSON.parse(portalAreaJson) : null; } catch(e) {}
    try { portalRoom = portalRoomJson ? JSON.parse(portalRoomJson) : null; } catch(e) {}

    if (savedUiMode) setUiMode(savedUiMode);

    if (savedCounter) {
      setSelectedCounter(parseInt(savedCounter));
      setIsConfigured(true);
    } else if ((activeService === 'EXECUTION' || activeService === 'REGISTRATION') && portalRoom) {
      setSelectedCounter(parseInt(portalRoom.id));
      setIsConfigured(true);
    }

    if ((activeService === 'EXECUTION' || activeService === 'REGISTRATION') && portalRoom) {
      setAreaName(portalRoom.name);
    } else if (settings.areaId) {
      setSelectedArea(settings.areaId);
      setAreaName(settings.areaName || 'Mặc định');
    } else if (portalArea) {
      setSelectedArea(portalArea.area_id || portalArea.id);
      setAreaName(portalArea.area_name || portalArea.name || 'Mặc định');
    }
  }, [settings.areaId, settings.areaName]);

  // Load counters/rooms
  useEffect(() => {
    const activeService = localStorage.getItem('vimes_selected_service');
    const deptId = localStorage.getItem('vimes_selected_dept');

    if ((activeService === 'EXECUTION' || activeService === 'REGISTRATION') && deptId) {
      apiFetch(`/api/departments/${deptId}/rooms`).then(data => {
         const mappedRooms = (data || []).map((r: any) => ({
           counter_id: parseInt(r.id),
           counter_name: r.name,
           area_id: deptId
         }));
         setCounters(mappedRooms);
      });
    } else if (selectedArea) {
      apiFetch(`/api/public/counters?areaId=${selectedArea}`).then(data => {
         const filtered = data.filter((c: any) => String(c.area_id) === String(selectedArea));
         setCounters(filtered || []);
      });
    }
  }, [selectedArea]);

  const handleSaveConfig = () => {
    if (selectedCounter || uiMode === 'KANBAN') {
      if (selectedCounter) localStorage.setItem('vimes_console_counter', selectedCounter.toString());
      localStorage.setItem('vimes_console_uimode', uiMode);
      setIsConfigured(true);
    }
  };

  const handleLogout = () => {
    setIsConfigured(false);
    localStorage.removeItem('vimes_console_counter');
    localStorage.removeItem('vimes_selected_room');
  };

  // --- CONFIGURATION WIZARD ---
  if (!isConfigured) {
    const uiModes: { id: UIMode; label: string; icon: React.ReactNode; desc: string }[] = [
      { id: 'COUNTER', label: 'Bàn Tiếp Đón', icon: <Layout className="w-6 h-6" />, desc: 'Giao diện phím tắt cho Lễ tân, Thu ngân' },
      { id: 'WIDGET', label: 'Phòng Khám', icon: <LayoutGrid className="w-6 h-6" />, desc: 'Widget nổi cho Bác sĩ (Không che phần mềm)' },
      { id: 'KANBAN', label: 'Cận Lâm Sàng', icon: <Monitor className="w-6 h-6" />, desc: 'Bảng kéo thả cho KTV X-Quang, Siêu âm' },
      { id: 'PHARMACY', label: 'Nhà Thuốc', icon: <Pill className="w-6 h-6" />, desc: 'Chế độ quét mã vạch cho Dược sĩ' },
    ];

    return (
      <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 font-sans">
        <div className="max-w-4xl w-full bg-white rounded-[2rem] p-8 shadow-2xl flex flex-col md:flex-row gap-8">
           
           {/* Left: UI Mode Selection */}
           <div className="flex-1">
             <h2 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">1. Chọn Chế Độ Giao Diện</h2>
             <div className="grid grid-cols-1 gap-4">
               {uiModes.map(mode => (
                 <button
                   key={mode.id}
                   onClick={() => setUiMode(mode.id)}
                   className={`p-4 rounded-xl border-2 text-left flex items-start gap-4 transition-all ${
                     uiMode === mode.id ? 'border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/20' : 'border-slate-200 hover:border-emerald-300'
                   }`}
                 >
                   <div className={`p-3 rounded-lg ${uiMode === mode.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                     {mode.icon}
                   </div>
                   <div>
                     <h3 className={`font-bold text-lg ${uiMode === mode.id ? 'text-emerald-800' : 'text-slate-700'}`}>{mode.label}</h3>
                     <p className="text-sm text-slate-500 mt-1">{mode.desc}</p>
                   </div>
                 </button>
               ))}
             </div>
           </div>

           {/* Right: Counter Selection */}
           <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-200 pt-8 md:pt-0 md:pl-8 flex flex-col">
              <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">{(localStorage.getItem('vimes_selected_service') === 'EXECUTION' || localStorage.getItem('vimes_selected_service') === 'REGISTRATION') ? '2. Chọn Phòng Lâm Sàng' : '2. Chọn Quầy Làm Việc'}</h2>
              <p className="text-sm text-slate-500 mb-6 font-bold flex items-center gap-2">
                 <MapPin size={16} className={(localStorage.getItem('vimes_selected_service') === 'EXECUTION' || localStorage.getItem('vimes_selected_service') === 'REGISTRATION') ? "text-rose-500" : "text-emerald-500"} /> {(localStorage.getItem('vimes_selected_service') === 'EXECUTION' || localStorage.getItem('vimes_selected_service') === 'REGISTRATION') ? 'PHÒNG KHÁM:' : 'KHU VỰC:'} <span className={(localStorage.getItem('vimes_selected_service') === 'EXECUTION' || localStorage.getItem('vimes_selected_service') === 'REGISTRATION') ? "text-rose-600 underline uppercase" : "text-emerald-600 underline uppercase"}>{areaName}</span>
              </p>

              {uiMode === 'KANBAN' ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 mb-6">
                   <LayoutGrid className="w-16 h-16 text-slate-300 mb-4" />
                   <h3 className="font-bold text-slate-700">Chế độ Quản lý Toàn Khu Vực</h3>
                   <p className="text-sm text-slate-500 mt-2">Kỹ thuật viên sẽ điều phối tất cả các phòng thuộc khu vực {areaName}. Không cần chọn quầy cụ thể.</p>
                 </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6 custom-scrollbar max-h-[400px]">
                  {counters.length > 0 ? counters.map(counter => (
                     <button 
                       key={counter.counter_id}
                       onClick={() => setSelectedCounter(counter.counter_id)}
                       className={`w-full p-4 rounded-xl border-2 transition-all text-left flex justify-between items-center ${
                         selectedCounter === counter.counter_id ? ((localStorage.getItem('vimes_selected_service') === 'EXECUTION' || localStorage.getItem('vimes_selected_service') === 'REGISTRATION') ? 'border-rose-500 bg-rose-500 text-white shadow-lg' : 'border-emerald-500 bg-emerald-500 text-white shadow-lg') : 'border-slate-200 hover:border-rose-300 bg-white'
                       }`}
                     >
                       <div>
                         <p className="font-bold text-lg">{counter.counter_name}</p>
                         <p className={`text-xs uppercase font-bold tracking-widest mt-0.5 ${selectedCounter === counter.counter_id ? ((localStorage.getItem('vimes_selected_service') === 'EXECUTION' || localStorage.getItem('vimes_selected_service') === 'REGISTRATION') ? 'text-rose-100' : 'text-emerald-100') : 'text-slate-400'}`}>ID: {counter.counter_id}</p>
                       </div>
                       {selectedCounter === counter.counter_id && <CheckCircle2 size={24} />}
                     </button>
                  )) : (
                    <div className="p-8 text-center text-slate-400 font-bold text-sm italic bg-slate-50 rounded-xl border border-slate-200">
                       {(localStorage.getItem('vimes_selected_service') === 'EXECUTION' || localStorage.getItem('vimes_selected_service') === 'REGISTRATION') ? 'Khoa này chưa cấu hình phòng lâm sàng nào.' : 'Khu vực này chưa có quầy nào được kích hoạt.'}
                    </div>
                  )}
                </div>
              )}

             <button 
               onClick={handleSaveConfig}
               disabled={uiMode !== 'KANBAN' && !selectedCounter}
               className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3 active:scale-95 ${
                 (uiMode === 'KANBAN' || selectedCounter) 
                  ? 'bg-slate-900 text-white hover:bg-black shadow-xl shadow-slate-900/20' 
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
               }`}
             >
                VÀO BÀN LÀM VIỆC <ChevronRight size={20} />
             </button>
           </div>

        </div>
      </div>
    );
  }

  // --- RENDER SPECIALIZED CONSOLES ---
  
  const counterName = counters.find(c => c.counter_id === selectedCounter)?.counter_name || `Quầy ${selectedCounter}`;

  switch (uiMode) {
    case 'COUNTER':
      return <CounterConsole settings={settings} counterId={selectedCounter!} counterName={counterName} onLogout={handleLogout} />;
    case 'WIDGET':
      return (
        <div className="h-screen bg-transparent pointer-events-none">
          <div className="pointer-events-auto">
            <WidgetConsole settings={settings} counterId={selectedCounter!} counterName={counterName} />
          </div>
          {/* Nút thoát phụ cho Widget mode */}
          <button onClick={handleLogout} className="fixed bottom-4 right-4 bg-slate-800 text-white px-4 py-2 rounded-lg pointer-events-auto shadow-lg hover:bg-rose-600 font-bold text-sm transition-colors">
            Đóng phiên
          </button>
        </div>
      );
    case 'KANBAN':
      return <KanbanDispatcher settings={settings} areaId={selectedArea!} areaName={areaName} onLogout={handleLogout} />;
    case 'PHARMACY':
      return <PharmacyConsole settings={settings} counterId={selectedCounter!} counterName={counterName} onLogout={handleLogout} />;
    default:
      return <div>Invalid UI Mode</div>;
  }
};

export default CallingConsole;

