
import React, { useState, useEffect, useRef } from 'react';
import { Department, Patient } from '../types';
import { queueService } from '../data/queueService';
import { DEPARTMENTS } from '../constants';

interface KioskProps {
  onBack: () => void;
}

// Mock DB for scanning simulation
const MOCK_PATIENT_DB: Record<string, { name: string, birthYear: number, gender: 'Nam' | 'Nữ' | 'Khác', address: string }> = {
    'BN75':  { name: 'Cụ Ông Cao Tuổi', birthYear: 1945, gender: 'Nam', address: 'Hà Nội' }, 
    'BN05':  { name: 'Bé Nguyễn Văn An', birthYear: 2020, gender: 'Nam', address: 'Hà Nội' },
    'BN30':  { name: 'Trần Văn Thanh Niên', birthYear: 1994, gender: 'Nam', address: 'Hải Phòng' }, 
    'VIP':   { name: 'Nguyễn Thị Mẹ Bỉm', birthYear: 1990, gender: 'Nữ', address: 'Đà Nẵng' }, 
};

type Step = 1 | 2 | 3 | 4; 

export const Kiosk: React.FC<KioskProps> = ({ onBack }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [step, setStep] = useState<Step>(1); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastTicket, setLastTicket] = useState<{code: string, name: string, deptName: string, roomName: string} | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [patientCode, setPatientCode] = useState("");
  const [scannedProfile, setScannedProfile] = useState<{ name: string, birthYear: number, gender: string, address: string } | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-reset feature for Kiosk
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (step > 1 && step < 4) { // Don't reset on step 1 (Home) or 4 (Done)
        timeoutId = setTimeout(() => {
          console.log("Kiosk auto-reset due to inactivity");
          setStep(1);
          setSelectedDept(null);
          setPatientCode("");
          setScannedProfile(null);
        }, 45000); // 45 seconds of inactivity
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    window.addEventListener('click', resetTimer);

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      window.removeEventListener('click', resetTimer);
    };
  }, [step]);

  useEffect(() => {
      const loadDepts = async () => {
          const depts = await queueService.getDepartments();
          if (depts && depts.length > 0) {
              setDepartments(depts);
          } else {
              setDepartments(DEPARTMENTS);
          }
      };
      loadDepts();
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
  }, []);

  useEffect(() => {
      if (step === 2 && inputRef.current) {
          inputRef.current.focus();
      }
  }, [step]);

  const handleScan = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      if (!patientCode.trim()) return;
      setIsLookingUp(true);
      
      setTimeout(() => {
          const found = MOCK_PATIENT_DB[patientCode.toUpperCase()];
          if (found) {
              setScannedProfile(found);
          } else {
              const randomAge = Math.floor(Math.random() * 90);
              setScannedProfile({
                  name: `Bệnh nhân ${patientCode}`,
                  birthYear: new Date().getFullYear() - randomAge,
                  gender: 'Khác',
                  address: 'Chưa cập nhật'
              });
          }
          setIsLookingUp(false);
      }, 600);
  };

  const handleClearScan = () => {
      setPatientCode("");
      setScannedProfile(null);
      if (inputRef.current) inputRef.current.focus();
  };

  const checkPriorityEligible = () => {
      if (!scannedProfile) return false;
      const age = new Date().getFullYear() - scannedProfile.birthYear;
      return age > 75 || age < 6;
  };

  const confirmScanAndNext = () => {
      if (scannedProfile) {
          setStep(3); 
      }
  };

  const handleTakeTicket = async (targetRoomId: string, targetRoomName: string) => {
    if (!selectedDept || !scannedProfile) return;
    setIsPrinting(true);
    const isPriority = checkPriorityEligible();

    const customData = {
        departmentId: selectedDept.id, 
        roomId: targetRoomId, 
        name: scannedProfile.name,
        birthYear: scannedProfile.birthYear,
        gender: scannedProfile.gender as any,
        address: scannedProfile.address,
        reason: isPriority ? "Ưu Tiên" : "Thường"
    };

    const ticket = await queueService.createTicket(targetRoomId, { ...customData, isPriority });
    if (ticket) {
        setLastTicket({
            code: ticket.code,
            name: ticket.name,
            deptName: selectedDept.name,
            roomName: targetRoomName
        });
    }

    setStep(4);
    setIsPrinting(false);
  };

  const handlePrintAndFinish = async () => {
      try {
          // Simulate calling backend API for silent printing
          // await queueService.silentPrintTicket(lastTicket);
          console.log("Mock: Sent print request to backend thermal printer API");
          // Fallback to browser print if needed during development
          window.print(); 
      } catch (e) {
          console.error("Print API failed", e);
      }
      
      setTimeout(() => {
          setLastTicket(null);
          setStep(1);
          setSelectedDept(null);
          setScannedProfile(null);
          setPatientCode("");
      }, 1500);
  };

  const resetAll = () => {
      setStep(1);
      setSelectedDept(null);
      handleClearScan();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 relative overflow-hidden flex flex-col">
        <style>{`
            @media print {
                @page { margin: 0; size: 80mm auto; }
                body { background: white; margin: 0; }
                body * { visibility: hidden; height: 0; overflow: hidden; }
                #printable-ticket, #printable-ticket * { visibility: visible; height: auto; overflow: visible; }
                #printable-ticket { position: fixed; left: 0; top: 0; width: 72mm; padding: 4mm; background: white; color: black; font-family: monospace; text-align: center; }
                .no-print { display: none !important; }
            }
        `}</style>

        {lastTicket && (
            <div id="printable-ticket" className="fixed top-0 left-0 bg-white z-[9999] hidden text-black">
                <div className="font-bold text-sm uppercase mb-1">BỆNH VIỆN ĐA KHOA</div>
                <div className="border-b-2 border-black border-dashed w-full my-2"></div>
                <div className="text-lg font-bold">{lastTicket.deptName}</div>
                <div className="text-md font-bold">{lastTicket.roomName}</div>
                <div className="text-4xl font-black my-4">{lastTicket.code}</div>
                <div className="text-sm uppercase font-bold">{lastTicket.name}</div>
                <div className="text-xs mt-2">{new Date().toLocaleString('vi-VN')}</div>
                <div className="border-b-2 border-black border-dashed w-full my-2"></div>
                <div className="text-xs italic">Vui lòng đợi tại khu vực chờ.</div>
            </div>
        )}

        <header className="px-8 py-6 flex justify-between items-center bg-white shadow-sm border-b border-slate-200 no-print flex-shrink-0 z-20">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Hệ Thống Lấy Số Tự Động</h1>
                    <p className="text-slate-500 text-sm font-medium">
                        {step === 1 ? 'Bước 1: Chọn Khoa' : 
                         step === 2 ? `Bước 2: Xác thực thông tin (${selectedDept?.name})` : 
                         step === 3 ? `Bước 3: Chọn dịch vụ (${selectedDept?.name})` : 'Hoàn tất'}
                    </p>
                </div>
            </div>
            <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{currentTime.toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</div>
                <button onClick={onBack} className="mt-1 text-xs text-slate-400 hover:text-slate-600 border border-slate-200 px-3 py-1 rounded hover:bg-slate-100 transition-colors">Thoát</button>
            </div>
        </header>

        <main className="flex-1 container mx-auto p-8 no-print overflow-y-auto flex flex-col items-center">
            {step === 1 && (
                <div className="w-full max-w-6xl animate-fadeIn">
                    <h2 className="text-center text-3xl font-bold text-slate-800 mb-8">VUI LÒNG CHỌN KHOA / KHU VỰC</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {departments.map(dept => (
                            <button 
                                key={dept.id}
                                onClick={() => { setSelectedDept(dept); setStep(2); }}
                                className="bg-white hover:bg-blue-600 hover:-translate-y-1 hover:shadow-xl transition-all p-8 rounded-3xl border border-slate-200 flex flex-col items-center justify-center gap-6 group h-72 shadow-sm"
                            >
                                <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-white text-blue-600 transition-colors">
                                    <span className="text-3xl font-bold">{dept.codePrefix || dept.id.substring(0,2)}</span>
                                </div>
                                <h3 className="text-xl font-bold text-center uppercase text-slate-700 group-hover:text-white leading-tight">{dept.name}</h3>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 2 && selectedDept && (
                <div className="w-full max-w-4xl">
                    <button onClick={resetAll} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
                        ← Quay lại chọn Khoa
                    </button>
                    
                    <div className="bg-white border border-slate-200 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
                        <h2 className="text-4xl font-black text-center mb-2 text-slate-800 uppercase">
                            {selectedDept.name}
                        </h2>
                        <p className="text-center text-slate-500 mb-10 text-lg">Vui lòng quét thẻ BHYT hoặc nhập mã hồ sơ để tiếp tục</p>

                        <div className="mb-8">
                            <form onSubmit={handleScan} className="relative max-w-2xl mx-auto">
                                <input 
                                    ref={inputRef}
                                    type="text" 
                                    value={patientCode}
                                    onChange={e => setPatientCode(e.target.value)}
                                    placeholder="Quét mã tại đây..."
                                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-2xl py-6 pl-8 pr-16 text-4xl text-slate-800 focus:border-blue-500 outline-none text-center font-mono font-bold tracking-widest shadow-inner transition-all placeholder:text-slate-300"
                                    disabled={!!scannedProfile}
                                />
                                {scannedProfile && (
                                    <button type="button" onClick={handleClearScan} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 p-2">✕</button>
                                )}
                            </form>

                            {!scannedProfile && (
                                <div className="mt-8 max-w-lg mx-auto bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm animate-fadeIn">
                                    <div className="grid grid-cols-3 gap-4">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                            <button key={num} onClick={() => setPatientCode(prev => prev + num)} className="bg-white hover:bg-blue-50 text-slate-800 text-3xl font-bold py-6 rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                                                {num}
                                            </button>
                                        ))}
                                        <button onClick={() => setPatientCode(prev => prev.slice(0, -1))} className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xl font-bold py-6 rounded-2xl shadow-sm active:scale-95 transition-transform flex items-center justify-center">
                                            ⌫ XÓA
                                        </button>
                                        <button onClick={() => setPatientCode(prev => prev + '0')} className="bg-white hover:bg-blue-50 text-slate-800 text-3xl font-bold py-6 rounded-2xl shadow-sm border border-slate-200 active:scale-95 transition-transform">
                                            0
                                        </button>
                                        <button onClick={() => handleScan()} className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-6 rounded-2xl shadow-md active:scale-95 transition-transform flex items-center justify-center">
                                            GỬI ➜
                                        </button>
                                    </div>
                                </div>
                            )}

                            {scannedProfile && (
                                <div className="mt-8 bg-blue-50 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between text-slate-900 border border-blue-100 shadow-sm animate-fadeIn">
                                    <div className="flex items-center gap-6 mb-6 md:mb-0">
                                        <div className="w-20 h-20 bg-white text-blue-600 rounded-full flex items-center justify-center font-black text-3xl shadow-md">
                                            {scannedProfile.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-black text-2xl uppercase text-blue-900">{scannedProfile.name}</div>
                                            <div className="text-slate-600 font-medium text-lg mt-1">Năm sinh: <strong>{scannedProfile.birthYear}</strong> • {scannedProfile.address}</div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                                        {checkPriorityEligible() && (
                                            <div className="bg-amber-100 text-amber-700 border border-amber-200 font-bold px-4 py-1.5 rounded-full uppercase text-sm">Ưu Tiên</div>
                                        )}
                                        <button onClick={confirmScanAndNext} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg transition-transform active:scale-95 text-lg">Tiếp Tục →</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {step === 3 && selectedDept && (
                <div className="w-full max-w-6xl">
                    <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <button onClick={() => setStep(2)} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">← Quay lại</button>
                        <div className="text-slate-800 font-medium text-lg">Xin chào: <span className="font-black uppercase text-blue-600">{scannedProfile?.name}</span></div>
                    </div>

                    <h2 className="text-3xl font-black text-center mb-8 uppercase text-slate-800 tracking-tight">Chọn Dịch Vụ Cần Thực Hiện</h2>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {selectedDept.rooms && selectedDept.rooms.length > 0 ? (
                            selectedDept.rooms.map(room => (
                                <button
                                    key={room.id}
                                    onClick={() => handleTakeTicket(room.id, room.name)}
                                    disabled={isPrinting}
                                    className="bg-white hover:bg-blue-600 p-8 rounded-3xl shadow-sm border border-slate-200 hover:border-blue-600 hover:shadow-xl flex flex-col items-center justify-center gap-6 transition-all duration-300 group min-h-[200px]"
                                >
                                    <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                    </div>
                                    <span className="text-xl font-bold uppercase text-center text-slate-700 group-hover:text-white px-4">{room.name}</span>
                                </button>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-slate-400 py-16 bg-white rounded-3xl border border-dashed border-slate-300">
                                <p className="text-lg">Hiện chưa có phòng nào hoạt động.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 4 && lastTicket && (
                <div className="flex flex-col items-center justify-center pt-10 w-full max-w-md animate-fadeIn">
                    <div className="bg-white p-10 rounded-3xl shadow-2xl text-center w-full relative overflow-hidden border border-slate-200">
                        <div className="absolute top-0 left-0 w-full h-3 bg-green-500"></div>
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">✓</div>
                        <h2 className="text-3xl font-black uppercase text-slate-800 mb-2">Đăng Ký Thành Công</h2>
                        <p className="text-slate-500 mb-8 font-medium">Vui lòng nhận phiếu in</p>
                        
                        <div className="bg-slate-50 p-8 rounded-2xl border-2 border-dashed border-slate-300 mb-8">
                            <div className="text-sm font-bold text-slate-500 uppercase mb-2">{lastTicket.deptName}</div>
                            <div className="text-xl font-bold text-blue-700 mb-4">{lastTicket.roomName}</div>
                            <div className="text-7xl font-black text-slate-800">{lastTicket.code}</div>
                        </div>

                        <button onClick={handlePrintAndFinish} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-lg shadow-lg">Hoàn Tất & In Phiếu</button>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
};
