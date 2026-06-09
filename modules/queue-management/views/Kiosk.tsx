import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Users, 
  Baby, 
  CreditCard, 
  Printer, 
  Scan, 
  ChevronRight, 
  ArrowLeft,
  Search,
  Activity,
  Heart,
  Stethoscope,
  FlaskConical,
  Coins,
  Pill,
  Clock,
  UserCheck,
  Droplet
} from 'lucide-react';
import { apiFetch } from '../services/apiService';
import { AppSettings } from '../types';

interface KioskProps {
  settings: AppSettings;
  onBack: () => void;
}

type KioskStep = 'TYPE_SELECTION' | 'PATIENT_IDENTIFY' | 'DEPARTMENT_SELECTION' | 'PRINTING' | 'SUCCESS';
type TicketType = 'RECEPTION' | 'REGISTRATION' | 'EXECUTION' | 'SAMPLING' | 'PAYMENT' | 'DRUG';

const Kiosk: React.FC<KioskProps> = ({ settings, onBack }) => {
  const [step, setStep] = useState<KioskStep>(() => {
    const hasService = localStorage.getItem('vimes_selected_service');
    return hasService ? 'PATIENT_IDENTIFY' : 'TYPE_SELECTION';
  });
  const [ticketType, setTicketType] = useState<TicketType | null>(() => {
    return (localStorage.getItem('vimes_selected_service') as TicketType) || null;
  });
  const [patientData, setPatientData] = useState<any>(null);
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [printStatus, setPrintStatus] = useState('');
  const [lastTicket, setLastTicket] = useState<any>(null);

  const resetKiosk = useCallback(() => {
    setStep('TYPE_SELECTION');
    setTicketType(null);
    setPatientData(null);
    setSearchId('');
    setPrintStatus('');
  }, []);

  // Tự động quay về trang chủ sau 60 giây không hoạt động
  useEffect(() => {
    if (step === 'TYPE_SELECTION') return;
    const timer = setTimeout(resetKiosk, 60000);
    return () => clearTimeout(timer);
  }, [step, resetKiosk]);

  const handleIdentifyPatient = async (id?: string) => {
    const searchKey = id || searchId;
    if (!searchKey) return;
    
    setLoading(true);
    try {
      // 1. Tìm thông tin bệnh nhân
      const res = await apiFetch(`/api/his/patient/${searchKey}`);
      if (res && res.name) {
        setPatientData(res);
        
        // 2. Nếu là dịch vụ CLS/Thanh toán/Thuốc -> Kiểm tra chỉ định
        if (ticketType !== 'REGISTRATION' && ticketType !== 'RECEPTION') {
            const ordersRes = await apiFetch(`/api/his/pending-orders/${searchKey}`);
            if (ordersRes && ordersRes.success) {
                setPatientData({ ...res, ...ordersRes.patient, orders: ordersRes.orders });
            } else {
                alert(ordersRes?.message || "Không tìm thấy hồ sơ đang hoạt động của bạn.");
                return;
            }
        }
        setStep(ticketType === 'REGISTRATION' ? 'DEPARTMENT_SELECTION' : 'PRINTING');
      } else {
        alert("Không tìm thấy thông tin bệnh nhân trên hệ thống HIS.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi kết nối hệ thống HIS.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTicket = async (specialtyCode?: string) => {
    setStep('PRINTING');
    setPrintStatus('Đang xử lý đăng ký...');
    
    try {
      const res = await apiFetch('/api/queue', {
        method: 'POST',
        body: JSON.stringify({
          kioskType: ticketType,
          patientName: patientData?.name,
          identityNumber: patientData?.identityNumber,
          insuranceCard: patientData?.insuranceNumber,
          patientId: patientData?.patientId,
          docNo: patientData?.docNo,
          specialtyCode: specialtyCode,
          kioskId: settings.kioskId,
          isPriority: patientData?.isPriority || false
        })
      });

      if (res && res.success) {
        setLastTicket(res.data);
        setPrintStatus('Đang in phiếu...');
        // Giả lập lệnh in
        setTimeout(() => {
          setStep('SUCCESS');
          // Tự động reset sau 5 giây
          setTimeout(resetKiosk, 5000);
        }, 1500);
      } else {
        alert(res?.message || "Lỗi đăng ký hàng đợi");
        setStep('TYPE_SELECTION');
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi hệ thống.");
      setStep('TYPE_SELECTION');
    }
  };

  return (
    <div className="h-full w-full bg-gradient-to-tr from-slate-50 to-slate-100 text-slate-800 flex flex-col overflow-hidden font-sans select-none relative">
      
      {/* Header */}
      <header className="h-24 px-12 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-6">
          <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-md border border-slate-150 shrink-0 p-2">
             <svg className="w-10 h-10 text-blue-600 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
             </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{(settings.hospitalName || '').normalize('NFC').toUpperCase()}</h1>
            <p className="text-emerald-700 text-sm font-bold tracking-widest uppercase">Hệ thống cấp số tự động</p>
          </div>
        </div>
        
        {step === 'TYPE_SELECTION' ? (
          <button 
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 rounded-2xl transition-all border border-slate-200 font-bold uppercase text-[10px] tracking-widest text-slate-500 hover:text-slate-900 shadow-sm"
          >
            <ArrowLeft size={16} /> Về Portal
          </button>
        ) : (
          <button 
            onClick={resetKiosk}
            className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 rounded-2xl transition-all border border-slate-200 font-bold uppercase text-xs text-blue-600 hover:text-blue-700 shadow-sm"
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-12 overflow-hidden relative">
        
        {/* STEP 1: TYPE SELECTION */}
        {step === 'TYPE_SELECTION' && (
          <div className="h-full flex flex-col items-center justify-center space-y-12 animate-in fade-in zoom-in duration-500">
            <h2 className="text-4xl font-black text-center uppercase tracking-tighter text-slate-900">Chào mừng Quý khách!<br/><span className="text-blue-600">Vui lòng chọn dịch vụ cần thực hiện</span></h2>
            
            <div className="grid grid-cols-3 gap-6 w-full max-w-6xl">
              {[
                { id: 'RECEPTION', name: 'TIẾP ĐỐN', icon: <UserCheck size={48} />, color: 'bg-purple-600', desc: 'Đón tiếp, đăng ký thông tin ban đầu' },
                { id: 'REGISTRATION', name: 'ĐĂNG KÝ KHÁM BỆNH', icon: <Stethoscope size={48} />, color: 'bg-blue-600', desc: 'Dành cho bệnh nhân mới hoặc tái khám' },
                { id: 'EXECUTION', name: 'THỰC HIỆN CHỈ ĐỊNH', icon: <FlaskConical size={48} />, color: 'bg-rose-600', desc: 'Siêu âm, X-Quang, CT, Nội soi...' },
                { id: 'SAMPLING', name: 'LẤY MẪU XN', icon: <Droplet size={48} />, color: 'bg-emerald-600', desc: 'Lấy mẫu máu, nước tiểu, xét nghiệm...' },
                { id: 'PAYMENT', name: 'THANH TOÁN VIỆN PHÍ', icon: <Coins size={48} />, color: 'bg-amber-500', desc: 'Thanh toán hóa đơn, tạm ứng' },
                { id: 'DRUG', name: 'LĨNH THUỐC', icon: <Pill size={48} />, color: 'bg-slate-600', desc: 'Nhà thuốc bệnh viện, cấp thuốc BHYT' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setTicketType(item.id as TicketType); setStep('PATIENT_IDENTIFY'); }}
                  className={`${item.color} p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center text-center space-y-4 border-b-[8px] border-black/20 text-white`}
                >
                  <div className="p-4 bg-white/20 rounded-2xl">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight uppercase mb-1">{item.name}</h3>
                    <p className="text-white/80 font-medium text-xs line-clamp-2">{item.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: PATIENT IDENTIFY */}
        {step === 'PATIENT_IDENTIFY' && (
          <div className="h-full flex flex-col items-center justify-center space-y-12 animate-in slide-in-from-right duration-500">
             <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-[3rem] p-16 text-center space-y-12 shadow-xl shadow-slate-100/80">
                <div className="space-y-4">
                  <h2 className="text-5xl font-black uppercase tracking-tighter text-slate-900">Xác thực thông tin</h2>
                  <p className="text-xl text-slate-500 font-medium italic">Vui lòng quét thẻ BHYT hoặc nhập số CCCD / Mã bệnh nhân</p>
                </div>

                <div className="flex flex-col items-center gap-10">
                   {/* QR SCAN ANIMATION AREA */}
                   <div className="relative h-64 w-64 bg-slate-50 rounded-3xl border-2 border-emerald-500/40 flex items-center justify-center overflow-hidden shadow-inner">
                      <Scan size={120} className="text-emerald-600/50" />
                      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent h-1/2 animate-scan"></div>
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500"></div>
                   </div>

                   <div className="w-full flex items-center gap-4">
                      <input 
                        type="text" 
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        placeholder="Nhập mã số tại đây..."
                        className="flex-1 h-24 bg-slate-50 border border-slate-200 rounded-3xl px-10 text-4xl font-black focus:outline-none focus:border-blue-500 focus:bg-white focus:shadow-md focus:shadow-blue-500/10 text-slate-800 text-center placeholder:text-slate-300"
                        autoFocus
                      />
                      <button 
                        onClick={() => handleIdentifyPatient()}
                        disabled={loading || !searchId}
                        className="h-24 w-24 bg-blue-600 text-white rounded-3xl flex items-center justify-center hover:bg-blue-500 transition-colors disabled:bg-slate-100 disabled:text-slate-300"
                      >
                        {loading ? <div className="h-10 w-10 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div> : <ChevronRight size={48} />}
                      </button>
                   </div>
                </div>

                <div className="flex justify-center gap-4">
                   <span className="px-6 py-3 bg-slate-100 rounded-full text-sm font-bold text-slate-500 uppercase tracking-widest border border-slate-200 flex items-center gap-2">
                     <CreditCard size={16} /> Quét thẻ BHYT
                   </span>
                   <span className="px-6 py-3 bg-slate-100 rounded-full text-sm font-bold text-slate-500 uppercase tracking-widest border border-slate-200 flex items-center gap-2">
                     <User size={16} /> CCCD / Mã BN
                   </span>
                </div>
             </div>
          </div>
        )}

        {/* STEP 3: DEPARTMENT SELECTION (For Registration) */}
        {step === 'DEPARTMENT_SELECTION' && (
          <div className="h-full flex flex-col items-center space-y-10 animate-in slide-in-from-right duration-500">
             <div className="text-center space-y-2">
                <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900">Chọn chuyên khoa khám</h2>
                <p className="text-slate-500 font-bold tracking-[0.2em] text-xs">CHÀO BẠN: <span className="text-blue-600">{(patientData?.name || '').normalize('NFC').toUpperCase()}</span></p>
             </div>

             <div className="grid grid-cols-3 gap-6 w-full max-w-6xl overflow-y-auto pr-4 custom-scrollbar">
                {[
                  { code: 'NOI', name: 'KHOA NỘI TỔNG QUÁT', icon: <Heart size={24} />, color: 'from-blue-500/20 to-blue-600/10' },
                  { code: 'NGOAI', name: 'KHOA NGOẠI TỔNG QUÁT', icon: <Activity size={24} />, color: 'from-orange-500/20 to-orange-600/10' },
                  { code: 'NHI', name: 'KHOA NHI', icon: <Baby size={24} />, color: 'from-pink-500/20 to-pink-600/10' },
                  { code: 'SAN', name: 'KHOA PHỤ SẢN', icon: <Activity size={24} />, color: 'from-purple-500/20 to-purple-600/10' },
                  { code: 'RHM', name: 'RĂNG HÀM MẶT', icon: <Activity size={24} />, color: 'from-emerald-500/20 to-emerald-600/10' },
                  { code: 'TMH', name: 'TAI MŨI HỌNG', icon: <Activity size={24} />, color: 'from-cyan-500/20 to-cyan-600/10' },
                  { code: 'MAT', name: 'KHOA MẮT', icon: <Activity size={24} />, color: 'from-indigo-500/20 to-indigo-600/10' },
                  { code: 'DL', name: 'DA LIỄU', icon: <Activity size={24} />, color: 'from-rose-500/20 to-rose-600/10' },
                  { code: 'YHCT', name: 'Y HỌC CỔ TRUYỀN', icon: <Activity size={24} />, color: 'from-amber-500/20 to-amber-600/10' }
                ].map((dept) => (
                  <button
                    key={dept.code}
                    onClick={() => handlePrintTicket(dept.code)}
                    className={`h-40 bg-gradient-to-br ${dept.color} border border-slate-200/80 rounded-[2.5rem] p-8 flex flex-col justify-between hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 transition-all hover:-translate-y-1 active:scale-95 text-left bg-white`}
                  >
                    <div className="h-12 w-12 bg-white/60 border border-white/30 text-slate-800 rounded-2xl flex items-center justify-center">
                      {dept.icon}
                    </div>
                    <h4 className="text-xl font-black leading-tight uppercase text-slate-900">{dept.name}</h4>
                  </button>
                ))}
             </div>
          </div>
        )}

        {/* STEP 4: PRINTING / PROCESSING */}
        {step === 'PRINTING' && (
          <div className="h-full flex flex-col items-center justify-center space-y-12">
             <div className="relative">
                <div className="h-48 w-48 border-[12px] border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <Printer size={64} className="text-blue-600 animate-pulse" />
                </div>
             </div>
             <div className="text-center space-y-4">
                <h2 className="text-5xl font-black uppercase tracking-tighter animate-pulse text-slate-900">{printStatus}</h2>
                <p className="text-xl text-slate-500 font-medium">Vui lòng chờ trong giây lát...</p>
             </div>
          </div>
        )}

        {/* STEP 5: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="h-full flex flex-col items-center justify-center space-y-12 animate-in zoom-in duration-500">
             <div className="h-40 w-40 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(16,185,129,0.3)]">
                <Printer size={80} className="text-white" />
             </div>
             
             <div className="text-center space-y-6">
                <h2 className="text-6xl font-black uppercase tracking-tighter text-slate-900">Lấy số thành công!</h2>
                <p className="text-2xl text-emerald-600 font-black uppercase tracking-widest">Vui lòng nhận phiếu tại khe máy in</p>
             </div>

             {lastTicket && (
               <div className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-10 shadow-xl shadow-slate-200/80 border border-slate-200 space-y-6">
                  <div className="text-center border-b-2 border-dashed border-slate-200 pb-6">
                     <p className="font-bold text-slate-400 text-sm uppercase tracking-widest mb-1">{settings.hospitalName}</p>
                     <h3 className="text-6xl font-black tracking-tighter text-blue-600">{lastTicket.ticketNumber}</h3>
                  </div>
                  <div className="space-y-4 font-bold uppercase text-xs">
                     <div className="flex justify-between items-center text-slate-400">
                        <span>Bệnh nhân:</span>
                        <span className="text-slate-900">{lastTicket.patientName}</span>
                     </div>
                     <div className="flex justify-between items-center text-slate-400">
                        <span>Dịch vụ:</span>
                        <span className="text-slate-900">{ticketType === 'RECEPTION' ? 'Tiếp đón' : ticketType === 'REGISTRATION' ? 'Khám bệnh' : ticketType === 'EXECUTION' ? 'Cận lâm sàng' : ticketType === 'SAMPLING' ? 'Lấy mẫu XN' : ticketType === 'PAYMENT' ? 'Thanh toán' : ticketType === 'DRUG' ? 'Lĩnh thuốc' : 'Dịch vụ'}</span>
                     </div>
                     <div className="flex justify-between items-center text-slate-400">
                        <span>Phòng:</span>
                        <span className="text-slate-900">{lastTicket.roomname || 'Chờ điều phối'}</span>
                     </div>
                  </div>
                  <div className="pt-6 border-t-2 border-dashed border-slate-200 text-center">
                     <p className="text-[10px] text-slate-400 font-black tracking-widest mb-4">MỜI QUÝ KHÁCH ĐẾN PHÒNG CHỜ VÀ THEO DÕI MÀN HÌNH</p>
                     <div className="h-20 w-full bg-slate-100 rounded-xl flex items-center justify-center opacity-30">
                        <Scan size={40} className="text-slate-400" />
                     </div>
                  </div>
               </div>
             )}

             <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Màn hình sẽ tự động đóng sau 5 giây</p>
          </div>
        )}

      </main>

      {/* Footer Info */}
      <footer className="h-20 px-12 border-t border-slate-200 flex items-center justify-between bg-white shadow-inner shrink-0 z-10">
        <div className="flex items-center gap-8">
           <div className="flex items-center gap-3 text-slate-500">
              <Clock size={20} />
              <span className="text-sm font-black tracking-widest uppercase">{new Date().toLocaleTimeString()}</span>
           </div>
           <div className="h-6 w-[1px] bg-slate-200"></div>
           <div className="flex items-center gap-3 text-slate-500">
              <Activity size={20} />
              <span className="text-sm font-black tracking-widest uppercase">Sync: HIS Online</span>
           </div>
        </div>
        
        <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
          VIMES QMS Enterprise • Self-Service Kiosk v2.0
        </div>
      </footer>

      {/* Background Styling */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] -z-10 pointer-events-none translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 pointer-events-none -translate-x-1/2 translate-y-1/2"></div>
    </div>
  );
};

export default Kiosk;
