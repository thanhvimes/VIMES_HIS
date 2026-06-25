import React from 'react';
import { useDynamicFormContext } from '../DynamicFormContext';

const ConclusionTab: React.FC = () => {
    const {
        formType,
        fitnessClass,
        setFitnessClass,
        diagnosis,
        setDiagnosis,
        cacVanDeLuuY,
        setCacVanDeLuuY,
        duTieuChuanDkPtgtDuongSat,
        setDuTieuChuanDkPtgtDuongSat,
        khaNangChiuSong,
        setKhaNangChiuSong,
        hanChe,
        setHanChe,
        yeuCauDeoKinh,
        setYeuCauDeoKinh,
        ketLuanLoaiSucKhoe,
        setKetLuanLoaiSucKhoe,
    } = useDynamicFormContext();

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="modern-card p-6">
                <h4 className="text-sm font-bold text-[#0f766e] dark:text-teal-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">IV.2. Kết luận sức khỏe chung</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại sức khỏe chung</label>
                        <select value={fitnessClass} onChange={e => setFitnessClass(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-[#0f766e] dark:text-teal-400">
                            <option value="1">Loại I : Rất khoẻ</option>
                            <option value="2">Loại II : Khoẻ</option>
                            <option value="3">Loại III : Trung bình</option>
                            <option value="4">Loại IV : Yếu</option>
                            <option value="5">Loại V : Rất yếu</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Mã bệnh tật/Chẩn đoán (Mã ICD-10 hoặc chuỗi kết luận)</label>
                        <input type="text" value={diagnosis} onChange={e => setDiagnosis(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold" placeholder="Đủ điều kiện sức khỏe..." />
                    </div>
                </div>
                <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Các vấn đề sức khỏe cần lưu ý</label>
                    <textarea value={cacVanDeLuuY} onChange={e => setCacVanDeLuuY(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white h-20" />
                </div>

                {formType === '4' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 bg-amber-50/10 dark:bg-amber-950/10 p-3 rounded-lg border border-amber-200/30">
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Đánh giá tiêu chuẩn sức khỏe nhân viên chạy tàu</label>
                            <select value={duTieuChuanDkPtgtDuongSat} onChange={e => setDuTieuChuanDkPtgtDuongSat(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                <option value="1">Đủ tiêu chuẩn sức khỏe nhân viên chạy tàu</option>
                                <option value="0">Không đủ tiêu chuẩn sức khỏe nhân viên chạy tàu</option>
                            </select>
                        </div>
                    </div>
                )}

                {formType === '5' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 bg-teal-50/10 dark:bg-slate-850/30 p-4 rounded-lg border border-teal-200/30">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Khả năng đi biển / Chịu sóng</label>
                            <select value={khaNangChiuSong} onChange={e => setKhaNangChiuSong(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                <option value="1">Đạt (Khả năng chịu sóng tốt)</option>
                                <option value="2">Khả năng trung bình</option>
                                <option value="3">Say sóng nặng / Không đi biển được</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Hạn chế làm việc</label>
                            <select value={hanChe} onChange={e => setHanChe(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                <option value="0">Không có hạn chế</option>
                                <option value="1">Hạn chế làm việc ban đêm</option>
                                <option value="2">Hạn chế khu vực hoạt động</option>
                                <option value="3">Hạn chế khác</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Yêu cầu đeo kính khi làm việc</label>
                            <select value={yeuCauDeoKinh} onChange={e => setYeuCauDeoKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                <option value="0">Không yêu cầu</option>
                                <option value="1">Yêu cầu đeo kính</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại sức khỏe Thuyền viên</label>
                            <select value={ketLuanLoaiSucKhoe} onChange={e => setKetLuanLoaiSucKhoe(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-[#0f766e] dark:text-teal-400">
                                <option value="1">Loại I</option>
                                <option value="2">Loại II</option>
                                <option value="3">Loại III</option>
                                <option value="4">Loại IV</option>
                                <option value="5">Loại V</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConclusionTab;
