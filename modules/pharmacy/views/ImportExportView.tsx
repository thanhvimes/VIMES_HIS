import React, { useState } from 'react';
import { TruckIcon, ArchiveIcon, CheckIcon, TrashIcon } from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import Combobox, { ComboboxColumn } from '../../../components/shared/Combobox';
import { drugList } from '../../consultation/data/catalogs';
import { DrugItem } from '../../../types';

interface StockTransactionItem {
    id: string;
    drug: DrugItem;
    quantity: number;
    unitPrice: number;
    batchNumber: string;
    expiryDate: string;
}

const ImportExportView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
    const [items, setItems] = useState<StockTransactionItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form state
    const [supplier, setSupplier] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [note, setNote] = useState('');

    const handleAddItem = (drug: DrugItem) => {
        const newItem: StockTransactionItem = {
            id: `TEMP-${Date.now()}`,
            drug,
            quantity: 1,
            unitPrice: drug.price,
            batchNumber: '',
            expiryDate: ''
        };
        setItems([...items, newItem]);
        setSearchTerm('');
    };

    const handleUpdateItem = (id: string, field: keyof StockTransactionItem, value: any) => {
        setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
    };

    const handleRemoveItem = (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa thuốc này khỏi phiếu?")) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    const drugColumns: ComboboxColumn<DrugItem>[] = [
        { key: 'code', label: 'Mã', width: '15%', className: 'font-mono text-xs' },
        { key: 'name', label: 'Tên thuốc', width: '50%', className: 'font-bold' },
        { key: 'stock', label: 'Tồn', width: '15%', className: 'text-right' }
    ];

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nhập / Xuất Kho</h1>
                <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab('import')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'import' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Nhập kho (Inbound)
                    </button>
                    <button 
                        onClick={() => setActiveTab('export')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'export' ? 'bg-white dark:bg-slate-600 text-red-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        Xuất kho (Outbound)
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* LEFT: Form Info */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-4 overflow-y-auto">
                    <div className="pb-4 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            {activeTab === 'import' ? <ArchiveIcon className="w-5 h-5 text-blue-600"/> : <TruckIcon className="w-5 h-5 text-red-600"/>}
                            {activeTab === 'import' ? 'Phiếu Nhập Kho' : 'Phiếu Xuất Kho'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Mã phiếu: {activeTab === 'import' ? 'NK' : 'XK'}-{Date.now().toString().slice(-6)}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {activeTab === 'import' ? 'Nhà cung cấp' : 'Đơn vị nhận / Lý do'}
                        </label>
                        <input type="text" className={`w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 ${fontSettings.controls}`} value={supplier} onChange={e => setSupplier(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Số hóa đơn / Chứng từ
                        </label>
                        <input type="text" className={`w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 ${fontSettings.controls}`} value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Ghi chú
                        </label>
                        <textarea rows={3} className={`w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-700 border-slate-300 dark:border-slate-600 resize-none ${fontSettings.controls}`} value={note} onChange={e => setNote(e.target.value)}></textarea>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between mb-4">
                            <span className="font-bold text-slate-600 dark:text-slate-400">Tổng tiền:</span>
                            <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{totalAmount.toLocaleString()} đ</span>
                        </div>
                        <button className={`w-full py-3 rounded-lg font-bold text-white shadow-md flex items-center justify-center gap-2 transition transform active:scale-95 ${activeTab === 'import' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
                            <CheckIcon className="w-5 h-5"/>
                            {activeTab === 'import' ? 'Hoàn tất Nhập kho' : 'Hoàn tất Xuất kho'}
                        </button>
                    </div>
                </div>

                {/* RIGHT: Item List */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <div className="relative z-20">
                            <Combobox<DrugItem>
                                placeholder="Tìm thuốc thêm vào phiếu..."
                                value={searchTerm}
                                onChange={(val, item) => {
                                    setSearchTerm(val);
                                    if(item) handleAddItem(item);
                                }}
                                options={drugList}
                                columns={drugColumns}
                                displayValue={item => item.name}
                                className="w-full"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className={`w-full text-left ${fontSettings.listSecondary}`}>
                            <thead className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase sticky top-0">
                                <tr>
                                    <th className="p-3">Tên thuốc</th>
                                    <th className="p-3 w-24 text-center">ĐVT</th>
                                    <th className="p-3 w-32">Số lô / HSD</th>
                                    <th className="p-3 w-24 text-right">Số lượng</th>
                                    <th className="p-3 w-32 text-right">Đơn giá</th>
                                    <th className="p-3 w-32 text-right">Thành tiền</th>
                                    <th className="p-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-10 text-center text-slate-400">Chưa có thuốc nào trong phiếu.</td>
                                    </tr>
                                ) : (
                                    items.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="p-3 font-medium text-slate-800 dark:text-white">{item.drug.name}</td>
                                            <td className="p-3 text-center text-slate-500">{item.drug.unit}</td>
                                            <td className="p-3">
                                                <input 
                                                    type="text" 
                                                    placeholder="Lô..." 
                                                    className="w-full text-xs p-1 border rounded mb-1 dark:bg-slate-700 dark:border-slate-600"
                                                    value={item.batchNumber}
                                                    onChange={e => handleUpdateItem(item.id, 'batchNumber', e.target.value)}
                                                />
                                                <input 
                                                    type="date" 
                                                    className="w-full text-xs p-1 border rounded dark:bg-slate-700 dark:border-slate-600"
                                                    value={item.expiryDate}
                                                    onChange={e => handleUpdateItem(item.id, 'expiryDate', e.target.value)}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    className="w-full text-right p-1.5 border rounded dark:bg-slate-700 dark:border-slate-600 font-bold"
                                                    value={item.quantity}
                                                    onChange={e => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <input 
                                                    type="number" 
                                                    min="0" 
                                                    className="w-full text-right p-1.5 border rounded dark:bg-slate-700 dark:border-slate-600"
                                                    value={item.unitPrice}
                                                    onChange={e => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                />
                                            </td>
                                            <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-200">
                                                {(item.quantity * item.unitPrice).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => handleRemoveItem(item.id)} className="text-slate-400 hover:text-red-500 transition">
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImportExportView;