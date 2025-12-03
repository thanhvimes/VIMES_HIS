
import React, { useState, useEffect, useCallback } from 'react';
import { 
    XIcon, 
    SaveIcon, 
    PrinterIcon, 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    CloudUploadIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    RefreshIcon
} from '../../../../components/Icons';
import { invoiceService, InvoiceData, InvoiceDetailItem } from '../../../../services/invoiceService';
import { usePdfPreview } from '../../../../contexts/PdfPreviewContext';

interface ElectronicInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    receiptData: any; // Dữ liệu từ phiếu thu
    patientData: any;
}

const defaultInvoiceState: Partial<InvoiceData> = {
    pattern: '1/001',
    serial: 'C23TKA',
    invoiceNo: '',
    issueDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
    paymentMethod: 'Tiền mặt/Chuyển khoản',
    status: 'Draft',
    vatRate: 0, // Y tế thường không chịu thuế hoặc 0%
    vatAmount: 0,
};

const ElectronicInvoiceModal: React.FC<ElectronicInvoiceModalProps> = ({ isOpen, onClose, receiptData, patientData }) => {
    const { openPdf } = usePdfPreview();
    const [formData, setFormData] = useState<Partial<InvoiceData>>(defaultInvoiceState);
    const [items, setItems] = useState<InvoiceDetailItem[]>([]);
    
    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [mode, setMode] = useState<'CREATE' | 'EDIT' | 'VIEW'>('CREATE');
    const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

    // Load data when modal opens
    useEffect(() => {
        if (isOpen && receiptData) {
            loadInvoiceData();
        } else if (isOpen) {
            resetForm();
        }
    }, [isOpen, receiptData]);

    const resetForm = () => {
        setFormData(defaultInvoiceState);
        setItems([]);
        setMode('CREATE');
        setNotification(null);
    };

    const loadInvoiceData = async () => {
        setIsLoading(true);
        setNotification(null);
        try {
            // 1. Try to fetch existing invoice for this receipt
            const existingInvoice = await invoiceService.getInvoiceByReceiptId(receiptData.id);

            if (existingInvoice) {
                setFormData(existingInvoice);
                setItems(existingInvoice.items);
                setMode('VIEW');
            } else {
                // 2. If not exist, map data from Receipt & Patient to create a new Draft
                mapReceiptToInvoice();
                setMode('CREATE');
            }
        } catch (error) {
            console.error(error);
            setNotification({ type: 'error', message: 'Lỗi khi tải dữ liệu hóa đơn.' });
        } finally {
            setIsLoading(false);
        }
    };

    const mapReceiptToInvoice = () => {
        setFormData(prev => ({
            ...prev,
            receiptId: receiptData.id,
            buyerName: patientData.name,
            buyerTaxCode: '', // Patient usually doesn't have tax code
            buyerAddress: patientData.address,
            buyerPhone: patientData.phone,
            issueDate: new Date().toISOString().slice(0, 16).replace('T', ' '),
            totalAmount: receiptData.amount,
            totalPayment: receiptData.amount,
            status: 'Draft',
            invoiceNo: ''
        }));

        // Map single item from receipt description (In real app, receipt would have detailed items)
        setItems([{
            name: receiptData.description || 'Dịch vụ khám chữa bệnh',
            unit: 'Lần',
            quantity: 1,
            unitPrice: receiptData.amount,
            amount: receiptData.amount
        }]);
    };

    // --- HANDLERS ---

    const handleCreateNew = () => {
        if (mode === 'EDIT' && !window.confirm("Dữ liệu đang sửa chưa lưu sẽ bị mất. Tiếp tục?")) return;
        mapReceiptToInvoice(); // Reset to data from receipt
        setFormData(prev => ({ ...prev, id: undefined, status: 'Draft', invoiceNo: '' }));
        setMode('CREATE');
        setNotification({ type: 'success', message: 'Đã làm mới form nhập liệu.' });
    };

    const handleEdit = () => {
        if (formData.status === 'Signed' || formData.status === 'Cancelled') {
            setNotification({ type: 'error', message: `Không thể sửa hóa đơn đã ${formData.status === 'Signed' ? 'phát hành' : 'hủy'}.` });
            return;
        }
        setMode('EDIT');
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload: InvoiceData = {
                ...formData as InvoiceData,
                items: items,
                totalAmount: items.reduce((sum, item) => sum + item.amount, 0),
                // Recalculate totals just in case
            };
            
            const saved = await invoiceService.saveInvoice(payload);
            setFormData(saved);
            setMode('VIEW');
            setNotification({ type: 'success', message: 'Lưu hóa đơn thành công!' });
        } catch (error) {
            setNotification({ type: 'error', message: 'Lỗi khi lưu hóa đơn.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRelease = async () => {
        if (!formData.id) {
            setNotification({ type: 'error', message: 'Vui lòng lưu hóa đơn trước khi phát hành.' });
            return;
        }
        if (!window.confirm("Bạn có chắc chắn muốn phát hành (ký số) hóa đơn này? Hành động này không thể hoàn tác.")) return;

        setIsSaving(true); // Reuse saving loading state
        try {
            const released = await invoiceService.releaseInvoice(formData.id);
            setFormData(released);
            setMode('VIEW');
            setNotification({ type: 'success', message: `Phát hành thành công! Số hóa đơn: ${released.invoiceNo}` });
        } catch (error) {
            setNotification({ type: 'error', message: 'Lỗi khi phát hành hóa đơn.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handlePrint = () => {
        // Mock Print using PDF Preview
        openPdf({
            url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', // Replace with generated PDF
            fileName: `HD_${formData.serial}_${formData.invoiceNo || 'Draft'}.pdf`,
            isSignable: false
        });
    };

    const handleInputChange = (field: keyof InvoiceData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // UI Classes
    const inputClass = `w-full p-1.5 text-sm border rounded outline-none font-medium transition-colors ${
        mode === 'VIEW' 
        ? 'bg-slate-100 border-slate-300 text-slate-600' 
        : 'bg-white border-slate-300 text-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500'
    }`;
    const labelClass = "block text-xs font-medium text-slate-600 mb-0.5";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 animate-fade-in">
            {/* Removed complex JS-based transition logic to fix jitter. Used CSS animation 'animate-fade-in-up' or 'scale-100' */}
            <div 
                className="bg-slate-100 w-full max-w-5xl rounded-lg shadow-2xl flex flex-col overflow-hidden border border-slate-300 h-[90vh] animate-fade-in-up transform-gpu"
            >
                
                {/* 1. Title Bar */}
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-700 to-blue-600 text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5"/>
                        <span className="font-bold text-sm uppercase">Hóa đơn điện tử</span>
                        {formData.status && (
                             <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                 formData.status === 'Signed' ? 'bg-green-500 border-green-400 text-white' : 
                                 formData.status === 'Cancelled' ? 'bg-red-500 border-red-400 text-white' : 
                                 'bg-yellow-400 border-yellow-200 text-yellow-900'
                             }`}>
                                 {formData.status === 'Signed' ? 'Đã ký' : formData.status === 'Cancelled' ? 'Đã hủy' : 'Mới tạo / Nháp'}
                             </span>
                        )}
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition text-white/80 hover:text-white">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </div>

                {/* 2. Toolbar */}
                <div className="bg-slate-200 border-b border-slate-300 p-1 flex gap-1 shrink-0 overflow-x-auto">
                    <button 
                        onClick={handleCreateNew}
                        className="flex flex-col items-center justify-center px-3 py-1 hover:bg-white rounded border border-transparent hover:border-slate-300 text-slate-700 min-w-[60px] transition-all active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5 text-green-600 mb-0.5"/>
                        <span className="text-[10px] font-bold">Tạo mới</span>
                    </button>
                    
                    <button 
                        onClick={handleSave}
                        disabled={mode === 'VIEW' || isSaving}
                        className={`flex flex-col items-center justify-center px-3 py-1 rounded border border-transparent min-w-[60px] transition-all active:scale-95 ${
                            mode === 'VIEW' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:border-slate-300 text-slate-700'
                        }`}
                    >
                        {isSaving ? <RefreshIcon className="w-5 h-5 text-blue-600 mb-0.5 animate-spin"/> : <SaveIcon className="w-5 h-5 text-blue-600 mb-0.5"/>}
                        <span className="text-[10px] font-bold">Lưu</span>
                    </button>

                    <button 
                        onClick={handleEdit}
                        disabled={mode !== 'VIEW' || formData.status !== 'Draft'}
                        className={`flex flex-col items-center justify-center px-3 py-1 rounded border border-transparent min-w-[60px] transition-all active:scale-95 ${
                            mode !== 'VIEW' || formData.status !== 'Draft' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:border-slate-300 text-slate-700'
                        }`}
                    >
                        <PencilIcon className="w-5 h-5 text-orange-600 mb-0.5"/>
                        <span className="text-[10px] font-bold">Sửa</span>
                    </button>

                    <div className="w-px bg-slate-300 mx-1 my-1"></div>
                    
                    <button 
                        onClick={handleRelease}
                        disabled={formData.status !== 'Draft' || isSaving}
                        className={`flex flex-col items-center justify-center px-3 py-1 rounded border border-transparent min-w-[60px] transition-all active:scale-95 ${
                            formData.status !== 'Draft' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white hover:border-slate-300 text-slate-700'
                        }`}
                    >
                        <CloudUploadIcon className="w-5 h-5 text-purple-600 mb-0.5"/>
                        <span className="text-[10px] font-bold">Phát hành</span>
                    </button>

                     <button 
                        onClick={handlePrint}
                        className="flex flex-col items-center justify-center px-3 py-1 hover:bg-white rounded border border-transparent hover:border-slate-300 text-slate-700 min-w-[60px] transition-all active:scale-95"
                    >
                        <PrinterIcon className="w-5 h-5 text-slate-600 mb-0.5"/>
                        <span className="text-[10px] font-bold">In</span>
                    </button>
                </div>

                {/* 3. Notification Area */}
                {notification && (
                    <div className={`px-4 py-2 text-xs font-bold flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {notification.type === 'success' ? <CheckCircleIcon className="w-4 h-4"/> : <ExclamationCircleIcon className="w-4 h-4"/>}
                        {notification.message}
                    </div>
                )}
                
                {/* 4. Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 z-50 bg-white/80 flex items-center justify-center flex-col">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-slate-600 font-medium text-sm">Đang xử lý dữ liệu...</p>
                    </div>
                )}

                {/* 5. Main Form Content */}
                <div className="p-4 overflow-y-auto bg-slate-50 flex-1 custom-scrollbar">
                    
                    {/* SECTION A: GENERAL INFO */}
                    <div className="bg-white border border-blue-200 rounded shadow-sm mb-4">
                        <div className="px-3 py-1.5 bg-blue-50 border-b border-blue-100 font-bold text-blue-800 text-xs uppercase flex justify-between">
                            <span>Thông tin chung</span>
                            <span className="text-[10px] text-slate-500">ID: {formData.id || 'New'}</span>
                        </div>
                        <div className="p-3 grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3">
                            <div>
                                <label className={labelClass}>Mẫu số</label>
                                <input type="text" value={formData.pattern} className={`${inputClass} bg-slate-100 text-slate-500`} readOnly />
                            </div>
                            <div>
                                <label className={labelClass}>Ký hiệu (Serial)</label>
                                <input type="text" value={formData.serial} className={`${inputClass} bg-slate-100 text-slate-500`} readOnly />
                            </div>
                             <div>
                                <label className={labelClass}>Số hóa đơn</label>
                                <input 
                                    type="text" 
                                    value={formData.invoiceNo} 
                                    placeholder="Chưa cấp" 
                                    className={`${inputClass} font-bold ${formData.invoiceNo ? 'text-red-600' : 'text-slate-400 italic'}`} 
                                    readOnly 
                                />
                            </div>
                             <div>
                                <label className={labelClass}>Ngày lập</label>
                                <input type="text" value={formData.issueDate} className={`${inputClass} bg-slate-100`} readOnly />
                            </div>
                        </div>
                    </div>

                    {/* SECTION B: BUYER INFO */}
                    <div className="bg-white border border-slate-300 rounded shadow-sm mb-4">
                         <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 font-bold text-slate-700 text-xs uppercase">
                            Thông tin người mua
                        </div>
                        <div className="p-3 grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
                             <div className="md:col-span-2">
                                <label className={labelClass}>Tên người mua / Đơn vị</label>
                                <input 
                                    type="text" 
                                    value={formData.buyerName || ''} 
                                    onChange={e => handleInputChange('buyerName', e.target.value)}
                                    className={`${inputClass} uppercase font-bold`} 
                                    readOnly={mode === 'VIEW'}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Mã số thuế</label>
                                <input 
                                    type="text" 
                                    value={formData.buyerTaxCode || ''} 
                                    onChange={e => handleInputChange('buyerTaxCode', e.target.value)}
                                    className={inputClass} 
                                    readOnly={mode === 'VIEW'}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Hình thức thanh toán</label>
                                <select 
                                    value={formData.paymentMethod}
                                    onChange={e => handleInputChange('paymentMethod', e.target.value)}
                                    className={inputClass}
                                    disabled={mode === 'VIEW'}
                                >
                                    <option>Tiền mặt</option>
                                    <option>Chuyển khoản</option>
                                    <option>Tiền mặt/Chuyển khoản</option>
                                </select>
                            </div>
                             <div className="md:col-span-2">
                                <label className={labelClass}>Địa chỉ</label>
                                <input 
                                    type="text" 
                                    value={formData.buyerAddress || ''} 
                                    onChange={e => handleInputChange('buyerAddress', e.target.value)}
                                    className={inputClass} 
                                    readOnly={mode === 'VIEW'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION C: DETAILS GRID */}
                    <div className="bg-white border border-slate-300 rounded shadow-sm flex-1 flex flex-col min-h-[200px]">
                         <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 font-bold text-slate-700 text-xs uppercase flex justify-between">
                            <span>Chi tiết hàng hóa / dịch vụ</span>
                            <span className="text-blue-600">Tham chiếu Phiếu thu: {formData.receiptId}</span>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-200 text-slate-700 text-xs font-bold sticky top-0">
                                    <tr>
                                        <th className="p-2 border-r border-slate-300 w-10 text-center">STT</th>
                                        <th className="p-2 border-r border-slate-300">Tên hàng hóa, dịch vụ</th>
                                        <th className="p-2 border-r border-slate-300 w-20 text-center">ĐVT</th>
                                        <th className="p-2 border-r border-slate-300 w-20 text-center">SL</th>
                                        <th className="p-2 border-r border-slate-300 w-32 text-right">Đơn giá</th>
                                        <th className="p-2 border-r border-slate-300 w-32 text-right">Thành tiền</th>
                                        <th className="p-2 w-20 text-center">Thuế</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 hover:bg-blue-50">
                                            <td className="p-2 border-r border-slate-200 text-center">{idx + 1}</td>
                                            <td className="p-2 border-r border-slate-200 font-medium">
                                                {mode === 'VIEW' ? item.name : (
                                                    <input 
                                                        type="text" 
                                                        value={item.name}
                                                        className="w-full bg-transparent outline-none"
                                                        onChange={(e) => {
                                                            const newItems = [...items];
                                                            newItems[idx].name = e.target.value;
                                                            setItems(newItems);
                                                        }}
                                                    />
                                                )}
                                            </td>
                                            <td className="p-2 border-r border-slate-200 text-center">{item.unit}</td>
                                            <td className="p-2 border-r border-slate-200 text-center">{item.quantity}</td>
                                            <td className="p-2 border-r border-slate-200 text-right">{item.unitPrice.toLocaleString()}</td>
                                            <td className="p-2 border-r border-slate-200 text-right font-bold">{item.amount.toLocaleString()}</td>
                                            <td className="p-2 text-center">KCT</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 font-bold text-sm border-t border-slate-300">
                                    <tr>
                                        <td colSpan={5} className="p-2 text-right border-r border-slate-300 text-slate-600">Cộng tiền hàng:</td>
                                        <td className="p-2 text-right">{formData.totalAmount?.toLocaleString()}</td>
                                        <td></td>
                                    </tr>
                                    <tr>
                                        <td colSpan={5} className="p-2 text-right border-r border-slate-300 text-slate-600">Tiền thuế GTGT:</td>
                                        <td className="p-2 text-right">{formData.vatAmount?.toLocaleString()}</td>
                                        <td></td>
                                    </tr>
                                    <tr className="bg-blue-50">
                                        <td colSpan={5} className="p-2 text-right border-r border-slate-300 text-blue-800 uppercase">Tổng thanh toán:</td>
                                        <td className="p-2 text-right text-blue-700 text-lg">{formData.totalPayment?.toLocaleString()}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ElectronicInvoiceModal;
