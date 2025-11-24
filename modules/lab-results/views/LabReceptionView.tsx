
import React, { useState } from 'react';
import { SearchIcon, QrcodeIcon, CheckIcon, BeakerIcon, TrashIcon, PrinterIcon, ClockIcon } from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

interface SampleOrder {
    id: string;
    sid: string; // Sample ID / Barcode
    patientName: string;
    age: number;
    gender: string;
    tests: string[]; // List of test codes
    tubeTypes: string[]; // EDTA, Serum, Citrate...
    status: 'pending' | 'collected' | 'received';
    priority: 'Normal' | 'Urgent';
    requestTime: string;
}

const mockOrders: SampleOrder[] = [
    { 
        id: 'ORD001', sid: '2311170001', patientName: 'Nguyễn Văn An', age: 35, gender: 'Nam', 
        tests: ['CBC', 'Glucose', 'HbA1c'], tubeTypes: ['EDTA', 'Serum'], 
        status: 'pending', priority: 'Normal', requestTime: '08:30' 
    },
    { 
        id: 'ORD002', sid: '2311170002', patientName: 'Phạm Thị Dung', age: 22, gender: 'Nữ', 
        tests: ['Beta-HCG', 'Urine 10'], tubeTypes: ['Serum', 'Urine'], 
        status: 'collected', priority: 'Urgent', requestTime: '09:00' 
    },
    { 
        id: 'ORD003', sid: '2311170003', patientName: 'Lê Hoàng Cường', age: 45, gender: 'Nam', 
        tests: ['AST', 'ALT', 'GGT', 'Cholesterol'], tubeTypes: ['Serum'], 
        status: 'received', priority: 'Normal', requestTime: '09:15' 
    },
];

const LabReceptionView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [orders, setOrders] = useState(mockOrders);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'pending' | 'collected' | 'received'>('pending');

    const handleAction = (id: string, newStatus: SampleOrder['status']) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    };

    const filteredOrders = orders.filter(o => 
        o.status === activeTab &&
        (o.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || o.sid.includes(searchTerm))
    );

    const getTubeColor = (type: string) => {
        switch(type) {
            case 'EDTA': return 'bg-purple-100 text-purple-700 border-purple-300';
            case 'Serum': return 'bg-red-100 text-red-700 border-red-300';
            case 'Citrate': return 'bg-blue-100 text-blue-700 border-blue-300';
            case 'Urine': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
            default: return 'bg-gray-100 text-gray-700 border-gray-300';
        }
    };

    return (
        <div className="space-y-4 h-full flex flex-col bg-slate-50 dark:bg-slate-900/50">
            {/* Header Stats */}
            <div className="grid grid-cols-3 gap-4 flex-shrink-0">
                <div 
                    onClick={() => setActiveTab('pending')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${activeTab === 'pending' ? 'bg-white dark:bg-slate-800 border-blue-500 shadow-md' : 'bg-slate-100 dark:bg-slate-800/50 border-transparent hover:bg-white'}`}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500 uppercase">Chờ lấy mẫu</span>
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{orders.filter(o => o.status === 'pending').length}</span>
                    </div>
                </div>
                <div 
                    onClick={() => setActiveTab('collected')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${activeTab === 'collected' ? 'bg-white dark:bg-slate-800 border-orange-500 shadow-md' : 'bg-slate-100 dark:bg-slate-800/50 border-transparent hover:bg-white'}`}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500 uppercase">Đã lấy / Chờ nhận</span>
                        <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">{orders.filter(o => o.status === 'collected').length}</span>
                    </div>
                </div>
                <div 
                    onClick={() => setActiveTab('received')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${activeTab === 'received' ? 'bg-white dark:bg-slate-800 border-green-500 shadow-md' : 'bg-slate-100 dark:bg-slate-800/50 border-transparent hover:bg-white'}`}
                >
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-500 uppercase">Đã nhận vào Lab</span>
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">{orders.filter(o => o.status === 'received').length}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Quét mã Barcode hoặc tìm tên BN..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                            autoFocus
                        />
                    </div>
                    {activeTab === 'pending' && (
                        <button className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold flex items-center gap-2 shadow-sm hover:bg-black transition">
                            <PrinterIcon className="w-4 h-4"/> In Barcode Hàng loạt
                        </button>
                    )}
                </div>

                {/* List */}
                <div className="overflow-auto flex-1">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-40">SID (Barcode)</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4">Yêu cầu xét nghiệm</th>
                                <th className="p-4">Loại ống mẫu</th>
                                <th className="p-4 text-center w-32">Ưu tiên</th>
                                <th className="p-4 text-right w-40">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-blue-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <td className="p-4">
                                        <div className="font-mono font-bold text-blue-600 dark:text-blue-400 text-lg tracking-wide">{order.sid}</div>
                                        <div className="text-xs text-slate-400 flex items-center gap-1">
                                            <ClockIcon className="w-3 h-3"/> {order.requestTime}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{order.patientName}</div>
                                        <div className="text-xs text-slate-500">{order.gender} • {order.age} Tuổi</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {order.tests.map(t => (
                                                <span key={t} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs font-medium border border-slate-200 dark:border-slate-600">
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-1">
                                            {order.tubeTypes.map(t => (
                                                <span key={t} className={`px-2 py-1 rounded text-xs font-bold border ${getTubeColor(t)}`}>
                                                    {t}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {order.priority === 'Urgent' ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 animate-pulse">
                                                CẤP CỨU
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs font-medium">Thường</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {activeTab === 'pending' && (
                                            <button 
                                                onClick={() => handleAction(order.id, 'collected')}
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md transition-transform active:scale-95"
                                            >
                                                <BeakerIcon className="w-4 h-4 mr-2"/> Đã lấy mẫu
                                            </button>
                                        )}
                                        {activeTab === 'collected' && (
                                            <button 
                                                onClick={() => handleAction(order.id, 'received')}
                                                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow-md transition-transform active:scale-95"
                                            >
                                                <CheckIcon className="w-4 h-4 mr-2"/> Nhận mẫu
                                            </button>
                                        )}
                                        {activeTab === 'received' && (
                                            <span className="text-green-600 font-bold text-sm flex items-center justify-end gap-1">
                                                <CheckIcon className="w-4 h-4"/> Sẵn sàng
                                            </span>
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

export default LabReceptionView;
