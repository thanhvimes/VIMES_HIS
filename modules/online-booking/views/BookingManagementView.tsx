
import React, { useState, useMemo } from 'react';
import { 
    SearchIcon, 
    FilterIcon, 
    CheckCircleIcon, 
    XCircleIcon, 
    ClockIcon,
    CalendarIcon,
    PhoneIcon,
    UserCircleIcon,
    EyeIcon,
    TrashIcon,
    PrinterIcon,
    MegaphoneIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotification } from '../../../contexts/NotificationContext';

interface BookingRequest {
    id: string;
    patientName: string;
    phone: string;
    speciality: string;
    date: string;
    time: string;
    source: 'Portal' | 'CallCenter';
    status: 'Pending' | 'Approved' | 'Rejected' | 'Arrived';
    createdAt: string;
}

const mockBookings: BookingRequest[] = [
    { id: 'BK001', patientName: 'Nguyễn Văn An', phone: '0912345678', speciality: 'Nội tổng quát', date: '2023-11-28', time: '08:30', source: 'Portal', status: 'Pending', createdAt: '2023-11-27 10:00' },
    { id: 'BK002', patientName: 'Trần Thị Bích', phone: '0987654321', speciality: 'Sản phụ khoa', date: '2023-11-28', time: '09:00', source: 'Portal', status: 'Approved', createdAt: '2023-11-27 11:30' },
    { id: 'BK003', patientName: 'Lê Hoàng Cường', phone: '0905123456', speciality: 'Ngoại khoa', date: '2023-11-28', time: '14:00', source: 'CallCenter', status: 'Pending', createdAt: '2023-11-27 14:00' },
    { id: 'BK004', patientName: 'Phạm Thị Dung', phone: '0358987654', speciality: 'Nhi khoa', date: '2023-11-29', time: '08:00', source: 'Portal', status: 'Rejected', createdAt: '2023-11-27 16:00' },
];

const BookingManagementView: React.FC = () => {
    const { fontSettings } = useTheme();
    const { addNotification } = useNotification();
    const [data, setData] = useState<BookingRequest[]>(mockBookings);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

    const inputClass = "p-2.5 border rounded-xl outline-none transition-all duration-200 focus:ring-2 focus:ring-teal-500 font-bold " + 
                       "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 " +
                       "text-slate-900 dark:text-white placeholder-slate-400";

    const filteredBookings = useMemo(() => {
        return data.filter(b => {
            const matchesSearch = b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || b.phone.includes(searchTerm);
            const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
            const matchesDate = !dateFilter || b.date === dateFilter;
            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [data, searchTerm, statusFilter, dateFilter]);

    const handleApprove = (id: string) => {
        setData(prev => prev.map(item => item.id === id ? { ...item, status: 'Approved' } : item));
        const item = data.find(i => i.id === id);
        addNotification("Đã duyệt lịch", `Lịch hẹn của ${item?.patientName} đã được xác nhận.`, "success", undefined, true);
    };

    const handleReject = (id: string) => {
        if (!window.confirm("Bạn có chắc muốn từ chối lịch hẹn này?")) return;
        setData(prev => prev.map(item => item.id === id ? { ...item, status: 'Rejected' } : item));
        addNotification("Từ chối lịch", `Đã từ chối lịch hẹn và gửi thông báo cho bệnh nhân.`, "warning", undefined, true);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400';
            case 'Approved': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400';
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400';
            case 'Arrived': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center transition-all hover:scale-[1.02] cursor-pointer" onClick={() => setStatusFilter('Pending')}>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Chờ duyệt</p>
                        <p className="text-3xl font-black text-orange-600">{data.filter(b => b.status === 'Pending').length}</p>
                    </div>
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600"><ClockIcon className="w-6 h-6"/></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center transition-all hover:scale-[1.02] cursor-pointer" onClick={() => setStatusFilter('Approved')}>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Đã xác nhận</p>
                        <p className="text-3xl font-black text-green-600">{data.filter(b => b.status === 'Approved').length}</p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600"><CheckCircleIcon className="w-6 h-6"/></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center transition-all hover:scale-[1.02] cursor-pointer" onClick={() => setStatusFilter('All')}>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Tổng lịch hẹn</p>
                        <p className="text-3xl font-black text-blue-600">{data.length}</p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600"><CalendarIcon className="w-6 h-6"/></div>
                </div>
                <div className="bg-indigo-600 p-5 rounded-2xl shadow-lg text-white flex justify-between items-center transition-all hover:scale-[1.02]">
                    <div>
                        <p className="text-[10px] font-black opacity-70 uppercase mb-1">Đến từ Portal</p>
                        <p className="text-3xl font-black">{data.filter(b => b.source === 'Portal').length}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl"><MegaphoneIcon className="w-6 h-6"/></div>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <input 
                                type="text" 
                                placeholder="Tìm tên BN, Số điện thoại..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`${inputClass} pl-9 w-full`}
                            />
                        </div>
                        <input 
                            type="date" 
                            value={dateFilter}
                            onChange={e => setDateFilter(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className={inputClass}
                        >
                            <option value="All">Tất cả trạng thái</option>
                            <option value="Pending">Đang chờ duyệt</option>
                            <option value="Approved">Đã xác nhận</option>
                            <option value="Rejected">Đã hủy/Từ chối</option>
                        </select>
                        <button className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition shadow-sm">
                            <PrinterIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4 w-12 text-center">STT</th>
                                <th className="p-4">Ngày / Giờ hẹn</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4">Chuyên khoa</th>
                                <th className="p-4 text-center">Nguồn</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredBookings.length === 0 ? (
                                <tr><td colSpan={7} className="p-20 text-center text-slate-400 italic font-bold">Không tìm thấy yêu cầu nào phù hợp.</td></tr>
                            ) : (
                                filteredBookings.map((b, idx) => (
                                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">{b.date}</div>
                                            <div className="text-xs text-blue-600 font-bold flex items-center gap-1 mt-1">
                                                <ClockIcon className="w-3 h-3"/> {b.time}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-black text-slate-800 dark:text-white uppercase text-sm">{b.patientName}</div>
                                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                <PhoneIcon className="w-3 h-3"/> {b.phone}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{b.speciality}</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${b.source === 'Portal' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30' : 'bg-slate-100 text-slate-600 dark:bg-slate-700'}`}>
                                                {b.source}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border shadow-sm ${getStatusStyle(b.status)}`}>
                                                {b.status === 'Approved' ? 'Đã duyệt' : b.status === 'Pending' ? 'Chờ duyệt' : b.status === 'Rejected' ? 'Đã hủy' : 'Đã đến'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {b.status === 'Pending' && (
                                                    <>
                                                        <button onClick={() => handleApprove(b.id)} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm transition" title="Duyệt">
                                                            <CheckCircleIcon className="w-4 h-4"/>
                                                        </button>
                                                        <button onClick={() => handleReject(b.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 shadow-sm transition" title="Từ chối">
                                                            <XCircleIcon className="w-4 h-4"/>
                                                        </button>
                                                    </>
                                                )}
                                                <button className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 shadow-sm transition" title="Xem chi tiết">
                                                    <EyeIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BookingManagementView;
