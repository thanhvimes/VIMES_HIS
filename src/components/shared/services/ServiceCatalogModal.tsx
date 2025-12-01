
import React, { useState, useMemo, useEffect } from 'react';
import { XIcon, SearchIcon, PlusIcon, CheckIcon } from '../../Icons';
import { ServiceItem, serviceCategories, serviceList } from '../../../modules/consultation/data/catalogs';

interface ServiceCatalogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selectedItems: ServiceItem[]) => void;
}

const ServiceCatalogModal: React.FC<ServiceCatalogModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(serviceCategories[0]?.id || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            setSelectedItems(new Set());
            setSearchQuery('');
            setSelectedCategoryId(serviceCategories[0]?.id || '');
        }
    }, [isOpen]);

    const filteredItems = useMemo(() => {
        return serviceList.filter(item => {
            const matchesCategory = selectedCategoryId ? item.categoryId === selectedCategoryId : true;
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.code.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [selectedCategoryId, searchQuery]);

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        serviceList.forEach(item => {
            if (selectedItems.has(item.id)) counts[item.categoryId] = (counts[item.categoryId] || 0) + 1;
        });
        return counts;
    }, [selectedItems]);

    const handleToggleItem = (itemId: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(itemId)) newSet.delete(itemId); else newSet.add(itemId);
        setSelectedItems(newSet);
    };

    const handleConfirm = () => {
        const items = serviceList.filter(item => selectedItems.has(item.id));
        onSelect(items);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-2 md:p-4">
            <div className="bg-white dark:bg-slate-800 w-full h-full max-h-[90vh] md:max-w-5xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                        <PlusIcon className="w-5 h-5 text-blue-600"/> Chỉ định Cận lâm sàng
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><XIcon className="w-6 h-6"/></button>
                </div>
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-y-auto">
                        <div className="p-2 space-y-1">
                            {serviceCategories.map(cat => (
                                <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className={`w-full text-left px-3 py-3 rounded-lg text-sm font-medium transition-all flex justify-between items-center ${selectedCategoryId === cat.id ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm border-l-4 border-blue-500' : 'text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-700/50'}`}>
                                    <span>{cat.name}</span>
                                    {categoryCounts[cat.id] ? <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">{categoryCounts[cat.id]}</span> : null}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"/>
                                <input type="text" placeholder="Tìm kiếm dịch vụ (Tên, Mã)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            </div>
                        </div>
                        <div className="flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            <div className="w-12 text-center">Chọn</div>
                            <div className="w-20">Mã</div>
                            <div className="flex-1">Tên dịch vụ</div>
                            <div className="w-24 text-right">Đơn giá</div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {filteredItems.length > 0 ? filteredItems.map(item => {
                                const isSelected = selectedItems.has(item.id);
                                return (
                                    <div key={item.id} onClick={() => handleToggleItem(item.id)} className={`flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                        <div className="w-12 text-center flex justify-center">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'}`}>
                                                {isSelected && <CheckIcon className="w-3.5 h-3.5"/>}
                                            </div>
                                        </div>
                                        <div className="w-20 text-sm font-mono text-slate-500 dark:text-slate-400">{item.code}</div>
                                        <div className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{item.name}</div>
                                        <div className="w-24 text-right text-sm font-bold text-slate-700 dark:text-slate-300">{item.price.toLocaleString('vi-VN')}</div>
                                    </div>
                                );
                            }) : (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400"><SearchIcon className="w-12 h-12 mb-2 opacity-20"/><p>Không tìm thấy dịch vụ nào.</p></div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <div className="text-sm text-slate-600 dark:text-slate-300">Đã chọn: <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">{selectedItems.size}</span> dịch vụ</div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 transition">Hủy</button>
                        <button onClick={handleConfirm} disabled={selectedItems.size === 0} className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"><CheckIcon className="w-4 h-4"/> Đồng ý</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ServiceCatalogModal;