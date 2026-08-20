import React from 'react';
import { useChildFormContext } from '../ChildFormContext';
import { useSession } from '../../../../../contexts/SessionContext';
import Combobox from '../../../../../components/ui/Combobox';

const ChildConclusionTab: React.FC = () => {
    const {
        isLocked,
        fitnessClass, setFitnessClass,
        diagnosis, setDiagnosis,
        cacVanDeLuuY, setCacVanDeLuuY,
        specialtyMetadata, setSpecialtyMetadata,
        doctors,
        handleSubmit,
        handleAutofillTab
    } = useChildFormContext();

    const { user } = useSession();

    const safeMetadata = specialtyMetadata || {};
    const conclusionMetadata = { ...(safeMetadata.conclusion || { doctorId: '', status: 'CHUA_KHAM' }) };
    
    if (!conclusionMetadata.doctorId && user) {
        conclusionMetadata.doctorId = user.userId || '';
        conclusionMetadata.doctorName = user.name || '';
    }

    const doctorsList = doctors || [];

    const handleAction = (action: 'MỞ_KHÁM' | 'DUYỆT' | 'MỞ_KHÓA' | 'THOÁT') => {
        const payload = { ...conclusionMetadata, updatedAt: new Date().toISOString() };
        if (action === 'MỞ_KHÁM') {
            payload.status = 'ĐANG_KHÁM';
            payload.doctorId = user?.userId || '';
            payload.doctorName = user?.name || '';
            setSpecialtyMetadata(prev => ({ ...prev, conclusion: payload }));
        } else if (action === 'DUYỆT') {
            payload.status = 'ĐÃ_DUYỆT';
            setSpecialtyMetadata(prev => {
                const updated = { ...prev, conclusion: payload };
                setTimeout(() => {
                    handleSubmit();
                }, 100);
                return updated;
            });
        } else if (action === 'MỞ_KHÓA') {
            payload.status = 'ĐANG_KHÁM';
            setSpecialtyMetadata(prev => ({ ...prev, conclusion: payload }));
        } else if (action === 'THOÁT') {
            payload.status = 'CHUA_KHAM';
            setSpecialtyMetadata(prev => ({ ...prev, conclusion: payload }));
        }
    };

    const isTabLocked = isLocked || (conclusionMetadata.status !== 'ĐANG_KHÁM' && conclusionMetadata.status !== 'ĐÃ_KHÁM');

    const doctorColumns = [
        { key: 'id', label: 'Mã người dùng', width: '150px' },
        { key: 'name', label: 'Họ tên bác sĩ' }
    ];

    const renderBadge = () => {
        switch (conclusionMetadata.status) {
            case 'ĐANG_KHÁM': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Trạng thái: Đang khám</span>;
            case 'ĐÃ_KHÁM': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-200">Trạng thái: Đã khám</span>;
            case 'ĐÃ_DUYỆT': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Trạng thái: Đã duyệt</span>;
            default: return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Trạng thái: Chưa khám</span>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Approval Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl mb-4 gap-4">
                <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-[#0f766e] dark:text-teal-400 uppercase tracking-wide">
                        Quy trình phê duyệt Kết luận cuối cùng
                    </span>
                    {renderBadge()}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-slate-500">Bác sĩ kết luận:</label>
                        <Combobox
                            value={conclusionMetadata.doctorId}
                            options={doctorsList}
                            columns={doctorColumns}
                            onChange={(val, item) => {
                                setSpecialtyMetadata(prev => ({
                                    ...prev,
                                    conclusion: {
                                        ...conclusionMetadata,
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
                    
                    {conclusionMetadata.status === 'CHUA_KHAM' || !conclusionMetadata.status ? (
                        <button
                            type="button"
                            onClick={() => handleAction('MỞ_KHÁM')}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm active:scale-95 transition cursor-pointer"
                        >
                            Kết luận
                        </button>
                    ) : (conclusionMetadata.status === 'ĐANG_KHÁM' || conclusionMetadata.status === 'ĐÃ_KHÁM') ? (
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => handleAction('DUYỆT')}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 shadow-sm active:scale-95 transition cursor-pointer"
                            >
                                Duyệt &amp; Ký số
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
                            Mở khóa sửa
                        </button>
                    )}
                </div>
            </div>

            <fieldset disabled={isTabLocked} className="space-y-6">
                <div className="p-5 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-5">
                    <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 pb-2">
                        Đánh giá và kết luận phân loại sức khỏe trẻ em
                    </h4>

                    <div className="space-y-4">
                        {/* Phân loại sức khỏe */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-2">Phân loại sức khỏe</label>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Loại I (Rất khỏe)', value: '1' },
                                    { label: 'Loại II (Khỏe)', value: '2' },
                                    { label: 'Loại III (Trung bình)', value: '3' },
                                    { label: 'Loại IV (Yếu)', value: '4' },
                                    { label: 'Loại V (Rất yếu)', value: '5' }
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        disabled={isTabLocked}
                                        onClick={() => setFitnessClass(opt.value)}
                                        className={`px-4 py-2 text-xs font-bold border rounded-lg transition-all cursor-pointer ${
                                            fitnessClass === opt.value
                                                ? 'bg-[#0f766e] border-[#0f766e] text-white shadow-sm'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Các bệnh tật chẩn đoán */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Các bệnh tật, dị tật phát hiện (nếu có)</label>
                            <textarea
                                value={diagnosis}
                                onChange={e => setDiagnosis(e.target.value)}
                                rows={3}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                placeholder="Ghi nhận các dị tật bẩm sinh hoặc bệnh lý phát hiện qua quá trình khám lâm sàng và cận lâm sàng..."
                            />
                        </div>

                        {/* Các vấn đề lưu ý */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Các vấn đề cần lưu ý, theo dõi &amp; hướng dẫn chăm sóc</label>
                            <textarea
                                value={cacVanDeLuuY}
                                onChange={e => setCacVanDeLuuY(e.target.value)}
                                rows={3}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                                placeholder="VD: Khám chuyên khoa mắt/răng hàm mặt sau 3 tháng, bổ sung kẽm/D3..."
                            />
                        </div>
                    </div>
                </div>
            </fieldset>
        </div>
    );
};

export default ChildConclusionTab;
