import React from 'react';
import { SpecialtyFormProps } from './types';

const ObstetricForm: React.FC<SpecialtyFormProps> = ({ data, onChange, disabled }) => {
  const updateField = (field: string, value: any) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const para = data.para || '';
  const lmp = data.lmp || '';
  const gestationalAge = data.gestationalAge || '';
  const fetalHeartRate = data.fetalHeartRate || '';
  const examNotes = data.examNotes || '';

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Para */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Chỉ số Para (Sinh-Sớm-Sảy-Sống)</label>
          <input 
            type="text" 
            maxLength={4}
            value={para} 
            onChange={(e) => updateField('para', e.target.value)}
            disabled={disabled}
            placeholder="VD: 1011" 
            className="enterprise-input text-center font-mono font-bold text-blue-600"
          />
        </div>

        {/* Kinh cuối (LMP) */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Ngày kinh cuối (LMP)</label>
          <input 
            type="date" 
            value={lmp} 
            onChange={(e) => updateField('lmp', e.target.value)}
            disabled={disabled}
            className="enterprise-input font-mono"
          />
        </div>

        {/* Tuổi thai (Gestational Age) */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Tuổi thai (Tuần)</label>
          <input 
            type="number" 
            value={gestationalAge} 
            onChange={(e) => updateField('gestationalAge', e.target.value ? parseInt(e.target.value) : '')}
            disabled={disabled}
            placeholder="VD: 12" 
            className="enterprise-input text-center font-mono"
          />
        </div>

        {/* Tim thai (FHR) */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Nhịp tim thai (lần/phút)</label>
          <input 
            type="number" 
            value={fetalHeartRate} 
            onChange={(e) => updateField('fetalHeartRate', e.target.value ? parseInt(e.target.value) : '')}
            disabled={disabled}
            placeholder="VD: 140" 
            className="enterprise-input text-center font-mono"
          />
        </div>
      </div>

      {/* Obstetric Notes */}
      <div className="flex flex-col gap-1.5 w-full">
        <label className="enterprise-label">Khám bộ phận sinh dục & phần phụ</label>
        <textarea 
          value={examNotes} 
          onChange={(e) => updateField('examNotes', e.target.value)}
          disabled={disabled}
          rows={3}
          className="enterprise-input h-auto py-2 leading-relaxed"
          placeholder="Cổ tử cung, phần phụ, ối, thai..."
        />
      </div>
    </div>
  );
};

export default ObstetricForm;
