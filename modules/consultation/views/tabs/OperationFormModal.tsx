import React, { useState, useEffect } from 'react';
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    PrinterIcon,
    ScissorsIcon,
    ClockIcon,
    UserGroupIcon,
    DocumentTextIcon,
    BeakerIcon // Giả sử có icon này cho phần thuốc/dụng cụ
} from '../../../../components/Icons';
import { OperationRecord } from '../../../../types';
import { consultationService } from '../../../../services/consultationService';


// Mock Data & Initial State
const mockPatientId = 'P003';
const emptyOperation: OperationRecord = {
    id: '', serviceName: '', requestDate: new Date().toLocaleDateString('vi-VN'),
    type: 'PT', operationType: '', operationDate: new Date().toISOString().split('T')[0],
    room: '', startTime: '', endTime: '', mainSurgeon: '', assistantSurgeons: '',
    anesthesiologist: '', nurses: '', technicians: '', method: '', steps: '',
    instruments: '', medications: ''
};

const OperationView: React.FC = () => {
    const [operations, setOperations] = useState<OperationRecord[]>([]);
    const [selectedOp, setSelectedOp] = useState<OperationRecord | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [isLoading, setIsLoading] = useState(false);

    // --- Data Loading ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await consultationService.getOperations(mockPatientId);
            setOperations(data);
            if (data.length > 0 && !selectedOp) {
                setSelectedOp(data[0]);
            }
        } catch (error) {
            console.error("Error loading operations:", error);
        }
    };

    // --- Handlers ---
    const handleSelect = (op: OperationRecord) => {
        setSelectedOp(op);
    };

    const handleAddNew = () => {
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleEdit = () => {
        if (!selectedOp) return;
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleDelete = async () => {
        if (!selectedOp || !window.confirm(`Bạn có chắc chắn muốn xóa phiếu: ${selectedOp.serviceName}?`)) return;

        setIsLoading(true);
        try {
            await consultationService.deleteOperation(selectedOp.id);
            const newList = operations.filter(o => o.id !== selectedOp.id);
            setOperations(newList);
            setSelectedOp(newList.length > 0 ? newList[0] : null);
            alert("Đã xóa thành công.");
        } catch (err) {
            alert("Xóa thất bại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormSubmit = async (formData: OperationRecord) => {
        try {
            const saved = await consultationService.saveOperation(formData);
            
            if (modalMode === 'create') {
                const newItem = { ...formData, id: saved.id || `OP-${Date.now()}` };
                setOperations([newItem, ...operations]);
                setSelectedOp(newItem);
            } else {
                setOperations(prev => prev.map(op => op.id === formData.id ? formData : op));
                setSelectedOp(formData);
            }
            alert("Lưu dữ liệu thành công!");
        } catch (error) {
            throw error; // Để Modal catch và hiển thị lỗi nếu cần
        }
    };

    const handlePrint = () => {
        alert("Đang mở bản in phiếu phẫu thuật/thủ thuật...");
    };

    // --- Sub-components for Read-only View ---
    const DetailItem = ({ label, value, fullWidth = false }: { label: string, value?: string, fullWidth?: boolean }) => (
        <div className={`${fullWidth ? 'col-span-2' : 'col-span-1'} py-3 border-b border-gray-100 last:border-0`}>
            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900 font-medium whitespace-pre-wrap">
                {value || <span className="text-gray-300 italic">Chưa cập nhật</span>}
            </dd>
        </div>
    );

    const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 mb-4 mt-2">
            <Icon className="w-5 h-5 text-blue-600" />
            <h4 className="text-md font-bold text-gray-800">{title}</h4>
        </div>
    );

    return (
        <div className="flex h-full bg-gray-100">
            {/* ===== LEFT SIDEBAR: LIST ===== */}
            <div className="w-80 flex-shrink-0 border-r border-gray-300 bg-white flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <h2 className="text-base font-bold text-gray-700 flex items-center gap-2">
                        <ScissorsIcon className="w-5 h-5 text-blue-600" />
                        DS PHIẾU
                    </h2>
                    <button
                        onClick={handleAddNew}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
                        title="Thêm mới phiếu"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {operations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
                            <DocumentTextIcon className="w-10 h-10 mb-2 opacity-20" />
                            Chưa có dữ liệu
                        </div>
                    ) : (
                        operations.map(op => (
                            <div
                                key={op.id}
                                onClick={() => handleSelect(op)}
                                className={`p-3 rounded-lg cursor-pointer transition border ${
                                    selectedOp?.id === op.id 
                                    ? 'bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-200' 
                                    : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200'
                                }`}
                            >
                                <div className={`font-semibold text-sm ${selectedOp?.id === op.id ? 'text-blue-700' : 'text-gray-800'}`}>
                                    {op.serviceName || 'Phiếu chưa đặt tên'}
                                </div>
                                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" />
                                    <span>{new Date(op.operationDate).toLocaleDateString('vi-VN')}</span>
                                    {op.startTime && <span className="px-1 bg-gray-100 rounded text-gray-600">{op.startTime}</span>}
                                </div>
                                {op.mainSurgeon && (
                                    <div className="text-xs text-gray-400 mt-1 truncate">
                                        BS: {op.mainSurgeon}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ===== RIGHT CONTENT: READ-ONLY OVERVIEW ===== */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50">
                {/* Header Toolbar */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">
                            {selectedOp ? selectedOp.serviceName : 'Chi tiết phiếu phẫu thuật'}
                        </h1>
                        {selectedOp && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                selectedOp.type === 'PT' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                                {selectedOp.type === 'PT' ? 'Phẫu thuật' : 'Thủ thuật'}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleEdit} 
                            disabled={!selectedOp} 
                            className="btn-white flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium text-gray-700"
                        >
                            <PencilIcon className="w-4 h-4 text-blue-600" /> Sửa
                        </button>
                        <button 
                            onClick={handlePrint} 
                            disabled={!selectedOp} 
                            className="btn-white flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm font-medium text-gray-700"
                        >
                            <PrinterIcon className="w-4 h-4 text-gray-600" /> In phiếu
                        </button>
                        <button 
                            onClick={handleDelete} 
                            disabled={!selectedOp} 
                            className="btn-white flex items-center gap-2 px-3 py-2 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm font-medium text-red-600"
                        >
                            <TrashIcon className="w-4 h-4" /> Xóa
                        </button>
                    </div>
                </div>

                {/* Main Content Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {isLoading ? (
                        <div className="flex h-full items-center justify-center text-gray-500">Đang xử lý...</div>
                    ) : !selectedOp ? (
                        <div className="flex flex-col h-full items-center justify-center text-gray-400">
                            <ScissorsIcon className="w-16 h-16 mb-4 opacity-20" />
                            <p>Vui lòng chọn một phiếu để xem chi tiết</p>
                        </div>
                    ) : (
                        <div className="max-w-5xl mx-auto space-y-6 pb-10">
                            
                            {/* Card 1: Thông tin chung */}
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                <SectionTitle icon={ClockIcon} title="Thông tin chung" />
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                    <DetailItem label="Ngày thực hiện" value={new Date(selectedOp.operationDate).toLocaleDateString('vi-VN')} />
                                    <DetailItem label="Phòng thực hiện" value={selectedOp.room} />
                                    <DetailItem label="Thời gian bắt đầu" value={selectedOp.startTime} />
                                    <DetailItem label="Thời gian kết thúc" value={selectedOp.endTime} />
                                </dl>
                            </div>

                            {/* Card 2: Ekip */}
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                <SectionTitle icon={UserGroupIcon} title="Ekip thực hiện" />
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                    <DetailItem label="Bác sĩ chính" value={selectedOp.mainSurgeon} fullWidth />
                                    <DetailItem label="Phụ mổ" value={selectedOp.assistantSurgeons} />
                                    <DetailItem label="Bác sĩ gây mê" value={selectedOp.anesthesiologist} />
                                    <DetailItem label="Điều dưỡng" value={selectedOp.nurses} />
                                    <DetailItem label="Kỹ thuật viên" value={selectedOp.technicians} />
                                </dl>
                            </div>

                            {/* Card 3: Chi tiết chuyên môn */}
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                <SectionTitle icon={DocumentTextIcon} title="Chi tiết phẫu thuật" />
                                <dl className="grid grid-cols-1 gap-y-2">
                                    <div className="py-3">
                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Phương pháp</dt>
                                        <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                            {selectedOp.method || 'Chưa ghi nhận'}
                                        </dd>
                                    </div>
                                    <div className="py-3">
                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Trình tự thực hiện</dt>
                                        <dd className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-line">
                                            {selectedOp.steps || 'Chưa ghi nhận'}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                             {/* Card 4: Thuốc & Vật tư */}
                             <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                                <SectionTitle icon={BeakerIcon} title="Thuốc & Vật tư tiêu hao" />
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Dụng cụ</dt>
                                        <dd className="text-sm text-gray-900">{selectedOp.instruments || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Thuốc sử dụng</dt>
                                        <dd className="text-sm text-gray-900">{selectedOp.medications || '-'}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    )}
                </div>
            </div>           
        </div>
    );
};

export default OperationView;