
import React, { useState, useMemo } from 'react';
import { 
    ExclamationCircleIcon, SearchIcon, PlusIcon, TrashIcon, 
    PencilIcon, XIcon, SaveIcon, CheckBadgeIcon, ShieldCheckIcon,
    // Fix: Removed AlertIcon and InformationCircleIcon as they are not exported from Icons.tsx
    // Added CheckCircleIcon to fix the "Cannot find name 'CheckCircleIcon'" error.
    CheckCircleIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { mockInteractions } from '../data';
import { drugList } from '../../consultation/data/catalogs';
import { DrugInteraction, DrugItem } from '../../../types';
import Combobox, { ComboboxColumn } from '../../../components/shared/Combobox';

const InteractionView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [interactions, setInteractions] = useState<DrugInteraction[]>(mockInteractions);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<DrugInteraction>>({ severity: 'Moderate', description: '', management: '' });
    const [drug1, setDrug1] = useState<DrugItem | null>(null);
    const [drug2, setDrug2] = useState<DrugItem | null>(null);

    const drugColumns: ComboboxColumn<DrugItem>[] = [
        { key: 'code', label: 'Mã', width: '20%', className: 'font-mono text-xs' },
        { key: 'name', label: 'Tên thuốc', width: '80%', className: 'font-bold' },
    ];

    const filteredInteractions = useMemo(() => {
        return interactions.filter(i => 
            i.drugName1.toLowerCase().includes(searchTerm.toLowerCase()) || 
            i.drugName2.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [interactions, searchTerm]);

    const getSeverityStyle = (severity: string) => {
        switch (severity) {
            case 'Contraindicated': return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: <XCircleIcon className="w-6 h-6"/> };
            case 'Severe': return { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: <ExclamationCircleIcon className="w-6 h-6"/> };
            default: return { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <InformationCircleIcon className="w-6 h-6"/> };
        }
    };

    return (
        <div className="h-full flex flex-col gap-5 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <div className="p-2 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20">
                            <ShieldCheckIcon className="w-6 h-6"/>
                        </div>
                        Cảnh báo an toàn thuốc
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic">Hệ thống tự động phát hiện tương tác khi bác sĩ kê đơn.</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm cặp thuốc tương tác..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${fontSettings.controls}`}
                        />
                    </div>
                    <button onClick={() => { setEditingId(null); setDrug1(null); setDrug2(null); setIsModalOpen(true); }} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition active:scale-95 whitespace-nowrap">
                        <PlusIcon className="w-4 h-4"/> Thêm quy tắc
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 xl:grid-cols-2 gap-4 pb-10">
                {filteredInteractions.map(item => {
                    const style = getSeverityStyle(item.severity);
                    return (
                        <div key={item.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden flex flex-col">
                            <div className={`${style.bg} dark:bg-opacity-10 p-4 border-b ${style.border} flex justify-between items-center`}>
                                <div className="flex items-center gap-3">
                                    <div className={style.color}>{style.icon}</div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${style.color}`}>
                                        Mức độ: {item.severity === 'Contraindicated' ? 'Chống chỉ định' : item.severity === 'Severe' ? 'Nghiêm trọng' : 'Thận trọng'}
                                    </span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingId(item.id); setDrug1({code: item.drugCode1, name: item.drugName1} as any); setDrug2({code: item.drugCode2, name: item.drugName2} as any); setFormData(item); setIsModalOpen(true); }} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full text-blue-600 transition shadow-sm"><PencilIcon className="w-4 h-4"/></button>
                                    <button onClick={() => setInteractions(prev => prev.filter(i => i.id !== item.id))} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full text-rose-600 transition shadow-sm"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                            <div className="p-5 flex-1">
                                <div className="flex flex-col md:flex-row items-center gap-4 mb-4">
                                    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-center font-black text-slate-800 dark:text-white uppercase text-sm">{item.drugName1}</div>
                                    <div className="text-slate-400 font-bold italic">và</div>
                                    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-700 text-center font-black text-slate-800 dark:text-white uppercase text-sm">{item.drugName2}</div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Cơ chế & Hậu quả</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{item.description}</p>
                                    </div>
                                    <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900">
                                        <p className="text-[10px] font-black text-blue-500 uppercase mb-1 flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Hướng dẫn xử trí</p>
                                        <p className="text-sm text-blue-700 dark:text-blue-300 font-bold italic">{item.management}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-slide-in-up border border-slate-200 dark:border-slate-700">
                        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">{editingId ? 'Cập nhật quy tắc' : 'Thêm tương tác mới'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition"><XIcon className="w-6 h-6"/></button>
                        </div>
                        <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); alert('Đã lưu quy tắc thành công!'); }} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Combobox<DrugItem> label="Thuốc thứ nhất" options={drugList} columns={drugColumns} value={drug1?.name} onChange={(_, i) => setDrug1(i || null)} displayValue={i => i.name} />
                                <Combobox<DrugItem> label="Thuốc thứ hai" options={drugList} columns={drugColumns} value={drug2?.name} onChange={(_, i) => setDrug2(i || null)} displayValue={i => i.name} />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase mb-2">Mức độ tương tác</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Mild', 'Moderate', 'Contraindicated'].map(lvl => (
                                        <button key={lvl} type="button" onClick={() => setFormData({...formData, severity: lvl as any})} className={`py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${formData.severity === lvl ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 border-slate-200 text-slate-400'}`}>
                                            {lvl === 'Contraindicated' ? 'Chống CĐ' : lvl === 'Moderate' ? 'Thận trọng' : 'Nhẹ'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea className="w-full p-4 border border-slate-300 dark:border-slate-600 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-700" rows={3} placeholder="Mô tả cơ chế và hậu quả..."></textarea>
                            <textarea className="w-full p-4 border border-blue-200 dark:border-blue-900 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/30 dark:bg-blue-900/10 font-bold italic" rows={3} placeholder="Hướng dẫn cho bác sĩ (VD: Đổi thuốc sang...)"></textarea>
                            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-sm shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 transition active:scale-95">
                                <SaveIcon className="w-5 h-5"/> Lưu quy tắc lâm sàng (F9)
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Re-defining missing helper icons for this module
const InformationCircleIcon = ({className}: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = ({className}: any) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default InteractionView;
