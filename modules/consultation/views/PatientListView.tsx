
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, UserGroupIcon, ClockIcon, CheckIcon, PlayIcon, MegaphoneIcon } from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSession } from '../../../contexts/SessionContext';
import { consultationService } from '../../../services/consultationService';
import { useNotification } from '../../../contexts/NotificationContext';

interface QueuePatient {
    id: string;
    name: string;
    age: number;
    gender: string;
    reason: string;
    status: string;
    arrivalTime: string;
    priority: string;
    docNo: string;
    patientNo: string;
    receptIdx: number;
    roomId: number;
}

const PatientListView: React.FC = () => {
  const navigate = useNavigate();
  const { fontSettings } = useTheme();
  const { hasPermission } = useSession();
  const { addNotification } = useNotification();
  
  const [activeTab, setActiveTab] = useState<'waiting' | 'processing' | 'completed'>('waiting');
  const [timePeriod, setTimePeriod] = useState<'1' | '2' | '3'>('1');
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDept, setSelectedDept] = useState<string>('KB');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [isOutpatient, setIsOutpatient] = useState(false);
  const [isChronic, setIsChronic] = useState(false);
  const [rooms, setRooms] = useState<{id: number, name: string}[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<QueuePatient[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [counts, setCounts] = useState({ waiting: 0, processing: 0, completed: 0 });

  useEffect(() => {
     const fetchRooms = async () => {
         try {
             const response = await consultationService.getRooms();
             if (response.success) {
                 setRooms(response.data || []);
             }
         } catch (error) {
             console.error("Error fetching rooms:", error);
         }
     };
     fetchRooms();
  }, []);

  const loadQueue = async (currentTab = activeTab, currentTimePeriod = timePeriod) => {
      setIsLoading(true);
      try {
          const response = await consultationService.getExamQueue({
              status: currentTab,
              timePeriod: currentTimePeriod,
              fromDate,
              toDate,
              deptId: selectedDept,
              roomId: selectedRoom ? parseInt(selectedRoom) : undefined,
              isOutpatient,
              isChronic
          });
          if (response.success) {
              const data = response.data || [];
              setPatients(data);
              // Update count for current tab
              setCounts(prev => ({ ...prev, [currentTab]: data.length }));
          }
      } catch (error) {
          console.error("Error loading queue:", error);
          if (addNotification) {
              addNotification("Lỗi", "Không thể tải danh sách hàng đợi", "error");
          }
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
      loadQueue(activeTab, timePeriod);
      // Periodically refresh waiting tab if it's active
      const timer = setInterval(() => {
          if (!isLoading) loadQueue(activeTab, timePeriod);
      }, 30000); // 30s
      return () => clearInterval(timer);
  }, [activeTab, timePeriod, fromDate, toDate, selectedDept, selectedRoom, isOutpatient, isChronic]);

  const filteredList = useMemo(() => {
    return patients.filter(patient => {
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (patient.patientNo && patient.patientNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            patient.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [patients, searchTerm]);

  const handleStartExam = (patient: QueuePatient) => {
    // Navigate to the exam recording view for this patient with context
    navigate(`/consultation/record/${patient.id}?docNo=${patient.docNo}&receptIdx=${patient.receptIdx}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Chờ khám</span>;
      case 'processing': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Đang khám</span>;
      case 'completed': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Đã xong</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
      if (priority === 'Emergency') return <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-red-100 text-red-600 border border-red-200">Cấp cứu</span>;
      if (priority === 'High') return <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-orange-100 text-orange-600 border border-orange-200">Ưu tiên</span>;
      return null;
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Danh sách khám bệnh</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý hàng đợi và trạng thái bệnh nhân.</p>
        </div>
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 w-full">
            {/* Date Range */}
            <div className="flex items-center gap-2">
                <input 
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className={`p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary ${fontSettings.controls}`}
                />
                <span className="text-slate-400">→</span>
                <input 
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className={`p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary ${fontSettings.controls}`}
                />
            </div>

            {/* Department Filter (For Testing) */}
            <div className="min-w-[120px]">
                <select 
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary ${fontSettings.controls}`}
                >
                    <option value="ALL">Tất cả khoa</option>
                    <option value="KB">Khoa Khám bệnh</option>
                    <option value="NOI1">Khoa Nội 1</option>
                    <option value="NOI2">Khoa Nội 2</option>
                </select>
            </div>

            {/* Room Filter */}
            <div className="min-w-[200px] flex-1">
                <select 
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary ${fontSettings.controls}`}
                >
                    <option value="">-- Tất cả phòng khám --</option>
                    {rooms.map(room => (
                        <option key={room.id} value={room.id}>{room.id} - {room.name}</option>
                    ))}
                </select>
            </div>

            <div className="flex items-center gap-4 px-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                        type="checkbox"
                        checked={isOutpatient}
                        onChange={(e) => setIsOutpatient(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">Điều trị ngoại trú</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                        type="checkbox"
                        checked={isChronic}
                        onChange={(e) => setIsChronic(e.target.checked)}
                        className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">Điều trị mãn tính</span>
                </label>
            </div>

            {/* Time Period Buttons (Legacy HMS style) */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button 
                    onClick={() => setTimePeriod('1')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timePeriod === '1' ? 'bg-white dark:bg-slate-600 text-primary shadow-sm border border-slate-200 dark:border-slate-500' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Cả ngày
                </button>
                <button 
                    onClick={() => setTimePeriod('2')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timePeriod === '2' ? 'bg-white dark:bg-slate-600 text-primary shadow-sm border border-slate-200 dark:border-slate-500' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Sáng
                </button>
                <button 
                    onClick={() => setTimePeriod('3')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${timePeriod === '3' ? 'bg-white dark:bg-slate-600 text-primary shadow-sm border border-slate-200 dark:border-slate-500' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Chiều
                </button>
            </div>

            {/* Refresh Button (HMS "Nạp") */}
            <button 
                onClick={() => loadQueue()}
                disabled={isLoading}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm flex items-center gap-2 text-sm font-bold active:scale-95 px-4 disabled:opacity-50"
                title="Làm mới danh sách"
            >
                <MegaphoneIcon className={`w-4 h-4 rotate-180 ${isLoading ? 'animate-spin' : ''}`} />
                Nạp
            </button>

            {/* Search Bar */}
            <div className="relative min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 h-4 text-slate-400" />
                </div>
                <input
                    type="text"
                    className={`block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition duration-150 ease-in-out ${fontSettings.controls}`}
                    placeholder="Tìm tên hoặc mã BN..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
      </div>

      {/* Tabs & Content Area */}
      <div className="flex-1 bg-surface dark:bg-dark-surface rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 flex flex-col overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
                onClick={() => setActiveTab('waiting')}
                className={`flex-1 py-4 font-medium text-center transition-colors relative ${fontSettings.controls} ${
                    activeTab === 'waiting' 
                    ? 'text-primary dark:text-dark-primary' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
                <div className="flex items-center justify-center gap-2">
                    <ClockIcon className="w-5 h-5" />
                    <span>Chờ khám</span>
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs">
                        {counts.waiting}
                    </span>
                </div>
                {activeTab === 'waiting' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary dark:bg-dark-primary"></div>}
            </button>
            <button
                onClick={() => setActiveTab('processing')}
                className={`flex-1 py-4 font-medium text-center transition-colors relative ${fontSettings.controls} ${
                    activeTab === 'processing' 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
                <div className="flex items-center justify-center gap-2">
                    <UserGroupIcon className="w-5 h-5" />
                    <span>Đang khám</span>
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs">
                        {counts.processing}
                    </span>
                </div>
                {activeTab === 'processing' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>}
            </button>
            <button
                onClick={() => setActiveTab('completed')}
                className={`flex-1 py-4 font-medium text-center transition-colors relative ${fontSettings.controls} ${
                    activeTab === 'completed' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
                <div className="flex items-center justify-center gap-2">
                    <CheckIcon className="w-5 h-5" />
                    <span>Hoàn tất</span>
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs">
                        {counts.completed}
                    </span>
                </div>
                {activeTab === 'completed' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 dark:bg-green-400"></div>}
            </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-0 relative">
            {isLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 flex items-center justify-center z-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            )}
            <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                    <tr>
                        <th className="p-4 border-b border-slate-200 dark:border-slate-700">Mã BN</th>
                        <th className="p-4 border-b border-slate-200 dark:border-slate-700">Họ tên</th>
                        <th className="p-4 border-b border-slate-200 dark:border-slate-700">Tuổi/Giới</th>
                        <th className="p-4 border-b border-slate-200 dark:border-slate-700">Giờ đến</th>
                        <th className="p-4 border-b border-slate-200 dark:border-slate-700">Lý do khám</th>
                        <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-center">Trạng thái</th>
                        <th className="p-4 border-b border-slate-200 dark:border-slate-700 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {filteredList.length > 0 ? (
                        filteredList.map((patient) => (
                            <tr 
                                key={patient.docNo} 
                                className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                                onClick={() => handleStartExam(patient)}
                            >
                                <td className="p-4 font-mono text-sm text-blue-600 dark:text-blue-400 font-bold">{patient.id}</td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{patient.name}</span>
                                        {getPriorityBadge(patient.priority)}
                                    </div>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-300">{patient.age}t / {patient.gender}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-300 font-mono">{patient.arrivalTime}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={patient.reason}>{patient.reason}</td>
                                <td className="p-4 text-center">
                                    {getStatusBadge(patient.status)}
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                    {patient.status === 'waiting' && hasPermission('02.06') && (
                                        <button 
                                            className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors"
                                            title="Gọi số"
                                            onClick={(e) => { e.stopPropagation(); /* Call logic */ }}
                                        >
                                            <MegaphoneIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                    {patient.status === 'waiting' ? (
                                        hasPermission('02.01') && (
                                            <button 
                                                onClick={() => handleStartExam(patient)}
                                                className="inline-flex items-center px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                                            >
                                                <PlayIcon className="w-3 h-3 mr-1.5" />
                                                Khám ngay
                                            </button>
                                        )
                                    ) : (
                                        hasPermission('02.05') && (
                                            <button 
                                                onClick={() => handleStartExam(patient)}
                                                className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-md transition-colors"
                                            >
                                                Xem hồ sơ
                                            </button>
                                        )
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                Không tìm thấy bệnh nhân nào trong danh sách này.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default PatientListView;
