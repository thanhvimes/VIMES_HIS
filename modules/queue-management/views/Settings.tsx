import React, { useState, useEffect } from 'react';
import DashboardOverview from '../admin/DashboardOverview';
import ZoningSettings from '../admin/ZoningSettings';
import { 
  Settings, 
  Database, 
  MapPin, 
  Layout, 
  Printer, 
  Volume2, 
  ShieldCheck, 
  Activity,
  Plus,
  Trash2,
  Save,
  ChevronRight,
  Monitor,
  Smartphone,
  Globe,
  Lock,
  Search,
  CheckCircle2,
  XCircle,
  MoreVertical,
  BarChart
} from 'lucide-react';
import { apiFetch } from '../services/apiService';
import { AppSettings } from '../types';
import { DISPLAY_TEMPLATES, DisplayTemplate } from '../services/displayTemplates';

interface AdminConfigProps {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onBack: () => void;
}

const TemplatePreviewCard: React.FC<{ template: DisplayTemplate; isSelected: boolean }> = ({ template, isSelected }) => {
  const p = template.preview || { bg: '#000', headerBg: '#111', accent: '#3b82f6', text: '#fff', subText: '#999', rowEven: '#222', rowOdd: '#111', tickerBg: '#050505', tickerText: '#fff', border: '#333' };
  
  return (
    <div
      className="rounded-[2rem] overflow-hidden border-2 transition-all duration-300 cursor-pointer shadow-sm relative group"
      style={{
        background: p.bg,
        borderColor: isSelected ? p.accent : 'rgba(0,0,0,0.05)',
        boxShadow: isSelected
          ? `0 0 0 2px ${p.accent}40, 0 8px 32px ${p.accent}20`
          : '0 4px 12px rgba(0,0,0,0.03)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      {/* Mini header */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ background: p.headerBg }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded" style={{ background: p.accent, opacity: 0.8 }} />
          <div className="h-1.5 rounded w-12" style={{ background: p.text, opacity: 0.5 }} />
        </div>
        <div className="text-[8px] font-mono" style={{ color: p.text, opacity: 0.6 }}>17:30</div>
      </div>

      {/* Mini ticker */}
      <div className="py-1.5 px-3 flex items-center gap-2 overflow-hidden" style={{ background: p.tickerBg }}>
        <div className="text-[5px] font-bold px-1 rounded" style={{ background: p.accent + '22', color: p.tickerText }}>TB</div>
        <div className="h-1 rounded flex-1" style={{ background: p.tickerText, opacity: 0.3 }} />
      </div>

      {/* Mini body: number + waiting list */}
      <div className="flex" style={{ height: '70px' }}>
        <div className="flex-1 flex items-center justify-center border-r" style={{ borderColor: p.border }}>
          <span className="font-black font-mono" style={{ fontSize: '16px', color: p.accent, textShadow: isSelected ? `0 0 16px ${p.accent}60` : 'none' }}>
            K-007
          </span>
        </div>
        <div className="w-2/5" style={{ background: p.rowOdd }}>
          {['K-008', 'K-009'].map((code, i) => (
            <div key={code} className="flex items-center gap-1 px-2.5 py-[5px]"
              style={{
                background: i % 2 === 0 ? p.rowEven : p.rowOdd,
                borderLeft: i === 0 ? `2px solid ${p.accent}` : '2px solid transparent',
              }}>
              <span className="font-mono font-bold text-[7px]" style={{ color: i === 0 ? p.accent : p.subText }}>{code}</span>
              <div className="h-0.5 rounded flex-1" style={{ background: p.text, opacity: 0.05 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminConfig: React.FC<AdminConfigProps> = ({ settings, onSave, onBack }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'GENERAL' | 'ZONING' | 'DEVICES' | 'SYSTEM' | 'TEMPLATE'>('DASHBOARD');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ db: 'ONLINE', his: 'ONLINE', license: 'ACTIVE' });

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localSettings);
      alert("Cấu hình đã được cập nhật thành công!");
    } catch (e) {
      alert("Lỗi lưu cấu hình.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#f8fafc] flex flex-col overflow-hidden font-sans">
      
      {/* Premium Header */}
      <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between z-10 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
               <Settings size={20} />
            </div>
            <div>
               <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Hệ thống <span className="text-blue-600">QMS Control</span></h1>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cấu hình & Thiết lập tham số</p>
            </div>
         </div>

         <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="px-6 py-2 bg-slate-50 text-slate-500 rounded-xl font-black text-[10px] tracking-widest hover:bg-slate-100 transition-all uppercase"
            >
               Thoát
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-2 bg-blue-600 text-white rounded-xl font-black text-[10px] tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all uppercase flex items-center gap-2"
            >
               {isSaving ? <div className="h-3 w-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={14} />}
               Lưu thay đổi
            </button>
         </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
         
         {/* Navigation Sidebar */}
         <aside className="w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-2">
            {[
               { id: 'DASHBOARD', label: 'Thống kê & Báo cáo', icon: <BarChart size={18} />, color: 'text-blue-600' },
               { id: 'GENERAL', label: 'Cấu hình chung', icon: <Globe size={18} />, color: 'text-blue-600' },
               { id: 'ZONING', label: 'Phân vùng & Quầy', icon: <MapPin size={18} />, color: 'text-emerald-600' },
               { id: 'DEVICES', label: 'Thiết bị & Phụ kiện', icon: <Monitor size={18} />, color: 'text-purple-600' },
               { id: 'SYSTEM', label: 'Hệ thống & Bảo mật', icon: <Lock size={18} />, color: 'text-rose-600' },
               { id: 'TEMPLATE', label: 'Template', icon: <Layout size={18} />, color: 'text-amber-600' }
            ].map((item) => (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id as any)}
                 className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${activeTab === item.id ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-slate-50'}`}
               >
                  <span className={activeTab === item.id ? 'text-blue-600' : 'text-slate-400'}>{item.icon}</span>
                  {item.label}
                  {activeTab === item.id && <ChevronRight size={14} className="ml-auto" />}
               </button>
            ))}

            <div className="mt-auto p-6 bg-slate-50 rounded-3xl space-y-4">
               <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Trạng thái hệ thống</h4>
               <div className="space-y-3">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Database</span>
                     <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase">
                        <CheckCircle2 size={10} /> Trực tuyến
                     </div>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-slate-500 uppercase">HIS Sync</span>
                     <div className="flex items-center gap-1 text-[9px] font-black text-emerald-500 uppercase">
                        <CheckCircle2 size={10} /> Kết nối
                     </div>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-bold text-slate-500 uppercase">License</span>
                     <div className="flex items-center gap-1 text-[9px] font-black text-blue-500 uppercase">
                        <ShieldCheck size={10} /> Active
                     </div>
                  </div>
               </div>
            </div>
         </aside>

         {/* Content Area */}
         <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            
            {activeTab === 'DASHBOARD' && (
               <div className="space-y-10 animate-in fade-in duration-500">
                  <div className="space-y-2">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Báo cáo lưu lượng</h2>
                     <p className="text-slate-400 text-sm">Tổng quan tình hình tiếp đón và phục vụ bệnh nhân toàn hệ thống.</p>
                  </div>
                  <DashboardOverview />
               </div>
            )}
            
            {activeTab === 'GENERAL' && (
               <div className="max-w-4xl space-y-10 animate-in fade-in duration-500">
                  <div className="space-y-2">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Thông tin bệnh viện</h2>
                     <p className="text-slate-400 text-sm">Cấu hình thông tin cơ bản hiển thị trên các màn hình và phiếu in.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tên bệnh viện</label>
                        <input 
                           type="text" 
                           value={localSettings.hospitalName}
                           onChange={(e) => setLocalSettings({...localSettings, hospitalName: e.target.value})}
                           className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm"
                        />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hotline CSKH</label>
                        <input 
                           type="text" 
                           value={localSettings.hotline}
                           onChange={(e) => setLocalSettings({...localSettings, hotline: e.target.value})}
                           className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm"
                        />
                     </div>
                     <div className="col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mẫu gọi số (Template)</label>
                        <textarea 
                           rows={3}
                           value={localSettings.callingTemplate}
                           onChange={(e) => setLocalSettings({...localSettings, callingTemplate: e.target.value})}
                           className="w-full bg-white border border-slate-200 rounded-2xl p-6 font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm"
                           placeholder="Mời bệnh nhân {name}, số {ticket}, đến {counter}"
                        />
                     </div>
                  </div>

                  <div className="pt-10 border-t border-slate-200 grid grid-cols-2 gap-12">
                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <Printer size={20} className="text-slate-400" />
                           <h3 className="font-black text-slate-900 uppercase text-sm">Cấu hình in ấn</h3>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                              <div>
                                 <p className="text-xs font-bold text-slate-700">Tự động in phiếu</p>
                                 <p className="text-[10px] text-slate-400">Máy in sẽ tự hoạt động sau khi cấp số</p>
                              </div>
                              <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                           </div>
                           <div className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm opacity-50">
                              <div>
                                 <p className="text-xs font-bold text-slate-700">In mã QR theo dõi</p>
                                 <p className="text-[10px] text-slate-400">Tích hợp link theo dõi hàng đợi trên Mobile</p>
                              </div>
                              <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                           </div>
                        </div>
                     </div>
                     
                     <div className="space-y-6">
                        <div className="flex items-center gap-3">
                           <Volume2 size={20} className="text-slate-400" />
                           <h3 className="font-black text-slate-900 uppercase text-sm">Âm thanh & Thông báo</h3>
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                              <div>
                                 <p className="text-xs font-bold text-slate-700">Giọng nói AI (TTS)</p>
                                 <p className="text-[10px] text-slate-400">Sử dụng công nghệ Text-to-Speech tự động</p>
                              </div>
                              <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                           </div>
                           <div className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                              <div>
                                 <p className="text-xs font-bold text-slate-700">Âm báo 'Ping-Pong'</p>
                                 <p className="text-[10px] text-slate-400">Phát âm báo trước khi đọc số</p>
                              </div>
                              <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'ZONING' && <ZoningSettings settings={localSettings} />}

            {activeTab === 'SYSTEM' && (
               <div className="max-w-4xl space-y-10 animate-in fade-in duration-500">
                  <div className="space-y-2">
                     <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Theo dõi hệ thống</h2>
                     <p className="text-slate-400 text-sm">Giám sát hiệu năng và tài nguyên máy chủ VIMES QMS.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                     <div className="bg-slate-900 rounded-[2.5rem] p-10 space-y-8">
                        <div className="flex items-center justify-between">
                           <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">CPU Usage</h4>
                           <Activity size={20} className="text-blue-500 animate-pulse" />
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-end gap-2 h-32 items-end">
                              {[30, 45, 25, 60, 40, 55, 35, 70, 50, 65, 45, 80].map((h, i) => (
                                 <div key={i} className="flex-1 bg-blue-600/30 rounded-t-lg transition-all" style={{ height: `${h}%` }}>
                                    <div className="w-full bg-blue-500 rounded-t-lg" style={{ height: `${h*0.7}%` }}></div>
                                 </div>
                              ))}
                           </div>
                           <div className="flex justify-between items-center text-[10px] font-bold text-white/30 uppercase tracking-widest">
                              <span>08:00 AM</span>
                              <span className="text-blue-400">Peak: 82%</span>
                              <span>10:30 AM</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="p-6 bg-white border border-slate-200 rounded-3xl flex items-center justify-between shadow-sm">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                                 <Database size={24} />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900">PostgreSQL v15</p>
                                 <p className="text-[10px] font-bold text-emerald-500 uppercase">Đang chạy (85ms latency)</p>
                              </div>
                           </div>
                           <button className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">Logs</button>
                        </div>
                        <div className="p-6 bg-white border border-slate-200 rounded-3xl flex items-center justify-between shadow-sm">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                                 <BarChart size={24} />
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900">SSE Stream</p>
                                 <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">128 Clients Active</p>
                              </div>
                           </div>
                           <button className="text-blue-600 font-bold text-[10px] uppercase tracking-widest">Dọn dẹp</button>
                        </div>
                        <div className="p-6 bg-slate-100/50 rounded-3xl flex items-center justify-between opacity-60">
                           <div className="flex items-center gap-4">
                              <div className="h-12 w-12 bg-white text-slate-300 rounded-2xl flex items-center justify-center">
                                 <Lock size={24} />
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-slate-500 tracking-tight">Security Audit</p>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chưa quét (3 ngày)</p>
                              </div>
                           </div>
                           <button className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest">Chạy ngay</button>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'TEMPLATE' && (
               <div className="max-w-6xl space-y-10 animate-in fade-in duration-500">
                  <div className="flex items-start justify-between">
                     <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Thư viện giao diện (Template)</h2>
                        <p className="text-slate-400 text-sm">Chọn mẫu phù hợp với phong cách và bộ nhận diện thương hiệu của bệnh viện.</p>
                     </div>
                     <div className="px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] font-black text-amber-700 uppercase tracking-widest">
                        Beta: Template v2.0
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {DISPLAY_TEMPLATES.map((t) => {
                        const isSel = (localSettings.displayTemplateId || 'airport-dark') === t.id;
                        return (
                           <div 
                              key={t.id} 
                              onClick={() => setLocalSettings({ ...localSettings, displayTemplateId: t.id })}
                              className="flex flex-col gap-4 group cursor-pointer"
                           >
                              <TemplatePreviewCard template={t} isSelected={isSel} />
                              <div className="px-2 flex flex-col gap-1">
                                 <div className="flex items-center justify-between">
                                    <span className="font-black text-slate-800 text-sm">{t.name}</span>
                                    {isSel && (
                                       <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black uppercase rounded-full tracking-wider">
                                          Đang dùng
                                       </span>
                                    )}
                                 </div>
                                 <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{t.description}</p>
                                 <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {(t.tags || []).map((tag) => (
                                       <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-bold uppercase rounded-md tracking-wider">
                                          {tag}
                                       </span>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>

                  {/* Marquee Ticker Message Option */}
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6 shadow-sm">
                     <div className="space-y-1">
                        <h3 className="font-black text-slate-900 uppercase text-sm">Nội dung thông báo chạy ngang (Marquee)</h3>
                        <p className="text-slate-400 text-xs">Tin nhắn chạy ngang bên dưới màn hình Central Display và Standard Display.</p>
                     </div>
                     <div className="space-y-4">
                        <textarea
                           rows={3}
                           value={(localSettings.adConfig?.newsTicker || []).join('\n')}
                           onChange={(e) => {
                              const lines = e.target.value.split('\n');
                              setLocalSettings({
                                 ...localSettings,
                                 adConfig: {
                                    ...(localSettings.adConfig || {}),
                                    newsTicker: lines
                                 }
                              });
                           }}
                           placeholder="Kính mời quý bệnh nhân giữ trật tự và theo dõi số thứ tự tại phòng chờ...&#10;Chúc quý khách một ngày khám bệnh an lành!..."
                           className="w-full bg-white border border-slate-200 rounded-2xl p-6 font-bold text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm"
                        />
                        <p className="text-[10px] text-slate-400 font-medium">Mẹo: Mỗi dòng văn bản tương ứng với một lượt tin nhắn chạy ngang (Nhấn Enter để thêm tin nhắn mới).</p>
                     </div>
                  </div>
               </div>
            )}

         </main>
      </div>

      {/* Global CSS for Custom Scrollbar */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0,0,0,0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0,0,0,0.1);
        }
      ` }} />
    </div>
  );
};

export default AdminConfig;
