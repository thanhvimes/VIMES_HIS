
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeftIcon, SaveIcon, PrinterIcon, TrashIcon, 
    PlusIcon, CheckIcon, ArchiveIcon, UserCircleIcon, 
    DocumentTextIcon, ReceiptIcon, TruckIcon, BuildingOfficeIcon,
    GlobeIcon, DownloadIcon, XIcon, BanIcon, CurrencyDollarIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockVouchers, mockWarehouses } from '../data';
import { formatCurrency } from '../../../utils/formatters';

const ReceiptEditorView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fontSettings } = useTheme();
    const [voucher, setVoucher] = useState<any>(null);

    useEffect(() => {
        if (id) {
            const found = mockVouchers.find(v => v.id === id);
            setVoucher(found ? { 
                ...found, 
                deliverer: 'Nguyễn Văn Giao', 
                receiver: 'Trần Thị Kho', 
                origin: 'Nhập mua từ NCC' 
            } : null);
        } else {
            setVoucher({
                id: '', voucherNo: '', invoiceNo: '', date: new Date().toISOString().slice(0, 10),
                invoiceDate: new Date().toISOString().slice(0, 10), supplier: '', 
                warehouse: mockWarehouses[0].name, status: 'O', amount: 0, vat: 5, total: 0,
                deliverer: '', receiver: '', origin: 'Nhập mua từ NCC',
                items: []
            });
        }
    }, [id]);

    if (!voucher) return <div className="p-10 text-center">Đang tải...</div>;

    const inputClass = "w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-sm font-bold shadow-sm transition-all focus:bg-white dark:focus:bg-slate-600";
    const labelClass = "block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 tracking-wider";

    const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                <Icon className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black text-slate-700 dark:text-slate-200 uppercase tracking-tight">{title}</h3>
        </div>
    );

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* --- ACTION BAR --- */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <button onClick={() => navigate(-1)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition border border-slate-200 dark:border-slate-600 shadow-sm"><ChevronLeftIcon className="w-6 h-6 text-slate-600 dark:text-slate-300"/></button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-black uppercase tracking-tight text-slate-800 dark:text-white">
                                {id ? 'Cập nhật phiếu nhập' : 'Lập phiếu nhập kho'}
                            </h2>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${voucher.status === 'A' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                {voucher.status === 'A' ? 'Đã duyệt' : 'Nháp'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">Hệ thống: <span className="font-bold text-blue-600">{voucher.voucherNo || 'TỰ ĐỘNG'}</span></p>
                    </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button className="flex-1 sm:flex-none px-5 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm"><PrinterIcon className="w-4 h-4"/> In phiếu</button>
                    <button className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition active:scale-95"><SaveIcon className="w-4 h-4"/> Lưu (F9)</button>
                    {voucher.status === 'O' && (
                        <button className="flex-1 sm:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition active:scale-95"><CheckIcon className="w-4 h-4"/> Duyệt nhập</button>
                    )}
                </div>
            </div>

            {/* --- MASTER INFO GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 shrink-0">
                
                {/* Khối 1: Thông tin chứng từ */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <SectionTitle icon={DocumentTextIcon} title="Chứng từ gốc" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className={labelClass}>Số hóa đơn <span className="text-red-500">*</span></label>
                            <input type="text" className={`${inputClass} text-blue-600 dark:text-blue-400`} value={voucher.invoiceNo} onChange={e => setVoucher({...voucher, invoiceNo: e.target.value})} placeholder="Số trên HĐ đỏ..." />
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Ngày hóa đơn</label>
                            <input type="date" className={inputClass} value={voucher.invoiceDate} onChange={e => setVoucher({...voucher, invoiceDate: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                            <label className={labelClass}>Nguồn gốc / Loại hình nhập</label>
                            <select className={inputClass} value={voucher.origin} onChange={e => setVoucher({...voucher, origin: e.target.value})}>
                                <option>Nhập mua từ NCC</option>
                                <option>Nhập từ kho tổng</option>
                                <option>Hàng tặng / Tài trợ</option>
                                <option>Nhập trả từ khoa</option>
                                <option>Nhập vay / mượn</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Khối 2: Thông tin đối tác & Giao nhận */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <SectionTitle icon={TruckIcon} title="Giao nhận & Đối tác" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className={labelClass}>Nhà cung cấp <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <BuildingOfficeIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                                <select className={`${inputClass} pl-10`} value={voucher.supplier} onChange={e => setVoucher({...voucher, supplier: e.target.value})}>
                                    <option value="">-- Chọn đơn vị cung ứng --</option>
                                    <option>CÔNG TY CP DƯỢC TW 2</option>
                                    <option>DƯỢC HẬU GIANG (DHG)</option>
                                    <option>SANOFI VIETNAM</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Người giao hàng</label>
                            <input type="text" className={inputClass} value={voucher.deliverer} onChange={e => setVoucher({...voucher, deliverer: e.target.value})} placeholder="Tên tài xế/NV giao..." />
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Người nhận (Thủ kho)</label>
                            <input type="text" className={inputClass} value={voucher.receiver} onChange={e => setVoucher({...voucher, receiver: e.target.value})} placeholder="NV kiểm nhận..." />
                        </div>
                    </div>
                </div>

                {/* Khối 3: Kho & Tài chính */}
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <SectionTitle icon={ArchiveIcon} title="Kho & Thuế phí" />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className={labelClass}>Kho nhập <span className="text-red-500">*</span></label>
                            <select className={`${inputClass} border-blue-200 dark:border-blue-900 bg-blue-50/30 text-blue-700 dark:text-blue-300`} value={voucher.warehouse} onChange={e => setVoucher({...voucher, warehouse: e.target.value})}>
                                {mockWarehouses.map(w => <option key={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Thuế VAT (%)</label>
                            <div className="relative">
                                <input type="number" className={`${inputClass} pr-8`} value={voucher.vat} onChange={e => setVoucher({...voucher, vat: e.target.value})} />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400">%</span>
                            </div>
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>Chi phí vận chuyển</label>
                            <input type="number" className={inputClass} defaultValue={0} />
                        </div>
                        <div className="col-span-2">
                             <label className={labelClass}>Ghi chú chung</label>
                             <input type="text" className={inputClass} placeholder="Ghi chú cho cả phiếu..." />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- DETAIL ITEMS TABLE --- */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
                            {/* // Fixed missing ArrowDownTrayIcon export by using DownloadIcon */}
                            <DownloadIcon className="w-5 h-5"/>
                        </div>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Chi tiết mặt hàng nhập</h3>
                    </div>
                    <button className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition transform active:scale-95">
                        <PlusIcon className="w-4 h-4"/> Thêm mặt hàng (F2)
                    </button>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-[11px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-600">
                            <tr>
                                <th className="p-4 w-12 text-center">STT</th>
                                <th className="p-4">Tên hàng hóa / Hoạt chất</th>
                                <th className="p-4 w-20 text-center">ĐVT</th>
                                <th className="p-4 w-32">Số lô / Hạn dùng</th>
                                <th className="p-4 w-24 text-center">Số lượng</th>
                                <th className="p-4 w-32 text-right">Giá nhập (đ)</th>
                                <th className="p-4 w-32 text-right">Thành tiền</th>
                                <th className="p-4 w-12 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {voucher.items.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <td className="p-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{item.name}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.code}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase">{item.unit}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-mono text-xs text-blue-700 dark:text-blue-400 font-bold">{item.batch || 'LOT23-01'}</div>
                                        <div className="text-xs text-red-500 font-bold mt-1 uppercase">Exp: {item.exp}</div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <input type="number" defaultValue={item.qty} className="w-20 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded p-1 font-black text-blue-600 focus:ring-1 focus:ring-blue-500 outline-none" />
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-400">
                                        {item.price.toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right font-black text-slate-900 dark:text-white text-base">
                                        {(item.qty * item.price).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {voucher.items.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-24 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <ArchiveIcon className="w-16 h-16 text-slate-200 dark:text-slate-700"/>
                                            <p className="text-slate-400 font-medium text-lg">Chưa có mặt hàng nào. Nhấn <span className="font-bold text-blue-600">F2</span> hoặc nút "Thêm mặt hàng" bên trên.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 4. FOOTER TOTALS AREA */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0 shadow-inner">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng tiền hàng</span>
                        <span className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency(voucher.amount)}</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thuế VAT ({voucher.vat}%)</span>
                        <span className="text-xl font-black text-slate-800 dark:text-white">{formatCurrency((voucher.amount * voucher.vat) / 100)}</span>
                    </div>
                    <div className="md:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl border border-blue-500 shadow-xl text-white flex justify-between items-center">
                        <div>
                            <span className="text-[10px] font-black uppercase opacity-70 tracking-widest">Tổng tiền thanh toán</span>
                            <div className="text-3xl font-black">{formatCurrency(voucher.total)}</div>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/20">
                            {/* // Added missing CurrencyDollarIcon usage fix */}
                            <CurrencyDollarIcon className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptEditorView;
