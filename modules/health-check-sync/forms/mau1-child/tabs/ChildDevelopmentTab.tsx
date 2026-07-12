import React from 'react';
import { useChildFormContext } from '../ChildFormContext';
import SpecialtyCard from '../../tabs/exam/SpecialtyCard';

const ChildDevelopmentTab: React.FC = () => {
    const {
        isLocked,
        specialtyMetadata,
        height, setHeight,
        weight, setWeight,
        vongDau, setVongDau,
        chieuDaiTuoiSd, setChieuDaiTuoiSd,
        canNangTuoiSd, setCanNangTuoiSd,
        dgVongDau, setDgVongDau,
        chuViVongCanhTay, setChuViVongCanhTay,
        phuDinhDuong, setPhuDinhDuong,
        thieuMau, setThieuMau,
        coiXuong, setCoiXuong,
        suyDinhDuong, setSuyDinhDuong,
        thuaCanBeoPhi, setThuaCanBeoPhi,
        ptTinhThanBinhThuong, setPtTinhThanBinhThuong,
        ptVanDongBinhThuong, setPtVanDongBinhThuong,
        nguyCoTuKy, setNguyCoTuKy,
        tiemChungLao, setTiemChungLao,
        tiemChungVgbMui1, setTiemChungVgbMui1,
        tiemChungDayDu, setTiemChungDayDu,
    } = useChildFormContext();

    const devMetadata = specialtyMetadata?.child_development || { status: 'CHUA_KHAM' };
    const isTabLocked = isLocked || (devMetadata.status !== 'ĐANG_KHÁM' && devMetadata.status !== 'ĐÃ_KHÁM');

    return (
        <div className="space-y-6 animate-in fade-in">
            <SpecialtyCard specialtyKey="child_development" title="III. Dinh dưỡng & Phát triển">
                <fieldset disabled={isTabLocked} className="space-y-6 border-0 p-0 m-0">
            {/* 1. ĐÁNH GIÁ DINH DƯỠNG */}
            <div className="p-5 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-5 shadow-sm">
                <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 pb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0f766e] text-white text-xs">1</span>
                    Đánh giá dinh dưỡng
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {/* Chiều dài */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Chiều dài / Chiều cao (cm)</label>
                            <input
                                type="text"
                                value={height}
                                onChange={e => setHeight(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                                placeholder="Nhập chiều dài (cm)"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Chiều dài / Tuổi (SD)</label>
                            <input
                                type="text"
                                value={chieuDaiTuoiSd}
                                onChange={e => setChieuDaiTuoiSd(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                placeholder="VD: -2SD, +1SD..."
                            />
                        </div>
                    </div>

                    {/* Cân nặng */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Cân nặng (kg)</label>
                            <input
                                type="text"
                                value={weight}
                                onChange={e => setWeight(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                                placeholder="Nhập cân nặng (kg)"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Cân nặng / Tuổi (SD)</label>
                            <input
                                type="text"
                                value={canNangTuoiSd}
                                onChange={e => setCanNangTuoiSd(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                placeholder="VD: -1SD, 0SD..."
                            />
                        </div>
                    </div>

                    {/* Vòng đầu */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Vòng đầu (cm)</label>
                            <input
                                type="text"
                                value={vongDau}
                                onChange={e => setVongDau(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                                placeholder="Nhập vòng đầu (cm)"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Đánh giá vòng đầu</label>
                            <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg w-fit">
                                {[
                                    { label: "Bình thường", value: "1" },
                                    { label: "Đầu to", value: "2" },
                                    { label: "Đầu nhỏ", value: "3" }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        disabled={isTabLocked}
                                        onClick={() => setDgVongDau(opt.value)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                            dgVongDau === opt.value
                                                ? 'bg-[#0f766e] text-white shadow-sm'
                                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Chu vi vòng cánh tay */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Chu vi vòng cánh tay (mm)</label>
                        <input
                            type="text"
                            value={chuViVongCanhTay}
                            onChange={e => setChuViVongCanhTay(e.target.value)}
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                            placeholder="Nhập chu vi vòng cánh tay (mm)"
                        />
                    </div>
                </div>

                {/* Các dấu hiệu dinh dưỡng */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <span className="block text-xs font-bold text-slate-500 mb-3">Dấu hiệu dinh dưỡng</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            { label: "Phù dinh dưỡng", val: phuDinhDuong, setVal: setPhuDinhDuong },
                            { label: "Dấu hiệu thiếu máu", val: thieuMau, setVal: setThieuMau },
                            { label: "Dấu hiệu còi xương", val: coiXuong, setVal: setCoiXuong },
                            { label: "Suy dinh dưỡng", val: suyDinhDuong, setVal: setSuyDinhDuong },
                            { label: "Thừa cân / béo phì", val: thuaCanBeoPhi, setVal: setThuaCanBeoPhi }
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                                <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg w-fit">
                                    <button
                                        type="button"
                                        disabled={isTabLocked}
                                        onClick={() => item.setVal('0')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                            item.val !== '1'
                                                ? 'bg-rose-600 text-white shadow-sm'
                                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50'
                                        }`}
                                    >
                                        Không
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isTabLocked}
                                        onClick={() => item.setVal('1')}
                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                            item.val === '1'
                                                ? 'bg-[#0f766e] text-white shadow-sm'
                                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50'
                                        }`}
                                    >
                                        Có
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 2. ĐÁNH GIÁ PHÁT TRIỂN TINH THẦN - VẬN ĐỘNG */}
            <div className="p-5 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-5 shadow-sm">
                <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 pb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0f766e] text-white text-xs">2</span>
                    Đánh giá phát triển tinh thần - vận động
                </h4>

                <div className="space-y-3">
                    {[
                        { label: "Phát triển tinh thần bình thường của trẻ theo độ tuổi", val: ptTinhThanBinhThuong, setVal: setPtTinhThanBinhThuong },
                        { label: "Phát triển vận động bình thường của trẻ theo độ tuổi", val: ptVanDongBinhThuong, setVal: setPtVanDongBinhThuong },
                        { label: "Trẻ có nguy cơ tự kỷ (với trẻ từ 16 - 30 tháng tuổi)", val: nguyCoTuKy, setVal: setNguyCoTuKy }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                            <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg w-fit">
                                <button
                                    type="button"
                                    disabled={isTabLocked}
                                    onClick={() => item.setVal('0')}
                                    className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${
                                        item.val !== '1'
                                            ? 'bg-rose-600 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50'
                                    }`}
                                >
                                    Không
                                </button>
                                <button
                                    type="button"
                                    disabled={isTabLocked}
                                    onClick={() => item.setVal('1')}
                                    className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${
                                        item.val === '1'
                                            ? 'bg-[#0f766e] text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50'
                                    }`}
                                >
                                    Có
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. ĐÁNH GIÁ TIÊM CHỦNG */}
            <div className="p-5 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-5 shadow-sm">
                <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 pb-2 flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#0f766e] text-white text-xs">3</span>
                    Kiểm tra số tiêm chủng
                </h4>

                <div className="space-y-3">
                    {[
                        { label: "Lao (sơ sinh)", val: tiemChungLao, setVal: setTiemChungLao },
                        { label: "Viêm gan B mũi 1 (sơ sinh)", val: tiemChungVgbMui1, setVal: setTiemChungVgbMui1 },
                        { label: "Tiêm chủng đầy đủ các loại vắc xin theo độ tuổi", val: tiemChungDayDu, setVal: setTiemChungDayDu }
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                            <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg w-fit">
                                <button
                                    type="button"
                                    disabled={isTabLocked}
                                    onClick={() => item.setVal('0')}
                                    className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${
                                        item.val !== '1'
                                            ? 'bg-rose-600 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50'
                                    }`}
                                >
                                    Không
                                </button>
                                <button
                                    type="button"
                                    disabled={isTabLocked}
                                    onClick={() => item.setVal('1')}
                                    className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${
                                        item.val === '1'
                                            ? 'bg-[#0f766e] text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50'
                                    }`}
                                >
                                    Có
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            </fieldset>
            </SpecialtyCard>
        </div>
    );
};

export default ChildDevelopmentTab;
