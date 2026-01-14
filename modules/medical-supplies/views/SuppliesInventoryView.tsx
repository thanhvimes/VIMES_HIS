
import React, { useState, useMemo } from 'react';
import { 
    SearchIcon, PlusIcon, FilterIcon, RefreshIcon, 
    ArchiveIcon, MapPinIcon, BuildingOfficeIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockSupplies } from '../data';
import { formatCurrency } from '../../../utils/formatters';

const SuppliesInventoryView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSupplies = useMemo(() => {
        return mockSupplies.filter(s => 
            s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            s.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg">
                            <ArchiveIcon className="w-6 h-6"/>
                        </div>
                        Kho Vật tư hiện hữu
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Quản lý số lượng và vị trí lưu trữ vật tư y tế.</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition active:scale-95">
                        <PlusIcon className="w-4 h-4"/> Thêm mới
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 items-center">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Tìm theo mã hoặc tên vật tư..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${fontSettings.controls}`} 
                    />
                </div>
                <button className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500"><RefreshIcon className="w-5 h-5"/></button>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest">
                            <tr>
                                <th className="p-4 w-12 text-center">Mã</th>
                                <th className="p-4">Tên Vật tư / Quy cách</th>
                                <th className="p-4">Phân loại</th>
                                <th className="p-4 text-right">Giá nhập</th>
                                <th className="p-4 text-right">Tồn thực</th>
                                <th className="p-4 text-center">Hạn dùng</th>
                                <th className="p-4 text-center">Vị trí</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredSupplies.map(item => (
                                <tr key={item.id} className="hover:bg-indigo-50/50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer">
                                    <td className="p-4 font-mono text-slate-400 text-xs">{item.code}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white underline decoration-indigo-100 dark:decoration-slate-700 underline-offset-8">{item.name}</div>
                                        <div className="text-[10px] text-slate-400 mt-1">{item.spec}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase rounded">{item.category}</span>
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-500 dark:text-slate-400 text-sm">
                                        {item.price.toLocaleString()}
                                    </td>
                                    <td className={`p-4 text-right font-black text-base ${item.stock <= item.minStock ? 'text-red-600' : 'text-indigo-600'}`}>
                                        {item.stock.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                                    </td>
                                    <td className="p-4 text-center text-sm font-bold text-slate-600 dark:text-slate-300">
                                        {item.expiryDate}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
                                            <MapPinIcon className="w-3 h-3"/> {item.location}
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

export default SuppliesInventoryView;
