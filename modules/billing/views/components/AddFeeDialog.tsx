
import React, { useState, useMemo } from 'react';
import { 
    XIcon, 
    SearchIcon, 
    PlusIcon, 
    CheckIcon, 
    TrashIcon, 
    CubeIcon, 
    BeakerIcon, 
    PhotographIcon, 
    ActivityIcon 
} from '../../../../components/Icons';
import { serviceList, ServiceItem } from '../../../consultation/data/catalogs';
import { BillingItem } from './BillingItemsTable';
import { useTheme } from '../../../../contexts/ThemeContext';

interface AddFeeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (items: Partial<BillingItem>[]) => void;
}

interface SelectedItem extends ServiceItem {
    qty: number;
}

const AddFeeDialog: React.FC<AddFeeDialogProps> = ({ isOpen, onClose, onAdd }) => {
    const { fontSettings } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
    const [filterCategory, setFilterCategory] = useState('All');

    // Reset state on open
    React.useEffect(() => {
        if (isOpen) {
            setSearchTerm('');
            setSelectedItems([]);
            setFilterCategory('All');
        }
    }, [isOpen]);

    const filteredCatalog = useMemo(() => {
        return serviceList.filter(item => {
            const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                item.code.toLowerCase().includes(searchTerm.toLowerCase());
            // Mock category mapping based on ID prefix or hardcoded logic for demo
            let category = 'Khác';
            if (item.categoryId.includes('XN')) category = 'Xét nghiệm';
            if (item.categoryId.includes('CDHA') || item.categoryId.includes('XQ') || item.categoryId.includes('SA')) category = 'CĐHA';
            
            const matchCategory = filterCategory === 'All' || 
                                  (filterCategory === 'XN' && category === 'Xét nghiệm') ||
                                  (filterCategory === 'CDHA' && category === 'CĐHA');

            return matchSearch && matchCategory;
        });
    }, [searchTerm, filterCategory]);

    const handleSelectItem = (item: ServiceItem) => {
        setSelectedItems(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...item, qty: 1 }];
        });
    };

    const handleRemoveItem = (id: string) => {
        setSelectedItems(prev => prev.filter(i => i.id !== id));
    };

    const handleUpdateQty = (id: string, delta: number) => {
        setSelectedItems(prev => prev.map(i => {
            if (i.id === id) {
                const newQty = Math.max(1, i.qty + delta);
                return { ...i, qty: newQty };
            }
            return i;
        }));
    };

    const handleConfirm = () => {
        const billingItems: Partial<BillingItem>[] = selectedItems.map(item => ({
            name: item.name,
            category: item.categoryId.includes('XN') ? 'Xét nghiệm' : item.categoryId.includes('CDHA') ? 'CĐHA' : 'Dịch vụ',
            unit: item.unit,
            quantity: item.qty,
            unitPrice: item.price,
            totalPrice: item.price * item.qty,
            status: 'unpaid'
        }));
        onAdd(billingItems);
        onClose();
    };

    const totalAmount = selectedItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    if (!isOpen) return null;

    const getIcon = (catId: string) => {
        if (catId.includes('XN')) return <BeakerIcon className="w-4 h-4 text-blue-500"/>;
        if (catId.includes('CDHA') || catId.includes('XQ') || catId.includes('SA')) return <PhotographIcon className="w-4 h-4 text-purple-500"/>;
        return <ActivityIcon className="w-4 h-4 text-teal-500"/>;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-6xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-700">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <CubeIcon className="w-6 h-6 text-blue-600"/> Thêm Chỉ định / Chi phí
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Chọn dịch vụ từ danh mục để thêm vào hồ sơ viện phí.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    
                    {/* LEFT: CATALOG LIST */}
                    <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-700 min-w-[300px]">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                                <input 
                                    type="text" 
                                    placeholder="Tìm tên dịch vụ, mã..." 
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className={`w-full pl-10 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-2">
                                {['All', 'XN', 'CDHA'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(cat)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                                            filterCategory === cat 
                                            ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {cat === 'All' ? 'Tất cả' : cat === 'XN' ? 'Xét nghiệm' : 'Chẩn đoán hình ảnh'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900/50 space-y-1 custom-scrollbar">
                            {filteredCatalog.map(item => (
                                <div 
                                    key={item.id}
                                    onClick={() => handleSelectItem(item)}
                                    className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:border-blue-400 hover:shadow-sm transition-all group"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex-shrink-0 w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                            {getIcon(item.categoryId)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{item.name}</div>
                                            <div className="text-xs text-slate-500 font-mono">{item.code}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{item.price.toLocaleString()}</span>
                                        <button className="p-1.5 bg-blue-50 text-blue-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100">
                                            <PlusIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: SELECTED LIST */}
                    <div className="w-96 bg-slate-50 dark:bg-slate-900 flex flex-col shadow-inner">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase">Dịch vụ đã chọn ({selectedItems.length})</h3>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {selectedItems.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 text-sm italic">
                                    Chưa chọn dịch vụ nào.
                                </div>
                            ) : (
                                selectedItems.map(item => (
                                    <div key={item.id} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200 line-clamp-2">{item.name}</span>
                                            <button onClick={() => handleRemoveItem(item.id)} className="text-slate-400 hover:text-red-500 ml-2">
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded overflow-hidden bg-white dark:bg-slate-700">
                                                <button 
                                                    onClick={() => handleUpdateQty(item.id, -1)}
                                                    className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
                                                >
                                                    -
                                                </button>
                                                <span className="px-2 text-sm font-bold min-w-[30px] text-center">{item.qty}</span>
                                                <button 
                                                    onClick={() => handleUpdateQty(item.id, 1)}
                                                    className="px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                                                {(item.price * item.qty).toLocaleString()} đ
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer Summary */}
                        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-bold text-slate-500 uppercase">Tổng cộng:</span>
                                <span className="text-xl font-black text-blue-700 dark:text-blue-400">{totalAmount.toLocaleString()} đ</span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={onClose} className="flex-1 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 transition">
                                    Hủy
                                </button>
                                <button 
                                    onClick={handleConfirm}
                                    disabled={selectedItems.length === 0}
                                    className="flex-[2] py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-transform active:scale-95"
                                >
                                    <CheckIcon className="w-5 h-5"/> Thêm vào phiếu
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddFeeDialog;
