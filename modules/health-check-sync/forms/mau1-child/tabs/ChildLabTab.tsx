import React from 'react';
import { useChildFormContext } from '../ChildFormContext';
import { useSession } from '../../../../../contexts/SessionContext';
import Combobox from '../../../../../components/ui/Combobox';

const ChildLabTab: React.FC = () => {
    const {
        isLocked,
        bloodTestEnabled, setBloodTestEnabled,
        hemoglobin, setHemoglobin,
        glycemia, setGlycemia,
        chiSoHc, setChiSoHc,
        chiSoBachCau, setChiSoBachCau,
        chiSoTieuCau, setChiSoTieuCau,
        ure, setUre,
        creatinin, setCreatinin,
        asatAst, setAsatAst,
        alatAlt, setAlatAlt,
        nuocTieuKhac, setNuocTieuKhac,
        urineTestEnabled, setUrineTestEnabled,
        duongNuocTieu, setDuongNuocTieu,
        proteinNuocTieu, setProteinNuocTieu,
        otherLabTestEnabled, setOtherLabTestEnabled,
        otherLabResult, setOtherLabResult,
        specialtyMetadata,
        setSpecialtyMetadata,
        doctors,
        handleSubmit,
        handleAutofillTab
    } = useChildFormContext();

    const { user } = useSession();

    const safeMetadata = specialtyMetadata || {};
    const labMetadata = { ...(safeMetadata.lab || { doctorId: '', status: 'CHUA_KHAM' }) };
    
    if (!labMetadata.doctorId && user) {
        labMetadata.doctorId = user.userId || '';
        labMetadata.doctorName = user.name || '';
    }

    const doctorsList = doctors || [];

    const handleAction = (action: 'MỞ_KHÁM' | 'DUYỆT' | 'MỞ_KHÓA' | 'THOÁT') => {
        const payload = { ...labMetadata, updatedAt: new Date().toISOString() };
        if (action === 'MỞ_KHÁM') {
            payload.status = 'ĐANG_KHÁM';
            payload.doctorId = user?.userId || '';
            payload.doctorName = user?.name || '';
            setSpecialtyMetadata(prev => ({ ...prev, lab: payload }));
        } else if (action === 'DUYỆT') {
            payload.status = 'ĐÃ_DUYỆT';
            const updatedMetadata = { ...safeMetadata, lab: payload };
            setSpecialtyMetadata(updatedMetadata);
            handleSubmit({ overrideMetadata: updatedMetadata });
        } else if (action === 'MỞ_KHÓA') {
            payload.status = 'ĐANG_KHÁM';
            setSpecialtyMetadata(prev => ({ ...prev, lab: payload }));
        } else if (action === 'THOÁT') {
            payload.status = 'CHUA_KHAM';
            setSpecialtyMetadata(prev => ({ ...prev, lab: payload }));
        }
    };

    const isTabLocked = isLocked || (labMetadata.status !== 'ĐANG_KHÁM' && labMetadata.status !== 'ĐÃ_KHÁM');

    const doctorColumns = [
        { key: 'id', label: 'Mã người dùng', width: '150px' },
        { key: 'name', label: 'Họ tên bác sĩ' }
    ];

    const renderBadge = () => {
        switch (labMetadata.status) {
            case 'ĐANG_KHÁM': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Trạng thái: Đang khám</span>;
            case 'ĐÃ_KHÁM': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-200">Trạng thái: Đã khám</span>;
            case 'ĐÃ_DUYỆT': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Trạng thái: Đã duyệt</span>;
            default: return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Trạng thái: Chưa khám</span>;
        }
    };

    const inputClass = "w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-semibold";

    return (
        <div className="space-y-6">
            {/* Approval Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl mb-4 gap-4">
                <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-[#0f766e] dark:text-teal-400 uppercase tracking-wide">
                        Quy trình phê duyệt Cận lâm sàng
                    </span>
                    {renderBadge()}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500">Bác sĩ duyệt:</label>
                        <Combobox
                            value={labMetadata.doctorId}
                            options={doctorsList}
                            columns={doctorColumns}
                            onChange={(val, item) => {
                                setSpecialtyMetadata(prev => ({
                                    ...prev,
                                    lab: {
                                        ...labMetadata,
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
                    
                    {labMetadata.status === 'CHUA_KHAM' || !labMetadata.status ? (
                        <button
                            type="button"
                            onClick={() => handleAction('MỞ_KHÁM')}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm active:scale-95 transition cursor-pointer"
                        >
                            Nhập KQ
                        </button>
                    ) : (labMetadata.status === 'ĐANG_KHÁM' || labMetadata.status === 'ĐÃ_KHÁM') ? (
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
                        >
                            Mở khóa
                        </button>
                    )}
                </div>
            </div>

            <fieldset disabled={isTabLocked} className="space-y-6">
                {/* 1. XÉT NGHIỆM MÁU */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
                        <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider">
                            1. Xét nghiệm máu (Huyết học & Sinh hóa)
                        </h4>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={bloodTestEnabled}
                                onChange={e => setBloodTestEnabled(e.target.checked)}
                                className="w-4 h-4 text-teal-600 focus:ring-teal-500 rounded border-slate-300"
                            />
                            Có thực hiện xét nghiệm
                        </label>
                    </div>

                    {bloodTestEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Huyết sắc tố (Hemoglobin - g/L)</label>
                                <input type="text" value={hemoglobin} onChange={e => setHemoglobin(e.target.value)} className={inputClass} placeholder="VD: 120" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Đường máu (Glycemia - mmol/L)</label>
                                <input type="text" value={glycemia} onChange={e => setGlycemia(e.target.value)} className={inputClass} placeholder="VD: 5.2" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Số lượng hồng cầu (T/L)</label>
                                <input type="text" value={chiSoHc} onChange={e => setChiSoHc(e.target.value)} className={inputClass} placeholder="VD: 4.2" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Số lượng bạch cầu (G/L)</label>
                                <input type="text" value={chiSoBachCau} onChange={e => setChiSoBachCau(e.target.value)} className={inputClass} placeholder="VD: 6.5" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Số lượng tiểu cầu (G/L)</label>
                                <input type="text" value={chiSoTieuCau} onChange={e => setChiSoTieuCau(e.target.value)} className={inputClass} placeholder="VD: 250" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Ure (mmol/L)</label>
                                <input type="text" value={ure} onChange={e => setUre(e.target.value)} className={inputClass} placeholder="VD: 4.5" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Creatinin (µmol/L)</label>
                                <input type="text" value={creatinin} onChange={e => setCreatinin(e.target.value)} className={inputClass} placeholder="VD: 45" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">AST (ASAT) (U/L)</label>
                                <input type="text" value={asatAst} onChange={e => setAsatAst(e.target.value)} className={inputClass} placeholder="VD: 25" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">ALT (ALAT) (U/L)</label>
                                <input type="text" value={alatAlt} onChange={e => setAlatAlt(e.target.value)} className={inputClass} placeholder="VD: 20" />
                            </div>
                        </div>
                    )}
                </div>

                {/* 2. PHÂN TÍCH NƯỚC TIỂU */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
                        <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider">
                            2. Phân tích nước tiểu cơ bản
                        </h4>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={urineTestEnabled}
                                onChange={e => setUrineTestEnabled(e.target.checked)}
                                className="w-4 h-4 text-teal-600 focus:ring-teal-500 rounded border-slate-300"
                            />
                            Có thực hiện xét nghiệm nước tiểu
                        </label>
                    </div>

                    {urineTestEnabled && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Đường nước tiểu</label>
                                <select value={duongNuocTieu} onChange={e => setDuongNuocTieu(e.target.value)} className={inputClass}>
                                    <option value="Âm tính">Âm tính (-)</option>
                                    <option value="Dương tính">Dương tính (+)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Protein nước tiểu</label>
                                <select value={proteinNuocTieu} onChange={e => setProteinNuocTieu(e.target.value)} className={inputClass}>
                                    <option value="Âm tính">Âm tính (-)</option>
                                    <option value="Dương tính">Dương tính (+)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Khác (tế bào, tinh thể...)</label>
                                <input type="text" value={nuocTieuKhac} onChange={e => setNuocTieuKhac(e.target.value)} className={inputClass} placeholder="Bình thường" />
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. CẬN LÂM SÀNG KHÁC */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-2">
                        <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider">
                            3. Kết quả thăm dò chức năng & Chẩn đoán hình ảnh khác
                        </h4>
                        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={otherLabTestEnabled}
                                onChange={e => setOtherLabTestEnabled(e.target.checked)}
                                className="w-4 h-4 text-teal-600 focus:ring-teal-500 rounded border-slate-300"
                            />
                            Có thực hiện các cận lâm sàng khác
                        </label>
                    </div>

                    {otherLabTestEnabled && (
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Kết quả chi tiết (X-quang, Siêu âm, v.v.)</label>
                            <textarea
                                value={otherLabResult}
                                onChange={e => setOtherLabResult(e.target.value)}
                                rows={3}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                placeholder="Nhập kết quả X-quang phổi, siêu âm ổ bụng nếu có..."
                            />
                        </div>
                    )}
                </div>
            </fieldset>
        </div>
    );
};

export default ChildLabTab;
