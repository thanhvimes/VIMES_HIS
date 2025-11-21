
import React, { useState } from 'react';
import { CheckIcon, ExclamationCircleIcon, SearchIcon } from '../../../components/Icons';

const mockPendingRecords = [
    { id: 'HS001', patientName: 'Nguyễn Văn An', recordId: '21024061', department: 'Nội tổng hợp', dischargeDate: '27/10/2023', status: 'pending', notes: '' },
    { id: 'HS002', patientName: 'Phạm Thị Dung', recordId: '23011618', department: 'Sản phụ khoa', dischargeDate: '25/10/2023', status: 'missing_docs', notes: 'Thiếu biên bản hội chẩn' },
    { id: 'HS003', patientName: 'Trần Văn X', recordId: '22001234', department: 'Ngoại chấn thương', dischargeDate: '28/10/2023', status: 'pending', notes: '' },
];

const ReceptionView: React.FC = () => {
    const [records, setRecords] = useState(mockPendingRecords);
    const [searchTerm, setSearchTerm] = useState('');

    const handleReceive = (id: string) => {
        if(window.confirm("Xác nhận tiếp nhận hồ sơ này vào kho?")) {
            setRecords(records.filter(r => r.id !== id));
            alert("Đã tiếp nhận thành công!");
        }
    };

    const handleReportMissing = (id: string) => {
        const note = prompt("Nhập ghi chú về tài liệu thiếu:");
        if (note) {
            setRecords(records.map(r => r.id === id ? { ...r, status: 'missing_docs', notes: note } : r));
        }
    };

    const filteredRecords = records.filter(r => r.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || r.recordId.includes(searchTerm));

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tiếp nhận & Bàn giao</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Tiếp nhận hồ sơ từ các khoa lâm sàng và xử lý hồ sơ thiếu.</p>
                </div>
                <div className="relative w-72">
                    <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Tìm mã hồ sơ, tên BN..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0">
                            <tr>
                                <th className="p-4">Mã HS</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4">Khoa bàn giao</th>
                                <th className="p-4">Ngày ra viện</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4">Ghi chú</th>
                                <th className="p-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredRecords.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-slate-500">Không có hồ sơ chờ tiếp nhận.</td></tr>
                            ) : (
                                filteredRecords.map(rec => (
                                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 font-mono text-blue-600 dark:text-blue-400 font-medium">{rec.recordId}</td>
                                        <td className="p-4 font-bold text-slate-800 dark:text-white">{rec.patientName}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">{rec.department}</td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400">{rec.dischargeDate}</td>
                                        <td className="p-4">
                                            {rec.status === 'missing_docs' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                                    <ExclamationCircleIcon className="w-3 h-3"/> Thiếu giấy tờ
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                                    Chờ nhận
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-slate-500 italic text-sm">{rec.notes}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleReportMissing(rec.id)}
                                                    className="px-3 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded text-sm font-medium shadow-sm transition"
                                                >
                                                    Báo thiếu
                                                </button>
                                                <button 
                                                    onClick={() => handleReceive(rec.id)}
                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold shadow-md flex items-center gap-1 transition"
                                                >
                                                    <CheckIcon className="w-4 h-4"/> Tiếp nhận
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReceptionView;
