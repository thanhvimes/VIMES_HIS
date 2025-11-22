
import React, { useState, useEffect, useRef } from 'react';
import { XIcon, SaveIcon, DocumentTextIcon } from '../../../../components/Icons';
import { ReportTemplate } from '../../data';

interface TemplateEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (template: ReportTemplate) => void;
    initialData?: ReportTemplate;
}

const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [name, setName] = useState('');
    const [modality, setModality] = useState<ReportTemplate['modality']>('X-Ray');
    const [content, setContent] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && initialData) {
            setName(initialData.name);
            setModality(initialData.modality);
            setContent(initialData.content);
        } else if (isOpen) {
            setName('');
            setModality('X-Ray');
            setContent('');
        }
    }, [isOpen, initialData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            id: initialData?.id || `TPL-${Date.now()}`,
            name,
            modality,
            content
        });
        onClose();
    };

    const insertTag = (startTag: string, endTag: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);
        
        const newText = text.substring(0, start) + startTag + selectedText + endTag + text.substring(end);
        
        setContent(newText);
        
        // Restore focus and selection after state update
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + startTag.length, start + startTag.length);
        }, 0);
    };

    const insertTable = () => {
        const tableHtml = `
<table style="width:100%; border-collapse: collapse; margin-bottom: 10px;">
  <tr>
    <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background-color: #f1f5f9;">Tiêu đề 1</td>
    <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; background-color: #f1f5f9;">Tiêu đề 2</td>
  </tr>
  <tr>
    <td style="border: 1px solid #cbd5e1; padding: 8px;">Nội dung...</td>
    <td style="border: 1px solid #cbd5e1; padding: 8px;">Nội dung...</td>
  </tr>
</table>`;
        insertTag(tableHtml);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-blue-600"/>
                        {initialData ? 'Chỉnh sửa Mẫu báo cáo' : 'Thêm mới Mẫu báo cáo'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
                    {/* Form Side */}
                    <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-col">
                        <div className="space-y-4 flex-1 flex flex-col">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tên mẫu</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                        placeholder="VD: Siêu âm ổ bụng tổng quát"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Loại dịch vụ</label>
                                    <select 
                                        value={modality}
                                        onChange={(e) => setModality(e.target.value as any)}
                                        className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                                    >
                                        <option value="X-Ray">X-Ray (X-Quang)</option>
                                        <option value="CT">CT Scanner</option>
                                        <option value="MRI">MRI (Cộng hưởng từ)</option>
                                        <option value="Ultrasound">Ultrasound (Siêu âm)</option>
                                        <option value="Endoscopy">Endoscopy (Nội soi)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="flex-1 flex flex-col">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nội dung (HTML)</label>
                                
                                {/* Simple Toolbar */}
                                <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-700 rounded-t-lg border border-b-0 border-slate-300 dark:border-slate-600">
                                    <button type="button" onClick={() => insertTag('<b>', '</b>')} className="px-2 py-1 hover:bg-white dark:hover:bg-slate-600 rounded text-xs font-bold" title="In đậm">B</button>
                                    <button type="button" onClick={() => insertTag('<i>', '</i>')} className="px-2 py-1 hover:bg-white dark:hover:bg-slate-600 rounded text-xs italic" title="In nghiêng">I</button>
                                    <button type="button" onClick={() => insertTag('<u>', '</u>')} className="px-2 py-1 hover:bg-white dark:hover:bg-slate-600 rounded text-xs underline" title="Gạch chân">U</button>
                                    <div className="w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                                    <button type="button" onClick={() => insertTag('<h3>', '</h3>')} className="px-2 py-1 hover:bg-white dark:hover:bg-slate-600 rounded text-xs font-bold" title="Tiêu đề">H3</button>
                                    <button type="button" onClick={() => insertTag('<ul>\n  <li>', '</li>\n</ul>')} className="px-2 py-1 hover:bg-white dark:hover:bg-slate-600 rounded text-xs" title="Danh sách">List</button>
                                    <button type="button" onClick={() => insertTag('<br/>\n')} className="px-2 py-1 hover:bg-white dark:hover:bg-slate-600 rounded text-xs" title="Xuống dòng">BR</button>
                                    <div className="w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                                    <button type="button" onClick={insertTable} className="px-2 py-1 hover:bg-white dark:hover:bg-slate-600 rounded text-xs" title="Chèn Bảng">Table</button>
                                </div>

                                <textarea 
                                    ref={textareaRef}
                                    required
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full flex-1 p-3 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-b-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white resize-none leading-relaxed"
                                    placeholder="Nhập nội dung mẫu báo cáo... (Hỗ trợ HTML tags)"
                                />
                            </div>
                        </div>
                    </form>

                    {/* Preview Side */}
                    <div className="flex-1 p-6 bg-slate-100 dark:bg-slate-900/50 overflow-y-auto flex flex-col">
                        <label className="block text-sm font-bold text-slate-500 uppercase mb-3">Xem trước hiển thị</label>
                        <div className="bg-white text-black p-8 shadow-md border border-slate-200 min-h-[400px] rounded-lg prose max-w-none flex-1">
                            <h3 className="text-center font-bold uppercase text-lg mb-6 text-blue-800 border-b pb-2">{name || 'TIÊU ĐỀ MẪU'}</h3>
                            <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '') }} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg font-medium transition">
                        Hủy bỏ
                    </button>
                    <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition">
                        <SaveIcon className="w-4 h-4"/> Lưu mẫu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TemplateEditorModal;
