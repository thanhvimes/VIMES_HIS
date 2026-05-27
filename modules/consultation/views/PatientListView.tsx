
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ColumnDef } from '@tanstack/react-table';
import { 
    SearchIcon, 
    UserGroupIcon, 
    ClockIcon, 
    CheckIcon, 
    PlayIcon, 
    MegaphoneIcon,
    ArrowPathIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSession } from '../../../contexts/SessionContext';
import { consultationService } from '../../../services/consultationService';
import { useNotification } from '../../../contexts/NotificationContext';

// Import UI Components chuẩn
import { DataTable } from '../../../components/ui/DataTable';
import Combobox from '../../../components/ui/Combobox';
import { FormDateInput, FormSelect } from '../../../components/ui/forms';

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
      const timer = setInterval(() => {
          if (!isLoading) loadQueue(activeTab, timePeriod);
      }, 30000);
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
    navigate(`/consultation/record/${patient.id}?docNo=${patient.docNo}&receptIdx=${patient.receptIdx}&tab=examine`);
  };

  // Badge Renders
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting': return <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Chờ khám</span>;
      case 'processing': return <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">Đang khám</span>;
      case 'completed': return <span className="px-2.5 py-1 text-[11px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">Đã xong</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
      if (priority === 'Emergency') return <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tighter rounded bg-red-600 text-white shadow-sm ml-2">Cấp cứu</span>;
      if (priority === 'High') return <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tighter rounded bg-orange-500 text-white shadow-sm ml-2">Ưu tiên</span>;
      return null;
  };

  // DataTable Columns Configuration
  const columns: ColumnDef<QueuePatient>[] = [
    {
      accessorKey: 'id',
      header: 'Mã BN',
      cell: ({ row }) => <span className="font-mono text-sm text-blue-600 dark:text-blue-400 font-bold">{row.original.id}</span>
    },
    {
      accessorKey: 'name',
      header: 'Họ và tên',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center">
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">{row.original.name}</span>
            {getPriorityBadge(row.original.priority)}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">HS: {row.original.patientNo}</span>
        </div>
      )
    },
    {
      header: 'Tuổi / Giới',
      cell: ({ row }) => <span className="text-sm">{row.original.age}t / {row.original.gender}</span>
    },
    {
      accessorKey: 'arrivalTime',
      header: 'Giờ đến',
      cell: ({ row }) => <span className="font-mono text-sm text-slate-600 dark:text-slate-400">{row.original.arrivalTime}</span>
    },
    {
      accessorKey: 'reason',
      header: 'Lý do khám',
      cell: ({ row }) => <div className="max-w-[200px] truncate text-sm italic text-slate-600 dark:text-slate-400" title={row.original.reason}>{row.original.reason}</div>
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center">Trạng thái</div>,
      cell: ({ row }) => <div className="text-center">{getStatusBadge(row.original.status)}</div>
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Hành động</div>,
      cell: ({ row }) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {row.original.status === 'waiting' && hasPermission('02.06') && (
                <button 
                    className="p-1.5 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-md transition-colors"
                    title="Gọi số"
                    onClick={(e) => { e.stopPropagation(); /* Logic gọi số */ }}
                >
                    <MegaphoneIcon className="w-5 h-5" />
                </button>
            )}
            {row.original.status === 'waiting' ? (
                hasPermission('02.01') && (
                    <button 
                        onClick={() => handleStartExam(row.original)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold uppercase rounded-md transition-all shadow-sm active:scale-95"
                    >
                        <PlayIcon className="w-3 h-3 mr-1.5" />
                        Khám ngay
                    </button>
                )
            ) : (
                hasPermission('02.05') && (
                    <button 
                        onClick={() => handleStartExam(row.original)}
                        className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase rounded-md transition-all active:scale-95"
                    >
                        Hồ sơ
                    </button>
                )
            )}
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col h-full space-y-4 animate-fade-in">
      {/* HEADER AREA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6 text-primary"/>
                Danh sách chờ khám bệnh
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Quản lý luồng bệnh nhân và điều phối phòng khám.</p>
        </div>
        
        {/* Quick Refresh & Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
             <div className="relative flex-1 sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-slate-400" />
                </div>
                <input
                    type="text"
                    className={`block w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-900 placeholder-slate-500 focus:ring-2 focus:ring-primary transition-all ${fontSettings.controls}`}
                    placeholder="Tên, mã BN, hồ sơ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={() => loadQueue()}
                disabled={isLoading}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md flex items-center gap-2 text-xs font-bold active:scale-95 px-4 disabled:opacity-50"
            >
                <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Nạp (F5)
            </button>
        </div>
      </div>

      {/* FILTER BAR - Professional Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            {/* Date Range */}
            <div className="md:col-span-3 grid grid-cols-2 gap-2">
                <FormDateInput 
                    label="Từ ngày"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                />
                <FormDateInput 
                    label="Đến ngày"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                />
            </div>

            {/* Department */}
            <div className="md:col-span-2">
                <FormSelect 
                    label="Khoa khám"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                >
                    <option value="ALL">Tất cả khoa</option>
                    <option value="KB">Khoa Khám bệnh</option>
                    <option value="NOI1">Khoa Nội 1</option>
                    <option value="NOI2">Khoa Nội 2</option>
                </FormSelect>
            </div>

            {/* Room - Using Combobox */}
            <div className="md:col-span-4">
                <Combobox<{id: number, name: string}>
                    label="Phòng khám"
                    value={selectedRoom}
                    onChange={(val) => setSelectedRoom(val)}
                    options={rooms}
                    placeholder="-- Chọn tất cả phòng --"
                    displayValue={(item) => `${item.id} - ${item.name}`}
                />
            </div>

            {/* Treatment Flags */}
            <div className="md:col-span-3 flex flex-col justify-center gap-2 pt-5">
                <div className="flex items-center gap-4 px-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="checkbox"
                            checked={isOutpatient}
                            onChange={(e) => setIsOutpatient(e.target.checked)}
                            className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary">Ngoại trú</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input 
                            type="checkbox"
                            checked={isChronic}
                            onChange={(e) => setIsChronic(e.target.checked)}
                            className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                        />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-primary">Mãn tính</span>
                    </label>
                </div>
                
                {/* Time Period Buttons */}
                <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    <button 
                        onClick={() => setTimePeriod('1')}
                        className={`flex-1 py-1 text-[10px] font-black uppercase rounded transition-all ${timePeriod === '1' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Cả ngày
                    </button>
                    <button 
                        onClick={() => setTimePeriod('2')}
                        className={`flex-1 py-1 text-[10px] font-black uppercase rounded transition-all ${timePeriod === '2' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Sáng
                    </button>
                    <button 
                        onClick={() => setTimePeriod('3')}
                        className={`flex-1 py-1 text-[10px] font-black uppercase rounded transition-all ${timePeriod === '3' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Chiều
                    </button>
                </div>
            </div>
      </div>

      {/* CONTENT AREA - Tabs & DataTable */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
            {[
                { id: 'waiting', label: 'Chờ khám', icon: ClockIcon, count: counts.waiting, color: 'amber' },
                { id: 'processing', label: 'Đang khám', icon: UserGroupIcon, count: counts.processing, color: 'blue' },
                { id: 'completed', label: 'Hoàn tất', icon: CheckIcon, count: counts.completed, color: 'emerald' }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 py-3.5 font-bold text-center transition-all relative ${
                        activeTab === tab.id 
                        ? `text-${tab.color}-600 dark:text-${tab.color}-400 bg-white dark:bg-slate-800` 
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                    }`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <tab.icon className="w-5 h-5" />
                        <span className="text-sm uppercase tracking-wide">{tab.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            activeTab === tab.id 
                            ? `bg-${tab.color}-100 text-${tab.color}-700 dark:bg-${tab.color}-900/40` 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                            {tab.count}
                        </span>
                    </div>
                    {activeTab === tab.id && <div className={`absolute bottom-0 left-0 w-full h-1 bg-${tab.color}-500 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]`}></div>}
                </button>
            ))}
        </div>

        {/* Data Table Area */}
        <div className="flex-1 p-4 overflow-auto">
            <DataTable 
                columns={columns}
                data={filteredList}
            />
        </div>
      </div>
    </div>
  );
};

export default PatientListView;
