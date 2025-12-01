
import React, { useState, useMemo } from 'react';
import { PlusIcon, BeakerIcon, PhotographIcon, ActivityIcon, TrashIcon, SearchIcon, ScissorsIcon } from '../../Icons';
import { ServiceItem, serviceCategories } from '../../../modules/consultation/data/catalogs';
import { OperationRecord } from '../../../types';
import ServiceCatalogModal from './ServiceCatalogModal';
import ServiceTemplateModal from './ServiceTemplateModal';
import OperationFormModal from './OperationFormModal';
import { useTheme } from '../../../contexts/ThemeContext';

export interface ServiceOrder {
    id: string;
    name: string;
    type: 'XN' | 'CDHA' | 'TDCN' | 'PT' | 'TT';
    price: number;
    status: 'pending' | 'completed';
    notes?: string;
}

interface ServiceOrderingPanelProps {
    orders: ServiceOrder[];
    onOrdersChange: (orders: ServiceOrder[]) => void;
    allowOperations?: boolean;
}

const ServiceOrderingPanel: React.FC<ServiceOrderingPanelProps> = ({ orders, onOrdersChange, allowOperations = true }) => {
    const { fontSettings } = useTheme();
    const [isCatalogOpen, setIsCatalogOpen] = useState(false);
    const [isTemplateOpen, setIsTemplateOpen] = useState(false);
    const [isOperationOpen, setIsOperationOpen] = useState(false);
    const [operationType, setOperationType] = useState<'PT' | 'TT'>('PT');
    const [searchTerm, setSearchTerm] = useState('');

    const totalAmount = useMemo(() => orders.reduce((sum, o) => sum + (o.price || 0), 0), [orders]);
    const filteredOrders = useMemo(() => {
        if (!searchTerm) return orders;
        return orders.filter(o => o.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [orders, searchTerm]);

    const handleAddServices = (items: ServiceItem[]) => {
        const newOrders: ServiceOrder[] = items.map(item => {
            const category = serviceCategories.find(c => c.id === item.categoryId);
            const type = category?.type === 'CDHA' ? 'CDHA' : category?.type === 'TDCN' ? 'TDCN' : 'XN';
            return {
                id: `ORD-${Date.now()}-${Math.random()}`,
                name: item.name,
                type,
                price: item.price,
                status: 'pending'
            };
        });
        onOrdersChange([...orders, ...newOrders]);
    };

    const handleAddOperation = async (op: OperationRecord) => {
        const newOrder: ServiceOrder = {
            id: `OP-${Date.now()}`,
            name: op.serviceName,
            type: op.type,
            price: 0,
            status: 'pending',
            notes: `${op.mainSurgeon} - ${op.operationDate}`
        };
        onOrdersChange([...orders, newOrder]);
    };

    const handleRemove = (id: string) => {
        if(window.confirm("Xóa chỉ định này?")) {
            onOrdersChange(orders.filter(o => o.id !== id));
        }
    };

    const openOperationModal = (type: 'PT' | 'TT') => {
        setOperationType(type);
        setIsOperationOpen(true);
    };

    const getTypeBadge = (type: string) => {
        switch(type) {
            case 'XN': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">XN</span>;
            case 'CDHA': return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">CĐHA</span>;
            case 'PT': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">PT</span>;
            case 'TT': return <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded text-xs font-bold">TT</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">{type}</span>;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                    <input type="text" placeholder="Tìm trong danh sách đã chọn..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm ${fontSettings.controls}`} />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                    <button onClick={() => setIsCatalogOpen(true)} className="flex items-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold whitespace-nowrap transition shadow-sm">
                        <PlusIcon className="w-4 h-4"/> <span className="hidden sm:inline">Chỉ định</span> CLS
                    </button>
                    <button onClick={() => setIsTemplateOpen(true)} className="flex items-center gap-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold whitespace-nowrap transition shadow-sm">
                        <PlusIcon className="w-4 h-4"/> Gói
                    </button>
                    {allowOperations && (
                        <>
                            <button onClick={() => openOperationModal('TT')} className="flex items-center gap-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold whitespace-nowrap transition shadow-sm">
                                <ActivityIcon className="w-4 h-4"/> TT
                            </button>
                            <button onClick={() => openOperationModal('PT')} className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold whitespace-nowrap transition shadow-sm">
                                <ScissorsIcon className="w-4 h-4"/> PT
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-0">
                {filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-sm">
                        <BeakerIcon className="w-10 h-10 mb-2 opacity-20"/>
                        Chưa có dịch vụ nào được chỉ định.
                    </div>
                ) : (
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 uppercase sticky top-0 z-10">
                            <tr>
                                <th className="p-3 w-12 text-center">#</th>
                                <th className="p-3">Tên dịch vụ</th>
                                <th className="p-3 w-20 text-center">Loại</th>
                                <th className="p-3 text-right w-28">Đơn giá</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredOrders.map((order, idx) => (
                                <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                    <td className="p-3 text-center text-slate-400 text-xs">{idx + 1}</td>
                                    <td className="p-3">
                                        <div className="font-medium text-slate-800 dark:text-slate-200">{order.name}</div>
                                        {order.notes && <div className="text-xs text-slate-500 italic">{order.notes}</div>}
                                    </td>
                                    <td className="p-3 text-center">{getTypeBadge(order.type)}</td>
                                    <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">{order.price.toLocaleString()}</td>
                                    <td className="p-3 text-center">
                                        <button onClick={() => handleRemove(order.id)} className="text-slate-300 hover:text-red-500 transition">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                <span className="text-sm font-bold text-slate-500 uppercase">Tổng cộng:</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalAmount.toLocaleString()} đ</span>
            </div>

            <ServiceCatalogModal isOpen={isCatalogOpen} onClose={() => setIsCatalogOpen(false)} onSelect={handleAddServices} />
            <ServiceTemplateModal isOpen={isTemplateOpen} onClose={() => setIsTemplateOpen(false)} onSelect={handleAddServices} />
            <OperationFormModal isOpen={isOperationOpen} onClose={() => setIsOperationOpen(false)} initialData={{ id: '', type: operationType, serviceName: '', requestDate: new Date().toLocaleDateString('vi-VN'), operationType: '', operationDate: new Date().toISOString().split('T')[0], room: '', startTime: '', endTime: '', mainSurgeon: '', assistantSurgeons: '', anesthesiologist: '', nurses: '', technicians: '', method: '', steps: '', instruments: '', medications: '', images: [] }} onSubmit={handleAddOperation} />
        </div>
    );
};
export default ServiceOrderingPanel;