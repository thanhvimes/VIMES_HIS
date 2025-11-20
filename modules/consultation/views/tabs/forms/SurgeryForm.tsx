
import React from 'react';
import { 
    ClockIcon, 
    UserGroupIcon, 
    DocumentTextIcon, 
    BeakerIcon,
    ScissorsIcon,
    CameraIcon
} from '../../../../../components/Icons';
import { OperationRecord } from '../../../../../types';
import ImageGalleryUpload from './ImageGalleryUpload';
import Combobox from '../../../../../components/shared/Combobox';
import { doctorOptions, surgeryOptions, diagnosisOptions } from '../../../data/catalogs';

interface SurgeryFormProps {
    formData: OperationRecord;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | { target: { name: string; value: string } }) => void;
    onImagesChange: (images: string[]) => void;
}

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 pb-2 border-b border-blue-100 dark:border-blue-900 mb-4 mt-6 first:mt-0">
        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h4 className="text-md font-bold text-slate-700 dark:text-slate-200">{title}</h4>
    </div>
);

const InputGroup = ({ label, name, value, onChange, type = 'text', required = false, fullWidth = false, colSpan = 1, placeholder = '' }: any) => (
    <div className={`${fullWidth ? 'col-span-full' : `col-span-full md:col-span-${colSpan}`}`}>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value || ''}
            onChange={onChange}
            required={required}
            placeholder={placeholder}
            className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
    </div>
);

const TextareaGroup = ({ label, name, value, onChange, rows = 3, placeholder = '' }: any) => (
    <div className="col-span-full">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
        <textarea
            name={name}
            rows={rows}
            value={value || ''}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
        />
    </div>
);

const SurgeryForm: React.FC<SurgeryFormProps> = ({ formData, onChange, onImagesChange }) => {
    
    // Helper to adapt Combobox string value to event-like object expected by parent onChange
    const handleComboChange = (name: string) => (value: string) => {
        onChange({ target: { name, value } });
    };

    return (
        <>
            {/* Section 1: General Info */}
            <SectionHeader icon={ClockIcon} title="Thông tin hành chính (Phẫu thuật)" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-3">
                    <Combobox 
                        label="Tên phẫu thuật" 
                        name="serviceName"
                        value={formData.serviceName} 
                        onChange={handleComboChange('serviceName')} 
                        options={surgeryOptions}
                        required 
                        placeholder="Tìm kiếm hoặc nhập tên phẫu thuật..."
                    />
                </div>
                <div className="col-span-1">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Loại hình</label>
                        <div className="p-2 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-100 dark:border-blue-800 flex items-center gap-2 h-[38px]">
                            <ScissorsIcon className="w-4 h-4"/> Phẫu thuật
                        </div>
                </div>
                
                <InputGroup label="Ngày chỉ định" name="requestDate" value={formData.requestDate} onChange={onChange} placeholder="dd/mm/yyyy" />
                <InputGroup label="Ngày phẫu thuật" name="operationDate" type="date" value={formData.operationDate} onChange={onChange} required />
                <InputGroup label="Phòng mổ" name="room" colSpan={2} value={formData.room} onChange={onChange} placeholder="Chọn phòng mổ..." />
                
                <InputGroup label="Giờ bắt đầu" name="startTime" type="time" value={formData.startTime} onChange={onChange} />
                <InputGroup label="Giờ kết thúc" name="endTime" type="time" value={formData.endTime} onChange={onChange} />
                <div className="col-span-1 md:col-span-2">
                    <Combobox 
                        label="Chẩn đoán trước/sau mổ"
                        name="operationType" 
                        value={formData.operationType} 
                        onChange={handleComboChange('operationType')}
                        options={diagnosisOptions}
                        placeholder="Nhập chẩn đoán..."
                    />
                </div>
            </div>

            {/* Section 2: Team */}
            <SectionHeader icon={UserGroupIcon} title="Kíp phẫu thuật" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Combobox 
                    label="Phẫu thuật viên chính"
                    name="mainSurgeon" 
                    value={formData.mainSurgeon} 
                    onChange={handleComboChange('mainSurgeon')}
                    options={doctorOptions}
                    required
                    placeholder="Chọn bác sĩ..."
                />
                <Combobox 
                    label="Bác sĩ gây mê"
                    name="anesthesiologist" 
                    value={formData.anesthesiologist} 
                    onChange={handleComboChange('anesthesiologist')}
                    options={doctorOptions}
                    placeholder="Chọn bác sĩ..."
                />
                <TextareaGroup label="Phụ mổ" name="assistantSurgeons" value={formData.assistantSurgeons} onChange={onChange} rows={2} placeholder="Danh sách các BS phụ mổ..."/>
                <TextareaGroup label="Dụng cụ viên / Điều dưỡng" name="nurses" value={formData.nurses} onChange={onChange} rows={2} placeholder="Điều dưỡng vòng trong/ngoài..."/>
                <TextareaGroup label="Kỹ thuật viên / Hỗ trợ khác" name="technicians" value={formData.technicians} onChange={onChange} rows={1} placeholder="KTV hỗ trợ..."/>
            </div>

            {/* Section 3: Details */}
            <SectionHeader icon={DocumentTextIcon} title="Chi tiết chuyên môn" />
            <div className="grid grid-cols-1 gap-4">
                <TextareaGroup label="Phương pháp vô cảm / Giảm đau" name="method" value={formData.method} onChange={onChange} rows={2} placeholder="Ví dụ: Gây mê nội khí quản..." />
                <TextareaGroup label="Tường trình phẫu thuật (Các bước tiến hành)" name="steps" value={formData.steps} onChange={onChange} rows={8} placeholder="Mô tả chi tiết các bước phẫu thuật..." />
            </div>

            {/* Section 4: Resources */}
            <SectionHeader icon={BeakerIcon} title="Thuốc & Vật tư tiêu hao" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextareaGroup label="Dụng cụ phẫu thuật" name="instruments" value={formData.instruments} onChange={onChange} rows={3} placeholder="Dao, kéo, chỉ khâu..." />
                <TextareaGroup label="Thuốc sử dụng trong mổ" name="medications" value={formData.medications} onChange={onChange} rows={3} placeholder="Kháng sinh, thuốc mê..." />
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

export default SurgeryForm;
