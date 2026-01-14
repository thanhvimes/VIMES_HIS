
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockRequests, ImagingRequest } from '../data';
import { 
    SearchIcon, 
    PlayIcon, 
    ClockIcon, 
    UserGroupIcon, 
    PhotographIcon, 
    ActivityIcon,
    ScannerIcon,
    DocumentTextIcon,
    FilterIcon,
    ExclamationCircleIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

const WorklistView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [modalityFilter, setModalityFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('Acquired'); // Mặc định hiện những ca đã có ảnh

    const filteredRequests = useMemo(() => {
        return mockRequests.filter(req => {
            const matchesSearch = req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  req.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesModality = modalityFilter === 'All' || req.modality === modalityFilter;
            const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
            
            return matchesSearch && matchesModality && matchesStatus;
        }).sort((a, b) => {
            // Ưu tiên cấp cứu lên đầu
            if (a.priority === 'Urgent' && b.priority !== 'Urgent') return -1;
            if (a.priority !== 'Urgent' && b.priority === 'Urgent') return 1;
            return b.requestDate.localeCompare(a.requestDate);
        });
    }, [searchTerm, modalityFilter, statusFilter]);

    const handleOpenReading = (requestId: string) => {
        navigate(`/imaging-results/reading/${requestId}`);
    };

    const getModalityColor = (m: string) => {
        switch(m) {
            case 'CT': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'MRI': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Ultrasound': return 'bg-pink-100 text-pink-700 border-pink-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* Header & Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/20">
                        <ScannerIcon className="w-6 h-6"/>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Danh sách chờ đọc KQ</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">PACS Worklist • Live</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm BN, mã chỉ định..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-purple-500 outline-none ${fontSettings.controls}`}
                        />
                    </div>
                    <select 
                        value={modalityFilter}
                        onChange={e => setModalityFilter(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold"
                    >
                        <option value="All">Tất cả loại máy</option>
                        <option value="X-Ray">X-Quang</option>
                        <option value="CT">CT Scanner</option>
                        <option value="MRI">MRI</option>
                        <option value="Ultrasound">Siêu âm</option>
                    </select>
                </div>
            </div>

            {/* Main Table Content */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4 w-12 text-center">STT</th>
                                <th className="p-4">Chỉ định / Thời gian</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4">Nội dung khảo sát</th>
                                <th className="p-4 text-center">Mức độ</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredRequests.length === 0 ? (
                                <tr><td colSpan={7} className="p-20 text-center text-slate-400 italic font-bold">Không có chỉ định nào đang chờ.</td></tr>
                            ) : (
                                filteredRequests.map((req, idx) => (
                                    <tr 
                                        key={req.id} 
                                        onClick={() => handleOpenReading(req.id)}
                                        className={`hover:bg-purple-50/40 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer ${req.priority === 'Urgent' ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
                                    >
                                        <td className="p-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase border ${getModalityColor(req.modality)}`}>
                                                    {req.modality}
                                                </span>
                                                <span className="font-bold text-slate-700 dark:text-slate-200">{req.id}</span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-1 font-bold">
                                                <ClockIcon className="w-3 h-3"/> {req.requestDate}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-black text-slate-800 dark:text-white uppercase text-sm">{req.patientName}</div>
                                            <div className="text-xs text-slate-500 mt-0.5">{req.gender}, {req.age}T • ID: {req.patientId}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700 dark:text-slate-200 text-sm">{req.serviceName}</div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{req.bodyPart}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {req.priority === 'Urgent' ? (
                                                <span className="px-2 py-1 bg-red-600 text-white text-[10px] font-black rounded uppercase animate-pulse shadow-sm">Cấp cứu</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Thường</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${
                                                req.status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                                req.status === 'Acquired' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                'bg-orange-100 text-orange-700 border-orange-200'
                                            }`}>
                                                {req.status === 'Acquired' ? 'Đã có ảnh' : req.status === 'Approved' ? 'Đã duyệt' : 'Chờ chụp'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-1">
                                                <button className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-[10px] uppercase shadow-md flex items-center gap-1 transition transform active:scale-95">
                                                    <PlayIcon className="w-3 h-3"/> Đọc KQ
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer Stats */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">
                    <div className="flex gap-4">
                        <span>Tổng số: {filteredRequests.length} ca</span>
                        <span className="text-red-500">Cấp cứu: {filteredRequests.filter(r => r.priority === 'Urgent').length}</span>
                        <span className="text-blue-600">Đã chụp: {filteredRequests.filter(r => r.status === 'Acquired').length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WorklistView;
