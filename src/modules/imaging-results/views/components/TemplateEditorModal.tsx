
import React, { useState, useEffect, useRef } from 'react';
import { 
    XIcon, 
    SaveIcon, 
    DocumentTextIcon, 
    CodeBracketIcon, 
    PhotographIcon, 
    AlignLeftIcon, 
    AlignCenterIcon, 
    AlignRightIcon, 
    AlignJustifyIcon,
    ListBulletIcon,
    EyeIcon
} from '../../../../components/Icons';
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
    const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const visualEditorRef = useRef<HTMLDivElement>(null);

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

    // Sync content when switching modes
    useEffect(() => {
        if (viewMode === 'visual' && visualEditorRef.current) {
            visualEditorRef.current.innerHTML = content;
        }
    }, [viewMode]);

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

    // -- COMMAND HANDLERS (For Visual Mode) --
    const execCmd = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (visualEditorRef.current) {
            setContent(visualEditorRef.current.innerHTML);
        }
    };

    const handleInsertImage = () => {
        const url = prompt('Nhập đường dẫn hình ảnh (URL):', 'https://via.placeholder.com/150');
        if (url) {
            if (viewMode === 'visual') {
                execCmd('insertImage', url);
            } else {
                insertTag(`<img src="${url}" alt="Image" style="max-width: 100%; height: auto;" />`);
            }
        }
    };

    // -- TEXTAREA HANDLERS (For Code Mode) --
    const insertTag = (startTag: string, endTag: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);
        
        const newText = text.substring(0, start) + startTag + selectedText + endTag + text.substring(end);
        
        setContent(newText);
        
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
        if (viewMode === 'visual') {
            execCmd('insertHTML', tableHtml);
        } else {
            insertTag(tableHtml);
        }
    };

    // Update content state on visual editor input
    const handleVisualInput = (e: React.FormEvent<HTMLDivElement>) => {
        setContent(e.currentTarget.innerHTML);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-6xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up max-h-[90vh]">
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

                <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
                    {/* Editor Side */}
                    <form onSubmit={handleSubmit} className="flex-1 p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-700 flex flex-col h-full">
                        <div className="space-y-4 flex-1 flex flex-col min-h-0">
                            <div className="grid grid-cols-3 gap-4 shrink-0">
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
                            
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex justify-between items-end mb-1">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Nội dung mẫu</label>
                                    <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 border border-slate-200 dark:border-slate-600">
                                        <button 
                                            type="button"
                                            onClick={() => setViewMode('visual')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${viewMode === 'visual' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            <EyeIcon className="w-3 h-3"/> Visual
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setViewMode('code')}
                                            className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all ${viewMode === 'code' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            <CodeBracketIcon className="w-3 h-3"/> Source
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Enhanced Toolbar */}
                                <div className="flex flex-wrap gap-1 p-1.5 bg-slate-100 dark:bg-slate-700 rounded-t-lg border border-b-0 border-slate-300 dark:border-slate-600 items-center">
                                    {viewMode === 'visual' ? (
                                        <>
                                            <button type="button" onClick={() => execCmd('bold')} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded text-xs font-bold w-7 text-center" title="In đậm">B</button>
                                            <button type="button" onClick={() => execCmd('italic')} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded text-xs italic w-7 text-center" title="In nghiêng">I</button>
                                            <button type="button" onClick={() => execCmd('underline')} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded text-xs underline w-7 text-center" title="Gạch chân">U</button>
                                            <div className="w-px h-4 bg-slate-300 dark:bg-slate-500 mx-1"></div>
                                            <button type="button" onClick={() => execCmd('justifyLeft')} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded" title="Căn trái"><AlignLeftIcon className="w-4 h-4"/></button>
                                            <button type="button" onClick={() => execCmd('justifyCenter')} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded" title="Căn giữa"><AlignCenterIcon className="w-4 h-4"/></button>
                                            <button type="button" onClick={() => execCmd('justifyRight')} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded" title="Căn phải"><AlignRightIcon className="w-4 h-4"/></button>
                                            <button type="button" onClick={() => execCmd('justifyFull')} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded" title="Căn đều"><AlignJustifyIcon className="w-4 h-4"/></button>
                                            <div className="w-px h-4 bg-slate-300 dark:bg-slate-500 mx-1"></div>
                                            <button type="button" onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded" title="Danh sách"><ListBulletIcon className="w-4 h-4"/></button>
                                            <button type="button" onClick={handleInsertImage} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded" title="Chèn ảnh"><PhotographIcon className="w-4 h-4"/></button>
                                        </>
                                    ) : (
                                        <>
                                            {/* Code Mode Toolbar Shortcuts */}
                                            <button type="button" onClick={() => insertTag('<b>', '</b>')} className="px-2 py-1 hover:bg-white dark:hover:bg-slate-600 rounded text-xs font-bold" title="Bold">&lt;b&gt;</button>
                                            <button type="button" onClick={() => insertTag('<i>', '</i>')} className="px-2 py-1 hover:bg-white dark:hover:bg-slate-600 rounded text-xs italic" title="Italic">&lt;i&gt;</button>
                                            <button type="button" onClick={() => insertTag('<div style="text-align:center">', '</div>')} className="px-2 py-1 hover:bg-white dark:hover:bg-slate-600 rounded text-xs" title="Center">&lt;center&gt;</button>
                                            <button type="button" onClick={handleInsertImage} className="px-2 py-1 hover:bg-white dark:hover:bg-slate-600 rounded text-xs" title="Image Tag">&lt;img&gt;</button>
                                        </>
                                    )}
                                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-500 mx-1"></div>
                                    <button type="button" onClick={insertTable} className="px-2 py-1 hover:bg-white dark:hover:bg-slate-600 rounded text-xs" title="Chèn Bảng">Table</button>
                                </div>

                                {viewMode === 'code' ? (
                                    <textarea 
                                        ref={textareaRef}
                                        required
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full flex-1 p-3 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-b-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white resize-none leading-relaxed"
                                        placeholder="Nhập mã HTML..."
                                    />
                                ) : (
                                    <div
                                        ref={visualEditorRef}
                                        contentEditable
                                        onInput={handleVisualInput}
                                        className="w-full flex-1 p-4 border border-slate-300 dark:border-slate-600 rounded-b-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white overflow-y-auto outline-none focus:ring-2 focus:ring-blue-500 prose max-w-none dark:prose-invert"
                                        style={{ minHeight: '300px' }}
                                    />
                                )}
                            </div>
                        </div>
                    </form>

                    {/* Preview Side (Real-time) */}
                    <div className="lg:w-1/2 p-6 bg-slate-100 dark:bg-slate-900/50 overflow-y-auto flex flex-col border-l border-slate-200 dark:border-slate-700">
                        <label className="block text-sm font-bold text-slate-500 uppercase mb-3 flex justify-between">
                            Xem trước (Kết quả in)
                            <span className="text-xs font-normal normal-case bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">A4 Portrait</span>
                        </label>
                        <div className="bg-white text-black p-8 shadow-lg border border-slate-200 min-h-[297mm] w-full max-w-[210mm] mx-auto rounded-sm prose prose-sm max-w-none">
                            <h3 className="text-center font-bold uppercase text-xl mb-6 text-blue-900 border-b-2 border-blue-900 pb-2">{name || 'TIÊU ĐỀ MẪU'}</h3>
                            <div className="leading-relaxed text-justify" dangerouslySetInnerHTML={{ __html: content }} />
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
