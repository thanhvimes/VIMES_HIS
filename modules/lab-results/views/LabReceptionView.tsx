
import React, { useState } from 'react';
import { SearchIcon, QrcodeIcon, CheckIcon, BeakerIcon } from '../../../components/Icons';

const mockOrders = [
    { id: 'ORD001', patientName: 'Nguyễn Văn An', dob: '1988', sid: '231030001', tests: 'Tổng phân tích tế bào máu, Glucose', status: 'pending' },
    { id: 'ORD002', patientName: 'Phạm Thị Dung', dob: '2001', sid: '231030002', tests: 'HCG, Tổng phân tích nước tiểu', status: 'pending' },
    { id: 'ORD003', patientName: 'Trần Văn X', dob: '1975', sid: '231030003', tests: 'Sinh hóa cơ bản (Gan, Thận, Mỡ máu)', status: 'sampled' },
];

const LabReceptionView: React.FC = () => {
    const [orders, setOrders] = useState(mockOrders);
    const [searchTerm, setSearchTerm] = useState('');

    const handleSample = (id: string) => {
        setOrders(orders.map(o => o.id === id ? { ...o, status: 'sampled' } : o));
    };

    const handlePrintBarcode = (sid: string) => {
        alert(`Đang in Barcode cho SID: ${sid}`);
    };

    const filteredOrders = orders.filter(o => o.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || o.sid.includes(searchTerm));

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Tiếp nhận & Lấy mẫu</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý danh sách chờ lấy mẫu và in mã vạch (Barcode).</p>
                </div>
                <div className="relative w-72">
                    <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Tìm tên BN, SID..." 
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
                                <th className="p-4">SID (Barcode)</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4">Năm sinh</th>
                                <th className="p-4">Chỉ định</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="p-4 font-mono text-blue-600 dark:text-blue-400 font-bold">{order.sid}</td>
                                    <td className="p-4 font-bold text-slate-800 dark:text-white">{order.patientName}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">{order.dob}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">{order.tests}</td>
                                    <td className="p-4 text-center">
                                        {order.status === 'pending' ? (
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">Chờ lấy mẫu</span>
                                        ) : (
                                            <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Đã lấy mẫu</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => handlePrintBarcode(order.sid)}
                                                className="p-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 rounded text-sm font-medium shadow-sm transition"
                                                title="In Barcode"
                                            >
                                                <QrcodeIcon className="w-5 h-5"/>
                                            </button>
                                            {order.status === 'pending' && (
                                                <button 
                                                    onClick={() => handleSample(order.id)}
                                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold shadow-md flex items-center gap-1 transition"
                                                >
                                                    <BeakerIcon className="w-4 h-4"/> Lấy mẫu
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

export default LabReceptionView;
