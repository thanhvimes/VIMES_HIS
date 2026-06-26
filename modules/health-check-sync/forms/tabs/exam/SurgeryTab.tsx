import React from 'react';
import { useDynamicFormContext } from '../../DynamicFormContext';
import SpecialtyCard from './SpecialtyCard';

const SurgeryTab: React.FC = () => {
    const {
        formType,
        kqNgoaiKhoa, setKqNgoaiKhoa,
        khamNgoaiKhoaPl, setKhamNgoaiKhoaPl,
        maBenhNgoaiKhoa, setMaBenhNgoaiKhoa,
    } = useDynamicFormContext();

    return (
        <SpecialtyCard specialtyKey="surgery" title="Khám Ngoại Khoa">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Kết quả Ngoại khoa</label>
                    <textarea value={kqNgoaiKhoa} onChange={e => setKqNgoaiKhoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 h-24" />
                </div>
                {formType === '2' && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại</label>
                        <select value={khamNgoaiKhoaPl} onChange={e => setKhamNgoaiKhoaPl(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white dark:bg-slate-700">
                            <option value="1">Loại I</option>
                            <option value="2">Loại II</option>
                            <option value="3">Loại III</option>
                            <option value="4">Loại IV</option>
                            <option value="5">Loại V</option>
                        </select>
                    </div>
                )}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Mã bệnh (nếu có)</label>
                    <input type="text" value={maBenhNgoaiKhoa} onChange={e => setMaBenhNgoaiKhoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700" placeholder="Mã ICD-10" />
                </div>
            </div>
        </SpecialtyCard>
    );
};

export default SurgeryTab;
