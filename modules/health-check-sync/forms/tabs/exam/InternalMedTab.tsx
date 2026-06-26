import React from 'react';
import { useDynamicFormContext } from '../../DynamicFormContext';
import SpecialtyCard from './SpecialtyCard';

const InternalMedTab: React.FC = () => {
    const {
        formType,
        isChild,
        nhiTuanHoan, setNhiTuanHoan,
        nhiHoHap, setNhiHoHap,
        nhiTieuHoa, setNhiTieuHoa,
        nhiThanKinh, setNhiThanKinh,
        kqTamThan, setKqTamThan,
        kqThanKinh, setKqThanKinh,
        kqTimMach, setKqTimMach,
        kqHoHap, setKqHoHap,
        kqNoiTiet, setKqNoiTiet,
        noiKhoaTieuHoa, setNoiKhoaTieuHoa,
        kqCoXuongKhop, setKqCoXuongKhop,
        noiKhoaTuanHoanPl, setNoiKhoaTuanHoanPl,
        noiKhoaHoHapPl, setNoiKhoaHoHapPl,
        noiKhoaTieuHoaPl, setNoiKhoaTieuHoaPl,
        noiKhoaThanTietnieuPl, setNoiKhoaThanTietnieuPl,
        noiKhoaNoiTietPl, setNoiKhoaNoiTietPl,
        noiKhoaCoXuongKhopPl, setNoiKhoaCoXuongKhopPl,
        noiKhoaThanKinhPl, setNoiKhoaThanKinhPl,
        noiKhoaTamThanPl, setNoiKhoaTamThanPl,
        kqNoiTietChuyenHoa, setKqNoiTietChuyenHoa
    } = useDynamicFormContext();

    return (
        <SpecialtyCard specialtyKey="internal" title="Khám Nội Khoa">
            {isChild ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tuần hoàn</label>
                        <textarea value={nhiTuanHoan} onChange={e => setNhiTuanHoan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 h-20" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Hô hấp</label>
                        <textarea value={nhiHoHap} onChange={e => setNhiHoHap(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 h-20" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tiêu hóa</label>
                        <textarea value={nhiTieuHoa} onChange={e => setNhiTieuHoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 h-20" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Thần kinh / Tâm thần</label>
                        <textarea value={nhiThanKinh} onChange={e => setNhiThanKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 h-20" />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tim mạch</label>
                        <textarea value={kqTimMach} onChange={e => setKqTimMach(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        {formType === '2' && (
                            <select value={noiKhoaTuanHoanPl} onChange={e => setNoiKhoaTuanHoanPl(e.target.value)} className="w-full mt-1 p-2 border rounded text-xs">
                                <option value="1">Loại I</option><option value="2">Loại II</option><option value="3">Loại III</option><option value="4">Loại IV</option><option value="5">Loại V</option>
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Hô hấp</label>
                        <textarea value={kqHoHap} onChange={e => setKqHoHap(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        {formType === '2' && (
                            <select value={noiKhoaHoHapPl} onChange={e => setNoiKhoaHoHapPl(e.target.value)} className="w-full mt-1 p-2 border rounded text-xs">
                                <option value="1">Loại I</option><option value="2">Loại II</option><option value="3">Loại III</option><option value="4">Loại IV</option><option value="5">Loại V</option>
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tiêu hóa</label>
                        <textarea value={noiKhoaTieuHoa} onChange={e => setNoiKhoaTieuHoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        {formType === '2' && (
                            <select value={noiKhoaTieuHoaPl} onChange={e => setNoiKhoaTieuHoaPl(e.target.value)} className="w-full mt-1 p-2 border rounded text-xs">
                                <option value="1">Loại I</option><option value="2">Loại II</option><option value="3">Loại III</option><option value="4">Loại IV</option><option value="5">Loại V</option>
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nội tiết / Chuyển hóa</label>
                        <textarea value={kqNoiTiet || kqNoiTietChuyenHoa} onChange={e => { setKqNoiTiet(e.target.value); setKqNoiTietChuyenHoa(e.target.value); }} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        {formType === '2' && (
                            <select value={noiKhoaNoiTietPl} onChange={e => setNoiKhoaNoiTietPl(e.target.value)} className="w-full mt-1 p-2 border rounded text-xs">
                                <option value="1">Loại I</option><option value="2">Loại II</option><option value="3">Loại III</option><option value="4">Loại IV</option><option value="5">Loại V</option>
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Cơ xương khớp</label>
                        <textarea value={kqCoXuongKhop} onChange={e => setKqCoXuongKhop(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        {formType === '2' && (
                            <select value={noiKhoaCoXuongKhopPl} onChange={e => setNoiKhoaCoXuongKhopPl(e.target.value)} className="w-full mt-1 p-2 border rounded text-xs">
                                <option value="1">Loại I</option><option value="2">Loại II</option><option value="3">Loại III</option><option value="4">Loại IV</option><option value="5">Loại V</option>
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Thần kinh</label>
                        <textarea value={kqThanKinh} onChange={e => setKqThanKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        {formType === '2' && (
                            <select value={noiKhoaThanKinhPl} onChange={e => setNoiKhoaThanKinhPl(e.target.value)} className="w-full mt-1 p-2 border rounded text-xs">
                                <option value="1">Loại I</option><option value="2">Loại II</option><option value="3">Loại III</option><option value="4">Loại IV</option><option value="5">Loại V</option>
                            </select>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tâm thần</label>
                        <textarea value={kqTamThan} onChange={e => setKqTamThan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        {formType === '2' && (
                            <select value={noiKhoaTamThanPl} onChange={e => setNoiKhoaTamThanPl(e.target.value)} className="w-full mt-1 p-2 border rounded text-xs">
                                <option value="1">Loại I</option><option value="2">Loại II</option><option value="3">Loại III</option><option value="4">Loại IV</option><option value="5">Loại V</option>
                            </select>
                        )}
                    </div>
                </div>
            )}
        </SpecialtyCard>
    );
};

export default InternalMedTab;
