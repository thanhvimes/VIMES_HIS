import React from 'react';
import { useDynamicFormContext } from '../../DynamicFormContext';
import SpecialtyCard from './SpecialtyCard';

const DentalExamTab: React.FC = () => {
    const {
        formType,
        dentalExam, setDentalExam,
        khamRangHamMatPl, setKhamRangHamMatPl,
        hamTren, setHamTren,
        hamDuoi, setHamDuoi
    } = useDynamicFormContext();

    return (
        <SpecialtyCard specialtyKey="dental" title="Khám Răng Hàm Mặt">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Mô tả tình trạng răng, niêm mạc miệng, khớp cắn</label>
                        <textarea value={dentalExam} onChange={e => setDentalExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 h-20" />
                    </div>
                    {formType === '2' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại Răng - Hàm - Mặt</label>
                            <select value={khamRangHamMatPl} onChange={e => setKhamRangHamMatPl(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white dark:bg-slate-700">
                                <option value="1">Loại I</option>
                                <option value="2">Loại II</option>
                                <option value="3">Loại III</option>
                                <option value="4">Loại IV</option>
                                <option value="5">Loại V</option>
                            </select>
                        </div>
                    )}
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
        </SpecialtyCard>
    );
};

export default DentalExamTab;
