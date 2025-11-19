import React, { useState, useEffect } from 'react';
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    PrinterIcon,
    ScissorsIcon,
    UserGroupIcon,
    DocumentTextIcon,
    ClockIcon,
    SaveIcon,
    BanIcon
} from '../../../../components/Icons';
import { OperationRecord } from '../../../../types';
import { consultationService } from '../../../../services/consultationService';

// Mock Patient Context
const mockPatientId = 'P003';

const emptyOperation: OperationRecord = {
    id: '',
    serviceName: '',
    requestDate: new Date().toLocaleDateString('vi-VN'),
    type: 'PT',
    operationType: '',
    operationDate: new Date().toISOString().split('T')[0],
    room: '',
    startTime: '',
    endTime: '',
    mainSurgeon: '',
    assistantSurgeons: '',
    anesthesiologist: '',
    nurses: '',
    technicians: '',
    method: '',
    steps: '',
    instruments: '',
    medications: ''
};

const OperationView: React.FC = () => {
    const [operations, setOperations] = useState<OperationRecord[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [formData, setFormData] = useState<OperationRecord>(emptyOperation);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Load dữ liệu khi mở tab
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await consultationService.getOperations(mockPatientId);
            setOperations(data);
            if (data.length > 0 && !selectedId) {
                setSelectedId(data[0].id);
                setFormData(data[0]);
            }
        } catch (error) {
            console.error("Error loading operations:", error);
        }
    };

    const handleSelect = (op: OperationRecord) => {
        if (isEditing) return;
        setSelectedId(op.id);
        setFormData(op);
    };

    const handleAddNew = () => {
        setFormData({ ...emptyOperation, id: '' });
        setSelectedId(null);
        setIsEditing(true);
    };

    const handleEdit = () => {
        if (!selectedId) return;
        setIsEditing(true);
    };

    const handleDelete = async () => {
        if (!selectedId || !window.confirm("Bạn có chắc chắn muốn xóa phiếu phẫu thuật/thủ thuật này không?")) return;

        setIsLoading(true);
        try {
            await consultationService.deleteOperation(selectedId);
            const newList = operations.filter(o => o.id !== selectedId);
            setOperations(newList);

            if (newList.length > 0) {
                setSelectedId(newList[0].id);
                setFormData(newList[0]);
            } else {
                setSelectedId(null);
                setFormData(emptyOperation);
            }
            alert("Đã xóa thành công.");
        } catch (err) {
            alert("Xóa thất bại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const saved = await consultationService.saveOperation(formData);

            if (!formData.id) {
                // Thêm mới
                const newItem = { ...formData, id: saved.id || `OP-${Date.now()}` };
                setOperations([newItem, ...operations]);
                setSelectedId(newItem.id);
                setFormData(newItem);
            } else {
                // Cập nhật
                setOperations(prev => prev.map(op => op.id === formData.id ? formData : op));
            }
            setIsEditing(false);
            alert("Lưu thành công!");
        } catch (err) {
            alert("Lưu thất bại. Vui lòng kiểm tra lại.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (selectedId) {
            const original = operations.find(o => o.id === selectedId);
            if (original) setFormData(original);
        } else {
            setFormData(emptyOperation);
        }
    };

    const handlePrint = () => {
        alert("Đang mở bản in phiếu phẫu thuật/thủ thuật...");
        // Ở đây bạn sẽ gọi PdfPreviewModal hoặc window.print()
    };

    const handleChange = (field: keyof OperationRecord, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="flex h-full bg-gray-50">
            {/* Danh sách bên trái */}
            <div className="w-80 border-r border-gray-300 bg-white overflow-y-auto">
                <div className="p-4 border-b border-gray-300 flex justify-between items-center">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <ScissorsIcon className="w-5 h-5 text-blue-600" />
                        Phẫu thuật / Thủ thuật
                    </h2>
                    <button
                        onClick={handleAddNew}
                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        title="Thêm mới"
                    >
                        <PlusIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="divide-y divide-gray-200">
                    {operations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            Chưa có phiếu phẫu thuật/thủ thuật nào
                        </div>
                    ) : (
                        operations.map(op => (
                            <div
                                key={op.id}
                                onClick={() => handleSelect(op)}
                                className={`p-4 cursor-pointer transition ${
                                    selectedId === op.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                                }`}
                            >
                                <div className="font-medium">{op.serviceName || 'Chưa đặt tên'}</div>
                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                    <ClockIcon className="w-4 h-4" />
                                    {op.operationDate} {op.startTime && `- ${op.startTime}`}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    BS chính: {op.mainSurgeon || 'Chưa chỉ định'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Form chi tiết bên phải */}
            <div className="flex-1 p-6 overflow-y-auto">
                {isLoading && (
                    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
                        <div className="bg-white p-4 rounded shadow-lg">Đang xử lý...</div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow">
                    {/* Header với các nút hành động */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-300">
                        <h3 className="text-xl font-semibold">
                            {isEditing ? (formData.id ? 'Chỉnh sửa' : 'Thêm mới') : 'Chi tiết'} phiếu phẫu thuật/thủ thuật
                        </h3>
                        <div className="flex gap-2">
                            {!isEditing ? (
                                <>
                                    <button onClick={handleEdit} disabled={!selectedId} className="btn-icon" title="Sửa">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={handleDelete} disabled={!selectedId} className="btn-icon text-red-600" title="Xóa">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={handlePrint} disabled={!selectedId} className="btn-icon" title="In phiếu">
                                        <PrinterIcon className="w-5 h-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                                        <SaveIcon className="w-5 h-5" /> Lưu
                                    </button>
                                    <button onClick={handleCancel} className="btn-secondary flex items-center gap-2">
                                        <BanIcon className="w-5 h-5" /> Hủy
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Form body */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-medium mb-1">Tên dịch vụ / Thủ thuật</label>
                            <input
                                type="text"
                                value={formData.serviceName}
                                onChange={e => handleChange('serviceName', e.target.value)}
                                disabled={!isEditing}
                                className="input w-full"
                                placeholder="VD: Cắt amidan, Nội soi đại tràng..."
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-1">Loại</label>
                            <select
                                value={formData.type}
                                onChange={e => handleChange('type', e.target.value)}
                                disabled={!isEditing}
                                className="input w-full"
                            >
                                <option value="PT">Phẫu thuật</option>
                                <option value="TT">Thủ thuật</option>
                            </select>
                        </div>

                        <div>
                            <label className="block font-medium mb-1">Ngày yêu cầu</label>
                            <input type="text" value={formData.requestDate} disabled className="input w-full bg-gray-100" />
                        </div>

                        <div>
                            <label className="block font-medium mb-1">Ngày phẫu thuật/thủ thuật</label>
                            <input
                                type="date"
                                value={formData.operationDate}
                                onChange={e => handleChange('operationDate', e.target.value)}
                                disabled={!isEditing}
                                className="input w-full"
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-1">Phòng mổ</label>
                            <input
                                type="text"
                                value={formData.room}
                                onChange={e => handleChange('room', e.target.value)}
                                disabled={!isEditing}
                                className="input w-full"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-medium mb-1">Giờ bắt đầu</label>
                                <input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={e => handleChange('startTime', e.target.value)}
                                    disabled={!isEditing}
                                    className="input w-full"
                                />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Giờ kết thúc</label>
                                <input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={e => handleChange('endTime', e.target.value)}
                                    disabled={!isEditing}
                                    className="input w-full"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1 flex items-center gap-2">
                                <UserGroupIcon className="w-5 h-5 text-blue-600" />
                                Bác sĩ chính
                            </label>
                            <input
                                type="text"
                                value={formData.mainSurgeon}
                                onChange={e => handleChange('mainSurgeon', e.target.value)}
                                disabled={!isEditing}
                                className="input w-full"
                                placeholder="Họ tên bác sĩ phẫu thuật chính"
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-1">Phụ mổ</label>
                            <input
                                type="text"
                                value={formData.assistantSurgeons}
                                onChange={e => handleChange('assistantSurgeons', e.target.value)}
                                disabled={!isEditing}
                                className="input w-full"
                                placeholder="Cách nhau bằng dấu phẩy"
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-1">Gây mê</label>
                            <input
                                type="text"
                                value={formData.anesthesiologist}
                                onChange={e => handleChange('anesthesiologist', e.target.value)}
                                disabled={!isEditing}
                                className="input w-full"
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-1">Điều dưỡng</label>
                            <input
                                type="text"
                                value={formData.nurses}
                                onChange={e => handleChange('nurses', e.target.value)}
                                disabled={!isEditing}
                                className="input w-full"
                            />
                        </div>

                        <div>
                            <label className="block font-medium mb-1">Kỹ thuật viên</label>
                            <input
                                type="text"
                                value={formData.technicians}
                                onChange={e => handleChange('technicians', e.target.value)}
                                disabled={!isEditing}
                                className="input w-full"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1">Phương pháp</label>
                            <textarea
                                rows={3}
                                value={formData.method}
                                onChange={e => handleChange('method', e.target.value)}
                                disabled={!isEditing}
                                className="input w-full"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1">Các bước thực hiện</label>
                            <textarea
                                rows={5}
                                value={formData.steps}
                                onChange={e => handleChange('steps', e.target.value)}
                                disabled={!isEditing}
                                className="input w-full"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1">Dụng cụ</label>
                            <textarea
                                rows={3}
                                value={formData.instruments}
                                onChange={e => handleChange('instruments', e.target.value)}
                                disabled={!isEditing}
                                className="input w-full"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block font-medium mb-1">Thuốc sử dụng</label>
                            <textarea
                                rows={3}
                                value={formData.medications}
                                onChange={e => handleChange('medications', e.target.value)}
                                disabled={!isEditing}
                                className="input w-full"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperationView;