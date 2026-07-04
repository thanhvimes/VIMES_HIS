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
            {formType === '3' ? (
                <div>
                    <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">II.1. Tiền sử sức khỏe lái xe (Đánh giá Có/Không)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                        {[
                            { label: "Bệnh thần kinh / chấn thương đầu", val: tsThanKinh, set: setTsThanKinh },
                            { label: "Bệnh mắt / giảm thị lực", val: tsMat, set: setTsMat },
                            { label: "Bệnh tai / giảm thính lực / thăng bằng", val: tsTai, set: setTsTai },
                            { label: "Bệnh tim mạch / nhồi máu cơ tim", val: tsTimMach, set: setTsTimMach },
                            { label: "Phẫu thuật tim mạch can thiệp", val: tsPhauThuatTim, set: setTsPhauThuatTim },
                            { label: "Tăng huyết áp", val: tsHuyetAp, set: setTsHuyetAp },
                            { label: "Bệnh phổi / hen / khó thở", val: tsPhoiHen, set: setTsPhoiHen },
                            { label: "Bệnh thận / suy thận / lọc máu", val: tsThan, set: setTsThan },
                            { label: "Đái tháo đường", val: tsTieuDuong, set: setTsTieuDuong },
                            { label: "Bệnh tâm thần", val: tsTamThan, set: setTsTamThan },
                            { label: "Mất ý thức / co giật", val: tsYThuc, set: setTsYThuc },
                            { label: "Ngất / chóng mặt / rối loạn thăng bằng", val: tsChongMat, set: setTsChongMat },
                            { label: "Bệnh đường tiêu hóa nặng", val: tsTieuHoa, set: setTsTieuHoa },
                            { label: "Rối loạn giấc ngủ / ngưng thở khi ngủ", val: tsGiacNgu, set: setTsGiacNgu },
                            { label: "Tai biến mạch máu não", val: tsTaiBien, set: setTsTaiBien },
                            { label: "Tiền sử lạm dụng rượu/bia", val: tsSuDungRuou, set: setTsSuDungRuou },
                            { label: "Tiền sử sử dụng ma túy", val: tsSuDungMaTuy, set: setTsSuDungMaTuy },
                            { label: "Bệnh lý/Chấn thương cột sống", val: tsBenhCotSong, set: setTsBenhCotSong },
                        ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.label}</span>
                                <input type="checkbox" checked={item.val === 1} onChange={e => item.set(e.target.checked ? 1 : 0)} className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : formType !== '2' ? (
                <div>
                    <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">II.1. Lịch sử Tiêm chủng / Vaccine</h4>
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
            ) : null}

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
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Mã bệnh cụ thể (Mã ICD-10 của gia đình)</label>
                            <input type="text" value={tsgdMaBenh} onChange={e => setTsgdMaBenh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="VD: Q21.0, A15..." />
                        </div>
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
                
                {formType === '3' && (
                    <div className="mt-4">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Tên thuốc đang dùng điều trị (đối với lái xe)</label>
                        <input type="text" value={tenThuoc} onChange={e => setTenThuoc(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Ví dụ: Amlodipin 5mg, Metformin 500mg..." />
                    </div>
                )}
                
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

            {/* Tiền sử Sản phụ khoa (Chỉ hiển thị với Nữ) */}
            {gender === 'Nữ' && (
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
