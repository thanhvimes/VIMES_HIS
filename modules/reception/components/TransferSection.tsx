import React from 'react';
import { DocumentTextIcon, CloudUploadIcon } from '../../../components/Icons';
import { FormInput } from '../../../components/shared/forms';
import Combobox from '../../../components/shared/Combobox';
import { ExtendedFormData } from '../utils/registrationUtils';
import { CatalogItem } from '../../../services/catalogService';

interface TransferSectionProps {
    formData: ExtendedFormData;
    isEditable: boolean;
    handleInputChange: (name: string, value: any) => void;
    hospitals: CatalogItem[];
    hospitalColumns: any[];
    setFormData: (val: any) => void;
}

const TransferSection: React.FC<TransferSectionProps> = ({
    formData, isEditable, handleInputChange, hospitals, hospitalColumns, setFormData
}) => {
    return (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 space-y-4 ${isEditable && formData.isTransfer ? 'ring-2 ring-amber-100 dark:ring-amber-900/50 border-amber-200' : ''}`}>
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-2 mb-3">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 text-sm uppercase tracking-wider">
                    <DocumentTextIcon className="w-[18px] h-[18px] text-amber-600" /> Thông tin Chuyển tuyến
                </h3>
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                        type="checkbox"
                        checked={!!formData.isTransfer}
                        onChange={(e) => isEditable && setFormData((p: any) => ({ ...p, isTransfer: e.target.checked }))}
                        disabled={!isEditable}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                    />
                    <span className={`text-sm font-medium transition-colors ${formData.isTransfer ? 'text-amber-600' : 'text-slate-500 group-hover:text-slate-700'}`}>Có Giấy chuyển tuyến</span>
                </label>
            </div>

            {formData.isTransfer && (
                <div className="space-y-3 animate-fade-in">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Bệnh viện chuyển đến/đi</label>
                        <Combobox<CatalogItem>
                            value={formData.transferHospital}
                            onChange={(val, item) => {
                                setFormData((p: any) => ({ ...p, transferHospital: val, transferHospitalCode: item?.code }));
                            }}
                            options={hospitals}
                            columns={hospitalColumns}
                            disabled={!isEditable}
                            placeholder="Tìm bệnh viện..."
                            displayValue={item => String(item.name || '')}
                            className="h-9 text-xs"
                        />
                    </div>
                    <div>
                        <FormInput
                            label="Chẩn đoán nơi chuyển"
                            name="transferDiagnosis"
                            value={formData.transferDiagnosis}
                            onChange={(e) => handleInputChange('transferDiagnosis', e.target.value)}
                            readOnly={!isEditable}
                            placeholder="Chẩn đoán trên giấy..."
                            className="h-9 text-xs"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Đính kèm Giấy chuyển viện</label>
                        <div className={`mt-1 flex justify-center px-4 py-3 border-2 border-dashed rounded-lg transition-colors ${isEditable ? 'border-slate-300 hover:border-blue-400 bg-slate-50 cursor-pointer' : 'border-slate-200 bg-slate-100'}`}>
                            <div className="space-y-1 text-center">
                                <CloudUploadIcon className="mx-auto h-6 w-6 text-slate-400" />
                                <div className="text-[10px] text-slate-600">
                                    <label className="relative cursor-pointer font-bold text-blue-600 hover:text-blue-500">
                                        <span>Tải ảnh</span>
                                        <input type="file" className="sr-only" disabled={!isEditable} />
                                    </label>
                                    <p className="inline pl-1">hoặc kéo thả</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransferSection;
