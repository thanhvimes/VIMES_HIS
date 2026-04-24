
import React, { useState, useEffect, useMemo } from 'react';
import { useQueue } from '../context/QueueContext';
import { Room } from '../types';
import { DEPARTMENTS } from '../constants';
import { DISPLAY_TEMPLATES, TEMPLATE_STORAGE_KEY, DisplayTemplate } from '../data/displayTemplates';

interface SettingsProps {
  onBack: () => void;
  onRoomChange: (id: string) => void;
}

/* ── Mini preview card minh họa màn hình ── */
const TemplatePreviewCard: React.FC<{ template: DisplayTemplate; isSelected: boolean }> = ({ template, isSelected }) => {
  const p = template.preview || { bg: '#000', headerBg: '#111', accent: '#3b82f6', text: '#fff', subText: '#999', rowEven: '#222', rowOdd: '#111', tickerBg: '#050505', tickerText: '#fff', border: '#333' };
  
  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300 cursor-pointer"
      style={{
        background: p.bg,
        border: `2px solid ${isSelected ? p.accent : 'rgba(0,0,0,0)'}`,
        boxShadow: isSelected
          ? `0 0 0 2px ${p.accent}40, 0 8px 32px ${p.accent}20`
          : '0 2px 8px rgba(0,0,0,0.3)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Mini header */}
      <div className="px-3 py-2 flex items-center justify-between" style={{ background: p.headerBg }}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: p.accent, opacity: 0.8 }} />
          <div className="h-2 rounded w-16" style={{ background: p.text, opacity: 0.7 }} />
        </div>
        <div className="text-[8px] font-mono" style={{ color: p.text, opacity: 0.8 }}>17:30</div>
      </div>

      {/* Mini ticker */}
      <div className="py-1 px-2 flex items-center gap-1 overflow-hidden" style={{ background: p.tickerBg }}>
        <div className="text-[6px] font-bold px-1 rounded" style={{ background: p.accent + '22', color: p.tickerText }}>TB</div>
        <div className="h-1.5 rounded flex-1" style={{ background: p.tickerText, opacity: 0.4 }} />
      </div>

      {/* Mini body: number + waiting list */}
      <div className="flex" style={{ height: '68px' }}>
        <div className="flex-1 flex items-center justify-center border-r" style={{ borderColor: p.border }}>
          <span className="font-black font-mono" style={{ fontSize: '18px', color: p.accent, textShadow: `0 0 16px ${p.accent}60` }}>
            K-007
          </span>
        </div>
        <div className="w-2/5" style={{ background: p.rowOdd }}>
          {['K-008', 'K-009'].map((code, i) => (
            <div key={code} className="flex items-center gap-1 px-2 py-[3px]"
              style={{
                background: i % 2 === 0 ? p.rowEven : p.rowOdd,
                borderLeft: i === 0 ? `2px solid ${p.accent}` : '2px solid transparent',
              }}>
              <span className="font-mono font-bold text-[8px]" style={{ color: i === 0 ? p.accent : p.subText }}>{code}</span>
              <div className="h-1 rounded flex-1" style={{ background: p.text, opacity: 0.1 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Settings: React.FC<SettingsProps> = ({ onBack, onRoomChange }) => {
  const { room, updateRoom, roomId } = useQueue();
  
  // Use a fallback to ensure room is never null
  const initialData = useMemo(() => room || { 
    id: '', code: '', name: '', doctorName: '', description: '', 
    startTime: '07:00', endTime: '17:00', avgDuration: 15, 
    maxCapacity: 50, isActive: true, enabledDefaultAds: [] 
  }, [room]);

  const [formData, setFormData] = useState<Room>(initialData);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'voice'>('general');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    () => localStorage.getItem(TEMPLATE_STORAGE_KEY) || 'airport-dark'
  );

  useEffect(() => { 
    if (room) setFormData(room); 
  }, [room]);

  const handleSave = () => {
    updateRoom(formData);
    localStorage.setItem(TEMPLATE_STORAGE_KEY, selectedTemplateId);
    window.dispatchEvent(new CustomEvent('qms-template-change', { detail: selectedTemplateId }));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const TABS = [
    { id: 'general',    label: '⚙ Cài đặt chung' },
    { id: 'appearance', label: '🎨 Giao diện' },
    { id: 'voice',      label: '🔊 Âm thanh & Loa' },
  ] as const;

  return (
    <div className="h-full bg-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-slate-500 hover:text-blue-600 transition-colors font-medium">← Quay lại</button>
          <h1 className="text-xl font-bold uppercase tracking-tight text-slate-800">Thiết lập Phòng khám</h1>
        </div>
        <button
          onClick={handleSave}
          className={`px-6 py-2 rounded-lg font-bold text-white transition-all shadow-md active:scale-95 ${isSaved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isSaved ? '✓ Đã lưu thành công' : 'Lưu cài đặt'}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-50 border-r p-4 space-y-1 flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all text-sm ${
                activeTab === tab.id 
                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200 font-bold' 
                    : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-8 overflow-y-auto bg-slate-50/30">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* ═══ TAB 1: GENERAL ═══ */}
            {activeTab === 'general' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                <section className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 border-b pb-2 uppercase tracking-wider text-xs">Thông tin nhận diện</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase">Tên phòng chính thức</label>
                      <input type="text" value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase">Tên hiển thị (Tùy chọn)</label>
                      <input type="text" value={formData.customDisplayName || ''}
                        onChange={e => setFormData({...formData, customDisplayName: e.target.value})}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        placeholder="VD: Phòng khám Nội 101" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase">Bác sĩ / Cán bộ phụ trách</label>
                    <input type="text" value={formData.doctorName || ''}
                      onChange={e => setFormData({...formData, doctorName: e.target.value})}
                      className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                  </div>
                </section>

                <section className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-800 border-b pb-2 uppercase tracking-wider text-xs">Vị trí & Hoạt động</h3>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-1.5 uppercase">
                      ID Phòng hiện tại: <span className="text-blue-600 font-mono">{roomId}</span>
                    </label>
                    <select onChange={e => onRoomChange(e.target.value)} value={roomId}
                      className="w-full border border-slate-200 rounded-xl p-3 bg-slate-50 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/20">
                      {(DEPARTMENTS || []).map(d => (
                        <optgroup key={d.id} label={d.name}>
                          {d.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700 text-sm">Cho phép lấy số (Kiosk)</p>
                      <p className="text-[11px] text-slate-500">Khi tắt, bệnh nhân chỉ có thể được bác sĩ gọi từ danh sách sẵn có.</p>
                    </div>
                    <button
                      onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                      className={`w-14 h-8 rounded-full transition-all relative flex-shrink-0 ${formData.isActive ? 'bg-green-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${formData.isActive ? 'right-1' : 'left-1'}`} />
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* ═══ TAB 2: APPEARANCE ═══ */}
            {activeTab === 'appearance' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Thư viện giao diện (Template)</h2>
                    <p className="text-xs text-slate-500 mt-1">Chọn mẫu phù hợp với phong cách của bệnh viện.</p>
                  </div>
                  <div className="px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-700 uppercase">
                    Beta: Template v2.0
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {DISPLAY_TEMPLATES.map(t => {
                    const isSel = t.id === selectedTemplateId;
                    return (
                      <div
                        key={t.id}
                        className="flex flex-col group"
                        onClick={() => setSelectedTemplateId(t.id)}
                      >
                        <TemplatePreviewCard template={t} isSelected={isSel} />
                        <div className="mt-3">
                          <div className="flex items-center gap-2">
                             <span className="font-bold text-slate-800 text-sm">{t.name}</span>
                             {isSel && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                          </div>
                          <p className="text-[10px] text-slate-500 leading-tight mt-1">{t.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <section className="bg-white p-6 rounded-2xl border shadow-sm">
                  <h3 className="font-bold text-slate-800 border-b pb-2 uppercase tracking-wider text-xs mb-4">
                    Nội dung thông báo chạy ngang (Marquee)
                  </h3>
                  <textarea
                    value={formData.marqueeMessage || ''}
                    onChange={e => setFormData({...formData, marqueeMessage: e.target.value})}
                    placeholder="VD: Kính mời quý bệnh nhân giữ trật tự tại phòng chờ..."
                    className="w-full border border-slate-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none resize-none hide-scrollbar"
                    rows={3}
                  />
                  <p className="mt-2 text-[10px] text-slate-400 italic">Mẹo: Sử dụng dấu chấm tròn (•) hoặc gạch đứng (|) để ngăn cách các câu thông báo.</p>
                </section>
              </div>
            )}

            {/* ═══ TAB 3: VOICE ═══ */}
            {activeTab === 'voice' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
                <section className="bg-white p-6 rounded-2xl border shadow-sm space-y-6">
                  <h3 className="font-bold text-slate-800 border-b pb-2 uppercase tracking-wider text-xs">Phát thanh gọi số</h3>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Công nghệ giọng nói</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setFormData({...formData, voiceConfig: {...(formData.voiceConfig || {} as any), source: 'GEMINI_AI'}})}
                            className={`p-4 rounded-xl border text-left transition-all ${formData.voiceConfig?.source === 'GEMINI_AI' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className="font-bold text-sm mb-1">Gemini AI Engine</div>
                            <div className="text-[10px] text-slate-500">Giọng nói tự nhiên, mượt mà (Yêu cầu Internet).</div>
                        </button>
                        <button 
                            onClick={() => setFormData({...formData, voiceConfig: {...(formData.voiceConfig || {} as any), source: 'BROWSER_TTS'}})}
                            className={`p-4 rounded-xl border text-left transition-all ${formData.voiceConfig?.source === 'BROWSER_TTS' ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                        >
                            <div className="font-bold text-sm mb-1">Browser Native</div>
                            <div className="text-[10px] text-slate-500">Giọng đọc hệ thống sẵn có (Hoạt động offline).</div>
                        </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase">Mẫu câu thông báo</label>
                    <input 
                        type="text" 
                        value={formData.voiceConfig?.fileBasePath || 'Mời bệnh nhân [NAME], STT [CODE], vào [ROOM]'}
                        onChange={e => setFormData({...formData, voiceConfig: {...(formData.voiceConfig || {} as any), fileBasePath: e.target.value}})}
                        className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                    <div className="mt-2 text-[10px] text-slate-400 flex gap-4 font-mono">
                        <span>[NAME]: Tên</span><span>[CODE]: Số TT</span><span>[ROOM]: Tên phòng</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                     <span className="text-sm font-bold text-slate-700">Tiếng chuông mở đầu (Chime)</span>
                     <button
                        onClick={() => setFormData({...formData, voiceConfig: {...(formData.voiceConfig || {} as any), enableChime: !formData.voiceConfig?.enableChime}})}
                        className={`w-12 h-6 rounded-full transition-all relative ${formData.voiceConfig?.enableChime ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${formData.voiceConfig?.enableChime ? 'right-1' : 'left-1'}`} />
                      </button>
                  </div>
                </section>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};
