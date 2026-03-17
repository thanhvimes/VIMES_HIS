
import React, { useEffect } from 'react';
import { VitalSigns } from '../../../../types';
import { useTheme } from '../../../../contexts/ThemeContext';
import { HeartIcon, ActivityIcon } from '../../../../components/Icons';

interface VitalSignsFormProps {
  vitals: VitalSigns;
  onVitalsChange: (vitals: VitalSigns) => void;
}

const VitalSignsForm: React.FC<VitalSignsFormProps> = ({ vitals, onVitalsChange }) => {
  const { fontSettings } = useTheme();

  const handleInputChange = (field: keyof VitalSigns, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    const updatedVitals = { ...vitals, [field]: numValue };
    
    // Auto-calculate BMI
    if (field === 'weight' || field === 'height') {
      const weight = field === 'weight' ? numValue : vitals.weight;
      const height = field === 'height' ? numValue : vitals.height;
      
      if (weight && height && height > 0) {
        const heightMeters = height / 100;
        updatedVitals.bmi = Math.round((weight / (heightMeters * heightMeters)) * 10) / 10;
      } else {
        updatedVitals.bmi = undefined;
      }
    }
    
    onVitalsChange(updatedVitals);
  };

  const getBMICategory = (bmi?: number) => {
    if (!bmi) return null;
    if (bmi < 18.5) return { label: 'Gầy', color: 'text-blue-500' };
    if (bmi < 24.9) return { label: 'Bình thường', color: 'text-emerald-500' };
    if (bmi < 29.9) return { label: 'Tiền béo phì', color: 'text-yellow-500' };
    return { label: 'Béo phì', color: 'text-red-500' };
  };

  const bmiCategory = getBMICategory(vitals.bmi);

  return (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
      <div className="flex items-center justify-between border-b dark:border-slate-600 pb-3 mb-5">
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <ActivityIcon className="w-6 h-6 text-primary" />
          Chỉ số sinh tồn (Vital Signs)
        </h2>
        {vitals.bmi && (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-500 uppercase">BMI:</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{vitals.bmi}</span>
            <span className={`text-xs font-bold ${bmiCategory?.color}`}>({bmiCategory?.label})</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {/* Row 1 */}
        <div className="space-y-2">
          <label className={`block font-semibold text-slate-600 dark:text-slate-300 ${fontSettings.controls}`}>
            Mạch (lần/phút)
          </label>
          <div className="relative">
            <input
              type="number"
              value={vitals.pulse ?? ''}
              onChange={(e) => handleInputChange('pulse', e.target.value)}
              className={`w-full p-2.5 pl-10 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all ${fontSettings.controls}`}
              placeholder="0"
            />
            <HeartIcon className="absolute left-3 top-2.5 w-5 h-5 text-red-400 opacity-60" />
          </div>
        </div>

        <div className="space-y-2">
          <label className={`block font-semibold text-slate-600 dark:text-slate-300 ${fontSettings.controls}`}>
            Nhiệt độ (°C)
          </label>
          <input
            type="number"
            step="0.1"
            value={vitals.temperature ?? ''}
            onChange={(e) => handleInputChange('temperature', e.target.value)}
            className={`w-full p-2.5 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all ${fontSettings.controls}`}
            placeholder="36.5"
          />
        </div>

        <div className="space-y-2 col-span-2">
          <label className={`block font-semibold text-slate-600 dark:text-slate-300 ${fontSettings.controls}`}>
            Huyết áp (mmHg)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={vitals.bpSystolic ?? ''}
              onChange={(e) => handleInputChange('bpSystolic', e.target.value)}
              className={`flex-1 p-2.5 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all ${fontSettings.controls}`}
              placeholder="Tâm thu"
            />
            <span className="text-slate-400 font-bold">/</span>
            <input
              type="number"
              value={vitals.bpDiastolic ?? ''}
              onChange={(e) => handleInputChange('bpDiastolic', e.target.value)}
              className={`flex-1 p-2.5 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all ${fontSettings.controls}`}
              placeholder="Tâm trương"
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="space-y-2">
          <label className={`block font-semibold text-slate-600 dark:text-slate-300 ${fontSettings.controls}`}>
            Nhịp thở (lần/phút)
          </label>
          <input
            type="number"
            value={vitals.breathingRate ?? ''}
            onChange={(e) => handleInputChange('breathingRate', e.target.value)}
            className={`w-full p-2.5 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all ${fontSettings.controls}`}
            placeholder="20"
          />
        </div>

        <div className="space-y-2">
          <label className={`block font-semibold text-slate-600 dark:text-slate-300 ${fontSettings.controls}`}>
            Cân nặng (kg)
          </label>
          <input
            type="number"
            step="0.1"
            value={vitals.weight ?? ''}
            onChange={(e) => handleInputChange('weight', e.target.value)}
            className={`w-full p-2.5 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all ${fontSettings.controls}`}
            placeholder="0.0"
          />
        </div>

        <div className="space-y-2">
          <label className={`block font-semibold text-slate-600 dark:text-slate-300 ${fontSettings.controls}`}>
            Chiều cao (cm)
          </label>
          <input
            type="number"
            value={vitals.height ?? ''}
            onChange={(e) => handleInputChange('height', e.target.value)}
            className={`w-full p-2.5 bg-inherit border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all ${fontSettings.controls}`}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <label className={`block font-semibold text-slate-600 dark:text-slate-300 ${fontSettings.controls}`}>
            BMI
          </label>
          <div className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-bold ${fontSettings.controls}`}>
            {vitals.bmi ?? '--'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitalSignsForm;
