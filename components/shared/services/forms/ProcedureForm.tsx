
import React from 'react';
import { ClockIcon, UserGroupIcon, DocumentTextIcon, BeakerIcon, ActivityIcon, CameraIcon } from '../../../Icons';
import { OperationRecord } from '../../../../types';
import ImageGalleryUpload from './ImageGalleryUpload';
import Combobox, { ComboboxColumn } from '../../Combobox';
import { doctorOptions, procedureOptions, CatalogItem, DoctorItem } from '../../../../modules/consultation/data/catalogs';
import { consultationService } from '../../../../services/consultationService';

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

const InputGroup = ({ label, name, value, onChange, type = 'text', required = false, colSpan = 1, placeholder = '' }: any) => (
    <div className={`col-span-full md:col-span-${colSpan}`}>
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
        <input type={type} name={name} value={value || ''} onChange={onChange} required={required} placeholder={placeholder} className="w-full p-2.5 text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 shadow-sm" />
    </div>
);

const TextareaGroup = ({ label, name, value, onChange, rows = 3, placeholder = '' }: any) => (
    <div className="col-span-full">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
        <textarea name={name} rows={rows} value={value || ''} onChange={onChange} placeholder={placeholder} className="w-full p-2.5 text-base border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 resize-y shadow-sm" />
    </div>
);

const ProcedureForm: React.FC<ProcedureFormProps> = ({ formData, onChange, onImagesChange }) => {
    const [options, setOptions] = React.useState<CatalogItem[]>(procedureOptions);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSearch = async (query: string) => {
        if (!query || query.length < 2) return;
        setIsLoading(true);
        try {
            const response = await consultationService.getOperationCatalog(query, 'TT');
            if (response.success) {
                setOptions(response.data || []);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleComboChange = (name: string) => (value: string) => { 
        onChange({ target: { name, value } }); 
    };

    const handleServiceChange = (value: string, item?: CatalogItem) => {
        if (item) {
            onChange({ target: { name: 'serviceName', value: item.name } } as any);
            onChange({ target: { name: 'itemId', value: item.code } } as any);
        } else {
            onChange({ target: { name: 'serviceName', value } });
        }
    };

    const procedureColumns: ComboboxColumn<CatalogItem>[] = [
        { key: 'code', label: 'Mã', width: '15%', className: 'font-mono text-xs text-slate-500' },
        { key: 'name', label: 'Tên thủ thuật', width: '60%', className: 'font-medium' },
        { key: 'group', label: 'Nhóm', width: '25%', className: 'text-xs text-teal-600 dark:text-teal-400' },
    ];
    const doctorColumns: ComboboxColumn<DoctorItem>[] = [
        { key: 'name', label: 'Họ tên', width: '55%', className: 'font-bold' },
        { key: 'department', label: 'Khoa', width: '25%', className: 'text-xs text-slate-500' },
    ];

    return (
        <>
            <SectionHeader icon={ClockIcon} title="Thông tin thủ thuật" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="col-span-1 md:col-span-3">
                    <Combobox<CatalogItem> 
                        label="Tên thủ thuật" 
                        name="serviceName" 
                        value={formData.serviceName} 
                        onChange={handleServiceChange} 
                        options={options} 
                        columns={procedureColumns} 
                        required 
                        placeholder="Tìm kiếm tên thủ thuật..." 
                        displayValue={(item) => item.name} 
                        onSearch={handleSearch}
                        isLoading={isLoading}
                    />
                </div>
                <div className="col-span-1">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">Loại hình</label>
                    <div className="p-2.5 text-base font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded-lg border border-teal-100 dark:border-teal-800 flex items-center gap-2 h-[46px]"><ActivityIcon className="w-4 h-4"/> Thủ thuật</div>
                </div>
                <InputGroup label="Ngày làm" name="operationDate" type="date" value={formData.operationDate} onChange={onChange} required />
                <InputGroup label="Tại phòng" name="room" value={formData.room} onChange={onChange} placeholder="Phòng tiểu phẫu/Tại chỗ..." />
                <InputGroup label="Bắt đầu" name="startTime" type="time" value={formData.startTime} onChange={onChange} />
                <InputGroup label="Kết thúc" name="endTime" type="time" value={formData.endTime} onChange={onChange} />
            </div>

            <SectionHeader icon={UserGroupIcon} title="Người thực hiện" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Combobox<DoctorItem> label="Người thực hiện chính" name="mainSurgeon" value={formData.mainSurgeon} onChange={handleComboChange('mainSurgeon')} options={doctorOptions} columns={doctorColumns} required displayValue={(item) => item.name} />
                <InputGroup label="Người phụ / Hỗ trợ" name="nurses" value={formData.nurses} onChange={onChange} placeholder="Họ tên điều dưỡng phụ..."/>
            </div>

            <SectionHeader icon={DocumentTextIcon} title="Mô tả thủ thuật" />
            <div className="grid grid-cols-1 gap-4">
                <TextareaGroup label="Cách thức thực hiện" name="method" value={formData.method} onChange={onChange} rows={2} />
                <TextareaGroup label="Diễn biến / Mô tả chi tiết" name="steps" value={formData.steps} onChange={onChange} rows={5} />
            </div>

            <SectionHeader icon={BeakerIcon} title="Vật tư sử dụng" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextareaGroup label="Vật tư tiêu hao" name="instruments" value={formData.instruments} onChange={onChange} rows={2} />
                <TextareaGroup label="Thuốc" name="medications" value={formData.medications} onChange={onChange} rows={2} />
            </div>

             <SectionHeader icon={CameraIcon} title="Hình ảnh đính kèm" />
            <div className="col-span-full"><ImageGalleryUpload images={formData.images || []} onImagesChange={onImagesChange} /></div>
        </>
    );
};
export default ProcedureForm;
