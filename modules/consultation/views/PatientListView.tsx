
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, UserGroupIcon, ClockIcon, CheckIcon, PlayIcon } from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock data specific for Consultation List
const mockConsultationList = [
  { id: 'P001', name: 'Nguyễn Văn An', age: 35, gender: 'Nam', reason: 'Khám tổng quát', status: 'waiting', arrivalTime: '08:30', priority: 'Normal' },
  { id: 'P004', name: 'Phạm Thị Dung', age: 22, gender: 'Nữ', reason: 'Tái khám', status: 'waiting', arrivalTime: '09:00', priority: 'High' },
  { id: 'P003', name: 'Lê Hoàng Cường', age: 45, gender: 'Nam', reason: 'Đau đầu, chóng mặt', status: 'processing', arrivalTime: '09:15', priority: 'Normal' },
  { id: 'P002', name: 'Trần Thị Bích', age: 31, gender: 'Nữ', reason: 'Đau bụng', status: 'completed', arrivalTime: '07:45', priority: 'Normal' },
  { id: 'P005', name: 'Hoàng Văn Em', age: 12, gender: 'Nam', reason: 'Sốt cao', status: 'waiting', arrivalTime: '10:00', priority: 'Emergency' },
];

const PatientListView: React.FC = () => {
  const navigate = useNavigate();
  const { fontSettings } = useTheme();
  const [activeTab, setActiveTab] = useState<'waiting' | 'processing' | 'completed'>('waiting');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredList = useMemo(() => {
    return mockConsultationList.filter(patient => {
      const matchesTab = patient.status === activeTab;
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            patient.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchTerm]);

  const handleStartExam = (patientId: string) => {
    // Navigate to the exam recording view for this patient
    // This matches the route /consultation/record/:patientId
    navigate(`/consultation/record/${patientId}`);
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
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
                type="text"
                className={`block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition duration-150 ease-in-out ${fontSettings.controls}`}
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
                        {mockConsultationList.filter(p => p.status === 'waiting').length}
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
                        {mockConsultationList.filter(p => p.status === 'processing').length}
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
                        {mockConsultationList.filter(p => p.status === 'completed').length}
                    </span>
                </div>
                {activeTab === 'completed' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-green-600 dark:bg-green-400"></div>}
            </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-0">
            <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold">
                    <tr>
                        <th className="p-4">Mã BN</th>
                        <th className="p-4">Họ tên</th>
                        <th className="p-4">Tuổi/Giới</th>
                        <th className="p-4">Giờ đến</th>
                        <th className="p-4">Lý do khám</th>
                        <th className="p-4 text-center">Trạng thái</th>
                        <th className="p-4 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredList.length > 0 ? (
                        filteredList.map((patient) => (
                            <tr key={patient.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 font-mono text-slate-600 dark:text-slate-300">{patient.id}</td>
                                <td className="p-4">
                                    <div className="flex items-center">
                                        <span className="font-medium text-slate-900 dark:text-white">{patient.name}</span>
                                        {getPriorityBadge(patient.priority)}
                                    </div>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-300">{patient.age}t / {patient.gender}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-300 font-mono">{patient.arrivalTime}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={patient.reason}>{patient.reason}</td>
                                <td className="p-4 text-center">
                                    {getStatusBadge(patient.status)}
                                </td>
                                <td className="p-4 text-right">
                                    {patient.status === 'waiting' ? (
                                        <button 
                                            onClick={() => handleStartExam(patient.id)}
                                            className="inline-flex items-center px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded-md transition-colors shadow-sm"
                                        >
                                            <PlayIcon className="w-3 h-3 mr-1.5" />
                                            Khám ngay
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => handleStartExam(patient.id)}
                                            className="inline-flex items-center px-3 py-1.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-md transition-colors"
                                        >
                                            Xem hồ sơ
                                        </button>
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
