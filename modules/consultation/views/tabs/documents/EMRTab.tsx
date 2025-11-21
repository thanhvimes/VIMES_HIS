
import React, { useState, useEffect } from 'react';
import { 
    SearchIcon, 
    FolderIcon,
    DocumentReportIcon,
    CheckBadgeIcon,
    PencilIcon,
    PrinterIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ZoomInIcon,
    ZoomOutIcon
} from '../../../../../components/Icons';
import DocumentTree, { TreeNode } from '../../../../../components/shared/DocumentTree';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { Document, Page, pdfjs } from 'react-pdf';

// IMPORTANT: Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const mockEMRRecords: TreeNode[] = [
    {
        id: 'HS_2023', label: 'Hồ sơ: 251050296 (Đợt điều trị hiện tại)', type: 'folder', children: [
            { 
                id: 'GRP_HC_EMR', label: 'I. Giấy tờ hành chính', type: 'folder', children: [
                    { id: 'DOC_01', label: 'Đơn xin xét nghiệm HIV/HBV/HCV', type: 'file', status: 'signed', date: '29/10/2023' },
                    { id: 'DOC_02', label: 'Phiếu khám bệnh vào viện', type: 'file', status: 'signed', date: '29/10/2023' },
                    { id: 'DOC_03', label: 'Cam kết phẫu thuật', type: 'file', status: 'draft', date: '30/10/2023' },
                ]
            },
            {
                id: 'GRP_CLS_EMR', label: 'III. Cận lâm sàng', type: 'folder', children: [
                    { id: 'DOC_04', label: 'KQ Xét nghiệm Huyết học', type: 'file', status: 'signed', date: '29/10/2023' },
                    { id: 'DOC_05', label: 'KQ Siêu âm ổ bụng', type: 'file', status: 'signed', date: '29/10/2023' },
                ]
            },
            {
                id: 'GRP_PT_EMR', label: 'VI. Phẫu thuật - Thủ thuật', type: 'folder', children: []
            },
            {
                id: 'GRP_CS_EMR', label: 'VII. Phiếu chăm sóc', type: 'folder', children: [
                    { id: 'DOC_06', label: 'Phiếu theo dõi sinh hiệu (Ngày 1)', type: 'file', status: 'pending', date: '30/10/2023' },
                ]
            }
        ]
    }
];

const DEMO_PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

const EMRTab: React.FC = () => {
    const { fontSettings } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
    
    // PDF Viewer State
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [pdfLoading, setPdfLoading] = useState(false);

    const handleSelectNode = (node: TreeNode) => {
        setSelectedNode(node);
        setPdfLoading(true);
        // Reset viewer state
        setPageNumber(1);
        setScale(1.0);
    };

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPdfLoading(false);
    };

    return (
        <div className="flex flex-1 overflow-hidden h-full">
            {/* Left: Tree View */}
            <div className="w-1/3 max-w-sm bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
                {/* Search */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-700">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm hồ sơ bệnh án..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 ${fontSettings.controls}`}
                        />
                    </div>
                </div>
                
                {/* Tree */}
                <DocumentTree 
                    data={mockEMRRecords} 
                    selectedId={selectedNode?.id || null} 
                    onSelect={handleSelectNode} 
                    searchTerm={searchTerm}
                    defaultExpanded={['HS_2023', 'GRP_HC_EMR', 'GRP_CLS_EMR']}
                />
                
                {/* Footer Info */}
                <div className="p-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 text-center flex justify-around">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Đã ký</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Bản thảo</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Chờ ký</span>
                </div>
            </div>

            {/* Right: PDF Viewer (React-PDF) */}
            <div className="flex-1 bg-slate-200 dark:bg-slate-900 relative overflow-hidden flex flex-col">
                {selectedNode ? (
                    <div className="flex-1 h-full flex flex-col animate-fade-in">
                        {/* Status Bar */}
                        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3 flex justify-between items-center shadow-sm z-10">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2 text-base truncate">
                                    <DocumentReportIcon className="w-5 h-5 text-blue-500"/>
                                    {selectedNode.label}
                                </h3>
                                <div className="hidden sm:flex">
                                    {selectedNode.status === 'signed' ? (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold flex items-center gap-1 border border-green-200">
                                            <CheckBadgeIcon className="w-3 h-3"/> Đã ký số
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-bold flex items-center gap-1 border border-orange-200">
                                            <PencilIcon className="w-3 h-3"/> Bản thảo
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Viewer Controls */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                                <button 
                                    onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))} 
                                    disabled={pageNumber <= 1}
                                    className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded disabled:opacity-30"
                                >
                                    <ChevronLeftIcon className="w-4 h-4"/>
                                </button>
                                <span className="text-xs font-mono min-w-[60px] text-center">{pageNumber} / {numPages || '--'}</span>
                                <button 
                                    onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || 1))}
                                    disabled={pageNumber >= (numPages || 1)}
                                    className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded disabled:opacity-30"
                                >
                                    <ChevronRightIcon className="w-4 h-4"/>
                                </button>
                                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                                <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded"><ZoomOutIcon className="w-4 h-4"/></button>
                                <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded"><ZoomInIcon className="w-4 h-4"/></button>
                            </div>
                        </div>
                        
                        {/* PDF Render Area */}
                        <div className="flex-1 bg-slate-500/10 dark:bg-black/20 p-4 overflow-auto flex justify-center">
                            <Document
                                file={DEMO_PDF_URL}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={
                                    <div className="flex flex-col items-center justify-center mt-20">
                                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                        <p className="text-sm text-slate-500">Đang tải tài liệu...</p>
                                    </div>
                                }
                                error={
                                    <div className="text-red-500 mt-20 text-center">
                                        <p>Không thể tải tài liệu.</p>
                                        <p className="text-sm">Vui lòng kiểm tra lại kết nối.</p>
                                    </div>
                                }
                            >
                                <div className="shadow-lg border border-slate-200 dark:border-slate-700">
                                    <Page 
                                        pageNumber={pageNumber} 
                                        scale={scale} 
                                        renderTextLayer={false} 
                                        renderAnnotationLayer={false}
                                        loading=""
                                    />
                                </div>
                            </Document>
                        </div>
                    </div>
                ) : (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500">
                        <FolderIcon className="w-20 h-20 mb-4 opacity-20"/>
                        <p className="text-lg font-medium">Chọn hồ sơ để xem chi tiết</p>
                        <p className="text-sm mt-2">Xem và quản lý hồ sơ bệnh án điện tử</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EMRTab;
