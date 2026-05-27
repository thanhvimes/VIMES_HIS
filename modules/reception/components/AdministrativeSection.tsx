import React from 'react';
import { UserGroupIcon } from '../../../components/Icons';
import { FormInput, FormSelect, FormDateInput } from '../../../components/ui/forms';
import Combobox, { ComboboxColumn } from '../../../components/ui/Combobox';
import { ExtendedFormData } from '../utils/registrationUtils';
import { CatalogItem } from '../../../services/catalogService';

interface AdministrativeSectionProps {
    formData: ExtendedFormData;
    isEditable: boolean;
    handleInputChange: (name: string, value: any) => void;
    handleDobChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleIdentityInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleIdentityBlur: () => void;
    ethnicities: CatalogItem[];
    occupations: CatalogItem[];
    provinces: CatalogItem[];
    wards: CatalogItem[];
    handleProvinceChange: (val: string, item?: CatalogItem) => void;
    handleWardChange: (val: string, item?: CatalogItem) => void;
    commonColumns: ComboboxColumn<CatalogItem>[];
    nations: CatalogItem[];
    relationships: CatalogItem[];
    workplaces: CatalogItem[];
}

const AdministrativeSection: React.FC<AdministrativeSectionProps> = ({
    formData, isEditable, handleInputChange, handleDobChange, handleIdentityInput, handleIdentityBlur,
    ethnicities, occupations, provinces, wards, handleProvinceChange, handleWardChange, commonColumns,
    nations, relationships, workplaces
}) => {
    return (
        <div className={`modern-card p-4 space-y-4 ${isEditable ? 'ring-1 ring-blue-500/20' : ''}`}>
            <div>
                <h3 className="font-bold text-[#005A9E] mb-4 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2 text-[13px] uppercase tracking-wider">
                    <UserGroupIcon className="w-[18px] h-[18px]" /> Thông tin Hành chính
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-x-3 gap-y-4">
                    <div className="col-span-1 md:col-span-1">
                        <FormInput label="Mã Bệnh nhân" name="id" value={formData.id} readOnly className="font-mono font-black text-slate-800" />
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <FormInput label="Mã Hồ sơ" name="recordNumber" value={formData.recordNumber} readOnly className="font-mono font-extrabold text-red-600" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <FormInput 
                            label="Họ và tên" 
                            name="name" 
                            value={formData.name} 
                            onChange={e => handleInputChange('name', e.target.value)} 
                            readOnly={!isEditable} 
                            className="font-bold uppercase text-blue-700" 
                            required={true}
                        />
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <FormDateInput label="Ngày sinh" name="dob" value={formData.dob} onChange={handleDobChange} readOnly={!isEditable} required={true} />
                    </div>
                    <div className="col-span-1 md:col-span-1 flex gap-2">
                        <div className="w-16 md:w-20">
                            <FormInput label="Tuổi" name="age" value={formData.age} readOnly className="bg-slate-100 font-bold text-center" />
                        </div>
                        <div className="flex-1">
                            <FormSelect label="Giới tính" name="gender" value={formData.gender} onChange={e => handleInputChange('gender', e.target.value)} disabled={!isEditable} required={true}>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </FormSelect>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-1">
                        <FormInput label="CCCD/CMND" name="identityCard" value={formData.identityCard} onChange={handleIdentityInput} onBlur={handleIdentityBlur} readOnly={!isEditable} className="font-mono font-bold text-blue-700 uppercase" maxLength={12} required={true} />
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <FormDateInput label="Ngày cấp" name="identityIssueDate" value={formData.identityIssueDate} onChange={e => handleInputChange('identityIssueDate', e.target.value)} readOnly={!isEditable} />
                    </div>
                    <div className="col-span-1 md:col-span-1 relative z-20">
                        <Combobox<CatalogItem>
                            label="Quốc tịch"
                            value={String(formData.nationality || '')}
                            displayValue={item => item.name}
                            onChange={val => handleInputChange('nationality', val)}
                            options={nations}
                            columns={commonColumns}
                            disabled={!isEditable}
                            placeholder="Chọn..."
                            required={true}
                        />
                    </div>
                    <div className="col-span-1 md:col-span-1 relative z-20">
                        <Combobox<CatalogItem>
                            label="Dân tộc"
                            value={String(formData.ethnicity || '')}
                            displayValue={item => item.name}
                            onChange={val => handleInputChange('ethnicity', val)}
                            options={ethnicities}
                            columns={commonColumns}
                            disabled={!isEditable}
                            placeholder="Chọn..."
                        />
                    </div>
                    <div className="col-span-1 md:col-span-1 relative z-20">
                        <Combobox<CatalogItem>
                            label="Nghề nghiệp"
                            value={String(formData.occupation || '')}
                            displayValue={item => item.name}
                            onChange={val => handleInputChange('occupation', val)}
                            options={occupations}
                            columns={commonColumns}
                            disabled={!isEditable}
                            placeholder="Chọn..."
                        />
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <FormInput label="Điện thoại" name="phone" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} readOnly={!isEditable} className="font-bold text-slate-700" required={true} />
                    </div>

                    <div className="col-span-1 md:col-span-2 relative z-20">
                        <Combobox<CatalogItem>
                            label="Tỉnh / TP"
                            value={String(formData.provinceId || '')}
                            displayValue={item => item.name}
                            onChange={handleProvinceChange}
                            options={provinces}
                            columns={commonColumns}
                            disabled={!isEditable}
                            placeholder="Chọn Tỉnh/TP..."
                            required={true}
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2 relative z-20">
                        <Combobox<CatalogItem>
                            label="Phường/Xã"
                            value={String(formData.wardId || '')}
                            displayValue={item => item.name}
                            onChange={handleWardChange}
                            options={wards}
                            columns={commonColumns}
                            disabled={!isEditable}
                            placeholder="Chọn Xã/Phường..."
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <FormInput label="Địa chỉ chi tiết (Thôn/Xóm/Số nhà)" name="address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} readOnly={!isEditable} placeholder="Số nhà, đường..." />
                    </div>
                    <div className="col-span-1 md:col-span-2 relative z-10">
                        <Combobox<CatalogItem>
                            label="Nơi công tác"
                            value={formData.workplaceId}
                            onChange={(val, item) => {
                                handleInputChange('workplaceId', val);
                                if (item) handleInputChange('workplace', item.name);
                            }}
                            options={workplaces}
                            columns={commonColumns}
                            disabled={!isEditable}
                            placeholder="Chọn nơi công tác..."
                            displayValue={item => String(item.name || '')}
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <FormInput label="Người liên hệ (Bố/Mẹ/Người thân)" name="relativeInfo" value={formData.relativeInfo} onChange={e => handleInputChange('relativeInfo', e.target.value)} readOnly={!isEditable} />
                    </div>
                    <div className="col-span-1 md:col-span-1 relative z-10">
                        <Combobox<CatalogItem>
                            label="Quan hệ"
                            value={String(formData.relationship || '')}
                            displayValue={item => item.name}
                            onChange={val => handleInputChange('relationship', val)}
                            options={relationships}
                            columns={commonColumns}
                            disabled={!isEditable}
                            placeholder="Chọn..."
                        />
                    </div>
                    <div className="col-span-1 md:col-span-1">
                        <FormInput label="Số ĐT người liên hệ" name="relativePhone" value={formData.relativePhone} onChange={e => handleInputChange('relativePhone', e.target.value)} readOnly={!isEditable} className="font-mono" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdministrativeSection;
