import React from 'react';
import { useDynamicFormContext } from '../../DynamicFormContext';
import SpecialtyCard from './SpecialtyCard';

const GynecologyTab: React.FC = () => {
    const {
        formType,
        kqSinhDuc, setKqSinhDuc,
        khamSanPhuKhoaPl, setKhamSanPhuKhoaPl,
        isLocked,
        handleAutofillTab,
    } = useDynamicFormContext();

    return (
        <SpecialtyCard specialtyKey="gynecology" title="Khám Sản Phụ Khoa">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Kết quả Sản Phụ Khoa</label>
                    <textarea value={kqSinhDuc} onChange={e => setKqSinhDuc(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 h-24" />
                </div>
                {formType === '2' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại</label>
                        <select value={khamSanPhuKhoaPl} onChange={e => setKhamSanPhuKhoaPl(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white dark:bg-slate-700">
                            <option value="">-- Phân loại --</option>
                            <option value="1">Loại I</option>
                            <option value="2">Loại II</option>
                            <option value="3">Loại III</option>
                            <option value="4">Loại IV</option>
                            <option value="5">Loại V</option>
                        </select>
                    </div>
                )}
            </div>
            </fieldset>
        </SpecialtyCard>
    );
};

export default GynecologyTab;
