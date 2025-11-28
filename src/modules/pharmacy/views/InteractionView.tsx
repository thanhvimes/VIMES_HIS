
import React, { useState, useMemo } from 'react';
import { 
    ExclamationCircleIcon, 
    SearchIcon, 
    PlusIcon, 
    TrashIcon, 
    PencilIcon, 
    XIcon, 
    SaveIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockInteractions } from '../data';
import { drugList } from '../../consultation/data/catalogs'; 
import { DrugInteraction, DrugItem } from '../../../types/finance';
import Combobox, { ComboboxColumn } from '../../../components/shared/Combobox';

const InteractionView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [interactions, setInteractions] = useState<DrugInteraction[]>(mockInteractions);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<DrugInteraction>>({
        severity: 'Moderate',
        description: '',
        management: ''
    });
    const [drug1, setDrug1] = useState<DrugItem | null>(null);
    const [drug2, setDrug2] = useState<DrugItem | null>(null);

    const drugColumns: ComboboxColumn<DrugItem>[] = [
        { key: 'code', label: 'Mã', width: '20%', className: 'font-mono text-xs text-slate-500' },
        { key: 'name', label: 'Tên thuốc', width: '60%', className: 'font-bold' },
        { key: 'activeIngredient', label: 'Hoạt chất', width: '20%', className: 'text-xs italic' },
    ];

    const filteredInteractions = useMemo(() => {
        return interactions.filter(i => 
            i.drugName1.toLowerCase().includes(searchTerm.toLowerCase()) || 
            i.drugName2.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [interactions, searchTerm]);

    const handleAddNew = () => {
        setEditingId(null);
        setFormData({ severity: 'Moderate', description: '', management: '' });
        setDrug1(null);
        setDrug2(null);
        setIsModalOpen(true);
    };

    const handleEdit = (interaction: DrugInteraction) => {
        setEditingId(interaction.id);
        setFormData({
            severity: interaction.severity,
            description: interaction.description,
            management: interaction.management
        });
        
        const d1 = drugList.find(d => d.code === interaction.drugCode1) || { code: interaction.drugCode1, name: interaction.drugName1 } as DrugItem;
        const d2 = drugList.find(d => d.code === interaction.drugCode2) || { code: interaction.drugCode2, name: interaction.drugName2 } as DrugItem;
        
        setDrug1(d1);
        setDrug2(d2);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa cảnh báo tương tác này?')) {
            setInteractions(prev => prev.filter(i => i.id !== id));
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!drug1 || !drug2) {
            alert("Vui lòng chọn đủ 2 thuốc.");
            return;
        }
        
        if (drug1.code === drug2.code) {
            alert("Không thể chọn 2 thuốc giống nhau.");
            return;
        }

        if (editingId) {
            setInteractions(prev => prev.map(i => i.id === editingId ? {
                ...i,
                drugCode1: drug1.code,
                drugName1: drug1.name,
                drugCode2: drug2.code,
                drugName2: drug2.name,
                severity: formData.severity as any,
                description: formData.description || '',
                management: formData.management || ''
            } : i));
        } else {
            const newInteraction: DrugInteraction = {
                id: `INT-${Date.now()}`,
                drugCode1: drug1.code,
                drugName1: drug1.name,
                drugCode2: drug2.code,
                drugName2: drug2.name,
                severity: formData.severity as any,
                description: formData.description || '',
                management: formData.management || ''
            };
            setInteractions(prev => [newInteraction, ...prev]);
        }
        setIsModalOpen(false);
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'Contraindicated': return <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-bold uppercase">Chống chỉ định</span>;
            case 'Severe': return <span className="px-2 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold uppercase">Nghiêm trọng</span>;
            case 'Moderate': return <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 text-xs font-bold uppercase">Thận trọng</span>;
            default: return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold uppercase">Nhẹ</span>;
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <ExclamationCircleIcon className="w-8 h-8 text-orange-500"/> Quản lý Tương tác thuốc
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Thiết lập các quy tắc cảnh báo an toàn khi kê đơn.</p>
                </div>
                <button 
                    onClick={handleAddNew}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition transform active:scale-95"
                >
                    <PlusIcon className="w-5 h-5"/> Thêm quy tắc mới
                </button>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="relative max-w-md">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm theo tên thuốc, hoạt chất..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-1/4">Cặp thuốc tương tác</th>
                                <th className="p-4 w-32 text-center">Mức độ</th>
                                <th className="p-4">Mô tả & Hậu quả</th>
                                <th className="p-4">Xử trí</th>
                                <th className="p-4 text-right w-24"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredInteractions.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-400 italic">Không tìm thấy dữ liệu tương tác.</td>
                                </tr>
                            ) : (
                                filteredInteractions.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                    1. {item.drugName1}
                                                </span>
                                                <span className="text-xs text-slate-400 pl-4">vs</span>
                                                <span className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                    2. {item.drugName2}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {getSeverityBadge(item.severity)}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                                            {item.description}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300 text-sm italic border-l-4 border-blue-100 dark:border-blue-900 pl-4 bg-slate-50 dark:bg-slate-900/20 rounded-r">
                                            {item.management}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"><PencilIcon className="w-4 h-4"/></button>
                                                <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                {editingId ? <PencilIcon className="w-5 h-5 text-blue-600"/> : <PlusIcon className="w-5 h-5 text-green-600"/>}
                                {editingId ? 'Cập nhật Tương tác' : 'Thêm mới Tương tác'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition">
                                <XIcon className="w-6 h-6"/>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Thuốc 1 <span className="text-red-500">*</span></label>
                                    <Combobox<DrugItem>
                                        options={drugList}
                                        columns={drugColumns}
                                        displayValue={item => item.name}
                                        value={drug1 ? drug1.name : ''}
                                        onChange={(_, item) => setDrug1(item || null)}
                                        placeholder="Chọn thuốc thứ nhất..."
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Thuốc 2 <span className="text-red-500">*</span></label>
                                    <Combobox<DrugItem>
                                        options={drugList}
                                        columns={drugColumns}
                                        displayValue={item => item.name}
                                        value={drug2 ? drug2.name : ''}
                                        onChange={(_, item) => setDrug2(item || null)}
                                        placeholder="Chọn thuốc thứ hai..."
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mức độ nghiêm trọng <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {['Mild', 'Moderate', 'Severe', 'Contraindicated'].map((lvl) => (
                                        <label key={lvl} className={`flex items-center justify-center px-3 py-2 rounded-lg border cursor-pointer transition-all ${
                                            formData.severity === lvl 
                                            ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500 dark:bg-blue-900/30 dark:text-blue-300' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300'
                                        }`}>
                                            <input 
                                                type="radio" 
                                                name="severity" 
                                                value={lvl} 
                                                checked={formData.severity === lvl} 
                                                onChange={e => setFormData({...formData, severity: e.target.value as any})}
                                                className="hidden"
                                            />
                                            <span className="text-xs font-bold uppercase">
                                                {lvl === 'Contraindicated' ? 'Chống chỉ định' : lvl === 'Severe' ? 'Nghiêm trọng' : lvl === 'Moderate' ? 'Thận trọng' : 'Nhẹ'}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Mô tả tương tác / Cơ chế</label>
                                <textarea 
                                    rows={3}
                                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Mô tả chi tiết về tương tác..."
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Hướng dẫn xử trí</label>
                                <textarea 
                                    rows={3}
                                    className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 resize-none"
                                    placeholder="Lời khuyên cho bác sĩ (VD: Thay thế thuốc, chỉnh liều...)"
                                    value={formData.management}
                                    onChange={e => setFormData({...formData, management: e.target.value})}
                                ></textarea>
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 font-semibold transition">
                                    Hủy bỏ
                                </button>
                                <button type="submit" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition transform active:scale-95">
                                    <SaveIcon className="w-4 h-4"/> Lưu quy tắc
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InteractionView;
