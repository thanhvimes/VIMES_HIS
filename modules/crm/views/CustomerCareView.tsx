
import React, { useState } from 'react';
import { mockTickets } from '../data';
import { SearchIcon, CheckCircleIcon, ExclamationCircleIcon, ClockIcon } from '../../../components/Icons';
import { TicketIcon } from '../icons';

const CustomerCareView: React.FC = () => {
    const [tickets, setTickets] = useState(mockTickets);
    const [statusFilter, setStatusFilter] = useState('All');

    const getPriorityColor = (p: string) => {
        if (p === 'High') return 'text-red-600 bg-red-100 border-red-200';
        if (p === 'Medium') return 'text-orange-600 bg-orange-100 border-orange-200';
        return 'text-green-600 bg-green-100 border-green-200';
    };

    const getStatusIcon = (s: string) => {
        if (s === 'Resolved') return <CheckCircleIcon className="w-5 h-5 text-green-500"/>;
        if (s === 'In Progress') return <ClockIcon className="w-5 h-5 text-blue-500"/>;
        return <ExclamationCircleIcon className="w-5 h-5 text-slate-400"/>;
    };

    const filteredTickets = tickets.filter(t => statusFilter === 'All' || t.status === statusFilter);

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <TicketIcon className="w-8 h-8 text-indigo-600"/> CSKH & Hỗ trợ
                </h1>
                <div className="flex gap-2">
                    {['All', 'Open', 'In Progress', 'Resolved'].map(status => (
                        <button 
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition ${statusFilter === status ? 'bg-indigo-600 text-white shadow' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}
                        >
                            {status === 'All' ? 'Tất cả' : status}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="relative max-w-md">
                        <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"/>
                        <input type="text" placeholder="Tìm kiếm ticket, bệnh nhân..." className="w-full pl-10 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"/>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 dark:bg-slate-900 text-slate-500 uppercase font-bold text-xs sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-24">Mã</th>
                                <th className="p-4">Chủ đề</th>
                                <th className="p-4">Khách hàng</th>
                                <th className="p-4 w-32 text-center">Loại</th>
                                <th className="p-4 w-32 text-center">Ưu tiên</th>
                                <th className="p-4 w-32 text-center">Trạng thái</th>
                                <th className="p-4 w-40 text-right">Thời gian</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {filteredTickets.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                                    <td className="p-4 font-mono text-slate-500">{t.id}</td>
                                    <td className="p-4 font-medium text-slate-800 dark:text-white">{t.subject}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-indigo-600 dark:text-indigo-400">{t.patientName}</div>
                                        <div className="text-xs text-slate-400">{t.phone}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-medium">{t.type}</span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded border text-xs font-bold ${getPriorityColor(t.priority)}`}>
                                            {t.priority}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {getStatusIcon(t.status)}
                                            <span className="text-slate-700 dark:text-slate-300">{t.status}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right text-slate-500">{t.createdDate}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerCareView;