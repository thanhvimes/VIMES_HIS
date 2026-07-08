import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Clock, 
  Search, 
  Play, 
  CheckCircle2, 
  ChevronDown, 
  CalendarDays, 
  ArrowLeft, 
  Settings,
  AlertCircle,
  Users,
  History
} from 'lucide-react';
import { apiFetch, getBaseUrl } from '../services/apiService';

interface SurgeryConsoleProps {
  settings: any;
  departments: any[];
  selectedDept: string;
  onLogout: () => void;
  surgeryList: any[];
  loadData: () => Promise<void>;
  activeTab: 'CONSOLE' | 'WAITING' | 'CONCLUDING' | 'EXAMINED' | 'TRANSFER' | 'P' | 'S' | 'R' | 'F' | 'HIS_SURGERIES';
  setActiveTab: (tab: any) => void;
}

export const SurgeryConsole: React.FC<SurgeryConsoleProps> = ({ 
  settings, 
  departments, 
  selectedDept,
  onLogout,
  surgeryList,
  loadData,
  activeTab,
  setActiveTab
}) => {
  const [loading, setLoading] = useState(false);
  const [surgeryRooms, setSurgeryRooms] = useState<any[]>([]);
  const [surgeryTables, setSurgeryTables] = useState<any[]>([]);
  
  // Tự động tải danh sách phòng mổ
  useEffect(() => {
    apiFetch('/api/queue/surgery-rooms').then(data => {
      if (Array.isArray(data)) {
        setSurgeryRooms(data);
        if (data.length > 0) setAssignRoom(data[0].id);
      }
    }).catch(e => console.error('Error fetching surgery rooms:', e));
  }, []);

  // Tự động tải danh sách bàn mổ
  useEffect(() => {
    const currentUserStr = localStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    const userId = currentUser?.userId || currentUser?.user?.userId || currentUser?.su_userid || currentUser?.username || '';

    apiFetch(`/api/queue/surgery-tables?userId=${encodeURIComponent(userId)}`).then(data => {
      if (Array.isArray(data)) {
        setSurgeryTables(data);
        if (data.length > 0) {
          setAssignTable(data[0].id);
          setTransTable(data[0].id);
        }
      }
    }).catch(e => console.error('Error fetching surgery tables:', e));
  }, []);
  
  // Surgery HIS search states
  const [hisSearchFromDate, setHisSearchFromDate] = useState(() => {
    const d = new Date();
    return d.toISOString().substring(0, 10);
  });
  const [hisSearchToDate, setHisSearchToDate] = useState(() => {
    const d = new Date();
    return d.toISOString().substring(0, 10);
  });
  const [hisSearchDept, setHisSearchDept] = useState('');
  const [hisSearchKeyword, setHisSearchKeyword] = useState('');
  const [hisSearchBoardStatus, setHisSearchBoardStatus] = useState<string>('all');
  const [hisSearchList, setHisSearchList] = useState<any[]>([]);
  const [hisSearching, setHisSearching] = useState(false);
  const [selectedHisPatient, setSelectedHisPatient] = useState<any>(null);
  const [assignExpectedTime, setAssignExpectedTime] = useState<string>('');

  useEffect(() => {
    if (selectedHisPatient) {
      const formatted = selectedHisPatient.expected_time ? selectedHisPatient.expected_time.replace(' ', 'T') : '';
      setAssignExpectedTime(formatted);
    }
  }, [selectedHisPatient]);

  // Board assignment parameters for the selected HIS patient
  const [assignRoom, setAssignRoom] = useState<string | number>(1);
  const [assignTable, setAssignTable] = useState<string | number>(1);
  const [assignStatus, setAssignStatus] = useState<string>('P');
  const [assignRetTime, setAssignRetTime] = useState<number>(45);
  const [assignRetDept, setAssignRetDept] = useState<string>('KB');
  const [assignConsciousTime, setAssignConsciousTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Surgery transition form states
  const [transitionPatient, setTransitionPatient] = useState<any>(null);
  const [transitionType, setTransitionType] = useState<'RECOVERY' | 'FINISHED' | null>(null);
  const [transTable, setTransTable] = useState<string | number>(1);
  const [transRetTime, setTransRetTime] = useState<number>(45);
  const [transConsciousTime, setTransConsciousTime] = useState<string>('');
  const [transRetDept, setTransRetDept] = useState<string>('KB');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Dữ liệu ca mổ (surgeryList, loadData) đã được đồng bộ qua props từ cha DoctorConsole

  // Set default assignRoom when surgeryRooms loads
  useEffect(() => {
    if (surgeryRooms.length > 0) {
      setAssignRoom(surgeryRooms[0].id);
    }
  }, [surgeryRooms]);

  // HIS search handler
  const handleSearchHisSurgeries = useCallback(async () => {
    setHisSearching(true);
    try {
      const data = await apiFetch(
        `/api/queue/his-surgeries?fromDate=${hisSearchFromDate}&toDate=${hisSearchToDate}&deptId=${hisSearchDept}&searchTerm=${encodeURIComponent(hisSearchKeyword)}&boardStatus=${hisSearchBoardStatus}`
      );
      if (Array.isArray(data)) {
        setHisSearchList(data);
      }
    } catch (err: any) {
      console.error("Error searching HIS surgeries:", err);
    } finally {
      setHisSearching(false);
    }
  }, [hisSearchFromDate, hisSearchToDate, hisSearchDept, hisSearchKeyword, hisSearchBoardStatus]);

  useEffect(() => {
    handleSearchHisSurgeries();
  }, [hisSearchFromDate, hisSearchToDate, hisSearchDept, hisSearchBoardStatus]);

  const handleAddFromHis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHisPatient) return;
    setLoading(true);
    try {
      await apiFetch('/api/queue/surgery/add-from-his', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hoIdx: selectedHisPatient.id,
          status: assignStatus,
          room: assignRoom,
          operationTable: assignTable,
          retTime: assignStatus === 'R' ? assignRetTime : 0,
          retDept: assignStatus === 'F' ? assignRetDept : '',
          consciousTime: assignStatus === 'R' ? assignConsciousTime : '',
          expectedTime: assignExpectedTime
        })
      });
      setSelectedHisPatient(null);
      handleSearchHisSurgeries();
      loadData();
    } catch (err: any) {
      console.error("Error adding patient from HIS to board:", err);
      alert("Không thể thêm vào ca mổ: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSurgeryStatus = async (
    hoIdx: string, 
    status: string, 
    extraParams?: { operationTable?: number; retTime?: number; retDept?: string; consciousTime?: string }
  ) => {
    setLoading(true);
    try {
      await apiFetch('/api/queue/surgery/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: hoIdx,
          status: status,
          ...extraParams
        })
      });
      setTransitionPatient(null);
      setTransitionType(null);
      loadData();
    } catch (err: any) {
      console.error("Error updating surgery status:", err);
      alert("Lỗi cập nhật trạng thái: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startTransitionToRecovery = (patient: any) => {
    setTransitionPatient(patient);
    setTransitionType('RECOVERY');
    setTransTable(patient.operationTable || (surgeryTables[0]?.id || 1));
    setTransRetTime(patient.returnTimeMinutes || 45);
    
    const d = new Date();
    setTransConsciousTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
  };

  const startTransitionToFinished = (patient: any) => {
    setTransitionPatient(patient);
    setTransitionType('FINISHED');
    setTransRetDept(patient.returnDeptId || selectedDept || 'KB');
  };

  const getConsciousTimestamp = (timeStr: string) => {
    if (!timeStr) return '';
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${timeStr}:00`;
  };

  const filteredBySearch = surgeryList.filter(p => 
    (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(p.docNo || '').includes(searchQuery)
  );

  const filteredSurgeryList = activeTab === 'CONSOLE'
    ? filteredBySearch
    : filteredBySearch.filter(p => p.status === activeTab);

  return (
    <>
      {/* Mobile Bottom Navigation Bar overrides for mobile view */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900 border-t border-slate-800 flex items-center justify-around z-50 px-4 shadow-lg">
         <button 
           onClick={() => setActiveTab('CONSOLE')}
           className={`flex flex-col items-center justify-center transition-all ${activeTab === 'CONSOLE' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}`}
         >
            <Activity size={18} />
            <span className="text-[8px] font-black uppercase mt-1">Bàn mổ</span>
         </button>
         
         <button 
           onClick={() => setActiveTab('WAITING')}
           className={`flex flex-col items-center justify-center transition-all ${activeTab === 'WAITING' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}`}
         >
            <Users size={18} />
            <span className="text-[8px] font-black uppercase mt-1">Chờ ({surgeryList.filter(s => s.status === 'P' || s.status === 'S' || s.status === 'R').length})</span>
         </button>

         <button 
           onClick={() => setActiveTab('HISTORY')}
           className={`flex flex-col items-center justify-center transition-all ${activeTab === 'HISTORY' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}`}
         >
            <History size={18} />
            <span className="text-[8px] font-black uppercase mt-1">Lịch sử</span>
         </button>

         <button 
           onClick={() => setActiveTab('HIS_SURGERIES')}
           className={`flex flex-col items-center justify-center transition-all ${activeTab === 'HIS_SURGERIES' ? 'text-blue-400 font-bold scale-105' : 'text-slate-400 hover:text-white'}`}
         >
            <CalendarDays size={18} />
            <span className="text-[8px] font-black uppercase mt-1">Lịch HIS</span>
         </button>

         <button 
           onClick={onLogout}
           className="flex flex-col items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
         >
            <ArrowLeft size={18} />
            <span className="text-[8px] font-black uppercase mt-1">Trở về</span>
         </button>
      </div>

      {/* Cụm nút chuyển đổi cũ đã được đưa lên Sidebar bên trái của cha */}

      <div className="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 pt-10 md:pt-0 overflow-y-auto md:overflow-hidden w-full">
        {activeTab === 'HIS_SURGERIES' ? (
          /* HIS SURGERIES FULL TAB PANEL */
          <section className="flex-1 flex flex-col gap-6 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 overflow-y-auto custom-scrollbar">
             <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <div>
                   <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Danh sách phẫu thuật HIS</h2>
                   <p className="text-xs text-slate-400 font-bold uppercase">Tìm kiếm bệnh nhân đã có ca mổ trên HIS để đưa vào bảng theo dõi phòng mổ</p>
                </div>
                <button 
                   onClick={() => setActiveTab('CONSOLE')}
                   className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                   Quay lại bảng phòng mổ
                </button>
             </div>

             {/* Filters inside full panel */}
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                   <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">Từ ngày</label>
                   <input 
                      type="date" 
                      value={hisSearchFromDate}
                      onChange={(e) => setHisSearchFromDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none focus:border-blue-500"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-450 uppercase mb-1">Đến ngày</label>
                   <input 
                      type="date" 
                      value={hisSearchToDate}
                      onChange={(e) => setHisSearchToDate(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none focus:border-blue-500"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-455 uppercase mb-1">Khoa điều trị</label>
                   <select 
                      value={hisSearchDept}
                      onChange={(e) => setHisSearchDept(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none focus:border-blue-500 uppercase"
                   >
                      <option value="">-- Tất cả khoa --</option>
                      {departments.map(dept => (
                         <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-455 uppercase mb-1">Trạng thái Board</label>
                   <select 
                      value={hisSearchBoardStatus}
                      onChange={(e) => setHisSearchBoardStatus(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none focus:border-blue-500 uppercase"
                   >
                      <option value="all">Tất cả</option>
                      <option value="no">Chưa đưa vào board</option>
                      <option value="yes">Đã đưa vào board</option>
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-455 uppercase mb-1">Từ khóa (Tên BN / Mã hồ sơ)</label>
                   <div className="flex gap-2">
                      <input 
                         type="text" 
                         placeholder="Nhập tên bệnh nhân hoặc mã HS..." 
                         value={hisSearchKeyword}
                         onChange={(e) => setHisSearchKeyword(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleSearchHisSurgeries()}
                         className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none focus:border-blue-500"
                      />
                      <button 
                         onClick={handleSearchHisSurgeries}
                         className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md shadow-blue-500/10"
                      >
                         Tìm kiếm
                      </button>
                   </div>
                </div>
             </div>

             {/* Table results list */}
             <div className="flex-1 overflow-x-auto min-h-[300px]">
                {hisSearching ? (
                   <div className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Đang truy vấn lịch phẫu thuật HIS...</div>
                ) : hisSearchList.length === 0 ? (
                   <div className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest italic text-slate-300">Không tìm thấy ca phẫu thuật nào trong HIS</div>
                ) : (
                   <table className="w-full text-left border-collapse text-xs">
                       <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider sticky top-0 z-10">
                          <tr className="border-b border-slate-200">
                             <th className="py-3.5 px-4 font-black">Mã hồ sơ</th>
                             <th className="py-3.5 px-4 font-black">Họ tên bệnh nhân</th>
                             <th className="py-3.5 px-4 font-black">Năm sinh</th>
                             <th className="py-3.5 px-4 font-black">Tên dịch vụ</th>
                             <th className="py-3.5 px-4 font-black">Ngày chỉ định</th>
                             <th className="py-3.5 px-4 font-black">Khoa chỉ định</th>
                             <th className="py-3.5 px-4 font-black">Phòng mổ HIS</th>
                             <th className="py-3.5 px-4 font-black">Ngày giờ dự kiến</th>
                             <th className="py-3.5 px-4 font-black text-center">Thao tác</th>
                          </tr>
                       </thead>
                       <tbody>
                          {hisSearchList.map((patient) => (
                             <tr key={patient.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-4 font-mono font-bold text-slate-500">{patient.doc_no}</td>
                                <td className="py-4 px-4 font-black text-slate-800 uppercase text-xs">{patient.patient_name}</td>
                                <td className="py-4 px-4 font-bold text-slate-500">{patient.birth_year || '----'}</td>
                                <td className="py-4 px-4 font-bold text-slate-600 uppercase max-w-[220px] whitespace-normal break-words">{patient.service_name || '----'}</td>
                                <td className="py-4 px-4 font-mono font-bold text-slate-500">{patient.order_date || '----'}</td>
                                <td className="py-4 px-4 font-bold text-slate-600 uppercase max-w-[200px] whitespace-normal break-words">{patient.dept_name || '----'}</td>
                                <td className="py-4 px-4 font-bold text-slate-655">{patient.room_name || 'Phòng mổ'}</td>
                                <td className="py-4 px-4 font-mono font-bold text-slate-600">{patient.expected_time}</td>
                                <td className="py-4 px-4 text-center">
                                  {patient.is_on_board ? (
                                     <div className="flex flex-col items-center gap-1.5">
                                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-100/80">
                                           Board: {patient.board_status === 'P' ? 'Chuẩn bị' : patient.board_status === 'S' ? 'Đang mổ' : patient.board_status === 'R' ? 'Hồi tỉnh' : patient.board_status === 'F' ? 'Về khoa' : 'Đang theo dõi'}
                                        </span>
                                        <button 
                                           onClick={() => {
                                              setSelectedHisPatient(patient);
                                              setAssignRoom(patient.room_id || 1);
                                              setAssignTable(patient.operation_table || (surgeryTables[0]?.id || 1));
                                              setAssignStatus(patient.board_status || 'P');
                                              setAssignRetTime(45);
                                              setAssignRetDept(patient.dept_id || 'KB');
                                              const d = new Date();
                                              setAssignConsciousTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                                           }}
                                           className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline transition-colors"
                                        >
                                           Cập nhật cấu hình
                                        </button>
                                     </div>
                                  ) : (
                                     <button 
                                        onClick={() => {
                                           setSelectedHisPatient(patient);
                                           setAssignRoom(patient.room_id || 1);
                                           setAssignTable(patient.operation_table || (surgeryTables[0]?.id || 1));
                                           setAssignStatus('P');
                                           setAssignRetTime(45);
                                           setAssignRetDept(patient.dept_id || 'KB');
                                           const d = new Date();
                                           setAssignConsciousTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                                        }}
                                        className="px-4 py-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm"
                                     >
                                        Chọn đưa vào board
                                     </button>
                                  )}
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                )}
             </div>
          </section>
        ) : (
          <>
             {/* SURGERY WORKSPACE: LEFT PANEL */}
             <section className="flex-1 flex flex-col gap-6 md:overflow-y-auto pr-0 md:pr-2 custom-scrollbar">
                
                {/* Surgery Stats Hub */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
                   <div className="flex justify-between items-center">
                      <div>
                         <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Surgery Stats Hub</h2>
                         <p className="text-xs text-slate-400 font-bold uppercase">Giám sát hoạt động phẫu thuật thời gian thực</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100">
                         Hôm nay: {surgeryList.length} Ca mổ
                      </span>
                   </div>
                   
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                      {/* P status stats */}
                      <div 
                         onClick={() => setActiveTab('P')}
                         className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                         <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold text-xs">P</div>
                         <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Chuẩn bị</p>
                            <p className="text-lg font-black text-slate-700">{surgeryList.filter(s => s.status === 'P').length}</p>
                         </div>
                      </div>
                      {/* S status stats */}
                      <div 
                         onClick={() => setActiveTab('S')}
                         className="bg-rose-50/55 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                         <div className="absolute top-2 right-2 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                         </div>
                         <div className="h-10 w-10 bg-rose-55 text-rose-600 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm">S</div>
                         <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-rose-600">Đang mổ</p>
                            <p className="text-lg font-black text-rose-700">{surgeryList.filter(s => s.status === 'S').length}</p>
                         </div>
                      </div>
                      {/* R status stats */}
                      <div 
                         onClick={() => setActiveTab('R')}
                         className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                         <div className="h-10 w-10 bg-blue-55 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xs">R</div>
                         <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-blue-600">Hồi tỉnh</p>
                            <p className="text-lg font-black text-blue-700">{surgeryList.filter(s => s.status === 'R').length}</p>
                         </div>
                      </div>
                      {/* F status stats */}
                      <div 
                         onClick={() => setActiveTab('F')}
                         className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                         <div className="h-10 w-10 bg-emerald-55 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-xs">F</div>
                         <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-emerald-600">Đã về khoa</p>
                            <p className="text-lg font-black text-emerald-700">{surgeryList.filter(s => s.status === 'F').length}</p>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Surgery Interactive Grid */}
                <div className="space-y-4 pb-20">
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Danh sách ca mổ ({filteredSurgeryList.length})</h3>
                   
                   {filteredSurgeryList.length === 0 ? (
                      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-20 text-center flex flex-col items-center gap-4">
                         <Activity size={48} className="text-slate-200" />
                         <p className="text-xs text-slate-400 font-bold uppercase italic">Không tìm thấy ca phẫu thuật nào</p>
                      </div>
                   ) : (
                      filteredSurgeryList.map((patient) => {
                         const isActiveTransition = transitionPatient?.id === patient.id;
                         
                         return (
                            <div 
                               key={patient.id} 
                               className={`bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden shadow-sm flex flex-col ${
                                  patient.status === 'S' ? 'border-rose-250 ring-2 ring-rose-500/5' : 
                                  patient.status === 'R' ? 'border-blue-250 ring-2 ring-blue-500/5' : 
                                  patient.status === 'F' ? 'border-emerald-250 bg-slate-50/20' : 'border-slate-200 hover:border-blue-300'
                               }`}
                            >
                               {/* Card Header */}
                               <div className={`px-6 py-4 border-b flex justify-between items-center text-xs font-bold uppercase ${
                                  patient.status === 'S' ? 'bg-rose-50/40 border-rose-100 text-rose-700' :
                                  patient.status === 'R' ? 'bg-blue-50/30 border-blue-100 text-blue-700' :
                                  patient.status === 'F' ? 'bg-emerald-50/20 border-emerald-100 text-emerald-700' : 'bg-slate-50/80 border-slate-100 text-slate-500'
                               }`}>
                                  <div className="flex items-center gap-2">
                                     <span className="font-mono text-slate-400">HS: {patient.docNo}</span>
                                     <span className="h-1 w-1 bg-slate-300 rounded-full"></span>
                                     <span>{patient.room || 'Phòng mổ'}</span>
                                  </div>
                                  
                                  {/* Manual Override dropdown */}
                                  <div className="flex items-center gap-2">
                                     <span className="text-[9px] text-slate-400 lowercase font-medium">Trạng thái:</span>
                                     <select 
                                        value={patient.status}
                                        onChange={(e) => handleUpdateSurgeryStatus(patient.id, e.target.value)}
                                        className="bg-white border border-slate-200 rounded px-2 py-0.5 text-[10px] font-black text-slate-600 focus:outline-none cursor-pointer uppercase"
                                     >
                                        <option value="P">Chuẩn bị (P)</option>
                                        <option value="S">Đang mổ (S)</option>
                                        <option value="R">Hồi tỉnh (R)</option>
                                        <option value="F">Đã về khoa (F)</option>
                                     </select>
                                  </div>
                               </div>

                               {/* Card Content */}
                               <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                  <div className="flex-1 space-y-2">
                                     <h3 className="text-lg font-black text-slate-800 tracking-tight uppercase">{patient.name}</h3>
                                     
                                     {/* Metadata Details */}
                                     <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-500">
                                        <div>
                                           <span className="text-slate-400 font-medium">Khoa điều trị:</span> <span className="font-bold">{patient.deptName || 'Khoa Ngoại'}</span>
                                        </div>
                                        <div>
                                           <span className="text-slate-400 font-medium">Giờ dự kiến:</span> <span className="font-mono font-bold text-slate-600">{patient.expectedTime}</span>
                                        </div>
                                        
                                        {/* Status specific fields */}
                                        {patient.status === 'S' && patient.time && (
                                           <div className="col-span-2 text-rose-600 font-bold flex items-center gap-1.5 animate-pulse">
                                              <Clock size={12} />
                                              <span>Bắt đầu mổ lúc: {patient.time}</span>
                                           </div>
                                        )}

                                        {patient.status === 'R' && (
                                           <div className="col-span-2 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/60 space-y-1 mt-1 text-slate-700">
                                              <div className="flex justify-between">
                                                 <span className="text-blue-600 font-bold">Bàn mổ:</span>
                                                 <span className="font-black text-blue-900">Bàn số {patient.operationTable || '1'}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                 <span className="text-blue-600 font-bold">Phút hồi tỉnh:</span>
                                                 <span className="font-black text-blue-900">{patient.returnTimeMinutes || 45} phút</span>
                                              </div>
                                              <div className="flex justify-between">
                                                 <span className="text-blue-600 font-bold">Giờ tỉnh:</span>
                                                 <span className="font-mono font-black text-blue-900">{patient.consciousTime || '--:--'}</span>
                                              </div>
                                           </div>
                                        )}

                                        {patient.status === 'F' && (
                                           <div className="col-span-2 bg-emerald-50/30 p-2.5 rounded-xl border border-emerald-100/50 space-y-1 mt-1 text-slate-700">
                                              <div className="flex justify-between">
                                                 <span className="text-emerald-700 font-bold">Bàn mổ:</span>
                                                 <span className="font-black text-emerald-950">Bàn số {patient.operationTable || '1'}</span>
                                              </div>
                                              <div className="flex justify-between">
                                                 <span className="text-emerald-700 font-bold">Khoa tiếp nhận:</span>
                                                 <span className="font-black text-emerald-950 uppercase">{patient.returnDept || 'Chưa nhận khoa'}</span>
                                              </div>
                                              {patient.consciousTime && (
                                                 <div className="flex justify-between">
                                                    <span className="text-emerald-700 font-bold">Giờ tỉnh giấc:</span>
                                                    <span className="font-mono font-black text-emerald-950">{patient.consciousTime}</span>
                                                 </div>
                                              )}
                                           </div>
                                        )}
                                     </div>
                                  </div>

                                  {/* Premium Surgery Timeline */}
                                  <div className="flex items-center flex-wrap gap-1 bg-slate-50/80 p-2 rounded-2xl border border-slate-100 self-start md:self-center shrink-0 max-w-full overflow-x-auto">
                                     {[
                                        { code: 'P', label: 'Chuẩn bị' },
                                        { code: 'S', label: 'Đang mổ' },
                                        { code: 'R', label: 'Hồi tỉnh' },
                                        { code: 'F', label: 'Về khoa' }
                                     ].map((step, idx, arr) => {
                                        const isCompleted = arr.findIndex(x => x.code === patient.status) >= idx;
                                        const isCurrent = step.code === patient.status;
                                        
                                        return (
                                           <div key={step.code} className="flex items-center">
                                              <div className="flex flex-col items-center px-1.5">
                                                 <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                                    isCurrent ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-110 ring-2 ring-white' :
                                                    isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                                                 }`}>
                                                    {idx + 1}
                                                 </div>
                                                 <span className={`text-[8px] font-black uppercase mt-1 tracking-tight ${
                                                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-emerald-600' : 'text-slate-400'
                                                 }`}>{step.label}</span>
                                              </div>
                                              {idx < arr.length - 1 && (
                                                 <div className={`h-0.5 w-5 transition-all ${
                                                    isCompleted && arr.findIndex(x => x.code === patient.status) > idx ? 'bg-emerald-500' : 'bg-slate-200'
                                                 }`}></div>
                                              )}
                                           </div>
                                        );
                                     })}
                                  </div>
                               </div>

                               {/* Smart Action Bar & Transition Panel */}
                               <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-4">
                                  
                                  {/* Inline form to enter recovery parameters (S -> R) */}
                                  {isActiveTransition && transitionType === 'RECOVERY' && (
                                     <div className="bg-white p-4 rounded-2xl border border-blue-150 shadow-inner space-y-4">
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                           <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Khai báo thông tin Hồi Tỉnh</h4>
                                           <button onClick={() => setTransitionPatient(null)} className="text-slate-400 hover:text-slate-600 text-xs font-black">Hủy</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                           <div>
                                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Bàn mổ số</label>
                                              <select 
                                                 value={transTable} 
                                                 onChange={(e) => setTransTable(parseInt(e.target.value) || e.target.value)}
                                                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500 text-slate-700 cursor-pointer"
                                              >
                                                 {surgeryTables.map((t) => (
                                                    <option key={t.id} value={t.id}>{t.name}</option>
                                                 ))}
                                              </select>
                                           </div>
                                           <div>
                                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Thời gian hồi tỉnh (phút)</label>
                                              <input 
                                                 type="number" 
                                                 min="0" 
                                                 value={transRetTime} 
                                                 onChange={(e) => setTransRetTime(parseInt(e.target.value) || 0)}
                                                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500 text-slate-700"
                                              />
                                           </div>
                                           <div className="col-span-2">
                                              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Thời gian Tỉnh ngủ (Giờ:Phút)</label>
                                              <input 
                                                 type="time" 
                                                 value={transConsciousTime} 
                                                 onChange={(e) => setTransConsciousTime(e.target.value)}
                                                 className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500 text-slate-700"
                                              />
                                           </div>
                                        </div>
                                        <button 
                                           onClick={() => handleUpdateSurgeryStatus(patient.id, 'R', { 
                                              operationTable: transTable, 
                                              retTime: transRetTime, 
                                              consciousTime: getConsciousTimestamp(transConsciousTime) 
                                           })}
                                           className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                        >
                                           Xác nhận chuyển Hồi tỉnh (R)
                                        </button>
                                     </div>
                                  )}

                                  {/* Inline form to choose receive department (R -> F) */}
                                  {isActiveTransition && transitionType === 'FINISHED' && (
                                     <div className="bg-white p-4 rounded-2xl border border-emerald-150 shadow-inner space-y-4">
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                           <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Khai báo Khoa Tiếp Nhận</h4>
                                           <button onClick={() => setTransitionPatient(null)} className="text-slate-400 hover:text-slate-600 text-xs font-black">Hủy</button>
                                        </div>
                                        <div>
                                           <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Chọn khoa điều trị tiếp nhận</label>
                                           <select 
                                              value={transRetDept} 
                                              onChange={(e) => setTransRetDept(e.target.value)}
                                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500 text-slate-700 uppercase"
                                           >
                                              {departments.map(dept => (
                                                 <option key={dept.id} value={dept.id}>{dept.name}</option>
                                              ))}
                                           </select>
                                        </div>
                                        <button 
                                           onClick={() => handleUpdateSurgeryStatus(patient.id, 'F', { 
                                              retDept: transRetDept 
                                           })}
                                           className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                        >
                                           Xác nhận chuyển về khoa (F)
                                        </button>
                                     </div>
                                  )}

                                  {/* Standard action buttons */}
                                  {!isActiveTransition && (
                                     <div className="flex items-center justify-between w-full">
                                        {patient.status === 'P' && (
                                           <button 
                                              onClick={() => handleUpdateSurgeryStatus(patient.id, 'S')}
                                              className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md shadow-rose-500/10 transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.98]"
                                           >
                                              <Play size={14} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                                              Bắt đầu Phẫu thuật (S)
                                           </button>
                                        )}

                                        {patient.status === 'S' && (
                                           <button 
                                              onClick={() => startTransitionToRecovery(patient)}
                                              className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-650 hover:from-blue-600 hover:to-indigo-700 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md shadow-blue-500/10 transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.98]"
                                           >
                                              <Activity size={14} className="group-hover:animate-pulse" />
                                              Chuyển Hồi tỉnh (R)
                                           </button>
                                        )}

                                        {patient.status === 'R' && (
                                           <button 
                                              onClick={() => startTransitionToFinished(patient)}
                                              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md shadow-emerald-500/10 transition-all duration-300 flex items-center justify-center gap-2 group active:scale-[0.98]"
                                           >
                                              <CheckCircle2 size={14} className="group-hover:scale-110 transition-transform" />
                                              Chuyển về Khoa / Hoàn tất (F)
                                           </button>
                                        )}

                                        {patient.status === 'F' && (
                                           <div className="flex-1 py-2.5 bg-emerald-50/50 rounded-2xl flex items-center justify-center gap-2 border border-emerald-100 text-emerald-600 text-xs font-black uppercase tracking-widest">
                                              <CheckCircle2 size={14} />
                                              Đã chuyển về khoa điều trị tiếp nhận
                                           </div>
                                        )}
                                     </div>
                                  )}
                               </div>
                            </div>
                         );
                      })
                   )}
                </div>
             </section>
             
             {/* SURGERY WORKSPACE: RIGHT PANEL */}
             <aside className="w-full md:w-80 lg:w-96 flex flex-col gap-6 shrink-0 pb-20 md:pb-0">
                {/* Search Card */}
                <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-3">
                   <Search size={18} className="text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Tìm kiếm ca mổ / Mã HS..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="flex-1 bg-transparent text-xs font-bold focus:outline-none placeholder:text-slate-300"
                   />
                </div>

                {/* Guidelines Panel */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-650 rounded-[2rem] border border-transparent p-6 text-white flex flex-col gap-4 shadow-lg shadow-blue-500/10">
                   <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-white shrink-0">
                      <Activity size={20} />
                   </div>
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-wider">Hệ thống phòng mổ HIS</h3>
                      <p className="text-[11px] text-blue-100 font-bold uppercase mt-0.5">Điều hành & giám sát trực quan</p>
                   </div>
                   <p className="text-xs text-blue-100 leading-relaxed">
                      Sử dụng cờ <strong className="text-white">Lấy ca mổ HIS (phía trên)</strong> để mở giao diện tra cứu lịch phẫu thuật từ hệ thống HIS và chèn bệnh nhân trực tiếp vào bảng theo dõi.
                   </p>
                   <div className="h-[1px] bg-white/10 my-1"></div>
                   <div className="text-[10px] text-blue-200 leading-snug space-y-1 font-bold">
                      <p>• Trạng thái P: Chuẩn bị ca mổ</p>
                      <p>• Trạng thái S: Đang tiến hành mổ</p>
                      <p>• Trạng thái R: Đang hồi tỉnh sau mổ</p>
                      <p>• Trạng thái F: Hoàn tất bàn giao về khoa</p>
                   </div>
                </div>
             </aside>
          </>
        )}
      </div>

      {/* Cửa sổ Popup Modal Cấu hình ca phẫu thuật */}
      {selectedHisPatient && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] border border-slate-100 w-full max-w-md shadow-2xl overflow-hidden">
               <div className="px-6 py-4 bg-gradient-to-r from-[#00605D] to-[#0c7672] text-white flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                     <Settings size={14} /> Đưa ca mổ vào bảng theo dõi
                  </h3>
                  <button 
                     onClick={() => setSelectedHisPatient(null)} 
                     className="text-white/60 hover:text-white text-xs font-black uppercase"
                  >
                     Đóng
                  </button>
               </div>
               
               <form onSubmit={handleAddFromHis} className="p-6 space-y-5">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Bệnh nhân</p>
                     <p className="text-base font-black text-slate-800 uppercase tracking-tight">{selectedHisPatient.patient_name}</p>
                     <p className="text-[11px] font-mono font-bold text-slate-500 mt-1">HS: {selectedHisPatient.doc_no} | {selectedHisPatient.dept_name || 'HIS'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Phòng mổ</label>
                        <select 
                           value={assignRoom}
                           onChange={(e) => setAssignRoom(e.target.value)}
                           className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-extrabold focus:outline-none focus:border-[#00605D] focus:ring-4 focus:ring-[#00605D]/10 text-slate-800 cursor-pointer transition-all"
                        >
                           {surgeryRooms.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Bàn mổ</label>
                        <select 
                           value={assignTable}
                           onChange={(e) => setAssignTable(parseInt(e.target.value) || e.target.value)}
                           className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-extrabold focus:outline-none focus:border-[#00605D] focus:ring-4 focus:ring-[#00605D]/10 text-slate-800 cursor-pointer transition-all"
                        >
                           {surgeryTables.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                           ))}
                        </select>
                     </div>
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Ngày giờ thực hiện</label>
                     <input 
                        type="datetime-local" 
                        value={assignExpectedTime}
                        onChange={(e) => setAssignExpectedTime(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-extrabold focus:outline-none focus:border-[#00605D] focus:ring-4 focus:ring-[#00605D]/10 text-slate-800 cursor-pointer transition-all"
                     />
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Trạng thái ban đầu</label>
                     <select 
                        value={assignStatus}
                        onChange={(e) => setAssignStatus(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-extrabold focus:outline-none focus:border-[#00605D] focus:ring-4 focus:ring-[#00605D]/10 text-slate-800 cursor-pointer transition-all"
                     >
                        <option value="P">Chuẩn bị (P)</option>
                        <option value="S">Đang mổ (S)</option>
                        <option value="R">Hồi tỉnh (R)</option>
                        <option value="F">Đã về khoa (F)</option>
                     </select>
                  </div>

                  {assignStatus === 'R' && (
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div>
                           <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Số phút hồi tỉnh</label>
                           <input 
                              type="number" 
                              min="0"
                              value={assignRetTime}
                              onChange={(e) => setAssignRetTime(parseInt(e.target.value) || 0)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-blue-500 text-slate-700"
                           />
                        </div>
                        <div>
                           <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Giờ tỉnh ngủ (HH:MM)</label>
                           <input 
                              type="time" 
                              value={assignConsciousTime}
                              onChange={(e) => setAssignConsciousTime(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-blue-500 text-slate-700"
                           />
                        </div>
                     </div>
                  )}

                  {assignStatus === 'F' && (
                     <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Khoa tiếp nhận bàn giao</label>
                        <select 
                           value={assignRetDept}
                           onChange={(e) => setAssignRetDept(e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-[#00605D] text-slate-700 uppercase"
                        >
                           {departments.map(dept => (
                              <option key={dept.id} value={dept.id}>{dept.name}</option>
                           ))}
                        </select>
                     </div>
                  )}

                  <div className="pt-2 flex gap-3">
                     <button 
                        type="button"
                        onClick={() => setSelectedHisPatient(null)}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                     >
                        Hủy
                     </button>
                     <button 
                        type="submit" 
                        disabled={loading}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/10 active:scale-95 transition-all"
                     >
                        {loading ? 'Đang thực hiện...' : 'Xác nhận'}
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </>
  );
};
