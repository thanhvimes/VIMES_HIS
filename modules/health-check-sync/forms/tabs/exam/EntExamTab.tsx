import React from 'react';
import { useDynamicFormContext } from '../../DynamicFormContext';
import SpecialtyCard from './SpecialtyCard';

const EntExamTab: React.FC = () => {
    const {
        formType,
        entExam, setEntExam,
        khamTaiMuiHongPl, setKhamTaiMuiHongPl,
        taiPhaiNoiThuong, setTaiPhaiNoiThuong,
        taiPhaiNoiTham, setTaiPhaiNoiTham,
        taiTraiNoiThuong, setTaiTraiNoiThuong,
        taiTraiNoiTham, setTaiTraiNoiTham,
        khamTaiMuiHongM5, setKhamTaiMuiHongM5,
        kqTaiMuiHong, setKqTaiMuiHong,
        isLocked,
        handleAutofillTab,
    } = useDynamicFormContext();

    return (
        <SpecialtyCard specialtyKey="ent" title="Khám Tai Mũi Họng">
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
                        <label className="block text-xs font-bold text-slate-500 mb-1">Mô tả khám tai mũi họng &amp; màng nhĩ</label>
                        <textarea value={entExam || kqTaiMuiHong} onChange={e => { setEntExam(e.target.value); setKqTaiMuiHong(e.target.value); }} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 h-20" />
                    </div>
                    {formType === '2' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại Tai - Mũi - Họng</label>
                            <select value={khamTaiMuiHongPl} onChange={e => setKhamTaiMuiHongPl(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white dark:bg-slate-700">
                                <option value="">-- Phân loại --</option>
                                <option value="1">Loại I</option>
                                <option value="2">Loại II</option>
                                <option value="3">Loại III</option>
                                <option value="4">Loại IV</option>
                                <option value="5">Loại V</option>
                            </select>
                        </div>
                    )}
                    {formType === '5' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Tai Mũi Họng (Mẫu 5)</label>
                            <textarea value={khamTaiMuiHongM5} onChange={e => setKhamTaiMuiHongM5(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 h-16" />
                        </div>
                    )}
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 block">Thính lực đo khoảng cách (m):</span>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 border-r border-slate-200 pr-2">
                            <span className="text-[10px] font-extrabold text-teal-600 block text-center uppercase">Tai phải (AD)</span>
                            <div>
                                <label className="block text-[10px] text-slate-400">Nói thường (m)</label>
                                <input type="text" value={taiPhaiNoiThuong} onChange={e => setTaiPhaiNoiThuong(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-xs text-center font-bold" placeholder="5" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400">Nói thầm (m)</label>
                                <input type="text" value={taiPhaiNoiTham} onChange={e => setTaiPhaiNoiTham(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-xs text-center font-bold" placeholder="0.5" />
                            </div>
                        </div>

                        <div className="space-y-2 pl-2">
                            <span className="text-[10px] font-extrabold text-teal-600 block text-center uppercase">Tai trái (AS)</span>
                            <div>
                                <label className="block text-[10px] text-slate-400">Nói thường (m)</label>
                                <input type="text" value={taiTraiNoiThuong} onChange={e => setTaiTraiNoiThuong(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-xs text-center font-bold" placeholder="5" />
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400">Nói thầm (m)</label>
                                <input type="text" value={taiTraiNoiTham} onChange={e => setTaiTraiNoiTham(e.target.value)} className="w-full p-2 border border-slate-300 rounded-lg text-xs text-center font-bold" placeholder="0.5" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </fieldset>
        </SpecialtyCard>
    );
};

export default EntExamTab;
