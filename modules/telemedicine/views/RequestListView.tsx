
import React, { useState } from 'react';
import { mockTeleRequests } from '../data';
import { SearchIcon, PlusIcon, VideoCameraIcon, DocumentTextIcon, UserGroupIcon } from '../../../components/Icons';
import { useNavigate } from 'react-router-dom';

const RequestListView: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = mockTeleRequests.filter(r => 
        r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Danh sách Yêu cầu Hội chẩn</h1>
                <div className="flex gap-2">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 p-2 border rounded-lg text-sm bg-white dark:bg-slate-800 dark:border-slate-600 w-64"
                        />
                    </div>
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700">
                        <PlusIcon className="w-4 h-4"/> Tạo yêu cầu
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden">
                <div className="overflow-auto h-full">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4">Mã YC</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4">Chuyên khoa</th>
                                <th className="p-4">Thời gian</th>
                                <th className="p-4">Bác sĩ yêu cầu</th>
                                <th className="p-4">Chuyên gia</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filtered.map(req => (
                                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    <td className="p-4 font-mono text-indigo-600">{req.id}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{req.patientName}</div>
                                        <div className="text-xs text-slate-500">{req.gender}, {req.age}T</div>
                                    </td>
                                    <td className="p-4">{req.specialty}</td>
                                    <td className="p-4 font-medium">{req.scheduledTime}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">
                                        <div className="flex items-center gap-1"><UserGroupIcon className="w-3 h-3"/> {req.requester}</div>
                                        <div className="text-xs text-slate-400">{req.hospital}</div>
                                    </td>
                                    <td className="p-4 font-bold text-indigo-700 dark:text-indigo-300">{req.consultant}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                            req.status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 
                                            req.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition" title="Xem hồ sơ">
                                                <DocumentTextIcon className="w-4 h-4"/>
                                            </button>
                                            {req.status === 'scheduled' && (
                                                <button 
                                                    onClick={() => navigate('/telemedicine/live')}
                                                    className="p-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm transition" 
                                                    title="Vào phòng họp"
                                                >
                                                    <VideoCameraIcon className="w-4 h-4"/>
                                                </button>
                                            )}
                                        </div>
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

export default RequestListView;
