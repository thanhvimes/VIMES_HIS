
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    SearchIcon, 
    FolderIcon,
    DocumentReportIcon,
    CheckBadgeIcon,
    PencilIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ZoomInIcon,
    ZoomOutIcon,
    ListBulletIcon,
    DocumentTextIcon,
    DownloadIcon,
    ArchiveIcon
} from '../../../../../components/Icons';
import DocumentTree, { TreeNode } from '../../../../../components/ui/DocumentTree';
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

// --- Lazy Page Component for Virtualization ---
interface LazyPdfPageProps {
    pageNumber: number;
    scale: number;
    containerRef: React.RefObject<HTMLDivElement>;
    onVisible: (pageNum: number) => void;
}

const LazyPdfPage: React.FC<LazyPdfPageProps> = ({ pageNumber, scale, containerRef, onVisible }) => {
    const [isVisible, setIsVisible] = useState(false);
    const pageRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        // Only notify if substantial part is visible to avoid flickering page numbers
                        if (entry.intersectionRatio > 0.3) {
                            onVisible(pageNumber);
                        }
                    } else {
                        // Virtualize: Unmount heavy content when out of view to save memory
                        setIsVisible(false);
                    }
                });
            },
            {
                root: containerRef.current,
                rootMargin: '400px', // Preload margin: render pages 400px before they come into view
                threshold: [0, 0.3, 0.6]
            }
        );
        
        if (pageRef.current) {
            observer.observe(pageRef.current);
        }
        
        return () => {
            if (pageRef.current) observer.unobserve(pageRef.current);
            observer.disconnect();
        };
    }, [containerRef, pageNumber, onVisible]);

    // Aspect ratio for A4 is roughly 1 / 1.414. 
    // Assuming width is approx 600px at scale 1.0, height is ~850px.
    const placeholderWidth = 600 * scale;
    const placeholderHeight = 850 * scale;

    return (
        <div 
            ref={pageRef} 
            className="mb-6 flex justify-center transition-all duration-200"
            style={{ minHeight: placeholderHeight }}
        >
            {isVisible ? (
                <div className="shadow-lg border border-slate-200 dark:border-slate-700 bg-white relative">
                    <Page 
                        pageNumber={pageNumber} 
                        scale={scale} 
                        renderTextLayer={false} 
                        renderAnnotationLayer={false}
                        loading={
                            <div 
                                style={{ width: placeholderWidth, height: placeholderHeight }} 
                                className="bg-white flex items-center justify-center animate-pulse"
                            >
                                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                            </div>
                        }
                        error={
                            <div 
                                style={{ width: placeholderWidth, height: placeholderHeight }} 
                                className="bg-red-50 flex items-center justify-center text-red-500"
                            >
                                Error loading page {pageNumber}
                            </div>
                        }
                    />
                    <div className="absolute bottom-2 right-2 text-[10px] text-slate-300 font-mono px-1 bg-black/10 rounded">
                        {pageNumber}
                    </div>
                </div>
            ) : (
                <div 
                    style={{ width: placeholderWidth, height: placeholderHeight }} 
                    className="bg-slate-100 dark:bg-slate-800/50 rounded border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400"
                >
                    <span className="font-bold text-2xl opacity-20">{pageNumber}</span>
                    <span className="text-xs opacity-50 mt-2">Đang tải...</span>
                </div>
            )}
        </div>
    );
};

const EMRTab: React.FC = () => {
    const { fontSettings } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
    
    // PDF Viewer State
    const [numPages, setNumPages] = useState<number | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [pdfLoading, setPdfLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'pagination' | 'scroll'>('pagination');
    
    // Mock EMR Data State
    const [emrData, setEmrData] = useState<TreeNode[]>(mockEMRRecords);

    // Export State
    const [isExporting, setIsExporting] = useState(false);
    // Mock permission: In a real app, this would come from user context/auth service
    const [hasExportPermission] = useState(true); 
    
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const emrFileInputRef = useRef<HTMLInputElement>(null);

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

    // Handler for LazyPage visibility
    const handlePageVisible = useCallback((pageNum: number) => {
        setPageNumber(pageNum);
    }, []);

    const handleDownload = () => {
        if (!selectedNode) return;
        // In a real app, this would use the node's specific file URL
        const link = document.createElement('a');
        link.href = DEMO_PDF_URL;
        link.download = `${selectedNode.label}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportEMR = () => {
        if (!hasExportPermission) {
            alert("Bạn không có quyền xuất hồ sơ bệnh án.");
            return;
        }
        
        if (window.confirm("Bạn có chắc chắn muốn xuất toàn bộ hồ sơ bệnh án này?")) {
            setIsExporting(true);
            
            // Simulate export process
            setTimeout(() => {
                setIsExporting(false);
                // Mock download trigger
                const link = document.createElement('a');
                link.href = DEMO_PDF_URL; // In real app, this is the zip/merged PDF url
                link.download = `FULL_EMR_251050296_${new Date().toISOString().split('T')[0]}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                alert("Xuất hồ sơ EMR thành công!");
            }, 2000);
        }
    };

    const handleEmrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const newNode: TreeNode = {
            id: `UPLOAD_${Date.now()}`,
            label: file.name,
            type: 'file',
            date: new Date().toLocaleDateString('vi-VN'),
            status: 'pending'
        };

        // Deep clone the EMR data structure to safely mutate
        const newData = emrData.map(rootNode => {
            // Find the root folder to add to (assuming first root is the main folder for this patient)
            if (rootNode.id === 'HS_2023') {
                return {
                    ...rootNode,
                    children: rootNode.children?.map(subFolder => {
                        // Logic to decide which subfolder to add to. For now, default to first one.
                        if (subFolder.id === 'GRP_HC_EMR') {
                            return {
                                ...subFolder,
                                children: [newNode, ...(subFolder.children || [])]
                            };
                        }
                        return subFolder;
                    })
                };
            }
            return rootNode;
        });
        
        setEmrData(newData);
        alert(`Đã tải lên tài liệu: ${file.name}`);
        e.target.value = '';
    };

    return (
        <div className="flex flex-1 overflow-hidden h-full">
            {/* Left: Tree View */}
            <div className="w-1/3 max-w-sm bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
                {/* Search */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex justify-between items-center mb-2">
                         <h4 className="text-xs font-bold text-slate-500 uppercase">Hồ sơ bệnh án điện tử</h4>
                         <button 
                             onClick={() => emrFileInputRef.current?.click()}
                             className="p-1 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 rounded transition" 
                             title="Tải lên tài liệu"
                         >
                             <ArchiveIcon className="w-4 h-4"/>
                         </button>
                    </div>
                    <input type="file" ref={emrFileInputRef} className="hidden" onChange={handleEmrFileUpload} />
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm hồ sơ bệnh án..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 ${fontSettings.controls}`}
                        />
                    </div>
                </div>
                
                {/* Tree */}
                <DocumentTree 
                    data={emrData} 
                    selectedId={selectedNode?.id || null} 
                    onSelect={handleSelectNode} 
                    searchTerm={searchTerm}
                    defaultExpanded={['HS_2023', 'GRP_HC_EMR', 'GRP_CLS_EMR']}
                />
                
                {/* Footer Info & Actions */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                    <div className="flex justify-around text-xs text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Đã ký</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> Bản thảo</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400"></span> Chờ ký</span>
                    </div>
                    
                    {/* Export Button */}
                    <button 
                        onClick={handleExportEMR}
                        disabled={isExporting || !hasExportPermission}
                        className={`w-full py-2 px-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm
                            ${hasExportPermission 
                                ? 'bg-teal-600 hover:bg-teal-700 text-white active:scale-95' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                            }
                        `}
                        title={hasExportPermission ? "Xuất toàn bộ hồ sơ ra file PDF" : "Bạn không có quyền thực hiện chức năng này"}
                    >
                        {isExporting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Đang xuất...</span>
                            </>
                        ) : (
                            <>
                                <DownloadIcon className="w-4 h-4"/>
                                <span>Export EMR</span>
                            </>
                        )}
                    </button>
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
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={handleDownload}
                                    className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                    title="Tải xuống tài liệu này"
                                >
                                    <DownloadIcon className="w-5 h-5"/>
                                </button>
                                
                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                                {/* View Mode Toggles */}
                                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5 border border-slate-200 dark:border-slate-600">
                                    <button
                                        onClick={() => setViewMode('pagination')}
                                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'pagination' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        title="Chế độ từng trang"
                                    >
                                        <DocumentTextIcon className="w-4 h-4"/>
                                    </button>
                                    <button
                                        onClick={() => setViewMode('scroll')}
                                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'scroll' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                        title="Chế độ cuộn liên tục"
                                    >
                                        <ListBulletIcon className="w-4 h-4"/>
                                    </button>
                                </div>

                                {/* Pagination / Navigation */}
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                                    <button 
                                        onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))} 
                                        disabled={pageNumber <= 1}
                                        className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronLeftIcon className="w-4 h-4"/>
                                    </button>
                                    <span className="text-xs font-mono min-w-[60px] text-center">{pageNumber} / {numPages || '--'}</span>
                                    <button 
                                        onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages || 1))}
                                        disabled={pageNumber >= (numPages || 1)}
                                        className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded disabled:opacity-30 transition-colors"
                                    >
                                        <ChevronRightIcon className="w-4 h-4"/>
                                    </button>
                                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                                    <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded transition-colors"><ZoomOutIcon className="w-4 h-4"/></button>
                                    <button onClick={() => setScale(s => Math.min(2.0, s + 0.1))} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded transition-colors"><ZoomInIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        </div>
                        
                        {/* PDF Render Area */}
                        <div className="flex-1 bg-slate-500/10 dark:bg-black/20 overflow-hidden relative">
                            <Document
                                file={DEMO_PDF_URL}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                        <p className="text-sm text-slate-500">Đang tải tài liệu...</p>
                                    </div>
                                }
                                error={
                                    <div className="flex flex-col items-center justify-center h-full text-red-500">
                                        <p className="font-bold">Không thể tải tài liệu.</p>
                                        <p className="text-sm">Vui lòng kiểm tra lại kết nối.</p>
                                    </div>
                                }
                                className="h-full flex flex-col"
                            >
                                {viewMode === 'pagination' ? (
                                    /* PAGINATION MODE */
                                    <div className="flex-1 overflow-auto p-4 flex justify-center">
                                        <div className="shadow-lg border border-slate-200 dark:border-slate-700 h-fit">
                                            <Page 
                                                pageNumber={pageNumber} 
                                                scale={scale} 
                                                renderTextLayer={false} 
                                                renderAnnotationLayer={false}
                                                loading={<div className="w-64 h-96 bg-white animate-pulse"></div>}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    /* CONTINUOUS SCROLL MODE (VIRTUALIZED) */
                                    <div className="flex-1 overflow-auto p-4" ref={scrollContainerRef}>
                                        {numPages && Array.from(new Array(numPages), (el, index) => (
                                            <LazyPdfPage 
                                                key={`page_${index + 1}`}
                                                pageNumber={index + 1}
                                                scale={scale}
                                                containerRef={scrollContainerRef}
                                                onVisible={handlePageVisible}
                                            />
                                        ))}
                                    </div>
                                )}
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
