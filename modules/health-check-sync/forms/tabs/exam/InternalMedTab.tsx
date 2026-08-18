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
        nhiTietNieu, setNhiTietNieu,
        nhiTamThan, setNhiTamThan,
        nhiKhac, setNhiKhac,
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
        kqNoiTietChuyenHoa, setKqNoiTietChuyenHoa,
        kqTietNieu, setKqTietNieu,
        nhiKhoaLamSangKhac, setNhiKhoaLamSangKhac,
        isLocked,
        handleAutofillTab,
    } = useDynamicFormContext();

    return (
        <SpecialtyCard specialtyKey="internal" title="Khám Nội Khoa">
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
             {(isChild || formType === '1') ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <label className="block text-xs font-bold text-slate-500 mb-1">Thận - Tiết niệu</label>
                        <textarea value={nhiTietNieu} onChange={e => setNhiTietNieu(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 h-20" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Thần kinh</label>
                        <textarea value={nhiThanKinh} onChange={e => setNhiThanKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 h-20" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tâm thần</label>
                        <textarea value={nhiTamThan} onChange={e => setNhiTamThan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 h-20" />
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Khám lâm sàng khác</label>
                        <textarea value={nhiKhac} onChange={e => setNhiKhac(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 h-20" />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tim mạch</label>
                        <textarea value={kqTimMach} onChange={e => setKqTimMach(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        <select value={noiKhoaTuanHoanPl} onChange={e => setNoiKhoaTuanHoanPl(e.target.value)} className="w-full mt-1.5 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium">
                            <option value="">-- Phân loại Tuần hoàn --</option>
                            <option value="1">Loại I (Rất khỏe)</option>
                            <option value="2">Loại II (Khỏe)</option>
                            <option value="3">Loại III (Trung bình)</option>
                            <option value="4">Loại IV (Yếu)</option>
                            <option value="5">Loại V (Rất yếu)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Hô hấp</label>
                        <textarea value={kqHoHap} onChange={e => setKqHoHap(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        <select value={noiKhoaHoHapPl} onChange={e => setNoiKhoaHoHapPl(e.target.value)} className="w-full mt-1.5 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium">
                            <option value="">-- Phân loại Hô hấp --</option>
                            <option value="1">Loại I (Rất khỏe)</option>
                            <option value="2">Loại II (Khỏe)</option>
                            <option value="3">Loại III (Trung bình)</option>
                            <option value="4">Loại IV (Yếu)</option>
                            <option value="5">Loại V (Rất yếu)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tiêu hóa</label>
                        <textarea value={noiKhoaTieuHoa} onChange={e => setNoiKhoaTieuHoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        <select value={noiKhoaTieuHoaPl} onChange={e => setNoiKhoaTieuHoaPl(e.target.value)} className="w-full mt-1.5 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium">
                            <option value="">-- Phân loại Tiêu hóa --</option>
                            <option value="1">Loại I (Rất khỏe)</option>
                            <option value="2">Loại II (Khỏe)</option>
                            <option value="3">Loại III (Trung bình)</option>
                            <option value="4">Loại IV (Yếu)</option>
                            <option value="5">Loại V (Rất yếu)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Thận - Tiết niệu</label>
                        <textarea value={kqTietNieu} onChange={e => setKqTietNieu(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        <select value={noiKhoaThanTietnieuPl} onChange={e => setNoiKhoaThanTietnieuPl(e.target.value)} className="w-full mt-1.5 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium">
                            <option value="">-- Phân loại Thận - Tiết niệu --</option>
                            <option value="1">Loại I (Rất khỏe)</option>
                            <option value="2">Loại II (Khỏe)</option>
                            <option value="3">Loại III (Trung bình)</option>
                            <option value="4">Loại IV (Yếu)</option>
                            <option value="5">Loại V (Rất yếu)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nội tiết / Chuyển hóa</label>
                        <textarea value={kqNoiTiet || kqNoiTietChuyenHoa} onChange={e => { setKqNoiTiet(e.target.value); setKqNoiTietChuyenHoa(e.target.value); }} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        <select value={noiKhoaNoiTietPl} onChange={e => setNoiKhoaNoiTietPl(e.target.value)} className="w-full mt-1.5 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium">
                            <option value="">-- Phân loại Nội tiết --</option>
                            <option value="1">Loại I (Rất khỏe)</option>
                            <option value="2">Loại II (Khỏe)</option>
                            <option value="3">Loại III (Trung bình)</option>
                            <option value="4">Loại IV (Yếu)</option>
                            <option value="5">Loại V (Rất yếu)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Cơ xương khớp</label>
                        <textarea value={kqCoXuongKhop} onChange={e => setKqCoXuongKhop(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        <select value={noiKhoaCoXuongKhopPl} onChange={e => setNoiKhoaCoXuongKhopPl(e.target.value)} className="w-full mt-1.5 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium">
                            <option value="">-- Phân loại Cơ xương khớp --</option>
                            <option value="1">Loại I (Rất khỏe)</option>
                            <option value="2">Loại II (Khỏe)</option>
                            <option value="3">Loại III (Trung bình)</option>
                            <option value="4">Loại IV (Yếu)</option>
                            <option value="5">Loại V (Rất yếu)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Thần kinh</label>
                        <textarea value={kqThanKinh} onChange={e => setKqThanKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        <select value={noiKhoaThanKinhPl} onChange={e => setNoiKhoaThanKinhPl(e.target.value)} className="w-full mt-1.5 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium">
                            <option value="">-- Phân loại Thần kinh --</option>
                            <option value="1">Loại I (Rất khỏe)</option>
                            <option value="2">Loại II (Khỏe)</option>
                            <option value="3">Loại III (Trung bình)</option>
                            <option value="4">Loại IV (Yếu)</option>
                            <option value="5">Loại V (Rất yếu)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tâm thần</label>
                        <textarea value={kqTamThan} onChange={e => setKqTamThan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16" />
                        <select value={noiKhoaTamThanPl} onChange={e => setNoiKhoaTamThanPl(e.target.value)} className="w-full mt-1.5 p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-medium">
                            <option value="">-- Phân loại Tâm thần --</option>
                            <option value="1">Loại I (Rất khỏe)</option>
                            <option value="2">Loại II (Khỏe)</option>
                            <option value="3">Loại III (Trung bình)</option>
                            <option value="4">Loại IV (Yếu)</option>
                            <option value="5">Loại V (Rất yếu)</option>
                        </select>
                    </div>
                    {formType === '2' && (
                        <div className="md:col-span-2 lg:col-span-3">
                            <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                                <span>Khám lâm sàng khác</span>
                                <span className="text-[10px] text-teal-600 dark:text-emerald-400 font-bold">* Chuẩn QĐ 2062 / QĐ 1551 (NHI_KHOA_LAM_SANG_KHAC)</span>
                            </label>
                            <textarea
                                value={nhiKhoaLamSangKhac || nhiKhac}
                                onChange={e => {
                                    setNhiKhoaLamSangKhac(e.target.value);
                                    setNhiKhac(e.target.value);
                                }}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs h-16"
                                placeholder="Ghi nhận các kết quả khám lâm sàng khác cho học sinh 6-18 tuổi..."
                            />
                        </div>
                    )}
                </div>
            )}
            </fieldset>
        </SpecialtyCard>
    );
};

export default InternalMedTab;
