
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQueue } from '../context/QueueContext';
import { PatientStatus, Patient, Department } from '../types';
import { queueService } from '../data/queueService';
import { DEPARTMENTS } from '../constants';

interface AppointmentManagerProps {
  onBack: () => void;
}

export const AppointmentManager: React.FC<AppointmentManagerProps> = ({ onBack }) => {
  const { patients, checkInAppointment, addPatient, updatePatientInfo, deletePatient, room } = useQueue();
  
  const [viewDate, setViewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SCHEDULED' | 'WAITING' | 'COMPLETED'>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newApptData, setNewApptData] = useState({ 
      name: "", phone: "", birthYear: "", gender: "Nam" as 'Nam' | 'Nữ' | 'Khác',
      address: "", reason: "", time: "08:00", date: new Date().toISOString().split('T')[0] 
  });
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importDeptId, setImportDeptId] = useState("");
  const [importRoomId, setImportRoomId] = useState("");
  const [importQueue, setImportQueue] = useState<Patient[]>([]);
  const [isLoadingImport, setIsLoadingImport] = useState(false);
  const [lastCreatedTicket, setLastCreatedTicket] = useState<Patient | null>(null);

  const filteredPatients = useMemo(() => {
      const startOfDay = new Date(viewDate).setHours(0, 0, 0, 0);
      const endOfDay = new Date(viewDate).setHours(23, 59, 59, 999);
      return patients.filter(p => {
          const lowerTerm = searchTerm.toLowerCase();
          const matchSearch = p.name.toLowerCase().includes(lowerTerm) || p.code.includes(lowerTerm) || (p.phone && p.phone.includes(lowerTerm));
          if (!matchSearch) return false;
          if (!p.appointmentTime) return false;
          const matchDate = p.appointmentTime >= startOfDay && p.appointmentTime <= endOfDay;
          if (!matchDate) return false;
          if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
          return true;
      }).sort((a, b) => (a.appointmentTime || 0) - (b.appointmentTime || 0));
  }, [patients, viewDate, searchTerm, statusFilter]);

  const stats = useMemo(() => {
      const total = filteredPatients.length;
      const scheduled = filteredPatients.filter(p => p.status === PatientStatus.SCHEDULED).length;
      const arrived = filteredPatients.filter(p => p.status !== PatientStatus.SCHEDULED && p.status !== PatientStatus.SKIPPED).length;
      return { total, scheduled, arrived };
  }, [filteredPatients]);

  const handleCreate = async () => {
      if (!newApptData.name.trim()) return;
      const ts = new Date(`${newApptData.date}T${newApptData.time}`).getTime();
      const tempPatientData: Partial<Patient> = {
          name: newApptData.name, phone: newApptData.phone,
          birthYear: newApptData.birthYear ? parseInt(newApptData.birthYear) : undefined,
          gender: newApptData.gender, address: newApptData.address,
          reason: newApptData.reason, status: PatientStatus.SCHEDULED,
          appointmentTime: ts,
      };
      addPatient(false, tempPatientData);
      setLastCreatedTicket({ id: 'temp', code: 'HẸN', ...tempPatientData } as Patient);
      setIsCreateModalOpen(false);
      resetForm();
      setTimeout(() => window.print(), 500);
  };

  const resetForm = () => {
      setNewApptData({ 
          name: "", phone: "", birthYear: "", gender: "Nam", address: "", 
          reason: "", time: "08:00", date: new Date().toISOString().split('T')[0] 
      });
  };

  const handleUpdate = () => {
      if (!editingPatient) return;
      updatePatientInfo(editingPatient.id, { ...editingPatient });
      setEditingPatient(null);
  };

  const handleFetchQueue = async () => {
      if (!importDeptId || !importRoomId) return;
      setIsLoadingImport(true);
      try {
          const queue = await queueService.getQueue(importRoomId);
          setImportQueue(queue.filter(p => p.status === PatientStatus.WAITING));
      } catch (error) {
          setImportQueue([]);
      } finally {
          setIsLoadingImport(false);
      }
  };

  const handleSelectImportPatient = (p: Patient) => {
      setNewApptData({
          name: p.name, phone: p.phone || "",
          birthYear: p.birthYear ? p.birthYear.toString() : (p.age ? (new Date().getFullYear() - p.age).toString() : ""),
          gender: p.gender || "Nam", address: p.address || "",
          reason: p.reason || "Hẹn tái khám", time: "08:00",
          date: new Date().toISOString().split('T')[0]
      });
      setIsImportModalOpen(false);
      setIsCreateModalOpen(true);
  };

  const weekDays = Array.from({length: 7}).map((_, i) => {
      const d = new Date(); d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {lastCreatedTicket && (
            <div id="printable-ticket" className="hidden fixed p-4 text-center text-black">
                <div className="font-bold text-sm uppercase">BỆNH VIỆN ĐA KHOA</div>
                <div className="font-bold text-lg uppercase my-2">PHIẾU HẸN KHÁM</div>
                <div className="text-left text-xs space-y-1">
                    <div>BN: <span className="font-bold uppercase">{lastCreatedTicket.name}</span></div>
                    <div>SĐT: {lastCreatedTicket.phone || '---'}</div>
                    <div>Ngày hẹn: {new Date(lastCreatedTicket.appointmentTime!).toLocaleDateString('vi-VN')}</div>
                    <div>Giờ hẹn: {new Date(lastCreatedTicket.appointmentTime!).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</div>
                    <div>Phòng: {room.name}</div>
                </div>
            </div>
        )}

        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 text-slate-500">← Back</button>
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">Quản Lý Lịch Hẹn</h1>
                    <p className="text-xs text-slate-500">{room.name} • {new Date(viewDate).toLocaleDateString('vi-VN')}</p>
                </div>
            </div>
            <div className="flex gap-3">
                <button onClick={() => setIsImportModalOpen(true)} className="border border-cyan-600 text-cyan-600 px-4 py-2 rounded-lg font-bold text-sm">Lấy từ Hàng Đợi</button>
                <button onClick={() => setIsCreateModalOpen(true)} className="bg-cyan-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Tạo Mới</button>
            </div>
        </header>

        <div className="flex-1 flex overflow-hidden no-print">
            <aside className="w-64 bg-white border-r border-slate-200">
                <div className="p-4 border-b">
                    <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border rounded" />
                </div>
                <div className="p-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chọn Ngày</label>
                    {weekDays.map(d => (
                        <button key={d} onClick={() => setViewDate(d)} className={`w-full text-left px-3 py-2 rounded mb-1 text-sm ${d === viewDate ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600'}`}>
                            {new Date(d).toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })}
                        </button>
                    ))}
                </div>
            </aside>

            <main className="flex-1 p-6 overflow-y-auto">
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl shadow-sm border">Lịch hẹn: {stats.total}</div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border">Chưa đến: {stats.scheduled}</div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border">Đã tiếp nhận: {stats.arrived}</div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                            <tr>
                                <th className="px-6 py-4">Giờ hẹn</th>
                                <th className="px-6 py-4">Bệnh nhân</th>
                                <th className="px-6 py-4">Trạng thái</th>
                                <th className="px-6 py-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y text-sm">
                            {filteredPatients.map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4">{p.appointmentTime ? new Date(p.appointmentTime).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                                    <td className="px-6 py-4">{p.name} ({p.phone})</td>
                                    <td className="px-6 py-4">{p.status}</td>
                                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                                        {p.status === PatientStatus.SCHEDULED && <button onClick={() => checkInAppointment(p.id)} className="bg-blue-600 text-white px-2 py-1 rounded">Tiếp nhận</button>}
                                        <button onClick={() => deletePatient(p.id)} className="text-red-500">Xóa</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>

        {isImportModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-2xl p-6">
                    <h2 className="text-xl font-bold mb-4">Lấy từ Hàng Đợi</h2>
                    <div className="flex gap-4 mb-4">
                        <select value={importDeptId} onChange={e => setImportDeptId(e.target.value)} className="flex-1 p-2 border rounded">
                            <option value="">Chọn Khoa</option>
                            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                        <select value={importRoomId} onChange={e => setImportRoomId(e.target.value)} className="flex-1 p-2 border rounded">
                            <option value="">Chọn Phòng</option>
                            {DEPARTMENTS.find(d => d.id === importDeptId)?.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <button onClick={handleFetchQueue} className="bg-blue-600 text-white px-4 py-2 rounded">Xem</button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                        {importQueue.map(p => (
                            <div key={p.id} className="p-2 border-b flex justify-between">
                                <span>{p.code} - {p.name}</span>
                                <button onClick={() => handleSelectImportPatient(p)} className="text-cyan-600 font-bold">Lấy</button>
                            </div>
                        ))}
                    </div>
                    <button onClick={() => setIsImportModalOpen(false)} className="mt-4 w-full p-2 border rounded">Hủy</button>
                </div>
            </div>
        )}

        {isCreateModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl w-full max-w-md p-6">
                    <h2 className="text-xl font-bold mb-4">Tạo Lịch Hẹn</h2>
                    <div className="space-y-3">
                        <input type="text" placeholder="Họ tên" value={newApptData.name} onChange={e => setNewApptData({...newApptData, name: e.target.value})} className="w-full p-2 border rounded" />
                        <input type="text" placeholder="SĐT" value={newApptData.phone} onChange={e => setNewApptData({...newApptData, phone: e.target.value})} className="w-full p-2 border rounded" />
                        <div className="flex gap-2">
                             <input type="date" value={newApptData.date} onChange={e => setNewApptData({...newApptData, date: e.target.value})} className="flex-1 p-2 border rounded" />
                             <input type="time" value={newApptData.time} onChange={e => setNewApptData({...newApptData, time: e.target.value})} className="flex-1 p-2 border rounded" />
                        </div>
                    </div>
                    <div className="mt-6 flex gap-2">
                        <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 p-2 border rounded">Hủy</button>
                        <button onClick={handleCreate} className="flex-1 bg-cyan-600 text-white p-2 rounded">Lưu & In</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
