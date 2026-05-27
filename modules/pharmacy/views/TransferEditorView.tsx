import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeftIcon, SaveIcon, PrinterIcon, TrashIcon, 
    PlusIcon, CheckCircleIcon, ArchiveIcon, UserCircleIcon, 
    DocumentTextIcon, SwitchHorizontalIcon, CheckIcon,
    BanIcon, PencilIcon, BuildingOfficeIcon, CalendarIcon,
    UserGroupIcon, SearchIcon, XIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockTransfers, mockWarehouses } from '../data';
import { formatCurrency } from '../../../utils/formatters';
import Combobox, { ComboboxColumn } from '../../../components/ui/Combobox';
import { drugList } from '../../consultation/data/catalogs';
import { DrugItem } from '../../../types';

const TransferEditorView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fontSettings } = useTheme();
    const [voucher, setVoucher] = useState<any>(null);
    const [searchDrug, setSearchDrug] = useState('');

    useEffect(() => {
        if (id) {
            const found = mockTransfers.find(t => t.id === id);
            setVoucher(found ? { ...found } : null);
        } else {
            setVoucher({
                id: '', transferNo: '', date: new Date().toISOString().slice(0, 10),
                fromWarehouse: 'KHO CHẴN BHYT', toWarehouse: 'KHO BHYT', 
                deliverer: 'Nguyễn Văn Giao', receiver: 'Lê Thị Nhận', 
                description: 'Điều chuyển thuốc định kỳ', status: 'O', 
                totalAmount: 0, items: []
            });
        }
    }, [id]);

    const handleAddDrug = (val: string, item?: DrugItem) => {
        if (!item) return;
        const newItem = {
            id: `I${Date.now()}`,
            drugCode: item.code,
            drugName: item.name,
            unit: item.unit,
            quantity: 1,
            price: item.price,
            manufacturer: 'Việt Nam',
            expiryDate: '2025-12-31',
            total: item.price
        };
        const newItems = [newItem, ...voucher.items];
        const newTotal = newItems.reduce((sum: number, i: any) => sum + i.total, 0);
        setVoucher({ ...voucher, items: newItems, totalAmount: newTotal });
        setSearchDrug('');
    };

    const updateItemQty = (id: string, qty: number) => {
        const newItems = voucher.items.map((i: any) => i.id === id ? { ...i, quantity: qty, total: qty * i.price } : i);
        const newTotal = newItems.reduce((sum: number, i: any) => sum + i.total, 0);
        setVoucher({ ...voucher, items: newItems, totalAmount: newTotal });
    };

    const removeItem = (id: string) => {
        const newItems = voucher.items.filter((i: any) => i.id !== id);
        const newTotal = newItems.reduce((sum: number, i: any) => sum + i.total, 0);
        setVoucher({ ...voucher, items: newItems, totalAmount: newTotal });
    };

    if (!voucher) return <div className="p-10 text-center text-slate-400 animate-pulse">Đang tải hồ sơ...</div>;

    const inputClass = "w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all";
    const labelClass = "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-widest";

    const drugColumns: ComboboxColumn<DrugItem>[] = [
        { key: 'code', label: 'Mã', width: '20%', className: 'font-mono text-[10px]' },
        { key: 'name', label: 'Tên thuốc', width: '60%', className: 'font-bold' },
        { key: 'stock', label: 'Tồn', width: '20%', className: 'text-right font-bold text-blue-600' }
    ];

    return (
        <div className="h-full flex flex-col gap-3 animate-fade-in p-1">
            {/* --- TOOLBAR (Professional Icons as requested) --- */}
            <div className="bg-[#f0f9ff] dark:bg-slate-800 p-2.5 rounded-2xl border border-blue-200 dark:border-slate-700 flex flex-wrap gap-2 shadow-sm shrink-0">
                <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95">
                    <PlusIcon className="w-4 h-4"/> <u>T</u>hêm
                </button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95">
                    <PencilIcon className="w-4 h-4"/> <u>S</u>ửa
                </button>
                <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95">
                    <TrashIcon className="w-4 h-4"/> <u>X</u>óa
                </button>
                <div className="w-px h-8 bg-slate-300 dark:bg-slate-600 mx-1 hidden sm:block"></div>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95">
                    <SaveIcon className="w-4 h-4"/> <u>L</u>ưu
                </button>
                <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-200 transition active:scale-95">
                    <BanIcon className="w-4 h-4"/> <u>H</u>uỷ
                </button>
                <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition active:scale-95">
                    <PrinterIcon className="w-4 h-4"/> <u>I</u>n
                </button>
                <div className="w-px h-8 bg-slate-300 dark:bg-slate-600 mx-1 hidden sm:block"></div>
                <button className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 transition active:scale-95">
                    <CheckCircleIcon className="w-4 h-4"/> <u>D</u>uyệt
                </button>
                
                {/* Fixed missing XIcon import above */}
                <button onClick={() => navigate(-1)} className="ml-auto p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full shadow-sm hover:bg-slate-100 transition"><XIcon className="w-5 h-5 text-slate-400"/></button>
            </div>

            {/* --- ADMIN CARD (MEDICAL BLUE STYLE) --- */}
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900 shadow-sm shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <div className="col-span-1">
                        <label className={labelClass}>Kho xuất đi <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <BuildingOfficeIcon className="absolute left-3 top-3 w-4 h-4 text-blue-500 z-10"/>
                            <select className={`${inputClass} pl-9 border-blue-200 text-blue-700`} value={voucher.fromWarehouse} onChange={e => setVoucher({...voucher, fromWarehouse: e.target.value})}>
                                {mockWarehouses.map(w => <option key={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="col-span-1">
                        <label className={labelClass}>Kho nhận đến <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <ArchiveIcon className="absolute left-3 top-3 w-4 h-4 text-emerald-500 z-10"/>
                            <select className={`${inputClass} pl-9 border-emerald-200 text-emerald-700`} value={voucher.toWarehouse} onChange={e => setVoucher({...voucher, toWarehouse: e.target.value})}>
                                {mockWarehouses.map(w => <option key={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="col-span-1">
                        <label className={labelClass}>Số phiếu (Hệ thống)</label>
                        <div className="relative">
                            <DocumentTextIcon className="absolute left-3 top-3 w-4 h-4 text-indigo-500 z-10"/>
                            <input type="text" className={`${inputClass} pl-9 bg-slate-50/50 font-mono text-indigo-600`} value={voucher.transferNo || 'AUTO-ID'} readOnly />
                        </div>
                    </div>
                    <div className="col-span-1">
                        <label className={labelClass}>Ngày điều chuyển</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-3 w-4 h-4 text-orange-500 z-10"/>
                            <input type="date" className={`${inputClass} pl-9`} value={voucher.date} onChange={e => setVoucher({...voucher, date: e.target.value})} />
                        </div>
                    </div>
                    
                    {/* Hàng 2: Nhân sự & Lý do */}
                    <div className="col-span-1">
                        <label className={labelClass}>Người giao (Bên xuất)</label>
                        <div className="relative">
                            <UserGroupIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10"/>
                            <input type="text" className={`${inputClass} pl-9 font-medium`} value={voucher.deliverer} onChange={e => setVoucher({...voucher, deliverer: e.target.value})} />
                        </div>
                    </div>
                    <div className="col-span-1">
                        <label className={labelClass}>Người nhận (Bên nhập)</label>
                        <div className="relative">
                            <UserGroupIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10"/>
                            <input type="text" className={`${inputClass} pl-9 font-medium`} value={voucher.receiver} onChange={e => setVoucher({...voucher, receiver: e.target.value})} />
                        </div>
                    </div>
                    <div className="col-span-2">
                        <label className={labelClass}>Lý do điều chuyển / Ghi chú</label>
                        <input type="text" className={inputClass} value={voucher.description} onChange={e => setVoucher({...voucher, description: e.target.value})} placeholder="Nhập lý do luân chuyển hàng hóa..." />
                    </div>
                </div>
            </div>

            {/* --- MAIN DRUG TABLE CARD --- */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 font-black text-slate-700 dark:text-white uppercase text-[11px] whitespace-nowrap">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
                            <ArchiveIcon className="w-5 h-5"/>
                        </div>
                        Danh mục thuốc điều chuyển
                    </div>
                    <div className="flex-1 relative z-30 w-full max-w-3xl">
                        <Combobox<DrugItem>
                            placeholder="Gõ tên thuốc hoặc mã để thêm nhanh (F2)..."
                            value={searchDrug}
                            onChange={handleAddDrug}
                            options={drugList}
                            columns={drugColumns}
                            displayValue={item => item.name}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-[#f1f5f9] dark:bg-slate-700 text-slate-600 dark:text-slate-300 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-600">
                            <tr>
                                <th className="p-3 w-10 text-center border-r border-slate-200 dark:border-slate-600">STT</th>
                                <th className="p-3 border-r border-slate-200 dark:border-slate-600">Tên thuốc / Hàm lượng</th>
                                <th className="p-3 w-20 text-center border-r border-slate-200 dark:border-slate-600">ĐVT</th>
                                <th className="p-3 w-32 text-center border-r border-slate-200 dark:border-slate-600">Số lô / Hạn dùng</th>
                                <th className="p-3 w-24 text-center border-r border-slate-200 dark:border-slate-600 bg-blue-50/50 dark:bg-blue-900/20">SL Chuyển</th>
                                <th className="p-3 w-32 text-right border-r border-slate-200 dark:border-slate-600">Đơn giá (đ)</th>
                                <th className="p-3 w-36 text-right border-r border-slate-200 dark:border-slate-600">Thành tiền</th>
                                <th className="p-3 w-10 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {voucher.items.map((item: any, idx: number) => (
                                <tr key={item.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-700/50 transition-colors group">
                                    <td className="p-3 text-center text-slate-400 font-mono text-xs border-r border-slate-100 dark:border-slate-700/50">{idx + 1}</td>
                                    <td className="p-3 border-r border-slate-100 dark:border-slate-700/50">
                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{item.drugName}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{item.drugCode}</div>
                                    </td>
                                    <td className="p-3 text-center border-r border-slate-100 dark:border-slate-700/50">
                                        <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 uppercase">{item.unit}</span>
                                    </td>
                                    <td className="p-3 border-r border-slate-100 dark:border-slate-700/50">
                                        <div className="text-[11px] font-mono font-bold text-blue-600">LOT2309-1</div>
                                        <div className="text-[10px] text-red-500 font-bold uppercase">{item.expiryDate}</div>
                                    </td>
                                    <td className="p-3 text-center bg-blue-50/20 dark:bg-blue-900/10 border-r border-slate-100 dark:border-slate-700/50">
                                        <input 
                                            type="number" 
                                            value={item.quantity} 
                                            onChange={e => updateItemQty(item.id, parseFloat(e.target.value) || 0)}
                                            className="w-16 text-center font-black text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded p-1 outline-none focus:ring-1 focus:ring-blue-500" 
                                        />
                                    </td>
                                    <td className="p-3 text-right border-r border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-mono">{item.price.toLocaleString()}</td>
                                    <td className="p-3 text-right border-r border-slate-100 dark:border-slate-700/50 font-black text-slate-900 dark:text-white text-base">
                                        {item.total.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {voucher.items.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <SwitchHorizontalIcon className="w-16 h-16 text-slate-100 dark:text-slate-700"/>
                                            <p className="text-slate-400 font-medium italic">Chưa có thuốc trong danh sách điều chuyển. Thêm thuốc để bắt đầu.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Sum (Condensed & Premium) */}
                <div className="p-4 bg-[#f8fafc] dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0 shadow-inner">
                    <div className="flex gap-6">
                        <div className="text-xs font-bold text-slate-500 uppercase">Mặt hàng: <span className="text-slate-800 dark:text-white font-black">{voucher.items.length}</span></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-black uppercase text-slate-500 tracking-tighter">Tổng giá trị điều chuyển:</span>
                        <div className="bg-indigo-600 text-white px-6 py-2 rounded-xl shadow-lg shadow-indigo-500/30 font-black text-2xl tracking-tight">
                            {formatCurrency(voucher.totalAmount).replace(' đ','')} <span className="text-xs font-normal opacity-70">đ</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransferEditorView;