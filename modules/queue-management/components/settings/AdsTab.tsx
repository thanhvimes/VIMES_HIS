
import React, { useState, useRef } from 'react';
import { MonitorPlay, Plus, Trash2, Image as ImageIcon, Type, Timer, MessageSquare } from 'lucide-react';
import { AppSettings, AdSlide } from '../../types';

interface AdsTabProps {
  settings: AppSettings;
  onUpdate: (settings: AppSettings) => void;
  onPreviewScreensaver?: () => void;
}

const AdsTab: React.FC<AdsTabProps> = ({ settings, onUpdate, onPreviewScreensaver }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [newTickerText, setNewTickerText] = useState('');

  // --- SLIDE MANAGEMENT ---
  const handleAddSlide = () => {
    const newSlide: AdSlide = {
        id: Date.now().toString(),
        title: 'Tiêu đề mới',
        subtitle: 'Mô tả ngắn gọn về dịch vụ...',
        image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=2000', // Default placeholder
        color: 'from-cyan-900/80 to-blue-900/80'
    };
    onUpdate({
        ...settings,
        adConfig: {
            ...settings.adConfig,
            slides: [...settings.adConfig.slides, newSlide]
        }
    });
  };

  const handleRemoveSlide = (id: string) => {
      onUpdate({
          ...settings,
          adConfig: {
              ...settings.adConfig,
              slides: settings.adConfig.slides.filter(s => s.id !== id)
          }
      });
  };

  const handleUpdateSlide = (id: string, field: keyof AdSlide, value: string) => {
      onUpdate({
          ...settings,
          adConfig: {
              ...settings.adConfig,
              slides: settings.adConfig.slides.map(s => s.id === id ? { ...s, [field]: value } : s)
          }
      });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, slideId: string) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              handleUpdateSlide(slideId, 'image', reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  // --- TICKER MANAGEMENT ---
  const handleAddTicker = () => {
      if (!newTickerText.trim()) return;
      onUpdate({
          ...settings,
          adConfig: {
              ...settings.adConfig,
              newsTicker: [...settings.adConfig.newsTicker, newTickerText.trim()]
          }
      });
      setNewTickerText('');
  };

  const handleRemoveTicker = (index: number) => {
      const newTicker = [...settings.adConfig.newsTicker];
      newTicker.splice(index, 1);
      onUpdate({
          ...settings,
          adConfig: {
              ...settings.adConfig,
              newsTicker: newTicker
          }
      });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        
        {/* SECTION 1: SETTINGS & PREVIEW */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6 items-center justify-between">
            <div className="flex-1 w-full">
                <h5 className="font-bold text-gray-800 text-xl mb-1 flex items-center gap-2">
                    <MonitorPlay className="text-orange-500"/> Cấu hình Màn hình chờ
                </h5>
                <p className="text-sm text-gray-500">Thiết lập thời gian và nội dung quảng cáo khi máy rảnh.</p>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <Timer size={18} className="text-gray-500 ml-2"/>
                    <input 
                        type="number" 
                        min="5"
                        max="3600"
                        className="w-16 p-1 bg-transparent outline-none font-bold text-lg text-center"
                        value={settings.adConfig.screensaverDelaySeconds}
                        onChange={e => onUpdate({
                            ...settings, 
                            adConfig: { ...settings.adConfig, screensaverDelaySeconds: parseInt(e.target.value) || 30 }
                        })}
                    />
                    <span className="text-xs font-bold text-gray-500 mr-2">Giây</span>
                </div>
                
                <button 
                    onClick={onPreviewScreensaver}
                    className="flex-1 md:flex-none py-3 px-6 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 shadow-lg active:scale-95"
                >
                    <MonitorPlay size={20} /> Xem thử
                </button>
            </div>
        </div>

        {/* SECTION 2: SLIDES */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h6 className="font-bold text-gray-700 flex items-center gap-2">
                    <ImageIcon size={18}/> Danh sách Slide ({settings.adConfig.slides.length})
                </h6>
                <button 
                    onClick={handleAddSlide}
                    className="flex items-center gap-1 text-primary font-bold hover:bg-cyan-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Plus size={18} /> Thêm Slide
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {settings.adConfig.slides.map((slide, index) => (
                    <div key={slide.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 group hover:border-cyan-200 transition-colors">
                        {/* Image Preview & Upload */}
                        <div className="w-full md:w-48 h-32 bg-gray-100 rounded-lg overflow-hidden relative shrink-0 border border-gray-100">
                            <img src={slide.image} alt="Slide" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                    onClick={() => {
                                        setEditingSlideId(slide.id);
                                        fileInputRef.current?.click();
                                    }}
                                    className="bg-white/20 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/30 border border-white/50"
                                >
                                    Đổi ảnh
                                </button>
                            </div>
                        </div>

                        {/* Content Inputs */}
                        <div className="flex-1 space-y-3">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Tiêu đề chính</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-primary outline-none font-bold text-gray-800"
                                    value={slide.title}
                                    onChange={e => handleUpdateSlide(slide.id, 'title', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase">Mô tả phụ</label>
                                <input 
                                    type="text" 
                                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-primary outline-none text-gray-600 text-sm"
                                    value={slide.subtitle}
                                    onChange={e => handleUpdateSlide(slide.id, 'subtitle', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-3">
                            <button 
                                onClick={() => handleRemoveSlide(slide.id)}
                                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                                title="Xóa Slide"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
                
                {settings.adConfig.slides.length === 0 && (
                    <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-400">
                        Chưa có slide nào. Nhấn "Thêm Slide" để bắt đầu.
                    </div>
                )}
            </div>
        </div>

        {/* Hidden File Input for Image Upload */}
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={(e) => editingSlideId && handleImageUpload(e, editingSlideId)}
        />

        {/* SECTION 3: NEWS TICKER */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <h6 className="font-bold text-gray-700 flex items-center gap-2">
                <MessageSquare size={18}/> Dòng tin chạy (News Ticker)
            </h6>
            
            <div className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Nhập nội dung thông báo mới..."
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none transition-all"
                    value={newTickerText}
                    onChange={e => setNewTickerText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddTicker()}
                />
                <button 
                    onClick={handleAddTicker}
                    disabled={!newTickerText.trim()}
                    className="bg-gray-800 text-white px-6 rounded-xl font-bold hover:bg-gray-900 disabled:opacity-50 transition-colors"
                >
                    Thêm
                </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {settings.adConfig.newsTicker.map((text, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200 transition-all">
                        <span className="text-gray-700 text-sm flex-1 mr-4"><span className="font-mono text-gray-400 mr-2">#{idx + 1}</span> {text}</span>
                        <button 
                            onClick={() => handleRemoveTicker(idx)}
                            className="text-gray-400 hover:text-red-500 p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {settings.adConfig.newsTicker.length === 0 && (
                    <p className="text-sm text-gray-400 italic text-center py-2">Chưa có thông báo nào.</p>
                )}
            </div>
        </div>

    </div>
  );
};

export default AdsTab;
