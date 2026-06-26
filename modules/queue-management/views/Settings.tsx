import React, { useState, useEffect, useRef } from 'react';
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
  BarChart,
  FileCode,
  Upload,
  RotateCcw
} from 'lucide-react';
import { apiFetch } from '../services/apiService';
import { AppSettings } from '../types';
import { DEFAULT_THEME_COLORS, CustomTheme } from '../services/displayTemplates';
import { DEFAULT_HTML_TEMPLATE } from '../services/printerService';
import { DEFAULT_IMAGE_TEMPLATE } from '../services/ticketTemplate';

interface AdminConfigProps {
  settings: AppSettings;
  onSave: (s: AppSettings) => void;
  onBack: () => void;
}

const TemplatePreviewCard: React.FC<{ customTheme?: { bg: string; headerBg: string; text: string; accent: string } }> = ({ customTheme }) => {
  const p = customTheme || DEFAULT_THEME_COLORS;
  
  return (
    <div
      className="rounded-[2.5rem] overflow-hidden border border-slate-200/60 shadow-xl relative w-full max-w-sm mx-auto"
      style={{
        background: p.bg,
      }}
    >
      {/* Mini header */}
      <div className="px-6 py-4 flex items-center justify-between" style={{ background: p.headerBg }}>
        <div className="flex items-center gap-2">
          <div className="w-3.5 h-3.5 rounded-full" style={{ background: p.text, opacity: 0.9 }} />
          <div className="h-2 rounded w-24" style={{ background: p.text, opacity: 0.5 }} />
        </div>
        <div className="text-[10px] font-mono font-black" style={{ color: p.text, opacity: 0.8 }}>17:30:00</div>
      </div>

      {/* Mini body: number + waiting list */}
      <div className="flex" style={{ height: '120px' }}>
        <div className="flex-1 flex flex-col items-center justify-center border-r border-slate-200/40">
          <span className="text-[10px] font-black uppercase opacity-40 mb-1" style={{ color: p.accent }}>Đang gọi</span>
          <span className="font-black font-mono text-3xl tracking-tight" style={{ color: p.accent }}>
            K-007
          </span>
        </div>
        <div className="w-[45%] flex flex-col justify-center gap-1.5 p-4" style={{ background: 'rgba(0,0,0,0.01)' }}>
          {['K-008', 'K-009'].map((code, i) => (
            <div key={code} className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{
                background: i === 0 ? `${p.accent}15` : 'transparent',
                borderLeft: i === 0 ? `3px solid ${p.accent}` : '3px solid transparent',
              }}>
              <span className="font-mono font-bold text-xs" style={{ color: i === 0 ? p.accent : 'rgba(0,0,0,0.4)' }}>{code}</span>
              <span className="text-[8px] font-bold opacity-30" style={{ color: i === 0 ? p.accent : 'rgba(0,0,0,0.8)' }}>1985</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Mini ticker */}
      <div className="py-2.5 px-4 flex items-center gap-2 overflow-hidden border-t border-slate-200/40" style={{ background: 'rgba(0,0,0,0.02)' }}>
        <div className="text-[8px] font-black px-2 py-0.5 rounded text-white" style={{ background: p.accent }}>TIN TỨC</div>
        <div className="h-1 rounded flex-1" style={{ background: 'rgba(0,0,0,0.05)' }} />
      </div>
    </div>
  );
};

const AdminConfig: React.FC<AdminConfigProps> = ({ settings, onSave, onBack }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'GENERAL' | 'ZONING' | 'DEVICES' | 'SYSTEM' | 'TEMPLATE'>('DASHBOARD');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ db: 'ONLINE', his: 'ONLINE', license: 'ACTIVE' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setLocalSettings({
          ...localSettings,
          printerConfig: {
            ...(localSettings.printerConfig || { enabled: true, type: 'DRIVER', language: 'ESC', printerName: 'Máy in 1', ipAddress: '127.0.0.1', port: 9100, printTemplate: '' }),
            printTemplate: content
          }
        });
        alert('Đã nhập mẫu in thành công!');
      }
    };
    reader.readAsText(file);
  };

  const handleResetTemplate = () => {
    if (window.confirm('Hành động này sẽ ghi đè mẫu in hiện tại bằng mẫu mặc định. Bạn có chắc chắn không?')) {
      const defaultTemplate = localSettings.printerConfig?.printMode === 'IMAGE'
        ? DEFAULT_IMAGE_TEMPLATE
        : DEFAULT_HTML_TEMPLATE;
      setLocalSettings({
        ...localSettings,
        printerConfig: {
          ...(localSettings.printerConfig || { enabled: true, type: 'DRIVER', language: 'ESC', printerName: 'Máy in 1', ipAddress: '127.0.0.1', port: 9100, printTemplate: '' }),
          printTemplate: defaultTemplate
        }
      });
    }
  };

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
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Thiết lập màu sắc động</h2>
                        <p className="text-slate-400 text-sm">Tự tùy chỉnh màu sắc cho 3 màn hình hiển thị (Bảng gọi số tại quầy, Bảng gọi số trung tâm, Bảng phòng mổ).</p>
                     </div>
                     <button
                        onClick={() => {
                           if (window.confirm('Bạn có chắc chắn muốn khôi phục về tone màu mặc định gốc của vClinic?')) {
                              setLocalSettings({
                                 ...localSettings,
                                 customTheme: { ...DEFAULT_THEME_COLORS }
                              });
                           }
                        }}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 border border-slate-200 transition-all active:scale-95 shadow-sm"
                     >
                        <RotateCcw size={14} />
                        Khôi phục mặc định
                     </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                     {/* Left: Color Pickers */}
                     <div className="lg:col-span-7 bg-white border border-slate-200 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
                        <div className="space-y-1">
                           <h3 className="font-black text-slate-800 uppercase text-base">Bộ cấu hình màu sắc</h3>
                           <p className="text-slate-400 text-xs">Bấm trực tiếp vào các ô màu bên dưới để thay đổi theo ý muốn.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {[
                              { label: 'Màu nền chính', key: 'bg', desc: 'Màu nền tổng thể của màn hình' },
                              { label: 'Màu nền Header', key: 'headerBg', desc: 'Màu nền thanh tiêu đề phía trên' },
                              { label: 'Màu chữ tiêu đề', key: 'text', desc: 'Màu chữ tên bệnh viện, đồng hồ' },
                              { label: 'Màu nhấn & Số gọi', key: 'accent', desc: 'Màu số thứ tự hiển thị nổi bật' }
                           ].map((colorOpt) => {
                              const val = localSettings.customTheme?.[colorOpt.key as 'bg'|'headerBg'|'text'|'accent'] || DEFAULT_THEME_COLORS[colorOpt.key as 'bg'|'headerBg'|'text'|'accent'];
                              return (
                                 <div key={colorOpt.key} className="space-y-2.5 p-4 rounded-2xl bg-slate-50/50 border border-slate-100">
                                    <div className="flex flex-col">
                                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{colorOpt.label}</label>
                                       <span className="text-[10px] text-slate-400 font-medium">{colorOpt.desc}</span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2 shadow-sm">
                                       <input 
                                          type="color" 
                                          value={val}
                                          onChange={(e) => {
                                             const updatedTheme = {
                                                ...DEFAULT_THEME_COLORS,
                                                ...(localSettings.customTheme || {}),
                                                [colorOpt.key]: e.target.value
                                             };
                                             setLocalSettings({
                                                ...localSettings,
                                                customTheme: updatedTheme
                                             });
                                          }}
                                          className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent"
                                       />
                                       <span className="font-mono text-xs font-bold text-slate-600 uppercase">{val}</span>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>

                     {/* Right: Live Preview Panel */}
                     <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="bg-slate-100/50 border border-slate-200/50 rounded-[2.5rem] p-8 flex flex-col items-center justify-center min-h-[340px] relative">
                           <span className="absolute top-4 left-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">Xem trước thời gian thực (Preview)</span>
                           <TemplatePreviewCard customTheme={localSettings.customTheme} />
                        </div>
                     </div>
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

                  {/* Ticket Print Template Editor */}
                  <div className="bg-white border border-slate-200 rounded-[2rem] p-8 space-y-6 shadow-sm">
                     <div className="flex items-center justify-between">
                        <div className="space-y-1">
                           <h3 className="font-black text-slate-900 uppercase text-sm flex items-center gap-2">
                              <FileCode size={20} className="text-slate-400" /> Mẫu in phiếu lấy số (Ticket Print Template)
                           </h3>
                           <p className="text-slate-400 text-xs">Cấu hình mẫu in ra cho bệnh nhân khi cấp số tại trạm Kiosk.</p>
                        </div>
                        <div className="flex gap-2">
                           <input 
                              type="file" 
                              ref={fileInputRef} 
                              className="hidden" 
                              accept=".html,.txt,.tspl" 
                              onChange={handleImportTemplate} 
                           />
                           <button 
                              onClick={() => fileInputRef.current?.click()} 
                              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all" 
                              title="Nhập File"
                           >
                              <Upload size={16} />
                           </button>
                           <button 
                              onClick={handleResetTemplate} 
                              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-all" 
                              title="Reset Mặc định"
                           >
                              <RotateCcw size={16} />
                           </button>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="p-3 bg-yellow-50 text-yellow-800 text-xs rounded-xl border border-yellow-100 flex flex-wrap gap-x-4 gap-y-2">
                           <div className="w-full font-bold mb-1">Từ khóa động (Placeholders):</div>
                           <code>{`{{hospitalName}}`}</code>
                           <code>{`{{ticketNumber}}`}</code>
                           <code>{`{{patientName}}`}</code>
                           <code>{`{{patientId}}`}</code>
                           <code>{`{{department}}`}</code>
                           <code>{`{{time}}`}</code>
                           <code>{`{{dob}}`}</code>
                           <code>{`{{gender}}`}</code>
                           <code>{`{{address}}`}</code>
                           <code>{`{{barcode}}`}</code>
                        </div>
                        <textarea
                           rows={12}
                           value={localSettings.printerConfig?.printTemplate || (localSettings.printerConfig?.printMode === 'IMAGE' ? DEFAULT_IMAGE_TEMPLATE : DEFAULT_HTML_TEMPLATE)}
                           onChange={(e) => {
                              setLocalSettings({
                                 ...localSettings,
                                 printerConfig: {
                                    ...(localSettings.printerConfig || { enabled: true, type: 'DRIVER', language: 'ESC', printerName: 'Máy in 1', ipAddress: '127.0.0.1', port: 9100, printTemplate: '' }),
                                    printTemplate: e.target.value
                                 }
                              });
                           }}
                           placeholder="Nhập mã HTML / TSPL / ESCPOS..."
                           className="w-full bg-white border border-slate-200 rounded-2xl p-6 font-mono text-xs text-slate-700 focus:outline-none focus:border-blue-500 shadow-sm leading-relaxed"
                           spellCheck={false}
                        />
                        <p className="text-[10px] text-slate-400 font-medium">Mẹo: Chế độ hình ảnh hỗ trợ HTML/CSS đầy đủ. Chế độ văn bản chỉ hỗ trợ lệnh ESC/POS cơ bản.</p>
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
