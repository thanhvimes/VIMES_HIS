import React from 'react';
import { SpecialtyFormProps } from './types';

const GeneralForm: React.FC<SpecialtyFormProps> = ({ 
  clinicalExam, 
  onClinicalExamChange, 
  disabled 
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="enterprise-label flex items-center justify-between">
        Khám lâm sàng
        <span className="text-[10px] text-slate-400 normal-case font-normal">Ghi nhận thực thể</span>
      </label>
      <textarea 
        value={clinicalExam || ''} 
        onChange={(e) => onClinicalExamChange?.(e.target.value)}
        disabled={disabled}
        rows={5}
        className="enterprise-input h-auto py-2 leading-relaxed min-h-[120px]"
        placeholder="Ví dụ: Phổi có rale ẩm, họng đỏ, bụng mềm..."
      />
    </div>
  );
};

export default GeneralForm;
