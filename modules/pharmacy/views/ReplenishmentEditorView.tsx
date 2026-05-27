
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeftIcon, SaveIcon, PrinterIcon, TrashIcon, 
    PlusIcon, CheckCircleIcon, ArchiveIcon, UserCircleIcon, 
    DocumentTextIcon, PencilIcon, BanIcon, BuildingOfficeIcon,
    CalendarIcon, UserGroupIcon, XIcon, RefreshIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockReplenishments, mockWarehouses } from '../data';
import { pharmacyService } from '../../../services/pharmacyService';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import Combobox, { ComboboxColumn } from '../../../components/ui/Combobox';
import { drugList } from '../../consultation/data/catalogs';
import { DrugItem, PharmacyReplenishment } from '../../../types';
import { useNotification } from '../../../contexts/NotificationContext';

const ReplenishmentEditorView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { fontSettings } = useTheme();
    const { addNotification } = useNotification();
    
    // States
    const [voucher, setVoucher] = useState<PharmacyReplenishment | null>(null);
    const [originalData, setOriginalData] = useState<PharmacyReplenishment | null>(null);
    const [isEditable, setIsEditable] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchDrug, setSearchDrug] = useState('');

    const loadData = useCallback(async () => {
        if (id && id !== 'new') {
            try {
                // Giả lập gọi API hoặc lấy từ mockData
                const data = mockReplenishments.find(r => r.id === id);
                if (data) {
                    const cloned = JSON.parse(JSON.stringify(data));
                    setVoucher(cloned);
                    setOriginalData(JSON.parse(JSON.stringify(cloned)));
                    setIsEditable(false);
                } else {
                    addNotification("Lỗi", "Không tìm thấy hồ sơ bổ sung", "error", undefined, true);
                    navigate('/pharmacy/replenishments');
                }
            } catch (err) {
                addNotification("Lỗi", "Không thể tải dữ liệu", "error", undefined, true);
            }
        } else {
            // Khởi tạo phiếu mới
            const emptyVoucher: PharmacyReplenishment = {
                id: 'NEW-' + Date.now(),
                voucherNo: '',
                date: new Date().toISOString().slice(0, 10),
                fromWarehouse: 'KHO BHYT',
                toCabinet: 'TỦ TRỰC CẤP CỨU',
                deliverer: 'DS. Nguyễn Văn Giao',
                receiver: 'ĐD. Lê Thị Nhận',
                description: 'Bổ sung thuốc cấp cứu định kỳ',
                status: 'O',
                totalAmount: 0,
                items: []
            };
            setVoucher(emptyVoucher);
            setOriginalData(null);
            setIsEditable(true);
        }
    }, [id, addNotification, navigate]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleAddDrug = (val: string, item?: DrugItem) => {
        if (!item || !isEditable || !voucher) return;
        
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
        
        const updatedItems = [newItem, ...voucher.items];
        setVoucher({ 
            ...voucher, 
            items: updatedItems,
            totalAmount: updatedItems.reduce((sum, i) => sum + i.total, 0)
        });
        setSearchDrug('');
    };

    const updateItemQty = (itemId: string, qty: number) => {
        if (!voucher || !isEditable) return;
        const updatedItems = voucher.items.map(i => 
            i.id === itemId ? { ...i, quantity: qty, total: qty * i.price } : i
        );
        setVoucher({ 
            ...voucher, 
            items: updatedItems,
            totalAmount: updatedItems.reduce((sum, i) => sum + i.total, 0)
        });
    };

    const removeItem = (itemId: string) => {
        if (!voucher || !isEditable) return;
        const updatedItems = voucher.items.filter(i => i.id !== itemId);
        setVoucher({ 
            ...voucher, 
            items: updatedItems,
            totalAmount: updatedItems.reduce((sum, i) => sum + i.total, 0)
        });
    };

    const handleSave = async () => {
        if (!voucher) return;
        if (voucher.items.length === 0) {
            addNotification("Cảnh báo", "Vui lòng chọn danh mục thuốc cần bổ sung.", "warning", undefined, true);
            return;
        }

        setIsSaving(true);
        try {
            const saved = await pharmacyService.saveReplenishment(voucher);
            addNotification("Thành công", "Đã lưu phiếu cấp bổ sung tủ trực.", "success", undefined, true);
            setVoucher(saved);
            setOriginalData(JSON.parse(JSON.stringify(saved)));
            setIsEditable(false);
            if (id === 'new') navigate(`/pharmacy/replenishment/edit/${saved.id}`, { replace: true });
        } catch (err) {
            addNotification("Lỗi", "Lỗi kết nối cơ sở dữ liệu.", "error", undefined, true);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (id === 'new') {
            navigate('/pharmacy/replenishments');
        } else if (originalData) {
            setVoucher(JSON.parse(JSON.stringify(originalData)));
            setIsEditable(false);
        }
    };

    const handleDelete = async () => {
        if (!id || id === 'new') return;
        if (window.confirm("Xác nhận xóa phiếu cấp này? Hàng trong tủ trực sẽ được hoàn lại kho nguồn.")) {
            try {
                await pharmacyService.deleteReplenishment(id);
                addNotification("Thành công", "Đã xóa phiếu bổ sung.", "success", undefined, true);
                navigate('/pharmacy/replenishments');
            } catch (err) {
                addNotification("Lỗi", "Không thể xóa phiếu lúc này.", "error", undefined, true);
            }
        }
    };

    if (!voucher) return <div className="p-10 text-center text-slate-400 animate-pulse font-bold uppercase">Đang nạp hồ sơ...</div>;

    const inputClass = "w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all disabled:bg-slate-50 disabled:text-slate-500 dark:disabled:bg-slate-800";
    const labelClass = "block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-1 tracking-widest";

    const drugColumns: ComboboxColumn<DrugItem>[] = [
        { key: 'code', label: 'Mã', width: '20%', className: 'font-mono text-[10px]' },
        { key: 'name', label: 'Tên thuốc', width: '60%', className: 'font-bold' },
        { key: 'stock', label: 'Tồn', width: '20%', className: 'text-right font-bold text-blue-600' }
    ];

    return (
        <div className="h-full flex flex-col gap-3 animate-fade-in p-1">
            {/* Toolbar */}
            <div className="bg-[#fdf2f8] dark:bg-slate-800 p-2.5 rounded-2xl border border-pink-200 dark:border-slate-700 flex flex-wrap gap-2 shadow-sm shrink-0">
                <button 
                    onClick={() => navigate('/pharmacy/replenishment/new')}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95"
                >
                    <PlusIcon className="w-4 h-4"/> <u>T</u>hêm
                </button>
                <button 
                    disabled={isEditable}
                    onClick={() => setIsEditable(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 disabled:opacity-50"
                >
                    <PencilIcon className="w-4 h-4"/> <u>S</u>ửa
                </button>
                <button 
                    disabled={id === 'new'}
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 disabled:opacity-50"
                >
                    <TrashIcon className="w-4 h-4"/> <u>X</u>óa
                </button>
                <div className="w-px h-8 bg-slate-300 dark:bg-slate-600 mx-1 hidden sm:block"></div>
                <button 
                    disabled={!isEditable || isSaving}
                    onClick={handleSave}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? <RefreshIcon className="w-4 h-4 animate-spin"/> : <SaveIcon className="w-4 h-4"/>}
                    <u>L</u>ưu
                </button>
                <button 
                    disabled={!isEditable}
                    onClick={handleCancel}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-slate-200 transition active:scale-95 disabled:opacity-50"
                >
                    <BanIcon className="w-4 h-4"/> <u>H</u>uỷ
                </button>
                <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-slate-50 transition active:scale-95">
                    <PrinterIcon className="w-4 h-4"/> <u>I</u>n
                </button>
                <div className="w-px h-8 bg-slate-300 dark:bg-slate-600 mx-1 hidden sm:block"></div>
                <button 
                    disabled={voucher.status === 'A'}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/30 transition active:scale-95 disabled:opacity-50"
                >
                    <CheckCircleIcon className="w-4 h-4"/> <u>D</u>uyệt cấp
                </button>
                <button onClick={() => navigate('/pharmacy/replenishments')} className="ml-auto p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full shadow-sm hover:bg-slate-100 transition"><XIcon className="w-5 h-5 text-slate-400"/></button>
            </div>

            {/* Thông tin phiếu 3 phân vùng */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-2">
                             <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><DocumentTextIcon className="w-4 h-4"/></div>
                             <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">Hành chính phiếu</h4>
                        </div>
                        <div>
                            <label className={labelClass}>Số phiếu cấp (Hệ thống)</label>
                            <input type="text" className={`${inputClass} font-mono text-pink-600`} value={voucher.voucherNo || 'BS-TỰ ĐỘNG'} readOnly />
                        </div>
                        <div>
                            <label className={labelClass}>Ngày yêu cầu cấp bổ sung</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10"/>
                                <input 
                                    type="date" 
                                    className={`${inputClass} pl-9`} 
                                    value={voucher.date} 
                                    disabled={!isEditable}
                                    onChange={e => setVoucher({...voucher, date: e.target.value})} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-2">
                             <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg"><BuildingOfficeIcon className="w-4 h-4"/></div>
                             <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">Luồng hàng hóa</h4>
                        </div>
                        <div>
                            <label className={labelClass}>Từ kho nguồn (Kho chẵn/lẻ)</label>
                            <select 
                                className={`${inputClass} text-blue-600`} 
                                value={voucher.fromWarehouse} 
                                disabled={!isEditable}
                                onChange={e => setVoucher({...voucher, fromWarehouse: e.target.value})}
                            >
                                {mockWarehouses.filter(w => w.type !== 'Tủ trực').map(w => <option key={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Đến tủ trực / Cơ số khoa</label>
                            <select 
                                className={`${inputClass} text-pink-600`} 
                                value={voucher.toCabinet} 
                                disabled={!isEditable}
                                onChange={e => setVoucher({...voucher, toCabinet: e.target.value})}
                            >
                                {mockWarehouses.filter(w => w.type === 'Tủ trực').map(w => <option key={w.id}>{w.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-2">
                             <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg"><UserGroupIcon className="w-4 h-4"/></div>
                             <h4 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase">Nhân sự thực hiện</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Dược sĩ giao</label>
                                <input 
                                    type="text" 
                                    className={inputClass} 
                                    value={voucher.deliverer} 
                                    disabled={!isEditable}
                                    onChange={e => setVoucher({...voucher, deliverer: e.target.value})} 
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Điều dưỡng nhận</label>
                                <input 
                                    type="text" 
                                    className={inputClass} 
                                    value={voucher.receiver} 
                                    disabled={!isEditable}
                                    onChange={e => setVoucher({...voucher, receiver: e.target.value})} 
                                />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Lý do bổ sung / Diễn giải</label>
                            <input 
                                type="text" 
                                className={inputClass} 
                                value={voucher.description} 
                                disabled={!isEditable}
                                onChange={e => setVoucher({...voucher, description: e.target.value})} 
                                placeholder="VD: Bổ sung định kỳ tuần..." 
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bảng kê thuốc chi tiết */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 font-black text-slate-700 dark:text-white uppercase text-[11px] whitespace-nowrap">
                        <div className="w-8 h-8 bg-pink-600 rounded-lg flex items-center justify-center text-white shadow-md">
                            <ArchiveIcon className="w-5 h-5"/>
                        </div>
                        Danh mục hàng hóa cấp bổ sung
                    </div>
                    <div className="flex-1 relative z-30 w-full max-w-3xl">
                        <Combobox<DrugItem>
                            placeholder="Gõ tên thuốc để thêm nhanh vào danh sách cấp (F2)..."
                            value={searchDrug}
                            onChange={handleAddDrug}
                            options={drugList}
                            columns={drugColumns}
                            displayValue={item => item.name}
                            disabled={!isEditable}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-[#f1f5f9] dark:bg-slate-700 text-slate-600 dark:text-slate-300 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-600">
                            <tr>
                                <th className="p-3 w-12 text-center border-r border-slate-200 dark:border-slate-600">STT</th>
                                <th className="p-3 border-r border-slate-200 dark:border-slate-600">Tên thuốc / Hàm lượng</th>
                                <th className="p-3 w-20 text-center border-r border-slate-200 dark:border-slate-600">ĐVT</th>
                                <th className="p-3 w-32 text-center border-r border-slate-200 dark:border-slate-600">Số lô / Hạn dùng</th>
                                <th className="p-3 w-24 text-center border-r border-slate-200 dark:border-slate-600 bg-blue-50/50 dark:bg-blue-900/20">SL Cấp</th>
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
                                        <div className="text-[11px] font-mono font-bold text-blue-600">LOT-BS-23</div>
                                        <div className="text-[10px] text-red-500 font-bold uppercase">{item.expiryDate}</div>
                                    </td>
                                    <td className="p-3 text-center bg-blue-50/20 dark:bg-blue-900/10 border-r border-slate-100 dark:border-slate-700/50">
                                        <input 
                                            type="number" 
                                            value={item.quantity} 
                                            disabled={!isEditable}
                                            onChange={e => updateItemQty(item.id, parseFloat(e.target.value) || 0)}
                                            className="w-16 text-center font-black text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded p-1 outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-transparent disabled:border-transparent" 
                                        />
                                    </td>
                                    <td className="p-3 text-right border-r border-slate-100 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 font-mono">{item.price.toLocaleString()}</td>
                                    <td className="p-3 text-right border-r border-slate-100 dark:border-slate-700/50 font-black text-slate-900 dark:text-white text-base">
                                        {item.total.toLocaleString()}
                                    </td>
                                    <td className="p-3 text-center">
                                        {isEditable && (
                                            <button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {voucher.items.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <ArchiveIcon className="w-16 h-16 text-slate-100 dark:text-slate-700"/>
                                            <p className="text-slate-400 font-medium italic">Chưa có thuốc trong danh sách cấp. Thêm thuốc để bắt đầu.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-[#f8fafc] dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0 shadow-inner">
                    <div className="flex gap-6">
                        <div className="text-xs font-bold text-slate-500 uppercase">Mặt hàng: <span className="text-slate-800 dark:text-white font-black">{voucher.items.length}</span></div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-black uppercase text-slate-500 tracking-tighter">Tổng giá trị cấp bổ sung:</span>
                        <div className="bg-pink-600 text-white px-6 py-2 rounded-xl shadow-lg shadow-pink-500/30 font-black text-2xl tracking-tight">
                            {formatCurrency(voucher.totalAmount).replace(' đ','')} <span className="text-xs font-normal opacity-70">đ</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReplenishmentEditorView;
