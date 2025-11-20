
import React, { useState, useEffect } from 'react';
import { 
    XIcon, 
    SaveIcon, 
    ScissorsIcon,
    ActivityIcon
} from '../../../../components/Icons';
import { OperationRecord } from '../../../../types';
import SurgeryForm from './forms/SurgeryForm';
import ProcedureForm from './forms/ProcedureForm';

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

    const handleImagesChange = (newImages: string[]) => {
        setFormData(prev => ({ ...prev, images: newImages }));
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

    const isSurgery = formData.type === 'PT';
    const modalTitle = formData.id 
        ? (isSurgery ? 'Cập nhật Phẫu thuật' : 'Cập nhật Thủ thuật') 
        : (isSurgery ? 'Thêm mới Phẫu thuật' : 'Thêm mới Thủ thuật');

    const themeClass = isSurgery 
        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800' 
        : 'bg-teal-50 dark:bg-teal-900/20 border-teal-100 dark:border-teal-800';

    const buttonClass = isSurgery 
        ? 'bg-blue-600 hover:bg-blue-700' 
        : 'bg-teal-600 hover:bg-teal-700';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4">
            <div className="bg-white dark:bg-slate-800 w-full h-full md:h-auto md:max-h-[90vh] md:rounded-xl md:shadow-2xl md:max-w-4xl flex flex-col animate-fade-in-up overflow-hidden">
                
                {/* --- Header --- */}
                <div className={`flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b md:rounded-t-xl flex-shrink-0 ${themeClass}`}>
                    <div className="flex items-center gap-3">
                        {isSurgery ? <ScissorsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400"/> : <ActivityIcon className="w-6 h-6 text-teal-600 dark:text-teal-400"/>}
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">
                            {modalTitle}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* --- Form Content --- */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 md:p-6">
                    
                    {/* Hidden Type Field to ensure persistence */}
                    <input type="hidden" name="type" value={formData.type} />

                    {isSurgery ? (
                        <SurgeryForm 
                            formData={formData} 
                            onChange={handleChange} 
                            onImagesChange={handleImagesChange} 
                        />
                    ) : (
                        <ProcedureForm 
                            formData={formData} 
                            onChange={handleChange} 
                            onImagesChange={handleImagesChange} 
                        />
                    )}
                </form>

                {/* --- Footer --- */}
                <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 md:rounded-b-xl flex justify-end gap-3 flex-shrink-0 safe-pb">
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
                        className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md hover:shadow-lg transition disabled:opacity-70 flex items-center gap-2 ${buttonClass}`}
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <span>Đang lưu...</span>
                            </>
                        ) : (
                            <>
                                <SaveIcon className="w-4 h-4" />
                                <span>{isSurgery ? 'Lưu Tường trình PT' : 'Lưu Thủ thuật'}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OperationFormModal;
