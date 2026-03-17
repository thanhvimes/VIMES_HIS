
import React, { useState, useCallback } from 'react';
import { Patient, ConsultationRecord, AISuggestion, VitalSigns, ICD10 } from '../../../types';
import { 
    SparklesIcon, 
    DocumentTextIcon, 
    ActivityIcon, 
    ClipboardListIcon, 
    ExclamationCircleIcon,
    SpeakerWaveIcon,
    PrinterIcon
} from '../../../components/Icons';
import { getAISuggestions } from '../../../services/geminiService';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSession } from '../../../contexts/SessionContext';
import { consultationService } from '../../../services/consultationService';
import VitalSignsForm from './components/VitalSignsForm';
import ICDSelection from './components/ICDSelection';
import DiagnosisForm from './components/DiagnosisForm';
import DiseasePrehistory from './components/DiseasePrehistory';
import { useNotification } from '../../../contexts/NotificationContext';

// FIX: Updated mockPatient to conform to the Patient interface, fixing gender and contact info.
const mockPatient: Patient = {
  id: 'P003',
  name: 'Lê Hoàng Cường',
  age: 45,
  gender: 'Nam',
  phone: '0987654321',
  lastVisit: '2023-09-15',
  recordNumber: '21024067',
  dob: '1978-02-10',
  ethnicity: 'Kinh',
  occupation: 'Kỹ sư',
  address: '456 Đường Minh Khai, Hoàng Mai, Hà Nội',
};

const mockHistory: ConsultationRecord[] = [
    { id: 'C001', date: '2023-09-15', doctor: 'Dr. Minh', symptoms: 'Đau đầu, chóng mặt', diagnosis: 'Thiếu máu nội', prescription: [{id: 'D01', name: 'Ginkgo Biloba', dosage: '1v/ngày', stock: 100}], notes: 'Cần theo dõi thêm' },
    { id: 'C002', date: '2023-05-10', doctor: 'Dr. Minh', symptoms: 'Ho, sốt nhẹ', diagnosis: 'Viêm họng cấp', prescription: [{id: 'D02', name: 'Paracetamol', dosage: '2v/ngày', stock: 200}], notes: 'Nghỉ ngơi, uống nhiều nước' },
];

const ConsultationView: React.FC = () => {
  const { fontSettings } = useTheme();
  const { hasPermission } = useSession();
  const { addNotification } = useNotification();
  const [patient] = useState<Patient>(mockPatient);
  const [history] = useState<ConsultationRecord[]>(mockHistory);
  
  // States for professional content
  const [pathologyProcess, setPathologyProcess] = useState('');
  const [clinicalExam, setClinicalExam] = useState('');
  const [preliminaryDiagnosis, setPreliminaryDiagnosis] = useState('');
  const [conclusion, setConclusion] = useState('');

  const [vitals, setVitals] = useState<VitalSigns>({
      pulse: 80,
      temperature: 36.5,
      bpSystolic: 120,
      bpDiastolic: 80,
      breathingRate: 20
  });

  const [mainDisease, setMainDisease] = useState<ICD10>();
  const [subDiseases, setSubDiseases] = useState<ICD10[]>([]);

  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState('');
  
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
        const docNo = 21000001; // Mock
        const blob = await consultationService.printExamination(docNo);
        
        // Tạo link download giả lập từ Blob PDF
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `PhieuKhamBenh_${docNo}.pdf`);
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        addNotification("Thành công", "Đã khởi tạo lệnh in và tải xuống file PDF.", "success", undefined, true);
    } catch (e: any) {
        addNotification("Lỗi", "Không thể in phiếu: " + e.message, "error");
    } finally {
        setIsPrinting(false);
    }
  };

  const handleCallPatient = async () => {
    setIsCalling(true);
    try {
        const payload = {
            docNo: 21000001, // Mock
            deptId: 'KKB',
            roomId: 1,
            receptIdx: 1
        };
        const result = await consultationService.callPatient(payload);
        if (result.success) {
            addNotification("Thông báo", `Đang gọi bệnh nhân: ${patient.name}`, "info", undefined, true);
        } else {
            throw new Error(result.message || "Lỗi gọi bệnh nhân");
        }
    } catch (e: any) {
        addNotification("Lỗi", "Không thể gọi bệnh nhân: " + e.message, "error");
    } finally {
        setIsCalling(false);
    }
  };

  const handleSave = async (targetStatus: 'P' | 'T' = 'P') => {
    if (!mainDisease) {
        addNotification("Cảnh báo", "Vui lòng chọn chẩn đoán bệnh lý (ICD10) chính.", "warning");
        return;
    }

    setIsSaving(true);
    try {
        const docNo = 21000001; // Mock
        const receptIdx = 1;

        // 1. Kiểm tra các quy tắc BHYT (Porting CheckExam)
        const checkResult = await consultationService.checkInsuranceRules(docNo, receptIdx);
        if (!checkResult.success) {
            // Nếu vi phạm quy tắc (VD: quá định mức, quá nhanh, trùng chuyên khoa)
            const proceed = window.confirm(`${checkResult.message}\n\nBạn có chắc chắn muốn tiếp tục lưu không?`);
            if (!proceed) {
                setIsSaving(false);
                return;
            }
        }

        // 2. Tiến hành lưu dữ liệu
        const payload = {
            docNo,
            patientNo: patient.id,
            receptIdx,
            vitals,
            mainDisease,
            subDiseases,
            status: targetStatus,
            diagnosis: {
                pathologyProcess,
                clinicalExam,
                preliminaryDiagnosis,
                conclusion
            }
        };
        
        const result = await consultationService.saveClinicalRecord(payload);
        if (result.success) {
            addNotification("Thành công", targetStatus === 'T' ? "Đã hoàn tất hồ sơ khám bệnh." : "Đã lưu kết quả khám bệnh thành công.", "success");
        } else {
            throw new Error(result.message || "Lỗi không xác định");
        }
    } catch (e: any) {
        addNotification("Lỗi", "Không thể lưu kết quả: " + e.message, "error");
    } finally {
        setIsSaving(false);
    }
  };

  const handleTerminate = () => {
    if (window.confirm("Bạn có chắc chắn muốn kết thúc hồ sơ khám này không? Hồ sơ sẽ được chuyển sang trạng thái Đã khám.")) {
        handleSave('T');
    }
  };
  
  const handleGetAISuggestions = useCallback(async () => {
    if (!pathologyProcess && !clinicalExam) {
        setError('Vui lòng nhập quá trình bệnh lý hoặc khám lâm sàng để AI phân tích.');
        return;
    }
    setError('');
    setIsLoadingAI(true);
    setAiSuggestion(null);
    try {
        const combinedNotes = `Bệnh lý: ${pathologyProcess}\nKhám: ${clinicalExam}`;
        const suggestion = await getAISuggestions(combinedNotes, '', patient);
        setAiSuggestion(suggestion);
    } catch (e) {
        setError('Không thể kết nối với trợ lý AI. Vui lòng thử lại sau.');
        console.error(e);
    } finally {
        setIsLoadingAI(false);
    }
  }, [pathologyProcess, clinicalExam, patient]);

  return (
    <div className="space-y-6">
       <p className="text-slate-500 dark:text-slate-400 -mt-2">Ghi nhận thông tin khám, chẩn đoán và sử dụng trợ lý AI để có gợi ý chuyên môn.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Consultation Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
             <div className="flex items-center justify-between border-b dark:border-slate-600 pb-3 mb-4">
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Thông tin bệnh nhân</h2>
                <button 
                  onClick={handleCallPatient}
                  disabled={isCalling}
                  className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-lg transition-all font-bold disabled:opacity-50"
                >
                  <SpeakerWaveIcon className={`w-5 h-5 ${isCalling ? 'animate-pulse' : ''}`} />
                  {isCalling ? 'Đang gọi...' : 'Gọi bệnh nhân'}
                </button>
             </div>
             <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-600 dark:text-slate-300 ${fontSettings.listSecondary}`}>
                <div><span className="font-semibold text-onSurface dark:text-dark-onSurface">Tên:</span> {patient.name}</div>
                <div><span className="font-semibold text-onSurface dark:text-dark-onSurface">Tuổi:</span> {patient.age}</div>
                <div><span className="font-semibold text-onSurface dark:text-dark-onSurface">Giới tính:</span> {patient.gender}</div>
                <div><span className="font-semibold text-onSurface dark:text-dark-onSurface">Liên hệ:</span> {patient.phone}</div>
             </div>
          </div>

          <VitalSignsForm vitals={vitals} onVitalsChange={setVitals} />

          <ICDSelection 
            mainDisease={mainDisease} 
            subDiseases={subDiseases}
            onMainDiseaseChange={setMainDisease}
            onSubDiseasesChange={setSubDiseases}
            isYHCT={false} // Có thể check theo session bác sĩ hoặc khoa
          />

          <DiagnosisForm 
            pathologyProcess={pathologyProcess}
            clinicalExam={clinicalExam}
            preliminaryDiagnosis={preliminaryDiagnosis}
            conclusion={conclusion}
            onPathologyChange={setPathologyProcess}
            onClinicalExamChange={setClinicalExam}
            onPreliminaryDiagnosisChange={setPreliminaryDiagnosis}
            onConclusionChange={setConclusion}
          />

          <DiseasePrehistory patientId={patient.id} />

          <div className="flex justify-end gap-3 mt-4">
              {hasPermission('02.04') && (
                  <button className={`bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-6 rounded-lg shadow-sm transition-all ${fontSettings.controls}`}>
                      Nhập viện
                  </button>
              )}
              {hasPermission('02.01') && (
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all disabled:bg-slate-400 ${fontSettings.controls}`}
                  >
                      {isSaving ? 'Đang lưu...' : 'Lưu kết quả'}
                  </button>
              )}
              {hasPermission('02.02') && (
                  <button 
                    onClick={handleTerminate}
                    className={`bg-secondary hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all ${fontSettings.controls}`}
                  >
                      Kết thúc khám
                  </button>
              )}
              <button 
                onClick={handlePrint}
                disabled={isPrinting}
                className={`flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 px-6 rounded-lg shadow-sm transition-all disabled:opacity-50 ${fontSettings.controls}`}
              >
                  <PrinterIcon className="w-5 h-5" />
                  {isPrinting ? 'Đang in...' : 'In phiếu kết quả'}
              </button>
          </div>
        </div>

        {/* AI Assistant and History */}
        <div className="space-y-6">
           <div className="bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 p-6 rounded-xl shadow-lg border border-blue-200 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center mb-4">
                    <SparklesIcon className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400"/>
                    Trợ lý AI (Gemini)
                </h2>
                
                <button 
                    onClick={handleGetAISuggestions} 
                    disabled={isLoadingAI} 
                    className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all transform active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center ${fontSettings.controls}`}
                >
                    {isLoadingAI ? (
                       <>
                           <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                           </svg>
                           Đang phân tích...
                       </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5 mr-2"/>
                            Phân tích & Gợi ý
                        </>
                    )}
                </button>
                
                {error && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
                        <ExclamationCircleIcon className="w-5 h-5 flex-shrink-0"/>
                        <span>{error}</span>
                    </div>
                )}

                {aiSuggestion && (
                    <div className="mt-6 space-y-4 animate-fade-in">
                       {/* Summary Section */}
                       <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                           <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-2 text-sm uppercase tracking-wide">
                               <DocumentTextIcon className="w-4 h-4 text-blue-500"/> Tóm tắt ca bệnh
                           </h4>
                           <p className={`text-slate-600 dark:text-slate-300 leading-relaxed ${fontSettings.listSecondary}`}>
                               {aiSuggestion.summary}
                           </p>
                       </div>

                       {/* Diagnoses Section */}
                       <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                           <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-2 text-sm uppercase tracking-wide">
                               <ActivityIcon className="w-4 h-4 text-red-500"/> Chẩn đoán tiềm năng
                           </h4>
                           <ul className={`space-y-1.5 ${fontSettings.listSecondary}`}>
                               {aiSuggestion.potentialDiagnoses.map((d, i) => (
                                   <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                                       <span className="text-slate-400 mt-1">•</span>
                                       <span>{d}</span>
                                   </li>
                               ))}
                           </ul>
                       </div>

                       {/* Next Steps Section */}
                       <div className="bg-white dark:bg-slate-800/80 p-4 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                           <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-2 text-sm uppercase tracking-wide">
                               <ClipboardListIcon className="w-4 h-4 text-emerald-500"/> Đề xuất xử trí
                           </h4>
                           <ul className={`space-y-1.5 ${fontSettings.listSecondary}`}>
                               {aiSuggestion.nextSteps.map((s, i) => (
                                   <li key={i} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                                       <span className="text-slate-400 mt-1">•</span>
                                       <span>{s}</span>
                                   </li>
                               ))}
                           </ul>
                       </div>

                       {/* Disclaimer */}
                       <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-100 dark:border-yellow-900/30">
                            <ExclamationCircleIcon className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5"/>
                            <p>Kết quả từ AI chỉ mang tính chất tham khảo. Bác sĩ vui lòng kiểm tra lại các thông tin lâm sàng trước khi ra quyết định.</p>
                       </div>
                    </div>
                )}
           </div>

           {hasPermission('02.05') && (
               <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-600 pb-2 mb-3">Lịch sử khám</h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {history.map(rec => (
                            <div key={rec.id} className={`border-b border-slate-100 dark:border-slate-700 pb-2 last:border-0 ${fontSettings.listSecondary}`}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-semibold text-slate-700 dark:text-slate-200">{rec.date}</span>
                                    <span className="text-slate-500 text-xs">{rec.doctor}</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400"><span className="font-medium">Chẩn đoán:</span> {rec.diagnosis}</p>
                            </div>
                        ))}
                    </div>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ConsultationView;
