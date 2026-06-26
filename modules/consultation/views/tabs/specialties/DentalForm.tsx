import React from 'react';
import { SpecialtyFormProps } from './types';

const DentalForm: React.FC<SpecialtyFormProps> = ({ data, onChange, disabled }) => {
  const updateField = (field: string, value: any) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const teethStatus = data.teethStatus || '';
  const gums = data.gums || '';
  const oralMucosa = data.oralMucosa || '';
  const bite = data.bite || '';

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tình trạng răng / Sơ đồ răng miệng dạng văn bản */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Tình trạng răng / Sơ đồ răng bệnh lý</label>
          <textarea 
            value={teethStatus} 
            onChange={(e) => updateField('teethStatus', e.target.value)}
            disabled={disabled}
            rows={2}
            className="enterprise-input h-auto py-2 leading-relaxed"
            placeholder="VD: Răng 18 sâu men, Răng 36 lung lay độ 2..."
          />
        </div>

        {/* Khớp cắn */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Khớp cắn & Hàm mặt</label>
          <textarea 
            value={bite} 
            onChange={(e) => updateField('bite', e.target.value)}
            disabled={disabled}
            rows={2}
            className="enterprise-input h-auto py-2 leading-relaxed"
            placeholder="Khớp cắn chuẩn/ngược, khớp thái dương hàm..."
          />
        </div>

        {/* Nướu / Lợi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Nướu, quanh răng & Cao răng</label>
          <textarea 
            value={gums} 
            onChange={(e) => updateField('gums', e.target.value)}
            disabled={disabled}
            rows={2}
            className="enterprise-input h-auto py-2 leading-relaxed"
            placeholder="Có cao răng dưới nướu, viêm lợi xuất huyết..."
          />
        </div>

        {/* Niêm mạc miệng */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Niêm mạc miệng, Lưỡi & Tuyến nước bọt</label>
          <textarea 
            value={oralMucosa} 
            onChange={(e) => updateField('oralMucosa', e.target.value)}
            disabled={disabled}
            rows={2}
            className="enterprise-input h-auto py-2 leading-relaxed"
            placeholder="Niêm mạc má láng giũ, không loét nhiệt..."
          />
        </div>
      </div>
    </div>
  );
};

export default DentalForm;
