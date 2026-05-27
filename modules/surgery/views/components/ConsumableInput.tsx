
import React, { useState } from 'react';
import { SearchIcon, TrashIcon, PlusIcon, CubeIcon, SaveIcon } from '../../../../components/Icons';
import Combobox, { ComboboxColumn } from '../../../../components/ui/Combobox';
import { drugList } from '../../../consultation/data/catalogs';
import { DrugItem, ConsumableUsage } from '../../../../types';

const ConsumableInput: React.FC = () => {
    const [usedItems, setUsedItems] = useState<ConsumableUsage[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const handleAddItem = (drug: DrugItem) => {
        setUsedItems(prev => {
            const existing = prev.find(i => i.itemId === drug.code);
            if (existing) {
                return prev.map(i => i.itemId === drug.code ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                id: `USE_${Date.now()}`,
                itemId: drug.code,
                itemName: drug.name,
                quantity: 1,
                unit: drug.unit
            }];
        });
        setSearchTerm('');
    };

    const handleUpdateQty = (id: string, delta: number) => {
        setUsedItems(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = Math.max(1, i.quantity + delta);
                return { ...i, quantity: newQty };
            }
            return i;
        }));
    };

    const handleRemove = (id: string) => {
        setUsedItems(prev => prev.filter(i => i.id !== id));
    };

    const drugColumns: ComboboxColumn<DrugItem>[] = [
        { key: 'code', label: 'Mã', width: '20%', className: 'font-mono text-xs' },
        { key: 'name', label: 'Tên vật tư/thuốc', width: '60%', className: 'font-bold' },
        { key: 'stock', label: 'Tồn', width: '20%', className: 'text-right' }
    ];

    return (
        <div className="h-full flex flex-col">
            {/* Search Area */}
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-3 uppercase flex items-center gap-2">
                    <SearchIcon className="w-4 h-4"/> Tìm kiếm vật tư tiêu hao & Thuốc
                </h3>
                <div className="relative z-20">
                    <Combobox<DrugItem>
                        placeholder="Nhập tên thuốc, gạc, chỉ khâu..."
                        options={drugList}
                        value={searchTerm}
                        onChange={(val, item) => {
                            setSearchTerm(val);
                            if(item) handleAddItem(item);
                        }}
                        columns={drugColumns}
                        displayValue={item => item.name}
                        className="w-full"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 sticky top-0 z-10">
                        <tr>
                            <th className="p-3">Tên vật tư</th>
                            <th className="p-3 text-center w-24">ĐVT</th>
                            <th className="p-3 text-center w-32">Số lượng</th>
                            <th className="p-3 w-16"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900">
                        {usedItems.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-slate-400 italic">
                                    Chưa có vật tư nào được ghi nhận.
                                </td>
                            </tr>
                        ) : (
                            usedItems.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{item.itemName}</td>
                                    <td className="p-3 text-center text-slate-500">{item.unit}</td>
                                    <td className="p-3">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={() => handleUpdateQty(item.id, -1)} className="p-1 w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-600">-</button>
                                            <input 
                                                type="number" 
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    setUsedItems(prev => prev.map(i => i.id === item.id ? {...i, quantity: val} : i));
                                                }}
                                                className="w-12 text-center border border-slate-300 rounded py-0.5 dark:bg-slate-800 dark:border-slate-600"
                                            />
                                            <button onClick={() => handleUpdateQty(item.id, 1)} className="p-1 w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-600">+</button>
                                        </div>
                                    </td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => handleRemove(item.id)} className="text-red-400 hover:text-red-600 transition">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                <div className="text-sm text-slate-500 self-center mr-auto">
                    Tổng mục: <strong>{usedItems.length}</strong>
                </div>
                <button className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow flex items-center gap-2 transition">
                    <SaveIcon className="w-5 h-5"/> Hoàn tất nhập
                </button>
            </div>
        </div>
    );
};

export default ConsumableInput;
