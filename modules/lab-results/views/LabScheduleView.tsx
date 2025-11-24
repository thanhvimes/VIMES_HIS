
import React, { useState, useMemo } from 'react';
import { 
    CalendarDaysIcon, 
    SearchIcon, 
    PlusIcon, 
    UserGroupIcon, 
    BeakerIcon, 
    ClockIcon, 
    CheckIcon, 
    XIcon,
    SmsIcon
} from '../../../components/Icons';
import { LabAppointment } from '../../../types';
import { useTheme } from '../../../contexts/ThemeContext';

// --- Mock Data ---
const initialAppointments: LabAppointment[] = [
    { id: 'APT001', patientName: 'Nguyễn Văn An', patientId: 'P001', phone: '0912345678', testTypes: 'Máu tổng quát, Nước tiểu', date: new Date().toISOString().slice(0, 10), time: '08:00', status: 'Scheduled' },
    { id: 'APT002', patientName: 'Trần Thị Bích', patientId: 'P002', phone: '0987654321', testTypes: 'Đường huyết (Đói)', date: new Date().toISOString().slice(0, 10), time: '08:30', status: 'Completed' },
    { id: 'APT003', patientName: 'Lê Hoàng Cường', patientId: 'P003', phone: '0905123456', testTypes: 'Chức năng gan', date: new Date().toISOString().slice(0, 10), time: '09:00', status: 'Scheduled' },
    { id: 'APT004', patientName: 'Phạm Thị Dung', patientId: 'P004', phone: '0358987654', testTypes: 'Hormone tuyến giáp', date: new Date().toISOString().slice(0, 10), time: '09:15', status: 'Cancelled', notes: 'Bệnh nhân bận việc' },
];

const LabScheduleView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [appointments, setAppointments] = useState<LabAppointment[]>(initialAppointments);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
    const [searchTerm, setSearchTerm] = useState('');
    
    // Form State
    const [formData, setFormData] = useState<Partial<LabAppointment>>({
        patientName: '',
        phone: '',
        testTypes: '',
        date: new Date().toISOString().slice(0, 10),
        time: '08:00',
    });

    // --- Filter & Computed ---
    const filteredAppointments = useMemo(() => {
        return appointments.filter(apt => {
            const matchesDate = apt.date === selectedDate;
            const matchesSearch = apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  apt.patientId.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesDate && matchesSearch;
        }).sort((a, b) => a.time.localeCompare(b.time));
    }, [appointments, selectedDate, searchTerm]);

    const stats = useMemo(() => {
        return {
            total: filteredAppointments.length,
            completed: filteredAppointments.filter(a => a.status === 'Completed').length,
            scheduled: filteredAppointments.filter(a => a.status === 'Scheduled').length,
            cancelled: filteredAppointments.filter(a => a.status === 'Cancelled').length,
        };
    }, [filteredAppointments]);

    // --- Actions ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleBook = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.patientName || !formData.time) return;

        const newAppointment: LabAppointment = {
            id: `APT${Date.now()}`,
            patientName: formData.patientName,
            patientId: `P${Math.floor(Math.random() * 1000)}`, // Mock ID generation
            phone: formData.phone,
            testTypes: formData.testTypes || 'Tổng quát',
            date: formData.date || selectedDate,
            time: formData.time || '08:00',
            status: 'Scheduled'
        };

        setAppointments(prev => [...prev, newAppointment]);
        // Reset form but keep date
        setFormData(prev => ({
            ...prev,
            patientName: '',
            phone: '',
            testTypes: '',
            time: '08:00'
        }));
    };

    const updateStatus = (id: string, status: LabAppointment['status']) => {
        setAppointments(prev => prev.map(apt => apt.id === id ? { ...apt, status } : apt));
    };

    const handleSendSms = (apt: LabAppointment) => {
        if (!apt.phone) {
            alert("Bệnh nhân chưa có số điện thoại.");
            return;
        }
        if (window.confirm(`Gửi SMS nhắc lịch hẹn cho ${apt.patientName} đến số ${apt.phone}?`)) {
            // Simulate API call
            setTimeout(() => {
                alert(`Đã gửi SMS thành công đến ${apt.phone}.\nNội dung: "Nhac lich: Ban co lich lay mau XN tai ClinicMS luc ${apt.time} ngay ${new Date(apt.date).toLocaleDateString('vi-VN')}. Vui long den dung gio."`);
            }, 500);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Completed': return <span className="bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded text-xs font-bold">Đã lấy mẫu</span>;
            case 'Cancelled': return <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded text-xs font-bold">Đã hủy</span>;
            default: return <span className="bg-blue-100 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-xs font-bold">Đã đặt lịch</span>;
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CalendarDaysIcon className="w-8 h-8 text-blue-600"/>
                        Lịch Hẹn Lấy Mẫu
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Quản lý đặt lịch và tiếp nhận bệnh nhân đến lấy mẫu xét nghiệm.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
                
                {/* LEFT: Booking Form */}
                <div className="w-full lg:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <PlusIcon className="w-5 h-5 text-blue-600"/> Đặt lịch mới
                        </h3>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1">
                        <form onSubmit={handleBook} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Ngày hẹn</label>
                                <input 
                                    type="date" 
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Giờ hẹn</label>
                                    <input 
                                        type="time" 
                                        name="time"
                                        value={formData.time}
                                        onChange={handleInputChange}
                                        className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">SĐT</label>
                                    <input 
                                        type="tel" 
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                                        placeholder="09..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tên bệnh nhân</label>
                                <input 
                                    type="text" 
                                    name="patientName"
                                    value={formData.patientName}
                                    onChange={handleInputChange}
                                    className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                                    placeholder="Nhập họ tên..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Yêu cầu xét nghiệm</label>
                                <textarea 
                                    name="testTypes"
                                    value={formData.testTypes}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                                    placeholder="VD: Máu, Nước tiểu, Đường huyết..."
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition transform active:scale-95 mt-2"
                            >
                                Xác nhận đặt lịch
                            </button>
                        </form>
                    </div>
                </div>

                {/* RIGHT: Schedule List */}
                <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    
                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => {
                                    setSelectedDate(e.target.value);
                                    setFormData(prev => ({ ...prev, date: e.target.value }));
                                }}
                                className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 font-bold text-sm focus:ring-2 focus:ring-blue-500"
                            />
                            <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Tổng: <strong>{stats.total}</strong> (Chờ: {stats.scheduled} | Xong: {stats.completed})
                            </div>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <input 
                                type="text" 
                                placeholder="Tìm tên BN..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
                        {filteredAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                <CalendarDaysIcon className="w-12 h-12 mb-2 opacity-30"/>
                                <p>Không có lịch hẹn nào cho ngày này.</p>
                            </div>
                        ) : (
                            filteredAppointments.map(apt => (
                                <div key={apt.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-300 transition-colors group">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg font-bold text-center min-w-[80px]">
                                            <div className="text-xl">{apt.time}</div>
                                            <div className="text-[10px] uppercase opacity-70">Giờ hẹn</div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white text-lg">{apt.patientName}</h4>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1 mt-1">
                                                <span className="flex items-center gap-1"><UserGroupIcon className="w-3 h-3"/> {apt.patientId}</span>
                                                <span>SĐT: {apt.phone || '---'}</span>
                                            </div>
                                            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded w-fit">
                                                <BeakerIcon className="w-3.5 h-3.5 text-purple-500"/> {apt.testTypes}
                                            </div>
                                            {apt.notes && <div className="text-xs text-red-500 mt-1 italic">* {apt.notes}</div>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 self-end sm:self-center">
                                        {getStatusBadge(apt.status)}
                                        
                                        {apt.status === 'Scheduled' && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleSendSms(apt)}
                                                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full transition"
                                                    title="Gửi SMS nhắc hẹn"
                                                >
                                                    <SmsIcon className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => updateStatus(apt.id, 'Completed')}
                                                    className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-full transition"
                                                    title="Xác nhận đã lấy mẫu"
                                                >
                                                    <CheckIcon className="w-4 h-4"/>
                                                </button>
                                                <button 
                                                    onClick={() => updateStatus(apt.id, 'Cancelled')}
                                                    className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-full transition"
                                                    title="Hủy lịch"
                                                >
                                                    <XIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LabScheduleView;
