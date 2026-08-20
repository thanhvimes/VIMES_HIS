import React from 'react';
import { useChildFormContext } from '../ChildFormContext';
import { useSession } from '../../../../../contexts/SessionContext';
import Combobox from '../../../../../components/ui/Combobox';

const ChildHistoryTab: React.FC = () => {
    const {
        isLocked,
        height, setHeight,
        weight, setWeight,
        bmi,
        pulse, setPulse,
        nhietDo, setNhietDo,
        nhipTho, setNhipTho,
        gioKham, setGioKham,
        lyDoVv, setLyDoVv,
        loaiHinhKcb, setLoaiHinhKcb,
        dgDhstNhietDo, setDgDhstNhietDo,
        dgDhstMach, setDgDhstMach,
        dgDhstNhipTho, setDgDhstNhipTho,
        tsBanThan, setTsBanThan,
        tsGiaDinh, setTsGiaDinh,
        tsbtNghienRuou, setTsbtNghienRuou,
        tsbtMaBenhKhac, setTsbtMaBenhKhac,
        tsTiepXucLao, setTsTiepXucLao,
        maGtinCskcb,
        initialData,
        specialtyMetadata,
        setSpecialtyMetadata,
        doctors,
        handleSubmit,
        handleAutofillTab,
        cacVanDeLuuY
    } = useChildFormContext();

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
            setSpecialtyMetadata(prev => ({ ...prev, history: payload }));
        } else if (action === 'DUYỆT') {
            payload.status = 'ĐÃ_DUYỆT';
            setSpecialtyMetadata(prev => {
                const updated = { ...prev, history: payload };
                setTimeout(() => {
                    handleSubmit();
                }, 100);
                return updated;
            });
        } else if (action === 'MỞ_KHÓA') {
            payload.status = 'ĐANG_KHÁM';
            setSpecialtyMetadata(prev => ({ ...prev, history: payload }));
        } else if (action === 'THOÁT') {
            payload.status = 'CHUA_KHAM';
            setSpecialtyMetadata(prev => ({ ...prev, history: payload }));
        }
    };

    const isTabLocked = isLocked || (historyMetadata.status !== 'ĐANG_KHÁM' && historyMetadata.status !== 'ĐÃ_KHÁM');

    const doctorColumns = [
        { key: 'id', label: 'Mã người dùng', width: '150px' },
        { key: 'name', label: 'Họ tên bác sĩ' }
    ];

    const renderBadge = () => {
        switch (historyMetadata.status) {
            case 'ĐANG_KHÁM': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Trạng thái: Đang khám</span>;
            case 'ĐÃ_KHÁM': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-200">Trạng thái: Đã khám</span>;
            case 'ĐÃ_DUYỆT': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Trạng thái: Đã duyệt</span>;
            default: return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Trạng thái: Chưa khám</span>;
        }
    };

    // Vitals range check for child
    const hasNoNote = !cacVanDeLuuY || !cacVanDeLuuY.trim();
    const heightVal = parseFloat(height || '');
    const isHeightAbnormal = !isNaN(heightVal) && (heightVal < 45 || heightVal > 120);

    const weightVal = parseFloat(weight || '');
    const isWeightAbnormal = !isNaN(weightVal) && (weightVal < 2 || weightVal > 30);

    const tempVal = parseFloat(nhietDo || '');
    const isTempAbnormal = !isNaN(tempVal) && (tempVal < 36.5 || tempVal > 37.5);

    const pulseVal = parseInt(pulse || '');
    const isPulseAbnormal = !isNaN(pulseVal) && (pulseVal < 70 || pulseVal > 150);

    const rrVal = parseInt(nhipTho || '');
    const isRrAbnormal = !isNaN(rrVal) && (rrVal < 20 || rrVal > 45);

    return (
        <div className="space-y-6">
            {/* Approval Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl mb-4 gap-4">
                <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-[#0f766e] dark:text-teal-400 uppercase tracking-wide">
                        Quy trình phê duyệt Thông tin khám
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
                        onClick={handleAutofillTab}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-[#0f766e] dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow active:scale-95"
                    >
                        Điền nhanh kết quả mặc định (Thông tin khám)
                    </button>
                </div>
            )}

            <fieldset disabled={isTabLocked} className="space-y-6">
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
                                    value={initialData?.created_at ? new Date(initialData.created_at).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')}
                                    disabled
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-100 dark:bg-slate-700/40 text-slate-800 dark:text-white font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Giờ khám</label>
                                <input
                                    type="text"
                                    value={gioKham}
                                    onChange={e => setGioKham(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-mono font-bold"
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100 dark:border-slate-700/30 pb-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Chiều cao/Chiều dài (cm)</label>
                                <input
                                    type="text"
                                    value={height}
                                    onChange={e => setHeight(e.target.value)}
                                    className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold ${isHeightAbnormal && hasNoNote ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`}
                                    placeholder="Chiều dài/Chiều cao"
                                />
                                {isHeightAbnormal && hasNoNote && (
                                    <p className="text-red-500 text-[10px] font-bold mt-1">⚠️ Cần ghi chú giải trình ở tab Kết Luận</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Cân nặng (kg)</label>
                                <input
                                    type="text"
                                    value={weight}
                                    onChange={e => setWeight(e.target.value)}
                                    className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold ${isWeightAbnormal && hasNoNote ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`}
                                    placeholder="Cân nặng"
                                />
                                {isWeightAbnormal && hasNoNote && (
                                    <p className="text-red-500 text-[10px] font-bold mt-1">⚠️ Cần ghi chú giải trình ở tab Kết Luận</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Chỉ số BMI</label>
                                <input
                                    type="text"
                                    value={bmi}
                                    disabled
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-300 font-bold"
                                    placeholder="BMI tự động..."
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
                                        className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold ${isTempAbnormal && hasNoNote ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`}
                                        placeholder="Nhiệt độ"
                                    />
                                    {isTempAbnormal && hasNoNote && (
                                        <p className="text-red-500 text-[10px] font-bold mt-1">⚠️ Cần ghi chú giải trình ở tab Kết Luận</p>
                                    )}
                                </div>
                                <div className="lg:col-span-7">
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
                                        className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold ${isPulseAbnormal && hasNoNote ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`}
                                        placeholder="Mạch (lần/phút)"
                                    />
                                    {isPulseAbnormal && hasNoNote && (
                                        <p className="text-red-500 text-[10px] font-bold mt-1">⚠️ Cần ghi chú giải trình ở tab Kết Luận</p>
                                    )}
                                </div>
                                <div className="lg:col-span-7">
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
                                        className={`w-full p-2.5 border rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold ${isRrAbnormal && hasNoNote ? 'border-red-500 bg-red-50/50' : 'border-slate-300 dark:border-slate-600'}`}
                                        placeholder="Nhịp thở"
                                    />
                                    {isRrAbnormal && hasNoNote && (
                                        <p className="text-red-500 text-[10px] font-bold mt-1">⚠️ Cần ghi chú giải trình ở tab Kết Luận</p>
                                    )}
                                </div>
                                <div className="lg:col-span-7">
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

                    {/* TIỀN SỬ */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-4 shadow-sm">
                        <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 pb-2">Tiền sử</h4>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Tiền sử bản thân (ghi rõ nếu có)</label>
                                <textarea
                                    value={tsBanThan}
                                    onChange={e => setTsBanThan(e.target.value)}
                                    rows={3}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                    placeholder="Mô tả tiền sử bản thân của trẻ..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Tiền sử gia đình (ghi rõ nếu có)</label>
                                <textarea
                                    value={tsGiaDinh}
                                    onChange={e => setTsGiaDinh(e.target.value)}
                                    rows={3}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                    placeholder="Mô tả tiền sử bệnh lý gia đình..."
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Tiền sử nghiện rượu, bia</label>
                                    <select value={tsbtNghienRuou} onChange={e => setTsbtNghienRuou(e.target.value)} disabled={isTabLocked} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white">
                                        <option value="">-- Chưa ghi nhận --</option><option value="0">Không</option><option value="1">Có</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Bệnh khác (mã ICD-10)</label>
                                    <input value={tsbtMaBenhKhac} onChange={e => setTsbtMaBenhKhac(e.target.value)} disabled={isTabLocked} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white" placeholder="Nhiều mã phân cách bằng dấu ;" />
                                </div>
                            </div>

                            {/* Tiền sử tiếp xúc người bệnh lao */}
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
                </div>
            </fieldset>
        </div>
    );
};

export default ChildHistoryTab;
