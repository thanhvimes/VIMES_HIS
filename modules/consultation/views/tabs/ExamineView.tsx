
import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { 
    ClipboardListIcon, 
    PencilIcon, 
    SaveIcon, 
    BanIcon, 
    PrinterIcon, 
    CheckIcon,
    ListBulletIcon,
    ClockIcon,
    ActivityIcon,
    SparklesIcon,
    SpeakerWaveIcon
} from '../../../../components/Icons';
import { ClinicalRecord, ICD10, AISuggestion } from '../../../../types';
import { consultationService } from '../../../../services/consultationService';
import { getAISuggestions } from '../../../../services/geminiService';
import { usePdfPreview } from '../../../../contexts/PdfPreviewContext';
import { useNotification } from '../../../../contexts/NotificationContext';
import { useTheme } from '../../../../contexts/ThemeContext';
import Combobox, { ComboboxColumn } from '../../../../components/ui/Combobox';
import { doctorOptions, diagnosisOptions, DoctorItem, CatalogItem } from '../../data/catalogs';
import SubDiagnosisModal from './modals/SubDiagnosisModal';
import AIAnalysisModal from './modals/AIAnalysisModal';
import VitalSignsModal from './modals/VitalSignsModal';

const DEMO_PDF_URL = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';

const ExamineView: React.FC<{ age?: number; gender?: string }> = ({ age, gender }) => {
    const { patientId } = useParams<{ patientId: string }>();
    const [searchParams] = useSearchParams();
    const docNo = searchParams.get('docNo');
    const { addNotification } = useNotification();
    const { fontSettings } = useTheme();

    const { openPdf } = usePdfPreview();
    const [mode, setMode] = useState<'VIEW' | 'EDIT'>('VIEW');
    const [isLoading, setIsLoading] = useState(false);
    const [record, setRecord] = useState<ClinicalRecord | null>(null);
    const [originalRecord, setOriginalRecord] = useState<ClinicalRecord | null>(null);
    const [patientProfile, setPatientProfile] = useState<any>(null);
    
    const [isSubDiagModalOpen, setIsSubDiagModalOpen] = useState(false);
    const [isVitalSignsModalOpen, setIsVitalSignsModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isAILoading, setIsAILoading] = useState(false);
    const [aiResult, setAiResult] = useState<AISuggestion | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!docNo || !patientId) return;
            setIsLoading(true);
            try {
                // Load clinical record
                const data = await consultationService.getClinicalRecordByDocNo(parseInt(docNo));
                if (!data.endTime) {
                    const now = new Date();
                    data.endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                }
                setRecord(data);
                setOriginalRecord(JSON.parse(JSON.stringify(data)));

                // Load patient profile (allergies, history, etc.)
                const profile = await consultationService.getPatientProfile(patientId, docNo);
                setPatientProfile(profile);
            } catch (error) {
                console.error("Failed to load record", error);
                // Fallback: Tạo một record trống để tránh crash màn hình
                const emptyRecord: any = {
                    docNo: parseInt(docNo),
                    patientName: "Bệnh nhân",
                    examDate: new Date().toISOString(), // Bổ sung ngày giờ mặc định
                    history: "",
                    clinicalExam: "",
                    conclusion: "",
                    treatmentPlan: "",
                    subDiseases: []
                };
                setRecord(emptyRecord);
                addNotification("Thông báo", "Không tìm thấy phiếu khám cũ, hệ thống đã tạo phiếu mới.", "info");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [docNo]);

    const handleUpdate = () => setMode('EDIT');
    
    const handleCancel = () => {
        if (originalRecord && window.confirm("Hủy bỏ các thay đổi hiện tại?")) {
            setRecord(JSON.parse(JSON.stringify(originalRecord)));
            setMode('VIEW');
        }
    };

    const handleSave = async () => {
        if (!record || !record.mainDisease) {
            addNotification("Cảnh báo", "Vui lòng chọn chẩn đoán bệnh chính (ICD10)", "warning");
            return;
        }

        setIsLoading(true);
        try {
            const savedRecord = await consultationService.saveClinicalRecord(record);
            setRecord(savedRecord);
            setOriginalRecord(JSON.parse(JSON.stringify(savedRecord)));
            setMode('VIEW');
            addNotification("Thành công", "Đã lưu hồ sơ khám bệnh", "success");
        } catch (error) {
            addNotification("Lỗi", "Lỗi khi lưu dữ liệu", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        if (!record) return;
        openPdf({
            url: DEMO_PDF_URL,
            fileName: `PhieuKham_${record.id}.pdf`,
            isSignable: true
        });
    };

    const handleInputChange = (field: keyof ClinicalRecord, value: any) => {
        if (record) setRecord({ ...record, [field]: value });
    };
    
    const handleDoctorChange = (value: string, item?: DoctorItem) => {
        handleInputChange('doctorName', item ? item.name : value);
    };

    const handleMainDiseaseChange = (value: string, item?: CatalogItem) => {
        if (item) {
            handleInputChange('mainDisease', { code: item.code, name: item.name });
            if (!record?.initialDiagnosis) handleInputChange('initialDiagnosis', item.name);
        }
    };

    const handleAskAI = async () => {
        if (!record) return;
        if (!record.history && !record.clinicalExam) {
            addNotification("Thông tin", "Hãy nhập Quá trình bệnh lý hoặc Khám lâm sàng để AI phân tích", "info");
            return;
        }

        setIsAIModalOpen(true);
        setIsAILoading(true);
        setAiError(null);
        setAiResult(null);

        try {
            const result = await getAISuggestions(record.history || '', record.clinicalExam || '', { age, gender });
            setAiResult(result);
        } catch (err) {
            setAiError('Không thể kết nối với trợ lý AI.');
        } finally {
            setIsAILoading(false);
        }
    };

    const icdColumns: ComboboxColumn<CatalogItem>[] = [
        { key: 'code', label: 'Mã ICD', width: '25%', className: 'font-mono font-bold text-blue-600' },
        { key: 'name', label: 'Tên bệnh lý', width: '75%' },
    ];

    if (!record) return <div className="p-10 text-center opacity-50">Đang khởi tạo dữ liệu khám...</div>;

    const isEditable = mode === 'EDIT';

    return (
        <div className="flex flex-col h-full gap-4 animate-fade-in relative pb-16">
            
            {/* TOP ACTIONS ROW */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                        <ClipboardListIcon className="w-5 h-5"/>
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white uppercase tracking-tight">Chi tiết khám bệnh</h3>
                        <p className="text-[11px] text-slate-500 font-medium italic">Ghi nhận triệu chứng, chẩn đoán và hướng điều trị</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-xs font-bold transition-all border border-orange-100">
                        <SpeakerWaveIcon className="w-4 h-4"/> Gọi lại BN
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-all border border-slate-200">
                        <PrinterIcon className="w-4 h-4"/> In nhãn
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:grid lg:grid-cols-4 gap-4 min-h-0">
                
                {/* LEFT: CLINICAL INPUTS */}
                <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-1 custom-scrollbar">
                    
                    {/* SECTION: ADMIN & LÂM SÀNG */}
                    <div className={`bg-white dark:bg-slate-800 p-5 rounded-xl border transition-all duration-300 ${isEditable ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
                         <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-5">
                                <div className="md:col-span-3">
                                    <Combobox<DoctorItem>
                                        label="Bác sĩ khám bệnh"
                                        value={record.doctorName}
                                        onChange={handleDoctorChange}
                                        options={doctorOptions}
                                        disabled={!isEditable}
                                        required
                                        placeholder="Chọn bác sĩ..."
                                        displayValue={(item) => item.name}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="enterprise-label">Ngày & Giờ khám</label>
                                    <input 
                                        type="datetime-local" 
                                        className="enterprise-input font-mono font-bold text-blue-600"
                                        value={record?.examDate?.substring(0, 16) || ''}
                                        onChange={(e) => handleInputChange('examDate', e.target.value)}
                                        disabled={!isEditable}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="enterprise-label">Giờ kết thúc</label>
                                    <input 
                                        type="time" 
                                        value={record.endTime} 
                                        onChange={(e) => handleInputChange('endTime', e.target.value)}
                                        readOnly={!isEditable} 
                                        className="enterprise-input text-center font-bold text-blue-600"
                                    />
                                </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="enterprise-label flex items-center justify-between">
                                    Quá trình bệnh lý
                                    <span className="text-[10px] text-slate-400 normal-case font-normal">Triệu chứng & Diễn biến</span>
                                </label>
                                <textarea 
                                    value={record.history} 
                                    onChange={(e) => handleInputChange('history', e.target.value)}
                                    disabled={!isEditable}
                                    rows={5}
                                    className="enterprise-input h-auto py-2 leading-relaxed min-h-[120px]"
                                    placeholder="Ví dụ: Bệnh nhân sốt cao 3 ngày, ho có đờm..."
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="enterprise-label flex items-center justify-between">
                                    Khám lâm sàng
                                    <span className="text-[10px] text-slate-400 normal-case font-normal">Ghi nhận thực thể</span>
                                </label>
                                <textarea 
                                    value={record.clinicalExam}
                                    onChange={(e) => handleInputChange('clinicalExam', e.target.value)}
                                    disabled={!isEditable}
                                    rows={5}
                                    className="enterprise-input h-auto py-2 leading-relaxed min-h-[120px]"
                                    placeholder="Ví dụ: Phổi có rale ẩm, họng đỏ..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION: CHẨN ĐOÁN */}
                    <div className={`bg-white dark:bg-slate-800 p-5 rounded-xl border transition-all duration-300 ${isEditable ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase text-xs tracking-widest">
                                <ActivityIcon className="w-4 h-4"/> Chẩn Đoán Bệnh Lý
                            </div>
                            <button 
                                onClick={handleAskAI}
                                disabled={!isEditable}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full text-xs font-black transition-all shadow-md transform active:scale-95 disabled:opacity-50"
                            >
                                <SparklesIcon className="w-3.5 h-3.5"/> TRỢ LÝ AI (GEMINI)
                            </button>
                        </div>
                         
                         <div className="space-y-5">
                                <Combobox<CatalogItem>
                                    label="Bệnh chính (Mã ICD10)"
                                    value={record.mainDisease ? `${record.mainDisease.code} - ${record.mainDisease.name}` : ''}
                                    onChange={handleMainDiseaseChange}
                                    options={diagnosisOptions}
                                    columns={icdColumns}
                                    disabled={!isEditable}
                                    required
                                    placeholder="Nhập mã hoặc tên bệnh lý..."
                                    displayValue={(item) => `${item.code} - ${item.name}`}
                                />
                                
                                <div className="flex items-start gap-3">
                                    <div className="flex-1">
                                        <label className="enterprise-label">Bệnh kèm theo (Sub ICD)</label>
                                        <div className="min-h-[42px] p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 flex flex-wrap gap-1.5 items-center">
                                            {record.subDiseases && record.subDiseases.length > 0 ? (
                                                record.subDiseases.map((d, idx) => (
                                                    <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                        <span className="bg-blue-200 dark:bg-blue-700 px-1 rounded mr-1.5">{d.code}</span> {d.name}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 italic text-xs pl-2">Chưa chọn bệnh kèm theo</span>
                                            )}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsSubDiagModalOpen(true)}
                                        disabled={!isEditable}
                                        className="mt-6 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50"
                                    >
                                        <ListBulletIcon className="w-5 h-5" />
                                    </button>
                                </div>
                         </div>
                    </div>

                    {/* SECTION: KẾT LUẬN & ĐIỀU TRỊ */}
                    <div className={`bg-white dark:bg-slate-800 p-5 rounded-xl border transition-all duration-300 ${isEditable ? 'border-green-500 ring-4 ring-green-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
                         <div className="flex items-center gap-2 mb-4 text-green-600 dark:text-green-400 font-bold uppercase text-xs tracking-widest border-b pb-2">
                            <CheckIcon className="w-4 h-4"/> Kết Luận & Dặn Dò
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="enterprise-label">Chẩn đoán sau cùng</label>
                                <textarea 
                                    value={record?.conclusion || ''}
                                    onChange={(e) => handleInputChange('conclusion', e.target.value)}
                                    disabled={!isEditable}
                                    rows={3}
                                    className="enterprise-input h-auto py-2 font-bold text-blue-700 dark:text-blue-300 min-h-[80px]"
                                    placeholder="Tóm tắt chẩn đoán chính xác..."
                                />
                            </div>
                             <div className="flex flex-col gap-1.5">
                                <label className="enterprise-label">Lời dặn / Hướng điều trị</label>
                                <textarea 
                                    value={record?.treatmentPlan || ''}
                                    onChange={(e) => handleInputChange('treatmentPlan', e.target.value)}
                                    disabled={!isEditable}
                                    rows={3}
                                    className="enterprise-input h-auto py-2 min-h-[80px]"
                                    placeholder="Dặn dò chế độ ăn, tái khám..."
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: VITAL SIGNS & CLINICAL SUMMARY */}
                <div className="lg:col-span-1 space-y-4">
                     {/* Medical Monitor Style Vital Signs */}
                     <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden border-2 border-slate-700">
                        <div className="bg-gradient-to-r from-red-900/40 to-slate-900 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
                            <h4 className="font-black text-red-500 text-[11px] uppercase tracking-tighter flex items-center gap-2">
                                <ActivityIcon className="w-3 h-3 animate-pulse"/> Medical Monitor
                            </h4>
                            <span className="text-[10px] text-slate-500 font-mono">Live Data</span>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* BP & Heart Rate */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                                    <span className="text-[9px] text-green-500 font-bold uppercase block mb-1">Mạch (HR)</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-green-400 font-mono leading-none">
                                            {record.vitals?.pulse || '--'}
                                        </span>
                                        <span className="text-[9px] text-green-700 font-bold">bpm</span>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                                    <span className="text-[9px] text-blue-500 font-bold uppercase block mb-1">Huyết áp (BP)</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-blue-400 font-mono leading-none">
                                            {record.vitals?.bpSystolic || '--'}/{record.vitals?.bpDiastolic || '--'}
                                        </span>
                                        <span className="text-[9px] text-blue-700 font-bold">mmHg</span>
                                    </div>
                                </div>
                            </div>
                            {/* SpO2 & Temp */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                                    <span className="text-[9px] text-cyan-500 font-bold uppercase block mb-1">SpO2</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-cyan-400 font-mono leading-none">
                                            {record.vitals?.spo2 || '--'}
                                        </span>
                                        <span className="text-[9px] text-cyan-700 font-bold">%</span>
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                                    <span className="text-[9px] text-amber-500 font-bold uppercase block mb-1">Nhiệt độ</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-2xl font-black text-amber-400 font-mono leading-none">
                                            {record.vitals?.temperature || '--'}
                                        </span>
                                        <span className="text-[9px] text-amber-700 font-bold">°C</span>
                                    </div>
                                </div>
                            </div>
                            {/* BMI */}
                            <div className="bg-slate-800/50 p-2 rounded border border-slate-700">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-indigo-400 font-bold uppercase">Chỉ số BMI</span>
                                    <span className="text-[10px] font-black text-indigo-300 font-mono">
                                        {record.vitals?.bmi || '--'} <span className="text-[8px] opacity-60">kg/m²</span>
                                    </span>
                                </div>
                                {record.vitals?.bmi && (
                                    <div className="mt-1.5 h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${
                                                record.vitals.bmi < 18.5 ? 'bg-blue-400' :
                                                record.vitals.bmi < 25 ? 'bg-emerald-400' :
                                                record.vitals.bmi < 30 ? 'bg-yellow-400' : 'bg-red-400'
                                            }`}
                                            style={{ width: `${Math.min((record.vitals.bmi / 40) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-800 p-2 text-center">
                            <button 
                                onClick={() => setIsVitalSignsModalOpen(true)}
                                className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
                            >
                                Cập nhật sinh hiệu
                            </button>
                        </div>
                     </div>

                      {/* Allergy Alerts */}
                      {(patientProfile?.allergies || patientProfile?.drugallergy) && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-200 dark:border-red-800 shadow-sm animate-pulse">
                            <h4 className="font-bold text-red-600 text-xs mb-2 uppercase tracking-wide flex items-center gap-2">
                                Cảnh báo đặc biệt
                            </h4>
                            <div className="bg-white dark:bg-red-900/40 p-2 rounded border border-red-100 dark:border-red-800">
                                <p className="text-sm font-black text-red-700 dark:text-red-300">
                                    Dị ứng: {patientProfile.allergies || patientProfile.drugallergy}
                                </p>
                                <p className="text-[10px] text-red-500 mt-1 italic">Vui lòng kiểm tra kỹ trước khi kê đơn.</p>
                            </div>
                        </div>
                      )}

                     {/* History Summary */}
                     <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 text-xs mb-3 uppercase tracking-wide border-b pb-2">Tiền sử tóm tắt</h4>
                        <ul className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                            <li className="flex items-start gap-2 leading-tight">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 flex-shrink-0"></span>
                                Tiểu đường type 2 (5 năm)
                            </li>
                            <li className="flex items-start gap-2 leading-tight">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 flex-shrink-0"></span>
                                Tăng huyết áp (Mẹ)
                            </li>
                            <li className="flex items-start gap-2 leading-tight">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1 flex-shrink-0"></span>
                                Phẫu thuật ruột thừa (2015)
                            </li>
                        </ul>
                     </div>
                </div>
            </div>

            {/* STICKY BOTTOM ACTION BAR */}
            <div className="fixed bottom-0 right-0 left-0 lg:left-64 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-3 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 z-30 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                {!isEditable ? (
                    <>
                        <button onClick={handleUpdate} className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-black text-sm shadow-lg shadow-blue-600/20 transition-all transform active:scale-95 uppercase tracking-wider">
                            <PencilIcon className="w-5 h-5"/> Bắt đầu khám
                        </button>
                        <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-100 rounded-lg font-bold text-sm transition-all border border-slate-300 dark:border-slate-500 uppercase tracking-wider">
                            <PrinterIcon className="w-5 h-5"/> In kết quả
                        </button>
                    </>
                ) : (
                    <>
                         <button onClick={handleSave} disabled={isLoading} className="flex items-center gap-2 px-10 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-sm shadow-lg shadow-emerald-600/20 transition-all transform active:scale-95 disabled:opacity-50 uppercase tracking-wider">
                            {isLoading ? 'Đang xử lý...' : <><SaveIcon className="w-5 h-5"/> Lưu kết quả</>}
                        </button>
                        <button onClick={handleCancel} disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-lg font-bold text-sm transition-all transform active:scale-95 uppercase tracking-wider">
                            <BanIcon className="w-5 h-5"/> Hủy bỏ
                        </button>
                    </>
                )}
            </div>

            {/* MODALS */}
            {record && (
                <SubDiagnosisModal 
                    isOpen={isSubDiagModalOpen}
                    onClose={() => setIsSubDiagModalOpen(false)}
                    initialDiseases={record?.subDiseases || []}
                    onSave={(diseases) => handleInputChange('subDiseases', diseases)}
                />
            )}

            {record && (
                <VitalSignsModal
                    isOpen={isVitalSignsModalOpen}
                    onClose={() => setIsVitalSignsModalOpen(false)}
                    initialVitals={record?.vitals}
                    onSave={(vitals) => handleInputChange('vitals', vitals)}
                />
            )}
            
            <AIAnalysisModal 
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                isLoading={isAILoading}
                data={aiResult}
                error={aiError}
            />
        </div>
    );
};

export default ExamineView;
