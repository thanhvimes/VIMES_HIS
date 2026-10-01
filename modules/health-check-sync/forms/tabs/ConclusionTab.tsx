import React, { useState, useEffect, useMemo } from 'react';
import { useDynamicFormContext } from '../DynamicFormContext';
import Combobox from '../../../../components/ui/Combobox';
import { useSession } from '../../../../contexts/SessionContext';
import { ICD10MultiSelect } from '../../components/ICD10MultiSelect';
import { toast } from 'sonner';
import { healthCheckService } from '../../../../services/healthCheckService';
import { validateMandatoryPortalFields } from '../../utils/mandatoryFieldsValidator';
import { getClinicalCrossCheckWarnings } from '../../utils/clinicalCrossCheck';

const doctorColumns = [
    { key: 'id', label: 'Mã người dùng (su_userid)', width: '180px' },
    { key: 'name', label: 'Họ tên bác sĩ' }
];

const ConclusionTab: React.FC = () => {
    const {
        formType,
        initialData,
        docNo,
        patientName,
        gender,
        dob,
        ethnic,
        cccd,
        noCccd,
        address,
        maTinhCuTru,
        maXaCuTru,
        maNgheNghiep,
        lyDoVv,
        maCskcb,
        maGtinCskcb,
        targetGroup,
        fundingSource,
        loaiHinhKcb,
        ngayVao,
        setActiveTab,
        fitnessClass,
        setFitnessClass,
        diagnosis,
        setDiagnosis,
        cacVanDeLuuY,
        setCacVanDeLuuY,
        cacBenhTatNeuCo,
        setCacBenhTatNeuCo,
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
        specialtyMetadata,
        setSpecialtyMetadata,
        handleSubmit,
        quanLyBenh,
        setQuanLyBenh,
        theoDoiTai,
        setTheoDoiTai,
        chuyenTuyen,
        setChuyenTuyen,
        height,
        weight,
        bp,
        pulse,
        bmi,
        isChild,
    } = useDynamicFormContext();

    const { user } = useSession();

    // Đối chiếu sinh hiệu và chuyên khoa lâm sàng với phân loại sức khỏe chung
    const crossCheck = useMemo(() => {
        return getClinicalCrossCheckWarnings({
            height,
            weight,
            bp,
            pulse,
            bmi,
            fitnessClass,
            isChild,
            specialtiesPl: {
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
            }
        });
    }, [
        height, weight, bp, pulse, bmi, fitnessClass, isChild,
        khamTheLucPl, noiKhoaTuanHoanPl, noiKhoaHoHapPl, noiKhoaTieuHoaPl,
        noiKhoaThanTietnieuPl, noiKhoaNoiTietPl, noiKhoaCoXuongKhopPl,
        noiKhoaThanKinhPl, noiKhoaTamThanPl, khamNgoaiKhoaPl, khamDaLieuPl,
        khamSanPhuKhoaPl, khamMatPl, khamTaiMuiHongPl, khamRangHamMatPl
    ]);

    const [showSoftWarningConfirm, setShowSoftWarningConfirm] = useState(false);
    const [pendingApproveAction, setPendingApproveAction] = useState<(() => void) | null>(null);

    const safeMetadata = specialtyMetadata || {};
    const conclusionMetadata = { ...(safeMetadata.conclusion || { doctorId: conclusionDoctorId || '', status: 'CHUA_KHAM' }) };
    
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
            formType,
            patientName,
            gender,
            dob,
            ethnic,
            cccd,
            noCccd,
            address,
            maTinhCuTru,
            maXaCuTru,
            maNgheNghiep,
            lyDoVv,
            maCskcb,
            maGtinCskcb,
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
        const toastId = toast.loading('Đang thực hiện ký số Bác sĩ kết luận...');
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
                    cacBenhTatNeuCo,
                    updatedAt: timestamp
                };
                const updatedMeta = { ...safeMetadata, conclusion: prePayload };
                setSpecialtyMetadata(updatedMeta);
                if (handleSubmit) {
                    await (handleSubmit as any)({ overrideMetadata: updatedMeta });
                }

                // 2. Gọi backend thực hiện quy trình ký số 2 cấp độ (Two-Tier Signer Step 1)
                const signRes = await healthCheckService.batchSignConclusion([String(docId)], {
                    doctorId: signerId,
                    doctorName: signerName,
                    defaultFitnessClass: fitnessClass
                });

                if (signRes?.succeededCount > 0 || (signRes?.succeeded && signRes.succeeded.length > 0)) {
                    cleanSig = signRes.succeeded?.[0]?.signature || '';
                } else if (signRes?.failed && signRes.failed.length > 0) {
                    throw new Error(signRes.failed[0]?.error || 'Ký số thất bại');
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

            const updated = {
                ...safeMetadata,
                conclusion: payload
            };
            setSpecialtyMetadata(updated);
            if (handleSubmit) {
                await (handleSubmit as any)({ overrideMetadata: updated });
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
            
            const updated = {
                ...safeMetadata,
                conclusion: payload
            };
            setSpecialtyMetadata(updated);
            if (setConclusionDoctorId) {
                setConclusionDoctorId(user?.userId || '');
            }
        } else if (action === 'DUYỆT') {
            // Bắt buộc kiểm tra 17 trường theo QĐ 2062/3176/1804 (từ file Các trường bắt buộc.xlsx)
            const mandatoryCheck = validateMandatoryPortalFields({
                formType,
                patientName,
                gender,
                dob,
                ethnic,
                cccd,
                noCccd,
                address,
                maTinhCuTru,
                maXaCuTru,
                maNgheNghiep,
                lyDoVv,
                maCskcb,
                maGtinCskcb,
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
            const executeDuyet = () => {
                payload.status = 'ĐÃ_DUYỆT';
                const updated = {
                    ...safeMetadata,
                    conclusion: payload
                };
                setSpecialtyMetadata(updated);
                if (handleSubmit) {
                    (handleSubmit as any)({ overrideMetadata: updated });
                }
            };

            // Kiểm tra cảnh báo mềm dấu hiệu sinh tồn và chuyên khoa
            if (crossCheck.hasSevereWarnings) {
                setShowSoftWarningConfirm(true);
                setPendingApproveAction(() => executeDuyet);
                return;
            }

            executeDuyet();
        } else if (action === 'MỞ_KHÓA') {
            payload.status = 'ĐANG_KHÁM';
            
            const updated = {
                ...safeMetadata,
                conclusion: payload
            };
            setSpecialtyMetadata(updated);
        } else if (action === 'THOÁT') {
            payload.status = 'CHUA_KHAM';
            
            const updated = {
                ...safeMetadata,
                conclusion: payload
            };
            setSpecialtyMetadata(updated);
        }
    };

    const isTabLocked = isLocked || conclusionMetadata.status === 'ĐÃ_DUYỆT';

    const renderBadge = () => {
        switch (conclusionMetadata.status) {
            case 'ĐANG_KHÁM': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Trạng thái: Đang khám</span>;
            case 'ĐÃ_KẾT_LUẬN': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Trạng thái: Đã kết luận</span>;
            case 'ĐÃ_KHÁM': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-200">Trạng thái: Đã khám</span>;
            case 'ĐÃ_DUYỆT': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">Trạng thái: Đã duyệt</span>;
            default: return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200">Trạng thái: Chưa khám</span>;
        }
    };

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

        if (sacGiac === '2') {
            warnings.push("Mù màu hoàn toàn (Không đủ tiêu chuẩn lái xe hạng bất kỳ).");
        } else if (sacGiac === '3' && licenseClass !== 'A1') {
            warnings.push("Rối loạn sắc giác (Yêu cầu nhận biết tốt tín hiệu giao thông đối với hạng B2 trở lên).");
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

            {/* Cảnh báo lâm sàng & Đối chiếu Sinh hiệu Thông tư 32 */}
            {crossCheck.hasWarnings && (
                <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 p-4 rounded-xl text-amber-900 dark:text-amber-200 text-xs space-y-2 animate-fadeIn shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h5 className="font-extrabold flex items-center gap-1.5 uppercase text-amber-950 dark:text-amber-300 tracking-wide text-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            Lưu ý lâm sàng & Đối chiếu Dấu hiệu sinh tồn (Thông tư 32/2023/TT-BYT)
                        </h5>
                        {crossCheck.suggestedMinClass > 1 && (
                            <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                Đề xuất tối thiểu: Loại {crossCheck.suggestedMinClass}
                            </span>
                        )}
                    </div>
                    <ul className="list-disc pl-5 space-y-1 font-medium">
                        {crossCheck.warnings.map(w => (
                            <li key={w.id} className={w.severity === 'warning' ? 'text-amber-950 dark:text-amber-100 font-semibold' : 'text-slate-700 dark:text-slate-300'}>
                                {w.message}
                            </li>
                        ))}
                    </ul>
                    <p className="text-[11px] italic text-amber-800/80 dark:text-amber-400/80">
                        * Đây là cảnh báo hỗ trợ quyết định lâm sàng. Bác sĩ có toàn quyền kết luận theo thực tế thăm khám.
                    </p>
                </div>
            )}

            {/* Quy trình phê duyệt tab */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl mb-4 gap-4 animate-in fade-in">
                <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-[#0f766e] dark:text-teal-400 uppercase tracking-wide">
                        Quy trình phê duyệt Kết luận
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
                                const matchedDoc = doctorsList.find(d => String(d.id || d.code || '').toLowerCase() === String(val || '').toLowerCase());
                                const resolvedDoctorName = matchedDoc?.name || (item as any)?.name || '';
                                setSpecialtyMetadata(prev => ({
                                    ...prev,
                                    conclusion: {
                                        ...conclusionMetadata,
                                        doctorId: val,
                                        doctorName: resolvedDoctorName,
                                        updatedAt: new Date().toISOString()
                                    }
                                }));
                                if (setConclusionDoctorId) {
                                    setConclusionDoctorId(val);
                                }
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
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" title="Chưa ký số. Bác sĩ có thể duyệt kết luận trước và ký số sau hoặc ký số hàng loạt ngoài danh sách.">
                            Chưa ký số (có thể ký sau)
                        </span>
                    )}

                    {conclusionMetadata.status === 'CHUA_KHAM' || !conclusionMetadata.status ? (
                        <button
                            type="button"
                            onClick={() => handleAction('MỞ_KHÁM')}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm active:scale-95 transition cursor-pointer"
                        >
                            Khám
                        </button>
                    ) : (conclusionMetadata.status === 'ĐANG_KHÁM' || conclusionMetadata.status === 'ĐÃ_KẾT_LUẬN' || conclusionMetadata.status === 'ĐÃ_KHÁM') ? (
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
                            title="Mở khóa để sửa"
                        >
                            Mở khóa
                        </button>
                    )}
                </div>
            </div>

            <fieldset disabled={isTabLocked} className="space-y-6 w-full">
            <div className="modern-card p-6">
                <h4 className="text-sm font-bold text-[#0f766e] dark:text-teal-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 mb-4">IV.2. Kết luận sức khỏe chung</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
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
                    <div className="md:col-span-3">
                        <ICD10MultiSelect
                            label="Mã bệnh tật/Chẩn đoán (Mã ICD-10 hoặc chuỗi kết luận)"
                            value={diagnosis}
                            onChange={setDiagnosis}
                            disabled={isTabLocked}
                            placeholder="Tìm theo mã hoặc tên bệnh (VD: I10, E11...)"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Quản lý bệnh</label>
                        <select value={quanLyBenh} onChange={e => setQuanLyBenh(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                            <option value="">--- Chọn ---</option>
                            <option value="1. Không bệnh lý">1. Không bệnh lý</option>
                            <option value="2. Có bệnh lý cần theo dõi">2. Có bệnh lý cần theo dõi</option>
                            <option value="3. Có bệnh lý được theo dõi">3. Có bệnh lý được theo dõi</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Theo dõi tại</label>
                        <input type="text" value={theoDoiTai} onChange={e => setTheoDoiTai(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-semibold" placeholder="Nhập nơi theo dõi..." />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Chuyển tuyến</label>
                        <select value={chuyenTuyen} onChange={e => setChuyenTuyen(e.target.value)} className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white font-bold">
                            <option value="">--- Chọn ---</option>
                            <option value="1. Không chuyển tuyến">1. Không chuyển tuyến</option>
                            <option value="2. Chuyển tuyến để chẩn đoán xác định">2. Chuyển tuyến để chẩn đoán xác định</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">
                            Các vấn đề sức khỏe cần lưu ý (CAC_VAN_DE_SUC_KHOE)
                        </label>
                        <textarea
                            value={cacVanDeLuuY}
                            onChange={e => setCacVanDeLuuY(e.target.value)}
                            disabled={isTabLocked}
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white h-20"
                            placeholder="Ghi nhận các vấn đề sức khỏe cần lưu ý..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center justify-between">
                            <span>Tình trạng sức khỏe; mắc các bệnh, tật (nếu có)</span>
                            <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold">* Mục 121 QĐ 1551 (CAC_BENH_TAT_NEU_CO)</span>
                        </label>
                        <textarea
                            value={cacBenhTatNeuCo}
                            onChange={e => setCacBenhTatNeuCo(e.target.value)}
                            disabled={isTabLocked}
                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white h-20"
                            placeholder="Ghi rõ tình trạng sức khỏe hoặc các bệnh, tật mắc phải nếu có..."
                        />
                    </div>
                </div>

                {formType === '3' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-teal-50/20 dark:bg-teal-950/20 p-4 rounded-xl border border-teal-200/40 dark:border-teal-900/30">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">
                                Kết luận sức khỏe người lái xe <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={ketLuanLoaiSucKhoe}
                                onChange={e => setKetLuanLoaiSucKhoe(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-[#0f766e] dark:text-teal-300 font-bold"
                            >
                                <option value={`Đủ điều kiện sức khỏe lái xe hạng ${licenseClass || 'B2'}`}>
                                    ✓ Đủ điều kiện sức khỏe lái xe hạng {licenseClass || 'B2'}
                                </option>
                                <option value={`Đạt tiêu chuẩn sức khỏe lái xe hạng ${licenseClass || 'B2'} (Yêu cầu đeo kính khi lái xe)`}>
                                    ✓ Đạt tiêu chuẩn sức khỏe lái xe hạng {licenseClass || 'B2'} (Đeo kính khi lái xe)
                                </option>
                                <option value={`Không đủ điều kiện sức khỏe lái xe hạng ${licenseClass || 'B2'}`}>
                                    ✗ Không đủ điều kiện sức khỏe lái xe hạng {licenseClass || 'B2'}
                                </option>
                                <option value="Cần khám lại sau 01 tháng">
                                    ⏱ Cần khám lại sau 01 tháng
                                </option>
                                <option value="Cần khám lại sau 03 tháng">
                                    ⏱ Cần khám lại sau 03 tháng
                                </option>
                                <option value="Cần khám lại sau 06 tháng">
                                    ⏱ Cần khám lại sau 06 tháng
                                </option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Thời hạn hiệu lực giấy KSK</label>
                            <div className="p-2.5 bg-white dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                                <span>Giá trị trong 06 tháng (QĐ 1551/TTLT 24)</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Hợp lệ</span>
                            </div>
                        </div>
                    </div>
                )}

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
                                <option value="1">Loại I (Rất khỏe)</option>
                                <option value="2">Loại II (Khỏe)</option>
                                <option value="3">Loại III (Trung bình)</option>
                                <option value="4">Loại IV (Yếu)</option>
                                <option value="5">Loại V (Rất yếu)</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
            </fieldset>

            {/* Modal cảnh báo mềm đối chiếu sinh hiệu trước khi duyệt */}
            {showSoftWarningConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-amber-300 dark:border-amber-700/80 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                                    <line x1="12" y1="9" x2="12" y2="13"/>
                                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Xác nhận Duyệt Kết luận KSK</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Phát hiện một số chỉ số sinh tồn hoặc chuyên khoa vượt ngưỡng</p>
                            </div>
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
                            {crossCheck.warnings.filter(w => w.severity === 'warning').map(w => (
                                <div key={w.id} className="flex items-start gap-1.5 font-medium">
                                    <span className="text-amber-500 font-bold">•</span>
                                    <span>{w.message}</span>
                                </div>
                            ))}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300">
                            Bác sĩ đang phân loại sức khỏe chung là <strong className="text-emerald-700 dark:text-emerald-400 font-bold">Loại {fitnessClass || 'Chưa chọn'}</strong>. Bác sĩ có xác nhận tiếp tục duyệt kết luận này không?
                        </p>

                        <div className="flex justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSoftWarningConfirm(false);
                                    setPendingApproveAction(null);
                                }}
                                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            >
                                Quay lại kiểm tra
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSoftWarningConfirm(false);
                                    if (pendingApproveAction) {
                                        pendingApproveAction();
                                        setPendingApproveAction(null);
                                    }
                                }}
                                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
                            >
                                Tiếp tục duyệt kết luận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ConclusionTab;
