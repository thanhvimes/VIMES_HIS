
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeftIcon, SaveIcon, PrinterIcon, TrashIcon, 
    PlusIcon, CheckIcon, ArchiveIcon, UserCircleIcon, 
    DocumentTextIcon, ReceiptIcon, TruckIcon, ClipboardListIcon,
    ExclamationCircleIcon, UserGroupIcon, BuildingOfficeIcon, CalendarIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockRequisitions, mockWarehouses } from '../data';
import { formatCurrency } from '../../../utils/formatters';
import Combobox, { ComboboxColumn } from '../../../components/ui/Combobox';
import { drugList } from '../../consultation/data/catalogs';
import { DrugItem } from '../../../types';

const RequisitionEditorView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fontSettings } = useTheme();
    const [req, setReq] = useState<any>(null);
    const [searchDrug, setSearchDrug] = useState('');

    useEffect(() => {
        if (id) {
            const found = mockRequisitions.find(r => r.id === id);
            setReq(found ? { 
                ...found,
                approver: 'BS. Nguyễn Văn Trưởng',
                deliverer: 'DS. Trần Thị Kho',
                receiver: 'ĐD. Lê Thị Nhận'
            } : null);
        } else {
            setReq({
                id: '', reqNo: '', date: new Date().toISOString().slice(0, 10),
                requester: 'Admin', fromWarehouse: mockWarehouses[0].name, 
                toWarehouse: 'KHO CHẴN BHYT', status: 'Draft', reason: 'Dự trù định kỳ tuần 4', 
                approver: '', deliverer: '', receiver: '',
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
            requestedQty: 1,
            approvedQty: 0,
            price: item.price,
            total: item.price
        };
        setReq({ ...req, items: [newItem, ...req.items] });
        setSearchDrug('');
    };

    const updateItemQty = (id: string, qty: number) => {
        const newItems = req.items.map((i: any) => i.id === id ? { ...i, requestedQty: qty, total: qty * i.price } : i);
        const newTotal = newItems.reduce((sum: number, i: any) => sum + i.total, 0);
        setReq({ ...req, items: newItems, totalAmount: newTotal });
    };

    const removeItem = (id: string) => {
        const newItems = req.items.filter((i: any) => i.id !== id);
        const newTotal = newItems.reduce((sum: number, i: any) => sum + i.total, 0);
        setReq({ ...req, items: newItems, totalAmount: newTotal });
    };

    if (!req) return <div className="p-10 text-center text-slate-400">Đang tải hồ sơ...</div>;

    const inputClass = "w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all";
    const labelClass = "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-widest";

    const drugColumns: ComboboxColumn<DrugItem>[] = [
        { key: 'code', label: 'Mã', width: '15%', className: 'font-mono text-[10px]' },
        { key: 'name', label: 'Tên thuốc', width: '70%', className: 'font-bold' },
        { key: 'stock', label: 'Tồn', width: '15%', className: 'text-right font-bold text-blue-600' }
    ];

    return (
        <div className="h-full flex flex-col gap-3 animate-fade-in p-1">
            {/* --- TOP BAR --- */}
            <div className="bg-white dark:bg-slate-800 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition border border-slate-200 dark:border-slate-600 shadow-sm"><ChevronLeftIcon className="w-5 h-5 text-slate-500"/></button>
                    <div>
                        <h2 className="text-lg font-black uppercase text-indigo-700 dark:text-indigo-400 leading-none">Lập phiếu dự trù & lĩnh thuốc</h2>
                        <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-tighter">Số phiếu: <span className="text-blue-600 font-black">{req.reqNo || 'NEW-VOUCHER'}</span></span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${req.status === 'Draft' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                                {req.status === 'Draft' ? 'Bản thảo' : 'Đã duyệt'}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-50 transition shadow-sm"><PrinterIcon className="w-4 h-4"/> In phiếu</button>
                    <button className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/30 transition active:scale-95"><SaveIcon className="w-4 h-4"/> Lưu lại (F9)</button>
                </div>
            </div>

            {/* --- ADMIN CARD (MEDICAL BLUE STYLE) --- */}
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900 shadow-sm shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                    <div className="col-span-1">
                        <label className={labelClass}>Khoa lĩnh thuốc</label>
                        <div className="relative">
                            <BuildingOfficeIcon className="absolute left-3 top-3 w-4 h-4 text-blue-500 z-10"/>
                            <select className={`${inputClass} pl-9 border-blue-200 text-blue-700`} value={req.fromWarehouse} onChange={e => setReq({...req, fromWarehouse: e.target.value})}>
                                {mockWarehouses.map(w => <option key={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="col-span-1">
                        <label className={labelClass}>Kho cung cấp</label>
                        <div className="relative">
                            <ArchiveIcon className="absolute left-3 top-3 w-4 h-4 text-emerald-500 z-10"/>
                            <select className={`${inputClass} pl-9 border-emerald-200 text-emerald-700`} value={req.toWarehouse} onChange={e => setReq({...req, toWarehouse: e.target.value})}>
                                <option>KHO CHẴN BHYT</option>
                                <option>KHO TỔNG DƯỢC</option>
                            </select>
                        </div>
                    </div>
                    <div className="col-span-1">
                        <label className={labelClass}>Người duyệt (Lãnh đạo)</label>
                        <div className="relative">
                            <UserCircleIcon className="absolute left-3 top-3 w-4 h-4 text-indigo-500 z-10"/>
                            <input type="text" className={`${inputClass} pl-9 bg-white/80`} value={req.approver} onChange={e => setReq({...req, approver: e.target.value})} placeholder="BS. Trưởng khoa..." />
                        </div>
                    </div>
                    <div className="col-span-1">
                        <label className={labelClass}>Lý do lĩnh / Ghi chú</label>
                        <input type="text" className={inputClass} value={req.reason} onChange={e => setReq({...req, reason: e.target.value})} placeholder="VD: Lĩnh định kỳ tuần..." />
                    </div>
                    
                    {/* Hàng 2: Ngày & Nhân sự phụ */}
                    <div className="col-span-1">
                        <label className={labelClass}>Ngày yêu cầu</label>
                        <input type="date" className={inputClass} value={req.date} onChange={e => setReq({...req, date: e.target.value})} />
                    </div>
                    <div className="col-span-1">
                        <label className={labelClass}>Người giao (Kho)</label>
                        <input type="text" className={inputClass} value={req.deliverer} onChange={e => setReq({...req, deliverer: e.target.value})} placeholder="Dược sĩ kho..." />
                    </div>
                    <div className="col-span-1">
                        <label className={labelClass}>Người nhận (Khoa)</label>
                        <input type="text" className={inputClass} value={req.receiver} onChange={e => setReq({...req, receiver: e.target.value})} placeholder="Điều dưỡng nhận..." />
                    </div>
                    <div className="col-span-1 flex items-end">
                         <button className="w-full h-[42px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-95">
                            <CheckIcon className="w-4 h-4"/> Gửi duyệt phiếu
                        </button>
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
                        Danh mục thuốc lĩnh
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
                                <th className="p-3 w-24 text-center border-r border-slate-200 dark:border-slate-600 bg-blue-50/50 dark:bg-blue-900/20">SL Dự trù</th>
                                <th className="p-3 w-24 text-center border-r border-slate-200 dark:border-slate-600">SL Duyệt</th>
                                <th className="p-3 w-32 text-right border-r border-slate-200 dark:border-slate-600">Đơn giá (đ)</th>
                                <th className="p-3 w-36 text-right border-r border-slate-200 dark:border-slate-600">Thành tiền</th>
                                <th className="p-3 w-10 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {req.items.map((item: any, idx: number) => (
                                <tr key={item.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-700/50 transition-colors group">
                                    <td className="p-3 text-center text-slate-400 font-mono text-xs border-r border-slate-100 dark:border-slate-700/50">{idx + 1}</td>
                                    <td className="p-3 border-r border-slate-100 dark:border-slate-700/50">
                                        <div className="font-bold text-slate-800 dark:text-white text-sm">{item.drugName}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">{item.drugCode}</div>
                                    </td>
                                    <td className="p-3 text-center border-r border-slate-100 dark:border-slate-700/50">
                                        <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 uppercase">{item.unit}</span>
                                    </td>
                                    <td className="p-3 text-center bg-blue-50/20 dark:bg-blue-900/10 border-r border-slate-100 dark:border-slate-700/50">
                                        <input 
                                            type="number" 
                                            value={item.requestedQty} 
                                            onChange={e => updateItemQty(item.id, parseFloat(e.target.value) || 0)}
                                            className="w-16 text-center font-black text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded p-1 outline-none focus:ring-1 focus:ring-blue-500" 
                                        />
                                    </td>
                                    <td className="p-3 text-center border-r border-slate-100 dark:border-slate-700/50 font-black text-slate-400 italic">
                                        {req.status === 'Approved' ? item.approvedQty : '--'}
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
                            {req.items.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <ArchiveIcon className="w-16 h-16 text-slate-100 dark:text-slate-700"/>
                                            <p className="text-slate-400 font-medium italic">Chưa có thuốc trong danh sách. Gõ vào ô tìm kiếm để thêm.</p>
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
                        <div className="text-xs font-bold text-slate-500 uppercase">Mặt hàng: <span className="text-slate-800 dark:text-white font-black">{req.items.length}</span></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-black uppercase text-slate-500 tracking-tighter">Tổng giá trị dự kiến:</span>
                        <div className="bg-indigo-600 text-white px-6 py-2 rounded-xl shadow-lg shadow-indigo-500/30 font-black text-2xl tracking-tight">
                            {formatCurrency(req.totalAmount).replace(' đ','')} <span className="text-xs font-normal opacity-70">đ</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequisitionEditorView;
