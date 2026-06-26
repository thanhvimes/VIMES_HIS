import React from 'react';
import { SpecialtyFormProps } from './types';

const YHCTForm: React.FC<SpecialtyFormProps> = ({ 
  data, 
  onChange, 
  disabled 
}) => {
  const safeData = data || {};
  const updateField = (section: string, field: string, value: string) => {
    const updatedSection = { ...safeData[section] || {}, [field]: value };
    onChange({ ...safeData, [section]: updatedSection });
  };

  const vong = safeData.vong || {};
  const van = safeData.van || {};
  const vanChan = safeData.vanChan || {};
  const thiet = safeData.thiet || {};

  return (
    <div className="space-y-5 w-full">
      <div className="bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 border-b border-emerald-500/20 pb-2">
          🩺 Tứ chẩn (Khám đông y)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* VỌNG CHẨN */}
          <div className="space-y-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block border-l-2 border-emerald-500 pl-2">
              1. Vọng chẩn (Inspection)
            </span>
            <div className="space-y-2">
              <div>
                <label className="enterprise-label !text-[10px]">Thần, sắc, hình thái</label>
                <input 
                  type="text"
                  value={vong.thanSac || ''}
                  onChange={(e) => updateField('vong', 'thanSac', e.target.value)}
                  disabled={disabled}
                  placeholder="Thần tỉnh sắc tươi, hình thái bình thường..."
                  className="enterprise-input py-1 text-xs"
                />
              </div>
              <div>
                <label className="enterprise-label !text-[10px]">Chất lưỡi, rêu lưỡi</label>
                <input 
                  type="text"
                  value={vong.luoi || ''}
                  onChange={(e) => updateField('vong', 'luoi', e.target.value)}
                  disabled={disabled}
                  placeholder="Lưỡi thon đỏ, rêu lưỡi mỏng trắng..."
                  className="enterprise-input py-1 text-xs"
                />
              </div>
            </div>
          </div>

          {/* VĂN CHẨN */}
          <div className="space-y-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block border-l-2 border-emerald-500 pl-2">
              2. Văn chẩn (Auscultation & Olfaction)
            </span>
            <div className="space-y-2">
              <div>
                <label className="enterprise-label !text-[10px]">Tiếng nói, tiếng thở, tiếng ho</label>
                <input 
                  type="text"
                  value={van.amThanh || ''}
                  onChange={(e) => updateField('van', 'amThanh', e.target.value)}
                  disabled={disabled}
                  placeholder="Tiếng nói to rõ, không ho, không khó thở..."
                  className="enterprise-input py-1 text-xs"
                />
              </div>
              <div>
                <label className="enterprise-label !text-[10px]">Mùi (Chất thải, hơi thở)</label>
                <input 
                  type="text"
                  value={van.mui || ''}
                  onChange={(e) => updateField('van', 'mui', e.target.value)}
                  disabled={disabled}
                  placeholder="Không mùi dị thường..."
                  className="enterprise-input py-1 text-xs"
                />
              </div>
            </div>
          </div>

          {/* VẤN CHẨN */}
          <div className="space-y-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 md:col-span-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block border-l-2 border-emerald-500 pl-2">
              3. Vấn chẩn (Inquiry)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="enterprise-label !text-[10px]">Hàn nhiệt (Sốt/Sợ lạnh)</label>
                <input 
                  type="text"
                  value={vanChan.hanNhiet || ''}
                  onChange={(e) => updateField('vanChan', 'hanNhiet', e.target.value)}
                  disabled={disabled}
                  placeholder="Không sốt, không sợ lạnh..."
                  className="enterprise-input py-1 text-xs"
                />
              </div>
              <div>
                <label className="enterprise-label !text-[10px]">Hãn (Mồ hôi)</label>
                <input 
                  type="text"
                  value={vanChan.han || ''}
                  onChange={(e) => updateField('vanChan', 'han', e.target.value)}
                  disabled={disabled}
                  placeholder="Ra mồ hôi trộm / Tự hãn..."
                  className="enterprise-input py-1 text-xs"
                />
              </div>
              <div>
                <label className="enterprise-label !text-[10px]">Ăn uống, Tiêu hóa, Miên (Ngủ)</label>
                <input 
                  type="text"
                  value={vanChan.tieuHoa || ''}
                  onChange={(e) => updateField('vanChan', 'tieuHoa', e.target.value)}
                  disabled={disabled}
                  placeholder="Ăn kém, ngủ chập chờn..."
                  className="enterprise-input py-1 text-xs"
                />
              </div>
            </div>
          </div>

          {/* THIẾT CHẨN */}
          <div className="space-y-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 md:col-span-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block border-l-2 border-emerald-500 pl-2">
              4. Thiết chẩn (Palpation & Pulse)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="enterprise-label !text-[10px]">Mạch chẩn (Xúc chẩn mạch)</label>
                <input 
                  type="text"
                  value={thiet.machChan || ''}
                  onChange={(e) => updateField('thiet', 'machChan', e.target.value)}
                  disabled={disabled}
                  placeholder="Mạch Trầm Trì / Phù Sác / Hoạt..."
                  className="enterprise-input py-1 text-xs"
                />
              </div>
              <div>
                <label className="enterprise-label !text-[10px]">Bụng, da thịt, kinh lạc khác</label>
                <input 
                  type="text"
                  value={thiet.kinhLac || ''}
                  onChange={(e) => updateField('thiet', 'kinhLac', e.target.value)}
                  disabled={disabled}
                  placeholder="Ấn đau hạ sườn, da ấm..."
                  className="enterprise-input py-1 text-xs"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default YHCTForm;
