
import React, { useState, useMemo } from 'react';
import { 
    CalendarIcon, 
    UserPlusIcon, 
    SearchIcon, 
    ClockIcon, 
    CheckIcon, 
    XIcon, 
    ChevronLeftIcon, 
    ChevronRightIcon, 
    UserGroupIcon,
    FilterIcon,
    PlusIcon,
    PhoneIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { Appointment, AppointmentStatus } from '../../../types/patient';

// --- Types & Mocks ---
interface ExtendedAppointment extends Appointment {
    phone?: string;
    type?: 'New' | 'Re-visit';
    dob?: string;
}

const mockAppointmentsData: ExtendedAppointment[] = [
    { id: 'A001', patientName: 'Trần Thị Bích', patientId: 'P002', phone: '0987654321', time: '08:00', doctor: 'BS. Nguyễn Văn A', reason: 'Khám thai định kỳ', status: AppointmentStatus.Completed, type: 'Re-visit' },
    { id: 'A002', patientName: 'Phạm Thị Dung', patientId: 'P004', phone: '0358987654', time: '09:30', doctor: 'BS. Nguyễn Văn A', reason: 'Đau bụng dưới', status: AppointmentStatus.Waiting, type: 'New' },
    { id: 'A003', patientName: 'Nguyễn Văn An', patientId: 'P001', phone: '0912345678', time: '10:00', doctor: 'BS. Lê Văn C', reason: 'Khám tổng quát', status: AppointmentStatus.Scheduled, type: 'New' },
    { id: 'A004', patientName: 'Lê Hoàng Cường', patientId: 'P003', phone: '0905123456', time: '10:30', doctor: 'BS. Trần Thị B', reason: 'Tái khám tiểu đường', status: AppointmentStatus.Scheduled, type: 'Re-visit' },
    { id: 'A005', patientName: 'Hoàng Văn Em', patientId: 'P005', phone: '0988776655', time: '14:00', doctor: 'BS. Lê Văn C', reason: 'Nội soi tai mũi họng', status: AppointmentStatus.Scheduled, type: 'New' },
];

const doctors = ['BS. Nguyễn Văn A', 'BS. Trần Thị B', 'BS. Lê Văn C', 'BS. Phạm Văn D'];

// --- Modal Component ---
const BookingModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    selectedDate 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (data: any) => void;
    selectedDate: string;
}) => {
    const [formData, setFormData] = useState({
        patientName: '',
        phone: '',
        dob: '',
        doctor: doctors[0],
        time: '08:00',
        type: 'New',
        reason: ''
    });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl flex flex-col animate-fade-in-up overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-blue-600"/> Đặt lịch hẹn mới
                    </h3>
                    <button onClick={onClose}><XIcon className="w-5 h-5 text-slate-400 hover:text-slate-600"/></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tên bệnh nhân <span className="text-red-500">*</span></label>
                            <input 
                                required
                                type="text" 
                                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                                value={formData.patientName}
                                onChange={e => setFormData({...formData, patientName: e.target.value})}
                                placeholder="Nhập họ tên..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                            <input 
                                required
                                type="tel" 
                                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                placeholder="09..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Ngày hẹn</label>
                            <input 
                                type="date" 
                                disabled 
                                className="w-full p-2 border rounded-lg bg-slate-100 dark:bg-slate-800 dark:border-slate-600 text-slate-500 cursor-not-allowed"
                                value={selectedDate}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Giờ hẹn <span className="text-red-500">*</span></label>
                            <input 
                                required
                                type="time" 
                                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                                value={formData.time}
                                onChange={e => setFormData({...formData, time: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Bác sĩ phụ trách</label>
                        <select 
                            className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                            value={formData.doctor}
                            onChange={e => setFormData({...formData, doctor: e.target.value})}
                        >
                            {doctors.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Loại khám</label>
                        <div className="flex gap-4 mt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="type" checked={formData.type === 'New'} onChange={() => setFormData({...formData, type: 'New'})} />
                                <span className="text-sm">Khám mới</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="type" checked={formData.type === 'Re-visit'} onChange={() => setFormData({...formData, type: 'Re-visit'})} />
                                <span className="text-sm">Tái khám</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Lý do khám</label>
                        <textarea 
                            rows={2}
                            className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 resize-none"
                            value={formData.reason}
                            onChange={e => setFormData({...formData, reason: e.target.value})}
                            placeholder="Triệu chứng, ghi chú..."
                        ></textarea>
                    </div>

                    <div className="pt-2 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition">Hủy</button>
                        <button type="submit" className="px-6 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition">Lưu lịch hẹn</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ScheduleView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [appointments, setAppointments] = useState<ExtendedAppointment[]>(mockAppointmentsData);
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10));
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDoctor, setFilterDoctor] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // --- Computed ---
    const filteredAppointments = useMemo(() => {
        return appointments.filter(apt => {
            const matchesSearch = apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (apt.patientId && apt.patientId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                  (apt.phone && apt.phone.includes(searchTerm));
            
            const matchesDoctor = filterDoctor === 'All' || apt.doctor === filterDoctor;

            return matchesSearch && matchesDoctor;
        }).sort((a, b) => a.time.localeCompare(b.time));
    }, [appointments, searchTerm, filterDoctor, currentDate]);

    // --- Actions ---
    const handleDateChange = (days: number) => {
        const date = new Date(currentDate);
        date.setDate(date.getDate() + days);
        setCurrentDate(date.toISOString().slice(0, 10));
    };

    const handleAddAppointment = (data: any) => {
        const newApt: ExtendedAppointment = {
            id: `A${Date.now()}`,
            patientName: data.patientName,
            patientId: `P${Math.floor(Math.random() * 1000)}`,
            phone: data.phone,
            time: data.time,
            doctor: data.doctor,
            reason: data.reason,
            status: AppointmentStatus.Scheduled,
            type: data.type
        };
        setAppointments(prev => [...prev, newApt]);
    };

    const updateStatus = (id: string, status: AppointmentStatus) => {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    };

    const getStatusBadge = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.Scheduled: return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Đã đặt</span>;
            case AppointmentStatus.Waiting: return <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">Đã đến (Chờ)</span>;
            case AppointmentStatus.InProgress: return <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Đang khám</span>;
            case AppointmentStatus.Completed: return <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">Hoàn thành</span>;
            case AppointmentStatus.Cancelled: return <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">Hủy</span>;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            
            {/* Header & Toolbar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-center gap-4">
                
                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-start">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 p-1 shadow-sm">
                        <button onClick={() => handleDateChange(-1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded transition"><ChevronLeftIcon className="w-5 h-5 text-slate-500"/></button>
                        <div className="px-4 font-bold text-slate-700 dark:text-slate-200 min-w-[140px] text-center flex items-center justify-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-blue-600"/>
                            {new Date(currentDate).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        <button onClick={() => handleDateChange(1)} className="p-1.5 hover:bg-white dark:hover:bg-slate-600 rounded transition"><ChevronRightIcon className="w-5 h-5 text-slate-500"/></button>
                    </div>
                    
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold shadow-md flex items-center gap-2 transition transform active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5"/> <span className="hidden sm:inline">Đặt lịch</span>
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm tên, SĐT..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                        />
                    </div>
                    <div className="relative sm:w-48">
                        <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <select 
                            value={filterDoctor}
                            onChange={e => setFilterDoctor(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer ${fontSettings.controls}`}
                        >
                            <option value="All">Tất cả bác sĩ</option>
                            {doctors.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><ClockIcon className="w-5 h-5"/></div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Tổng lịch</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{filteredAppointments.length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full"><UserGroupIcon className="w-5 h-5"/></div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Đã đến</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{filteredAppointments.filter(a => a.status === AppointmentStatus.Waiting || a.status === AppointmentStatus.InProgress).length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-green-100 text-green-600 rounded-full"><CheckIcon className="w-5 h-5"/></div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Hoàn thành</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{filteredAppointments.filter(a => a.status === AppointmentStatus.Completed).length}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-red-100 text-red-600 rounded-full"><XIcon className="w-5 h-5"/></div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Hủy / Vắng</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">{filteredAppointments.filter(a => a.status === AppointmentStatus.Cancelled).length}</p>
                    </div>
                </div>
            </div>

            {/* List View */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="overflow-auto flex-1">
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 w-24 text-center">Giờ</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4">Bác sĩ</th>
                                <th className="p-4">Lý do / Loại</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredAppointments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-10 text-center text-slate-400 italic">
                                        Không có lịch hẹn nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredAppointments.map((apt) => (
                                    <tr key={apt.id} className="hover:bg-blue-50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-4 text-center">
                                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{apt.time}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">{apt.patientName}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                                <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">{apt.patientId}</span>
                                                {apt.phone && <span className="flex items-center gap-1"><PhoneIcon className="w-3 h-3"/> {apt.phone}</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-700 dark:text-slate-300">
                                            {apt.doctor}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-700 dark:text-slate-300">{apt.reason}</div>
                                            {apt.type && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${apt.type === 'New' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
                                                    {apt.type === 'New' ? 'Khám mới' : 'Tái khám'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(apt.status)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {apt.status === AppointmentStatus.Scheduled && (
                                                    <button 
                                                        onClick={() => updateStatus(apt.id, AppointmentStatus.Waiting)}
                                                        className="p-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-md transition shadow-sm flex items-center gap-1 text-xs font-bold px-2"
                                                        title="Bệnh nhân đã đến (Check-in)"
                                                    >
                                                        <CheckIcon className="w-4 h-4"/> Đã đến
                                                    </button>
                                                )}
                                                {(apt.status === AppointmentStatus.Scheduled || apt.status === AppointmentStatus.Waiting) && (
                                                    <button 
                                                        onClick={() => updateStatus(apt.id, AppointmentStatus.Cancelled)}
                                                        className="p-1.5 bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600 rounded-md transition"
                                                        title="Hủy lịch"
                                                    >
                                                        <XIcon className="w-4 h-4"/>
                                                    </button>
                                                )}
                                                {apt.status === AppointmentStatus.Waiting && (
                                                    <button 
                                                        onClick={() => updateStatus(apt.id, AppointmentStatus.Completed)}
                                                        className="p-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition"
                                                        title="Hoàn thành"
                                                    >
                                                        <CheckIcon className="w-4 h-4"/>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Booking Modal */}
            <BookingModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleAddAppointment}
                selectedDate={currentDate}
            />
        </div>
    );
};

export default ScheduleView;
