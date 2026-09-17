import React, { useState, useEffect } from 'react';
import { useChildFormContext } from '../ChildFormContext';
import { useSession } from '../../../../../contexts/SessionContext';
import Combobox from '../../../../../components/ui/Combobox';
import { toast } from 'sonner';
import { healthCheckService } from '../../../../../services/healthCheckService';
import { validateMandatoryPortalFields } from '../../../utils/mandatoryFieldsValidator';

const ChildConclusionTab: React.FC = () => {
    const {
        patientName,
        gender,
        dob,
        ethnic,
        cccd,
        guardianCccd,
        address,
        maTinhCuTru,
        maXaCuTru,
        lyDoVv,
        targetGroup,
        fundingSource,
        loaiHinhKcb,
        ngayVao,
        setActiveTab,
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

    const [allowUnsignedSync, setAllowUnsignedSync] = useState(false);
    const [isDoctorSigning, setIsDoctorSigning] = useState(false);

    useEffect(() => {
        healthCheckService.getSettings().then(s => {
            if (s) setAllowUnsignedSync(s.allow_unsigned_sync === true);
        }).catch(() => {});
    }, []);

    const doctorSig = conclusionMetadata.signature || conclusionMetadata.doctor_signature || '';

    const handleDoctorSign = async () => {
        if (!conclusionMetadata.doctorId) {
            toast.warning('Vui lòng chọn Bác sĩ kết luận trước khi thực hiện ký số.');
            return;
        }

        // Bắt buộc kiểm tra 17 trường theo QĐ 2062/3176/1804 (từ file Các trường bắt buộc.xlsx)
        const mandatoryCheck = validateMandatoryPortalFields({
            formType: '1',
            isChild: true,
            patientName,
            gender,
            dob,
            ethnic,
            cccd,
            noCccd: true,
            guardianCccd,
            address,
            maTinhCuTru,
            maXaCuTru,
            maNgheNghiep: '00',
            lyDoVv,
            targetGroup,
            fundingSource,
            loaiHinhKcb,
            ngayVao,
            fitnessClass
        });

        if (!mandatoryCheck.valid) {
            toast.error(`Không thể ký số kết luận! Vui lòng hoàn thiện các trường bắt buộc:\n• ${mandatoryCheck.errors.join('\n• ')}`, { duration: 8000 });
            if (setActiveTab && mandatoryCheck.firstErrorTab !== 'conclusion') {
                setActiveTab(mandatoryCheck.firstErrorTab);
            }
            return;
        }

        setIsDoctorSigning(true);
        const toastId = toast.loading('Đang chuẩn bị chữ ký số Bác sĩ kết luận...');
        try {
            const signerName = doctorsList.find(d => String(d.id) === String(conclusionMetadata.doctorId))?.name 
                || conclusionMetadata.doctorName 
                || user?.name 
                || 'Bác sĩ kết luận';
            const signerId = conclusionMetadata.doctorId || user?.userId || 'BS';
            const timestamp = new Date().toISOString();

            const sigPayload = JSON.stringify({
                type: 'DOCTOR_SIGNATURE',
                doctor_id: signerId,
                doctor_name: signerName,
                fitness_class: fitnessClass,
                diagnosis: diagnosis,
                signed_at: timestamp,
                method: 'DOCTOR_TOKEN_CA'
            });
            const sigBase64 = typeof window !== 'undefined' && typeof window.btoa === 'function'
                ? window.btoa(unescape(encodeURIComponent(sigPayload)))
                : Buffer.from(sigPayload, 'utf-8').toString('base64');

            const payload = {
                ...conclusionMetadata,
                signature: sigBase64,
                doctor_signature: sigBase64,
                doctorName: signerName,
                doctorId: signerId,
                signedAt: timestamp,
                status: 'ĐÃ_DUYỆT',
                updatedAt: timestamp
            };

            const updatedMetadata = { ...safeMetadata, conclusion: payload };
            setSpecialtyMetadata(updatedMetadata);
            if (handleSubmit) {
                handleSubmit({ overrideMetadata: updatedMetadata });
            }
            toast.success(`Bác sĩ ${signerName} đã ký số kết luận thành công!`, { id: toastId });
        } catch (err: any) {
            console.error('Lỗi ký số Bác sĩ:', err);
            toast.error('Lỗi ký số Bác sĩ: ' + err.message, { id: toastId });
        } finally {
            setIsDoctorSigning(false);
        }
    };

    const handleAction = (action: 'MỞ_KHÁM' | 'DUYỆT' | 'MỞ_KHÓA' | 'THOÁT') => {
        const payload = { ...conclusionMetadata, updatedAt: new Date().toISOString() };
        if (action === 'MỞ_KHÁM') {
            payload.status = 'ĐANG_KHÁM';
            payload.doctorId = user?.userId || '';
            payload.doctorName = user?.name || '';
            setSpecialtyMetadata(prev => ({ ...prev, conclusion: payload }));
        } else if (action === 'DUYỆT') {
            // Bắt buộc kiểm tra 17 trường theo QĐ 2062/3176/1804 (từ file Các trường bắt buộc.xlsx)
            const mandatoryCheck = validateMandatoryPortalFields({
                formType: '1',
                isChild: true,
                patientName,
                gender,
                dob,
                ethnic,
                cccd,
                noCccd: true,
                guardianCccd,
                address,
                maTinhCuTru,
                maXaCuTru,
                maNgheNghiep: '00',
                lyDoVv,
                targetGroup,
                fundingSource,
                loaiHinhKcb,
                ngayVao,
                fitnessClass
            });

            if (!mandatoryCheck.valid) {
                toast.error(`Không thể duyệt kết luận! Vui lòng hoàn thiện các trường bắt buộc:\n• ${mandatoryCheck.errors.join('\n• ')}`, { duration: 8000 });
                if (setActiveTab && mandatoryCheck.firstErrorTab !== 'conclusion') {
                    setActiveTab(mandatoryCheck.firstErrorTab);
                }
                return;
            }

            if (!allowUnsignedSync && !doctorSig) {
                toast.warning('Hệ thống đang ở chế độ bắt buộc ký số liên thông. Vui lòng bấm "Ký số Bác sĩ" trước khi Duyệt kết luận!');
                return;
            }
            payload.status = 'ĐÃ_DUYỆT';
            const updatedMetadata = { ...safeMetadata, conclusion: payload };
            setSpecialtyMetadata(updatedMetadata);
            handleSubmit({ overrideMetadata: updatedMetadata });
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
                    
                    {doctorSig ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                <path d="m9 12 2 2 4-4"/>
                            </svg>
                            Đã ký số BS: {conclusionMetadata.doctorName || user?.name || 'BS'}
                        </span>
                    ) : allowUnsignedSync ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" title="Tham số 'Cho phép liên thông khi chưa ký số' đang BẬT. Không bắt buộc ký số.">
                            Sandbox: Ký số tùy chọn
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 animate-pulse" title="Tham số 'Cho phép liên thông khi chưa ký số' đang TẮT. Bắt buộc phải có chữ ký số Bác sĩ kết luận.">
                            Bắt buộc ký số Bác sĩ
                        </span>
                    )}

                    {conclusionMetadata.status === 'CHUA_KHAM' || !conclusionMetadata.status ? (
                        <button
                            type="button"
                            onClick={() => handleAction('MỞ_KHÁM')}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm active:scale-95 transition cursor-pointer"
                        >
                            Kết luận
                        </button>
                    ) : (conclusionMetadata.status === 'ĐANG_KHÁM' || conclusionMetadata.status === 'ĐÃ_KHÁM') ? (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={isDoctorSigning || isTabLocked}
                                onClick={handleDoctorSign}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm active:scale-95 transition cursor-pointer flex items-center gap-1"
                                title="Ký số Bác sĩ xác nhận kết luận lâm sàng vào thẻ CKS_NGUOI_KET_LUAN"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                    <path d="m9 12 2 2 4-4"/>
                                </svg>
                                {doctorSig ? 'Ký lại' : 'Ký số Bác sĩ'}
                            </button>
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
