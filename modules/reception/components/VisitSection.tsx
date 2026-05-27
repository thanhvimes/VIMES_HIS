import React from 'react';
import { DocumentTextIcon } from '../../../components/Icons';
import { FormInput, FormTextArea, FormDateTimeInput } from '../../../components/ui/forms';
import Combobox, { ComboboxColumn } from '../../../components/ui/Combobox';
import { ExtendedFormData } from '../utils/registrationUtils';
import { CatalogItem } from '../../../services/catalogService';

interface VisitSectionProps {
    formData: ExtendedFormData;
    isEditable: boolean;
    handleInputChange: (name: string, value: any) => void;
    departments: any[];
    rooms: any[];
    examTypes: any[];
    patientObjects: CatalogItem[];
}

const VisitSection: React.FC<VisitSectionProps> = ({
    formData, isEditable, handleInputChange, departments, rooms, examTypes, patientObjects
}) => {
    // Columns definition for speed entry (Code | Name)
    const codeNameColumns: ComboboxColumn<any>[] = [
        { key: 'code', label: 'Mã', width: '80px', className: 'font-mono text-blue-600 font-semibold text-[12px]' },
        { key: 'name', label: 'Tên phòng/khoa', className: 'text-[12px]' }
    ];

    return (
        <div className={`modern-card p-4 space-y-5 ${isEditable ? 'ring-1 ring-blue-500/20' : ''}`}>
            <div>
                <h3 className="font-bold text-[#005A9E] mb-4 border-b border-slate-100 dark:border-slate-700 pb-2 flex justify-between items-center text-[13px] uppercase tracking-wider">
                    <span className="flex items-center gap-2"><DocumentTextIcon className="w-[18px] h-[18px]" /> Thông tin Lượt khám</span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100">PHIẾU ĐĂNG KÝ</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-4">
                    {/* Row 1: Main Selection Fields */}
                    <div className="col-span-1 md:col-span-3">
                        <FormDateTimeInput
                            label="Ngày giờ đăng ký"
                            name="regDateTime"
                            value={formData.regDateTime || ''}
                            onChange={e => handleInputChange('regDateTime', e.target.value)}
                            readOnly={!isEditable}
                            required={true}
                        />
                    </div>

                    <div className="col-span-1 md:col-span-3">
                        <Combobox
                            label="Đối tượng"
                            columns={codeNameColumns}
                            options={patientObjects}
                            value={String(formData.patientType || '')}
                            displayValue={(item) => item.name}
                            onChange={(_, item) => handleInputChange('patientType', item?.id || '')}
                            disabled={!isEditable}
                            placeholder="Chọn đối tượng..."
                            required={true}
                        />
                    </div>

                    <div className="col-span-1 md:col-span-3">
                        <Combobox
                            label="Phòng khám"
                            columns={codeNameColumns}
                            options={rooms.filter(r => !formData.regDepartment || String(r.deptId) === String(formData.regDepartment))}
                            value={String(formData.regRoom || '')}
                            displayValue={(item) => item.name}
                            onChange={(_, item) => handleInputChange('regRoom', item?.id || '')}
                            disabled={!isEditable}
                            placeholder="Chọn phòng khám..."
                            required={true}
                        />
                    </div>

                    <div className="col-span-1 md:col-span-3">
                        <Combobox
                            label="Loại hình khám"
                            columns={codeNameColumns}
                            options={examTypes}
                            value={String(formData.regExamType || '')}
                            displayValue={(item) => item.name}
                            onChange={(_, item) => handleInputChange('regExamType', item?.id || item?.code || '')}
                            disabled={!isEditable}
                            placeholder="Chọn loại hình..."
                            required={true}
                        />
                    </div>

                    {/* Row 2: Symptoms and Flags */}
                    <div className="col-span-1 md:col-span-9">
                        <FormTextArea
                            label="Lý do/Triệu chứng"
                            name="regReason"
                            value={formData.regReason}
                            onChange={e => handleInputChange('regReason', e.target.value)}
                            readOnly={!isEditable}
                            placeholder="Mô tả triệu chứng cụ thể, lý do đến khám bệnh..."
                            className="h-[74px] text-sm resize-none"
                        />
                    </div>

                    <div className="col-span-1 md:col-span-3 flex flex-col justify-end gap-2.5 pb-2 ml-2">
                        <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={!!formData.regEmergency}
                                onChange={(e) => isEditable && handleInputChange('regEmergency', e.target.checked)}
                                disabled={!isEditable}
                                className="w-4 h-4 rounded text-[#A4262C] focus:ring-[#A4262C] border-slate-300 transition-all cursor-pointer"
                            />
                            <span className={`text-[12px] font-bold transition-colors ${formData.regEmergency ? 'text-[#A4262C]' : 'text-slate-500 group-hover:text-slate-700'}`}>CẤP CỨU</span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={!!formData.regPriority}
                                onChange={(e) => isEditable && handleInputChange('regPriority', e.target.checked)}
                                disabled={!isEditable}
                                className="w-4 h-4 rounded text-[#0078D4] focus:ring-[#0078D4] border-slate-300 transition-all cursor-pointer"
                            />
                            <span className={`text-[12px] font-bold transition-colors ${formData.regPriority ? 'text-[#0078D4]' : 'text-slate-500 group-hover:text-slate-700'}`}>DIỆN ƯU TIÊN</span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={!!formData.regHealthCheck}
                                onChange={(e) => isEditable && handleInputChange('regHealthCheck', e.target.checked)}
                                disabled={!isEditable}
                                className="w-4 h-4 rounded text-[#107C10] focus:ring-[#107C10] border-slate-300 transition-all cursor-pointer"
                            />
                            <span className={`text-[12px] font-bold transition-colors ${formData.regHealthCheck ? 'text-[#107C10]' : 'text-slate-500 group-hover:text-slate-700'}`}>KHÁM SỨC KHỎE</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VisitSection;
