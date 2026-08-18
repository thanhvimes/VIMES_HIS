import React from 'react';

interface XmlPreviewModalProps {
    activeXmlDoc: any;
    onClose: () => void;
    getFormName: (formType: string) => string;
}

const XmlPreviewModal: React.FC<XmlPreviewModalProps> = ({ activeXmlDoc, onClose, getFormName }) => {
    if (!activeXmlDoc) return null;

    const handleDownloadXml = () => {
        const xmlContent = String(activeXmlDoc.xml_data || '');
        const safePatientName = String(activeXmlDoc.patient_name || 'ho-so')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]+/g, '_')
            .replace(/^_+|_+$/g, '') || 'ho-so';
        const docNo = String(activeXmlDoc.doc_no || 'xml').replace(/[^a-zA-Z0-9_-]+/g, '_');
        const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `KSK_${safePatientName}_${docNo}.xml`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/80 rounded-t-xl">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">XML Preview: {activeXmlDoc.patient_name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{getFormName(activeXmlDoc.form_type)} - Số: {activeXmlDoc.doc_no}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button type="button" onClick={handleDownloadXml} className="px-3 py-2 rounded-lg bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 text-xs font-bold shadow-sm">
                            Lưu file XML
                        </button>
                        <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition text-lg font-bold">
                            ×
                        </button>
                    </div>
                </div>
                <div className="p-4 flex-1 overflow-auto bg-slate-950 text-slate-200 font-mono text-xs border border-slate-800 flex flex-col">
                    <div className="text-teal-400 font-bold mb-2">// RAW XML BODY //</div>
                    <pre className="whitespace-pre-wrap flex-1">{activeXmlDoc.xml_data}</pre>
                    {activeXmlDoc.signature_status === 'Signed' && activeXmlDoc.signature && (
                        <div className="mt-4 pt-4 border-t border-slate-800">
                            <div className="text-green-400 font-bold mb-1">// DIGITAL SIGNATURE VALUE ({activeXmlDoc.signature_type}) //</div>
                            <div className="text-slate-500 break-all">{activeXmlDoc.signature}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default XmlPreviewModal;
