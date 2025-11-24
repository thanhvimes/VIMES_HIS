
import React, { useState, useCallback } from 'react';
import { Patient, ConsultationRecord, AISuggestion } from '../../../types';
import { 
    SparklesIcon, 
    DocumentTextIcon, 
    ActivityIcon, 
    ClipboardListIcon, 
    ExclamationCircleIcon 
} from '../../../components/Icons';
import { getAISuggestions } from '../../../services/geminiService';
import { useTheme } from '../../../contexts/ThemeContext';

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
    { id: 'C001', date: '2023-09-15', doctor: 'Dr. Minh', symptoms: 'Đau đầu, chóng mặt', diagnosis: 'Thiếu máu não', prescription: [{id: 'D01', name: 'Ginkgo Biloba', dosage: '1v/ngày', stock: 100}], notes: 'Cần theo dõi thêm' },
    { id: 'C002', date: '2023-05-10', doctor: 'Dr. Minh', symptoms: 'Ho, sốt nhẹ', diagnosis: 'Viêm họng cấp', prescription: [{id: 'D02', name: 'Paracetamol', dosage: '2v/ngày', stock: 200}], notes: 'Nghỉ ngơi, uống nhiều nước' },
];

const ConsultationView: React.FC = () => {
  const { fontSettings } = useTheme();
  const [patient] = useState<Patient>(mockPatient);
  const [history] = useState<ConsultationRecord[]>(mockHistory);
  const [currentSymptoms, setCurrentSymptoms] = useState('');
  const [currentDiagnosis, setCurrentDiagnosis] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [error, setError] = useState('');
  
  const handleGetAISuggestions = useCallback(async () => {
    if (!currentSymptoms && !currentNotes) {
        setError('Vui lòng nhập triệu chứng hoặc ghi chú để AI phân tích.');
        return;
    }
    setError('');
    setIsLoadingAI(true);
    setAiSuggestion(null);
    try {
        const suggestion = await getAISuggestions(currentSymptoms, currentNotes, patient);
        setAiSuggestion(suggestion);
    } catch (e) {
        setError('Không thể kết nối với trợ lý AI. Vui lòng thử lại sau.');
        console.error(e);
    } finally {
        setIsLoadingAI(false);
    }
  }, [currentSymptoms, currentNotes, patient]);

  return (
    <div className="space-y-6">
       <p className="text-slate-500 dark:text-slate-400 -mt-2">Ghi nhận thông tin khám, chẩn đoán và sử dụng trợ lý AI để có gợi ý chuyên môn.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Consultation Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
             <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-600 pb-3 mb-4">Thông tin bệnh nhân</h2>
             <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-600 dark:text-slate-300 ${fontSettings.listSecondary}`}>
                <div><span className="font-semibold text-onSurface dark:text-dark-onSurface">Tên:</span> {patient.name}</div>
                <div><span className="font-semibold text-onSurface dark:text-dark-onSurface">Tuổi:</span> {patient.age}</div>
                <div><span className="font-semibold text-onSurface dark:text-dark-onSurface">Giới tính:</span> {patient.gender}</div>
                <div><span className="font-semibold text-onSurface dark:text-dark-onSurface">Liên hệ:</span> {patient.phone}</div>
             </div>
          </div>

          <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
             <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-600 pb-3 mb-4">Ghi chú Khám bệnh</h2>
             <div className="space-y-4">
                <div>
                    <label className={`font-semibold text-slate-600 dark:text-slate-300 block mb-1 ${fontSettings.controls}`}>Triệu chứng & Lý do khám</label>
                    <textarea 
                        value={currentSymptoms} 
                        onChange={e => setCurrentSymptoms(e.target.value)} 
                        rows={3} 
                        placeholder="VD: Đau đầu dữ dội vùng thái dương, kèm buồn nôn..."
                        className={`w-full p-3 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow ${fontSettings.controls}`}
                    ></textarea>
                </div>
                <div>
                    <label className={`font-semibold text-slate-600 dark:text-slate-300 block mb-1 ${fontSettings.controls}`}>Khám lâm sàng / Ghi chú</label>
                    <textarea 
                        value={currentNotes} 
                        onChange={e => setCurrentNotes(e.target.value)} 
                        rows={4} 
                        placeholder="VD: Huyết áp 140/90, Phổi trong, không rales..."
                        className={`w-full p-3 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow ${fontSettings.controls}`}
                    ></textarea>
                </div>
                 <div>
                    <label className={`font-semibold text-slate-600 dark:text-slate-300 block mb-1 ${fontSettings.controls}`}>Chẩn đoán sơ bộ</label>
                    <input 
                        type="text" 
                        value={currentDiagnosis} 
                        onChange={e => setCurrentDiagnosis(e.target.value)} 
                        placeholder="Nhập chẩn đoán..."
                        className={`w-full p-3 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-shadow ${fontSettings.controls}`} 
                    />
                </div>
                <div className="text-right">
                    <button className={`bg-secondary hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105 ${fontSettings.controls}`}>
                        Lưu kết quả
                    </button>
                </div>
             </div>
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
        </div>
      </div>
    </div>
  );
};

export default ConsultationView;
