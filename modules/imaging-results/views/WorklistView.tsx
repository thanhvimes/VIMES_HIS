
import React, { useState } from 'react';
import { mockRequests, ImagingRequest } from '../data';
import { SearchIcon, CheckIcon, PlayIcon, ClockIcon, UserGroupIcon } from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

const WorklistView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [requests, setRequests] = useState<ImagingRequest[]>(mockRequests);
    const [filter, setFilter] = useState<'All' | 'Scheduled' | 'Processing'>('All');
    const [searchTerm, setSearchTerm] = useState('');

    const handleStatusChange = (id: string, newStatus: ImagingRequest['status']) => {
        setRequests(prev => prev.map(req => 
            req.id === id ? { ...req, status: newStatus } : req
        ));
    };

    const filteredRequests = requests.filter(req => {
        const matchesFilter = filter === 'All' || 
                              (filter === 'Scheduled' && req.status === 'Scheduled') ||
                              (filter === 'Processing' && req.status === 'Processing');
        const matchesSearch = req.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              req.id.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getPriorityClass = (priority: string) => priority === 'Urgent' ? 'text-red-600 bg-red-50 border-red-200' : 'text-slate-600 bg-slate-50 border-slate-200';

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Danh sách chụp (Worklist)</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý hàng đợi chụp chiếu tại các phòng.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative w-64">
                        <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm BN, Mã chỉ định..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                        />
                    </div>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-fit">
                {['All', 'Scheduled', 'Processing'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab as any)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            filter === tab 
                            ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                        }`}
                    >
                        {tab === 'All' ? 'Tất cả' : tab === 'Scheduled' ? 'Chờ chụp' : 'Đang thực hiện'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className={`w-full text-left ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0">
                            <tr>
                                <th className="p-4 w-24">Mã CĐ</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4">Dịch vụ / Bộ phận</th>
                                <th className="p-4">Phòng chụp</th>
                                <th className="p-4">Ưu tiên</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredRequests.map(req => (
                                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 font-mono text-blue-600 dark:text-blue-400 font-medium">{req.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{req.patientName}</div>
                                        <div className="text-xs text-slate-500">{req.gender}, {req.age} tuổi</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-slate-800 dark:text-slate-200 font-medium">{req.serviceName}</div>
                                        <div className="text-xs text-slate-500">{req.modality} - {req.bodyPart}</div>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">{req.room || 'Chưa gán'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded border text-xs font-bold uppercase ${getPriorityClass(req.priority)}`}>
                                            {req.priority === 'Urgent' ? 'Cấp cứu' : 'Thường'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {req.status === 'Scheduled' && <span className="text-slate-500 font-medium">Chờ chụp</span>}
                                        {req.status === 'Processing' && <span className="text-blue-600 font-medium animate-pulse">Đang chụp</span>}
                                        {req.status === 'Acquired' && <span className="text-green-600 font-medium">Đã có hình</span>}
                                        {(req.status === 'Reported' || req.status === 'Approved') && <span className="text-purple-600 font-medium">Đã xong</span>}
                                    </td>
                                    <td className="p-4 text-right">
                                        {req.status === 'Scheduled' && (
                                            <button 
                                                onClick={() => handleStatusChange(req.id, 'Processing')}
                                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded shadow transition"
                                            >
                                                <PlayIcon className="w-3 h-3 mr-1"/> Bắt đầu
                                            </button>
                                        )}
                                        {req.status === 'Processing' && (
                                            <button 
                                                onClick={() => handleStatusChange(req.id, 'Acquired')}
                                                className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow transition"
                                            >
                                                <CheckIcon className="w-3 h-3 mr-1"/> Hoàn tất
                                            </button>
                                        )}
                                        {['Acquired', 'Reported', 'Approved'].includes(req.status) && (
                                            <span className="text-xs text-slate-400 italic">Chờ đọc KQ</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default WorklistView;
