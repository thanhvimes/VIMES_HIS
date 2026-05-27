
import React, { useRef } from 'react';
import { ImagePlus, Upload, Building2, Phone } from 'lucide-react';
import { AppSettings } from '../../types';

interface BrandTabProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
}

const LOGO_PRESETS = [
    'https://cdn-icons-png.flaticon.com/512/3063/3063176.png', // Generic Medical
    'https://cdn-icons-png.flaticon.com/512/4320/4320371.png', // Heart Cross
    'https://cdn-icons-png.flaticon.com/512/4140/4140037.png', // Caduceus
    'https://cdn-icons-png.flaticon.com/512/3209/3209074.png', // Hospital Building
];

const BrandTab: React.FC<BrandTabProps> = ({ settings, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              onUpdate({ ...settings, hospitalLogo: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
         <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h5 className="font-bold text-gray-800 text-xl mb-6 flex items-center gap-2">
                <ImagePlus className="text-primary"/> Thiết lập Logo
            </h5>
            <div className="flex flex-col md:flex-row items-start gap-8">
                <div className="w-40 h-40 bg-white rounded-2xl shadow-md border-2 border-gray-100 p-4 flex items-center justify-center relative group shrink-0 mx-auto md:mx-0">
                    <img src={settings.hospitalLogo} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center pointer-events-none">
                        <span className="text-white text-xs font-bold">Preview</span>
                    </div>
                </div>
                
                <div className="w-full space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center justify-center gap-2 p-3 bg-primary text-white rounded-xl font-bold hover:bg-cyan-700 transition-all shadow-md active:scale-95"
                         >
                             <Upload size={18} /> Tải ảnh lên
                         </button>
                         <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleLogoUpload}
                         />
                         <input 
                            type="text" 
                            className="col-span-1 md:col-span-2 p-3 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 outline-none text-sm text-gray-600 transition-all"
                            placeholder="Hoặc dán URL ảnh logo tại đây..."
                            value={settings.hospitalLogo}
                            onChange={e => onUpdate({...settings, hospitalLogo: e.target.value})}
                        />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Logo mẫu:</p>
                        <div className="flex gap-2 justify-center md:justify-start">
                            {LOGO_PRESETS.map((logo, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onUpdate({...settings, hospitalLogo: logo})}
                                    className={`w-12 h-12 rounded-xl border p-2 bg-white hover:border-primary transition-all ${settings.hospitalLogo === logo ? 'ring-2 ring-primary border-primary bg-cyan-50' : 'border-gray-200'}`}
                                >
                                    <img src={logo} className="w-full h-full object-contain" alt="preset" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
         </div>

         <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
            <h5 className="font-bold text-gray-800 text-xl mb-4 flex items-center gap-2">
                <Building2 className="text-primary"/> Thông tin chung
            </h5>
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Tên Bệnh viện (Tiêu đề)</label>
                <input 
                    type="text" 
                    className="w-full p-4 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 outline-none uppercase font-bold text-lg transition-all"
                    placeholder="VD: BỆNH VIỆN ĐA KHOA QUỐC TẾ"
                    value={settings.hospitalName}
                    onChange={e => onUpdate({...settings, hospitalName: e.target.value})}
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Phone size={16} /> Hotline (Hiển thị góc phải)
                </label>
                <input 
                    type="text" 
                    className="w-full p-4 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-50 outline-none font-bold text-orange-600 text-lg transition-all"
                    placeholder="VD: 1900 1234"
                    value={settings.hotline}
                    onChange={e => onUpdate({...settings, hotline: e.target.value})}
                />
            </div>
         </div>
    </div>
  );
};

export default BrandTab;
