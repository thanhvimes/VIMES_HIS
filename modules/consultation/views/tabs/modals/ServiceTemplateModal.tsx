
import React, { useState, useEffect } from 'react';
import { XIcon, SearchIcon, DocumentTextIcon, CheckIcon } from '../../../../../components/Icons';
import { ServiceItem, ServiceTemplate, serviceTemplates, serviceList } from '../../../data/catalogs';

interface ServiceTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (selectedItems: ServiceItem[]) => void;
}

const ServiceTemplateModal: React.FC<ServiceTemplateModalProps> = ({ isOpen, onClose, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSelectedTemplateId(null);
        }
    }, [isOpen]);

    const filteredTemplates = serviceTemplates.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleApply = () => {
        if (!selectedTemplateId) return;
        
        const template = serviceTemplates.find(t => t.id === selectedTemplateId);
        if (template) {
            // Find all services belonging to this template
            const items = serviceList.filter(s => template.serviceIds.includes(s.id));
            onSelect(items);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up max-h-[80vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-purple-600"/>
                        Chọn Gói chỉ định (Template)
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm gói..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredTemplates.map(template => {
                            const isSelected = selectedTemplateId === template.id;
                            // Calculate total price for preview
                            const totalPrice = serviceList
                                .filter(s => template.serviceIds.includes(s.id))
                                .reduce((acc, curr) => acc + curr.price, 0);

                            return (
                                <div 
                                    key={template.id}
                                    onClick={() => setSelectedTemplateId(template.id)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between h-full relative ${
                                        isSelected 
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md' 
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-purple-300 dark:hover:border-slate-500'
                                    }`}
                                >
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 bg-purple-500 text-white p-1 rounded-full">
                                            <CheckIcon className="w-4 h-4"/>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className={`font-bold text-base mb-1 ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                            {template.name}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                                            {template.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                            {template.serviceIds.length} dịch vụ
                                        </span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                            {totalPrice.toLocaleString('vi-VN')} đ
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                 {/* Footer */}
                 <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 transition"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleApply}
                        disabled={!selectedTemplateId}
                        className="px-6 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                    >
                        <CheckIcon className="w-4 h-4"/>
                        Áp dụng gói
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServiceTemplateModal;
