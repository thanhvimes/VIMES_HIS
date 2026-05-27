import React, { useState } from 'react';
import { 
    ClipboardListIcon, 
    PencilIcon, 
    SaveIcon, 
    CheckIcon,
    PlusIcon,
    BeakerIcon,
    ArchiveIcon,
    SparklesIcon,
    XIcon
} from '../../../../components/Icons';
import Combobox from '../../../../components/ui/Combobox';
import { diagnosisOptions, drugList } from '../../../consultation/data/catalogs';
import { useTheme } from '../../../../contexts/ThemeContext';

// Đây là view chuyên biệt cho bác sĩ để ra y lệnh hàng ngày
const DoctorTreatmentView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [evolution, setEvolution] = useState('');
    const [orders, setOrders] = useState<{type: string, name: string, detail: string}[]>([]);
    
    const handleAddOrder = (type: string) => {
        // Mock add order
        const newOrder = { 
            type, 
            name: type === 'Drug' ? 'Paracetamol 500mg' : 'Tổng phân tích TB máu', 
            detail: type === 'Drug' ? '1 viên x 2 lần (Uống)' : 'Lấy máu tĩnh mạch' 
        };
        setOrders([...orders, newOrder]);
    };

    return (
        <div className="flex flex-col h-full gap-4">
            {/* 1. Diễn biến bệnh (Progress Note) */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2 uppercase text-sm">
                    <ClipboardListIcon className="w-5 h-5 text-blue-600"/> Diễn biến bệnh (Hàng ngày)
                </h3>
                <textarea 
                    value={evolution}
                    onChange={(e) => setEvolution(e.target.value)}
                    className="w-full h-32 p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 text-sm leading-relaxed resize-none"
                    placeholder="Ghi nhận tình trạng bệnh nhân, sinh hiệu, triệu chứng cơ năng..."
                />
            </div>

            {/* 2. Y lệnh (Medical Orders) */}
            <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                 <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 uppercase text-sm flex items-center gap-2">
                        <PencilIcon className="w-5 h-5 text-red-600"/> Y lệnh điều trị
                    </h3>
                    <div className="flex gap-2">
                        <button onClick={() => handleAddOrder('Drug')} className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded text-xs font-bold flex items-center gap-1 border border-green-200">
                            <ArchiveIcon className="w-3 h-3"/> Thêm Thuốc
                        </button>
                         <button onClick={() => handleAddOrder('Lab')} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-bold flex items-center gap-1 border border-blue-200">
                            <BeakerIcon className="w-3 h-3"/> Thêm CLS
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {orders.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 italic">Chưa có y lệnh nào trong ngày.</div>
                    ) : (
                        <table className={`w-full text-left text-sm ${fontSettings.listSecondary}`}>
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-bold text-xs sticky top-0">
                                <tr>
                                    <th className="p-3 w-10">#</th>
                                    <th className="p-3 w-20">Loại</th>
                                    <th className="p-3">Nội dung y lệnh</th>
                                    <th className="p-3 w-32">Chi tiết</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {orders.map((order, idx) => (
                                    <tr key={idx}>
                                        <td className="p-3 text-center">{idx + 1}</td>
                                        <td className="p-3">
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${order.type === 'Drug' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {order.type}
                                            </span>
                                        </td>
                                        <td className="p-3 font-bold text-slate-800 dark:text-white">{order.name}</td>
                                        <td className="p-3 text-slate-600 dark:text-slate-300">{order.detail}</td>
                                        <td className="p-3 text-right">
                                            <button className="text-red-500 hover:bg-red-50 p-1 rounded"><XIcon className="w-4 h-4"/></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow flex items-center gap-2">
                        <SaveIcon className="w-5 h-5"/> Ký Y lệnh
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorTreatmentView;