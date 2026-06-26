
import React, { useState, useEffect } from 'react';
import { VitalSigns } from '../../../../../types';
import VitalSignsForm from '../../components/VitalSignsForm';

interface VitalSignsModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialVitals?: VitalSigns;
    onSave: (vitals: VitalSigns) => void;
}

const VitalSignsModal: React.FC<VitalSignsModalProps> = ({ isOpen, onClose, initialVitals, onSave }) => {
    const [vitals, setVitals] = useState<VitalSigns>(initialVitals || {});

    useEffect(() => {
        if (isOpen) {
            setVitals(initialVitals || {});
        }
    }, [isOpen, initialVitals]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden animate-slide-up">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Cập nhật chỉ số sinh tồn</h3>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="p-6">
                    <VitalSignsForm vitals={vitals} onVitalsChange={setVitals} />
                    
                    <div className="mt-8 flex justify-end gap-3">
                        <button 
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all uppercase text-xs tracking-widest"
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={() => {
                                onSave(vitals);
                                onClose();
                            }}
                            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-600/20 transition-all transform active:scale-95 uppercase text-xs tracking-widest"
                        >
                            Xác nhận lưu
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VitalSignsModal;
