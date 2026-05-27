
import React, { useState, useEffect } from 'react';
import { XIcon, CheckIcon, PlusIcon } from '../../../../../components/Icons';
import Combobox, { ComboboxColumn } from '../../../../../components/ui/Combobox';
import { CatalogItem, diagnosisOptions } from '../../../data/catalogs';
import { ICD10 } from '../../../../../types';

interface SubDiagnosisModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialDiseases: ICD10[];
    onSave: (diseases: ICD10[]) => void;
}

const SubDiagnosisModal: React.FC<SubDiagnosisModalProps> = ({ isOpen, onClose, initialDiseases, onSave }) => {
    // 7 slots for diagnoses
    const [diseases, setDiseases] = useState<(ICD10 | null)[]>(Array(7).fill(null));

    useEffect(() => {
        if (isOpen) {
            const filled = [...initialDiseases];
            const padded = Array(7).fill(null).map((_, i) => filled[i] || null);
            setDiseases(padded);
        }
    }, [isOpen, initialDiseases]);

    const handleSelect = (index: number) => (value: string, item?: CatalogItem) => {
        const newDiseases = [...diseases];
        if (item) {
            newDiseases[index] = { code: item.code, name: item.name };
        } else if (!value) {
             newDiseases[index] = null;
        }
        setDiseases(newDiseases);
    };
    
    const handleConfirm = () => {
        const validDiseases = diseases.filter((d): d is ICD10 => d !== null);
        onSave(validDiseases);
        onClose();
    };

    const clearRow = (index: number) => {
        const newDiseases = [...diseases];
        newDiseases[index] = null;
        setDiseases(newDiseases);
    };

    const icdColumns: ComboboxColumn<CatalogItem>[] = [
        { key: 'code', label: 'Mã ICD', width: '20%', className: 'font-mono font-bold text-blue-600' },
        { key: 'name', label: 'Tên bệnh', width: '80%' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase flex items-center gap-2">
                        <PlusIcon className="w-5 h-5 text-blue-600"/>
                        Nhập Bệnh Kèm Theo (ICD10)
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto max-h-[70vh] bg-white dark:bg-slate-800 space-y-3">
                    {diseases.map((disease, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-400 w-6 text-center">{index + 1}.</span>
                            <div className="flex-1">
                                <Combobox<CatalogItem>
                                    placeholder={`Nhập chẩn đoán phụ ${index + 1}...`}
                                    options={diagnosisOptions}
                                    value={disease ? `${disease.code} - ${disease.name}` : ''}
                                    onChange={handleSelect(index)}
                                    columns={icdColumns}
                                    displayValue={(item) => `${item.code} - ${item.name}`}
                                />
                            </div>
                            <button 
                                onClick={() => clearRow(index)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                title="Xóa dòng"
                            >
                                <XIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                        Đóng
                    </button>
                    <button onClick={handleConfirm} className="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg flex items-center gap-2 transition">
                        <CheckIcon className="w-4 h-4"/> Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SubDiagnosisModal;
