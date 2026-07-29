
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
    DocumentPlusIcon,
    ExclamationTriangleIcon,
    ShieldCheckIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useSession } from '../../../contexts/SessionContext';
import { bookingService, OnlineBookingRecord, BookingSpeciality, LocationItem } from '../../../services/bookingService';
import { formatDate } from '../../../utils/formatters';
import { FormDateInput } from '../../../components/ui/forms';
import BookingPrintTemplate from '../components/BookingPrintTemplate';
import QuickSpecialityBookingModal from '../components/QuickSpecialityBookingModal';

const BookingManagementView: React.FC = () => {
    const { fontSettings } = useTheme();
    const { addNotification } = useNotification();
    const { user, userInfo } = useSession();

    const userDeptCode = user?.departmentId || userInfo?.deptId || '';
    const userDeptName = user?.departmentName || '';

    // State
    const [bookings, setBookings] = useState<OnlineBookingRecord[]>([]);
    const [specialities, setSpecialities] = useState<BookingSpeciality[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [specialityFilter, setSpecialityFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
    const [printBooking, setPrintBooking] = useState<OnlineBookingRecord | null>(null);
    const [quickBookingTarget, setQuickBookingTarget] = useState<OnlineBookingRecord | null>(null);
    const [departments, setDepartments] = useState<LocationItem[]>([]);

    // Ghost Booking State
    const [showGhostModal, setShowGhostModal] = useState(false);
    const [ghostBookings, setGhostBookings] = useState<any[]>([]);
    const [isLoadingGhosts, setIsLoadingGhosts] = useState(false);
    const [isCancellingGhosts, setIsCancellingGhosts] = useState(false);
    const [selectedGhostIds, setSelectedGhostIds] = useState<Set<number>>(new Set());
    const [ghostHoursThreshold, setGhostHoursThreshold] = useState(2);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const isAdmin = user?.role === 'admin' || user?.userId === 'admin' || user?.groupId === 'D' || user?.groupId === 'A';
            const baseDept = isAdmin ? undefined : (userDeptCode || undefined);
            const effectiveDept = deptFilter !== 'All' ? deptFilter : baseDept;
            const [data, specs] = await Promise.all([
                bookingService.getBookingList({
                    deptId: effectiveDept,
                    status: statusFilter !== 'All' ? statusFilter : undefined,
                    speciality: specialityFilter !== 'All' ? specialityFilter : undefined,
                    search: searchTerm || undefined,
                    fromDate: dateFilter || undefined,
                    toDate: dateFilter || undefined
                }),
                bookingService.getSpecialities(effectiveDept)
            ]);
            console.log('📋 Booking list data:', data);
            console.log('📋 Data length:', data.length);

            // Deduplicate specialities by ID
            const uniqueSpecs = Array.from(
                new Map(specs.map(s => [s.id, s])).values()
            );

            setBookings(Array.isArray(data) ? data : []);
            setSpecialities(uniqueSpecs);
        } catch (error) {
            console.error('❌ Error loading booking list:', error);
            addNotification("Lỗi", "Không thể tải dữ liệu", "error", undefined, true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        bookingService.getDepartments().then(setDepartments).catch(console.error);
    }, []);

    useEffect(() => {
        loadData();
    }, [userDeptCode, statusFilter, specialityFilter, dateFilter, deptFilter]);

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

    // Ghost Booking handlers
    const handleOpenGhostModal = async () => {
        setShowGhostModal(true);
        setIsLoadingGhosts(true);
        setSelectedGhostIds(new Set());
        try {
            const res = await bookingService.getGhostBookings({ hoursThreshold: ghostHoursThreshold });
            setGhostBookings(res.ghosts || []);
        } catch (err: any) {
            addNotification('Lỗi', err.message || 'Không thể tải số ảo', 'error', undefined, true);
        } finally {
            setIsLoadingGhosts(false);
        }
    };

    const handleRefreshGhosts = async () => {
        setIsLoadingGhosts(true);
        setSelectedGhostIds(new Set());
        try {
            const res = await bookingService.getGhostBookings({ hoursThreshold: ghostHoursThreshold });
            setGhostBookings(res.ghosts || []);
        } catch (err: any) {
            addNotification('Lỗi', err.message || 'Không thể tải số ảo', 'error', undefined, true);
        } finally {
            setIsLoadingGhosts(false);
        }
    };

    const handleCancelGhosts = async () => {
        const idsToCancel = selectedGhostIds.size > 0
            ? Array.from(selectedGhostIds)
            : ghostBookings.map((g: any) => g.id);

        if (idsToCancel.length === 0) {
            addNotification('Thông báo', 'Không có số ảo nào để hủy', 'info', undefined, true);
            return;
        }

        const confirmed = window.confirm(`Xác nhận hủy ${idsToCancel.length} số ảo? Thao tác này sẽ giải phóng các khung giờ tương ứng.`);
        if (!confirmed) return;

        setIsCancellingGhosts(true);
        try {
            const res = await bookingService.cancelGhostBookings({
                ids: idsToCancel,
                reason: 'Hủy số ảo - quá hạn chờ duyệt'
            });
            addNotification(
                'Hoàn thành',
                `Đã hủy ${res.cancelled} số ảo, giải phóng ${res.slotsFreed} khung giờ`,
                'success', undefined, true
            );
            setShowGhostModal(false);
            loadData(); // Reload booking list
        } catch (err: any) {
            addNotification('Lỗi', err.message || 'Không thể hủy số ảo', 'error', undefined, true);
        } finally {
            setIsCancellingGhosts(false);
        }
    };

    const toggleGhostSelection = (id: number) => {
        setSelectedGhostIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleAllGhosts = () => {
        if (selectedGhostIds.size === ghostBookings.length) {
            setSelectedGhostIds(new Set());
        } else {
            setSelectedGhostIds(new Set(ghostBookings.map((g: any) => g.id)));
        }
    };

    const filteredBookings = useMemo(() => {
        const isAdmin = user?.role === 'admin' || user?.userId === 'admin' || user?.groupId === 'D' || user?.groupId === 'A';
        const baseTargetDept = (!isAdmin && userDeptCode) ? userDeptCode : 'All';
        const targetDept = deptFilter !== 'All' ? deptFilter : baseTargetDept;

        return bookings.filter(b => {
            const searchLower = searchTerm.toLowerCase().trim();
            const matchesSearch = !searchLower || 
                (b.patientName && b.patientName.toLowerCase().includes(searchLower)) || 
                (b.phone && String(b.phone).includes(searchLower)) ||
                (b.id != null && String(b.id).includes(searchLower)) ||
                (b.docNo && String(b.docNo).toLowerCase().includes(searchLower)) ||
                (b.idCard && String(b.idCard).toLowerCase().includes(searchLower));

            const matchesStatus = statusFilter === 'All' || b.status === statusFilter;

            const matchesSpec = specialityFilter === 'All' || 
                (b.specialityName && b.specialityName === specialityFilter) ||
                (b.specialityCode && b.specialityCode === specialityFilter);

            const bookingDateStr = b.bookingDate ? b.bookingDate.split('T')[0] : '';
            const matchesDate = !dateFilter || bookingDateStr === dateFilter;

            const matchesDept = targetDept === 'All' ||
                b.deptId === targetDept ||
                b.specialityCode === targetDept;

            return matchesSearch && matchesStatus && matchesDate && matchesSpec && matchesDept;
        });
    }, [bookings, searchTerm, statusFilter, dateFilter, specialityFilter, userDeptCode, userDeptName, user?.role, userInfo?.xDept, deptFilter]);

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
                            <span>Tổng cộng: {filteredBookings.length}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-orange-500">Chờ duyệt: {filteredBookings.filter(b => b.status === 'O').length}</span>
                            {userDeptCode && (
                                <>
                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                    <span className="px-2 py-0.5 bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 rounded-md text-[10px] font-bold border border-teal-200 dark:border-teal-700">
                                        Khoa: {userDeptCode} {userDeptName ? `- ${userDeptName}` : ''}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {/* Ghost Booking Button - shows badge count if any */}
                    <button
                        onClick={handleOpenGhostModal}
                        disabled={isLoading}
                        className="relative p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition shadow-sm flex items-center gap-2 font-bold text-sm"
                        title="Tìm và hủy số ảo - booking chờ duyệt đã quá hạn"
                    >
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        Hủy số ảo
                    </button>
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
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-5 gap-3">
                    <div className="md:col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Tìm bệnh nhân</label>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Họ tên, SĐT, số hồ sơ..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 outline-none ${fontSettings.controls}`}
                            />
                        </div>
                    </div>

                    <FormDateInput
                        label="Ngày khám"
                        labelClassName="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1"
                        value={dateFilter}
                        onChange={e => setDateFilter(e.target.value)}
                        className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold ${fontSettings.controls}`}
                    />
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Khoa</label>
                        <select
                            value={deptFilter}
                            onChange={e => setDeptFilter(e.target.value)}
                            className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold ${fontSettings.controls}`}
                        >
                            <option value="All">Tất cả khoa</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Chuyên khoa</label>
                        <select
                            value={specialityFilter}
                            onChange={e => setSpecialityFilter(e.target.value)}
                            className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold ${fontSettings.controls}`}
                        >
                            <option value="All">Tất cả chuyên khoa</option>
                            {specialities.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
                                    <tr key={`${b.id}-${idx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
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

            {/* Ghost Booking Modal */}
            {showGhostModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-600 to-purple-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-xl">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-white">Hủy Số Ảo</h2>
                                    <p className="text-purple-200 text-xs font-medium mt-0.5">Booking chờ duyệt quá hạn — chiếm slot nhưng không có bệnh nhân thực tế</p>
                                </div>
                            </div>
                            <button onClick={() => setShowGhostModal(false)} className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition">
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Filter bar */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-black text-slate-500 uppercase whitespace-nowrap">Ngưỡng chờ (giờ):</label>
                                <select
                                    value={ghostHoursThreshold}
                                    onChange={e => setGhostHoursThreshold(Number(e.target.value))}
                                    className="p-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 font-bold"
                                >
                                    <option value={1}>1 giờ</option>
                                    <option value={2}>2 giờ</option>
                                    <option value={4}>4 giờ</option>
                                    <option value={8}>8 giờ</option>
                                    <option value={24}>24 giờ</option>
                                </select>
                            </div>
                            <button
                                onClick={handleRefreshGhosts}
                                disabled={isLoadingGhosts}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold hover:bg-slate-300 transition"
                            >
                                <RefreshIcon className={`w-4 h-4 ${isLoadingGhosts ? 'animate-spin' : ''}`} />
                                Làm mới
                            </button>
                            <div className="ml-auto">
                                {ghostBookings.length > 0 && (
                                    <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                                        Tìm thấy {ghostBookings.length} số ảo
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-auto">
                            {isLoadingGhosts ? (
                                <div className="flex items-center justify-center h-48 gap-3 text-slate-400">
                                    <RefreshIcon className="w-6 h-6 animate-spin" />
                                    <span className="font-bold">Đang quét số ảo...</span>
                                </div>
                            ) : ghostBookings.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 gap-3 text-slate-400">
                                    <ShieldCheckIcon className="w-12 h-12 text-green-400" />
                                    <div className="text-center">
                                        <p className="font-black text-green-600 dark:text-green-400 text-base">Hệ thống sạch!</p>
                                        <p className="text-sm">Không tìm thấy số ảo nào cần xử lý.</p>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-500 uppercase tracking-widest sticky top-0">
                                        <tr>
                                            <th className="p-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    className="rounded"
                                                    checked={selectedGhostIds.size === ghostBookings.length}
                                                    onChange={toggleAllGhosts}
                                                />
                                            </th>
                                            <th className="p-3">Bệnh nhân</th>
                                            <th className="p-3">Ngày hẹn</th>
                                            <th className="p-3">Khung giờ</th>
                                            <th className="p-3">Khoa</th>
                                            <th className="p-3">Phòng</th>
                                            <th className="p-3 text-center">Loại</th>
                                            <th className="p-3 text-right">Tuổi (giờ)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {ghostBookings.map((g: any) => (
                                            <tr
                                                key={g.id}
                                                onClick={() => toggleGhostSelection(g.id)}
                                                className={`cursor-pointer transition-colors ${
                                                    selectedGhostIds.has(g.id)
                                                        ? 'bg-purple-50 dark:bg-purple-900/20'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                                                }`}
                                            >
                                                <td className="p-3">
                                                    <input
                                                        type="checkbox"
                                                        className="rounded"
                                                        checked={selectedGhostIds.has(g.id)}
                                                        onChange={() => toggleGhostSelection(g.id)}
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-bold text-slate-800 dark:text-white">{g.patientName}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <PhoneIcon className="w-3 h-3" /> {g.phone}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-bold text-slate-700 dark:text-slate-200">{g.bookingDate ? formatDate(g.bookingDate) : '---'}</div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-mono font-bold text-blue-600">{g.bookingTime}</div>
                                                </td>
                                                <td className="p-3 text-xs text-slate-600 dark:text-slate-300">{g.deptName || g.deptId}</td>
                                                <td className="p-3 text-xs text-slate-600 dark:text-slate-300">{g.roomName || `P.${g.roomId}`}</td>
                                                <td className="p-3 text-center">
                                                    {g.ghostType === 'EXPIRED' ? (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200">QUÁ HẠN</span>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 border border-amber-200">CHỜ LÂU</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <span className={`font-mono font-bold text-sm ${
                                                        g.ageHours > 24 ? 'text-red-600' : g.ageHours > 8 ? 'text-amber-600' : 'text-slate-500'
                                                    }`}>
                                                        {parseFloat(g.ageHours).toFixed(1)}h
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-3">
                            <div className="text-xs text-slate-500 font-medium">
                                {selectedGhostIds.size > 0
                                    ? <span className="text-purple-600 font-black">Đã chọn {selectedGhostIds.size} / {ghostBookings.length} bản ghi</span>
                                    : <span>Chọn bản ghi để hủy riêng lẻ, hoặc để trống để hủy tất cả</span>
                                }
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowGhostModal(false)}
                                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm hover:bg-slate-300 transition"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={handleCancelGhosts}
                                    disabled={isCancellingGhosts || ghostBookings.length === 0}
                                    className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition shadow-md disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isCancellingGhosts ? (
                                        <RefreshIcon className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <TrashIcon className="w-4 h-4" />
                                    )}
                                    {isCancellingGhosts ? 'Đang hủy...' : `Hủy ${selectedGhostIds.size > 0 ? selectedGhostIds.size : ghostBookings.length} số ảo`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingManagementView;
