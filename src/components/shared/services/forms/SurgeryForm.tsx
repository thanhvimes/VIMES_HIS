
import React from 'react';
import { ClockIcon, UserGroupIcon, DocumentTextIcon, BeakerIcon, ScissorsIcon, CameraIcon } from '../../../Icons';
import { OperationRecord } from '../../../../types';
import ImageGalleryUpload from './ImageGalleryUpload';
import Combobox, { ComboboxColumn } from '../../Combobox';
import { doctorOptions, surgeryOptions, diagnosisOptions, CatalogItem, DoctorItem } from '../../../../modules/consultation/data/catalogs';

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

const InputGroup = ({ label, name, value, onChange, type = 'text', required = false, colSpan = 1, placeholder = '' }: any) => (
    <div className={`col-span-full md:col-span-${colSpan}`}>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
        <input type={type} name={name} value={value || ''} onChange={onChange} required={required} placeholder={placeholder} className="w-full p-2.5 text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 shadow-sm" />
    </div>
);

const TextareaGroup = ({ label, name, value, onChange, rows = 3, placeholder = '' }: any) => (
    <div className="col-span-full">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
        <textarea name={name} rows={rows} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-2.5 text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-y shadow-sm" />
    </div>
);

const SurgeryForm: React.FC<SurgeryFormProps> = ({ formData, onChange, onImagesChange }) => {
    const handleComboChange = (name: string) => (value: string) => { onChange({ target: { name, value } }); };

    const surgeryColumns: ComboboxColumn<CatalogItem>[] = [
        { key: 'code', label: 'Mã', width: '15%', className: 'font-mono text-xs text-slate-500' },
        { key: 'name', label: 'Tên phẫu thuật', width: '60%', className: 'font-medium' },
        { key: 'group', label: 'Nhóm', width: '25%', className: 'text-xs text-blue-600 dark:text-blue-400' },
    ];
    const doctorColumns: ComboboxColumn<DoctorItem>[] = [
        { key: 'name', label: 'Họ tên', width: '55%', className: 'font-bold' },
        { key: 'department', label: 'Khoa', width: '25%', className: 'text-xs text-slate-500' },
    ];

    return (
        <>
            <SectionHeader icon={ClockIcon} title="Thông tin hành chính (Phẫu thuật)" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-3">
                    <Combobox<CatalogItem> label="Tên phẫu thuật" name="serviceName" value={formData.serviceName} onChange={handleComboChange('serviceName')} options={surgeryOptions} columns={surgeryColumns} required placeholder="Tìm kiếm tên phẫu thuật..." displayValue={(item) => item.name} />
                </div>
                <div className="col-span-1">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Loại hình</label>
                    <div className="p-2.5 text-base font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-2 h-[46px]"><ScissorsIcon className="w-4 h-4"/> Phẫu thuật</div>
                </div>
                <InputGroup label="Ngày chỉ định" name="requestDate" value={formData.requestDate} onChange={onChange} />
                <InputGroup label="Ngày PT" name="operationDate" type="date" value={formData.operationDate} onChange={onChange} required />
                <InputGroup label="Phòng mổ" name="room" colSpan={2} value={formData.room} onChange={onChange} />
                <InputGroup label="Bắt đầu" name="startTime" type="time" value={formData.startTime} onChange={onChange} />
                <InputGroup label="Kết thúc" name="endTime" type="time" value={formData.endTime} onChange={onChange} />
                <div className="col-span-1 md:col-span-2">
                    <Combobox<CatalogItem> label="Chẩn đoán" name="operationType" value={formData.operationType} onChange={handleComboChange('operationType')} options={diagnosisOptions} displayValue={(item) => `${item.code} - ${item.name}`} />
                </div>
            </div>

            <SectionHeader icon={UserGroupIcon} title="Kíp phẫu thuật" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Combobox<DoctorItem> label="Phẫu thuật viên chính" name="mainSurgeon" value={formData.mainSurgeon} onChange={handleComboChange('mainSurgeon')} options={doctorOptions} columns={doctorColumns} required displayValue={(item) => item.name} />
                <Combobox<DoctorItem> label="Bác sĩ gây mê" name="anesthesiologist" value={formData.anesthesiologist} onChange={handleComboChange('anesthesiologist')} options={doctorOptions} columns={doctorColumns} displayValue={(item) => item.name} />
                <TextareaGroup label="Phụ mổ / Điều dưỡng / KTV" name="assistantSurgeons" value={formData.assistantSurgeons} onChange={onChange} rows={2} />
            </div>

            <SectionHeader icon={DocumentTextIcon} title="Chi tiết chuyên môn" />
            <div className="grid grid-cols-1 gap-4">
                <TextareaGroup label="Phương pháp vô cảm" name="method" value={formData.method} onChange={onChange} rows={2} />
                <TextareaGroup label="Tường trình phẫu thuật" name="steps" value={formData.steps} onChange={onChange} rows={6} />
            </div>

            <SectionHeader icon={BeakerIcon} title="Thuốc & Vật tư tiêu hao" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextareaGroup label="Dụng cụ PT" name="instruments" value={formData.instruments} onChange={onChange} rows={3} />
                <TextareaGroup label="Thuốc sử dụng" name="medications" value={formData.medications} onChange={onChange} rows={3} />
            </div>

             <SectionHeader icon={CameraIcon} title="Hình ảnh đính kèm" />
            <div className="col-span-full"><ImageGalleryUpload images={formData.images || []} onImagesChange={onImagesChange} /></div>
        </>
    );
};
export default SurgeryForm;