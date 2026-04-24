
import React, { useState, useEffect, useMemo } from 'react';
import { useQueue } from '../context/QueueContext';
import { PatientCard } from './components/PatientCard';
import { PatientStatus, Room, Patient } from '../types';
import { DEPARTMENTS } from '../constants';

interface DoctorConsoleProps {
  onBack: () => void;
}

type ListFilter = 'waiting' | 'conclusion' | 'scheduled' | 'skipped' | 'completed';
type MobileTab = 'list' | 'detail';

export const DoctorConsole: React.FC<DoctorConsoleProps> = ({ onBack }) => {
  const { 
    patients, 
    room, 
    currentPatient, 
    callPatient, 
    completePatient, 
    moveToConclusion,
    transferPatient,
    transferPatients,
    schedulePatient, 
    schedulePatients,
    checkInAppointment,
    skipPatient,
    addPatient,
    togglePriority,
    isAnnouncing,
    sendToLab
  } = useQueue();
  
  const [activeFilter, setActiveFilter] = useState<ListFilter>('waiting');
  const [mobileTab, setMobileTab] = useState<MobileTab>('list');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPatientIds, setSelectedPatientIds] = useState<Set<string>>(new Set());
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferPatientId, setTransferPatientId] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [schedulePatientId, setSchedulePatientId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleTime, setScheduleTime] = useState("08:00");
  const [scheduleNote, setScheduleNote] = useState("Máy hỏng / Quá tải");
  const [isBulkAction, setIsBulkAction] = useState(false); 
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedTargetRoomId, setSelectedTargetRoomId] = useState('');
  const [apptViewDate, setApptViewDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Lab modal state
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [labPatientId, setLabPatientId] = useState<string | null>(null);
  const [selectedLabRoomId, setSelectedLabRoomId] = useState('');

  useEffect(() => {
    if (currentPatient) setMobileTab('detail');
  }, [currentPatient?.id]);

  const displayedPatients = useMemo(() => {
    let filtered = [];
    switch (activeFilter) {
        case 'waiting': filtered = patients.filter(p => p.status === PatientStatus.WAITING); break;
        case 'conclusion': filtered = patients.filter(p => p.status === PatientStatus.CONCLUSION); break;
        case 'scheduled': filtered = patients.filter(p => p.status === PatientStatus.SCHEDULED); break;
        case 'skipped': filtered = patients.filter(p => p.status === PatientStatus.SKIPPED); break;
        case 'completed': filtered = patients.filter(p => p.status === PatientStatus.COMPLETED); break;
    }
    return filtered.sort((a, b) => {
        if (activeFilter === 'scheduled') return (a.appointmentTime || 0) - (b.appointmentTime || 0);
        if (a.isPriority && !b.isPriority) return -1;
        if (!a.isPriority && b.isPriority) return 1;
        return a.timestamp - b.timestamp;
    });
  }, [patients, activeFilter]);
  
  const counts = useMemo(() => ({
      waiting: patients.filter(p => p.status === PatientStatus.WAITING).length,
      conclusion: patients.filter(p => p.status === PatientStatus.CONCLUSION).length,
      scheduled: patients.filter(p => p.status === PatientStatus.SCHEDULED).length,
      completed: patients.filter(p => p.status === PatientStatus.COMPLETED).length
  }), [patients]);

  const toggleSelectionMode = () => { setIsSelectionMode(!isSelectionMode); setSelectedPatientIds(new Set()); };
  const handleSelectPatient = (id: string) => {
      setSelectedPatientIds(prev => {
          const newSet = new Set(prev);
          if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
          return newSet;
      });
  };
  const handleSelectAll = () => {
      if (selectedPatientIds.size === displayedPatients.length) setSelectedPatientIds(new Set());
      else setSelectedPatientIds(new Set(displayedPatients.map(p => p.id)));
  };

  const openTransferModalSingle = (pId: string) => { setTransferPatientId(pId); setIsBulkAction(false); setIsTransferModalOpen(true); };
  const openTransferModalBulk = () => { if (selectedPatientIds.size === 0) return; setIsBulkAction(true); setIsTransferModalOpen(true); };
  const confirmTransfer = async () => {
      if (selectedTargetRoomId) {
          if (isBulkAction) { await transferPatients(Array.from(selectedPatientIds), selectedTargetRoomId); setIsSelectionMode(false); setSelectedPatientIds(new Set()); } 
          else if (transferPatientId) { transferPatient(transferPatientId, selectedTargetRoomId); }
          setIsTransferModalOpen(false); setTransferPatientId(null); setIsBulkAction(false);
      }
  };

  const openScheduleModalSingle = (pId: string) => { setSchedulePatientId(pId); setIsBulkAction(false); setIsScheduleModalOpen(true); };
  const openScheduleModalBulk = () => { if (selectedPatientIds.size === 0) return; setIsBulkAction(true); setIsScheduleModalOpen(true); };
  const confirmSchedule = async () => {
      const ts = new Date(`${scheduleDate}T${scheduleTime}`).getTime();
      if (isBulkAction) { await schedulePatients(Array.from(selectedPatientIds), ts, scheduleNote); setIsSelectionMode(false); setSelectedPatientIds(new Set()); } 
      else if (schedulePatientId) { schedulePatient(schedulePatientId, ts, scheduleNote); }
      setIsScheduleModalOpen(false); setSchedulePatientId(null); setIsBulkAction(false);
  };

  const openLabModal = (pId: string) => { setLabPatientId(pId); setIsLabModalOpen(true); };
  const confirmSendToLab = async () => {
      if (labPatientId && selectedLabRoomId) {
          await sendToLab(labPatientId, selectedLabRoomId);
          setIsLabModalOpen(false); setLabPatientId(null); setSelectedLabRoomId('');
      } else if (labPatientId && !selectedLabRoomId) {
          // If no lab selected, just move to conclusion locally
          moveToConclusion(labPatientId);
          setIsLabModalOpen(false); setLabPatientId(null);
      }
  };

  const appointmentsForView = useMemo(() => {
      const startOfDay = new Date(apptViewDate).setHours(0, 0, 0, 0);
      const endOfDay = new Date(apptViewDate).setHours(23, 59, 59, 999);
      return patients.filter(p => p.status === PatientStatus.SCHEDULED && p.appointmentTime && p.appointmentTime >= startOfDay && p.appointmentTime <= endOfDay).sort((a, b) => (a.appointmentTime || 0) - (b.appointmentTime || 0));
  }, [patients, apptViewDate]);

  const filteredTargetRooms = selectedDeptId ? DEPARTMENTS.find(d => d.id === selectedDeptId)?.rooms || [] : [];
  
  const subclinicalDepts = useMemo(() => {
      return DEPARTMENTS.filter(d => d.type === 'LAB' || d.type === 'IMAGING');
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden font-sans bg-slate-50 text-slate-900">
      <div className={`${mobileTab === 'list' ? 'flex' : 'hidden'} md:flex w-full md:w-[420px] bg-white border-r border-slate-200 flex-col shadow-sm z-20 h-full relative`}>
        <div className="bg-white sticky top-0 z-10 flex-shrink-0">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <button onClick={onBack} className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1">← Back</button>
                <div className="flex gap-2">
                    <button onClick={() => addPatient(false)} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg">+ Thường</button>
                    <button onClick={() => addPatient(true)} className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg">+ Ưu tiên</button>
                </div>
            </div>
            <div className="px-2 pt-2 border-b border-slate-200 bg-white">
                <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0">
                    {[
                        { id: 'waiting', label: 'Chờ', count: counts.waiting, color: 'blue' },
                        { id: 'conclusion', label: 'KQ', count: counts.conclusion, color: 'purple' },
                        { id: 'scheduled', label: 'Hẹn', count: counts.scheduled, color: 'cyan' },
                        { id: 'completed', label: 'Xong', count: counts.completed, color: 'green' }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => { setActiveFilter(tab.id as ListFilter); setIsSelectionMode(false); }}
                            className={`flex-shrink-0 px-4 py-3 text-xs font-bold transition-all border-b-2 
                                ${activeFilter === tab.id ? `border-${tab.color}-600 text-${tab.color}-700 bg-${tab.color}-50` : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                            {tab.label} <span className="ml-1 text-[10px] opacity-60">{tab.count}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-slate-50 p-3 pb-24 space-y-2">
            {activeFilter === 'scheduled' ? (
                <div className="space-y-4">
                    <input type="date" value={apptViewDate} onChange={e => setApptViewDate(e.target.value)} className="w-full p-2 border rounded" />
                    {appointmentsForView.map(p => (
                        <div key={p.id} className="p-3 bg-white rounded-xl border flex justify-between items-center">
                            <div><div className="font-bold">{new Date(p.appointmentTime!).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</div><div className="text-sm">{p.name}</div></div>
                            <button onClick={() => checkInAppointment(p.id)} className="bg-cyan-600 text-white px-3 py-1 rounded text-xs font-bold">Tiếp nhận</button>
                        </div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center px-1 mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">Danh sách {activeFilter}</span>
                        <button onClick={toggleSelectionMode} className="text-xs font-bold text-blue-600">{isSelectionMode ? 'Hủy' : 'Chọn nhiều'}</button>
                    </div>
                    {isSelectionMode && (
                        <div className="sticky top-0 z-20 mb-3 p-2 bg-white shadow-md rounded-lg flex justify-between items-center border border-blue-100">
                            <span className="text-xs font-bold ml-2">Đã chọn: {selectedPatientIds.size}</span>
                            <div className="flex gap-2">
                                <button onClick={handleSelectAll} className="px-2 py-1 text-xs bg-slate-100 rounded">Tất cả</button>
                                <button onClick={openTransferModalBulk} className="px-3 py-1 bg-purple-600 text-white rounded text-xs">Chuyển</button>
                            </div>
                        </div>
                    )}
                    {displayedPatients.map(patient => (
                        <PatientCard key={patient.id} patient={patient} 
                            onCall={(activeFilter === 'waiting' || activeFilter === 'conclusion') ? callPatient : undefined}
                            onSkip={activeFilter === 'waiting' ? skipPatient : undefined}
                            onTogglePriority={activeFilter === 'waiting' ? togglePriority : undefined}
                            onTransfer={activeFilter === 'conclusion' ? openTransferModalSingle : undefined}
                            onSchedule={activeFilter === 'waiting' ? openScheduleModalSingle : undefined}
                            isSelectable={isSelectionMode} isSelected={selectedPatientIds.has(patient.id)} onSelect={handleSelectPatient}
                        />
                    ))}
                </>
            )}
        </div>
      </div>
      <div className={`${mobileTab === 'detail' ? 'flex' : 'hidden'} md:flex flex-1 flex-col bg-slate-100 h-full overflow-hidden`}>
        <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm">
          <div><h1 className="text-xl font-black text-slate-800 uppercase">{room.name}</h1><p className="text-xs text-slate-500 font-medium">{room.doctorName}</p></div>
          <button onClick={() => setMobileTab('list')} className="md:hidden text-blue-600 font-bold">Xem DS</button>
        </div>
        <div className="flex-1 p-4 md:p-8 flex flex-col justify-center">
           {currentPatient ? (
             <div className="w-full max-w-5xl mx-auto animate-scaleIn">
                <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[480px]">
                    
                    {/* Left Panel: Primary Calling Info */}
                    <div className="w-full md:w-[40%] bg-gradient-to-br from-[#1e3a8a] to-[#25448b] p-10 flex flex-col items-center justify-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                           <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                        </div>
                        <div className="z-10 text-center w-full flex flex-col items-center justify-center">
                            <span className="inline-block px-5 py-1.5 bg-blue-500/30 border border-blue-400/30 rounded-full text-blue-100 text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                                • ĐANG PHỤC VỤ •
                            </span>
                            <div className="text-[7rem] leading-none font-black font-mono tracking-tighter drop-shadow-xl mb-4 text-[#eff6ff]">{currentPatient.code}</div>
                            {currentPatient.isPriority && (
                                <div className="inline-flex items-center gap-2 bg-amber-500 text-white px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg mt-4">
                                    <span>⭐</span> ƯU TIÊN
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Right Panel: Patient Details & Actions */}
                    <div className="w-full md:w-[60%] p-8 lg:p-10 flex flex-col bg-[#f8fafc]">
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hồ sơ người bệnh</h3>
                                    <h2 className="text-3xl lg:text-4xl font-black text-[#1e3a8a] uppercase leading-tight">{currentPatient.name}</h2>
                                </div>
                                <div className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-200 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sẵn sàng
                                </div>
                            </div>
                
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 font-bold border border-slate-100">
                                        {currentPatient.gender === 'Nam' ? '♂' : (currentPatient.gender === 'Nữ' ? '♀' : '👤')}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Giới/Tuổi</p>
                                        <p className="font-black text-slate-800 text-lg truncate">
                                            {(currentPatient.gender || 'K/R').toUpperCase()} / {currentPatient.birthYear ? (new Date().getFullYear() - currentPatient.birthYear) : currentPatient.age || '--'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 font-bold border border-blue-100">📋</div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lý do khám</p>
                                        <p className="font-bold text-slate-700 text-sm truncate" title={currentPatient.reason || 'Khám tổng hợp'}>{currentPatient.reason || 'Khám tổng hợp'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                
                        {/* Action Cockpit */}
                        <div className="pt-6 border-t border-slate-200">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Bảng điều khiển (Cockpit)</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <button 
                                  onClick={() => callPatient(currentPatient.id)} 
                                  disabled={isAnnouncing} 
                                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all group ${isAnnouncing ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-white border-blue-200 hover:border-blue-500 hover:shadow-lg hover:-translate-y-1 text-blue-600'}`}>
                                    <svg className="w-7 h-7 lg:w-8 lg:h-8 mb-2 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3a9 9 0 00-9 9v7c0 1.1.9 2 2 2h4v-8H5v-1a7 7 0 1114 0v1h-4v8h4c1.1 0 2-.9 2-2v-7a9 9 0 00-9-9z"/></svg>
                                    <span className="font-black tracking-wider uppercase text-[10px] lg:text-xs">Phát Loa Gọi</span>
                                </button>
                
                                <button 
                                  onClick={() => openLabModal(currentPatient.id)} 
                                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border-2 border-purple-200 hover:border-purple-500 hover:shadow-lg hover:-translate-y-1 text-purple-600 transition-all group">
                                    <svg className="w-7 h-7 lg:w-8 lg:h-8 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    <span className="font-black tracking-wider uppercase text-[10px] lg:text-xs">Chỉ định CLS</span>
                                </button>
                
                                <button 
                                  onClick={() => completePatient(currentPatient.id)} 
                                  className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-t from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 shadow-lg shadow-emerald-500/30 text-white transition-all group border border-emerald-400 hover:-translate-y-1">
                                    <svg className="w-7 h-7 lg:w-8 lg:h-8 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    <span className="font-black tracking-widest uppercase text-[10px] lg:text-xs">Hoàn thành</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
           ) : (
             <div className="text-center opacity-40 flex flex-col items-center"><div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">+</div><h2 className="text-2xl font-bold">Vui lòng chọn bệnh nhân</h2></div>
           )}
        </div>
      </div>

      {isTransferModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold mb-4">Chuyển bệnh nhân</h3>
                  <select value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)} className="w-full border rounded p-2 mb-4">
                      <option value="">Chọn Khoa</option>
                      {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <select value={selectedTargetRoomId} onChange={e => setSelectedTargetRoomId(e.target.value)} className="w-full border rounded p-2 mb-4">
                      <option value="">Chọn Phòng</option>
                      {filteredTargetRooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <div className="flex gap-2">
                      <button onClick={() => setIsTransferModalOpen(false)} className="flex-1 p-2 border rounded">Hủy</button>
                      <button onClick={confirmTransfer} className="flex-1 bg-blue-600 text-white p-2 rounded">Chuyển</button>
                  </div>
              </div>
          </div>
      )}

      {isScheduleModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold mb-4">Hẹn lịch khám</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                      <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="p-2 border rounded" />
                      <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} className="p-2 border rounded" />
                  </div>
                  <textarea value={scheduleNote} onChange={e => setScheduleNote(e.target.value)} className="w-full p-2 border rounded mb-4" placeholder="Ghi chú"></textarea>
                  <div className="flex gap-2">
                      <button onClick={() => setIsScheduleModalOpen(false)} className="flex-1 p-2 border rounded">Hủy</button>
                      <button onClick={confirmSchedule} className="flex-1 bg-cyan-600 text-white p-2 rounded">Xác nhận</button>
                  </div>
              </div>
          </div>
      )}

      {isLabModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6">
                  <h3 className="text-xl font-bold mb-4">Chỉ định Cận Lâm Sàng</h3>
                  <p className="text-sm text-slate-500 mb-4">Chọn phòng Xét nghiệm / Chẩn đoán hình ảnh để chuyển bệnh nhân đến (nếu có).</p>
                  <select value={selectedLabRoomId} onChange={e => setSelectedLabRoomId(e.target.value)} className="w-full border rounded p-3 mb-6 bg-slate-50">
                      <option value="">-- Chỉ chờ kết quả (không chuyển) --</option>
                      {subclinicalDepts.map(d => (
                          <optgroup key={d.id} label={d.name}>
                              {d.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </optgroup>
                      ))}
                  </select>
                  <div className="flex gap-2">
                      <button onClick={() => setIsLabModalOpen(false)} className="flex-1 p-2 border border-slate-200 rounded font-bold text-slate-600">Hủy</button>
                      <button onClick={confirmSendToLab} className="flex-1 bg-purple-600 text-white p-2 rounded font-bold hover:bg-purple-700">Chuyển & Chờ KQ</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
