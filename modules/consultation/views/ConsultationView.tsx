import React, { useState, useCallback } from 'react';
import { Patient, ConsultationRecord, AISuggestion } from '../../../types';
import { SparklesIcon } from '../../../components/Icons';
import { getAISuggestions } from '../../../services/geminiService';

const mockPatient: Patient = {
  id: 'P003',
  name: 'Lê Hoàng Cường',
  age: 45,
  gender: 'Male',
  contact: '0987654321',
  lastVisit: '2023-09-15',
};

const mockHistory: ConsultationRecord[] = [
    { id: 'C001', date: '2023-09-15', doctor: 'Dr. Minh', symptoms: 'Đau đầu, chóng mặt', diagnosis: 'Thiếu máu não', prescription: [{id: 'D01', name: 'Ginkgo Biloba', dosage: '1v/ngày', stock: 100}], notes: 'Cần theo dõi thêm' },
    { id: 'C002', date: '2023-05-10', doctor: 'Dr. Minh', symptoms: 'Ho, sốt nhẹ', diagnosis: 'Viêm họng cấp', prescription: [{id: 'D02', name: 'Paracetamol', dosage: '2v/ngày', stock: 200}], notes: 'Nghỉ ngơi, uống nhiều nước' },
];

const ConsultationView: React.FC = () => {
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
        setError('Vui lòng nhập triệu chứng hoặc ghi chú.');
        return;
    }
    setError('');
    setIsLoadingAI(true);
    setAiSuggestion(null);
    try {
        const suggestion = await getAISuggestions(currentSymptoms, currentNotes, patient);
        setAiSuggestion(suggestion);
    } catch (e) {
        setError('Không thể lấy gợi ý từ AI. Vui lòng thử lại.');
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
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-600 dark:text-slate-300">
                <div><span className="font-semibold text-onSurface dark:text-dark-onSurface">Tên:</span> {patient.name}</div>
                <div><span className="font-semibold text-onSurface dark:text-dark-onSurface">Tuổi:</span> {patient.age}</div>
                <div><span className="font-semibold text-onSurface dark:text-dark-onSurface">Giới tính:</span> {patient.gender}</div>
                <div><span className="font-semibold text-onSurface dark:text-dark-onSurface">Liên hệ:</span> {patient.contact}</div>
             </div>
          </div>

          <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
             <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-600 pb-3 mb-4">Ghi chú Khám bệnh</h2>
             <div className="space-y-4">
                <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Triệu chứng</label>
                    <textarea value={currentSymptoms} onChange={e => setCurrentSymptoms(e.target.value)} rows={3} className="w-full p-2 bg-inherit border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"></textarea>
                </div>
                <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Ghi chú/Kết quả khám</label>
                    <textarea value={currentNotes} onChange={e => setCurrentNotes(e.target.value)} rows={4} className="w-full p-2 bg-inherit border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"></textarea>
                </div>
                 <div>
                    <label className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">Chẩn đoán</label>
                    <input type="text" value={currentDiagnosis} onChange={e => setCurrentDiagnosis(e.target.value)} className="w-full p-2 bg-inherit border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary" />
                </div>
                <div className="text-right">
                    <button className="bg-secondary hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
                        Lưu kết quả
                    </button>
                </div>
             </div>
          </div>
        </div>

        {/* AI Assistant and History */}
        <div className="space-y-6">
           <div className="bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 flex items-center mb-4">
                    <SparklesIcon className="w-6 h-6 mr-2 text-primary-dark dark:text-dark-primary"/>
                    AI Clinical Assistant
                </h2>
                <button onClick={handleGetAISuggestions} disabled={isLoadingAI} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center">
                    {isLoadingAI ? (
                       <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                    ) : 'Phân tích & Gợi ý'}
                </button>
                {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                {aiSuggestion && (
                    <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                       <div>
                           <h4 className="font-semibold text-onSurface dark:text-dark-onSurface">Tóm tắt:</h4>
                           <p className="pl-2 border-l-2 border-primary-light dark:border-dark-primary">{aiSuggestion.summary}</p>
                       </div>
                       <div>
                           <h4 className="font-semibold text-onSurface dark:text-dark-onSurface">Chẩn đoán tiềm năng:</h4>
                           <ul className="list-disc list-inside pl-2">
                               {aiSuggestion.potentialDiagnoses.map(d => <li key={d}>{d}</li>)}
                           </ul>
                       </div>
                       <div>
                           <h4 className="font-semibold text-onSurface dark:text-dark-onSurface">Bước tiếp theo:</h4>
                           <ul className="list-disc list-inside pl-2">
                               {aiSuggestion.nextSteps.map(s => <li key={s}>{s}</li>)}
                           </ul>
                       </div>
                    </div>
                )}
           </div>

           <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 border-b dark:border-slate-600 pb-2 mb-3">Lịch sử khám</h3>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {history.map(rec => (
                        <div key={rec.id} className="text-sm border-b border-slate-100 dark:border-slate-700 pb-2">
                            <p className="font-semibold text-slate-600 dark:text-slate-300">{rec.date} - {rec.doctor}</p>
                            <p className="text-slate-500 dark:text-slate-400"><span className="font-medium text-onSurface dark:text-dark-onSurface">Chẩn đoán:</span> {rec.diagnosis}</p>
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
