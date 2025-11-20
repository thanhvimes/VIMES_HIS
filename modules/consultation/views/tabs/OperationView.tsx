
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    PencilIcon, 
    TrashIcon, 
    PrinterIcon,
    ScissorsIcon,
    ClockIcon,
    UserGroupIcon,
    DocumentTextIcon,
    BeakerIcon,
    SearchIcon,
    ChevronLeftIcon,
    ActivityIcon,
    CameraIcon,
    XIcon
} from '../../../../components/Icons';
import { OperationRecord } from '../../../../types';
import { consultationService } from '../../../../services/consultationService';
import OperationFormModal from './OperationFormModal';
import { usePdfPreview } from '../../../../contexts/PdfPreviewContext';

// Mock Data Context
const mockPatientId = 'P003';
const DEMO_PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

const emptyOperation: OperationRecord = {
    id: '', serviceName: '', requestDate: new Date().toLocaleDateString('vi-VN'),
    type: 'PT', operationType: '', operationDate: new Date().toISOString().split('T')[0],
    room: '', startTime: '', endTime: '', mainSurgeon: '', assistantSurgeons: '',
    anesthesiologist: '', nurses: '', technicians: '', method: '', steps: '',
    instruments: '', medications: '', images: []
};

const OperationView: React.FC = () => {
    const navigate = useNavigate();
    const { openPdf } = usePdfPreview();
    const [operations, setOperations] = useState<OperationRecord[]>([]);
    const [selectedOp, setSelectedOp] = useState<OperationRecord | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewImage, setViewImage] = useState<string | null>(null);
    
    // --- Data Loading ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await consultationService.getOperations(mockPatientId);
            setOperations(data);
            // On desktop, select first item by default if list is not empty and nothing selected
            if (window.innerWidth >= 1024 && data.length > 0 && !selectedOp) {
                setSelectedOp(data[0]);
            }
        } catch (error) {
            console.error("Error loading operations:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Filtering ---
    const filteredOperations = useMemo(() => {
        if (!searchTerm) return operations;
        const lowerTerm = searchTerm.toLowerCase();
        return operations.filter(op => 
            (op.serviceName && op.serviceName.toLowerCase().includes(lowerTerm)) ||
            (op.mainSurgeon && op.mainSurgeon.toLowerCase().includes(lowerTerm)) ||
            (op.operationDate && op.operationDate.includes(lowerTerm))
        );
    }, [operations, searchTerm]);

    // --- Handlers ---
    const handleSelect = (op: OperationRecord) => {
        setSelectedOp(op);
    };

    const handleAddNew = (type: 'PT' | 'TT') => {
        setModalMode('create');
        // Reset selection to ensure the modal uses empty data with correct type
        setSelectedOp({ ...emptyOperation, type: type });
        setIsModalOpen(true);
    };

    const handleEdit = () => {
        if (!selectedOp) return;
        setModalMode('edit');
        // Ensure the selected operation is passed to the modal
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedOp || !window.confirm(`Bạn có chắc chắn muốn xóa phiếu: ${selectedOp.serviceName}?`)) return;

        setIsLoading(true);
        try {
            await consultationService.deleteOperation(selectedOp.id);
            const newList = operations.filter(o => o.id !== selectedOp.id);
            setOperations(newList);
            
            // If on desktop, select next item. On mobile, go back to list.
            if (window.innerWidth >= 1024 && newList.length > 0) {
                setSelectedOp(newList[0]);
            } else {
                setSelectedOp(null);
            }
        } catch (err) {
            alert("Xóa thất bại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = async (formData: OperationRecord) => {
        const saved = await consultationService.saveOperation(formData);
        
        if (modalMode === 'create') {
            const newItem = { ...formData, id: saved.id || `OP-${Date.now()}` };
            setOperations([newItem, ...operations]);
            setSelectedOp(newItem);
        } else {
            setOperations(prev => prev.map(op => op.id === formData.id ? formData : op));
            setSelectedOp(formData);
        }
    };

    const handlePrint = () => {
        if(selectedOp) {
            // Open PDF in global modal
            openPdf({
                url: DEMO_PDF_URL,
                fileName: `Operation_${selectedOp.id}.pdf`,
                isSignable: true
            });
        }
    };

    const handleBackToList = () => {
        setSelectedOp(null);
    };

    // --- Sub-components for Read-only View ---
    const DetailItem = ({ label, value, fullWidth = false }: { label: string, value?: string, fullWidth?: boolean }) => (
        <div className={`${fullWidth ? 'col-span-2' : 'col-span-1'} py-3 border-b border-gray-100 dark:border-slate-700 last:border-0`}>
            <dt className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{label}</dt>
            <dd className="mt-1 text-base text-gray-900 dark:text-white font-medium whitespace-pre-wrap break-words">
                {value || <span className="text-gray-300 dark:text-slate-600 italic">Chưa cập nhật</span>}
            </dd>
        </div>
    );

    const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-slate-700 mb-4 mt-2">
            <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h4 className="text-lg font-bold text-gray-800 dark:text-slate-200">{title}</h4>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row h-full bg-gray-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-700 relative">
            
            {/* ===== LEFT SIDEBAR: LIST ===== */}
            {/* On mobile: Hidden if item selected. On Desktop: Always visible, width 80 */}
            <div className={`
                flex-col h-full border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 
                lg:w-80 lg:flex flex-shrink-0 
                ${selectedOp ? 'hidden' : 'flex w-full'}
            `}>
                {/* Header */}
                <div className="p-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex flex-col gap-3">
                    <div className="relative w-full">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <SearchIcon className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
                            placeholder="Tìm kiếm phiếu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleAddNew('PT')}
                            className="flex-1 py-2 px-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded shadow-sm flex items-center justify-center gap-1 transition"
                        >
                            <ScissorsIcon className="w-4 h-4" />
                            Thêm PT
                        </button>
                        <button
                            onClick={() => handleAddNew('TT')}
                            className="flex-1 py-2 px-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded shadow-sm flex items-center justify-center gap-1 transition"
                        >
                            <ActivityIcon className="w-4 h-4" />
                            Thêm TT
                        </button>
                    </div>
                </div>

                {/* List Content */}
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {isLoading && operations.length === 0 ? (
                         <div className="p-8 text-center text-gray-500 dark:text-slate-400 text-base">Đang tải...</div>
                    ) : filteredOperations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-base flex flex-col items-center">
                            <DocumentTextIcon className="w-10 h-10 mb-2 opacity-20" />
                            {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}
                        </div>
                    ) : (
                        filteredOperations.map(op => (
                            <div
                                key={op.id}
                                onClick={() => handleSelect(op)}
                                className={`p-3 rounded-lg cursor-pointer transition border relative group ${
                                    selectedOp?.id === op.id 
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
                                    : 'bg-white dark:bg-slate-800 border-transparent hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:border-gray-200 dark:hover:border-slate-600'
                                }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                         <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider border ${
                                            op.type === 'PT' ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-teal-100 text-teal-800 border-teal-200'
                                        }`}>
                                            {op.type}
                                        </span>
                                        <div className={`font-bold text-base pr-2 line-clamp-1 ${selectedOp?.id === op.id ? 'text-blue-700 dark:text-blue-300' : 'text-gray-800 dark:text-slate-200'}`}>
                                            {op.serviceName || 'Phiếu chưa đặt tên'}
                                        </div>
                                    </div>
                                    <ChevronLeftIcon className="w-4 h-4 text-gray-300 rotate-180 lg:hidden flex-shrink-0" />
                                </div>
                                <div className="text-sm text-gray-500 dark:text-slate-400 mt-2 flex items-center gap-1 flex-wrap">
                                    <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{new Date(op.operationDate).toLocaleDateString('vi-VN')}</span>
                                    {op.startTime && <span className="px-1 bg-gray-100 dark:bg-slate-700 rounded text-gray-600 dark:text-slate-300">{op.startTime}</span>}
                                </div>
                                <div className="text-sm text-gray-400 dark:text-slate-500 mt-1 truncate">
                                    {op.type === 'PT' ? 'BS:' : 'Người TH:'} {op.mainSurgeon}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ===== RIGHT CONTENT: READ-ONLY OVERVIEW ===== */}
            {/* On mobile: Fixed full screen if selected. On Desktop: Flex-1 */}
            <div className={`
                flex-col h-full overflow-hidden bg-gray-50 dark:bg-slate-900/50 flex-1 
                bg-white dark:bg-slate-900
                ${selectedOp ? 'flex w-full fixed inset-0 z-[40] lg:static lg:z-auto' : 'hidden lg:flex'}
            `}>
                {/* Header Toolbar */}
                <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-3 py-3 flex justify-between items-center shadow-sm z-10 gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <button onClick={handleBackToList} className="lg:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <div className="min-w-0">
                            <h1 className="text-xl font-bold text-gray-800 dark:text-white truncate">
                                {selectedOp ? selectedOp.serviceName : 'Chi tiết phiếu'}
                            </h1>
                            {selectedOp && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                                    selectedOp.type === 'PT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300'
                                }`}>
                                    {selectedOp.type === 'PT' ? 'Phẫu thuật' : 'Thủ thuật'}
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button 
                            onClick={handleEdit} 
                            disabled={!selectedOp} 
                            className="p-2 lg:px-3 lg:py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 text-gray-700 dark:text-slate-200 transition"
                            title="Chỉnh sửa"
                        >
                            <PencilIcon className="w-5 h-5 lg:w-4 lg:h-4 lg:mr-1.5 inline-block" />
                            <span className="hidden lg:inline font-medium text-sm">Sửa</span>
                        </button>
                        <button 
                            onClick={handlePrint} 
                            disabled={!selectedOp} 
                            className="p-2 lg:px-3 lg:py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 disabled:opacity-50 text-gray-700 dark:text-slate-200 transition"
                             title="In phiếu"
                        >
                            <PrinterIcon className="w-5 h-5 lg:w-4 lg:h-4 lg:mr-1.5 inline-block" />
                            <span className="hidden lg:inline font-medium text-sm">In</span>
                        </button>
                        <button 
                            onClick={handleDelete} 
                            disabled={!selectedOp} 
                            className="p-2 lg:px-3 lg:py-2 border border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 text-red-600 dark:text-red-400 transition"
                             title="Xóa phiếu"
                        >
                            <TrashIcon className="w-5 h-5 lg:w-4 lg:h-4 lg:mr-1.5 inline-block" />
                            <span className="hidden lg:inline font-medium text-sm">Xóa</span>
                        </button>
                    </div>
                </div>

                {/* Main Content Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 dark:bg-slate-900/50">
                    {!selectedOp ? (
                        <div className="flex flex-col h-full items-center justify-center text-gray-400 dark:text-slate-500">
                            <ScissorsIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p className="text-center text-lg">Vui lòng chọn một phiếu để xem chi tiết</p>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto space-y-6 pb-20 lg:pb-10">
                            
                            {/* Card 1: Thông tin chung */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 lg:p-6 border border-gray-200 dark:border-slate-700">
                                <SectionTitle icon={ClockIcon} title="Thông tin chung" />
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                    <DetailItem label="Tên dịch vụ" value={selectedOp.serviceName} fullWidth />
                                    <DetailItem label="Chẩn đoán / Loại hình" value={selectedOp.operationType} fullWidth />
                                    <DetailItem label="Ngày thực hiện" value={new Date(selectedOp.operationDate).toLocaleDateString('vi-VN')} />
                                    <DetailItem label="Phòng thực hiện" value={selectedOp.room} />
                                    <DetailItem label="Thời gian bắt đầu" value={selectedOp.startTime} />
                                    <DetailItem label="Thời gian kết thúc" value={selectedOp.endTime} />
                                </dl>
                            </div>

                            {/* Card 2: Ekip */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 lg:p-6 border border-gray-200 dark:border-slate-700">
                                <SectionTitle icon={UserGroupIcon} title="Ekip thực hiện" />
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                    <DetailItem label={selectedOp.type === 'PT' ? "Phẫu thuật viên chính" : "Người thực hiện"} value={selectedOp.mainSurgeon} fullWidth />
                                    {selectedOp.type === 'PT' ? (
                                        <>
                                            <DetailItem label="Phụ mổ" value={selectedOp.assistantSurgeons} />
                                            <DetailItem label="Bác sĩ gây mê" value={selectedOp.anesthesiologist} />
                                            <DetailItem label="Điều dưỡng" value={selectedOp.nurses} />
                                            <DetailItem label="Kỹ thuật viên" value={selectedOp.technicians} />
                                        </>
                                    ) : (
                                        <>
                                            <DetailItem label="Người phụ / Hỗ trợ" value={selectedOp.nurses} fullWidth />
                                        </>
                                    )}
                                </dl>
                            </div>

                            {/* Card 3: Chi tiết chuyên môn */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 lg:p-6 border border-gray-200 dark:border-slate-700">
                                <SectionTitle icon={DocumentTextIcon} title="Chi tiết chuyên môn" />
                                <dl className="grid grid-cols-1 gap-y-2">
                                    <div className="py-3">
                                        <dt className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                                            {selectedOp.type === 'PT' ? 'Phương pháp / Vô cảm' : 'Phương pháp thủ thuật'}
                                        </dt>
                                        <dd className="text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-100 dark:border-slate-600">
                                            {selectedOp.method || 'Chưa ghi nhận'}
                                        </dd>
                                    </div>
                                    <div className="py-3">
                                        <dt className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                                            {selectedOp.type === 'PT' ? 'Tường trình phẫu thuật' : 'Mô tả thủ thuật'}
                                        </dt>
                                        <dd className="text-base text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700/50 p-3 rounded-lg border border-gray-100 dark:border-slate-600 whitespace-pre-line">
                                            {selectedOp.steps || 'Chưa ghi nhận'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                             {/* Card 4: Thuốc & Vật tư */}
                             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 lg:p-6 border border-gray-200 dark:border-slate-700">
                                <SectionTitle icon={BeakerIcon} title="Thuốc & Vật tư tiêu hao" />
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <dt className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Dụng cụ / Vật tư</dt>
                                        <dd className="text-base text-gray-900 dark:text-white whitespace-pre-line">{selectedOp.instruments || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">Thuốc sử dụng</dt>
                                        <dd className="text-base text-gray-900 dark:text-white whitespace-pre-line">{selectedOp.medications || '-'}</dd>
                                    </div>
                                </dl>
                            </div>

                             {/* Card 5: Hình ảnh đính kèm */}
                             {selectedOp.images && selectedOp.images.length > 0 && (
                                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 lg:p-6 border border-gray-200 dark:border-slate-700">
                                    <SectionTitle icon={CameraIcon} title="Hình ảnh đính kèm" />
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {selectedOp.images.map((img, idx) => (
                                            <div 
                                                key={idx} 
                                                className="relative aspect-square bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group"
                                                onClick={() => setViewImage(img)}
                                            >
                                                <img 
                                                    src={img} 
                                                    alt={`Evidence ${idx}`} 
                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <span className="opacity-0 group-hover:opacity-100 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm transition-opacity">
                                                        Xem
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ===== MODAL FORM ===== */}
            <OperationFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={selectedOp || emptyOperation}
                onSubmit={handleFormSubmit}
            />
            
            {/* ===== IMAGE LIGHTBOX ===== */}
            {viewImage && (
                <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewImage(null)}>
                    <button 
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                        onClick={() => setViewImage(null)}
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                    <img 
                        src={viewImage} 
                        alt="Full size" 
                        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default OperationView;
