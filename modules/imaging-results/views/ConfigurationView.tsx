
import React, { useState } from 'react';
import { mockTemplates, ReportTemplate } from '../data';
import { PlusIcon, TrashIcon, PencilIcon, DocumentTextIcon, SearchIcon, DocumentPlusIcon } from '../../../components/Icons';
import TemplateEditorModal from './components/TemplateEditorModal';

const ConfigurationView: React.FC = () => {
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

    const handleDuplicate = (e: React.MouseEvent, template: ReportTemplate) => {
        e.stopPropagation();
        const newTemplate = {
            ...template,
            id: `TPL-${Date.now()}`,
            name: `${template.name} (Copy)`
        };
        setTemplates(prev => [newTemplate, ...prev]);
        setEditingTemplate(newTemplate);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa mẫu này?')) {
            setTemplates(prev => prev.filter(t => t.id !== id));
        }
    };

    const handleSaveTemplate = (template: ReportTemplate) => {
        if (editingTemplate) {
            // Update
            setTemplates(prev => prev.map(t => t.id === template.id ? template : t));
        } else {
            // Add new
            setTemplates(prev => [template, ...prev]);
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesModality = modalityFilter === 'All' || t.modality === modalityFilter;
        return matchesSearch && matchesModality;
    });

    const getModalityColor = (mod: string) => {
        switch(mod) {
            case 'X-Ray': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'CT': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
            case 'MRI': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case 'Ultrasound': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
            case 'Endoscopy': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Thư viện Mẫu Kết quả</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý các mẫu phiếu in HTML cho chẩn đoán hình ảnh.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm mẫu..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
                        />
                    </div>
                    <select
                        value={modalityFilter}
                        onChange={(e) => setModalityFilter(e.target.value)}
                        className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="All">Tất cả loại</option>
                        <option value="X-Ray">X-Quang</option>
                        <option value="CT">CT Scanner</option>
                        <option value="MRI">MRI</option>
                        <option value="Ultrasound">Siêu âm</option>
                        <option value="Endoscopy">Nội soi</option>
                    </select>
                    <button 
                        onClick={handleAddNew}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold shadow flex items-center gap-2 hover:bg-blue-700 transition whitespace-nowrap"
                    >
                        <PlusIcon className="w-5 h-5"/> Thêm mẫu
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                        <h2 className="font-bold text-slate-700 dark:text-slate-200">Danh sách mẫu báo cáo ({filteredTemplates.length})</h2>
                    </div>
                    <div className="divide-y divide-slate-100 dark:divide-slate-700 overflow-y-auto flex-1">
                        {filteredTemplates.length === 0 ? (
                            <div className="p-10 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                                <DocumentTextIcon className="w-12 h-12 opacity-20 mb-2"/>
                                <p>Không tìm thấy mẫu báo cáo nào phù hợp.</p>
                            </div>
                        ) : (
                            filteredTemplates.map(tpl => (
                                <div key={tpl.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition flex justify-between items-start group cursor-pointer" onClick={() => handleEdit(tpl)}>
                                    <div className="flex items-start gap-4 flex-1 min-w-0">
                                        <div className="mt-1 p-2.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400 flex-shrink-0">
                                            <DocumentTextIcon className="w-5 h-5"/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${getModalityColor(tpl.modality)}`}>
                                                    {tpl.modality}
                                                </span>
                                                <h3 className="font-bold text-slate-800 dark:text-white truncate">{tpl.name}</h3>
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 font-mono line-clamp-2 leading-relaxed">
                                                {tpl.content.replace(/<[^>]+>/g, '')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition ml-4 items-center self-center">
                                        <button 
                                            onClick={(e) => handleDuplicate(e, tpl)}
                                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-slate-600 rounded-full transition"
                                            title="Nhân bản"
                                        >
                                            <DocumentPlusIcon className="w-4 h-4"/>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleEdit(tpl); }}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-600 rounded-full transition"
                                            title="Sửa"
                                        >
                                            <PencilIcon className="w-4 h-4"/>
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id); }}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-600 rounded-full transition"
                                            title="Xóa"
                                        >
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                        <h2 className="font-bold text-lg mb-2">Trạng thái Hệ thống</h2>
                        <p className="text-blue-100 text-sm mb-6">Tổng quan về các tài nguyên và thiết bị chẩn đoán hình ảnh đang hoạt động.</p>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center border-b border-blue-400/30 pb-2">
                                <span className="text-sm text-blue-100">Tổng số mẫu</span>
                                <span className="font-bold text-xl">{templates.length}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-blue-400/30 pb-2">
                                <span className="text-sm text-blue-100">X-Quang</span>
                                <span className="font-bold">2 Máy (Online)</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-blue-400/30 pb-2">
                                <span className="text-sm text-blue-100">CT Scanner</span>
                                <span className="font-bold">1 Máy (Online)</span>
                            </div>
                             <div className="flex justify-between items-center border-b border-blue-400/30 pb-2">
                                <span className="text-sm text-blue-100">Siêu âm</span>
                                <span className="font-bold">3 Máy (Online)</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 p-6 flex-1">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Hướng dẫn nhanh</h3>
                        <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 list-disc pl-4">
                            <li>Sử dụng thẻ <b>&lt;b&gt;</b> để in đậm tiêu đề các mục (ví dụ: <b>MÔ TẢ:</b>).</li>
                            <li>Sử dụng <b>&lt;br/&gt;</b> để xuống dòng.</li>
                            <li>Tạo danh sách bằng <b>&lt;ul&gt;</b> và <b>&lt;li&gt;</b> để trình bày rõ ràng.</li>
                            <li>Sử dụng nút <b>Table</b> để chèn bảng dữ liệu.</li>
                            <li>Luôn kiểm tra "Xem trước" để đảm bảo định dạng đúng khi in.</li>
                        </ul>
                    </div>
                </div>
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
