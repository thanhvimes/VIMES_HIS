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
    } = useDynamicFormContext();

    return (
        <SpecialtyCard specialtyKey="ent" title="Khám Tai Mũi Họng">
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
        </SpecialtyCard>
    );
};

export default EntExamTab;
