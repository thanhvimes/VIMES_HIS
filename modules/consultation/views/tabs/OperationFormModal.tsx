
import React, { useState, useEffect } from 'react';
import { 
    XIcon, 
    SaveIcon, 
    ClockIcon, 
    UserGroupIcon, 
    DocumentTextIcon, 
    BeakerIcon 
} from '../../../../components/Icons';
import { OperationRecord } from '../../../../types';

interface OperationFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData: OperationRecord;
    onSubmit: (data: OperationRecord) => Promise<void>;
}

const OperationFormModal: React.FC<OperationFormModalProps> = ({ isOpen, onClose, initialData, onSubmit }) => {
    const [formData, setFormData] = useState<OperationRecord>(initialData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData);
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error) {
            console.error(error);
            alert('Có lỗi xảy ra khi lưu dữ liệu.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-slate-700 mb-4 mt-6 first:mt-0">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="text-md font-bold text-gray-800 dark:text-slate-200">{title}</h4>
        </div>
    );

    const InputGroup = ({ label, name, type = 'text', required = false, fullWidth = false, colSpan = 1 }: any) => (
        <div className={`${fullWidth ? 'col-span-full' : `col-span-${colSpan}`}`}>
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={(formData as any)[name] || ''}
                onChange={handleChange}
                required={required}
                className="w-full p-2 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </div>
    );

    const TextareaGroup = ({ label, name, rows = 3 }: any) => (
        <div className="col-span-full">
            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
            <textarea
                name={name}
                rows={rows}
                value={(formData as any)[name] || ''}
                onChange={handleChange}
                className="w-full p-2 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 rounded-t-xl">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        {formData.id ? 'Cập nhật Phiếu' : 'Tạo mới Phiếu'}
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    
                    {/* Section 1: General */}
                    <SectionHeader icon={ClockIcon} title="Thông tin chung" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="col-span-3">
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Tên dịch vụ/Phiếu <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                name="serviceName" 
                                value={formData.serviceName} 
                                onChange={handleChange} 
                                required 
                                className="w-full p-2 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 font-semibold text-blue-700 dark:text-blue-300"
                                placeholder="Ví dụ: Phẫu thuật nội soi..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Loại phiếu</label>
                            <select 
                                name="type" 
                                value={formData.type} 
                                onChange={handleChange} 
                                className="w-full p-2 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                            >
                                <option value="PT">Phẫu thuật</option>
                                <option value="TT">Thủ thuật</option>
                            </select>
                        </div>
                        
                        <InputGroup label="Ngày chỉ định" name="requestDate" type="text" placeholder="dd/mm/yyyy" />
                        <InputGroup label="Ngày thực hiện" name="operationDate" type="date" required />
                        <InputGroup label="Phòng thực hiện" name="room" colSpan={2} />
                        
                        <InputGroup label="Giờ bắt đầu" name="startTime" type="time" />
                        <InputGroup label="Giờ kết thúc" name="endTime" type="time" />
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Loại phẫu thuật (ICD-9 CM)</label>
                            <input 
                                type="text" 
                                name="operationType" 
                                value={formData.operationType} 
                                onChange={handleChange} 
                                className="w-full p-2 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
                                placeholder="Nhập mã hoặc tên loại PT..."
                            />
                        </div>
                    </div>

                    {/* Section 2: Team */}
                    <SectionHeader icon={UserGroupIcon} title="Ekip thực hiện" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputGroup label="Phẫu thuật viên chính" name="mainSurgeon" required />
                        <InputGroup label="Bác sĩ gây mê" name="anesthesiologist" />
                        <TextareaGroup label="Phụ mổ (Các bác sĩ phụ)" name="assistantSurgeons" rows={2} />
                        <TextareaGroup label="Điều dưỡng / Dụng cụ viên" name="nurses" rows={2} />
                        <div className="col-span-full">
                            <InputGroup label="Kỹ thuật viên khác" name="technicians" />
                        </div>
                    </div>

                    {/* Section 3: Details */}
                    <SectionHeader icon={DocumentTextIcon} title="Chi tiết chuyên môn" />
                    <div className="grid grid-cols-1 gap-4">
                        <TextareaGroup label="Phương pháp phẫu thuật / Vô cảm" name="method" rows={2} />
                        <TextareaGroup label="Trình tự thực hiện / Tường trình phẫu thuật" name="steps" rows={8} />
                    </div>

                    {/* Section 4: Resources */}
                    <SectionHeader icon={BeakerIcon} title="Thuốc & Vật tư" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <TextareaGroup label="Dụng cụ / Vật tư tiêu hao" name="instruments" rows={3} />
                         <TextareaGroup label="Thuốc sử dụng trong PT" name="medications" rows={3} />
                    </div>

                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 rounded-b-xl flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition"
                    >
                        Hủy bỏ
                    </button>
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition disabled:opacity-70 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <SaveIcon className="w-4 h-4" />
                                Lưu phiếu
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OperationFormModal;
