import React, { useState, useEffect, useRef } from 'react';
import { 
  Barcode, CheckCircle2, AlertTriangle, LogOut, Package 
} from 'lucide-react';
import { apiFetch } from '../services/apiService';
import { AppSettings } from '../types';

interface PharmacyConsoleProps {
  settings: AppSettings;
  counterId: number;
  counterName: string;
  onLogout: () => void;
}

const PharmacyConsole: React.FC<PharmacyConsoleProps> = ({ settings, counterId, counterName, onLogout }) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [message, setMessage] = useState('');
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Giữ focus vào input ẩn để luôn sẵn sàng nhận tín hiệu từ Barcode Scanner
  useEffect(() => {
    const focusInterval = setInterval(() => {
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus();
      }
    }, 1000);
    return () => clearInterval(focusInterval);
  }, []);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const code = barcodeInput.trim();
    setBarcodeInput('');
    setStatus('PROCESSING');
    setMessage(`Đang xử lý mã: ${code}...`);

    try {
      // 1. Tìm ticket dựa trên mã vạch (có thể là mã đơn thuốc hoặc mã bệnh nhân)
      // Trong thực tế cần API tìm kiếm. Giả lập gọi API:
      const searchRes = await apiFetch(`/api/queue/ticket/search?code=${code}`);
      
      if (!searchRes || !searchRes.data) {
         // Mock fallback: Gọi API mock nếu không có API thật
         await mockProcessBarcode(code);
         return;
      }

      // 2. Cập nhật trạng thái và gọi loa
      await callTicket(searchRes.data);

    } catch (err) {
      console.error(err);
      setStatus('ERROR');
      setMessage('Không tìm thấy dữ liệu hoặc lỗi kết nối.');
      setTimeout(() => setStatus('IDLE'), 3000);
    }
  };

  const callTicket = async (ticket: any) => {
    try {
      // 2. Chuyển ticket sang trạng thái CALLING ở quầy nhà thuốc
      const callRes = await apiFetch('/api/queue/call-specific', {
        method: 'POST',
        body: JSON.stringify({ ticketId: ticket.id, counterId })
      });

      setStatus('SUCCESS');
      setMessage(`Đã gọi bệnh nhân: ${ticket.patient_name || ticket.ticket_number}`);
      
      setRecentCalls(prev => [ticket, ...prev].slice(0, 5));

      // Tự động quay về IDLE sau 3 giây
      setTimeout(() => setStatus('IDLE'), 3000);
    } catch (e) {
      setStatus('ERROR');
      setMessage('Lỗi khi phát loa gọi bệnh nhân.');
      setTimeout(() => setStatus('IDLE'), 3000);
    }
  };

  // Mock function cho demo
  const mockProcessBarcode = async (code: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Giả lập tìm thấy phiếu
    const mockTicket = {
      id: Math.floor(Math.random() * 1000),
      ticket_number: code.substring(0, 4),
      patient_name: 'Bệnh nhân ' + code.substring(0, 4)
    };

    setStatus('SUCCESS');
    setMessage(`Đã gọi nhận thuốc: ${mockTicket.patient_name}`);
    setRecentCalls(prev => [mockTicket, ...prev].slice(0, 5));
    
    // Trigger hệ thống loa (tương đương với API call-specific)
    // Trong thực tế sẽ gọi API thật
    setTimeout(() => setStatus('IDLE'), 3000);
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans" onClick={() => inputRef.current?.focus()}>
      {/* Hidden Input for Barcode Scanner */}
      <form onSubmit={handleBarcodeSubmit} className="absolute opacity-0 -z-10">
        <input 
          ref={inputRef}
          type="text" 
          value={barcodeInput}
          onChange={(e) => setBarcodeInput(e.target.value)}
          autoFocus
        />
        <button type="submit">Submit</button>
      </form>

      {/* Main Area */}
      <div className="flex-1 flex flex-col p-8">
        <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-3 text-emerald-700">
            <Package className="w-8 h-8" />
            <h1 className="text-3xl font-black uppercase tracking-tight">Khu Vực Cấp Phát Thuốc</h1>
          </div>
          <button onClick={onLogout} className="text-slate-400 hover:text-slate-600 flex items-center gap-2">
            <LogOut className="w-5 h-5" /> Đóng quầy
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <div className={`w-full max-w-2xl bg-white rounded-3xl p-16 shadow-2xl text-center border-4 transition-all duration-300 ${
            status === 'IDLE' ? 'border-slate-100 shadow-slate-200/50' :
            status === 'PROCESSING' ? 'border-amber-400 shadow-amber-400/20' :
            status === 'SUCCESS' ? 'border-emerald-500 shadow-emerald-500/30 bg-emerald-50' :
            'border-rose-500 shadow-rose-500/30 bg-rose-50'
          }`}>
            
            {status === 'IDLE' && (
              <div className="animate-pulse">
                <Barcode className="w-32 h-32 text-slate-300 mx-auto mb-8" />
                <h2 className="text-4xl font-bold text-slate-800 mb-4">SẴN SÀNG QUÉT MÃ</h2>
                <p className="text-xl text-slate-500">Hướng máy quét vào mã vạch trên Đơn thuốc</p>
              </div>
            )}

            {status === 'PROCESSING' && (
              <div>
                <div className="w-24 h-24 border-8 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-8"></div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Đang xử lý dữ liệu...</h2>
              </div>
            )}

            {status === 'SUCCESS' && (
              <div className="animate-in zoom-in duration-200">
                <CheckCircle2 className="w-32 h-32 text-emerald-500 mx-auto mb-8" />
                <h2 className="text-4xl font-black text-emerald-700 mb-4 uppercase">{message}</h2>
                <p className="text-xl text-emerald-600 font-medium">Hệ thống đang phát loa gọi tên...</p>
              </div>
            )}

            {status === 'ERROR' && (
              <div className="animate-in shake duration-200">
                <AlertTriangle className="w-32 h-32 text-rose-500 mx-auto mb-8" />
                <h2 className="text-3xl font-bold text-rose-700 mb-4">{message}</h2>
                <p className="text-lg text-rose-600">Vui lòng thử lại hoặc kiểm tra kết nối mạng.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Sidebar - Lịch sử */}
      <div className="w-96 bg-white border-l border-slate-200 shadow-xl flex flex-col z-10">
        <div className="p-6 bg-slate-800 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Vừa phát thuốc
          </h2>
        </div>
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {recentCalls.length === 0 ? (
            <div className="text-center text-slate-400 mt-10 italic">Chưa có dữ liệu phiên này</div>
          ) : (
            recentCalls.map((t, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4">
                <div className="bg-emerald-100 text-emerald-700 font-black text-xl w-14 h-14 rounded-lg flex items-center justify-center shrink-0">
                  {t.ticket_number}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-lg">{t.patient_name}</div>
                  <div className="text-sm text-slate-500">Đã gọi tự động</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PharmacyConsole;

