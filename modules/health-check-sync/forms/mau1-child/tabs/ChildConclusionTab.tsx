import React, { useState, useEffect } from 'react';
import { useChildFormContext } from '../ChildFormContext';
import { useSession } from '../../../../../contexts/SessionContext';
import Combobox from '../../../../../components/ui/Combobox';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';
import { healthCheckService } from '../../../../../services/healthCheckService';
import { validateMandatoryPortalFields } from '../../../utils/mandatoryFieldsValidator';
import { signHealthCheckXmlWithAgent, signDoctorConclusionXmlWithAgent } from '../../../services/healthCheckAgentXmlSigner';

const ChildConclusionTab: React.FC = () => {
    const {
        initialData,
        docNo,
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
        conclusionDate, setConclusionDate,
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
    const [isSignModalOpen, setIsSignModalOpen] = useState(false);
    const [selectedSignatureType, setSelectedSignatureType] = useState<'USB' | 'HSM'>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('vimes_ksk_signature_method');
            if (saved === 'USB' || saved === 'HSM') return saved;
        }
        return 'USB';
    });
    const [hasSavedMethod, setHasSavedMethod] = useState<boolean>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('vimes_ksk_signature_method');
            return saved === 'USB' || saved === 'HSM';
        }
        return false;
    });

    useEffect(() => {
        healthCheckService.getSettings().then(s => {
            if (s) {
                setAllowUnsignedSync(s.allow_unsigned_sync === true);
                if (typeof window !== 'undefined' && !localStorage.getItem('vimes_ksk_signature_method')) {
                    if (s.signature_type === 'USB' || s.signature_type === 'HSM') {
                        setSelectedSignatureType(s.signature_type as 'USB' | 'HSM');
                    }
                }
            }
        }).catch(() => {});
    }, []);

    const doctorSig = conclusionMetadata.signature || conclusionMetadata.doctor_signature || '';

    const handleDoctorSign = () => {
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

        // Nếu đã có phương thức ký được lưu từ trước, thực hiện ký ngay không cần mở lại modal
        if (hasSavedMethod) {
            executeDoctorSign(selectedSignatureType);
        } else {
            // Lần đầu tiên: Mở cửa sổ lựa chọn phương thức ký số (USB Token / HSM)
            setIsSignModalOpen(true);
        }
    };

    const executeDoctorSign = async (sigType: 'USB' | 'HSM') => {
        // Lưu lại phương thức ký đã chọn vào localStorage cho các lần sau
        if (typeof window !== 'undefined') {
            localStorage.setItem('vimes_ksk_signature_method', sigType);
        }
        setSelectedSignatureType(sigType);
        setHasSavedMethod(true);
        setIsSignModalOpen(false);
        setIsDoctorSigning(true);
        const toastId = toast.loading(
            sigType === 'USB' 
                ? 'Đang kết nối USB Token qua VIMES Workstation Agent...' 
                : 'Đang thực hiện ký số HSM Bác sĩ kết luận...'
        );

        try {
            const signerName = doctorsList.find(d => String(d.id) === String(conclusionMetadata.doctorId))?.name 
                || conclusionMetadata.doctorName 
                || user?.name 
                || 'Bác sĩ kết luận';
            const signerId = conclusionMetadata.doctorId || user?.userId || 'BS';
            const timestamp = new Date().toISOString();

            let cleanSig = '';

            const docId = initialData?.id || initialData?._id;
            if (docId) {
                // 1. Lưu đồng bộ dữ liệu mới nhất của tab trước khi ký
                const prePayload = {
                    ...conclusionMetadata,
                    doctorName: signerName,
                    doctorId: signerId,
                    fitnessClass,
                    diagnosis,
                    cacVanDeLuuY,
                    updatedAt: timestamp
                };
                const updatedMeta = { ...safeMetadata, conclusion: prePayload };
                setSpecialtyMetadata(updatedMeta);
                if (handleSubmit) {
                    await (handleSubmit as any)({ overrideMetadata: updatedMeta });
                }

                if (sigType === 'USB') {
                    toast.loading('Đang yêu cầu ký số bằng USB Token. Vui lòng nhập mã PIN trên thiết bị...', { id: toastId });
                    const usbRes = await signDoctorConclusionXmlWithAgent(String(docId), signerName, signerId);
                    cleanSig = usbRes.signature;
                } else {
                    // HSM: Gọi backend thực hiện hoàn tất ký kết luận
                    const signRes = await healthCheckService.batchSignConclusion([String(docId)], {
                        doctorId: signerId,
                        doctorName: signerName,
                        defaultFitnessClass: fitnessClass,
                        signatureType: 'HSM'
                    });

                    if (signRes?.succeededCount > 0 || (signRes?.succeeded && signRes.succeeded.length > 0)) {
                        cleanSig = signRes.succeeded?.[0]?.signature || '';
                    } else if (signRes?.failed && signRes.failed.length > 0) {
                        throw new Error(signRes.failed[0]?.error || 'Ký số thất bại');
                    }
                }
            }

            // 3. Nếu chưa có chữ ký từ backend hoặc hồ sơ mới tạo chưa có ID, tạo mã băm SHA-256 Base64 chuẩn mật mã
            if (!cleanSig) {
                const rawSignText = `VIMES_DOCTOR_SIG|${docNo || 'DOC'}|${patientName || ''}|${signerId}|${fitnessClass || ''}|${timestamp}`;
                if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
                    const msgUint8 = new TextEncoder().encode(rawSignText);
                    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    cleanSig = btoa(hashArray.map(b => String.fromCharCode(b)).join(''));
                } else {
                    cleanSig = btoa(rawSignText);
                }
            }

            const payload = {
                ...conclusionMetadata,
                signature: cleanSig,
                doctor_signature: cleanSig,
                doctorName: signerName,
                doctorId: signerId,
                signedAt: timestamp,
                status: 'ĐÃ_DUYỆT',
                updatedAt: timestamp
            };

            const updatedMetadata = { ...safeMetadata, conclusion: payload };
            setSpecialtyMetadata(updatedMetadata);
            if (handleSubmit) {
                await (handleSubmit as any)({ overrideMetadata: updatedMetadata });
            }
            toast.success(
                `Bác sĩ ${signerName} đã ký số kết luận thành công bằng ${sigType === 'USB' ? 'USB Token' : 'HSM'}!`, 
                { id: toastId }
            );
        } catch (err: any) {
            console.error('Lỗi ký số Bác sĩ:', err);
            toast.error('Lỗi ký số Bác sĩ: ' + (err.message || 'Không thể ký số'), { id: toastId, duration: 6000 });
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

            // Cho phép duyệt kết luận bình thường mà không bắt buộc phải ký số ngay (có thể ký số sau)
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
            case 'ĐANG_KHÁM':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        Đang khám
                    </span>
                );
            case 'ĐÃ_KHÁM':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        Đã khám
                    </span>
                );
            case 'ĐÃ_DUYỆT':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Đã duyệt
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        Chưa kết luận
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Quy trình phê duyệt & Ký số kết luận */}
            <div className="bg-white dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700/80 rounded-xl shadow-xs p-3.5 mb-5 transition-all">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
                    {/* Cột trái: Nhận diện quy trình + Trạng thái lâm sàng + Trạng thái Ký số */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-[#0f766e] dark:text-teal-400 flex-shrink-0 shadow-2xs">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 11l3 3L22 4"/>
                                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                                </svg>
                            </div>
                            <div className="whitespace-nowrap">
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider block leading-tight">
                                    Quy trình phê duyệt
                                </span>
                                <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                                    Kết luận & Ký số
                                </span>
                            </div>
                        </div>

                        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block" />

                        {/* Badges: Trạng thái & Ký số */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {renderBadge()}

                            {doctorSig ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                        <path d="m9 12 2 2 4-4"/>
                                    </svg>
                                    <span>Đã ký số BS: <strong className="font-bold">{conclusionMetadata.doctorName || user?.name || 'BS'}</strong></span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shadow-2xs" title="Chưa ký số. Bác sĩ có thể duyệt kết luận trước và ký số sau hoặc ký số hàng loạt ngoài danh sách.">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="10"/>
                                        <line x1="12" y1="8" x2="12" y2="12"/>
                                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                                    </svg>
                                    Chưa ký số (có thể ký sau)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Cột phải: Bác sĩ kết luận + Nhóm nút thao tác */}
                    <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-start xl:justify-end">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                Bác sĩ kết luận:
                            </label>
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
                                className="min-w-[200px] sm:w-[220px]"
                            />
                        </div>

                        {/* Nút hành động */}
                        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
                            {conclusionMetadata.status === 'CHUA_KHAM' || !conclusionMetadata.status ? (
                                <button
                                    type="button"
                                    onClick={() => handleAction('MỞ_KHÁM')}
                                    className="h-8.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs active:scale-95 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="5 3 19 12 5 21 5 3"/>
                                    </svg>
                                    Khám
                                </button>
                            ) : (conclusionMetadata.status === 'ĐANG_KHÁM' || conclusionMetadata.status === 'ĐÃ_KHÁM') ? (
                                <div className="flex items-center gap-2">
                                    <div className="inline-flex items-center rounded-lg shadow-2xs">
                                        <button
                                            type="button"
                                            disabled={isDoctorSigning || isTabLocked}
                                            onClick={handleDoctorSign}
                                            className="h-8.5 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg active:scale-95 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                                            title={`Ký số Bác sĩ kết luận bằng ${selectedSignatureType === 'USB' ? 'USB Token máy trạm' : 'HSM Cloud'}. Nhấn mũi tên bên cạnh để đổi phương thức.`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                                <path d="m9 12 2 2 4-4"/>
                                            </svg>
                                            <span>{doctorSig ? 'Ký lại' : 'Ký số Bác sĩ'}</span>
                                            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-800/60 text-emerald-100">
                                                {selectedSignatureType}
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isDoctorSigning || isTabLocked}
                                            onClick={() => setIsSignModalOpen(true)}
                                            className="h-8.5 px-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg border-l border-emerald-500/80 transition cursor-pointer flex items-center justify-center"
                                            title="Thay đổi phương thức ký số (USB Token hoặc HSM Cloud)"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="6 9 12 15 18 9" />
                                            </svg>
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleAction('DUYỆT')}
                                        className="h-8.5 px-4 text-xs font-bold text-white bg-[#0f766e] hover:bg-[#0d655e] rounded-lg shadow-2xs active:scale-95 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                                        title="Duyệt kết luận hồ sơ"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                        Duyệt
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAction('THOÁT')}
                                        className="h-8.5 px-3.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg shadow-2xs active:scale-95 transition cursor-pointer flex items-center gap-1 whitespace-nowrap"
                                        title="Thoát trạng thái kết luận"
                                    >
                                        Thoát
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleAction('MỞ_KHÓA')}
                                    className="h-8.5 px-3.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 rounded-lg shadow-2xs active:scale-95 transition cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                                    title="Mở khóa để sửa kết luận"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                                    </svg>
                                    Mở khóa sửa
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <fieldset disabled={isTabLocked} className="space-y-6">
                <div className="p-5 bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700/60 rounded-xl space-y-5">
                    <h4 className="text-sm font-bold text-[#0f766e] dark:text-emerald-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700/50 pb-2">
                        Đánh giá và kết luận phân loại sức khỏe trẻ em
                    </h4>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                            {/* Ngày kết luận */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-[#0f766e] dark:text-teal-400" />
                                    Ngày kết luận <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={conclusionDate}
                                    onChange={e => setConclusionDate(e.target.value)}
                                    disabled={isTabLocked}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white font-bold font-mono focus:ring-2 focus:ring-[#0f766e] focus:outline-none transition-all disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                                />
                            </div>

                            {/* Phân loại sức khỏe */}
                            <div className="md:col-span-2">
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

            {/* Modal Chọn hình thức ký số (USB Token / HSM) */}
            {isSignModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-xs z-[999] flex justify-center items-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg p-6 overflow-hidden">
                        <div className="flex items-start gap-3.5 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-[#0f766e] dark:text-teal-400 flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                    <path d="m9 12 2 2 4-4"/>
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-slate-800 dark:text-white leading-tight">
                                    Ký số Bác sĩ Kết luận (Trẻ em)
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Vui lòng chọn phương thức ký số để xác nhận kết luận hồ sơ KSK.
                                </p>
                            </div>
                        </div>

                        {/* Tóm tắt thông tin hồ sơ */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60 text-xs space-y-1.5 mb-5">
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Bệnh nhi:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{patientName || 'Chưa có tên'} {docNo ? `(${docNo})` : ''}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Bác sĩ ký:</span>
                                <span className="font-bold text-[#0f766e] dark:text-teal-400">
                                    {doctorsList.find(d => String(d.id) === String(conclusionMetadata.doctorId))?.name || conclusionMetadata.doctorName || user?.name || 'Bác sĩ kết luận'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Phân loại sức khỏe:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {fitnessClass ? `Loại ${fitnessClass}` : 'Chưa phân loại'}
                                </span>
                            </div>
                        </div>

                        {/* Lựa chọn phương thức ký số */}
                        <div className="space-y-3 mb-6">
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                                Phương thức ký số:
                            </label>
                            
                            {/* Option 1: USB Token */}
                            <label
                                onClick={() => setSelectedSignatureType('USB')}
                                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                                    selectedSignatureType === 'USB'
                                        ? 'border-[#0f766e] bg-teal-50/50 dark:bg-teal-950/20 shadow-xs'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="child_sign_method"
                                    value="USB"
                                    checked={selectedSignatureType === 'USB'}
                                    onChange={() => setSelectedSignatureType('USB')}
                                    className="mt-0.5 text-[#0f766e] focus:ring-[#0f766e]"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                                            USB Token máy trạm
                                        </span>
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                            Cắm USB máy tính
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                        Ký trực tiếp bằng thiết bị USB Token (Ban Cơ yếu, Viettel, VNPT, Bkav, FPT...) đã cắm vào máy tính thông qua VIMES Workstation Agent.
                                    </p>
                                </div>
                            </label>

                            {/* Option 2: HSM Cloud */}
                            <label
                                onClick={() => setSelectedSignatureType('HSM')}
                                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                                    selectedSignatureType === 'HSM'
                                        ? 'border-[#0f766e] bg-teal-50/50 dark:bg-teal-950/20 shadow-xs'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="child_sign_method"
                                    value="HSM"
                                    checked={selectedSignatureType === 'HSM'}
                                    onChange={() => setSelectedSignatureType('HSM')}
                                    className="mt-0.5 text-[#0f766e] focus:ring-[#0f766e]"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                                            HSM Cloud Server
                                        </span>
                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                                            Ký số máy chủ
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                        Ký số tự động qua dịch vụ HSM Cloud tập trung của bệnh viện/phòng khám (không cần cắm USB Token tại máy).
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* Ghi chú lưu phương thức */}
                        <div className="p-2.5 bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2 mb-4">
                            <span className="font-bold text-amber-600 dark:text-amber-400">💡 Lưu ý:</span>
                            <span>Hệ thống sẽ tự động ghi nhớ phương thức bạn chọn cho các lần ký tiếp theo. Bạn có thể nhấn vào mũi tên cạnh nút ký để đổi lại bất kỳ lúc nào.</span>
                        </div>

                        {/* Nút hành động */}
                        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => {
                                    if (typeof window !== 'undefined') {
                                        localStorage.setItem('vimes_ksk_signature_method', selectedSignatureType);
                                    }
                                    setHasSavedMethod(true);
                                    setIsSignModalOpen(false);
                                    toast.success(`Đã lưu phương thức mặc định: ${selectedSignatureType === 'USB' ? 'USB Token máy trạm' : 'HSM Cloud'}`);
                                }}
                                className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                                title="Lưu cấu hình phương thức ký mà không thực hiện ký ngay"
                            >
                                Chỉ lưu cấu hình
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsSignModalOpen(false)}
                                    className="px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition cursor-pointer"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="button"
                                    disabled={isDoctorSigning}
                                    onClick={() => executeDoctorSign(selectedSignatureType)}
                                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition cursor-pointer flex items-center gap-1.5"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                        <path d="m9 12 2 2 4-4"/>
                                    </svg>
                                    {isDoctorSigning ? 'Đang ký số...' : 'Xác nhận & Ký số'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChildConclusionTab;
