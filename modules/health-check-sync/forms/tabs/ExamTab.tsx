import React from 'react';
import { useDynamicFormContext } from '../DynamicFormContext';
import { FormDateInput } from '../../../../components/ui/forms';

const ExamTab: React.FC = () => {
    const {
        formType,
        isChild,
        errors,
        gender,
        height,
        setHeight,
        weight,
        setWeight,
        pulse,
        setPulse,
        bp,
        setBp,
        bmi,
        khamTheLucPl,
        setKhamTheLucPl,
        vongDau,
        setVongDau,
        vongNguc,
        setVongNguc,
        sinhNon,
        setSinhNon,
        tuanThai,
        setTuanThai,
        birthWeight,
        setBirthWeight,
        lucBopTayThuan,
        setLucBopTayThuan,
        lucBopTayKhongThuan,
        setLucBopTayKhongThuan,
        lucKeoLung,
        setLucKeoLung,
        lucKeoThan,
        setLucKeoThan,
        haTamThu,
        setHaTamThu,
        haTamTruong,
        setHaTamTruong,
        nhipTim,
        setNhipTim,
        vongNgucTrungBinh,
        setVongNgucTrungBinh,
        nhiTuanHoan,
        setNhiTuanHoan,
        nhiHoHap,
        setNhiHoHap,
        nhiTieuHoa,
        setNhiTieuHoa,
        nhiThanKinh,
        setNhiThanKinh,
        milestoneCheck,
        setMilestoneCheck,
        milestones,
        setMilestones,
        kqTamThan,
        setKqTamThan,
        kqThanKinh,
        setKqThanKinh,
        kqTimMach,
        setKqTimMach,
        kqHoHap,
        setKqHoHap,
        kqNoiTiet,
        setKqNoiTiet,
        kqNgoaiKhoa,
        setKqNgoaiKhoa,
        kqDaLieu,
        setKqDaLieu,
        kqTietNieu,
        setKqTietNieu,
        kqSinhDuc,
        setKqSinhDuc,
        kqTaiMuiHong,
        setKqTaiMuiHong,
        kqCoXuongKhop,
        setKqCoXuongKhop,
        kqNoiTietChuyenHoa,
        setKqNoiTietChuyenHoa,
        timMach,
        setTimMach,
        hoHap,
        setHoHap,
        tietNieuSinhDuc,
        setTietNieuSinhDuc,
        noiKhoaTieuHoa,
        setNoiKhoaTieuHoa,
        ganMat,
        setGanMat,
        mauCoQuanTaoMau,
        setMauCoQuanTaoMau,
        daToChucDuoiDa,
        setDaToChucDuoiDa,
        kqCoXuongKhopM5,
        setKqCoXuongKhopM5,
        thanKinhM5,
        setThanKinhM5,
        maBenhNgoaiKhoa,
        setMaBenhNgoaiKhoa,
        khamTaiMuiHongM5,
        setKhamTaiMuiHongM5,
        khamMatM5,
        setKhamMatM5,
        noiTietDinhDuongChuyenHoa,
        setNoiTietDinhDuongChuyenHoa,
        roiLoanHanhViTamThan,
        setRoiLoanHanhViTamThan,
        thanKinhTamLy,
        setThanKinhTamLy,
        khamMatThiGiacMau,
        setKhamMatThiGiacMau,
        benhKhac,
        setBenhKhac,
        xaKhongKinhMatPhai,
        setXaKhongKinhMatPhai,
        xaKhongKinhMatTrai,
        setXaKhongKinhMatTrai,
        xaKhongKinhHaiMat,
        setXaKhongKinhHaiMat,
        xaCoKinhMatPhai,
        setXaCoKinhMatPhai,
        xaCoKinhMatTrai,
        setXaCoKinhMatTrai,
        xaCoKinhHaiMat,
        setXaCoKinhHaiMat,
        ganKhongKinhMatPhai,
        setGanKhongKinhMatPhai,
        ganKhongKinhMatTrai,
        setGanKhongKinhMatTrai,
        ganKhongKinhHaiMat,
        setGanKhongKinhHaiMat,
        ganCoKinhMatPhai,
        setGanCoKinhMatPhai,
        ganCoKinhMatTrai,
        setGanCoKinhMatTrai,
        ganCoKinhHaiMat,
        setGanCoKinhHaiMat,
        khamMatThiTruongPhai,
        setKhamMatThiTruongPhai,
        khamMatThiTruongTrai,
        setKhamMatThiTruongTrai,
        taiPhai500hz,
        setTaiPhai500hz,
        taiPhai2000hz,
        setTaiPhai2000hz,
        taiPhai3000hz,
        setTaiPhai3000hz,
        taiPhai4000hz,
        setTaiPhai4000hz,
        taiPhai6000hz,
        setTaiPhai6000hz,
        taiTrai500hz,
        setTaiTrai500hz,
        taiTrai2000hz,
        setTaiTrai2000hz,
        taiTrai3000hz,
        setTaiTrai3000hz,
        taiTrai4000hz,
        setTaiTrai4000hz,
        taiTrai6000hz,
        setTaiTrai6000hz,
        internalExam,
        setInternalExam,
        noiKhoaTuanHoanPl,
        setNoiKhoaTuanHoanPl,
        noiKhoaHoHapPl,
        setNoiKhoaHoHapPl,
        noiKhoaTieuHoaPl,
        setNoiKhoaTieuHoaPl,
        noiKhoaThanTietnieuPl,
        setNoiKhoaThanTietnieuPl,
        noiKhoaNoiTietPl,
        setNoiKhoaNoiTietPl,
        noiKhoaCoXuongKhopPl,
        setNoiKhoaCoXuongKhopPl,
        noiKhoaThanKinhPl,
        setNoiKhoaThanKinhPl,
        noiKhoaTamThanPl,
        setNoiKhoaTamThanPl,
        noiKhoaTamThan,
        setNoiKhoaTamThan,
        noiKhoaThanKinh,
        setNoiKhoaThanKinh,
        eyeExam,
        setEyeExam,
        khamMatPl,
        setKhamMatPl,
        khongKinhMatPhai,
        setKhongKinhMatPhai,
        khongKinhMatTrai,
        setKhongKinhMatTrai,
        khongKinhHaiMat,
        setKhongKinhHaiMat,
        coKinhMatPhai,
        setCoKinhMatPhai,
        coKinhMatTrai,
        setCoKinhMatTrai,
        coKinhHaiMat,
        setCoKinhHaiMat,
        sacGiac,
        setSacGiac,
        thiTruongNgangHaiMat,
        setThiTruongNgangHaiMat,
        thiTruongDungHaiMat,
        setThiTruongDungHaiMat,
        entExam,
        setEntExam,
        khamTaiMuiHongPl,
        setKhamTaiMuiHongPl,
        taiPhaiNoiThuong,
        setTaiPhaiNoiThuong,
        taiPhaiNoiTham,
        setTaiPhaiNoiTham,
        taiTraiNoiThuong,
        setTaiTraiNoiThuong,
        taiTraiNoiTham,
        setTaiTraiNoiTham,
        dentalExam,
        setDentalExam,
        khamRangHamMatPl,
        setKhamRangHamMatPl,
        hamTren,
        setHamTren,
        hamDuoi,
        setHamDuoi,
        externalExam,
        setExternalExam,
        khamNgoaiKhoaPl,
        setKhamNgoaiKhoaPl,
        khamDaLieuPl,
        setKhamDaLieuPl,
        gynExam,
        setGynExam,
        khamSanPhuKhoaPl,
        setKhamSanPhuKhoaPl
    } = useDynamicFormContext();

    const renderChildMilestones = () => {
        if (!isChild) return null;
        
        const milestoneList: { key: string; label: string; forms: string[] }[] = [
            { key: 'quay_dau_huong_am_thanh', label: 'Quay đầu hướng âm thanh', forms: ['6'] },
            { key: 'nhin_theo_khuon_mat_30cm', label: 'Nhìn theo khuôn mặt ở khoảng cách 30cm', forms: ['6'] },
            { key: 'phat_ra_tieng_khan_gu', label: 'Phát ra tiếng khàn gừ', forms: ['7'] },
            { key: 'ngoi_khong_ho_tro', label: 'Ngồi vững không cần hỗ trợ', forms: ['9'] },
            { key: 'dung_ngon_cai_tum_do_vat', label: 'Dùng ngón cái và ngón trỏ túm đồ vật', forms: ['9'] },
            { key: 'dap_ung_goi_ten', label: 'Đáp ứng khi được gọi tên', forms: ['10'] },
            { key: 'bap_be_tu_nguyen_phu_am', label: 'Bập bẹ tự phát âm phụ âm', forms: ['10'] },
            { key: 'dung_vin_dung_len', label: 'Đứng vịn vào vật khác để đứng lên', forms: ['10'] },
            { key: 'di_chuyen_let_bang_mong', label: 'Di chuyển lết bằng mông', forms: ['10'] },
            { key: 'noi_duoc_co_chu_dich', label: 'Nói được từ đơn có chủ đích', forms: ['11'] },
            { key: 'di_co_hoac_khong_tro_giup', label: 'Đi chập chững (có hoặc không trợ giúp)', forms: ['11'] },
            { key: 'chi_bo_phan_co_the', label: 'Chỉ đúng bộ phận cơ thể khi được hỏi', forms: ['12'] },
            { key: 'noi_tu_ghep_2_tu', label: 'Nói được từ ghép 2 từ', forms: ['12'] },
            { key: 'lam_theo_yeu_cau_1_2_buoc', label: 'Làm theo yêu cầu đơn giản 1-2 bước', forms: ['12'] },
            { key: 'lam_theo_yeu_cau_2_3_buoc', label: 'Làm theo yêu cầu phức tạp 2-3 bước', forms: ['13'] },
            { key: 'vin_cau_thang_va_nhay_bat', label: 'Vịn cầu thang và nhảy bật', forms: ['13'] },
            { key: 'lam_3_yeu_cau_khong_lien_quan', label: 'Thực hiện 3 yêu cầu không liên quan liên tiếp', forms: ['13'] },
            { key: 'noi_cau_dai_ke_chuyen', label: 'Nói câu dài và biết kể chuyện', forms: ['13'] },
            { key: 'hoi_va_tra_loi_cau_hoi', label: 'Đặt câu hỏi và trả lời câu hỏi tại sao', forms: ['13'] },
            { key: 'dung_1_chan_5_giay_nhay_lo_co', label: 'Đứng bằng 1 chân 5 giây & nhảy lò cò', forms: ['13'] },
            { key: 'noi_thong_tin_ca_nhan', label: 'Nói được tên, tuổi, giới tính của mình', forms: ['13'] },
            { key: 'dem_to_hoac_dem_ngon_tay', label: 'Đếm to hoặc đếm ngón tay đến 5-10', forms: ['13'] },
        ];
        
        const activeMilestones = milestoneList.filter(item => item.forms.includes(formType));
        if (activeMilestones.length === 0) return null;
        
        return (
            <div className="mt-4 p-4 bg-teal-50/20 dark:bg-slate-800/60 rounded-xl border border-teal-200/20 dark:border-slate-700/80 space-y-3 col-span-1 md:col-span-2">
                <span className="text-xs font-extrabold text-teal-700 dark:text-teal-400 block uppercase tracking-wider">
                    Bảng kiểm các mốc phát triển tinh thần - vận động đặc thù (Mẫu {formType})
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeMilestones.map(item => (
                        <div key={item.key} className="flex justify-between items-center p-2 rounded-lg border border-slate-200/50 dark:border-slate-700 bg-white dark:bg-slate-850">
                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                            <select
                                value={milestones[item.key] || '1'}
                                onChange={e => setMilestones(prev => ({ ...prev, [item.key]: e.target.value }))}
                                className="p-1 border border-slate-350 dark:border-slate-650 rounded text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                            >
                                <option value="1">Đạt</option>
                                <option value="0">Chưa đạt</option>
                            </select>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h4 className="text-sm font-bold text-[#0f766e] dark:text-teal-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">III.1. Khám Thể lực</h4>
                <div className={`grid grid-cols-1 ${formType === '2' ? 'md:grid-cols-6' : 'md:grid-cols-5'} gap-4`}>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Chiều cao (cm)</label>
                        <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Cân nặng (kg)</label>
                        <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nhịp tim (mạch/phút)</label>
                        <input type="number" value={pulse} onChange={e => setPulse(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Huyết áp (mmHg)</label>
                        <input type="text" value={bp} onChange={e => setBp(e.target.value)} className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white ${errors.bp ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`} placeholder="120/80" />
                        {errors.bp && <p className="text-red-500 text-[10px] font-bold mt-1">{errors.bp}</p>}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Chỉ số BMI (Tự động)</label>
                        <input type="text" value={bmi} disabled className="w-full p-2.5 border border-slate-200 dark:border-slate-600 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold" />
                    </div>
                    {formType === '2' && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại thể lực</label>
                            <select value={khamTheLucPl} onChange={e => setKhamTheLucPl(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-[#0f766e] dark:text-teal-400">
                                <option value="1">Loại I</option>
                                <option value="2">Loại II</option>
                                <option value="3">Loại III</option>
                                <option value="4">Loại IV</option>
                                <option value="5">Loại V</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Extra physical fields for child or sailor */}
                {isChild && (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Vòng đầu (cm)</label>
                            <input type="number" value={vongDau} onChange={e => setVongDau(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Vòng ngực (cm)</label>
                            <input type="number" value={vongNguc} onChange={e => setVongNguc(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Trẻ sinh non</label>
                            <select value={sinhNon} onChange={e => setSinhNon(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                <option value="0">Không sinh non</option>
                                <option value="1">Có sinh non</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Tuần thai khi sinh</label>
                            <input type="number" value={tuanThai} onChange={e => setTuanThai(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="39" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Cân nặng lúc sinh (kg)</label>
                            <input type="number" step="0.1" value={birthWeight} onChange={e => setBirthWeight(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="3.2" />
                        </div>
                    </div>
                )}

                {formType === '5' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Lực bóp tay thuận (kg)</label>
                                <input type="number" value={lucBopTayThuan} onChange={e => setLucBopTayThuan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Lực bóp tay không thuận (kg)</label>
                                <input type="number" value={lucBopTayKhongThuan} onChange={e => setLucBopTayKhongThuan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Lực kéo lưng (kg)</label>
                                <input type="number" value={lucKeoLung} onChange={e => setLucKeoLung(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Lực kéo thân (kg)</label>
                                <input type="number" value={lucKeoThan} onChange={e => setLucKeoThan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">HA Tâm thu (mmHg)</label>
                                <input type="number" value={haTamThu} onChange={e => setHaTamThu(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">HA Tâm trương (mmHg)</label>
                                <input type="number" value={haTamTruong} onChange={e => setHaTamTruong(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Nhịp tim (lần/phút)</label>
                                <input type="number" value={nhipTim} onChange={e => setNhipTim(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Vòng ngực trung bình (cm)</label>
                                <input type="number" value={vongNgucTrungBinh} onChange={e => setVongNgucTrungBinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div>
                <h4 className="text-sm font-bold text-[#0f766e] dark:text-teal-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">
                    {isChild ? "III.2. Kết quả khám chuyên khoa Nhi" : "III.2. Kết quả khám Lâm sàng Chuyên khoa"}
                </h4>
                
                {isChild ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Khám Tuần hoàn</label>
                            <textarea value={nhiTuanHoan} onChange={e => setNhiTuanHoan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white h-20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Khám Hô hấp</label>
                            <textarea value={nhiHoHap} onChange={e => setNhiHoHap(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white h-20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Khám Tiêu hóa</label>
                            <textarea value={nhiTieuHoa} onChange={e => setNhiTieuHoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white h-20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Khám Thần kinh / Tâm thần</label>
                            <textarea value={nhiThanKinh} onChange={e => setNhiThanKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white h-20" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Đánh giá Phát triển tinh thần/vận động</label>
                            <select value={milestoneCheck} onChange={e => setMilestoneCheck(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                <option value="1">Đạt các mốc phát triển theo tháng tuổi</option>
                                <option value="0">Cần theo dõi sát / Chậm phát triển</option>
                            </select>
                        </div>
                        {renderChildMilestones()}
                    </div>
                ) : formType === '4' ? (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-6 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm">
                            <h5 className="text-base font-bold text-[#0f766e] dark:text-teal-400 border-b border-slate-200 dark:border-slate-700/50 pb-2 flex items-center justify-between">
                                <span>III.2. Kết quả khám Chuyên khoa Đường sắt (Mẫu 4)</span>
                                <span className="text-xs font-bold text-slate-400">// QĐ 1551/QĐ-BYT</span>
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Khám Tâm thần</label>
                                    <textarea value={kqTamThan} onChange={e => setKqTamThan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Khám Thần kinh</label>
                                    <textarea value={kqThanKinh} onChange={e => setKqThanKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Khám Tim mạch</label>
                                    <textarea value={kqTimMach} onChange={e => setKqTimMach(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Khám Hô hấp</label>
                                    <textarea value={kqHoHap} onChange={e => setKqHoHap(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Khám Nội tiết</label>
                                    <textarea value={kqNoiTiet} onChange={e => setKqNoiTiet(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Khám Ngoại khoa</label>
                                    <textarea value={kqNgoaiKhoa} onChange={e => setKqNgoaiKhoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Khám Da liễu</label>
                                    <textarea value={kqDaLieu} onChange={e => setKqDaLieu(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Khám Tiết niệu</label>
                                    <textarea value={kqTietNieu} onChange={e => setKqTietNieu(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Khám Sinh dục</label>
                                    <textarea value={kqSinhDuc} onChange={e => setKqSinhDuc(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Khám Tai Mũi Họng</label>
                                    <textarea value={kqTaiMuiHong} onChange={e => setKqTaiMuiHong(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Khám Cơ xương khớp</label>
                                    <textarea value={kqCoXuongKhop} onChange={e => setKqCoXuongKhop(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Khám Nội tiết - Chuyển hóa</label>
                                    <textarea value={kqNoiTietChuyenHoa} onChange={e => setKqNoiTietChuyenHoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : formType === '5' ? (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="p-6 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm">
                            <h5 className="text-base font-bold text-[#0f766e] dark:text-teal-400 border-b border-slate-200 dark:border-slate-700/50 pb-2 flex items-center justify-between">
                                <span>III.2. Kết quả khám Chuyên khoa Thuyền viên (Mẫu 5)</span>
                                <span className="text-xs font-bold text-slate-400">// QĐ 1551/QĐ-BYT</span>
                            </h5>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Tim mạch</label>
                                    <textarea value={timMach} onChange={e => setTimMach(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Hô hấp</label>
                                    <textarea value={hoHap} onChange={e => setHoHap(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Tiết niệu sinh dục</label>
                                    <textarea value={tietNieuSinhDuc} onChange={e => setTietNieuSinhDuc(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Tiêu hóa</label>
                                    <textarea value={noiKhoaTieuHoa} onChange={e => setNoiKhoaTieuHoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Gan mật</label>
                                    <textarea value={ganMat} onChange={e => setGanMat(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Máu &amp; cơ quan tạo máu</label>
                                    <textarea value={mauCoQuanTaoMau} onChange={e => setMauCoQuanTaoMau(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Da &amp; tổ chức dưới da</label>
                                    <textarea value={daToChucDuoiDa} onChange={e => setDaToChucDuoiDa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Cơ xương khớp</label>
                                    <textarea value={kqCoXuongKhopM5} onChange={e => setKqCoXuongKhopM5(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Thần kinh</label>
                                    <textarea value={thanKinhM5} onChange={e => setThanKinhM5(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Ngoại khoa (Mã bệnh ngoại khoa)</label>
                                    <textarea value={maBenhNgoaiKhoa} onChange={e => setMaBenhNgoaiKhoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Tai mũi họng</label>
                                    <textarea value={khamTaiMuiHongM5} onChange={e => setKhamTaiMuiHongM5(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mắt</label>
                                    <textarea value={khamMatM5} onChange={e => setKhamMatM5(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nội tiết dinh dưỡng chuyển hóa</label>
                                    <textarea value={noiTietDinhDuongChuyenHoa} onChange={e => setNoiTietDinhDuongChuyenHoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Rối loạn hành vi tâm thần</label>
                                    <textarea value={roiLoanHanhViTamThan} onChange={e => setRoiLoanHanhViTamThan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Thần kinh tâm lý</label>
                                    <textarea value={thanKinhTamLy} onChange={e => setThanKinhTamLy(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Sắc giác màu / Thị giác màu</label>
                                    <select value={khamMatThiGiacMau} onChange={e => setKhamMatThiGiacMau(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold focus:ring-2 focus:ring-teal-500">
                                        <option value="1">Bình thường</option>
                                        <option value="2">Mù màu đỏ - lục hoàn toàn</option>
                                        <option value="3">Mù màu đỏ - lục một phần</option>
                                        <option value="4">Mù màu hoàn toàn</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Bệnh khác</label>
                                    <textarea value={benhKhac} onChange={e => setBenhKhac(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-16 focus:ring-2 focus:ring-teal-500" />
                                </div>
                            </div>

                            {/* Visual Acuity Grid Table */}
                            <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4 space-y-2">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Bảng đo Thị lực (Không kính &amp; Có kính)</span>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-700">
                                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                                            <tr>
                                                <th className="p-2 border border-slate-200 dark:border-slate-700">Thị lực</th>
                                                <th className="p-2 border border-slate-200 dark:border-slate-700 text-center">Mắt phải</th>
                                                <th className="p-2 border border-slate-200 dark:border-slate-700 text-center">Mắt trái</th>
                                                <th className="p-2 border border-slate-200 dark:border-slate-700 text-center">Hai mắt</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="p-2 font-bold border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">Nhìn xa (Không kính)</td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={xaKhongKinhMatPhai} onChange={e => setXaKhongKinhMatPhai(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={xaKhongKinhMatTrai} onChange={e => setXaKhongKinhMatTrai(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={xaKhongKinhHaiMat} onChange={e => setXaKhongKinhHaiMat(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" /></td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 font-bold border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">Nhìn xa (Có kính)</td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={xaCoKinhMatPhai} onChange={e => setXaCoKinhMatPhai(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="Có kính..." /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={xaCoKinhMatTrai} onChange={e => setXaCoKinhMatTrai(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="Có kính..." /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={xaCoKinhHaiMat} onChange={e => setXaCoKinhHaiMat(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="Có kính..." /></td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 font-bold border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">Nhìn gần (Không kính)</td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={ganKhongKinhMatPhai} onChange={e => setGanKhongKinhMatPhai(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={ganKhongKinhMatTrai} onChange={e => setGanKhongKinhMatTrai(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={ganKhongKinhHaiMat} onChange={e => setGanKhongKinhHaiMat(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" /></td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 font-bold border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">Nhìn gần (Có kính)</td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={ganCoKinhMatPhai} onChange={e => setGanCoKinhMatPhai(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="Có kính..." /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={ganCoKinhMatTrai} onChange={e => setGanCoKinhMatTrai(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="Có kính..." /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="text" value={ganCoKinhHaiMat} onChange={e => setGanCoKinhHaiMat(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="Có kính..." /></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Thị trường mắt phải</label>
                                        <input type="text" value={khamMatThiTruongPhai} onChange={e => setKhamMatThiTruongPhai(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold" placeholder="Bình thường" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Thị trường mắt trái</label>
                                        <input type="text" value={khamMatThiTruongTrai} onChange={e => setKhamMatThiTruongTrai(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold" placeholder="Bình thường" />
                                    </div>
                                </div>
                            </div>

                            {/* Left/Right Ear Audiogram Matrix */}
                            <div className="border-t border-slate-200 dark:border-slate-700/50 pt-4 space-y-2">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Bảng đo Thính lực (Audiogram - dB)</span>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left border border-slate-200 dark:border-slate-700">
                                        <thead className="bg-slate-100 dark:bg-slate-800 font-bold">
                                            <tr>
                                                <th className="p-2 border border-slate-200 dark:border-slate-700">Tần số (Hz)</th>
                                                <th className="p-2 border border-slate-200 dark:border-slate-700 text-center">500 Hz</th>
                                                <th className="p-2 border border-slate-200 dark:border-slate-700 text-center">2000 Hz</th>
                                                <th className="p-2 border border-slate-200 dark:border-slate-700 text-center">3000 Hz</th>
                                                <th className="p-2 border border-slate-200 dark:border-slate-700 text-center">4000 Hz</th>
                                                <th className="p-2 border border-slate-200 dark:border-slate-700 text-center">6000 Hz</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td className="p-2 font-bold border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">Tai phải (AD)</td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="number" value={taiPhai500hz} onChange={e => setTaiPhai500hz(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="20" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="number" value={taiPhai2000hz} onChange={e => setTaiPhai2000hz(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="20" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="number" value={taiPhai3000hz} onChange={e => setTaiPhai3000hz(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="20" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="number" value={taiPhai4000hz} onChange={e => setTaiPhai4000hz(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="20" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="number" value={taiPhai6000hz} onChange={e => setTaiPhai6000hz(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="20" /></td>
                                            </tr>
                                            <tr>
                                                <td className="p-2 font-bold border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">Tai trái (AS)</td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="number" value={taiTrai500hz} onChange={e => setTaiTrai500hz(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="20" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="number" value={taiTrai2000hz} onChange={e => setTaiTrai2000hz(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="20" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="number" value={taiTrai3000hz} onChange={e => setTaiTrai3000hz(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="20" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="number" value={taiTrai4000hz} onChange={e => setTaiTrai4000hz(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="20" /></td>
                                                <td className="p-1 border border-slate-200 dark:border-slate-700"><input type="number" value={taiTrai6000hz} onChange={e => setTaiTrai6000hz(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-center font-semibold" placeholder="20" /></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Nội khoa */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm">
                            <h5 className="text-sm font-bold text-[#0f766e] dark:text-teal-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                <span>III.2.1. Nội khoa</span>
                                {formType === '2' && <span className="text-[10px] text-amber-500 font-extrabold uppercase bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">* Yêu cầu phân loại</span>}
                            </h5>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mô tả/Nhận xét khám Nội khoa chung (Tuần hoàn, Hô hấp, Tiêu hóa...)</label>
                                    <textarea value={internalExam} onChange={e => setInternalExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-20 focus:ring-2 focus:ring-teal-500" />
                                </div>
                                
                                {formType === '2' && (
                                    <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                                        <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 block">Đánh giá phân loại sức khỏe các cơ quan nội khoa chi tiết:</span>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {[
                                                { label: "Tuần hoàn (Tim mạch)", val: noiKhoaTuanHoanPl, set: setNoiKhoaTuanHoanPl },
                                                { label: "Hô hấp (Phổi)", val: noiKhoaHoHapPl, set: setNoiKhoaHoHapPl },
                                                { label: "Tiêu hóa", val: noiKhoaTieuHoaPl, set: setNoiKhoaTieuHoaPl },
                                                { label: "Thận - Tiết niệu", val: noiKhoaThanTietnieuPl, set: setNoiKhoaThanTietnieuPl },
                                                { label: "Nội tiết", val: noiKhoaNoiTietPl, set: setNoiKhoaNoiTietPl },
                                                { label: "Cơ - Xương - Khớp", val: noiKhoaCoXuongKhopPl, set: setNoiKhoaCoXuongKhopPl },
                                                { label: "Thần kinh", val: noiKhoaThanKinhPl, set: setNoiKhoaThanKinhPl },
                                                { label: "Tâm thần", val: noiKhoaTamThanPl, set: setNoiKhoaTamThanPl },
                                            ].map((item, idx) => (
                                                <div key={idx}>
                                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">{item.label}</label>
                                                    <select value={item.val} onChange={e => item.set(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                                        <option value="1">Loại I</option>
                                                        <option value="2">Loại II</option>
                                                        <option value="3">Loại III</option>
                                                        <option value="4">Loại IV</option>
                                                        <option value="5">Loại V</option>
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {formType === '3' && (
                            <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm animate-fadeIn">
                                <h5 className="text-sm font-bold text-[#0f766e] dark:text-teal-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                    <span>III.2.1.b. Tâm thần &amp; Thần kinh Lái xe (Mẫu 3)</span>
                                    <span className="text-[10px] text-amber-500 font-extrabold uppercase bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">* Yêu cầu bắt buộc</span>
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Khám Tâm thần</label>
                                        <textarea value={noiKhoaTamThan} onChange={e => setNoiKhoaTamThan(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-20 focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Khám Thần kinh</label>
                                        <textarea value={noiKhoaThanKinh} onChange={e => setNoiKhoaThanKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-20 focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Mắt & Thị lực */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm">
                            <h5 className="text-sm font-bold text-[#0f766e] dark:text-teal-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                <span>III.2.2. Chuyên khoa Mắt</span>
                                {formType === '2' && <span className="text-[10px] text-amber-500 font-extrabold uppercase bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">* Yêu cầu phân loại</span>}
                            </h5>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Mô tả khám kết mạc, giác mạc, bệnh khác về mắt</label>
                                        <textarea value={eyeExam} onChange={e => setEyeExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-20 focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    {formType === '2' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại chuyên khoa Mắt</label>
                                            <select value={khamMatPl} onChange={e => setKhamMatPl(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-650 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-[#0f766e] dark:text-teal-400">
                                                <option value="1">Loại I</option>
                                                <option value="2">Loại II</option>
                                                <option value="3">Loại III</option>
                                                <option value="4">Loại IV</option>
                                                <option value="5">Loại V</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 block">Đo thị lực &amp; Thị trường:</span>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 text-center">Không kính (Phải)</label>
                                            <input type="text" value={khongKinhMatPhai} onChange={e => setKhongKinhMatPhai(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="10/10" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 text-center">Không kính (Trái)</label>
                                            <input type="text" value={khongKinhMatTrai} onChange={e => setKhongKinhMatTrai(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="10/10" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 text-center">Không kính (Hai mắt)</label>
                                            <input type="text" value={khongKinhHaiMat} onChange={e => setKhongKinhHaiMat(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="10/10" />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 text-center">Có kính (Phải)</label>
                                            <input type="text" value={coKinhMatPhai} onChange={e => setCoKinhMatPhai(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="Nếu cận..." />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 text-center">Có kính (Trái)</label>
                                            <input type="text" value={coKinhMatTrai} onChange={e => setCoKinhMatTrai(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="Nếu cận..." />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 text-center">Có kính (Hai mắt)</label>
                                            <input type="text" value={coKinhHaiMat} onChange={e => setCoKinhHaiMat(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="Nếu cận..." />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-slate-200 dark:border-slate-700/50">
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Sắc giác</label>
                                            <select value={sacGiac} onChange={e => setSacGiac(e.target.value)} className="w-full p-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                                                <option value="0">Bình thường</option>
                                                <option value="1">Rối loạn màu 1 phần</option>
                                                <option value="2">Mù màu hoàn toàn</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">T.Trường ngang</label>
                                            <input type="text" value={thiTruongNgangHaiMat} onChange={e => setThiTruongNgangHaiMat(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="Bình thường" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-500 mb-1">T.Trường đứng</label>
                                            <input type="text" value={thiTruongDungHaiMat} onChange={e => setThiTruongDungHaiMat(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-650 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="Bình thường" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tai Mũi Họng */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm">
                            <h5 className="text-sm font-bold text-[#0f766e] dark:text-teal-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                <span>III.2.3. Chuyên khoa Tai - Mũi - Họng</span>
                                {formType === '2' && <span className="text-[10px] text-amber-500 font-extrabold uppercase bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">* Yêu cầu phân loại</span>}
                            </h5>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Mô tả/Nhận xét khám tai mũi họng &amp; màng nhĩ</label>
                                        <textarea value={entExam} onChange={e => setEntExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-20 focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    {formType === '2' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại Tai - Mũi - Họng</label>
                                            <select value={khamTaiMuiHongPl} onChange={e => setKhamTaiMuiHongPl(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-[#0f766e] dark:text-teal-400">
                                                <option value="1">Loại I</option>
                                                <option value="2">Loại II</option>
                                                <option value="3">Loại III</option>
                                                <option value="4">Loại IV</option>
                                                <option value="5">Loại V</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 block">Thính lực đo khoảng cách (m):</span>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 border-r border-slate-200 dark:border-slate-700/50 pr-2">
                                            <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 block text-center uppercase">Tai phải (AD)</span>
                                            <div>
                                                <label className="block text-[10px] text-slate-400">Nói thường (m)</label>
                                                <input type="text" value={taiPhaiNoiThuong} onChange={e => setTaiPhaiNoiThuong(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="5" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-slate-400">Nói thầm (m)</label>
                                                <input type="text" value={taiPhaiNoiTham} onChange={e => setTaiPhaiNoiTham(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="0.5" />
                                            </div>
                                        </div>

                                        <div className="space-y-2 pl-2">
                                            <span className="text-[10px] font-extrabold text-teal-600 dark:text-teal-400 block text-center uppercase">Tai trái (AS)</span>
                                            <div>
                                                <label className="block text-[10px] text-slate-400">Nói thường (m)</label>
                                                <input type="text" value={taiTraiNoiThuong} onChange={e => setTaiTraiNoiThuong(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="5" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] text-slate-400">Nói thầm (m)</label>
                                                <input type="text" value={taiTraiNoiTham} onChange={e => setTaiTraiNoiTham(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-center" placeholder="0.5" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Răng Hàm Mặt */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm">
                            <h5 className="text-sm font-bold text-[#0f766e] dark:text-teal-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                <span>III.2.4. Chuyên khoa Răng - Hàm - Mặt</span>
                                {formType === '2' && <span className="text-[10px] text-amber-500 font-extrabold uppercase bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">* Yêu cầu phân loại</span>}</h5>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Mô tả tình trạng răng, niêm mạc miệng, khớp cắn</label>
                                        <textarea value={dentalExam} onChange={e => setDentalExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-20 focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    {formType === '2' && (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại Răng - Hàm - Mặt</label>
                                            <select value={khamRangHamMatPl} onChange={e => setKhamRangHamMatPl(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-[#0f766e] dark:text-teal-400">
                                                <option value="1">Loại I</option>
                                                <option value="2">Loại II</option>
                                                <option value="3">Loại III</option>
                                                <option value="4">Loại IV</option>
                                                <option value="5">Loại V</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 justify-center flex flex-col">
                                    <span className="text-xs font-extrabold text-slate-600 dark:text-slate-300 block">Đặc điểm xương hàm:</span>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Hàm trên</label>
                                            <input type="text" value={hamTren} onChange={e => setHamTren(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold" placeholder="Bình thường" />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-500 mb-1">Hàm dưới</label>
                                            <input type="text" value={hamDuoi} onChange={e => setHamDuoi(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold" placeholder="Bình thường" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ngoại khoa & Da liễu */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-850/40 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4 shadow-sm">
                            <h5 className="text-sm font-bold text-[#0f766e] dark:text-teal-400 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-2">
                                <span>III.2.5. Ngoại khoa &amp; Da liễu</span>
                                {formType === '2' && <span className="text-[10px] text-amber-500 font-extrabold uppercase bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">* Yêu cầu phân loại</span>}
                            </h5>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mô tả/Nhận xét khám Ngoại khoa &amp; Da liễu (Sẹo mổ, u cục, tổn thương da...)</label>
                                    <textarea value={externalExam} onChange={e => setExternalExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-[110px] focus:ring-2 focus:ring-teal-500" />
                                </div>
                                
                                {formType === '2' ? (
                                    <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col justify-center gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại khám Ngoại khoa</label>
                                            <select value={khamNgoaiKhoaPl} onChange={e => setKhamNgoaiKhoaPl(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-[#0f766e] dark:text-teal-400">
                                                <option value="1">Loại I</option>
                                                <option value="2">Loại II</option>
                                                <option value="3">Loại III</option>
                                                <option value="4">Loại IV</option>
                                                <option value="5">Loại V</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại khám Da liễu</label>
                                            <select value={khamDaLieuPl} onChange={e => setKhamDaLieuPl(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-[#0f766e] dark:text-teal-400">
                                                <option value="1">Loại I</option>
                                                <option value="2">Loại II</option>
                                                <option value="3">Loại III</option>
                                                <option value="4">Loại IV</option>
                                                <option value="5">Loại V</option>
                                            </select>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                        <p className="text-xs text-slate-400 italic text-center">Không yêu cầu phân loại chuyên khoa ngoại khoa &amp; da liễu cho mẫu biểu này</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sản phụ khoa (chỉ hiển thị cho Nữ) */}
                        {gender === 'Nữ' && (
                            <div className="p-4 bg-pink-50/20 dark:bg-pink-950/10 border border-pink-200/40 dark:border-pink-900/20 rounded-xl space-y-4 shadow-sm">
                                <h5 className="text-sm font-bold text-pink-700 dark:text-pink-400 flex items-center justify-between border-b border-pink-200/40 dark:border-pink-900/30 pb-2">
                                    <span>III.2.6. Khám Sản phụ khoa (Dành riêng cho Nữ)</span>
                                    {formType === '2' && <span className="text-[10px] text-pink-500 font-extrabold uppercase bg-pink-100/50 dark:bg-pink-950/20 px-2 py-0.5 rounded">* Yêu cầu phân loại</span>}
                                </h5>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Nhận xét khám Sản phụ khoa chi tiết</label>
                                        <textarea value={gynExam} onChange={e => setGynExam(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white h-20 focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    {formType === '2' ? (
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Phân loại khám Sản phụ khoa</label>
                                            <select value={khamSanPhuKhoaPl} onChange={e => setKhamSanPhuKhoaPl(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold text-pink-600 dark:text-pink-400">
                                                <option value="1">Loại I</option>
                                                <option value="2">Loại II</option>
                                                <option value="3">Loại III</option>
                                                <option value="4">Loại IV</option>
                                                <option value="5">Loại V</option>
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                            <p className="text-xs text-slate-400 italic text-center">Không yêu cầu phân loại chuyên khoa sản phụ khoa cho mẫu biểu này</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExamTab;
