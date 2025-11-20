
import React, { useState, useMemo } from 'react';
import { 
    PrinterIcon, 
    PlusIcon, 
    TrashIcon, 
    CurrencyDollarIcon,
    DocumentTextIcon,
    CheckIcon,
    XIcon
} from '../../../../components/Icons';
import { FeeItem } from '../../../../types';
import { usePdfPreview } from '../../../../contexts/PdfPreviewContext';

// --- Mock Data ---
const mockFeeItems: FeeItem[] = [
    { id: 'F01', name: 'Khám Ngoại (Theo yêu cầu)', category: 'BẰNG KÊ CHI ĐỊNH DỊCH VỤ', unit: 'Lần', quantity: 1, unitPrice: 50600, totalPrice: 50600, insurancePaid: 0, patientPaid: 50600, surcharge: 0 },
    { id: 'F02', name: 'Ngày giường chuyển khoa', category: 'BẰNG KÊ CHI ĐỊNH DỊCH VỤ', unit: 'Ngày', quantity: 1, unitPrice: 206000, totalPrice: 206000, insurancePaid: 164000, patientPaid: 42000, surcharge: 0 },
    { id: 'F03', name: 'Tổng phân tích tế bào máu', category: 'XÉT NGHIỆM HUYẾT HỌC', unit: 'Lần', quantity: 1, unitPrice: 42100, totalPrice: 42100, insurancePaid: 42100, patientPaid: 0, surcharge: 0 },
    { id: 'F04', name: 'Đường huyết (Glucose)', category: 'XÉT NGHIỆM HÓA SINH', unit: 'Lần', quantity: 1, unitPrice: 30000, totalPrice: 30000, insurancePaid: 30000, patientPaid: 0, surcharge: 0 },
    { id: 'F05', name: 'Chức năng thận (Ure, Creatinin)', category: 'XÉT NGHIỆM HÓA SINH', unit: 'Lần', quantity: 2, unitPrice: 30000, totalPrice: 60000, insurancePaid: 60000, patientPaid: 0, surcharge: 0 },
    { id: 'F06', name: 'Paracetamol 500mg', category: 'THUỐC & VẬT TƯ', unit: 'Viên', quantity: 10, unitPrice: 500, totalPrice: 5000, insurancePaid: 0, patientPaid: 5000, surcharge: 0 },
    { id: 'F07', name: 'Kim tiêm 5ml', category: 'THUỐC & VẬT TƯ', unit: 'Cái', quantity: 2, unitPrice: 2000, totalPrice: 4000, insurancePaid: 4000, patientPaid: 0, surcharge: 0 },
];

// --- Add Fee Modal Component ---
const AddFeeModal = ({ isOpen, onClose, onAdd }: { isOpen: boolean; onClose: () => void; onAdd: (item: FeeItem) => void }) => {
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [qty, setQty] = useState('1');
    
    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!name || !price) return;
        const unitPrice = parseFloat(price);
        const quantity = parseFloat(qty);
        const total = unitPrice * quantity;

        const newItem: FeeItem = {
            id: `F_NEW_${Date.now()}`,
            name,
            category: 'CHI PHÍ KHÁC',
            unit: 'Lần',
            quantity,
            unitPrice,
            totalPrice: total,
            insurancePaid: 0,
            patientPaid: total,
            surcharge: 0
        };
        onAdd(newItem);
        onClose();
        setName(''); setPrice(''); setQty('1');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">Thêm mục phí khác</h3>
                    <button onClick={onClose}><XIcon className="w-5 h-5 text-slate-500"/></button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tên dịch vụ/phí</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" placeholder="VD: Phí hồ sơ..." autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Đơn giá</label>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Số lượng</label>
                            <input type="number" value={qty} onChange={e => setQty(e.target.value)} className="w-full p-2 border rounded dark:bg-slate-700 dark:border-slate-600" />
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded">Hủy</button>
                    <button onClick={handleSubmit} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm">Thêm</button>
                </div>
            </div>
        </div>
    );
};

const FeeView: React.FC = () => {
    const { openPdf } = usePdfPreview();
    const [items, setItems] = useState<FeeItem[]>(mockFeeItems);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // --- Calculations ---
    const summary = useMemo(() => {
        return items.reduce((acc, item) => ({
            total: acc.total + item.totalPrice,
            insurance: acc.insurance + item.insurancePaid,
            surcharge: acc.surcharge + item.surcharge,
            patientTotal: acc.patientTotal + item.patientPaid + item.surcharge
        }), { total: 0, insurance: 0, surcharge: 0, patientTotal: 0 });
    }, [items]);

    // Group items by category
    const groupedItems = useMemo(() => {
        const groups: Record<string, FeeItem[]> = {};
        items.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return groups;
    }, [items]);

    const handleAddItem = (newItem: FeeItem) => {
        setItems([...items, newItem]);
    };

    const handleDeleteItem = (id: string) => {
        if (window.confirm('Xóa mục phí này?')) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const handlePrint = () => {
        openPdf({
            url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf',
            fileName: 'BangKeChiPhi.pdf',
            isSignable: false
        });
    };

    const formatCurrency = (val: number) => val.toLocaleString('vi-VN');

    return (
        <div className="flex flex-col lg:flex-row h-full gap-4 bg-slate-100 dark:bg-slate-900/50 rounded-lg overflow-hidden">
            
            {/* --- LEFT COLUMN: PAYMENT SUMMARY & ACTIONS (25%) --- */}
            <div className="lg:w-1/4 flex flex-col gap-4 h-full overflow-y-auto">
                {/* Summary Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-0 overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg flex items-center gap-2">
                            <CurrencyDollarIcon className="w-6 h-6 text-blue-600"/>
                            Thông tin thanh toán
                        </h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Tổng chi phí</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(summary.total)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Tổng BHYT chi trả</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(summary.insurance)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Tổng chênh lệch</span>
                            <span className="font-semibold text-orange-500">{formatCurrency(summary.surcharge)}</span>
                        </div>
                         <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-700 pt-3">
                            <span className="text-slate-500 dark:text-slate-400 text-sm">Tạm ứng</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">0</span>
                        </div>
                        
                        <div className="pt-4 mt-2 border-t border-dashed border-slate-300 dark:border-slate-600">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-base font-bold text-slate-700 dark:text-slate-300">BN phải trả</span>
                                <span className="text-xl font-extrabold text-red-600 dark:text-red-400">{formatCurrency(summary.patientTotal)}</span>
                            </div>
                            <p className="text-xs text-slate-400 text-right italic">(Đã bao gồm VAT)</p>
                        </div>
                    </div>
                </div>

                {/* Actions Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                    
                    <div className="grid grid-cols-2 gap-3">
                         <button 
                            onClick={() => setIsAddModalOpen(true)}
                            className="py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-1 transition active:scale-95"
                        >
                            <PlusIcon className="w-4 h-4" /> Thêm
                        </button>
                        <button className="py-2 px-3 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-300 rounded-lg font-semibold text-sm flex items-center justify-center gap-1 transition active:scale-95">
                            <TrashIcon className="w-4 h-4" /> Xóa
                        </button>
                    </div>
                    <button className="w-full py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-sm shadow-sm flex items-center justify-center gap-1 transition active:scale-95">
                        <XIcon className="w-4 h-4" /> Bỏ xác nhận
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <PrinterIcon className="w-5 h-5" /> In bảng kê chi phí
                    </button>
                </div>
            </div>

            {/* --- RIGHT COLUMN: DETAILED FEE LIST (75%) --- */}
            <div className="lg:w-3/4 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                     <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg flex items-center gap-2">
                        <DocumentTextIcon className="w-6 h-6 text-slate-500"/>
                        Danh sách các mục phí
                    </h3>
                    <div className="text-sm text-slate-500">
                        Tổng số mục: <strong>{items.length}</strong>
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-blue-600 text-white sticky top-0 z-10 font-bold">
                            <tr>
                                <th className="p-3 border-r border-blue-500 w-12 text-center">STT</th>
                                <th className="p-3 border-r border-blue-500">Diễn giải</th>
                                <th className="p-3 border-r border-blue-500 text-right w-24">Đơn giá</th>
                                <th className="p-3 border-r border-blue-500 text-center w-16">SL</th>
                                <th className="p-3 border-r border-blue-500 text-right w-24">Đơn giá giao</th>
                                <th className="p-3 border-r border-blue-500 text-right w-24">Thành tiền</th>
                                <th className="p-3 border-r border-blue-500 text-right w-24">Thành tiền chênh lệch</th>
                                <th className="p-3 border-r border-blue-500 text-right w-24">Nguồn thanh toán</th>
                                <th className="p-3 border-r border-blue-500 text-right w-24">Chênh lệch</th>
                                <th className="p-3 border-r border-blue-500 text-right w-24">Cùng chi trả</th>
                                <th className="p-3 text-right w-24">Nguồn khác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {Object.entries(groupedItems).map(([category, catItems], groupIdx) => (
                                <React.Fragment key={category}>
                                    {/* Group Header */}
                                    <tr className="bg-slate-100 dark:bg-slate-900/60">
                                        <td colSpan={11} className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider border-y border-slate-200 dark:border-slate-700">
                                            {category}
                                            <span className="ml-2 font-normal text-slate-500">{catItems.reduce((s, i) => s + i.totalPrice, 0).toLocaleString('vi-VN')}</span>
                                        </td>
                                    </tr>
                                    {/* Items */}
                                    {catItems.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="p-3 text-center text-slate-500 text-xs border-r border-slate-100 dark:border-slate-700">{idx + 1}</td>
                                            <td className="p-3 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-700">
                                                {item.name}
                                            </td>
                                            <td className="p-3 text-right text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-700">{formatCurrency(item.unitPrice)}</td>
                                            <td className="p-3 text-center font-semibold border-r border-slate-100 dark:border-slate-700">{item.quantity}</td>
                                            <td className="p-3 text-right text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-700">{formatCurrency(item.unitPrice)}</td>
                                            <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700">{formatCurrency(item.totalPrice)}</td>
                                            <td className="p-3 text-right text-slate-500 border-r border-slate-100 dark:border-slate-700">0</td>
                                            <td className="p-3 text-right text-slate-500 border-r border-slate-100 dark:border-slate-700"></td>
                                            <td className="p-3 text-right text-slate-500 border-r border-slate-100 dark:border-slate-700"></td>
                                            <td className="p-3 text-right text-slate-500 border-r border-slate-100 dark:border-slate-700">0</td>
                                            <td className="p-3 text-right font-bold text-slate-800 dark:text-white">
                                                {formatCurrency(item.totalPrice)}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                            
                            {/* Grand Total Row */}
                            <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-600">
                                <td colSpan={2} className="p-4 uppercase text-xs tracking-wider">Tổng cộng</td>
                                <td className="p-4 text-right">{formatCurrency(summary.total)}</td>
                                <td className="p-4 text-center">{items.reduce((s, i) => s + i.quantity, 0)}</td>
                                <td className="p-4 text-right">{formatCurrency(summary.total)}</td>
                                <td className="p-4 text-right">{formatCurrency(summary.total)}</td>
                                <td className="p-4 text-right">0</td>
                                <td className="p-4 text-right"></td>
                                <td className="p-4 text-right">0</td>
                                <td className="p-4 text-right">0</td>
                                <td className="p-4 text-right text-lg">{formatCurrency(summary.total)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <AddFeeModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onAdd={handleAddItem}
            />
        </div>
    );
};

export default FeeView;
