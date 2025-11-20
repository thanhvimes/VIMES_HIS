
import React from 'react';
import { 
    ClockIcon, 
    UserGroupIcon, 
    DocumentTextIcon, 
    BeakerIcon,
    ActivityIcon,
    CameraIcon
} from '../../../../../components/Icons';
import { OperationRecord } from '../../../../../types';
import ImageGalleryUpload from './ImageGalleryUpload';
import Combobox from '../../../../../components/shared/Combobox';
import { doctorOptions, procedureOptions, CatalogItem, DoctorItem } from '../../../data/catalogs';

interface ProcedureFormProps {
    formData: OperationRecord;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { target: { name: string; value: string } }) => void;
    onImagesChange: (images: string[]) => void;
}

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 pb-2 border-b border-teal-100 dark:border-teal-900 mb-4 mt-6 first:mt-0">
        <Icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        <h4 className="text-md font-bold text-slate-700 dark:text-slate-200">{title}</h4>
    </div>
);

const InputGroup = ({ label, name, value, onChange, type = 'text', required = false, fullWidth = false, colSpan = 1, placeholder = '' }: any) => (
    <div className={`${fullWidth ? 'col-span-full' : `col-span-full md:col-span-${colSpan}`}`}>
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
        />
    </div>
);

const TextareaGroup = ({ label, name, value, onChange, rows = 3, placeholder = '' }: any) => (
    <div className="col-span-full">
        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">{label}</label>
        <textarea
            name={name}
            rows={rows}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y shadow-sm"
        />
    </div>
);

const ProcedureForm: React.FC<ProcedureFormProps> = ({ formData, onChange, onImagesChange }) => {
    
    const handleComboChange = (name: string) => (value: string) => {
        onChange({ target: { name, value } });
    };

    // --- Custom Renderers ---
    const renderCatalogItem = (item: CatalogItem, isSelected: boolean) => (
        <div className="flex justify-between items-center">
            <div className="flex flex-col">
                <span className="font-semibold">{item.name}</span>
                <span className={`text-xs ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>{item.group}</span>
            </div>
        </div>
    );

    const renderDoctorItem = (item: DoctorItem, isSelected: boolean) => (
        <div>
            <div className="font-medium">{item.name}</div>
            <div className={`text-xs ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>{item.role}</div>
        </div>
    );

    return (
        <>
            {/* Section 1: General Info */}
            <SectionHeader icon={ClockIcon} title="Thông tin thủ thuật" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-3">
                    <Combobox<CatalogItem>
                        label="Tên thủ thuật" 
                        name="serviceName"
                        value={formData.serviceName} 
                        onChange={handleComboChange('serviceName')} 
                        options={procedureOptions}
                        required 
                        placeholder="Tìm kiếm tên thủ thuật..."
                        displayValue={item => item.name}
                        renderItem={renderCatalogItem}
                    />
                </div>
                <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Loại hình</label>
                        <div className="p-2.5 text-sm font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-100 dark:border-teal-800 flex items-center gap-2 h-[42px]">
                            <ActivityIcon className="w-4 h-4"/> Thủ thuật
                        </div>
                </div>
                
                <InputGroup label="Ngày làm" name="operationDate" type="date" value={formData.operationDate} onChange={onChange} required />
                <InputGroup label="Tại phòng" name="room" value={formData.room} onChange={onChange} placeholder="Phòng tiểu phẫu/Tại chỗ..." />
                
                <InputGroup label="Giờ bắt đầu" name="startTime" type="time" value={formData.startTime} onChange={onChange} />
                <InputGroup label="Giờ kết thúc" name="endTime" type="time" value={formData.endTime} onChange={onChange} />
            </div>

            {/* Section 2: Team - Simplified for Procedure */}
            <SectionHeader icon={UserGroupIcon} title="Người thực hiện" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Combobox<DoctorItem>
                    label="Bác sĩ / Người thực hiện chính"
                    name="mainSurgeon" 
                    value={formData.mainSurgeon} 
                    onChange={handleComboChange('mainSurgeon')}
                    options={doctorOptions}
                    required
                    placeholder="Chọn người thực hiện..."
                    displayValue={item => item.name}
                    renderItem={renderDoctorItem}
                />
                <InputGroup label="Người phụ / Hỗ trợ" name="nurses" value={formData.nurses} onChange={onChange} placeholder="Họ tên điều dưỡng phụ..."/>
            </div>

            {/* Section 3: Details - Simplified */}
            <SectionHeader icon={DocumentTextIcon} title="Mô tả thủ thuật" />
            <div className="grid grid-cols-1 gap-4">
                <TextareaGroup label="Cách thức thực hiện" name="method" value={formData.method} onChange={onChange} rows={2} placeholder="Ví dụ: Gây tê tại chỗ, khâu 3 mũi..." />
                <TextareaGroup label="Diễn biến / Mô tả chi tiết" name="steps" value={formData.steps} onChange={onChange} rows={5} placeholder="Mô tả vắn tắt quá trình..." />
            </div>

            {/* Section 4: Resources */}
            <SectionHeader icon={BeakerIcon} title="Vật tư sử dụng" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextareaGroup label="Vật tư tiêu hao (Bông, băng, gạc...)" name="instruments" value={formData.instruments} onChange={onChange} rows={2} placeholder="Liệt kê vật tư..." />
                <TextareaGroup label="Thuốc (Thuốc tê, sát khuẩn...)" name="medications" value={formData.medications} onChange={onChange} rows={2} placeholder="Liệt kê thuốc..." />
            </div>

             {/* Section 5: Images */}
             <SectionHeader icon={CameraIcon} title="Hình ảnh đính kèm" />
            <div className="col-span-full">
                 <ImageGalleryUpload 
                    images={formData.images || []} 
                    onImagesChange={onImagesChange} 
                />
            </div>
        </>
    );
};

export default ProcedureForm;
