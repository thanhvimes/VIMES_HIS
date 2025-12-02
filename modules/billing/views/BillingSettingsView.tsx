
import React, { useState } from 'react';
import { 
    CogIcon, 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    CheckCircleIcon, 
    XIcon,
    SaveIcon
} from '../../../components/Icons';

interface InvoiceBook {
    id: string;
    name: string; // Tên quyển (VD: Quyển thu viện phí ngoại trú)
    series: string; // Ký hiệu (VD: AB/23P)
    templateCode: string; // Mẫu số (VD: 01GTKT0/001)
    year: number;
    fromNumber: number;
    toNumber: number;
    currentNumber: number;
    status: 'Active' | 'Closed';
}

const mockBooks: InvoiceBook[] = [
    { id: 'B01', name: 'Biên lai thu tiền (Nội trú)', series: 'AA/23P', templateCode: '01BLP0/001', year: 2023, fromNumber: 1, toNumber: 5000, currentNumber: 1240, status: 'Active' },
    { id: 'B02', name: 'Biên lai thu tiền (Ngoại trú)', series: 'AB/23P', templateCode: '01BLP0/001', year: 2023, fromNumber: 1, toNumber: 10000, currentNumber: 4521, status: 'Active' },
    { id: 'B03', name: 'Phiếu chi tiền mặt', series: 'PC/23', templateCode: 'PC-INT', year: 2023, fromNumber: 1, toNumber: 1000, currentNumber: 156, status: 'Active' },
];

const BillingSettingsView: React.FC = () => {
    const [books, setBooks] = useState<InvoiceBook[]>(mockBooks);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<InvoiceBook | null>(null);

    const handleAdd = () => {
        setEditingBook(null);
        setIsModalOpen(true);
    };

    const handleEdit = (book: InvoiceBook) => {
        setEditingBook(book);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa quyển này?")) {
            setBooks(prev => prev.filter(b => b.id !== id));
        }
    };

    const handleSave = (data: InvoiceBook) => {
        if (editingBook) {
            setBooks(prev => prev.map(b => b.id === data.id ? data : b));
        } else {
            setBooks(prev => [...prev, { ...data, id: `B${Date.now()}` }]);
        }
        setIsModalOpen(false);
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CogIcon className="w-8 h-8 text-slate-600"/> Thiết lập Hóa đơn & Chứng từ
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý ký hiệu, mẫu số và dải số hóa đơn/biên lai.</p>
                </div>
                <button 
                    onClick={handleAdd}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow flex items-center gap-2 transition transform active:scale-95"
                >
                    <PlusIcon className="w-5 h-5"/> Thêm Quyển mới
                </button>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-y-auto pb-4">
                {books.map(book => (
                    <div key={book.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
                        <div className={`p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center ${book.status === 'Active' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{book.name}</h3>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full border ${book.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                                {book.status === 'Active' ? 'Đang sử dụng' : 'Đã đóng'}
                            </span>
                        </div>
                        <div className="p-6 space-y-4 flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Mẫu số</label>
                                    <p className="font-mono font-bold text-slate-700 dark:text-slate-200">{book.templateCode}</p>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Ký hiệu (Series)</label>
                                    <p className="font-mono font-bold text-slate-700 dark:text-slate-200">{book.series}</p>
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-500 font-semibold">Tiến độ sử dụng</span>
                                    <span className="font-bold text-blue-600">{book.currentNumber} / {book.toNumber}</span>
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="bg-blue-600 h-full rounded-full transition-all duration-500 relative" 
                                        style={{ width: `${((book.currentNumber - book.fromNumber) / (book.toNumber - book.fromNumber)) * 100}%` }}
                                    >
                                        <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mt-2 font-mono">
                                    <span>Start: {book.fromNumber}</span>
                                    <span>Year: {book.year}</span>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                            <button onClick={() => handleEdit(book)} className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-blue-600 font-bold text-sm border border-transparent hover:border-slate-200 transition flex items-center gap-1">
                                <PencilIcon className="w-4 h-4"/> Sửa
                            </button>
                            <button onClick={() => handleDelete(book.id)} className="px-3 py-1.5 hover:bg-white dark:hover:bg-slate-700 rounded text-red-600 font-bold text-sm border border-transparent hover:border-slate-200 transition flex items-center gap-1">
                                <TrashIcon className="w-4 h-4"/> Xóa
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <BookConfigModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSave} 
                    initialData={editingBook} 
                />
            )}
        </div>
    );
};

const BookConfigModal = ({ 
    isOpen, onClose, onSave, initialData 
}: { 
    isOpen: boolean; onClose: () => void; onSave: (d: InvoiceBook) => void; initialData: InvoiceBook | null 
}) => {
    const [form, setForm] = useState<Partial<InvoiceBook>>(initialData || {
        name: '', series: '', templateCode: '', year: new Date().getFullYear(), fromNumber: 1, toNumber: 10000, currentNumber: 1, status: 'Active'
    });

    const handleChange = (field: keyof InvoiceBook, value: any) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // Input Styles: Specific background color for high contrast as requested
    const inputClass = "w-full p-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400 outline-none transition-shadow";
    const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">{initialData ? 'Cập nhật Quyển số' : 'Thêm Quyển số mới'}</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition"><XIcon className="w-6 h-6 text-slate-400"/></button>
                </div>
                
                <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                    <div>
                        <label className={labelClass}>Tên quyển / Loại phiếu</label>
                        <input 
                            type="text" 
                            className={inputClass} 
                            value={form.name} 
                            onChange={e => handleChange('name', e.target.value)} 
                            placeholder="VD: Hóa đơn GTGT..." 
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Mẫu số</label>
                            <input type="text" className={`${inputClass} font-mono`} value={form.templateCode} onChange={e => handleChange('templateCode', e.target.value)} placeholder="01GTKT..." />
                        </div>
                        <div>
                            <label className={labelClass}>Ký hiệu (Series)</label>
                            <input type="text" className={`${inputClass} font-mono`} value={form.series} onChange={e => handleChange('series', e.target.value)} placeholder="AA/23..." />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Từ số</label>
                            <input type="number" className={inputClass} value={form.fromNumber} onChange={e => handleChange('fromNumber', parseInt(e.target.value))} />
                        </div>
                        <div>
                            <label className={labelClass}>Đến số</label>
                            <input type="number" className={inputClass} value={form.toNumber} onChange={e => handleChange('toNumber', parseInt(e.target.value))} />
                        </div>
                        <div>
                            <label className={labelClass}>Hiện tại</label>
                            <input type="number" className={inputClass} value={form.currentNumber} onChange={e => handleChange('currentNumber', parseInt(e.target.value))} />
                        </div>
                    </div>
                     <div>
                        <label className={labelClass}>Trạng thái</label>
                        <select 
                            className={inputClass}
                            value={form.status}
                            onChange={e => handleChange('status', e.target.value)}
                        >
                            <option value="Active">Đang sử dụng (Active)</option>
                            <option value="Closed">Đã khóa (Closed)</option>
                        </select>
                    </div>
                </div>
                
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition">Hủy</button>
                    <button onClick={() => onSave(form as InvoiceBook)} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2 transition-transform active:scale-95">
                        <SaveIcon className="w-4 h-4"/> Lưu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BillingSettingsView;
