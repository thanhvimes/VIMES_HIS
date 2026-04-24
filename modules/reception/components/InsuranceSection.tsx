import React from 'react';
import { CreditCardIcon } from '../../../components/Icons';
import { FormDateInput } from '../../../components/shared/forms';
import Combobox from '../../../components/shared/Combobox';
import { ExtendedFormData, getBenefitRate } from '../utils/registrationUtils';
import { CatalogItem } from '../../../services/catalogService';

interface InsuranceSectionProps {
    formData: ExtendedFormData;
    isEditable: boolean;
    handleInputChange: (name: string, value: any) => void;
    handleInsurancePlaceChange: (val: string, item?: CatalogItem) => void;
    handleInsuranceAreaChange: (val: string) => void;
    hospitals: CatalogItem[];
    hospitalColumns: any[];
    areaOptions: CatalogItem[];
    insRouteTypes: CatalogItem[];
    setFormData: (val: any) => void;
    handleCheckIn: () => void;
    handleUpdate: () => void;
    isSaving: boolean;
    checkInResponse?: any;
    onCloseResponse?: () => void;
}

const InsuranceSection: React.FC<InsuranceSectionProps> = ({
    formData, isEditable, handleInputChange, handleInsurancePlaceChange, handleInsuranceAreaChange,
    hospitals, hospitalColumns, areaOptions, insRouteTypes, setFormData, handleCheckIn, handleUpdate, isSaving,
    checkInResponse, onCloseResponse
}) => {
    return (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 ${isEditable ? 'ring-2 ring-blue-100 dark:ring-blue-900/50' : ''}`}>
            {/* Header matches AdministrativeSection style */}
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <CreditCardIcon className="w-[18px] h-[18px] text-blue-600" /> Thông tin thẻ BHYT
                </h3>
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">Còn hiệu lực</span>
            </div>

            <div className="space-y-3">
                <div className="space-y-0.5">
                    <label className="enterprise-label !mb-1">Số thẻ BHYT</label>
                    <input
                        className="enterprise-input font-mono font-bold text-blue-700 !h-8"
                        autoComplete="off"
                        placeholder="VD: GD4704721473859"
                        value={formData.insuranceNumber}
                        readOnly={!isEditable}
                        onChange={e => handleInputChange('insuranceNumber', e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-5 gap-2">
                    <div className="col-span-1">
                        <label className="enterprise-label !mb-1">Mã</label>
                        <input className="enterprise-input bg-slate-50 dark:bg-slate-900 text-slate-500 !h-8 font-bold text-center !p-0" value={formData.insuranceRegCode} readOnly />
                    </div>
                    <div className="col-span-1">
                        <label className="enterprise-label !mb-1 text-center">%</label>
                        <div className="w-full text-[13px] border border-slate-200 dark:border-slate-600 bg-blue-50 dark:bg-blue-900/40 rounded-md h-8 font-bold flex items-center justify-center text-blue-700 dark:text-blue-300">
                             {formData.insuranceNumber ? (getBenefitRate(formData.benefitCode || formData.insuranceNumber.charAt(2)) + '%') : '--'}
                         </div>
                    </div>
                    <div className="col-span-3">
                        <label className="enterprise-label !mb-1">Khu vực</label>
                        <Combobox<CatalogItem>
                            value={formData.insuranceArea}
                            onChange={handleInsuranceAreaChange}
                            options={areaOptions}
                            disabled={!isEditable}
                            placeholder="Chọn KV..."
                            className="h-8"
                            displayValue={item => String(item.code || '')}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1 text-[13px]">Ngày cấp</label>
                        <FormDateInput value={formData.insuranceRegDate} readOnly={!isEditable} onChange={e => handleInputChange('insuranceRegDate', e.target.value)} />
                    </div>
                    <div>
                        <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1 text-[13px]">Ngày hết hạn</label>
                        <FormDateInput value={formData.insuranceExp} readOnly={!isEditable} onChange={e => handleInputChange('insuranceExp', e.target.value)} />
                    </div>
                </div>

                <div className="space-y-0.5">
                    <label className="enterprise-label !mb-1">Nơi đăng ký KCB Ban đầu</label>
                    <div className="flex gap-1.5">
                        <input className="enterprise-input bg-slate-50 dark:bg-slate-900 !h-8 !w-16 font-bold text-blue-700 dark:text-blue-300 text-center !p-0" value={formData.insuranceRegCode || ''} readOnly />
                        <div className="flex-1">
                            <Combobox<CatalogItem>
                                value={formData.insurancePlace}
                                onChange={handleInsurancePlaceChange}
                                options={hospitals}
                                columns={hospitalColumns}
                                disabled={!isEditable}
                                placeholder="Chọn nơi KCB..."
                                className="h-8"
                                displayValue={item => String(item.name || '')}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-0.5">
                    <label className="enterprise-label !mb-1">Nơi làm việc</label>
                    <input className="enterprise-input !h-8" value={formData.workplace} readOnly={!isEditable} onChange={e => handleInputChange('workplace', e.target.value)} placeholder="Tên cơ quan/đơn vị..." />
                </div>

                {/* Tuyến: more compact */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block font-medium text-slate-500 mb-1 text-[12px] uppercase">Tuyến khám:</label>
                        <div className="flex gap-2">
                            {['Đúng tuyến', 'Trái tuyến', 'Cấp cứu', 'Lĩnh thuốc'].map((r: any) => (
                                <label key={r} className={`flex items-center gap-1.5 text-[11px] font-bold cursor-pointer transition-colors ${formData.route === r ? (r === 'Cấp cứu' ? 'text-red-500' : 'text-blue-600') : 'text-slate-400'}`}>
                                    <input type="radio" checked={formData.route === r} onChange={() => isEditable && setFormData((p: any) => ({ ...p, route: r }))} disabled={!isEditable} className="w-3.5 h-3.5" />
                                    <span>{r.split(' ')[0]}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-0.5">
                        <label className="enterprise-label !mb-1 text-slate-600">Đối tượng KCB</label>
                        <Combobox<CatalogItem>
                            value={formData.insuranceRouteType}
                            onChange={(val) => setFormData((p: any) => ({ ...p, insuranceRouteType: val }))}
                            options={insRouteTypes.filter(type => {
                                const code = String(type.code || '');
                                if (formData.route === 'Đúng tuyến') return code.startsWith('1');
                                if (formData.route === 'Trái tuyến') return code.startsWith('3');
                                if (formData.route === 'Cấp cứu') return code.startsWith('2');
                                if (formData.route === 'Lĩnh thuốc') return code.startsWith('7');
                                return true;
                            })}
                            columns={[
                                { key: 'code', label: 'Mã', width: '25%' },
                                { key: 'name', label: 'Tên đối tượng', width: '75%' }
                            ]}
                            disabled={!isEditable}
                            placeholder="Đối tượng..."
                            className="h-8"
                            displayValue={item => String(item.name || '')}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={!!formData.insurance5Year} disabled={!isEditable} className="w-4 h-4 rounded text-blue-600" />
                        <div className="flex flex-col flex-1">
                            <span className="block font-medium text-slate-600 dark:text-slate-400 mb-0.5 text-[12px] uppercase">Đủ 5 năm</span>
                            <FormDateInput value={formData.insurance5Year} readOnly={!isEditable} onChange={e => handleInputChange('insurance5Year', e.target.value)} />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={!!formData.insuranceExempt} disabled={!isEditable} className="w-4 h-4 rounded text-blue-600" />
                        <div className="flex flex-col flex-1">
                            <span className="block font-medium text-slate-600 dark:text-slate-400 mb-0.5 text-[12px] uppercase">Miễn CTT</span>
                            <FormDateInput value={formData.insuranceExempt} readOnly={!isEditable} onChange={e => handleInputChange('insuranceExempt', e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100">
                <button 
                  onClick={handleCheckIn} 
                  disabled={!isEditable || isSaving} 
                  className={`bg-blue-600 hover:bg-blue-700 text-white h-8 rounded-md text-[12px] font-bold shadow-md transition-all flex items-center justify-center gap-2 ${isSaving ? 'opacity-70' : ''}`}
                >
                    {isSaving ? '...' : 'Check-In Portal'}
                </button>
                <button 
                  onClick={handleUpdate}
                  disabled={!isEditable || isSaving} 
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 h-8 rounded-md text-[12px] font-bold shadow-sm transition-all active:scale-95"
                >
                    Cập nhật
                </button>
            </div>
        </div>
    );
};

export default InsuranceSection;
