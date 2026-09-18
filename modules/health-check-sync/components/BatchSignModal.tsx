import React, { useState, useEffect } from 'react';
import { healthCheckService } from '../../../services/healthCheckService';
import { signHealthCheckXmlWithAgent, batchSignHealthCheckXmlWithAgent } from '../services/healthCheckAgentXmlSigner';
import { 
    CheckCircleIcon, 
    AlertCircleIcon, 
    RefreshIcon,
    XIcon
} from '../../../components/Icons';
import { toast } from 'sonner';
import { getDocumentExamStatus } from '../utils/documentStatus';

interface BatchSignModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    selectedDocs: any[];
    initialRole?: 'DOCTOR' | 'UNIT' | 'BOTH';
    signatureTypeDefault?: 'HSM' | 'USB';
    doctorsList?: Array<{ id: string; name: string }>;
    currentUser?: { userId?: string; name?: string };
}

export const BatchSignModal: React.FC<BatchSignModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    selectedDocs,
    initialRole = 'DOCTOR',
    signatureTypeDefault = 'HSM',
    doctorsList = [],
    currentUser
}) => {
    const [signRole, setSignRole] = useState<'DOCTOR' | 'UNIT' | 'BOTH'>(initialRole);
    const [signatureType, setSignatureType] = useState<'HSM' | 'USB'>(signatureTypeDefault);
    const [doctorId, setDoctorId] = useState<string>(currentUser?.userId || '');
    const [doctorName, setDoctorName] = useState<string>(currentUser?.name || 'Bác sĩ kết luận');
    const [defaultFitnessClass, setDefaultFitnessClass] = useState<string>('1');
    const [applyDefaultFitness, setApplyDefaultFitness] = useState<boolean>(false);
    const [autoSendPortal, setAutoSendPortal] = useState<boolean>(true);

    // Progress & Execution states
    const [isSigning, setIsSigning] = useState<boolean>(false);
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [progressText, setProgressText] = useState<string>('');
    const [resultSummary, setResultSummary] = useState<{
        total: number;
        succeededCount: number;
        failedCount: number;
        failed: Array<{ id: number | string; docNo?: string; error: string }>;
    } | null>(null);

    useEffect(() => {
        if (isOpen) {
            setSignRole(initialRole);
            setSignatureType(signatureTypeDefault);
            setDoctorId(currentUser?.userId || '');
            setDoctorName(currentUser?.name || 'Bác sĩ kết luận');
            setResultSummary(null);
            setProgressPercent(0);
            setProgressText('');
            setIsSigning(false);
        }
    }, [isOpen, initialRole, signatureTypeDefault, currentUser]);

    if (!isOpen) return null;

    const handleDoctorChange = (selectedId: string) => {
        setDoctorId(selectedId);
        const doc = doctorsList.find(d => String(d.id) === String(selectedId));
        if (doc) {
            setDoctorName(doc.name);
        }
    };

    const handleStartSign = async () => {
        if (!selectedDocs || selectedDocs.length === 0) {
            toast.warning('Không có hồ sơ nào được chọn để ký.');
            return;
        }

        const docIds = selectedDocs.map(d => d.id.toString());
        setIsSigning(true);
        setProgressPercent(10);
        setProgressText('Đang khởi tạo phiên ký số...');

        try {
            if (signatureType === 'USB') {
                setProgressText('Đang kết nối USB Token & kiểm tra chứng thư số...');
                setProgressPercent(15);

                const batchResult = await batchSignHealthCheckXmlWithAgent(docIds, {
                    docs: selectedDocs,
                    autoSendPortal,
                    onProgress: (info) => {
                        setProgressText(`Đang ký (${info.current}/${info.total}): ${info.patientName}...`);
                        setProgressPercent(15 + Math.floor((info.current / info.total) * 65));
                    }
                });

                const signatures = batchResult.signatures;
                const failedUsbDocs = batchResult.failed.map(f => {
                    const doc = selectedDocs.find(d => String(d.id) === String(f.id));
                    return { id: f.id, docNo: doc?.doc_no || f.id, error: f.error };
                });

                if (failedUsbDocs.length === docIds.length) {
                    setResultSummary({
                        total: docIds.length,
                        succeededCount: 0,
                        failedCount: failedUsbDocs.length,
                        failed: failedUsbDocs
                    });
                    toast.error(`Ký USB Token không thành công cho toàn bộ ${docIds.length} hồ sơ.`);
                    return;
                }

                setProgressText('Đang cập nhật trạng thái hồ sơ trên hệ thống...');
                setProgressPercent(85);

                const validDocIds = batchResult.succeeded;

                let res: any;
                if (signRole === 'DOCTOR') {
                    res = await healthCheckService.batchSignConclusion(validDocIds, {
                        doctorId,
                        doctorName,
                        defaultFitnessClass: applyDefaultFitness ? defaultFitnessClass : undefined,
                        signatureType: 'USB',
                        signatures
                    });
                } else if (signRole === 'UNIT') {
                    res = await healthCheckService.batchSignUnit(validDocIds, {
                        signatureType: 'USB',
                        signatures
                    });
                } else {
                    res = await healthCheckService.batchSignBoth(validDocIds, {
                        doctorId,
                        doctorName,
                        defaultFitnessClass: applyDefaultFitness ? defaultFitnessClass : undefined,
                        signatureType: 'USB',
                        signatures
                    });
                }

                if (res) {
                    if (failedUsbDocs.length > 0) {
                        res.failed = [...(res.failed || []), ...failedUsbDocs];
                        res.failedCount = (res.failedCount || 0) + failedUsbDocs.length;
                        res.total = docIds.length;
                    }
                    setResultSummary(res);
                }
            } else {
                // HSM Cloud Signing
                setProgressText(`Đang gọi dịch vụ HSM Cloud để ký ${docIds.length} hồ sơ...`);
                setProgressPercent(40);

                let res: any;
                if (signRole === 'DOCTOR') {
                    res = await healthCheckService.batchSignConclusion(docIds, {
                        doctorId,
                        doctorName,
                        defaultFitnessClass: applyDefaultFitness ? defaultFitnessClass : undefined,
                        signatureType: 'HSM'
                    });
                } else if (signRole === 'UNIT') {
                    res = await healthCheckService.batchSignUnit(docIds, {
                        signatureType: 'HSM'
                    });
                } else {
                    res = await healthCheckService.batchSignBoth(docIds, {
                        doctorId,
                        doctorName,
                        defaultFitnessClass: applyDefaultFitness ? defaultFitnessClass : undefined,
                        signatureType: 'HSM'
                    });
                }

                setProgressPercent(100);
                setProgressText('Hoàn tất ký số!');
                setResultSummary(res);

                if (res?.succeededCount > 0) {
                    toast.success(res.message || `Đã ký số thành công cho ${res.succeededCount}/${docIds.length} hồ sơ!`);
                } else {
                    toast.error(res.message || 'Không có hồ sơ nào ký số thành công.');
                }
            }
        } catch (error: any) {
            console.error('Lỗi trong phiên ký số hàng loạt:', error);
            toast.error('Lỗi thực thi ký số: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSigning(false);
            setProgressPercent(100);
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-teal-700 via-teal-800 to-[#0f766e] text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white leading-tight">
                                Ký số hồ sơ Khám sức khỏe hàng loạt
                            </h3>
                            <p className="text-xs text-teal-100/80">
                                Đang chọn <span className="font-bold text-amber-300">{selectedDocs.length}</span> hồ sơ khám sức khỏe
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        disabled={isSigning}
                        className="p-1.5 text-teal-100 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer disabled:opacity-50"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">

                    {/* Step 1: Chọn Tác vụ Ký số */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-2">
                            1. Chọn cấp độ chữ ký số
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                type="button"
                                disabled={isSigning}
                                onClick={() => setSignRole('DOCTOR')}
                                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                                    signRole === 'DOCTOR'
                                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 ring-2 ring-blue-500/20 shadow-sm'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </span>
                                    <span className="font-bold text-sm text-slate-800 dark:text-white">Ký Bác sĩ kết luận</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Dán chữ ký Bác sĩ vào thẻ <code className="text-blue-600 font-bold">&lt;CKS_NGUOI_KET_LUAN&gt;</code> và cập nhật trạng thái Đã kết luận.
                                </p>
                            </button>

                            <button
                                type="button"
                                disabled={isSigning}
                                onClick={() => setSignRole('UNIT')}
                                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                                    signRole === 'UNIT'
                                        ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/20 ring-2 ring-teal-600/20 shadow-sm'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="p-1.5 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </span>
                                    <span className="font-bold text-sm text-slate-800 dark:text-white">Ký Chữ ký đơn vị</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Dán chữ ký Cơ sở khám chữa bệnh vào thẻ <code className="text-teal-600 font-bold">&lt;CKS_BENH_VIEN&gt;</code> và hoàn tất hồ sơ.
                                </p>
                            </button>

                            <button
                                type="button"
                                disabled={isSigning}
                                onClick={() => setSignRole('BOTH')}
                                className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative ${
                                    signRole === 'BOTH'
                                        ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 ring-2 ring-amber-500/20 shadow-sm'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </span>
                                    <span className="font-bold text-sm text-slate-800 dark:text-white">Ký cả 2 cấp (1-Click)</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Tự động ký tuần tự Bác sĩ kết luận trước, sau đó ký tiếp Chữ ký đơn vị để hồ sơ sẵn sàng gửi cổng ngay.
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Step 2: Thiết lập thông tin ký */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        
                        {/* Phương thức ký */}
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                Phương thức ký số:
                            </label>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={isSigning}
                                    onClick={() => setSignatureType('HSM')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                                        signatureType === 'HSM'
                                            ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z" />
                                    </svg>
                                    HSM Cloud CA (Khuyên dùng)
                                </button>
                                <button
                                    type="button"
                                    disabled={isSigning}
                                    onClick={() => setSignatureType('USB')}
                                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                                        signatureType === 'USB'
                                            ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600'
                                    }`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    USB Token máy trạm
                                </button>
                            </div>
                        </div>

                        {/* Bác sĩ kết luận */}
                        {(signRole === 'DOCTOR' || signRole === 'BOTH') && (
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                    Bác sĩ kết luận ký xác nhận:
                                </label>
                                {doctorsList && doctorsList.length > 0 ? (
                                    <select
                                        disabled={isSigning}
                                        value={doctorId}
                                        onChange={(e) => handleDoctorChange(e.target.value)}
                                        className="w-full p-2 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                                    >
                                        <option value={currentUser?.userId || 'BS'}>
                                            {currentUser?.name ? `${currentUser.name} (Tài khoản hiện tại)` : 'Bác sĩ đang đăng nhập'}
                                        </option>
                                        {doctorsList.filter(d => String(d.id) !== String(currentUser?.userId)).map(d => (
                                            <option key={d.id} value={d.id}>{d.name} (Mã: {d.id})</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        disabled={isSigning}
                                        value={doctorName}
                                        onChange={(e) => setDoctorName(e.target.value)}
                                        placeholder="Nhập họ tên Bác sĩ kết luận"
                                        className="w-full p-2 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                                    />
                                )}
                            </div>
                        )}

                        {/* Tùy chọn phân loại sức khỏe chung */}
                        {(signRole === 'DOCTOR' || signRole === 'BOTH') && (
                            <div className="md:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                                    <input 
                                        type="checkbox"
                                        disabled={isSigning}
                                        checked={applyDefaultFitness}
                                        onChange={(e) => setApplyDefaultFitness(e.target.checked)}
                                        className="rounded text-teal-600 focus:ring-teal-500"
                                    />
                                    <span>Tự động gán phân loại sức khỏe mặc định cho hồ sơ chưa có kết luận:</span>
                                </label>
                                {applyDefaultFitness && (
                                    <select
                                        disabled={isSigning}
                                        value={defaultFitnessClass}
                                        onChange={(e) => setDefaultFitnessClass(e.target.value)}
                                        className="p-1.5 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400"
                                    >
                                        <option value="1">Loại I (Rất khỏe)</option>
                                        <option value="2">Loại II (Khỏe)</option>
                                        <option value="3">Loại III (Trung bình)</option>
                                        <option value="4">Loại IV (Yếu)</option>
                                        <option value="5">Loại V (Rất yếu)</option>
                                    </select>
                                )}
                            </div>
                        )}
                        {/* Tùy chọn 1-Click Sign & Sync: Tự động gửi Cổng VNeID sau khi ký */}
                        <div className="md:col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-teal-700 dark:text-teal-300">
                                <input 
                                    type="checkbox"
                                    disabled={isSigning}
                                    checked={autoSendPortal}
                                    onChange={(e) => setAutoSendPortal(e.target.checked)}
                                    className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                                />
                                <span>🚀 Tự động gửi Cổng VNeID / Bộ Y tế ngay sau khi ký thành công (1-Click Sign & Sync)</span>
                            </label>
                        </div>
                    </div>

                    {/* Step 3: Danh sách hồ sơ được ký */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                2. Danh sách hồ sơ chuẩn bị ký ({selectedDocs.length})
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                Kiểm tra thông tin bệnh nhân trước khi phát lệnh ký
                            </span>
                        </div>
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold sticky top-0 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="p-2.5 w-12 text-center">STT</th>
                                        <th className="p-2.5">Số hồ sơ</th>
                                        <th className="p-2.5">Họ và tên</th>
                                        <th className="p-2.5">Loại biểu mẫu</th>
                                        <th className="p-2.5">Trạng thái khám</th>
                                        <th className="p-2.5">Trạng thái CKS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                                    {selectedDocs.map((doc, idx) => {
                                        const concl = doc.conclusion_data || {};
                                        const hasDoctorSig = Boolean(concl.signature || concl.doctor_signature || doc.signature_type === 'DOCTOR');
                                        const isFullySigned = doc.signature_status === 'Signed';

                                        return (
                                            <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                <td className="p-2.5 text-center text-slate-400">{idx + 1}</td>
                                                <td className="p-2.5 font-bold font-mono text-slate-800 dark:text-slate-200">{doc.doc_no}</td>
                                                <td className="p-2.5 font-bold text-slate-900 dark:text-white">{doc.patient_name}</td>
                                                <td className="p-2.5 text-slate-600 dark:text-slate-300">Mẫu {doc.form_type}</td>
                                                <td className="p-2.5">
                                                    {(() => {
                                                        const examStatus = getDocumentExamStatus(doc);
                                                        return (
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${examStatus.color}`}>
                                                                {examStatus.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="p-2.5">
                                                    {isFullySigned ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                                                            <CheckCircleIcon className="w-3 h-3"/> Đã ký đủ
                                                        </span>
                                                    ) : hasDoctorSig ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full">
                                                            Đã ký BS
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                                            Chưa ký
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Progress Bar & Kết quả */}
                    {isSigning && (
                        <div className="space-y-2 p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-xl animate-in fade-in">
                            <div className="flex items-center justify-between text-xs font-bold text-teal-800 dark:text-teal-300">
                                <span className="flex items-center gap-2">
                                    <RefreshIcon className="w-4 h-4 animate-spin text-teal-600"/>
                                    {progressText || 'Đang thực thi ký số hàng loạt...'}
                                </span>
                                <span>{progressPercent}%</span>
                            </div>
                            <div className="w-full h-2 bg-teal-200 dark:bg-teal-900 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-teal-600 transition-all duration-300 rounded-full" 
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Result Summary */}
                    {resultSummary && (
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="p-1 rounded-full bg-emerald-100 text-emerald-700">
                                    <CheckCircleIcon className="w-4 h-4"/>
                                </span>
                                <span className="font-bold text-sm text-slate-800 dark:text-white">
                                    Kết quả ký số: Đã ký thành công <span className="text-emerald-600 font-black">{resultSummary.succeededCount}</span> / {resultSummary.total} hồ sơ
                                </span>
                            </div>
                            {resultSummary.failedCount > 0 && (
                                <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                        <AlertCircleIcon className="w-3.5 h-3.5"/> Có {resultSummary.failedCount} hồ sơ chưa ký được:
                                    </span>
                                    <ul className="text-xs text-rose-700 dark:text-rose-300 space-y-1 list-disc list-inside">
                                        {resultSummary.failed.slice(0, 5).map((f, i) => (
                                            <li key={i}>
                                                Hồ sơ {f.docNo || f.id}: {f.error}
                                            </li>
                                        ))}
                                        {resultSummary.failed.length > 5 && (
                                            <li className="text-slate-400 italic">...và {resultSummary.failed.length - 5} hồ sơ khác</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer Buttons */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <button
                        type="button"
                        disabled={isSigning}
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                        {resultSummary ? 'Đóng' : 'Hủy bỏ'}
                    </button>

                    <div className="flex items-center gap-3">
                        {resultSummary ? (
                            <button
                                type="button"
                                onClick={() => {
                                    onSuccess();
                                    onClose();
                                }}
                                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-2"
                            >
                                <CheckCircleIcon className="w-4 h-4"/>
                                Hoàn tất & Làm mới danh sách
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled={isSigning || selectedDocs.length === 0}
                                onClick={handleStartSign}
                                className={`px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50 ${
                                    signRole === 'DOCTOR'
                                        ? 'bg-blue-600 hover:bg-blue-700'
                                        : signRole === 'UNIT'
                                        ? 'bg-teal-700 hover:bg-teal-800'
                                        : 'bg-amber-600 hover:bg-amber-700'
                                }`}
                            >
                                {isSigning ? (
                                    <>
                                        <RefreshIcon className="w-4 h-4 animate-spin"/>
                                        Đang ký số...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                        Bắt đầu Ký số ({selectedDocs.length} hồ sơ)
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BatchSignModal;
