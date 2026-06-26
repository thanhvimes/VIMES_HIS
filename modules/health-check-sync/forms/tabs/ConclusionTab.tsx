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
        doctors,
        conclusionDoctorId,
        setConclusionDoctorId,
        isLocked,
        handleAutofillTab,
        khamTheLucPl,
        noiKhoaTuanHoanPl,
        noiKhoaHoHapPl,
        noiKhoaTieuHoaPl,
        noiKhoaThanTietnieuPl,
        noiKhoaNoiTietPl,
        noiKhoaCoXuongKhopPl,
        noiKhoaThanKinhPl,
        noiKhoaTamThanPl,
        khamNgoaiKhoaPl,
        khamDaLieuPl,
        khamSanPhuKhoaPl,
        khamMatPl,
        khamTaiMuiHongPl,
        khamRangHamMatPl,
        licenseClass,
        coKinhHaiMat,
        coKinhMatPhai,
        coKinhMatTrai,
        khongKinhHaiMat,
        khongKinhMatPhai,
        khongKinhMatTrai,
        sacGiac,
    } = useDynamicFormContext();

    const getDriverWarnings = () => {
        if (formType !== '3' || !licenseClass) return [];
        const warnings: string[] = [];

        const parseVisual = (val: string) => {
            if (!val) return 10;
            const match = val.match(/^(\d+)\/10/);
            if (match) return parseInt(match[1]);
            const num = parseFloat(val);
            if (!isNaN(num)) return num <= 1 ? num * 10 : num;
            return 10;
        };

        const hasGlasses = coKinhHaiMat || coKinhMatPhai || coKinhMatTrai;
        const rightEye = parseVisual(hasGlasses ? coKinhMatPhai : khongKinhMatPhai);
        const leftEye = parseVisual(hasGlasses ? coKinhMatTrai : khongKinhMatTrai);

        if (licenseClass === 'A1') {
            const total = rightEye + leftEye;
            if (total < 8) {
                warnings.push("Thị lực cả hai mắt cộng lại có kính dưới 8/10 (Quy định: tối thiểu >= 8/10 đối với hạng A1).");
            }
        } else {
            const bestEye = Math.max(rightEye, leftEye);
            const worstEye = Math.min(rightEye, leftEye);
            if (bestEye < 8) {
                warnings.push("Thị lực mắt tốt có kính dưới 8/10 (Quy định: tối thiểu >= 8/10 đối với hạng B2, C, D, E, F).");
            }
            if (worstEye < 5) {
                warnings.push("Thị lực mắt kém có kính dưới 5/10 (Quy định: tối thiểu >= 5/10 đối với hạng B2, C, D, E, F).");
            }
        }

        if (sacGiac === '1' || sacGiac === '2') {
            warnings.push("Bệnh nhân bị mù màu hoặc rối loạn sắc giác đỏ - lục (Không đủ điều kiện lái xe hạng B2, C, D, E, F).");
        }

        return warnings;
    };

    const driverWarnings = getDriverWarnings();

    const getSuggestedFitnessClass = () => {
        const pls = [
            khamTheLucPl,
            noiKhoaTuanHoanPl,
            noiKhoaHoHapPl,
            noiKhoaTieuHoaPl,
            noiKhoaThanTietnieuPl,
            noiKhoaNoiTietPl,
            noiKhoaCoXuongKhopPl,
            noiKhoaThanKinhPl,
            noiKhoaTamThanPl,
            khamNgoaiKhoaPl,
            khamDaLieuPl,
            khamSanPhuKhoaPl,
            khamMatPl,
            khamTaiMuiHongPl,
            khamRangHamMatPl
        ];
        
        const numericPls = pls
            .map(val => parseInt(val || ''))
            .filter(num => !isNaN(num));
            
        if (numericPls.length === 0) return null;
        return Math.max(...numericPls);
    };

    const suggestedOverallClass = getSuggestedFitnessClass();
    const showOverallWarning = suggestedOverallClass !== null && fitnessClass && parseInt(fitnessClass) < suggestedOverallClass;

    const doctorsList = doctors || [];

    return (
        <div className="space-y-6 animate-fadeIn">
            {driverWarnings.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-4 rounded-xl text-rose-800 dark:text-rose-400 text-xs space-y-1.5 animate-fadeIn">
                    <h5 className="font-bold flex items-center gap-1.5 uppercase text-rose-900 dark:text-rose-300">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        Cảnh báo tiêu chuẩn sức khỏe lái xe (Hạng {licenseClass})
                    </h5>
                    <ul className="list-disc pl-4 space-y-1 font-semibold">
                        {driverWarnings.map((warn, idx) => (
                            <li key={idx}>{warn}</li>
                        ))}
                    </ul>
                </div>
            )}

            {showOverallWarning && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-4 rounded-xl text-amber-800 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5 animate-fadeIn">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span>Cảnh báo đồng nhất: Phát hiện phân loại lâm sàng thành phần có loại {suggestedOverallClass}. Phân loại sức khỏe chung đề xuất tối thiểu phải là Loại {suggestedOverallClass} (Hiện tại đang chọn Loại {fitnessClass}).</span>
                </div>
            )}

            <fieldset disabled={isLocked} className="space-y-6 w-full">
            <div className="modern-card p-6">
                <h4 className="text-sm font-bold text-[#0f766e] dark:text-teal-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">IV.2. Kết luận sức khỏe chung</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                            <span>Phân loại sức khỏe chung</span>
                            {suggestedOverallClass !== null && (
                                <span className="text-[10px] text-teal-600 dark:text-emerald-400 bg-teal-50 dark:bg-emerald-950/20 border border-teal-200/30 px-1.5 py-0.5 rounded font-bold">Gợi ý: Loại {suggestedOverallClass}</span>
                            )}
                        </label>
                        <select value={fitnessClass} onChange={e => setFitnessClass(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-[#0f766e] dark:text-teal-400">
                            <option value="">-- Chọn phân loại --</option>
                            <option value="1">Loại I : Rất khoẻ</option>
                            <option value="2">Loại II : Khoẻ</option>
                            <option value="3">Loại III : Trung bình</option>
                            <option value="4">Loại IV : Yếu</option>
                            <option value="5">Loại V : Rất yếu</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Bác sĩ kết luận</label>
                        <select 
                            value={conclusionDoctorId} 
                            onChange={e => setConclusionDoctorId(e.target.value)} 
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                        >
                            <option value="">-- Chọn bác sĩ --</option>
                            {doctorsList.map((doc: any) => (
                                <option key={doc.id} value={doc.id}>
                                    {doc.name}
                                </option>
                            ))}
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
                                <option value="">-- Chọn đánh giá --</option>
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
                                <option value="">-- Chọn đánh giá --</option>
                                <option value="1">Đạt (Khả năng chịu sóng tốt)</option>
                                <option value="2">Khả năng trung bình</option>
                                <option value="3">Say sóng nặng / Không đi biển được</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Hạn chế làm việc</label>
                            <select value={hanChe} onChange={e => setHanChe(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                <option value="">-- Chọn hạn chế --</option>
                                <option value="0">Không có hạn chế</option>
                                <option value="1">Hạn chế làm việc ban đêm</option>
                                <option value="2">Hạn chế khu vực hoạt động</option>
                                <option value="3">Hạn chế khác</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Yêu cầu đeo kính khi làm việc</label>
                            <select value={yeuCauDeoKinh} onChange={e => setYeuCauDeoKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                <option value="">-- Chọn yêu cầu --</option>
                                <option value="0">Không yêu cầu</option>
                                <option value="1">Yêu cầu đeo kính</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại sức khỏe Thuyền viên</label>
                            <select value={ketLuanLoaiSucKhoe} onChange={e => setKetLuanLoaiSucKhoe(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-[#0f766e] dark:text-teal-400">
                                <option value="">-- Chọn phân loại --</option>
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
            </fieldset>
        </div>
    );
};

export default ConclusionTab;
