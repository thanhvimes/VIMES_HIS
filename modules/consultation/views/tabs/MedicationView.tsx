
import React, { useState, useMemo } from 'react';
import { 
    ListBulletIcon, 
    ArchiveIcon, 
    PlusIcon, 
    TrashIcon, 
    PrinterIcon, 
    SaveIcon, 
    BanIcon, 
    ExclamationCircleIcon, 
    SearchIcon, 
    CheckIcon,
    DocumentPlusIcon
} from '../../../../components/Icons';
import Combobox, { ComboboxColumn } from '../../../../components/shared/Combobox';
import { drugList } from '../../data/catalogs';
import { Prescription, PrescriptionItem, DrugItem } from '../../../../types';
import { usePdfPreview } from '../../../../contexts/PdfPreviewContext';
import { useTheme } from '../../../../contexts/ThemeContext';

// --- Mock Data for History ---
const mockPrescriptionHistory: Prescription[] = [
    {
        id: 'XN001',
        date: '01/11/2023',
        doctorName: 'BS. Nguyễn Văn A',
        diagnosis: 'Viêm họng cấp',
        status: 'confirmed',
        warehouse: 'Kho BHYT',
        items: [
            {
                id: 'hist-1-1',
                drug: drugList[1], // Amoxicillin
                quantity: 15,
                morning: '1', noon: '1', afternoon: '1', night: '0',
                usageNote: 'Uống sau ăn',
                totalPrice: drugList[1].price * 15
            },
            {
                id: 'hist-1-2',
                drug: drugList[0], // Paracetamol
                quantity: 10,
                morning: '1', noon: '0', afternoon: '0', night: '1',
                usageNote: 'Khi đau/sốt',
                totalPrice: drugList[0].price * 10
            }
        ],
        totalAmount: (drugList[1].price * 15) + (drugList[0].price * 10)
    },
    {
        id: 'HA002',
        date: '02/11/2023',
        doctorName: 'BS. Phạm Văn Long',
        diagnosis: 'Rối loạn tiêu hóa',
        status: 'completed',
        warehouse: 'Kho Nội Trú',
        items: [
             {
                id: 'hist-2-1',
                drug: drugList[8], // Berberin
                quantity: 20,
                morning: '2', noon: '0', afternoon: '0', night: '2',
                usageNote: 'Uống trước ăn',
                totalPrice: drugList[8].price * 20
            },
             {
                id: 'hist-2-2',
                drug: drugList[9], // Oresol
                quantity: 5,
                morning: '0', noon: '0', afternoon: '0', night: '0',
                usageNote: 'Pha uống thay nước',
                totalPrice: drugList[9].price * 5
            }
        ],
        totalAmount: (drugList[8].price * 20) + (drugList[9].price * 5)
    }
];

const emptyPrescription: Prescription = {
    id: 'NEW-' + Date.now(),
    date: new Date().toLocaleDateString('vi-VN'),
    doctorName: 'BS. Current User', // Should come from auth
    diagnosis: '',
    status: 'draft',
    warehouse: 'Kho Dược',
    items: [],
    totalAmount: 0
};

// --- Helper Components ---

const UsageChip = ({ label, onClick, active = false }: { label: string, onClick: () => void, active?: boolean }) => (
    <button 
        onClick={onClick}
        className={`px-2 py-0.5 text-[10px] font-medium rounded border transition-colors whitespace-nowrap ${
            active 
            ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700'
            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-600'
        }`}
        title="Áp dụng nhanh liều dùng"
    >
        {label}
    </button>
);

const MedicationView: React.FC = () => {
    const { openPdf } = usePdfPreview();
    const { fontSettings } = useTheme();
    const [history, setHistory] = useState<Prescription[]>(mockPrescriptionHistory);
    const [currentPrescription, setCurrentPrescription] = useState<Prescription>(emptyPrescription);
    const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
    const [searchDrug, setSearchDrug] = useState('');
    
    // Drug Interaction States (Mocked)
    const [interactions, setInteractions] = useState<string[]>([]);

    // --- Calculations ---
    const calculateTotal = (items: PrescriptionItem[]) => {
        return items.reduce((sum, item) => sum + item.totalPrice, 0);
    };

    // --- Handlers ---

    const handleSelectHistory = (p: Prescription) => {
        setSelectedHistoryId(prev => prev === p.id ? null : p.id);
    };

    const handleCreateNew = () => {
        if (currentPrescription.items.length > 0 && !confirm('Bạn có muốn hủy đơn thuốc đang soạn hiện tại?')) {
            return;
        }
        setCurrentPrescription({
            ...emptyPrescription,
            id: 'NEW-' + Date.now(),
            date: new Date().toLocaleDateString('vi-VN')
        });
        setSelectedHistoryId(null);
        setInteractions([]);
    };

    const handleCopyPrescription = (p: Prescription) => {
        const confirmed = currentPrescription.items.length === 0 || confirm('Đơn hiện tại đang có thuốc. Bạn có muốn thêm thuốc từ đơn cũ vào không?');
        if (!confirmed) return;

        const newItems = p.items.map(item => ({
            ...item,
            id: `ITEM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        }));

        // Filter out duplicates based on drug code
        const existingCodes = new Set(currentPrescription.items.map(i => i.drug.code));
        const uniqueNewItems = newItems.filter(i => !existingCodes.has(i.drug.code));

        if (uniqueNewItems.length < newItems.length) {
            alert(`Đã bỏ qua ${newItems.length - uniqueNewItems.length} thuốc trùng lặp.`);
        }

        const combinedItems = [...currentPrescription.items, ...uniqueNewItems];

        setCurrentPrescription(prev => ({
            ...prev,
            items: combinedItems,
            totalAmount: calculateTotal(combinedItems)
        }));
    };

    const handleAddDrug = (drugName: string, drug?: DrugItem) => {
        if (!drug) return;
        
        // Check for duplicate
        if (currentPrescription.items.find(i => i.drug.code === drug.code)) {
            alert('Thuốc này đã có trong đơn.');
            return;
        }

        const newItem: PrescriptionItem = {
            id: `ITEM-${Date.now()}`,
            drug: drug,
            quantity: 10,
            morning: '1',
            noon: '0',
            afternoon: '0',
            night: '1',
            usageNote: 'Uống sau ăn',
            totalPrice: drug.price * 10
        };

        const newItems = [...currentPrescription.items, newItem];
        setCurrentPrescription({
            ...currentPrescription,
            items: newItems,
            totalAmount: calculateTotal(newItems)
        });

        // Mock Interaction Check
        if (drug.code === 'D001' && currentPrescription.items.some(i => i.drug.code === 'D002')) {
             // Example logic only
        }
        setSearchDrug(''); // Reset search
    };

    const handleUpdateItem = (itemId: string, field: keyof PrescriptionItem, value: any) => {
        const updatedItems = currentPrescription.items.map(item => {
            if (item.id === itemId) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'quantity') {
                    updatedItem.totalPrice = updatedItem.drug.price * Number(value);
                }
                return updatedItem;
            }
            return item;
        });
        setCurrentPrescription({
            ...currentPrescription,
            items: updatedItems,
            totalAmount: calculateTotal(updatedItems)
        });
    };

    const handleQuantityAdjust = (itemId: string, delta: number) => {
        const item = currentPrescription.items.find(i => i.id === itemId);
        if (item) {
            const newQty = Math.max(1, item.quantity + delta);
            handleUpdateItem(itemId, 'quantity', newQty);
        }
    };

    const handleRemoveItem = (itemId: string) => {
        const updatedItems = currentPrescription.items.filter(i => i.id !== itemId);
        setCurrentPrescription({
            ...currentPrescription,
            items: updatedItems,
            totalAmount: calculateTotal(updatedItems)
        });
    };

    const handleQuickUsage = (itemId: string, type: string) => {
        let update: Partial<PrescriptionItem> = {};
        switch (type) {
            case '1-0-1': update = { morning: '1', noon: '0', afternoon: '0', night: '1' }; break;
            case '1-1-1': update = { morning: '1', noon: '1', afternoon: '1', night: '0' }; break;
            case '0-0-1': update = { morning: '0', noon: '0', afternoon: '0', night: '1' }; break;
            case '1-0-0': update = { morning: '1', noon: '0', afternoon: '0', night: '0' }; break;
            case '2-0-2': update = { morning: '2', noon: '0', afternoon: '0', night: '2' }; break;
        }
        const updatedItems = currentPrescription.items.map(item => 
            item.id === itemId ? { ...item, ...update } : item
        );
        setCurrentPrescription({
            ...currentPrescription,
            items: updatedItems
        });
    };

    const handleSave = () => {
        if (currentPrescription.items.length === 0) {
            alert('Đơn thuốc trống. Vui lòng thêm thuốc.');
            return;
        }
        // Logic to save to API
        const newHistoryItem = { ...currentPrescription, id: 'DONE-' + Date.now(), status: 'confirmed' } as Prescription;
        setHistory([newHistoryItem, ...history]);
        alert('Đã lưu đơn thuốc thành công!');
        handleCreateNew();
    };

    const handlePrint = () => {
         // Mock PDF Print
         openPdf({
            url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
            fileName: `Prescription_${currentPrescription.id}.pdf`,
            isSignable: true
         });
    };

    // Combobox Configuration
    const drugColumns: ComboboxColumn<DrugItem>[] = [
        { key: 'code', label: 'Mã', width: '15%', className: 'font-mono text-slate-500 text-xs' },
        { key: 'name', label: 'Tên thuốc', width: '50%', className: 'font-bold' },
        { key: 'activeIngredient', label: 'Hoạt chất', width: '20%', className: 'text-xs italic' },
        { key: 'stock', label: 'Tồn', width: '15%', className: 'text-right text-xs', render: (item) => <span className={item.stock && item.stock < 100 ? 'text-red-500 font-bold' : 'text-green-600'}>{item.stock}</span> },
    ];

    return (
        <div className="flex flex-col lg:flex-row h-full gap-4 h-[calc(100vh-180px)] min-h-[500px]">
            
            {/* --- LEFT COLUMN: HISTORY LIST (25%) - Primary List --- */}
            <div className="lg:w-1/4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-blue-700 dark:text-blue-400 text-sm uppercase flex items-center gap-2">
                        <ArchiveIcon className="w-4 h-4"/> Lịch sử đơn thuốc
                    </h3>
                    <button onClick={handleCreateNew} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition" title="Tạo đơn mới">
                        <PlusIcon className="w-4 h-4"/>
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {history.map(p => (
                        <div 
                            key={p.id}
                            onClick={() => handleSelectHistory(p)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                selectedHistoryId === p.id 
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 shadow-sm' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
                            }`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-bold ${fontSettings.listPrimary} text-slate-800 dark:text-slate-200`}>{p.date}</span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleCopyPrescription(p); }}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 dark:text-slate-500 rounded transition-colors"
                                        title="Sao chép toàn bộ đơn này"
                                    >
                                        <DocumentPlusIcon className="w-4 h-4" />
                                    </button>
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                        p.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                    }`}>{p.status}</span>
                                </div>
                            </div>
                            <div className="text-sm text-slate-700 dark:text-slate-300 font-medium line-clamp-1 mb-1">{p.diagnosis}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                                <span>{p.doctorName}</span>
                                <span>{p.totalAmount.toLocaleString()}đ</span>
                            </div>

                            {/* Expanded Action Area */}
                            {selectedHistoryId === p.id && (
                                <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800/50 flex flex-col gap-2 animate-fade-in">
                                    <div className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-700 mb-1">
                                        <ul className="list-disc list-inside">
                                            {p.items.map((item, idx) => (
                                                <li key={idx} className="truncate">{item.drug.name} (x{item.quantity})</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleCopyPrescription(p); }}
                                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                                    >
                                        <DocumentPlusIcon className="w-3.5 h-3.5" /> 
                                        Sao chép đơn này
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* --- CENTER COLUMN: PRESCRIPTION EDITOR (50%) --- */}
            <div className="lg:w-2/4 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-blue-700 dark:text-blue-400 uppercase">Thông tin đơn thuốc</h2>
                            <div className="text-sm text-slate-600 dark:text-slate-400 flex gap-4 mt-1">
                                <span>Số phiếu: <span className="font-semibold text-slate-900 dark:text-white">{currentPrescription.id}</span></span>
                                <span>Kho: <span className="font-semibold text-slate-900 dark:text-white">{currentPrescription.warehouse}</span></span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-slate-500">Trạng thái</div>
                            <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200 uppercase">
                                {currentPrescription.status === 'draft' ? 'Đang soạn' : 'Đã xác nhận'}
                            </span>
                        </div>
                    </div>
                    
                    {/* Drug Search Bar */}
                    <div className="relative z-20">
                        <Combobox<DrugItem>
                            placeholder="Tìm kiếm thuốc (Tên, hoạt chất, mã)..."
                            value={searchDrug}
                            onChange={(val, item) => {
                                setSearchDrug(val);
                                if (item) handleAddDrug(val, item);
                            }}
                            options={drugList}
                            columns={drugColumns}
                            displayValue={(item) => item.name}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Drug Table - Secondary List */}
                <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/20">
                    {currentPrescription.items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <ArchiveIcon className="w-12 h-12 mb-2 opacity-30"/>
                            <p>Chưa có thuốc trong đơn.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {currentPrescription.items.map((item, idx) => (
                                <div key={item.id} className={`p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group ${fontSettings.listSecondary}`}>
                                    {/* Row 1: Name & Remove */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200">{item.drug.name}</h4>
                                                <p className="text-xs text-slate-500">{item.drug.activeIngredient} - {item.drug.usageRoute}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="font-bold text-blue-600 dark:text-blue-400">
                                                    {(item.totalPrice).toLocaleString('vi-VN')} đ
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {item.drug.price.toLocaleString('vi-VN')} / {item.drug.unit}
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                <TrashIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Row 2: Controls (Qty, Schedule, Note) - These are inputs, so they use fontSettings.controls */}
                                    <div className="grid grid-cols-12 gap-3 items-end">
                                        {/* Quantity Control */}
                                        <div className="col-span-3 sm:col-span-2">
                                            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Số lượng</label>
                                            <div className="flex items-center h-[34px]">
                                                <button 
                                                    onClick={() => handleQuantityAdjust(item.id, -1)}
                                                    className="w-8 h-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-r-0 border-slate-300 dark:border-slate-600 rounded-l text-slate-600 dark:text-slate-300 font-bold"
                                                >
                                                    -
                                                </button>
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => handleUpdateItem(item.id, 'quantity', e.target.value)}
                                                    className={`w-full h-full text-center border-y border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold appearance-none ${fontSettings.controls}`}
                                                />
                                                <button 
                                                    onClick={() => handleQuantityAdjust(item.id, 1)}
                                                    className="w-8 h-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-l-0 border-slate-300 dark:border-slate-600 rounded-r text-slate-600 dark:text-slate-300 font-bold"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>

                                        {/* Dosage Schedule & Quick Chips */}
                                        <div className="col-span-9 sm:col-span-6">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] uppercase font-bold text-slate-500">Sáng - Trưa - Chiều - Tối</label>
                                                <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                                                    <UsageChip label="1-1" onClick={() => handleQuickUsage(item.id, '1-0-1')} />
                                                    <UsageChip label="1-1-1" onClick={() => handleQuickUsage(item.id, '1-1-1')} />
                                                    <UsageChip label="Sáng 1" onClick={() => handleQuickUsage(item.id, '1-0-0')} />
                                                    <UsageChip label="Tối 1" onClick={() => handleQuickUsage(item.id, '0-0-1')} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-4 gap-1">
                                                {['morning', 'noon', 'afternoon', 'night'].map((time) => (
                                                    <input 
                                                        key={time}
                                                        type="text" 
                                                        placeholder="0"
                                                        value={item[time as keyof PrescriptionItem] as string}
                                                        onChange={(e) => handleUpdateItem(item.id, time as any, e.target.value)}
                                                        className={`w-full h-[34px] text-center font-semibold border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fontSettings.controls}`}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Note */}
                                        <div className="col-span-12 sm:col-span-4">
                                            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Cách dùng</label>
                                            <input 
                                                type="text" 
                                                value={item.usageNote}
                                                onChange={(e) => handleUpdateItem(item.id, 'usageNote', e.target.value)}
                                                className={`w-full h-[34px] px-2 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fontSettings.controls}`}
                                                placeholder="VD: Uống sau ăn..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer: Actions & Total */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 uppercase">Tổng tiền ước tính:</span>
                        <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                            {currentPrescription.totalAmount.toLocaleString('vi-VN')} <span className="text-sm text-slate-500 font-normal">VNĐ</span>
                        </span>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <button onClick={handleCreateNew} className={`px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 font-medium flex items-center gap-2 shadow-sm ${fontSettings.controls}`}>
                            <BanIcon className="w-4 h-4"/> Hủy/Làm mới
                        </button>
                        <button onClick={handlePrint} className={`px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 font-medium flex items-center gap-2 shadow-sm ${fontSettings.controls}`}>
                            <PrinterIcon className="w-4 h-4"/> In đơn
                        </button>
                        <button onClick={handleSave} className={`px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-md transition-transform transform active:scale-95 ${fontSettings.controls}`}>
                            <SaveIcon className="w-4 h-4"/> Lưu đơn thuốc
                        </button>
                    </div>
                </div>
            </div>

            {/* --- RIGHT COLUMN: ALERTS & SUMMARY (25%) --- */}
            <div className="lg:w-1/4 flex flex-col gap-4">
                
                {/* Warning Card */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-red-100 dark:border-red-900/30 overflow-hidden">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2">
                        <ExclamationCircleIcon className="w-5 h-5 text-red-500"/>
                        <h3 className="font-bold text-red-600 dark:text-red-400 text-sm uppercase">Cảnh báo an toàn</h3>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="text-sm">
                            <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">Dị ứng / Thận trọng:</p>
                            <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 pl-1">
                                <li>Tiền sử dị ứng Penicillin (Ghi nhận 2020)</li>
                                <li>Thận trọng: Suy giảm chức năng thận nhẹ.</li>
                            </ul>
                        </div>
                        {interactions.length > 0 ? (
                            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded text-xs text-amber-800 dark:text-amber-200">
                                <strong>Tương tác thuốc phát hiện:</strong>
                                <ul className="mt-1 list-disc list-inside">
                                    {interactions.map((i, idx) => <li key={idx}>{i}</li>)}
                                </ul>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-100 dark:border-green-900/30">
                                <CheckIcon className="w-4 h-4"/> Không phát hiện tương tác thuốc.
                            </div>
                        )}
                    </div>
                </div>

                 {/* Summary Card */}
                 <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-1">
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase">Thông tin tóm tắt</h3>
                    </div>
                    <div className="p-4 text-sm space-y-3">
                        <div>
                            <span className="text-slate-500 block text-xs uppercase font-bold">Chẩn đoán chính</span>
                            <p className="text-slate-800 dark:text-slate-200 font-medium border-l-2 border-blue-500 pl-2 mt-1">
                                [E11] Bệnh đái tháo đường không phụ thuộc insuline
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs uppercase font-bold">Ghi chú lâm sàng</span>
                            <p className="text-slate-600 dark:text-slate-300 italic mt-1">
                                Bệnh nhân mệt mỏi, ăn uống kém, đường huyết đói 9.5 mmol/L.
                            </p>
                        </div>
                        <div>
                            <span className="text-slate-500 block text-xs uppercase font-bold">Lời dặn BS</span>
                            <p className="text-slate-600 dark:text-slate-300 mt-1">
                                Tái khám sau 1 tháng. Tuân thủ chế độ ăn kiêng đường.
                            </p>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default MedicationView;
