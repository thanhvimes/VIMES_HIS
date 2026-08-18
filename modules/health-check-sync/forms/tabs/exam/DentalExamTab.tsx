import React from 'react';
import { useDynamicFormContext } from '../../DynamicFormContext';
import SpecialtyCard from './SpecialtyCard';

const DentalExamTab: React.FC = () => {
    const {
        formType,
        dentalExam, setDentalExam,
        khamRangHamMatPl, setKhamRangHamMatPl,
        hamTren, setHamTren,
        hamDuoi, setHamDuoi,
        isLocked,
        handleAutofillTab,
    } = useDynamicFormContext();

    return (
        <SpecialtyCard specialtyKey="dental" title="Khám Răng Hàm Mặt">
            {!isLocked && (
                <div className="flex justify-end mb-4">
                    <button
                        type="button"
                        onClick={() => handleAutofillTab('exam')}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-[#0f766e] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-sm hover:shadow active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        Điền nhanh kết quả mặc định
                    </button>
                </div>
            )}
            <fieldset disabled={isLocked} className="space-y-4 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Mô tả tình trạng răng, niêm mạc miệng, khớp cắn</label>
                        <textarea value={dentalExam} onChange={e => setDentalExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 h-20" />
                    </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại Răng - Hàm - Mặt</label>
                            <select value={khamRangHamMatPl} onChange={e => setKhamRangHamMatPl(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium">
                                <option value="">-- Phân loại --</option>
                                <option value="1">Loại I (Rất khỏe)</option>
                                <option value="2">Loại II (Khỏe)</option>
                                <option value="3">Loại III (Trung bình)</option>
                                <option value="4">Loại IV (Yếu)</option>
                                <option value="5">Loại V (Rất yếu)</option>
                            </select>
                        </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 justify-center flex flex-col">
                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 block">Đặc điểm xương hàm:</span>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold text-slate-400 w-16">Hàm trên</label>
                            <input type="text" value={hamTren} onChange={e => setHamTren(e.target.value)} className="flex-1 p-2 border border-slate-300 rounded-lg text-xs font-bold" placeholder="Bình thường" />
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-[10px] font-bold text-slate-400 w-16">Hàm dưới</label>
                            <input type="text" value={hamDuoi} onChange={e => setHamDuoi(e.target.value)} className="flex-1 p-2 border border-slate-300 rounded-lg text-xs font-bold" placeholder="Bình thường" />
                        </div>
                    </div>
                </div>
            </div>
            </fieldset>
        </SpecialtyCard>
    );
};

export default DentalExamTab;
