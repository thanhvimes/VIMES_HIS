
import React, { useState } from 'react';
import { mockTemplates, ReportTemplate } from '../data';
import { 
    PlusIcon, TrashIcon, PencilIcon, DocumentTextIcon, 
    SearchIcon, DocumentPlusIcon, FilterIcon, RefreshIcon,
    ChevronDownIcon, CheckBadgeIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import TemplateEditorModal from './components/TemplateEditorModal';

const ConfigurationView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [templates, setTemplates] = useState<ReportTemplate[]>(mockTemplates);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalityFilter, setModalityFilter] = useState<string>('All');

    const handleAddNew = () => {
        setEditingTemplate(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (template: ReportTemplate) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };

    const handleSaveTemplate = (template: ReportTemplate) => {
        if (editingTemplate) {
            setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
        } else {
            setTemplates(prev => [template, ...prev]);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa mẫu này?')) {
            setTemplates(prev => prev.filter(t => t.id !== id));
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesModality = modalityFilter === 'All' || t.modality === modalityFilter;
        return matchesSearch && matchesModality;
    });

    const getModalityColor = (mod: string) => {
        switch(mod) {
            case 'X-Ray': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'CT': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
            case 'MRI': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'Ultrasound': return 'bg-pink-100 text-pink-800 border-pink-200';
            default: return 'bg-slate-100 text-slate-800 border-slate-200';
        }
    };

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg">
                            <DocumentTextIcon className="w-6 h-6"/>
                        </div>
                        Thư viện Mẫu Kết quả
                    </h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Quản lý và chuẩn hóa các mẫu báo cáo chẩn đoán hình ảnh toàn viện.</p>
                </div>
                <button 
                    onClick={handleAddNew}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition active:scale-95"
                >
                    <PlusIcon className="w-4 h-4"/> Thêm mẫu mới
                </button>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 items-center">
                <div className="relative flex-1">
                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên mẫu, từ khóa nội dung..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-blue-500 outline-none ${fontSettings.controls}`} 
                    />
                </div>
                <div className="flex gap-2">
                    <select 
                        value={modalityFilter}
                        onChange={e => setModalityFilter(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                    >
                        <option value="All">Tất cả loại máy</option>
                        <option value="X-Ray">X-Quang</option>
                        <option value="CT">CT Scanner</option>
                        <option value="MRI">MRI</option>
                        <option value="Ultrasound">Siêu âm</option>
                        <option value="Endoscopy">Nội soi</option>
                    </select>
                    <button className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-500 hover:bg-slate-200 transition"><RefreshIcon className="w-5 h-5"/></button>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {filteredTemplates.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-slate-400 italic font-bold">Không tìm thấy mẫu báo cáo nào phù hợp.</div>
                ) : (
                    filteredTemplates.map(tpl => (
                        <div 
                            key={tpl.id}
                            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border ${getModalityColor(tpl.modality)}`}>
                                    {tpl.modality}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(tpl)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition shadow-sm"><PencilIcon className="w-4 h-4"/></button>
                                    <button onClick={() => handleDelete(tpl.id)} className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-600 hover:text-white transition shadow-sm"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                            <h3 className="font-black text-slate-800 dark:text-white text-base leading-tight mb-2 line-clamp-1">{tpl.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed mb-4 flex-1">
                                {tpl.content.replace(/<[^>]+>/g, '')}
                            </p>
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Version 2023.1</span>
                                <button onClick={() => handleEdit(tpl)} className="text-blue-600 font-bold text-xs hover:underline flex items-center gap-1">Xem chi tiết <ChevronDownIcon className="w-3 h-3 -rotate-90"/></button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <TemplateEditorModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTemplate}
                initialData={editingTemplate}
            />
        </div>
    );
};

export default ConfigurationView;
