
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

// Mock Patient Context (Replace with actual context in real app)
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
        if (isEditing) return; // Prevent switching while editing
        setSelectedId(op.id);
        setFormData(op);
    };

    const handleAddNew = () => {
        setFormData(emptyOperation);
        setSelectedId(null);
        setIsEditing(true);
    };

    const handleEdit = () => {
        if (!selectedId) return;
        setIsEditing(true);
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        if (window.confirm("Bạn có chắc chắn muốn xóa phiếu này không?")) {
            setIsLoading(true);
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
            setIsLoading(false);
            alert("Đã xóa thành công.");
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            // In real app, this would return the saved ID
            const savedOp = await consultationService.saveOperation(formData);
            
            if (!formData.id) {
                // New item
                const newId = `NEW-${Date.now()}`;
                const newItem = { ...formData, id: newId, serviceName: formData.serviceName || 'Dịch vụ mới' };
                setOperations([newItem, ...operations]);
                setSelectedId(newId);
                setFormData(newItem);
            } else {
                // Update item
                setOperations(operations.map(op => op.id === formData.id ? formData : op));
            }
            
            setIsEditing(false);
            alert("Lưu dữ liệu thành công!");
        } catch (error) {
            alert("Lỗi khi lưu dữ liệu.");
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
            // If canceling a new add, select the first one again if available
            if (operations.length > 0) {
                setSelectedId(operations[0].id);
                setFormData(operations[0]);
            } else {
                setFormData(emptyOperation);
            }
        }
    };

    const handlePrint = () => {
        alert("Chức năng in đang được xử lý (Mở PDF Preview)...");
        // Integrate with PdfPreviewModal logic here
    };

    const handleChange = (field: keyof OperationRecord, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return