import React from 'react';
import { useDynamicFormContext } from '../../DynamicFormContext';
import SpecialtyCard from './SpecialtyCard';

const DermatologyTab: React.FC = () => {
    const {
        formType,
        kqDaLieu, setKqDaLieu,
        khamDaLieuPl, setKhamDaLieuPl,
    } = useDynamicFormContext();

    return (
        <SpecialtyCard specialtyKey="dermatology" title="Khám Da Liễu">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Kết quả Da liễu</label>
                    <textarea value={kqDaLieu} onChange={e => setKqDaLieu(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 h-24" />
                </div>
                {formType === '2' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại</label>
                        <select value={khamDaLieuPl} onChange={e => setKhamDaLieuPl(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white dark:bg-slate-700">
                            <option value="1">Loại I</option>
                            <option value="2">Loại II</option>
                            <option value="3">Loại III</option>
                            <option value="4">Loại IV</option>
                            <option value="5">Loại V</option>
                        </select>
                    </div>
                )}
            </div>
        </SpecialtyCard>
    );
};

export default DermatologyTab;
