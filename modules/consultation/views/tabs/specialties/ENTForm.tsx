import React from 'react';
import { SpecialtyFormProps } from './types';

const ENTForm: React.FC<SpecialtyFormProps> = ({ data, onChange, disabled }) => {
  const updateField = (field: string, value: any) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  const ear = data.ear || '';
  const nose = data.nose || '';
  const throat = data.throat || '';
  const larynx = data.larynx || '';

  return (
    <div className="space-y-4 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tai */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Khám Tai (Trái/Phải)</label>
          <textarea 
            value={ear} 
            onChange={(e) => updateField('ear', e.target.value)}
            disabled={disabled}
            rows={2}
            className="enterprise-input h-auto py-2 leading-relaxed"
            placeholder="Màng nhĩ, ống tai ngoài..."
          />
        </div>

        {/* Mũi */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Khám Mũi - Xoang</label>
          <textarea 
            value={nose} 
            onChange={(e) => updateField('nose', e.target.value)}
            disabled={disabled}
            rows={2}
            className="enterprise-input h-auto py-2 leading-relaxed"
            placeholder="Hốc mũi, cuốn mũi, dịch tiết..."
          />
        </div>

        {/* Họng */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Khám Họng - Miệng</label>
          <textarea 
            value={throat} 
            onChange={(e) => updateField('throat', e.target.value)}
            disabled={disabled}
            rows={2}
            className="enterprise-input h-auto py-2 leading-relaxed"
            placeholder="Niêm mạc họng, Amidan, màn hầu..."
          />
        </div>

        {/* Thanh quản */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-slate-500 block mb-1">Thanh quản</label>
          <textarea 
            value={larynx} 
            onChange={(e) => updateField('larynx', e.target.value)}
            disabled={disabled}
            rows={2}
            className="enterprise-input h-auto py-2 leading-relaxed"
            placeholder="Dây thanh, sụn phễu, thanh môn..."
          />
        </div>
      </div>
    </div>
  );
};

export default ENTForm;
