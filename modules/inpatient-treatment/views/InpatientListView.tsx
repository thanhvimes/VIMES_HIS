
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, UserGroupIcon, ClockIcon, CheckIcon, HospitalIcon } from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

// Mock data specific for Inpatient List
const mockInpatientList = [
  { id: 'P003', name: 'Lê Hoàng Cường', age: 45, gender: 'Nam', diagnosis: 'Viêm phổi', room: '301', bed: '02', status: 'admitted', admissionDate: '15/11/2023' },
  { id: 'P004', name: 'Phạm Thị Dung', age: 22, gender: 'Nữ', diagnosis: 'Viêm ruột thừa cấp', room: '302', bed: '01', status: 'admitted', admissionDate: '16/11/2023' },
  { id: 'P001', name: 'Nguyễn Văn An', age: 35, gender: 'Nam', diagnosis: 'Sốt xuất huyết', room: '301', bed: '01', status: 'discharged', admissionDate: '10/11/2023' },
  { id: 'P005', name: 'Hoàng Văn Em', age: 12, gender: 'Nam', diagnosis: 'Viêm phế quản', room: '303', bed: '05', status: 'admitted', admissionDate: '17/11/2023' },
];

const InpatientListView: React.FC = () => {
  const navigate = useNavigate();
  const { fontSettings } = useTheme();
  const [activeTab, setActiveTab] = useState<'admitted' | 'discharged'>('admitted');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredList = useMemo(() => {
    return mockInpatientList.filter(patient => {
      const matchesTab = patient.status === activeTab;
      const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            patient.room.includes(searchTerm);
      return matchesTab && matchesSearch;
    });
  }, [activeTab, searchTerm]);

  const handleOpenRecord = (patientId: string) => {
    navigate(`/inpatient-treatment/record/${patientId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'admitted': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">Đang điều trị</span>;
      case 'discharged': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Đã xuất viện</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Danh sách nội trú</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý bệnh nhân tại khoa phòng.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
                type="text"
                className={`block w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-700 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-150 ease-in-out ${fontSettings.controls}`}
                placeholder="Tìm tên, mã BN, số phòng..."
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
                onClick={() => setActiveTab('admitted')}
                className={`flex-1 py-4 font-medium text-center transition-colors relative ${fontSettings.controls} ${
                    activeTab === 'admitted' 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
                <div className="flex items-center justify-center gap-2">
                    <HospitalIcon className="w-5 h-5" />
                    <span>Đang điều trị</span>
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs">
                        {mockInpatientList.filter(p => p.status === 'admitted').length}
                    </span>
                </div>
                {activeTab === 'admitted' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 dark:bg-indigo-400"></div>}
            </button>
            <button
                onClick={() => setActiveTab('discharged')}
                className={`flex-1 py-4 font-medium text-center transition-colors relative ${fontSettings.controls} ${
                    activeTab === 'discharged' 
                    ? 'text-gray-600 dark:text-gray-400' 
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
                <div className="flex items-center justify-center gap-2">
                    <CheckIcon className="w-5 h-5" />
                    <span>Đã xuất viện</span>
                    <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs">
                        {mockInpatientList.filter(p => p.status === 'discharged').length}
                    </span>
                </div>
                {activeTab === 'discharged' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gray-600 dark:bg-gray-400"></div>}
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
                        <th className="p-4">Phòng / Giường</th>
                        <th className="p-4">Chẩn đoán</th>
                        <th className="p-4">Ngày nhập</th>
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
                                        <span className="font-bold text-slate-900 dark:text-white">{patient.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-300">{patient.age}t / {patient.gender}</td>
                                <td className="p-4">
                                    <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-1 rounded font-mono text-xs font-bold">
                                        P.{patient.room} - G.{patient.bed}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={patient.diagnosis}>{patient.diagnosis}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-300">{patient.admissionDate}</td>
                                <td className="p-4 text-center">
                                    {getStatusBadge(patient.status)}
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleOpenRecord(patient.id)}
                                        className="inline-flex items-center px-3 py-1.5 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium rounded-md transition-colors"
                                    >
                                        Hồ sơ bệnh án
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400">
                                Không tìm thấy bệnh nhân nào.
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

export default InpatientListView;
