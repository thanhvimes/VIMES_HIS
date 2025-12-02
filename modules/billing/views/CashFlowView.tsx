
import React, { useState, useEffect } from 'react';
import { 
    PlusIcon, 
    SearchIcon, 
    FilterIcon, 
    DocumentTextIcon, 
    PrinterIcon, 
    CheckIcon, 
    XIcon,
    SaveIcon,
    TrashIcon,
    PencilIcon,
    CurrencyDollarIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

type VoucherType = 'Receipt' | 'Payment'; // Thu | Chi

interface Voucher {
    id: string;
    voucherNumber: string;
    date: string;
    type: VoucherType;
    amount: number;
    subject: string; // Người nộp / Người nhận
    reason: string;
    category: string;
    status: 'Draft' | 'Approved' | 'Posted';
    debitAccount?: string;
    creditAccount?: string;
    amountInWords?: string;
    creator?: string;
}

const mockVouchers: Voucher[] = [
    { id: 'V01', voucherNumber: 'PT001', date: '2023-11-27', type: 'Receipt', amount: 5000000, subject: 'Nguyễn Văn An', reason: 'Tạm ứng viện phí', category: 'Viện phí', status: 'Posted', debitAccount: '1111', creditAccount: '131', amountInWords: 'Năm triệu đồng', creator: 'admin' },
    { id: 'V02', voucherNumber: 'PC001', date: '2023-11-27', type: 'Payment', amount: 1200000, subject: 'Công ty Dược ABC', reason: 'Thanh toán tiền thuốc đợt 1', category: 'Mua hàng', status: 'Approved', debitAccount: '331', creditAccount: '1111', amountInWords: 'Một triệu hai trăm nghìn đồng', creator: 'ketoan' },
    { id: 'V03', voucherNumber: 'PT002', date: '2023-11-28', type: 'Receipt', amount: 250000, subject: 'Trần Thị B', reason: 'Thu tiền khám', category: 'Viện phí', status: 'Posted', debitAccount: '1111', creditAccount: '511', amountInWords: 'Hai trăm năm mươi nghìn đồng', creator: 'admin' },
];

const CashFlowView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [activeTab, setActiveTab] = useState<VoucherType>('Receipt');
    const [vouchers, setVouchers] = useState<Voucher[]>(mockVouchers);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

    const filteredVouchers = vouchers.filter(v => 
        v.type === activeTab && 
        (v.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
         v.subject.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleAdd = () => {
        setEditingVoucher(null);
        setIsModalOpen(true);
    };

    const handleEdit = (voucher: Voucher) => {
        setEditingVoucher(voucher);
        setIsModalOpen(true);
    };

    const handleSave = (data: Voucher) => {
        if (editingVoucher) {
            setVouchers(prev => prev.map(v => v.id === data.id ? data : v));
        } else {
            setVouchers(prev => [data, ...prev]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa phiếu này?")) {
            setVouchers(prev => prev.filter(v => v.id !== id));
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <DocumentTextIcon className="w-8 h-8 text-blue-600"/> Quản lý Thu - Chi
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Lập và quản lý các phiếu thu, chi tiền mặt và chuyển khoản.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('Receipt')}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'Receipt' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${activeTab === 'Receipt' ? 'bg-blue-600' : 'bg-slate-400'}`}></span> Phiếu Thu
                    </button>
                    <button 
                        onClick={() => setActiveTab('Payment')}
                        className={`px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'Payment' ? 'bg-white dark:bg-slate-600 text-orange-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${activeTab === 'Payment' ? 'bg-orange-600' : 'bg-slate-400'}`}></span> Phiếu Chi
                    </button>
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <SearchIcon className="absolute left-3 top-2.5 w-5 h-5 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm số phiếu, người nộp/nhận..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none ${fontSettings.controls}`}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg font-bold flex items-center gap-2 shadow-sm hover:bg-slate-50 transition">
                            <FilterIcon className="w-4 h-4"/> Lọc
                        </button>
                        <button 
                            onClick={handleAdd}
                            className={`px-4 py-2 text-white rounded-lg font-bold shadow flex items-center gap-2 transition transform active:scale-95 ${activeTab === 'Receipt' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                        >
                            <PlusIcon className="w-5 h-5"/> Lập {activeTab === 'Receipt' ? 'Phiếu Thu' : 'Phiếu Chi'}
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-100 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-32">Số phiếu</th>
                                <th className="p-4 w-32">Ngày lập</th>
                                <th className="p-4">{activeTab === 'Receipt' ? 'Người nộp' : 'Người nhận'}</th>
                                <th className="p-4">Diễn giải</th>
                                <th className="p-4 text-right w-40">Số tiền</th>
                                <th className="p-4 text-center w-32">Trạng thái</th>
                                <th className="p-4 text-right w-40">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredVouchers.length === 0 ? (
                                <tr><td colSpan={7} className="p-10 text-center text-slate-400 italic">Không có phiếu nào.</td></tr>
                            ) : (
                                filteredVouchers.map(voucher => (
                                    <tr key={voucher.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-4 font-mono text-slate-600 dark:text-slate-300 font-bold">{voucher.voucherNumber}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-400">{new Date(voucher.date).toLocaleDateString('vi-VN')}</td>
                                        <td className="p-4 font-medium text-slate-800 dark:text-white">{voucher.subject}</td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">{voucher.reason}</td>
                                        <td className={`p-4 text-right font-bold ${activeTab === 'Receipt' ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {voucher.amount.toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                                voucher.status === 'Posted' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                                {voucher.status === 'Posted' ? 'Đã ghi sổ' : voucher.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(voucher)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-full transition"><PencilIcon className="w-4 h-4"/></button>
                                                <button className="p-2 hover:bg-slate-100 text-slate-600 rounded-full transition"><PrinterIcon className="w-4 h-4"/></button>
                                                <button onClick={() => handleDelete(voucher.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-full transition"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* VOUCHER MODAL */}
            {isModalOpen && (
                <VoucherModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave}
                    initialData={editingVoucher}
                    type={activeTab}
                />
            )}
        </div>
    );
};

// --- VOUCHER MODAL COMPONENT ---
const VoucherModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData, 
    type 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (data: Voucher) => void;
    initialData: Voucher | null;
    type: VoucherType;
}) => {
    const [formData, setFormData] = useState<Partial<Voucher>>(initialData || {
        voucherNumber: type === 'Receipt' ? `PT-${Date.now().toString().slice(-6)}` : `PC-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().slice(0, 10),
        type: type,
        amount: 0,
        subject: '',
        reason: '',
        status: 'Draft',
        debitAccount: '',
        creditAccount: '',
        amountInWords: '',
        creator: 'admin'
    });

    const colorClass = type === 'Receipt' ? 'blue' : 'orange';

    // Update amount words mock
    useEffect(() => {
        if (formData.amount) {
            setFormData(prev => ({...prev, amountInWords: `${formData.amount} đồng`}));
        } else {
            setFormData(prev => ({...prev, amountInWords: ''}));
        }
    }, [formData.amount]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...formData,
            id: formData.id || `V-${Date.now()}`,
            status: 'Posted'
        } as Voucher);
    };

    // Custom styles for inputs to ensure visibility
    const inputStyle = "w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 outline-none transition-shadow";
    const labelStyle = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1";

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up border border-slate-200 dark:border-slate-700">
                {/* Modal Header */}
                <div className={`px-6 py-4 border-b bg-${colorClass}-600 text-white flex justify-between items-center shrink-0`}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DocumentTextIcon className="w-6 h-6"/>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold uppercase tracking-wide">{type === 'Receipt' ? 'PHIẾU THU TIỀN' : 'PHIẾU CHI TIỀN'}</h2>
                            <p className="text-xs opacity-80">Nhập thông tin chứng từ kế toán</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-white/80 hover:text-white">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900/50 space-y-6">
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Info Box */}
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-1 space-y-4">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 border-b pb-1">Thông tin phiếu</label>
                                <div>
                                    <label className={labelStyle}>Số phiếu <span className="text-red-500">*</span></label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={formData.voucherNumber} 
                                            onChange={e => setFormData({...formData, voucherNumber: e.target.value})}
                                            className={`${inputStyle} font-mono font-bold`} 
                                        />
                                        <button type="button" className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"><SearchIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelStyle}>Ngày lập</label>
                                    <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className={inputStyle} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Người tạo</label>
                                    <input type="text" value={formData.creator} disabled className={`${inputStyle} bg-slate-200 dark:bg-slate-900 cursor-not-allowed text-slate-500`} />
                                </div>
                            </div>

                            {/* Main Form */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className={labelStyle}>{type === 'Receipt' ? 'Người nộp tiền' : 'Người nhận tiền'}</label>
                                        <input 
                                            type="text" 
                                            value={formData.subject} 
                                            onChange={e => setFormData({...formData, subject: e.target.value})} 
                                            className={`${inputStyle} focus:border-blue-500`}
                                            placeholder="Nhập tên..."
                                            autoFocus
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelStyle}>Lý do / Diễn giải</label>
                                        <input 
                                            type="text" 
                                            value={formData.reason} 
                                            onChange={e => setFormData({...formData, reason: e.target.value})} 
                                            className={inputStyle}
                                            placeholder="Nhập lý do chi tiết..."
                                        />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>TK Nợ</label>
                                        <input type="text" value={formData.debitAccount} onChange={e => setFormData({...formData, debitAccount: e.target.value})} className={inputStyle} placeholder="1111" />
                                    </div>
                                    <div>
                                        <label className={labelStyle}>TK Có</label>
                                        <input type="text" value={formData.creditAccount} onChange={e => setFormData({...formData, creditAccount: e.target.value})} className={inputStyle} placeholder="131" />
                                    </div>
                                    <div className="col-span-2 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <label className={labelStyle}>Thành tiền (VNĐ)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={formData.amount} 
                                                onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} 
                                                className={`w-full p-3 pr-10 text-2xl font-black text-right border rounded-lg shadow-inner outline-none focus:ring-2 transition-colors bg-white dark:bg-slate-900 ${type === 'Receipt' ? 'text-blue-700 border-blue-200 focus:ring-blue-500' : 'text-orange-700 border-orange-200 focus:ring-orange-500'}`}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">đ</span>
                                        </div>
                                        <div className="mt-2">
                                            <label className="text-xs font-bold text-slate-500">Số tiền bằng chữ</label>
                                            <input 
                                                type="text" 
                                                value={formData.amountInWords} 
                                                onChange={e => setFormData({...formData, amountInWords: e.target.value})}
                                                className="w-full mt-1 p-2 text-sm italic text-slate-600 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 outline-none dark:text-slate-300"
                                                placeholder="Viết bằng chữ..."
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelStyle}>Chứng từ gốc (Kèm theo)</label>
                                        <input 
                                            type="text" 
                                            className={inputStyle}
                                            placeholder="Số lượng chứng từ gốc..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition">Hủy bỏ</button>
                        <button 
                            type="submit" 
                            className={`px-6 py-2.5 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 transition transform active:scale-95 ${type === 'Receipt' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                        >
                            <SaveIcon className="w-5 h-5"/> Lưu & Ghi sổ
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CashFlowView;
