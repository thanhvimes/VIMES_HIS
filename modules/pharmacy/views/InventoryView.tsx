import React, { useState, useMemo } from 'react';
import { 
    SearchIcon, PlusIcon, ExclamationCircleIcon, CheckIcon, 
    BanIcon, ArchiveIcon, CurrencyDollarIcon, FilterIcon,
    PrinterIcon, DocumentArrowDownIcon, ClockIcon, CubeIcon,
    ChevronDownIcon, XCircleIcon, CheckCircleIcon, PencilIcon,
    XIcon, SaveIcon, MapPinIcon, BuildingOfficeIcon, RefreshIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockWarehouses } from '../data';

// --- ĐỊNH NGHĨA DỮ LIỆU TỒN KHO NÂNG CAO ---
interface InventoryItem {
    id: string;
    code: string;
    name: string;
    activeIngredient: string;
    spec: string; // Quy cách
    unit: string;
    manufacturer: string; // Hãng sản xuất
    location: string; // Vị trí trong kho (Kệ/Hàng)
    category: string;
    batchNumber: string;
    expiryDate: string;
    stock: number;
    minStock: number;
    importPrice: number;
    retailPrice: number; // Giá bán lẻ
    warehouseId: string;
}

const mockInventory: InventoryItem[] = [
    { id: '1', code: 'P001', name: 'Paracetamol 500mg', activeIngredient: 'Paracetamol', spec: 'Hộp 10 vỉ x 10 viên', unit: 'Viên', manufacturer: 'Dược Hậu Giang', location: 'Kệ A-01', category: 'Giảm đau', batchNumber: 'LOT23001', expiryDate: '2025-12-30', stock: 1200, minStock: 500, importPrice: 500, retailPrice: 800, warehouseId: '1' },
    { id: '2', code: 'A002', name: 'Augmentin 1g', activeIngredient: 'Amoxicillin + Clavulanic', spec: 'Hộp 14 viên', unit: 'Viên', manufacturer: 'GSK (Anh)', location: 'Tủ lạnh B-02', category: 'Kháng sinh', batchNumber: 'AUG992', expiryDate: '2024-02-15', stock: 45, minStock: 100, importPrice: 15000, retailPrice: 18500, warehouseId: '1' },
    { id: '3', code: 'G003', name: 'Ginkgo Biloba 120mg', activeIngredient: 'Ginkgo', spec: 'Hộp 30 viên', unit: 'Viên', manufacturer: 'Nature Gift (Mỹ)', location: 'Kệ C-05', category: 'Bổ não', batchNumber: 'GK220', expiryDate: '2023-11-20', stock: 250, minStock: 50, importPrice: 2500, retailPrice: 4000, warehouseId: '2' },
    { id: '4', code: 'O004', name: 'Omeprazol 20mg', activeIngredient: 'Omeprazol', spec: 'Lọ 14 viên', unit: 'Viên', manufacturer: 'Dược TW 1', location: 'Kệ A-12', category: 'Dạ dày', batchNumber: 'OMP44', expiryDate: '2026-05-10', stock: 0, minStock: 200, importPrice: 1200, retailPrice: 1800, warehouseId: '2' },
    { id: '5', code: 'V005', name: 'Vitamin C 500mg', activeIngredient: 'Ascorbic Acid', spec: 'Hộp 100 viên', unit: 'Viên', manufacturer: 'Vidipha', location: 'Kệ D-03', category: 'Vitamin', batchNumber: 'VIT-C', expiryDate: '2024-05-15', stock: 800, minStock: 300, importPrice: 800, retailPrice: 1200, warehouseId: '1' },
];

const InventoryView: React.FC = () => {
    const { fontSettings, theme } = useTheme();
    
    // States
    const [selectedWarehouse, setSelectedWarehouse] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'expiring' | 'expired'>('all');
    
    // Modal State
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // --- LOGIC LỌC DỮ LIỆU ---
    const filteredInventory = useMemo(() => {
        const now = new Date();
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(now.getMonth() + 3);

        return mockInventory.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesWh = selectedWarehouse === 'All' || item.warehouseId === selectedWarehouse;
            
            const expDate = new Date(item.expiryDate);
            const isExpired = expDate < now;
            const isExpiring = expDate >= now && expDate <= threeMonthsLater;
            const isLow = item.stock <= item.minStock && item.stock > 0;

            if (!matchesSearch || !matchesWh) return false;

            if (filterStatus === 'low') return isLow || item.stock === 0;
            if (filterStatus === 'expiring') return isExpiring;
            if (filterStatus === 'expired') return isExpired;

            return true;
        });
    }, [searchTerm, selectedWarehouse, filterStatus]);

    // --- THỐNG KÊ NHANH ---
    const stats = useMemo(() => {
        const now = new Date();
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(now.getMonth() + 3);

        return filteredInventory.reduce((acc, item) => {
            const expDate = new Date(item.expiryDate);
            acc.totalValue += item.stock * item.importPrice;
            if (item.stock <= item.minStock) acc.lowStock++;
            if (expDate < now) acc.expired++;
            else if (expDate <= threeMonthsLater) acc.expiringSoon++;
            return acc;
        }, { totalValue: 0, lowStock: 0, expired: 0, expiringSoon: 0 });
    }, [filteredInventory]);

    const getStatusInfo = (item: InventoryItem) => {
        const now = new Date();
        const expDate = new Date(item.expiryDate);
        const threeMonthsLater = new Date();
        threeMonthsLater.setMonth(now.getMonth() + 3);

        if (item.stock === 0) return { label: 'Hết hàng', color: 'bg-red-100 text-red-700 border-red-200', icon: <BanIcon className="w-3 h-3"/> };
        if (expDate < now) return { label: 'Hết hạn', color: 'bg-slate-200 text-slate-700 border-slate-300', icon: <XCircleIcon className="w-3 h-3"/> };
        if (expDate <= threeMonthsLater) return { label: 'Sắp hết hạn', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: <ClockIcon className="w-3 h-3"/> };
        if (item.stock <= item.minStock) return { label: 'Sắp hết hàng', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: <ExclamationCircleIcon className="w-3 h-3"/> };
        return { label: 'An toàn', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckIcon className="w-3 h-3"/> };
    };

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // Giả lập lưu API
        setTimeout(() => {
            setIsSaving(false);
            setEditingItem(null);
            alert('Đã cập nhật thông tin mặt hàng thành công!');
        }, 800);
    };

    return (
        <div className="h-full flex flex-col gap-5 animate-fade-in">
            
            {/* 1. TOP INFO BAR: STATS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-blue-500 flex justify-between items-center transition-transform hover:scale-[1.02]">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Giá trị tồn kho</p>
                        <p className="text-xl font-black text-slate-800 dark:text-white mt-1">{stats.totalValue.toLocaleString()}đ</p>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600"><CurrencyDollarIcon className="w-6 h-6"/></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-red-500 flex justify-between items-center transition-transform hover:scale-[1.02]">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mục sắp hết hàng</p>
                        <p className="text-xl font-black text-red-600 mt-1">{stats.lowStock} <span className="text-xs font-normal text-slate-400">mặt hàng</span></p>
                    </div>
                    <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600"><ExclamationCircleIcon className="w-6 h-6"/></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-orange-500 flex justify-between items-center transition-transform hover:scale-[1.02]">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mục sắp hết hạn</p>
                        <p className="text-xl font-black text-orange-600 mt-1">{stats.expiringSoon} <span className="text-xs font-normal text-slate-400">mặt hàng</span></p>
                    </div>
                    <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600"><ClockIcon className="w-6 h-6"/></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border-l-4 border-emerald-500 flex justify-between items-center transition-transform hover:scale-[1.02]">
                    <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tỷ lệ chính xác</p>
                        <p className="text-xl font-black text-emerald-600 mt-1">99.8%</p>
                    </div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-emerald-600"><CheckCircleIcon className="w-6 h-6"/></div>
                </div>
            </div>

            {/* 2. FILTER & TOOLBAR */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-center gap-4 flex-shrink-0">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    {/* Chọn Kho */}
                    <div className="relative min-w-[220px]">
                        <label className="absolute -top-2 left-3 px-1 bg-white dark:bg-slate-800 text-[10px] font-black text-blue-600 z-10 uppercase">Kho hiện tại</label>
                        <div className="relative">
                            <CubeIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                            <select 
                                value={selectedWarehouse}
                                onChange={e => setSelectedWarehouse(e.target.value)}
                                className={`w-full pl-9 pr-8 p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 appearance-none font-bold text-sm ${fontSettings.controls} shadow-sm`}
                            >
                                <option value="All">--- Tất cả các kho ---</option>
                                {mockWarehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                            </select>
                            <ChevronDownIcon className="absolute right-3 top-3.5 w-3 h-3 text-slate-400 pointer-events-none"/>
                        </div>
                    </div>

                    {/* Tìm kiếm */}
                    <div className="relative flex-1 min-w-[300px]">
                        <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm tên thuốc, hoạt chất, hãng sản xuất..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 p-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 text-sm ${fontSettings.controls} shadow-sm`}
                        />
                    </div>
                </div>

                <div className="flex gap-2 w-full lg:w-auto shrink-0">
                    <button className="flex-1 lg:flex-none px-5 py-2.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition shadow-sm">
                        <PrinterIcon className="w-4 h-4"/> In bảng kê
                    </button>
                    <button className="flex-1 lg:flex-none px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95">
                        <DocumentArrowDownIcon className="w-4 h-4"/> Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* 3. QUICK STATUS TABS */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                {[
                    { id: 'all', label: 'Tất cả mặt hàng', color: 'blue' },
                    { id: 'low', label: 'Sắp hết / Hết hàng', color: 'red' },
                    { id: 'expiring', label: 'Cần xử lý hạn (3T)', color: 'orange' },
                    { id: 'expired', label: 'Đã hết hạn', color: 'slate' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilterStatus(tab.id as any)}
                        className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border-2
                            ${filterStatus === tab.id 
                                ? `bg-${tab.color}-600 border-${tab.color}-600 text-white shadow-md` 
                                : `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-${tab.color}-300 hover:text-${tab.color}-600`
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 4. DATA TABLE */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-black uppercase sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 w-12 text-center">Mã</th>
                                <th className="p-4">Tên thuốc / Hoạt chất</th>
                                <th className="p-4">Quy cách</th>
                                <th className="p-4">Hãng sản xuất</th>
                                <th className="p-4">Vị trí</th>
                                <th className="p-4 text-right">Giá bán</th>
                                <th className="p-4 text-right">Tồn thực tế</th>
                                <th className="p-4 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredInventory.length === 0 ? (
                                <tr><td colSpan={8} className="p-20 text-center text-slate-400 italic">Không tìm thấy dữ liệu phù hợp.</td></tr>
                            ) : (
                                filteredInventory.map(item => {
                                    const status = getStatusInfo(item);
                                    return (
                                        <tr 
                                            key={item.id} 
                                            onClick={() => setEditingItem(item)}
                                            className="hover:bg-blue-50/50 dark:hover:bg-slate-700/30 transition-colors group cursor-pointer"
                                        >
                                            <td className="p-4 font-mono text-slate-400 text-[11px] group-hover:text-blue-600 transition-colors">{item.code}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800 dark:text-white group-hover:underline decoration-blue-500 decoration-2 underline-offset-4">{item.name}</div>
                                                <div className="text-[10px] text-slate-500 italic mt-0.5">{item.activeIngredient}</div>
                                            </td>
                                            <td className="p-4 text-slate-600 dark:text-slate-400 text-xs">{item.spec}</td>
                                            <td className="p-4 text-slate-700 dark:text-slate-300">
                                                <div className="flex items-center gap-2">
                                                    <BuildingOfficeIcon className="w-3.5 h-3.5 text-slate-400"/>
                                                    <span className="text-xs font-medium">{item.manufacturer}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg w-fit text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                                    <MapPinIcon className="w-3 h-3"/> {item.location}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {item.retailPrice.toLocaleString()}
                                            </td>
                                            <td className={`p-4 text-right font-black text-base ${item.stock <= item.minStock ? 'text-red-600' : 'text-blue-600 dark:text-blue-400'}`}>
                                                {item.stock.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase border transition-all hover:scale-105 ${status.color}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* FOOTER SUMMARY */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs font-bold text-slate-500 shrink-0">
                    <div className="flex items-center gap-4">
                        <span>Hiển thị {filteredInventory.length} mặt hàng</span>
                        <div className="h-4 w-px bg-slate-300"></div>
                        <span className="text-orange-500">Hết hàng: {mockInventory.filter(i => i.stock === 0).length}</span>
                    </div>
                    <div className="flex gap-4">
                        <span className="text-slate-400 uppercase">Giá trị đang xem:</span>
                        <span className="text-blue-600 dark:text-blue-400 text-base">{filteredInventory.reduce((s,i) => s + (i.stock*i.importPrice), 0).toLocaleString()} đ</span>
                    </div>
                </div>
            </div>

            {/* 5. EDIT DIALOG (MODAL) */}
            {editingItem && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-slide-in-up border border-slate-200 dark:border-slate-700">
                        {/* Modal Header */}
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                                    <PencilIcon className="w-6 h-6"/>
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Cập nhật mặt hàng</h2>
                                    <p className="text-xs font-mono font-bold text-blue-600">{editingItem.code} - {editingItem.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><XIcon className="w-6 h-6"/></button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSaveEdit} className="p-8 flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Tồn kho thực tế (Kiểm kê)</label>
                                    <div className="relative">
                                        <CubeIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400"/>
                                        <input 
                                            type="number" 
                                            className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            defaultValue={editingItem.stock}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Định mức tối thiểu (Min)</label>
                                    <div className="relative">
                                        <ExclamationCircleIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400"/>
                                        <input 
                                            type="number" 
                                            className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                            defaultValue={editingItem.minStock}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Vị trí kệ / Ngăn</label>
                                    <div className="relative">
                                        <MapPinIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400"/>
                                        <input 
                                            type="text" 
                                            className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                            defaultValue={editingItem.location}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase mb-2">Giá bán lẻ (VNĐ)</label>
                                    <div className="relative">
                                        <CurrencyDollarIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400"/>
                                        <input 
                                            type="number" 
                                            className="w-full pl-10 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-bold text-lg text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                                            defaultValue={editingItem.retailPrice}
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl flex items-start gap-3">
                                <InfoIcon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0"/>
                                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                    <strong>Lưu ý:</strong> Việc thay đổi số lượng tồn trực tiếp sẽ được ghi lại trong nhật ký kiểm kê. Đối với thuốc BHYT, giá bán sẽ được áp dụng theo quy định thặng số của nhà nước.
                                </p>
                            </div>

                            <div className="flex gap-4 mt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingItem(null)} 
                                    className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 transition active:scale-95"
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSaving}
                                    className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-70"
                                >
                                    {isSaving ? <RefreshIcon className="w-5 h-5 animate-spin"/> : <SaveIcon className="w-5 h-5"/>}
                                    Lưu thay đổi (F9)
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- ICON HỖ TRỢ ---
const InfoIcon = ({ className }: { className: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default InventoryView;
