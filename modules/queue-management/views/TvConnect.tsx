
import React, { useState, useEffect } from 'react';

interface TvConnectProps {
  onBack: () => void;
  onConfigReceived: (roomId: string) => void;
}

export const TvConnect: React.FC<TvConnectProps> = ({ onBack, onConfigReceived }) => {
  const [pairingCode, setPairingCode] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPairingCode(code);
  };

  useEffect(() => {
    generateCode();
  }, []);

  const handleTestConnect = () => {
      setIsConnecting(true);
      setError("");
      setTimeout(() => {
          onConfigReceived("KKB-P105"); // Simulate connection to room KKB-P105
          setIsConnecting(false);
      }, 2000);
  };

  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col font-sans">
        <header className="p-10 flex justify-between items-center bg-black/20">
            <h1 className="text-4xl font-black uppercase tracking-widest">Kết nối tivi / Tab</h1>
            <button onClick={onBack} className="bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full font-bold">X Thoát</button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                <div className="space-y-10 order-2 md:order-1">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold uppercase tracking-tight">Bước 1: Quét mã QR</h2>
                        <p className="text-slate-400 text-lg">Mở ứng dụng vClinic trên điện thoại hoặc máy tính bảng để quét mã này.</p>
                        <div className="bg-white p-8 rounded-3xl w-72 h-72 flex items-center justify-center mx-auto shadow-2xl">
                            {/* QR Placeholder */}
                            <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center text-slate-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" /><path d="M11 10a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zm2 2h1v-1h-1v1zM10 11a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1zM10 15a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1zM14 15a1 1 0 011-1h1a1 1 0 011 1v1a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1z" /></svg>
                                <span className="text-xs font-bold uppercase mt-2">Mã QR Phiên Bản</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/10 w-full" />

                    <div className="space-y-4">
                        <h2 className="text-3xl font-bold uppercase tracking-tight">Hoặc Nhập Mã:</h2>
                        <div className="text-8xl font-black font-mono tracking-[0.2em] text-blue-400 drop-shadow-2xl">
                            {pairingCode}
                        </div>
                    </div>
                </div>

                <div className="order-1 md:order-2 space-y-10 animate-scaleIn">
                    <div className="bg-slate-800 p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500 rounded-full blur-[100px] opacity-20" />
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm">💡</span> Hướng dẫn
                        </h3>
                        <ul className="text-left space-y-6 text-slate-300 text-lg">
                            <li className="flex gap-4"><span className="font-bold text-blue-500">01.</span> Cắm Tivi vào mạng cùng dải IP với hệ thống.</li>
                            <li className="flex gap-4"><span className="font-bold text-blue-500">02.</span> Truy cập Dashboad {'>'} Chế độ TV.</li>
                            <li className="flex gap-4"><span className="font-bold text-blue-500">03.</span> Nhập mã pairing hoặc quét QR để chọn buồng hiển thị.</li>
                            <li className="flex gap-4"><span className="font-bold text-blue-500">04.</span> Hệ thống sẽ tự động đồng bộ config từ Dashboard.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                         {isConnecting ? (
                             <div className="text-blue-400 font-bold text-2xl animate-pulse">Đang định danh thiết bị...</div>
                         ) : (
                             <button onClick={handleTestConnect} className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-2xl shadow-xl transition-all active:scale-95">KÍCH HOẠT THỬ NGHIỆM</button>
                         )}
                         {error && <div className="text-red-500 font-bold">{error}</div>}
                    </div>
                </div>
            </div>
        </main>

        <footer className="p-8 text-center text-slate-500 text-sm border-t border-white/5 opacity-50">
            Hệ thống quản lý hàng đợi thông minh vClinic TV Edition v2.0 - © 2026 VIMES Ltd.
        </footer>
    </div>
  );
};
