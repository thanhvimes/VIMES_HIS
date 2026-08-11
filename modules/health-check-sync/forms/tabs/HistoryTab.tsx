import React from 'react';
import { useDynamicFormContext } from '../DynamicFormContext';
import { catalogService } from '../../../../services/catalogService';
import { useSession } from '../../../../contexts/SessionContext';
import Combobox from '../../../../components/ui/Combobox';
import { ICD10MultiSelect } from '../../components/ICD10MultiSelect';

const HistoryTab: React.FC = () => {
    const {
        formType,
        gender,
        ts5Nam,
        setTs5Nam,
        tsThanKinh,
        setTsThanKinh,
        tsMat,
        setTsMat,
        tsTai,
        setTsTai,
        tsTimMach,
        setTsTimMach,
        tsPhauThuatTim,
        setTsPhauThuatTim,
        tsHuyetAp,
        setTsHuyetAp,
        tsKhoTho,
        setTsKhoTho,
        tsPhoiHen,
        setTsPhoiHen,
        tsThan,
        setTsThan,
        tsTieuDuong,
        setTsTieuDuong,
        tsTamThan,
        setTsTamThan,
        tsYThuc,
        setTsYThuc,
        tsChongMat,
        setTsChongMat,
        tsTieuHoa,
        setTsTieuHoa,
        tsGiacNgu,
        setTsGiacNgu,
        tsTaiBien,
        setTsTaiBien,
        tsSuDungRuou,
        setTsSuDungRuou,
        tsSuDungMaTuy,
        setTsSuDungMaTuy,
        tsBenhCotSong,
        setTsBenhCotSong,
        tsMacBenh,
        setTsMacBenh,
        tiemChungBcg,
        setTiemChungBcg,
        tiemChungBhHgUv,
        setTiemChungBhHgUv,
        tiemChungSoi,
        setTiemChungSoi,
        tiemChungBaiLiet,
        setTiemChungBaiLiet,
        tiemChungVnnbB,
        setTiemChungVnnbB,
        tiemChungVgb,
        setTiemChungVgb,
        tiemChungCacLoaiKhac,
        setTiemChungCacLoaiKhac,
        tiemChungVacXinKhac,
        setTiemChungVacXinKhac,
        tsgdMacBenh,
        setTsgdMacBenh,
        tsgdMaBenh,
        setTsgdMaBenh,
        tsbtMaBenh,
        setTsbtMaBenh,
        tsbtNamPhatHienBenh,
        setTsbtNamPhatHienBenh,
        tenThuoc,
        setTenThuoc,
        tsbtMaBenhNgheNghiep,
        setTsbtMaBenhNgheNghiep,
        tsbtNamPhatHienBenhNgheNghiep,
        setTsbtNamPhatHienBenhNgheNghiep,
        coKinhNguyetNamBaoNhieuTuoi,
        setCoKinhNguyetNamBaoNhieuTuoi,
        tinhChatKinhNguyet,
        setTinhChatKinhNguyet,
        chuKyKinh,
        setChuKyKinh,
        luongKinh,
        setLuongKinh,
        dauBungKinh,
        setDauBungKinh,
        daLapGiaDinh,
        setDaLapGiaDinh,
        para,
        setPara,
        dangApDungBpttKhong,
        setDangApDungBpttKhong,
        bienPhapTranhThai,
        setBienPhapTranhThai,
        daTungMoSanPhuKhoaChua,
        setDaTungMoSanPhuKhoaChua,
        soLanMoSanPhuKhoa,
        setSoLanMoSanPhuKhoa,
        ghiRoMoSanPhuKhoa,
        setGhiRoMoSanPhuKhoa,
        isLocked,
        isChild,
        tsTiepXucLao,
        setTsTiepXucLao,
        maGtinCskcb,
        lyDoVv,
        setLyDoVv,
        loaiHinhKcb,
        setLoaiHinhKcb,
        ngayVao,
        nhietDo,
        setNhietDo,
        nhipTho,
        setNhipTho,
        gioKham,
        setGioKham,
        dgDhstNhietDo,
        setDgDhstNhietDo,
        dgDhstMach,
        setDgDhstMach,
        dgDhstNhipTho,
        setDgDhstNhipTho,
        pulse,
        setPulse,
        height,
        setHeight,
        weight,
        setWeight,
        bmi,
        handleAutofillTab,
        specialtyMetadata,
        setSpecialtyMetadata,
        doctors,
        handleSubmit,
    } = useDynamicFormContext();

    const { user } = useSession();

    const safeMetadata = specialtyMetadata || {};
    const historyMetadata = { ...(safeMetadata.history || { doctorId: '', status: 'CHUA_KHAM' }) };
    
    if (!historyMetadata.doctorId && user) {
        historyMetadata.doctorId = user.userId || '';
        historyMetadata.doctorName = user.name || '';
    }

    const doctorsList = doctors || [];

    const handleAction = (action: 'MỞ_KHÁM' | 'DUYỆT' | 'MỞ_KHÓA' | 'THOÁT') => {
        const payload = { ...historyMetadata, updatedAt: new Date().toISOString() };
        if (action === 'MỞ_KHÁM') {
            payload.status = 'ĐANG_KHÁM';
            payload.doctorId = user?.userId || '';
            payload.doctorName = user?.name || '';
            
            setSpecialtyMetadata(prev => ({
                ...prev,
                history: payload
            }));
        } else if (action === 'DUYỆT') {
            payload.status = 'ĐÃ_DUYỆT';
            
            setSpecialtyMetadata(prev => {
                const updated = {
                    ...prev,
                    history: payload
                };
                setTimeout(() => {
                    handleSubmit();
                }, 100);
                return updated;
            });
        } else if (action === 'MỞ_KHÓA') {
            payload.status = 'ĐANG_KHÁM';
            
            setSpecialtyMetadata(prev => ({
                ...prev,
                history: payload
            }));
        } else if (action === 'THOÁT') {
            payload.status = 'CHUA_KHAM';
            
            setSpecialtyMetadata(prev => ({
                ...prev,
                history: payload
            }));
        }
    };

    const isTabLocked = isLocked || (historyMetadata.status !== 'ĐANG_KHÁM' && historyMetadata.status !== 'ĐÃ_KHÁM');

    const doctorColumns = [
        { key: 'id', label: 'Mã người dùng (su_userid)', width: '180px' },
        { key: 'name', label: 'Họ tên bác sĩ' }
    ];

    const renderBadge = () => {
        switch (historyMetadata.status) {
            case 'ĐANG_KHÁM': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Đang khám</span>;
            case 'ĐÃ_KHÁM': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Đã khám</span>;
            case 'ĐÃ_DUYỆT': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-teal-100 text-teal-800">Đã duyệt</span>;
            default: return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Chưa khám</span>;
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Quy trình phê duyệt tab */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl mb-4 gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-[#0f766e] dark:text-teal-400 uppercase tracking-wide">
                        Quy trình phê duyệt Tiền sử &amp; Vaccine
                    </span>
                    {renderBadge()}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500">Bác sĩ khám:</label>
                        <Combobox
                            value={historyMetadata.doctorId}
                            options={doctorsList}
                            columns={doctorColumns}
                            onChange={(val, item) => {
                                setSpecialtyMetadata(prev => ({
                                    ...prev,
                                    history: {
                                        ...historyMetadata,
                                        doctorId: val,
                                        doctorName: item?.name || '',
                                        updatedAt: new Date().toISOString()
                                    }
                                }));
                            }}
                            disabled={isTabLocked}
                            placeholder="-- Chọn bác sĩ --"
                            className="min-w-[250px]"
                        />
                    </div>
                    
                    {historyMetadata.status === 'CHUA_KHAM' || !historyMetadata.status ? (
                        <button
                            type="button"
                            onClick={() => handleAction('MỞ_KHÁM')}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm active:scale-95 transition cursor-pointer"
                        >
                            Khám
                        </button>
                    ) : (historyMetadata.status === 'ĐANG_KHÁM' || historyMetadata.status === 'ĐÃ_KHÁM') ? (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleAction('DUYỆT')}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm active:scale-95 transition cursor-pointer"
                            >
                                Duyệt
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAction('THOÁT')}
                                className="px-4 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 shadow-sm active:scale-95 transition cursor-pointer"
                            >
                                Thoát
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={() => handleAction('MỞ_KHÓA')}
                            className="px-4 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 shadow-sm active:scale-95 transition cursor-pointer"
                            title="Mở khóa để sửa"
                        >
                            Mở khóa
                        </button>
                    )}
                </div>
            </div>

            {/* Action Row: Autofill Tab */}
            {!isTabLocked && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => handleAutofillTab('history')}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-[#0f766e] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        Điền nhanh kết quả mặc định (Tiền sử)
                    </button>
                </div>
            )}

            <fieldset disabled={isTabLocked} className="space-y-6">
            {(isChild || formType === '2' || formType === '3') ? (
                <div className="space-y-6">
                    {/* THÔNG TIN CHUNG VỀ LẦN KHÁM */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-4 shadow-sm">
                        <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 pb-2">Thông tin chung về lần khám</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">1. Mã cơ sở khám bệnh, chữa bệnh</label>
                                <input
                                    type="text"
                                    value={maGtinCskcb}
                                    disabled
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-100 dark:bg-slate-700/40 text-slate-800 dark:text-white font-mono font-bold"
                                    placeholder="Mã cơ sở..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">2. Ngày khám sức khỏe</label>
                                <input
                                    type="text"
                                    value={ngayVao ? new Date(ngayVao).toLocaleDateString('vi-VN') : ''}
                                    disabled
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-100 dark:bg-slate-700/40 text-slate-800 dark:text-white font-bold"
                                    placeholder="Ngày khám..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Giờ khám</label>
                                <input
                                    type="text"
                                    value={gioKham}
                                    onChange={e => setGioKham(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-mono font-bold"
                                    placeholder="Giờ khám (VD: 11:16)"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700/30 pt-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Lý do khám</label>
                                <select
                                    value={lyDoVv}
                                    onChange={e => setLyDoVv(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                                >
                                    <option value="Khám sức khỏe định kỳ">Khám sức khỏe định kỳ</option>
                                    <option value="Khám sức khỏe phân loại">Khám sức khỏe phân loại</option>
                                    <option value="Khám sức khỏe học sinh/sinh viên">Khám sức khỏe học sinh/sinh viên</option>
                                    <option value="Khám sức khỏe tuyển dụng">Khám sức khỏe tuyển dụng</option>
                                    <option value="Khám sức khỏe khác">Khám sức khỏe khác</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Loại hình khám bệnh, chữa bệnh</label>
                                <select
                                    value={loaiHinhKcb}
                                    onChange={e => setLoaiHinhKcb(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                                >
                                    <option value="01">01 - Khám bệnh</option>
                                    <option value="02">02 - Chữa bệnh</option>
                                    <option value="03">03 - Khám bệnh, chữa bệnh</option>
                                    <option value="04">04 - Khám sức khỏe</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ĐÁNH GIÁ DẤU HIỆU SINH TỒN & THỂ LỰC */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-4 shadow-sm">
                        <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 pb-2">Đánh giá dấu hiệu sinh tồn &amp; Thể lực</h4>
                        
                        {/* Chiều cao, Cân nặng, BMI */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-700/30 pb-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Chiều cao/Chiều dài (cm)</label>
                                <input
                                    type="text"
                                    value={height}
                                    onChange={e => setHeight(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                                    placeholder="Nhập chiều dài/chiều cao"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Cân nặng (kg)</label>
                                <input
                                    type="text"
                                    value={weight}
                                    onChange={e => setWeight(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                                    placeholder="Nhập cân nặng"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Chỉ số BMI</label>
                                <input
                                    type="text"
                                    value={bmi}
                                    disabled
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-300 font-bold"
                                    placeholder="Tự động tính..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Nhiệt độ */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center border-b border-slate-100 dark:border-slate-700/30 pb-3">
                                <div className="lg:col-span-5">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nhiệt độ (°C)</label>
                                    <input
                                        type="text"
                                        value={nhietDo}
                                        onChange={e => setNhietDo(e.target.value)}
                                        className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                                        placeholder="Nhập nhiệt độ (°C)"
                                    />
                                </div>
                                <div className="lg:col-span-7 flex flex-col justify-center">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Đánh giá nhiệt độ</label>
                                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg w-fit">
                                        {[
                                            { label: "Bình thường", value: "1" },
                                            { label: "Sốt", value: "2" },
                                            { label: "Hạ thân nhiệt", value: "3" }
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                disabled={isTabLocked}
                                                onClick={() => setDgDhstNhietDo(opt.value)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                    dgDhstNhietDo === opt.value
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

                            {/* Mạch */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center border-b border-slate-100 dark:border-slate-700/30 pb-3">
                                <div className="lg:col-span-5">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Mạch (lần/phút)</label>
                                    <input
                                        type="text"
                                        value={pulse}
                                        onChange={e => setPulse(e.target.value)}
                                        className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                                        placeholder="Nhập nhịp mạch (lần/phút)"
                                    />
                                </div>
                                <div className="lg:col-span-7 flex flex-col justify-center">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Đánh giá mạch</label>
                                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg w-fit">
                                        {[
                                            { label: "Bình thường", value: "1" },
                                            { label: "Nhanh", value: "2" }
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                disabled={isTabLocked}
                                                onClick={() => setDgDhstMach(opt.value)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                    dgDhstMach === opt.value
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

                            {/* Nhịp thở */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                <div className="lg:col-span-5">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Nhịp thở (lần/phút)</label>
                                    <input
                                        type="text"
                                        value={nhipTho}
                                        onChange={e => setNhipTho(e.target.value)}
                                        className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold"
                                        placeholder="Nhập nhịp thở (lần/phút)"
                                    />
                                </div>
                                <div className="lg:col-span-7 flex flex-col justify-center">
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Đánh giá nhịp thở</label>
                                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg w-fit">
                                        {[
                                            { label: "Bình thường", value: "1" },
                                            { label: "Thở nhanh", value: "2" },
                                            { label: "Thở chậm", value: "3" }
                                        ].map(opt => (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                disabled={isTabLocked}
                                                onClick={() => setDgDhstNhipTho(opt.value)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                    dgDhstNhipTho === opt.value
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
                        </div>
                    </div>

                    {/* 18. TIỀN SỬ */}
                    {isChild && (
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-4 shadow-sm">
                        <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 pb-2">18. Tiền sử</h4>
                        <div className="space-y-4">
                            {/* 1. Tiền sử Bản thân */}
                            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="max-w-md">
                                        <span className="text-xs font-bold text-slate-500 block mb-1">Bản thân (ghi rõ tên bệnh nếu có)</span>
                                        <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg w-fit mt-1.5">
                                            <button
                                                type="button"
                                                disabled={isTabLocked}
                                                onClick={() => setTsbtMaBenh('')}
                                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                    !tsbtMaBenh
                                                        ? 'bg-rose-600 text-white shadow-sm'
                                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50'
                                                }`}
                                            >
                                                Không
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isTabLocked}
                                                onClick={() => { if (!tsbtMaBenh) setTsbtMaBenh('A00.1'); }}
                                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                    !!tsbtMaBenh
                                                        ? 'bg-[#0f766e] text-white shadow-sm'
                                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50'
                                                }`}
                                            >
                                                Có
                                            </button>
                                        </div>
                                    </div>
                                    {!!tsbtMaBenh && (
                                        <div className="flex-1 max-w-xl">
                                            <ICD10MultiSelect
                                                label="Chọn mã/tên bệnh bản thân (ICD-10)"
                                                value={tsbtMaBenh}
                                                onChange={setTsbtMaBenh}
                                                disabled={isLocked}
                                                placeholder="Tìm theo mã hoặc tên bệnh (VD: A00.1, A09...)"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 2. Tiền sử Gia đình */}
                            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="max-w-md">
                                        <span className="text-xs font-bold text-slate-500 block mb-1">Gia đình (ghi rõ tên bệnh nếu có)</span>
                                        <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg w-fit mt-1.5">
                                            <button
                                                type="button"
                                                disabled={isTabLocked}
                                                onClick={() => {
                                                    setTsgdMacBenh('0');
                                                    setTsgdMaBenh('');
                                                }}
                                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                    tsgdMacBenh !== '1'
                                                        ? 'bg-rose-600 text-white shadow-sm'
                                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50'
                                                }`}
                                            >
                                                Không
                                            </button>
                                            <button
                                                type="button"
                                                disabled={isTabLocked}
                                                onClick={() => setTsgdMacBenh('1')}
                                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                                    tsgdMacBenh === '1'
                                                        ? 'bg-[#0f766e] text-white shadow-sm'
                                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50'
                                                }`}
                                            >
                                                Có
                                            </button>
                                        </div>
                                    </div>
                                    {tsgdMacBenh === '1' && (
                                        <div className="flex-1 max-w-xl">
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Mã bệnh/Tên bệnh gia đình mắc phải</label>
                                            <input
                                                type="text"
                                                value={tsgdMaBenh}
                                                onChange={e => setTsgdMaBenh(e.target.value)}
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                                placeholder="Nhập mã bệnh hoặc tên bệnh gia đình (VD: A01, Q21...)"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 3. Tiền sử tiếp xúc người bệnh lao */}
                            <div className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 rounded-xl">
                                <span className="text-xs font-bold text-slate-500 block mb-1">Tiền sử tiếp xúc với người bệnh lao</span>
                                <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg w-fit mt-1.5">
                                    <button
                                        type="button"
                                        disabled={isTabLocked}
                                        onClick={() => setTsTiepXucLao('0')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                            tsTiepXucLao !== '1'
                                                ? 'bg-rose-600 text-white shadow-sm'
                                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50'
                                        }`}
                                    >
                                        Không
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isTabLocked}
                                        onClick={() => setTsTiepXucLao('1')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                                            tsTiepXucLao === '1'
                                                ? 'bg-[#0f766e] text-white shadow-sm'
                                                : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white disabled:opacity-50'
                                        }`}
                                    >
                                        Có
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    )}
                    
                    {/* Lịch sử Tiêm chủng / Vaccine (cho Mẫu 2) */}
                    {formType === '2' && (
                        <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-4 shadow-sm">
                            <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 pb-2">II.1. Lịch sử Tiêm chủng / Vaccine</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { label: "BCG (Lao)", val: tiemChungBcg, set: setTiemChungBcg },
                                    { label: "Bạch hầu, ho gà, uốn ván (DPT)", val: tiemChungBhHgUv, set: setTiemChungBhHgUv },
                                    { label: "Sởi", val: tiemChungSoi, set: setTiemChungSoi },
                                    { label: "Bại liệt (OPV/IPV)", val: tiemChungBaiLiet, set: setTiemChungBaiLiet },
                                    { label: "Viêm não Nhật Bản B", val: tiemChungVnnbB, set: setTiemChungVnnbB },
                                    { label: "Viêm gan B", val: tiemChungVgb, set: setTiemChungVgb },
                                ].map((v, i) => (
                                    <div key={i}>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">{v.label}</label>
                                        <select value={v.val} onChange={e => v.set(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                            <option value="">-- Chọn trạng thái --</option>
                                            <option value="1">Đã tiêm chủng đầy đủ</option>
                                            <option value="0">Chưa được tiêm chủng</option>
                                            <option value="99">Không nhớ rõ / Chưa có thông tin</option>
                                        </select>
                                    </div>
                                ))}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Các loại vắc xin khác</label>
                                    <select value={tiemChungCacLoaiKhac} onChange={e => setTiemChungCacLoaiKhac(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                        <option value="">-- Chọn --</option>
                                        <option value="0">Không tiêm loại khác</option>
                                        <option value="1">Có tiêm loại khác</option>
                                    </select>
                                </div>
                                {tiemChungCacLoaiKhac === '1' && (
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Tên vắc xin khác đã tiêm</label>
                                        <input type="text" value={tiemChungVacXinKhac} onChange={e => setTiemChungVacXinKhac(e.target.value)} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: Thủy đậu, Phế cầu, HPV..." />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tiền sử bệnh người lái xe (cho Mẫu 3) */}
                    {formType === '3' && (
                        <div className="space-y-6">
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-700 pb-2 mb-4 gap-2">
                                    <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider">
                                        II.1. Tiền sử bệnh tật của người lái xe (20 chỉ tiêu QĐ 1551)
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setTs5Nam(0);
                                                setTsThanKinh(0);
                                                setTsMat(0);
                                                setTsTai(0);
                                                setTsTimMach(0);
                                                setTsPhauThuatTim(0);
                                                setTsHuyetAp(0);
                                                setTsKhoTho(0);
                                                setTsPhoiHen(0);
                                                setTsThan(0);
                                                setTsTieuDuong(0);
                                                setTsTamThan(0);
                                                setTsYThuc(0);
                                                setTsChongMat(0);
                                                setTsTieuHoa(0);
                                                setTsGiacNgu(0);
                                                setTsTaiBien(0);
                                                setTsBenhCotSong(0);
                                                setTsSuDungRuou(0);
                                                setTsSuDungMaTuy(0);
                                                setTsMacBenh(0);
                                            }}
                                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-[#0f766e] dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold transition shadow-sm"
                                        >
                                            ✓ Tất cả bình thường (Không có bệnh)
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2.5">
                                    {[
                                        { id: 'ts5Nam', label: '1. Bệnh hay bị thương trong 5 năm qua', val: ts5Nam, set: setTs5Nam },
                                        { id: 'tsThanKinh', label: '2. Bệnh thần kinh hoặc bị thương ở đầu', val: tsThanKinh, set: setTsThanKinh },
                                        { id: 'tsMat', label: '3. Bệnh mắt hoặc giảm thị lực', val: tsMat, set: setTsMat },
                                        { id: 'tsTai', label: '4. Bệnh tai, giảm sức nghe hoặc thăng bằng', val: tsTai, set: setTsTai },
                                        { id: 'tsTimMach', label: '5. Bệnh ở tim hoặc nhồi máu cơ tim', val: tsTimMach, set: setTsTimMach },
                                        { id: 'tsPhauThuatTim', label: '6. Phẫu thuật can thiệp tim - mạch', val: tsPhauThuatTim, set: setTsPhauThuatTim },
                                        { id: 'tsHuyetAp', label: '7. Tăng huyết áp', val: tsHuyetAp, set: setTsHuyetAp },
                                        { id: 'tsKhoTho', label: '8. Khó thở', val: tsKhoTho, set: setTsKhoTho },
                                        { id: 'tsPhoiHen', label: '9. Bệnh phổi, hen, viêm phế quản mạn', val: tsPhoiHen, set: setTsPhoiHen },
                                        { id: 'tsThan', label: '10. Bệnh thận, lọc máu', val: tsThan, set: setTsThan },
                                        { id: 'tsTieuDuong', label: '11. Đái tháo đường, tăng đường huyết', val: tsTieuDuong, set: setTsTieuDuong },
                                        { id: 'tsTamThan', label: '12. Bệnh tâm thần', val: tsTamThan, set: setTsTamThan },
                                        { id: 'tsYThuc', label: '13. Mất ý thức, rối loạn ý thức', val: tsYThuc, set: setTsYThuc },
                                        { id: 'tsChongMat', label: '14. Ngất, chóng mặt, ngất xỉu', val: tsChongMat, set: setTsChongMat },
                                        { id: 'tsTieuHoa', label: '15. Bệnh tiêu hóa', val: tsTieuHoa, set: setTsTieuHoa },
                                        { id: 'tsGiacNgu', label: '16. Rối loạn giấc ngủ, ngưng thở khi ngủ', val: tsGiacNgu, set: setTsGiacNgu },
                                        { id: 'tsTaiBien', label: '17. Tai biến mạch máu não hoặc liệt', val: tsTaiBien, set: setTsTaiBien },
                                        { id: 'tsBenhCotSong', label: '18. Bệnh hoặc tổn thương cột sống', val: tsBenhCotSong, set: setTsBenhCotSong },
                                        { id: 'tsSuDungRuou', label: '19. Sử dụng rượu thường xuyên, liên tục', val: tsSuDungRuou, set: setTsSuDungRuou },
                                        { id: 'tsSuDungMaTuy', label: '20. Sử dụng ma túy và chất gây nghiện', val: tsSuDungMaTuy, set: setTsSuDungMaTuy },
                                    ].map((item) => (
                                        <div key={item.id} className={`flex justify-between items-center p-2.5 rounded-lg border transition-all ${item.val === 1 ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 text-rose-900 dark:text-rose-300 font-bold' : 'border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-slate-800/30 text-slate-700 dark:text-slate-300'}`}>
                                            <span className="text-xs font-semibold select-none pr-2">{item.label}</span>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => item.set(item.val === 1 ? 0 : 1)}
                                                    className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition ${item.val === 1 ? 'bg-rose-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-300'}`}
                                                >
                                                    {item.val === 1 ? 'CÓ' : 'KHÔNG'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                                    <h5 className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">21. Câu hỏi khác &amp; Điều trị thuốc</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Có đang điều trị bệnh gì không?</label>
                                            <select
                                                value={tsMacBenh}
                                                onChange={e => setTsMacBenh(parseInt(e.target.value) || 0)}
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold"
                                            >
                                                <option value="0">Không đang điều trị bệnh</option>
                                                <option value="1">Có đang điều trị bệnh</option>
                                            </select>
                                        </div>
                                        {tsMacBenh === 1 && (
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1">Tên các loại thuốc đang dùng và liều lượng</label>
                                                <input
                                                    type="text"
                                                    value={tenThuoc}
                                                    onChange={e => setTenThuoc(e.target.value)}
                                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                                    placeholder="Liệt kê tên thuốc, liều lượng đang dùng..."
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : null}

            {!isChild && formType !== '3' && (
                <div>
                    <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">II.2. Tiền sử bệnh bản thân &amp; Gia đình</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Gia đình có tiền sử bệnh bẩm sinh/truyền nhiễm</label>
                            <select value={tsgdMacBenh} onChange={e => setTsgdMacBenh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                <option value="">-- Chọn --</option>
                                <option value="0">Không có</option>
                                <option value="1">Có mắc bệnh bẩm sinh/mãn tính</option>
                            </select>
                        </div>
                        {tsgdMacBenh === '1' && (
                            <ICD10MultiSelect
                                label="Mã bệnh cụ thể (Mã ICD-10 của gia đình)"
                                value={tsgdMaBenh}
                                onChange={setTsgdMaBenh}
                                disabled={isLocked}
                                placeholder="Tìm theo mã hoặc tên bệnh (VD: Q21.0, A15...)"
                            />
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <ICD10MultiSelect
                            label="Mã bệnh bản thân đã/đang điều trị (Mã ICD-10)"
                            value={tsbtMaBenh}
                            onChange={setTsbtMaBenh}
                            disabled={isLocked}
                            placeholder="Tìm theo mã hoặc tên bệnh (VD: I10, E11...)"
                        />
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Năm phát hiện bệnh</label>
                            <input type="text" value={tsbtNamPhatHienBenh} onChange={e => setTsbtNamPhatHienBenh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: 2021" />
                        </div>
                    </div>
                    
                    {/* Tiền sử bệnh nghề nghiệp QĐ 1551 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                        <ICD10MultiSelect
                            label="Mã bệnh nghề nghiệp (Mã ICD-10)"
                            value={tsbtMaBenhNgheNghiep}
                            onChange={setTsbtMaBenhNgheNghiep}
                            disabled={isLocked}
                            placeholder="Tìm theo mã hoặc tên bệnh (VD: J60, H83...)"
                        />
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Năm phát hiện bệnh nghề nghiệp</label>
                            <input type="text" value={tsbtNamPhatHienBenhNgheNghiep} onChange={e => setTsbtNamPhatHienBenhNgheNghiep(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: 2023" />
                        </div>
                    </div>
                </div>
            )}

            {!isChild && gender && (gender.toString().toLowerCase().includes('nữ') || gender.toString().toLowerCase().includes('female') || gender === '2') && (
                <div className="animate-fadeIn p-4 bg-pink-50/30 dark:bg-pink-950/10 border border-pink-100/40 dark:border-pink-900/20 rounded-xl space-y-4">
                    <h4 className="text-sm font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider border-b border-pink-100/50 dark:border-pink-900/30 pb-2 flex items-center justify-between">
                        <span>II.3. Tiền sử Sản phụ khoa (Đối với nữ)</span>
                        <span className="text-[10px] normal-case text-pink-500 dark:text-pink-400 font-bold">* Chỉ nhập với giới tính Nữ</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Bắt đầu thấy kinh (Tuổi)</label>
                            <input type="number" value={coKinhNguyetNamBaoNhieuTuoi} onChange={e => setCoKinhNguyetNamBaoNhieuTuoi(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="13" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Tính chất kinh nguyệt</label>
                            <select value={tinhChatKinhNguyet} onChange={e => setTinhChatKinhNguyet(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                <option value="">-- Chọn --</option>
                                <option value="1">Đều</option>
                                <option value="0">Không đều</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Chu kỳ kinh (ngày)</label>
                            <input type="number" value={chuKyKinh} onChange={e => setChuKyKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="28" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Lượng kinh (ngày)</label>
                            <input type="number" value={luongKinh} onChange={e => setLuongKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="3-5" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Đau bụng kinh</label>
                            <select value={dauBungKinh} onChange={e => setDauBungKinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                <option value="">-- Chọn --</option>
                                <option value="0">Không</option>
                                <option value="1">Có</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Đã lập gia đình</label>
                            <select value={daLapGiaDinh} onChange={e => setDaLapGiaDinh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                <option value="">-- Chọn --</option>
                                <option value="0">Chưa</option>
                                <option value="1">Có</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">PARA (Sản khoa)</label>
                            <input type="text" value={para} onChange={e => setPara(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: 2002" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Có đang dùng BPTT không</label>
                            <select value={dangApDungBpttKhong} onChange={e => setDangApDungBpttKhong(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                <option value="">-- Chọn --</option>
                                <option value="0">Không</option>
                                <option value="1">Có</option>
                            </select>
                        </div>
                        {dangApDungBpttKhong === '1' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Biện pháp tránh thai</label>
                                <select value={bienPhapTranhThai} onChange={e => setBienPhapTranhThai(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                    <option value="">-- Chọn --</option>
                                    <option value="0">Không sử dụng</option>
                                    <option value="1">Vòng tránh thai</option>
                                    <option value="2">Triệt sản nam</option>
                                    <option value="3">Triệt sản nữ</option>
                                    <option value="4">Bao cao su</option>
                                    <option value="5">Thuốc uống tránh thai</option>
                                    <option value="6">Thuốc tiêm tránh thai</option>
                                    <option value="7">Thuốc cấy tránh thai</option>
                                    <option value="8">Biện pháp khác</option>
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Từng mổ sản phụ khoa chưa</label>
                            <select value={daTungMoSanPhuKhoaChua} onChange={e => setDaTungMoSanPhuKhoaChua(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                <option value="">-- Chọn --</option>
                                <option value="0">Chưa từng mổ</option>
                                <option value="1">Có từng mổ</option>
                            </select>
                        </div>
                        {daTungMoSanPhuKhoaChua === '1' && (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Số lần mổ</label>
                                    <input type="number" value={soLanMoSanPhuKhoa} onChange={e => setSoLanMoSanPhuKhoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Ghi rõ nguyên nhân/Vị trí mổ</label>
                                    <input type="text" value={ghiRoMoSanPhuKhoa} onChange={e => setGhiRoMoSanPhuKhoa(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Mổ đẻ lấy thai, u xơ tử cung..." />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            </fieldset>
        </div>
    );
};

export default HistoryTab;
