import React from 'react';
import { SpecialtyFormProps } from './types';

const OphthalmicForm: React.FC<SpecialtyFormProps> = ({ data, onChange, disabled }) => {
  const updateField = (section: string, field: string, value: any) => {
    const updated = {
      ...data,
      [section]: {
        ...data[section],
        [field]: value
      }
    };
    onChange(updated);
  };

  const updateRootField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const visualAcuity = data.visualAcuity || {};
  const intraocularPressure = data.intraocularPressure || {};
  const examNotes = data.examNotes || '';

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1: Visual Acuity */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Thị lực</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Mắt Phải (Không kính)</label>
              <input 
                type="text" 
                value={visualAcuity.rightUnassisted || ''} 
                onChange={(e) => updateField('visualAcuity', 'rightUnassisted', e.target.value)}
                disabled={disabled}
                placeholder="VD: 10/10" 
                className="enterprise-input text-center font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Mắt Trái (Không kính)</label>
              <input 
                type="text" 
                value={visualAcuity.leftUnassisted || ''} 
                onChange={(e) => updateField('visualAcuity', 'leftUnassisted', e.target.value)}
                disabled={disabled}
                placeholder="VD: 10/10" 
                className="enterprise-input text-center font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Mắt Phải (Có kính)</label>
              <input 
                type="text" 
                value={visualAcuity.rightCorrected || ''} 
                onChange={(e) => updateField('visualAcuity', 'rightCorrected', e.target.value)}
                disabled={disabled}
                placeholder="VD: 10/10" 
                className="enterprise-input text-center font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Mắt Trái (Có kính)</label>
              <input 
                type="text" 
                value={visualAcuity.leftCorrected || ''} 
                onChange={(e) => updateField('visualAcuity', 'leftCorrected', e.target.value)}
                disabled={disabled}
                placeholder="VD: 10/10" 
                className="enterprise-input text-center font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Intraocular Pressure */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-3">Nhãn áp</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Mắt Phải (mmHg)</label>
              <input 
                type="number" 
                value={intraocularPressure.right || ''} 
                onChange={(e) => updateField('intraocularPressure', 'right', e.target.value ? parseFloat(e.target.value) : '')}
                disabled={disabled}
                placeholder="VD: 16" 
                className="enterprise-input text-center font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 block mb-1">Mắt Trái (mmHg)</label>
              <input 
                type="number" 
                value={intraocularPressure.left || ''} 
                onChange={(e) => updateField('intraocularPressure', 'left', e.target.value ? parseFloat(e.target.value) : '')}
                disabled={disabled}
                placeholder="VD: 16" 
                className="enterprise-input text-center font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: General Eye Exam Notes */}
      <div className="flex flex-col gap-1.5 w-full">
        <label className="enterprise-label">Kết quả khám mắt chi tiết</label>
        <textarea 
          value={examNotes} 
          onChange={(e) => updateRootField('examNotes', e.target.value)}
          disabled={disabled}
          rows={3}
          className="enterprise-input h-auto py-2 leading-relaxed"
          placeholder="Khám kết mạc, giác mạc, soi đáy mắt..."
        />
      </div>
    </div>
  );
};

export default OphthalmicForm;
