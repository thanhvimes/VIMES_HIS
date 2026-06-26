
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
import { SPECIALTY_FORM_REGISTRY, generateSpecialtySummary } from './specialties';
import ICDSelection from '../components/ICDSelection';

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
            if (!patientId) return;
            setIsLoading(true);
            try {
                // Load clinical record
                let data: ClinicalRecord;
                if (docNo) {
                    data = await consultationService.getClinicalRecordByDocNo(parseInt(docNo));
                } else {
                    data = await consultationService.getClinicalRecord(patientId);
                }
                
                if (!data.endTime) {
                    const now = new Date();
                    data.endTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                }
                setRecord(data);
                setOriginalRecord(JSON.parse(JSON.stringify(data)));

                // Load patient profile (allergies, history, etc.)
                const profile = await consultationService.getPatientProfile(patientId, docNo || undefined);
                setPatientProfile(profile);
            } catch (error) {
                console.error("Failed to load record", error);
                // Fallback: Tạo một record trống để tránh crash màn hình
                const emptyRecord: any = {
                    docNo: docNo ? parseInt(docNo) : 21000001,
                    patientId: patientId,
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
    }, [docNo, patientId]);

    const handleUpdate = () => {
        setMode('EDIT');
        if (record) {
            const isBHYT = patientProfile?.insuranceNumber || patientProfile?.patientType === 'BHYT';
            if (isBHYT) {
                const minWaitMinutes = patientProfile?.minWaitTime || 15;
                const minExamMinutes = patientProfile?.minExamDuration || 15;
                const createdTime = patientProfile?.createdDate ? new Date(patientProfile.createdDate) : new Date();
                const now = new Date();
                
                let adjustedExamDate = new Date(record.examDate || now);
                const waitThreshold = new Date(createdTime.getTime() + minWaitMinutes * 60 * 1000);
                if (now < waitThreshold) {
                    adjustedExamDate = waitThreshold;
                    addNotification("Thông tin BHYT", `Tự động điều chỉnh giờ khám tới ${adjustedExamDate.toLocaleTimeString('vi-VN')} để đủ thời gian chờ chỉ định tối thiểu (${minWaitMinutes} phút)`, "info");
                }
                
                const adjustedEndDate = new Date(adjustedExamDate.getTime() + minExamMinutes * 60 * 1000);
                const endHours = adjustedEndDate.getHours().toString().padStart(2, '0');
                const endMinutes = adjustedEndDate.getMinutes().toString().padStart(2, '0');
                
                setRecord(prev => prev ? {
                    ...prev,
                    examDate: adjustedExamDate.toISOString().slice(0, 16),
                    endTime: `${endHours}:${endMinutes}`
                } : null);
            }
        }
    };
    
    const handleCancel = () => {
        if (originalRecord && window.confirm("Hủy bỏ các thay đổi hiện tại?")) {
            setRecord(JSON.parse(JSON.stringify(originalRecord)));
            setMode('VIEW');
        }
    };

    const getAutoConclusion = (mainDisease?: ICD10, subDiseases?: ICD10[]) => {
        if (!mainDisease) return '';
        let text = `[${mainDisease.code}] ${mainDisease.name}`;
        if (subDiseases && subDiseases.length > 0) {
            text += '; ' + subDiseases.map(d => `[${d.code}] ${d.name}`).join('; ');
        }
        return text;
    };

    const handleSave = async () => {
        if (!record || !record.mainDisease) {
            addNotification("Cảnh báo", "Vui lòng chọn chẩn đoán bệnh chính (ICD10)", "warning");
            return;
        }

        const isBHYT = patientProfile?.insuranceNumber || patientProfile?.patientType === 'BHYT';
        if (isBHYT) {
            if (!record.vitals?.weight || record.vitals.weight <= 0) {
                addNotification("Cảnh báo", "Đối tượng BHYT bắt buộc phải nhập cân nặng!", "warning");
                return;
            }
            if (!record.initialDiagnosis || record.initialDiagnosis.trim().length < 5) {
                addNotification("Cảnh báo", "Đối tượng BHYT yêu cầu nhập chẩn đoán ban đầu (tối thiểu 5 ký tự)!", "warning");
                return;
            }

            const minExamMinutes = patientProfile?.minExamDuration || 15;
            const examDateObj = new Date(record.examDate);
            const [endH, endM] = record.endTime ? record.endTime.split(':').map(Number) : [0, 0];
            const endDateObj = new Date(examDateObj);
            endDateObj.setHours(endH);
            endDateObj.setMinutes(endM);
            
            const diffMs = endDateObj.getTime() - examDateObj.getTime();
            const diffMins = diffMs / (1000 * 60);
            
            if (diffMins < minExamMinutes) {
                addNotification("Cảnh báo BHYT", `Giờ kết thúc khám phải sau giờ bắt đầu ít nhất ${minExamMinutes} phút để tránh xuất toán!`, "warning");
                return;
            }

            const maxDailyExams = patientProfile?.maxDailyExams || 65;
            const currentDoctorExams = patientProfile?.doctorDailyExamCount || 0;
            if (currentDoctorExams >= maxDailyExams) {
                addNotification("Cảnh báo xuất toán", `Bác sĩ đã khám ${currentDoctorExams}/${maxDailyExams} ca trong ngày. Nếu tiếp tục khám BHYT sẽ bị xuất toán!`, "error");
                return;
            }

            if (patientProfile?.hasPriorExamSameDoctor) {
                const proceed = window.confirm("Một bác sĩ chỉ được khám 1 phiếu khám của bệnh nhân. Khám chuyên khoa thứ 2 sẽ bị xuất toán! Bạn có chắc chắn muốn tiếp tục?");
                if (!proceed) return;
            }
        }

        setIsLoading(true);
        try {
            const currentType = record.he_type || 1;
            let recordToSave = { ...record };
            if (currentType > 1) {
                recordToSave.clinicalExam = generateSpecialtySummary(currentType, record.specialtyData || {});
            }
            const savedRecord = await consultationService.saveClinicalRecord(recordToSave);
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
            const mainDisease = { code: item.code, name: item.name };
            const conclusion = getAutoConclusion(mainDisease, record?.subDiseases);
            setRecord(prev => prev ? {
                ...prev,
                mainDisease,
                initialDiagnosis: prev.initialDiagnosis || item.name,
                conclusion: prev.conclusion || conclusion
            } : null);
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
    const currentType = record.he_type || 1;
    const SpecialtyForm = SPECIALTY_FORM_REGISTRY[currentType] || SPECIALTY_FORM_REGISTRY[1];

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
                                <div className="md:col-span-2">
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
                                    <label className="enterprise-label">Chuyên khoa khám</label>
                                    {isEditable ? (
                                        <select 
                                            value={currentType}
                                            onChange={(e) => handleInputChange('he_type', parseInt(e.target.value))}
                                            className="enterprise-input font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value={1}>Đa khoa / Nội khoa</option>
                                            <option value={2}>Chuyên khoa Mắt (Ophthalmology)</option>
                                            <option value={3}>Chuyên khoa Sản (Obstetrics)</option>
                                            <option value={4}>Tai Mũi Họng (ENT)</option>
                                            <option value={5}>Răng Hàm Mặt (Dental)</option>
                                            <option value={6}>Y Học Cổ Truyền (Traditional Medicine)</option>
                                        </select>
                                    ) : (
                                        <input 
                                            type="text" 
                                            readOnly 
                                            className="enterprise-input font-bold text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-900/50"
                                            value={currentType === 2 ? 'Chuyên khoa Mắt' : currentType === 3 ? 'Chuyên khoa Sản' : currentType === 4 ? 'Tai Mũi Họng (ENT)' : currentType === 5 ? 'Răng Hàm Mặt (Dental)' : currentType === 6 ? 'Y Học Cổ Truyền (YHCT)' : 'Đa khoa / Nội khoa'}
                                        />
                                    )}
                                </div>
                                <div className="md:col-span-1">
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
                                     rows={8}
                                     className="enterprise-input h-auto py-2 leading-relaxed min-h-[220px]"
                                     placeholder="Ví dụ: Bệnh nhân sốt cao 3 ngày, ho có đờm..."
                                 />
                             </div>
                             <div className="flex flex-col">
                                 <SpecialtyForm 
                                     data={record.specialtyData || {}}
                                     onChange={(newData) => handleInputChange('specialtyData', newData)}
                                     clinicalExam={record.clinicalExam}
                                     onClinicalExamChange={(val) => handleInputChange('clinicalExam', val)}
                                     disabled={!isEditable}
                                 />
                             </div>
                         </div>
                    </div>

                    {/* SECTION: CHẨN ĐOÁN */}
                    <div className={`bg-white dark:bg-slate-800 p-5 rounded-xl border transition-all duration-300 ${isEditable ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-slate-200 dark:border-slate-700'}`}>
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase text-xs tracking-widest">
                                <ActivityIcon className="w-4 h-4"/> {currentType === 6 || patientProfile?.deptId === 'YHCT' ? 'Chẩn đoán YHCT & YHHĐ' : 'Chẩn Đoán Bệnh Lý'}
                            </div>
                            <button 
                                onClick={handleAskAI}
                                disabled={!isEditable}
                                className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-full text-xs font-black transition-all shadow-md transform active:scale-95 disabled:opacity-50"
                            >
                                <SparklesIcon className="w-3.5 h-3.5"/> TRỢ LÝ AI (GEMINI)
                            </button>
                        </div>
                         
                         {isEditable ? (
                             <ICDSelection
                                 mainDisease={record.mainDisease}
                                 subDiseases={record.subDiseases || []}
                                 onMainDiseaseChange={(disease) => {
                                     const conclusion = getAutoConclusion(disease, record.subDiseases);
                                     setRecord(prev => prev ? {
                                         ...prev,
                                         mainDisease: disease,
                                         initialDiagnosis: prev.initialDiagnosis || disease.name,
                                         conclusion: prev.conclusion || conclusion
                                     } : null);
                                 }}
                                 onSubDiseasesChange={(diseases) => {
                                     const conclusion = getAutoConclusion(record.mainDisease, diseases);
                                     setRecord(prev => prev ? {
                                         ...prev,
                                         subDiseases: diseases,
                                         conclusion: prev.conclusion || conclusion
                                     } : null);
                                 }}
                                 isYHCT={currentType === 6 || patientProfile?.deptId === 'YHCT'}
                             />
                         ) : (
                             <div className="space-y-4">
                                 <div>
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                         {currentType === 6 || patientProfile?.deptId === 'YHCT' ? 'Bệnh chính YHHĐ (Mã ICD10)' : 'Bệnh chính (Mã ICD10)'}
                                     </span>
                                     {record.mainDisease ? (
                                         <div className="p-3 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg">
                                             <span className="font-mono font-bold text-blue-600 dark:text-blue-400 mr-2 bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-sm">
                                                 {record.mainDisease.code}
                                             </span>
                                             <span className="font-bold text-slate-700 dark:text-slate-200">
                                                 {record.mainDisease.name}
                                             </span>
                                             {(currentType === 6 || patientProfile?.deptId === 'YHCT') && record.mainDisease.yhctCode && (
                                                 <p className="text-xs text-slate-500 italic mt-1 pl-2 border-l border-slate-300">
                                                     YHCT: [{record.mainDisease.yhctCode}] {record.mainDisease.yhctName}
                                                 </p>
                                             )}
                                         </div>
                                     ) : (
                                         <span className="text-slate-400 italic text-xs">Chưa chọn bệnh chính</span>
                                     )}
                                 </div>
                                 <div>
                                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                         Bệnh kèm theo (Sub ICD)
                                     </span>
                                     <div className="flex flex-wrap gap-1.5">
                                         {record.subDiseases && record.subDiseases.length > 0 ? (
                                             record.subDiseases.map((d, idx) => (
                                                 <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                     <span className="bg-slate-200 dark:bg-slate-700 px-1 rounded mr-1.5 font-mono">{d.code}</span> {d.name}
                                                 </span>
                                             ))
                                         ) : (
                                             <span className="text-slate-400 italic text-xs">Không có bệnh kèm theo</span>
                                         )}
                                     </div>
                                 </div>
                             </div>
                         )}
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
                      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                            <h4 className="font-bold text-slate-700 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                                <ActivityIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"/> Bảng theo dõi sinh hiệu
                            </h4>
                            <span className="text-[10px] text-slate-400 font-mono">Chỉ số đo</span>
                        </div>
                        <div className="p-4 space-y-3.5">
                            {/* BP & Heart Rate */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50/50 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Mạch (HR)</span>
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono leading-none">
                                            {record.vitals?.pulse || '--'}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-medium">bpm</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Huyết áp (BP)</span>
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-lg font-bold text-slate-800 dark:text-slate-100 font-mono leading-none">
                                            {record.vitals?.bpSystolic || '--'}/{record.vitals?.bpDiastolic || '--'}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-medium">mmHg</span>
                                    </div>
                                </div>
                            </div>
                            {/* SpO2 & Temp */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-50/50 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">SpO2</span>
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono leading-none">
                                            {record.vitals?.spo2 || '--'}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-medium">%</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50/50 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Nhiệt độ</span>
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-xl font-bold text-slate-800 dark:text-slate-100 font-mono leading-none">
                                            {record.vitals?.temperature || '--'}
                                        </span>
                                        <span className="text-[9px] text-slate-400 font-medium">°C</span>
                                    </div>
                                </div>
                            </div>
                            {/* BMI */}
                            <div className="bg-slate-50/50 dark:bg-slate-900/10 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-slate-400 font-bold uppercase">Chỉ số BMI</span>
                                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 font-mono">
                                        {record.vitals?.bmi || '--'} <span className="text-[8px] opacity-60">kg/m²</span>
                                    </span>
                                </div>
                                {record.vitals?.bmi && (
                                    <div className="mt-1.5 h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full ${
                                                record.vitals.bmi < 18.5 ? 'bg-blue-500' :
                                                record.vitals.bmi < 25 ? 'bg-emerald-500' :
                                                record.vitals.bmi < 30 ? 'bg-amber-500' : 'bg-red-500'
                                            }`}
                                            style={{ width: `${Math.min((record.vitals.bmi / 40) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/30 p-2 text-center border-t border-slate-200 dark:border-slate-700">
                            <button 
                                onClick={() => setIsVitalSignsModalOpen(true)}
                                className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 uppercase tracking-widest transition-colors w-full"
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
                    onSave={(diseases) => {
                        const conclusion = getAutoConclusion(record.mainDisease, diseases);
                        setRecord(prev => prev ? {
                            ...prev,
                            subDiseases: diseases,
                            conclusion: prev.conclusion || conclusion
                        } : null);
                    }}
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
