
import React from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { DocumentTextIcon, ClipboardListIcon, InformationCircleIcon } from '../../../../components/Icons';

interface DiagnosisFormProps {
  pathologyProcess: string;
  clinicalExam: string;
  preliminaryDiagnosis: string;
  conclusion: string;
  onPathologyChange: (val: string) => void;
  onClinicalExamChange: (val: string) => void;
  onPreliminaryDiagnosisChange: (val: string) => void;
  onConclusionChange: (val: string) => void;
}

const DiagnosisForm: React.FC<DiagnosisFormProps> = ({
  pathologyProcess,
  clinicalExam,
  preliminaryDiagnosis,
  conclusion,
  onPathologyChange,
  onClinicalExamChange,
  onPreliminaryDiagnosisChange,
  onConclusionChange
}) => {
  const { fontSettings } = useTheme();

  return (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 space-y-6">
      <div className="flex items-center justify-between border-b dark:border-slate-600 pb-3">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <DocumentTextIcon className="w-6 h-6 text-primary" />
          Nội dung chuyên môn
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Quá trình bệnh lý */}
        <div className="space-y-2">
          <label className={`flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 ${fontSettings.controls}`}>
            <InformationCircleIcon className="w-4 h-4 text-blue-500" />
            Vấn đề bệnh lý / Triệu chứng
          </label>
          <textarea
            value={pathologyProcess}
            onChange={(e) => onPathologyChange(e.target.value)}
            rows={3}
            className={`w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none ${fontSettings.controls}`}
            placeholder="Mô tả diễn biến bệnh, lý do vào viện..."
          />
        </div>

        {/* Khám lâm sàng */}
        <div className="space-y-2">
          <label className={`flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300 ${fontSettings.controls}`}>
            <ClipboardListIcon className="w-4 h-4 text-emerald-500" />
            Khám lâm sàng
          </label>
          <textarea
            value={clinicalExam}
            onChange={(e) => onClinicalExamChange(e.target.value)}
            rows={4}
            className={`w-full p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none ${fontSettings.controls}`}
            placeholder="Kết quả khám các cơ quan, bộ phận..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chẩn đoán ban đầu */}
          <div className="space-y-2">
            <label className={`block font-bold text-slate-700 dark:text-slate-300 ${fontSettings.controls}`}>
              Chẩn đoán sơ bộ
            </label>
            <input
              type="text"
              value={preliminaryDiagnosis}
              onChange={(e) => onPreliminaryDiagnosisChange(e.target.value)}
              className={`w-full p-3 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all ${fontSettings.controls}`}
              placeholder="Chẩn đoán khi mới tiếp nhận"
            />
          </div>

          {/* Kết luận */}
          <div className="space-y-2">
            <label className={`block font-bold text-slate-700 dark:text-slate-300 ${fontSettings.controls}`}>
              Kết luận / Hướng xử trí
            </label>
            <input
              type="text"
              value={conclusion}
              onChange={(e) => onConclusionChange(e.target.value)}
              className={`w-full p-3 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all ${fontSettings.controls}`}
              placeholder="Tóm tắt chẩn đoán và hướng điều trị"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisForm;
