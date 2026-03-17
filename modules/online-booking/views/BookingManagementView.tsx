
import React, { useState, useMemo, useEffect } from 'react';
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
    MegaphoneIcon,
    RefreshIcon,
    PaperAirplaneIcon,
    SmsIcon,
    UserPlusIcon,
    BuildingOfficeIcon,
    CheckIcon,
    ClipboardListIcon,
    XIcon,
    DocumentPlusIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { bookingService, OnlineBookingRecord, BookingSpeciality } from '../../../services/bookingService';
import { formatDate } from '../../../utils/formatters';
import BookingPrintTemplate from '../components/BookingPrintTemplate';
import QuickSpecialityBookingModal from '../components/QuickSpecialityBookingModal';

const BookingManagementView: React.FC = () => {
    const { fontSettings } = useTheme();
    const { addNotification } = useNotification();

    // State
    const [bookings, setBookings] = useState<OnlineBookingRecord[]>([]);
    const [specialities, setSpecialities] = useState<BookingSpeciality[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [specialityFilter, setSpecialityFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [printBooking, setPrintBooking] = useState<OnlineBookingRecord | null>(null);
    const [quickBookingTarget, setQuickBookingTarget] = useState<OnlineBookingRecord | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [data, specs] = await Promise.all([
                bookingService.getBookingList({}),
                bookingService.getSpecialities()
            ]);
            console.log('📋 Booking list data:', data);
            console.log('📋 Data length:', data.length);
            console.log('📋 Specialities:', specs);

            // Deduplicate specialities by ID
            const uniqueSpecs = Array.from(
                new Map(specs.map(s => [s.id, s])).values()
            );
            console.log('📋 Unique specialities:', uniqueSpecs);

            setBookings(data);
            setSpecialities(uniqueSpecs);
        } catch (error) {
            console.error('❌ Error loading booking list:', error);
            addNotification("Lỗi", "Không thể tải dữ liệu", "error", undefined, true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Logic xử lý Duyệt & Đẩy HIS
    const handleApprove = async (booking: OnlineBookingRecord) => {
        setProcessingId(String(booking.id));
        try {
            const res = await bookingService.approveBooking(booking.id);
            if (res.success) {
                setBookings(prev => prev.map(b =>
                    b.id === booking.id ? { ...b, status: 'S' } : b
                ));
                addNotification(
                    "Duyệt thành công",
                    `Đã duyệt BN ${booking.patientName}. STT: ${res.receptNo}`,
                    "success",
                    undefined,
                    true
                );
            }
        } catch (err: any) {
            addNotification("Lỗi", err.message || "Không thể duyệt", "error", undefined, true);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number) => {
        if (!window.confirm("Từ chối lịch hẹn này? Hệ thống sẽ gửi tin nhắn thông báo hủy cho khách hàng.")) return;
        try {
            await bookingService.rejectBooking(id, "Bác sĩ bận");
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'C' } : b));
            addNotification("Đã từ chối", "Lịch hẹn đã được hủy.", "warning", undefined, true);
        } catch (err: any) {
            addNotification("Lỗi", err.message || "Không thể từ chối", "error", undefined, true);
        }
    };

    const handleResendSMS = async (id: number) => {
        setProcessingId(String(id));
        try {
            await bookingService.resendSMS(id);
            setProcessingId(null);
            addNotification("Đã gửi lại", "Tin nhắn xác nhận đã được gửi lại.", "info", undefined, true);
        } catch (err: any) {
            setProcessingId(null);
            addNotification("Lỗi", err.message || "Không thể gửi SMS", "error", undefined, true);
        }
    };

    const handlePrint = (booking: OnlineBookingRecord) => {
        setPrintBooking(booking);
        setTimeout(() => {
            window.print();
            setPrintBooking(null);
        }, 100);
    };

    const filteredBookings = useMemo(() => {
        return bookings.filter(b => {
            const matchesSearch = b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || b.phone.includes(searchTerm);
            const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
            const matchesSpec = specialityFilter === 'All' || (b.specialityName && b.specialityName === specialityFilter);
            // Handle both ISO date string and date-only format
            const bookingDateStr = b.bookingDate ? b.bookingDate.split('T')[0] : '';
            const matchesDate = !dateFilter || bookingDateStr === dateFilter;
            return matchesSearch && matchesStatus && matchesDate && matchesSpec;
        });
    }, [bookings, searchTerm, statusFilter, dateFilter, specialityFilter]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'O': return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-orange-200 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 shadow-sm">Chờ duyệt</span>;
            case 'S': return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-green-200 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 shadow-sm">Đã duyệt</span>;
            case 'C': return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-red-200 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 shadow-sm">Đã hủy</span>;
            default: return <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border border-blue-200 bg-blue-50 text-blue-700">Khác</span>;
        }
    };

    const getSmsBadge = (status: string) => {
        switch (status) {
            case 'Sent': return <div className="flex items-center gap-1 text-green-600 font-bold text-xs" title="Đã gửi thành công"><SmsIcon className="w-4 h-4" /> Đã gửi</div>;
            case 'Failed': return <div className="flex items-center gap-1 text-red-500 font-bold text-xs" title="Lỗi gửi tin"><XCircleIcon className="w-4 h-4" /> Lỗi</div>;
            default: return <div className="flex items-center gap-1 text-slate-400 font-bold text-xs" title="Chờ gửi"><ClockIcon className="w-4 h-4" /> Chờ</div>;
        }
    };

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* Header & Stats */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-500/30">
                        <ClipboardListIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Duyệt đăng ký trực tuyến</h1>
                        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                            <span>Tổng cộng: {bookings.length}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-orange-500">Chờ duyệt: {bookings.filter(b => b.status === 'O').length}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            if (!window.confirm("Bạn có muốn khởi tạo khung giờ khám cho 30 ngày tới không?")) return;
                            setIsLoading(true);
                            try {
                                const res = await bookingService.initSlots(30);
                                if (res.success) addNotification("Thành công", res.message, "success", undefined, true);
                            } catch (err: any) {
                                addNotification("Lỗi", err.message || "Không thể khởi tạo", "error", undefined, true);
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                        disabled={isLoading}
                        className="p-2.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl border border-orange-200 dark:border-orange-800 hover:bg-orange-100 transition shadow-sm flex items-center gap-2 font-bold text-sm"
                        title="Khởi tạo khung giờ cho 30 ngày tới"
                    >
                        <CalendarIcon className="w-5 h-5" />
                        Khởi tạo lịch khám
                    </button>
                    <button
                        onClick={loadData}
                        disabled={isLoading}
                        className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-white transition shadow-sm flex items-center gap-2 font-bold text-sm"
                    >
                        <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        Nạp lại
                    </button>
                </div>
            </div>

            {/* Toolbar Filter */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row gap-3 items-end">
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Tìm bệnh nhân</label>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Họ tên, SĐT..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${fontSettings.controls}`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Ngày khám</label>
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={e => setDateFilter(e.target.value)}
                            className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold ${fontSettings.controls}`}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Chuyên khoa</label>
                        <select
                            value={specialityFilter}
                            onChange={e => setSpecialityFilter(e.target.value)}
                            className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold ${fontSettings.controls}`}
                        >
                            <option value="All">Tất cả khoa</option>
                            {specialities.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className={`p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 text-sm font-bold ${fontSettings.controls}`}
                    >
                        <option value="All">Tất cả trạng thái</option>
                        <option value="O">Chờ duyệt</option>
                        <option value="S">Đã duyệt</option>
                        <option value="C">Đã hủy</option>
                    </select>
                </div>
            </div>

            {/* Main Table */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4 w-12 text-center">STT</th>
                                <th className="p-4">Thời gian hẹn</th>
                                <th className="p-4">Số hồ sơ</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4">Chuyên khoa / Lý do</th>
                                <th className="p-4">Phòng khám</th>
                                <th className="p-4 text-center">Nguồn</th>
                                <th className="p-4 text-center">SMS</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredBookings.length === 0 ? (
                                <tr><td colSpan={9} className="p-20 text-center text-slate-400 italic font-bold">Không tìm thấy bản ghi nào.</td></tr>
                            ) : (
                                filteredBookings.map((b, idx) => (
                                    <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">
                                                {b.bookingDate ? formatDate(b.bookingDate.split('T')[0]) : '---'}
                                            </div>
                                            <div className="text-xs text-blue-600 font-black flex items-center gap-1 mt-1">
                                                <ClockIcon className="w-3 h-3" /> {b.bookingTime}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-mono text-blue-600 font-bold text-xs">{b.docNo || '---'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="font-black text-slate-800 dark:text-white uppercase text-sm">{b.patientName}</div>
                                                <span className="text-[9px] bg-teal-100 text-teal-700 px-1.5 rounded font-bold border border-teal-200" title="Bệnh nhân mới"><UserPlusIcon className="w-2.5 h-2.5 inline" /> MỚI</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                                <PhoneIcon className="w-3 h-3" /> {b.phone}
                                                <span className="mx-1 opacity-30">|</span>
                                                <span>{b.gender === 'M' ? 'Nam' : 'Nữ'}, {b.birthDate ? new Date().getFullYear() - new Date(b.birthDate).getFullYear() : '?'}T</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-sm">
                                                <BuildingOfficeIcon className="w-3.5 h-3.5 text-indigo-500" />
                                                {b.specialityName || b.deptId}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 italic line-clamp-1" title={b.reason}>{b.reason || 'Không có'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white text-sm">
                                                {b.roomName || 'Chưa phân phòng'}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                <span className="font-mono">P.{b.roomId || '?'}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span>STT {b.receptNo || '?'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-teal-50 text-teal-700 dark:bg-teal-900/30">
                                                ONLINE
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center">
                                                {getSmsBadge(b.smsStatus || 'Pending')}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {getStatusBadge(b.status)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                {b.status === 'O' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(b)}
                                                            disabled={processingId === String(b.id)}
                                                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition transform active:scale-90 disabled:opacity-50"
                                                            title="Duyệt & Đẩy vào HIS"
                                                        >
                                                            {processingId === String(b.id) ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <CheckIcon className="w-4 h-4" />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(b.id)}
                                                            disabled={processingId === String(b.id)}
                                                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition disabled:opacity-50"
                                                            title="Từ chối"
                                                        >
                                                            <XIcon className="w-4 h-4" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleResendSMS(b.id)}
                                                        className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
                                                        title="Gửi lại SMS"
                                                    >
                                                        <PaperAirplaneIcon className="w-4 h-4 -rotate-45" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setQuickBookingTarget(b)}
                                                    className="p-2 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition"
                                                    title="Đăng ký thêm chuyên khoa khác"
                                                >
                                                    <DocumentPlusIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handlePrint(b)}
                                                    className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition"
                                                    title="In phiếu hẹn"
                                                >
                                                    <PrinterIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer Toolbar */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">
                    <div className="flex gap-4">
                        <span>Hiển thị {filteredBookings.length} yêu cầu</span>
                        <span className="text-green-600">Duyệt xong: {bookings.filter(b => b.status === 'S').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <PaperAirplaneIcon className="w-3.5 h-3.5 text-blue-500" />
                        Dữ liệu đồng bộ lúc: {new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>

            {/* Print Template (hidden, only shows when printing) */}
            {printBooking && <BookingPrintTemplate booking={printBooking} />}

            {/* Quick Speciality Booking Modal */}
            {quickBookingTarget && (
                <QuickSpecialityBookingModal
                    booking={quickBookingTarget}
                    onClose={() => setQuickBookingTarget(null)}
                    onSuccess={loadData}
                />
            )}
        </div>
    );
};

export default BookingManagementView;
