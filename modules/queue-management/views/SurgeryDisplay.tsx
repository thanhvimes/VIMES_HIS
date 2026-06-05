import React, { useState, useEffect } from 'react';
import { Clock, ChevronLeft, RefreshCw, Activity, CheckCircle2, AlertCircle, Play, Maximize2, Minimize2, Settings, Stethoscope } from 'lucide-react';
import { apiFetch, getBaseUrl } from '../services/apiService';
import { AppSettings } from '../types';

interface Patient {
  id: string;
  name: string;
  birthYear?: string;
  room: string;
  expectedTime: string;
  time: string;
  status: string;
  statusDesc?: string;
}

interface SurgeryWaitingRoomProps {
  onBack: () => void;
  settings: AppSettings;
}

const SurgeryWaitingRoom: React.FC<SurgeryWaitingRoomProps> = ({ onBack, settings }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [patients, setPatients] = useState<Patient[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>(() => {
    return localStorage.getItem('vimes_surgery_selected_dept_id') || '';
  });
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerHeight = entry.contentRect.height;
        // Card height is exactly 96px, spacing (space-y-4) is 16px
        const rowHeight = 96;
        const spacing = 16;
        
        // Formula: N * (rowHeight + spacing) - spacing <= containerHeight
        // => N <= (containerHeight + spacing) / (rowHeight + spacing)
        const calculated = Math.floor((containerHeight + spacing) / (rowHeight + spacing));
        
        // Clamp between 4 and 10 to fit cleanly
        const finalItems = Math.max(4, Math.min(10, calculated));
        setItemsPerPage(finalItems);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(patients.length / itemsPerPage) - 1);
    if (currentPage > maxPage) {
      setCurrentPage(0);
    }
  }, [patients.length, itemsPerPage, currentPage]);

  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchPatients = async (deptId = selectedDeptId) => {
    setLoading(true);
    try {
      const url = deptId ? `/api/queue/surgery-waiting-list?deptId=${deptId}` : '/api/queue/surgery-waiting-list';
      const data = await apiFetch(url);
      if (Array.isArray(data)) {
        setPatients(data);
        setError(null);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (err: any) {
      setError('Không thể kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const d = await apiFetch('/api/departments');
      if (Array.isArray(d)) setDepartments(d);
    } catch {}
  };

  useEffect(() => {
    fetchPatients(selectedDeptId);
    fetchDepartments();
    const i = setInterval(() => fetchPatients(selectedDeptId), 15000);
    return () => clearInterval(i);
  }, [selectedDeptId]);

  // Smooth clock update every second
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const es = new EventSource(`${getBaseUrl()}/api/queue/events`);
    es.onopen = () => {
      console.log('[SurgeryDisplay SSE] Connection established/restored. Syncing data...');
      fetchPatients(selectedDeptId);
    };
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        if (d.type === 'SURGERY_UPDATED' || d.type === 'QUEUE_UPDATED') {
          fetchPatients(selectedDeptId);
        }
      } catch {}
    };
    return () => es.close();
  }, [selectedDeptId]);

  useEffect(() => {
    if (patients.length <= itemsPerPage) {
      setCurrentPage(0);
      return;
    }
    const i = setInterval(() => setCurrentPage(p => (p + 1) % Math.ceil(patients.length / itemsPerPage)), 8000);
    return () => clearInterval(i);
  }, [patients.length, itemsPerPage]);

  const handleDeptChange = (id: string) => {
    setSelectedDeptId(id);
    localStorage.setItem('vimes_surgery_selected_dept_id', id);
    setCurrentPage(0);
    fetchPatients(id);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => {
      document.removeEventListener('fullscreenchange', h);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  const handleSimulateMock = () => {
    const mockNames = [
      'Trần Minh Hoàng', 'Phạm Thanh Sơn', 'Nguyễn Công Phượng', 'Lê Hoài Nam', 
      'Vũ Đức Đam', 'Trần Quốc Anh', 'Lê Mai Chi', 'Phạm Hồng Đăng', 'Nguyễn Tiến Đạt'
    ];
    const mockRooms = ['Phòng Siêu Âm', 'Phòng XQuang', 'Phòng Điện Tim', 'Phòng Khám Nội 03', 'Phòng Mổ số 1', 'Phòng Hồi Tỉnh'];
    const mockStatuses = ['pre-op', 'surgery', 'recovery', 'finished'];
    const mockStatusDescs = ['Chuẩn bị', 'Đang phẫu thuật', 'Hồi tỉnh', 'Đã về khoa'];
    
    const newMockPatients: Patient[] = Array.from({ length: 5 }).map((_, i) => {
      const randomIdx = Math.floor(Math.random() * mockNames.length);
      const randomRoomIdx = Math.floor(Math.random() * mockRooms.length);
      const randomStatusIdx = Math.floor(Math.random() * mockStatuses.length);
      
      const hour = Math.floor(Math.random() * 4) + 8; // 8 to 11
      const min = Math.floor(Math.random() * 60);
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      
      return {
        id: `mock-sim-${Date.now()}-${i}`,
        name: mockNames[randomIdx],
        birthYear: String(1965 + Math.floor(Math.random() * 45)),
        room: mockRooms[randomRoomIdx],
        expectedTime: timeStr,
        time: timeStr,
        status: mockStatuses[randomStatusIdx],
        statusDesc: mockStatusDescs[randomStatusIdx]
      };
    });
    
    setPatients(prev => [...newMockPatients, ...prev]);
  };

  const getStatusDisplay = (status: string, desc?: string) => {
    const s = status.toLowerCase();
    if (s === 'p' || s === 'pre-op' || s === 'chuẩn bị') {
      return {
        text: desc || 'CHUẨN BỊ',
        bgColor: 'bg-amber-50 border-amber-200 text-amber-700',
        icon: <AlertCircle className="w-6 h-6 text-amber-500" />
      };
    }
    if (s === 's' || s === 'surgery' || s === 'đang phẫu thuật') {
      return {
        text: desc || 'ĐANG PHẪU THUẬT',
        bgColor: 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse',
        icon: <Play className="w-6 h-6 text-rose-500 fill-current" />
      };
    }
    if (s === 'r' || s === 'recovery' || s === 'hồi tỉnh') {
      return {
        text: desc || 'HỒI TỈNH',
        bgColor: 'bg-blue-50 border-blue-200 text-blue-700',
        icon: <Activity className="w-6 h-6 text-blue-500" />
      };
    }
    if (s === 'f' || s === 'finished' || s === 'đã về khoa') {
      return {
        text: desc || 'ĐÃ VỀ KHOA',
        bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />
      };
    }
    return {
      text: desc || status.toUpperCase(),
      bgColor: 'bg-slate-100 border-slate-200 text-slate-600',
      icon: <Stethoscope className="w-6 h-6 text-slate-500" />
    };
  };

  const totalPages = Math.ceil(patients.length / itemsPerPage);
  const page = patients.slice(currentPage * itemsPerPage, currentPage * itemsPerPage + itemsPerPage);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 text-slate-800 flex flex-col overflow-hidden font-sans">
      
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800;900&display=swap');

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-run {
          animation: marquee 30s linear infinite;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94A3B8;
        }
      `}} />

      {/* Header */}
      <div className="px-8 py-4 bg-[#1E3B8B] flex justify-between items-center shadow-md relative z-10">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/15 flex items-center justify-center group"
            title="Quay lại Portal"
          >
            <ChevronLeft className="w-6 h-6 text-white group-hover:-translate-x-0.5 transition-transform" />
          </button>
          
          <div className="p-3 bg-white/10 rounded-xl shadow-md flex items-center justify-center border border-white/10">
            <Activity className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-white">
              {settings.hospitalName || 'BỆNH VIỆN ĐA KHOA VIMES'}
            </h1>
            <p className="text-lg text-slate-300 mt-0.5 font-bold tracking-wide flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              KHU VỰC PHÒNG MỔ &bull; BẢNG TRẠNG THÁI NGƯỜI BỆNH
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Department filter dropdown */}
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-5 py-2.5 rounded-full shadow-inner">
            <span className="text-sm text-white/70 font-black uppercase tracking-wider">Bộ lọc khoa:</span>
            <select
              value={selectedDeptId}
              onChange={(e) => handleDeptChange(e.target.value)}
              className="bg-transparent text-white font-extrabold text-sm border-none outline-none cursor-pointer font-sans"
              style={{ colorScheme: 'dark' }}
            >
              <option value="" className="bg-[#1E3B8B] text-white">Tất cả các khoa</option>
              {departments.map(d => (
                <option key={d.id} value={d.id} className="bg-[#1E3B8B] text-white">{d.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/15 flex items-center justify-center"
            title="Toàn màn hình"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5 text-white" /> : <Maximize2 className="w-5 h-5 text-white" />}
          </button>

          <button
            onClick={() => fetchPatients(selectedDeptId)}
            disabled={loading}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition border border-white/15 flex items-center justify-center disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="text-right border-l border-white/20 pl-6">
            <div className="text-4xl font-mono font-bold text-white tracking-wide">
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className="text-sm font-semibold text-slate-300 uppercase tracking-widest mt-1">
              {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 p-8 overflow-hidden flex flex-col">
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xl">
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl mb-4">
              <AlertCircle className="w-12 h-12 text-rose-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-700 mb-2">Không thể tải thông tin phòng mổ</h3>
            <p className="text-slate-500 max-w-md text-center">{error}</p>
            <button
              onClick={() => fetchPatients(selectedDeptId)}
              className="mt-6 px-6 py-2.5 bg-[#1E3B8B] hover:bg-blue-800 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/10"
            >
              Thử lại ngay
            </button>
          </div>
        ) : (
          <div className="flex-1 flex flex-col bg-white rounded-[32px] border border-slate-200 p-8 overflow-hidden shadow-xl">
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2.8fr 1.2fr 2fr 1.6fr 1.6fr 2.4fr',
              alignItems: 'center',
              padding: '0 24px 16px 24px',
              borderBottom: '2px solid #F1F5F9',
            }} className="text-2xl font-black text-[#1E3B8B] uppercase tracking-wider mb-6">
              <div>Họ và tên người bệnh</div>
              <div className="text-center">Năm sinh</div>
              <div className="text-center">Phòng thực hiện</div>
              <div className="text-center">Giờ dự kiến</div>
              <div className="text-center">Giờ vào phòng</div>
              <div className="text-center">Trạng thái hiện tại</div>
            </div>

            {/* List Rows */}
            <div ref={containerRef} className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {patients.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-20">
                  <Activity className="w-16 h-16 text-slate-400 animate-pulse mb-4" />
                  <p className="text-slate-500 text-xl font-medium">Hiện tại chưa có người bệnh trong danh sách phòng mổ.</p>
                </div>
              ) : (
                page.map((p, idx) => {
                  const st = getStatusDisplay(p.status, p.statusDesc);
                  return (
                    <div
                      key={p.id || idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2.8fr 1.2fr 2fr 1.6fr 1.6fr 2.4fr',
                        alignItems: 'center',
                        height: '96px',
                        padding: '0 24px',
                        borderRadius: '24px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.01)',
                        transition: 'all 0.3s',
                      }}
                      className="surgery-row bg-slate-50/50 hover:bg-[#2e408a]/5 hover:border-[#2e408a]/20 hover:translate-x-1"
                    >
                      {/* Name */}
                      <div className="text-4xl font-extrabold text-slate-800 truncate px-2">
                        {p.name}
                      </div>

                      {/* Birth Year */}
                      <div className="text-3xl font-extrabold text-slate-600 text-center font-mono">
                        {p.birthYear || '----'}
                      </div>

                      {/* Room */}
                      <div className="text-3xl font-extrabold text-[#2e408a] text-center uppercase tracking-wide">
                        {p.room}
                      </div>

                      {/* Expected Time */}
                      <div className="text-3xl font-bold text-amber-600 text-center flex items-center justify-center gap-2">
                        <Clock className="w-7 h-7 text-amber-500" />
                        {p.expectedTime || '--:--'}
                      </div>

                      {/* Time */}
                      <div className="text-3xl font-bold text-slate-600 text-center flex items-center justify-center gap-2">
                        <Clock className="w-7 h-7 text-slate-400" />
                        {p.time || '--:--'}
                      </div>

                      {/* Status */}
                      <div className="flex justify-center">
                        <span style={{ fontSize: 22 }} className={`px-6 py-2.5 rounded-full font-extrabold border flex items-center gap-2 shadow-inner uppercase tracking-widest min-w-[210px] justify-center ${st.bgColor}`}>
                          {st.icon}
                          {st.text}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {/* Empty spacers if page has fewer items than itemsPerPage */}
              {page.length < itemsPerPage && Array.from({ length: itemsPerPage - page.length }).map((_, i) => (
                <div key={`empty-${i}`} style={{ height: '96px' }} />
              ))}
            </div>

            {/* Pagination dots inside card */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-6 pt-6 border-t border-slate-100">
                <span className="text-lg font-bold text-slate-400 uppercase tracking-widest">
                  Tổng: <span className="text-slate-800 font-extrabold">{patients.length}</span> ca
                </span>
                <div className="flex items-center gap-3">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${currentPage === i ? 'bg-[#1E3B8B] scale-125' : 'bg-slate-200 hover:bg-slate-300'}`}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-slate-400 uppercase tracking-widest">
                  Trang <span className="text-slate-600 font-extrabold">{currentPage + 1}</span> / <span className="text-slate-800 font-extrabold">{totalPages}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer marquee ticker */}
      <div className="bg-slate-100 py-4 border-t border-slate-200 flex items-center overflow-hidden">
        <div className="bg-[#f0a500] text-white font-extrabold px-6 py-2 mx-4 rounded-lg uppercase tracking-wider text-sm shadow-md shrink-0">
          LƯU Ý QUAN TRỌNG
        </div>
        <div className="relative flex overflow-x-hidden w-full items-center">
          <div className="animate-marquee-run whitespace-nowrap text-lg text-slate-600 font-bold tracking-wide flex">
            <span className="pr-12">
              Thông tin trên màn hình chỉ mang tính chất tham khảo. Người nhà vui lòng giữ trật tự chung, theo dõi bảng hiển thị hoặc chờ thông báo trực tiếp từ nhân viên y tế tại sảnh chờ. Hotline hỗ trợ khẩn cấp khu vực phòng mổ: {settings.hotline || '1900 1000'} --- VIMES QMS xin cảm ơn!
            </span>
            <span>
              Thông tin trên màn hình chỉ mang tính chất tham khảo. Người nhà vui lòng giữ trật tự chung, theo dõi bảng hiển thị hoặc chờ thông báo trực tiếp từ nhân viên y tế tại sảnh chờ. Hotline hỗ trợ khẩn cấp khu vực phòng mổ: {settings.hotline || '1900 1000'} --- VIMES QMS xin cảm ơn!
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurgeryWaitingRoom;

