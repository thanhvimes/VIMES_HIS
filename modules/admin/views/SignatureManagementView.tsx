
import React, { useState, useRef, useMemo } from 'react';
import { 
    SearchIcon, 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    SignatureIcon,
    XIcon,
    CheckCircleIcon,
    BanIcon,
    ArrowUpTrayIcon,
    InkPenIcon,
    FilterIcon,
    UserGroupIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import SignatureModal from '../../../components/shared/SignatureModal';
import Combobox, { ComboboxColumn } from '../../../components/shared/Combobox';
import { doctorOptions, DoctorItem } from '../../consultation/data/catalogs';

// --- TYPES ---
interface DigitalSignature {
    id: string;
    doctorId: string;
    doctorName: string;
    department: string;
    imageUrl: string;
    status: 'active' | 'inactive';
    updatedAt: string;
}

// --- MOCK DATA ---
const mockSignatures: DigitalSignature[] = [
    { 
        id: 'SIG001', 
        doctorId: 'BS001', 
        doctorName: 'BS. Nguyễn Văn A', 
        department: 'Ngoại tổng quát', 
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Signature_sample.svg/1200px-Signature_sample.svg.png', // Placeholder
        status: 'active', 
        updatedAt: '2023-11-20' 
    },
    { 
        id: 'SIG002', 
        doctorId: 'BS002', 
        doctorName: 'BS. Trần Thị B', 
        department: 'Gây mê hồi sức', 
        imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Barack_Obama_signature.svg/1200px-Barack_Obama_signature.svg.png', // Placeholder
        status: 'active', 
        updatedAt: '2023-10-15' 
    },
    { 
        id: 'SIG003', 
        doctorId: 'BS003', 
        doctorName: 'BS. Lê Văn C', 
        department: 'Chấn thương chỉnh hình', 
        imageUrl: '', 
        status: 'inactive', 
        updatedAt: '2023-09-01' 
    },
];

// --- MODAL COMPONENT ---
const SignatureFormModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (data: DigitalSignature) => void; 
    initialData?: DigitalSignature 
}) => {
    const [formData, setFormData] = useState<Partial<DigitalSignature>>(initialData || {
        status: 'active',
        imageUrl: ''
    });
    const [isDrawModalOpen, setIsDrawModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrawSave = (dataUrl: string) => {
        setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
        setIsDrawModalOpen(false);
    };

    const handleDoctorSelect = (_: string, item?: DoctorItem) => {
        if (item) {
            setFormData(prev => ({
                ...prev,
                doctorId: item.id,
                doctorName: item.name,
                department: item.department
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.doctorName || !formData.imageUrl) {
            alert("Vui lòng chọn bác sĩ và cập nhật mẫu chữ ký.");
            return;
        }
        onSave({
            id: formData.id || `SIG-${Date.now()}`,
            doctorId: formData.doctorId || '',
            doctorName: formData.doctorName,
            department: formData.department || '',
            imageUrl: formData.imageUrl,
            status: formData.status || 'active',
            updatedAt: new Date().toISOString().slice(0, 10)
        });
    };

    const doctorColumns: ComboboxColumn<DoctorItem>[] = [
        { key: 'id', label: 'Mã', width: '20%', className: 'font-mono text-xs text-slate-500' },
        { key: 'name', label: 'Tên bác sĩ', width: '50%', className: 'font-bold' },
        { key: 'department', label: 'Khoa', width: '30%', className: 'text-xs' },
    ];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <SignatureIcon className="w-5 h-5 text-blue-600"/>
                        {initialData ? 'Cập nhật Chữ ký số' : 'Thêm Chữ ký mới'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Bác sĩ / Nhân viên</label>
                        <Combobox<DoctorItem>
                            value={formData.doctorName}
                            onChange={handleDoctorSelect}
                            options={doctorOptions}
                            columns={doctorColumns}
                            displayValue={item => item.name}
                            placeholder="Tìm kiếm bác sĩ..."
                            disabled={!!initialData} // Lock if editing existing
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mẫu chữ ký</label>
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900/50 relative h-48 group">
                            {formData.imageUrl ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    <img src={formData.imageUrl} alt="Signature" className="max-h-full max-w-full object-contain" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                                        <button 
                                            type="button" 
                                            onClick={() => setFormData(prev => ({...prev, imageUrl: ''}))}
                                            className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                                            title="Xóa ảnh"
                                        >
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 w-full">
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex items-center justify-center gap-2 py-2 px-4 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition"
                                    >
                                        <ArrowUpTrayIcon className="w-5 h-5"/> Tải ảnh lên
                                    </button>
                                    <div className="text-xs text-slate-400 text-center uppercase font-bold">- Hoặc -</div>
                                    <button 
                                        type="button"
                                        onClick={() => setIsDrawModalOpen(true)}
                                        className="flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                                    >
                                        <InkPenIcon className="w-5 h-5"/> Vẽ trực tiếp
                                    </button>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={formData.status === 'active'}
                                onChange={e => setFormData(prev => ({...prev, status: e.target.checked ? 'active' : 'inactive'}))}
                                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Kích hoạt sử dụng</span>
                        </label>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded font-medium">Hủy bỏ</button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 shadow">
                        Lưu chữ ký
                    </button>
                </div>
            </div>

            {/* Draw Modal Layer */}
            <SignatureModal 
                isOpen={isDrawModalOpen}
                onClose={() => setIsDrawModalOpen(false)}
                onSave={handleDrawSave}
            />
        </div>
    );
};


// --- MAIN VIEW ---
const SignatureManagementView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [signatures, setSignatures] = useState<DigitalSignature[]>(mockSignatures);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('All');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<DigitalSignature | undefined>(undefined);

    const filteredSignatures = useMemo(() => {
        return signatures.filter(sig => {
            const matchesSearch = sig.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  sig.doctorId.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDept = filterDept === 'All' || sig.department === filterDept;
            return matchesSearch && matchesDept;
        });
    }, [signatures, searchTerm, filterDept]);

    const handleSave = (data: DigitalSignature) => {
        if (editingItem) {
            setSignatures(prev => prev.map(s => s.id === data.id ? data : s));
        } else {
            setSignatures(prev => [data, ...prev]);
        }
        setIsModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if(window.confirm("Bạn có chắc chắn muốn xóa chữ ký này?")) {
            setSignatures(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleAddNew = () => {
        setEditingItem(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (item: DigitalSignature) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const departments = ['All', ...Array.from(new Set(mockSignatures.map(s => s.department)))];

    return (
        <div className="h-full flex flex-col space-y-4">
             {/* Header */}
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <SignatureIcon className="w-8 h-8 text-blue-600"/> Quản lý Chữ ký số
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý mẫu chữ ký điện tử của nhân viên y tế.</p>
                </div>
                
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm tên bác sĩ..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                        />
                    </div>
                    <div className="relative">
                        <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <select 
                            value={filterDept}
                            onChange={e => setFilterDept(e.target.value)}
                            className={`pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer ${fontSettings.controls}`}
                        >
                            <option value="All">Tất cả khoa</option>
                            {departments.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <button 
                        onClick={handleAddNew}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-md active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5"/> Thêm mới
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-20 text-center">Mẫu</th>
                                <th className="p-4">Bác sĩ / Nhân viên</th>
                                <th className="p-4">Khoa / Phòng</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Ngày cập nhật</th>
                                <th className="p-4 text-right w-32">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredSignatures.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-slate-400 italic">
                                        Chưa có chữ ký nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredSignatures.map(sig => (
                                    <tr key={sig.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-4 text-center">
                                            <div className="w-16 h-10 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 flex items-center justify-center overflow-hidden p-1">
                                                {sig.imageUrl ? (
                                                    <img src={sig.imageUrl} alt="Sig" className="max-w-full max-h-full object-contain" />
                                                ) : (
                                                    <span className="text-[10px] text-slate-400">Trống</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">{sig.doctorName}</div>
                                            <div className="text-xs text-slate-500 font-mono">{sig.doctorId}</div>
                                        </td>
                                        <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                                            <div className="flex items-center gap-1">
                                                <UserGroupIcon className="w-3.5 h-3.5 text-slate-400"/> {sig.department}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {sig.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                                    <CheckCircleIcon className="w-3 h-3"/> Sẵn sàng
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                    <BanIcon className="w-3 h-3"/> Vô hiệu
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right text-sm text-slate-500 dark:text-slate-400">
                                            {sig.updatedAt}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleEdit(sig)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                                                    title="Chỉnh sửa"
                                                >
                                                    <PencilIcon className="w-4 h-4"/>
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(sig.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                                                    title="Xóa"
                                                >
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 flex justify-between items-center">
                    <span>Hiển thị {filteredSignatures.length} chữ ký</span>
                </div>
            </div>

            {/* Modal */}
            <SignatureFormModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={editingItem}
            />
        </div>
    );
};

export default SignatureManagementView;
