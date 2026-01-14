
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ChevronLeftIcon, SaveIcon, PrinterIcon, TrashIcon, 
    PlusIcon, CheckIcon, ArchiveIcon, DocumentTextIcon, TruckIcon, BuildingOfficeIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { formatCurrency } from '../../../utils/formatters';

const SuppliesReceiptEditorView: React.FC = () => {
    const navigate = useNavigate();
    const { fontSettings } = useTheme();
    const [voucher, setVoucher] = useState({
        voucherNo: 'NKVT-20231127-001',
        invoiceNo: '',
        date: new Date().toISOString().slice(0, 10),
        supplier: '',
        warehouse: 'KHO VẬT TƯ TỔNG',
        items: []
    });

    const inputClass = "w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-slate-700 text-sm font-bold shadow-sm transition-all";
    const labelClass = "block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider";

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in p-1">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition border border-slate-200 shadow-sm"><ChevronLeftIcon className="w-6 h-6 text-slate-600"/></button>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">Lập phiếu nhập vật tư</h2>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">Mã hệ thống: <span className="font-bold text-indigo-600">{voucher.voucherNo}</span></p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition active:scale-95"><SaveIcon className="w-4 h-4"/> Lưu phiếu (F9)</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 shrink-0">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight mb-4 flex items-center gap-2 border-b pb-2"><DocumentTextIcon className="w-4 h-4 text-indigo-500"/> Chứng từ & Đối tác</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className={labelClass}>Nhà cung cấp <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <BuildingOfficeIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                                <select className={`${inputClass} pl-10`} value={voucher.supplier} onChange={e => setVoucher({...voucher, supplier: e.target.value})}>
                                    <option value="">-- Chọn đơn vị cung ứng --</option>
                                    <option>CT Thiết bị Y tế Phương Đông</option>
                                    <option>Dụng cụ Y khoa Sài Gòn</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Số hóa đơn</label>
                            <input type="text" className={inputClass} placeholder="0001234..." />
                        </div>
                        <div>
                            <label className={labelClass}>Ngày hóa đơn</label>
                            <input type="date" className={inputClass} value={voucher.date} onChange={e => setVoucher({...voucher, date: e.target.value})} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight mb-4 flex items-center gap-2 border-b pb-2"><ArchiveIcon className="w-4 h-4 text-indigo-500"/> Kho & Giao nhận</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className={labelClass}>Kho nhập vật tư <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <TruckIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                                <select className={`${inputClass} pl-10 border-indigo-200 bg-indigo-50/20 text-indigo-700`} value={voucher.warehouse} onChange={e => setVoucher({...voucher, warehouse: e.target.value})}>
                                    <option>KHO VẬT TƯ TỔNG</option>
                                    <option>KHO VẬT TƯ TIÊU HAO</option>
                                    <option>KHO DỤNG CỤ</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Người giao hàng</label>
                            <input type="text" className={inputClass} placeholder="Tên NV giao..." />
                        </div>
                        <div>
                            <label className={labelClass}>Người nhận (Thủ kho)</label>
                            <input type="text" className={inputClass} placeholder="NV kiểm nhận..." />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                    <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-xs flex items-center gap-2"><PlusIcon className="w-4 h-4 text-indigo-600"/> Chi tiết vật tư nhập</h3>
                    <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition active:scale-95">
                        Thêm vật tư (F2)
                    </button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-400">
                    <ArchiveIcon className="w-16 h-16 opacity-10 mb-4"/>
                    <p className="font-medium">Chưa có vật tư nào. Nhấn <span className="font-bold text-indigo-600">F2</span> để thêm mặt hàng vào danh sách.</p>
                </div>
            </div>
        </div>
    );
};

export default SuppliesReceiptEditorView;
