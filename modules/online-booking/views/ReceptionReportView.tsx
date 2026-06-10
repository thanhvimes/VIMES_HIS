
import React, { useState, useMemo, useEffect } from 'react';
import {
    SearchIcon,
    FilterIcon,
    CalendarIcon,
    RefreshIcon,
    DocumentArrowDownIcon,
    PrinterIcon,
    ClockIcon,
    PhoneIcon,
    UserCircleIcon,
    BuildingOfficeIcon,
    XIcon,
    ChartBarIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { bookingService, OnlineBookingRecord, BookingSpeciality } from '../../../services/bookingService';
import { formatDate } from '../../../utils/formatters';
import { FormDateInput } from '../../../components/ui/forms';
import BookingPrintTemplate from '../components/BookingPrintTemplate';

const ReceptionReportView: React.FC = () => {
    const { fontSettings } = useTheme();

    // Data states
    const [bookings, setBookings] = useState<OnlineBookingRecord[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [deptFilter, setDeptFilter] = useState('All');
    const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7)); // yyyy-mm
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [printBooking, setPrintBooking] = useState<OnlineBookingRecord | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Chuẩn bị tham số gửi xuống API
            const params: any = {
                search: searchTerm,
                status: statusFilter,
                speciality: deptFilter // Dùng deptFilter thay cho specialityFilter
            };

            if (fromDate && toDate) {
                params.fromDate = fromDate;
                params.toDate = toDate;
            } else if (monthFilter) {
                params.fromDate = `${monthFilter}-01`;
                // Lấy ngày cuối cùng của tháng chính xác
                const [year, month] = monthFilter.split('-').map(Number);
                const lastDay = new Date(year, month, 0).getDate();
                params.toDate = `${monthFilter}-${String(lastDay).padStart(2, '0')}`;
            }

            const [data, depts] = await Promise.all([
                bookingService.getBookingList({
                    ...params,
                    speciality: deptFilter // Backend dùng trường này để lọc qms_deptid
                }),
                bookingService.getDepartments()
            ]);
            setBookings(Array.isArray(data) ? data : []);
            setDepartments(Array.isArray(depts) ? depts : []);
        } catch (err) {
            console.error("Lỗi tải dữ liệu báo cáo", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Tự động tải lại khi các bộ lọc chính thay đổi
    useEffect(() => {
        loadData();
    }, [statusFilter, deptFilter, monthFilter, fromDate, toDate]);

    const handleExportExcel = () => {
        if (bookings.length === 0) return alert("Không có dữ liệu để xuất");

        const headers = ["STT", "Mã Hẹn", "Số hồ sơ", "Ngày Khám", "Giờ", "Họ và Tên", "Ngày Sinh", "Giới Tính", "SĐT", "Chuyên Khoa", "Lý Do", "Phòng khám", "Mã phòng", "STT khám", "Đối tượng", "Ưu tiên", "Nguồn", "Trạng Thái"];
        const rows = bookings.map((b, i) => [
            i + 1,
            b.id,
            b.docNo || '',
            b.bookingDate,
            b.bookingTime,
            b.patientName,
            b.birthDate,
            b.gender === 'M' ? 'Nam' : 'Nữ',
            `'${b.phone}`, // Fix cho Excel hiển thị số 0 ở đầu
            b.specialityName || b.deptId,
            (b.reason || '').replace(/,/g, ';'),
            b.roomName || 'Chưa phân phòng',
            b.roomId || '',
            b.receptNo || '',
            b.isInsurance ? 'Bảo hiểm' : 'Dịch vụ',
            b.isPriority ? 'Có' : 'Không',
            'Online',
            b.status === 'S' ? 'Đã duyệt' : b.status === 'C' ? 'Đã hủy' : 'Chờ duyệt'
        ]);

        const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `BaoCao_TiepNhan_Online_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'O': return 'text-orange-600 bg-orange-50 border-orange-100'; // Chờ duyệt
            case 'S': return 'text-green-600 bg-green-50 border-green-100';    // Đã duyệt
            case 'C': return 'text-red-600 bg-red-50 border-red-100';      // Đã hủy
            default: return 'text-blue-600 bg-blue-50 border-blue-100';
        }
    };

    const handlePrint = (booking: OnlineBookingRecord) => {
        setPrintBooking(booking);
        setTimeout(() => {
            window.print();
            setPrintBooking(null);
        }, 100);
    };

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in pb-10">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg">
                        <ChartBarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Báo cáo danh sách tiếp nhận</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Dữ liệu đăng ký khám trực tuyến</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        onClick={loadData}
                        className="flex-1 md:flex-none px-4 py-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-white transition"
                    >
                        <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition active:scale-95"
                    >
                        <DocumentArrowDownIcon className="w-4 h-4" />
                        Xuất Excel
                    </button>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="lg:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Lọc nhanh theo Tháng</label>
                    <input
                        type="month"
                        value={monthFilter}
                        onChange={e => {
                            setMonthFilter(e.target.value);
                            setFromDate('');
                            setToDate('');
                        }}
                        className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm font-bold ${fontSettings.controls}`}
                    />
                </div>
                <FormDateInput
                    label="Từ ngày"
                    labelClassName="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1"
                    value={fromDate}
                    onChange={e => {
                        setFromDate(e.target.value);
                        setMonthFilter('');
                    }}
                    className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm ${fontSettings.controls}`}
                />
                <FormDateInput
                    label="Đến ngày"
                    labelClassName="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1"
                    value={toDate}
                    onChange={e => {
                        setToDate(e.target.value);
                        setMonthFilter('');
                    }}
                    className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm ${fontSettings.controls}`}
                />
                <div className="lg:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Khoa / Phòng</label>
                    <select
                        value={deptFilter}
                        onChange={e => setDeptFilter(e.target.value)}
                        className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold ${fontSettings.controls}`}
                    >
                        <option value="All">Tất cả khoa</option>
                        {Array.isArray(departments) && departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
                <div className="lg:col-span-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Tìm kiếm tên/SĐT</label>
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Gõ và nhấn Enter..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && loadData()}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 ${fontSettings.controls}`}
                        />
                    </div>
                </div>
            </div>

            {/* Report Table */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="p-4 w-12 text-center">STT</th>
                                <th className="p-4">Số hồ sơ</th>
                                <th className="p-4">Ngày / Giờ</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4">Thông tin liên hệ</th>
                                <th className="p-4">Chuyên khoa / Lý do</th>
                                <th className="p-4">Phòng khám</th>
                                <th className="p-4 text-center">Đối tượng</th>
                                <th className="p-4 text-center">Nguồn</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Tác vụ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {isLoading ? (
                                <tr><td colSpan={11} className="p-10 text-center text-slate-400 italic font-bold">Đang tải dữ liệu...</td></tr>
                            ) : !Array.isArray(bookings) || bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="p-20 text-center flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3">
                                            <SearchIcon className="w-8 h-8 text-slate-300" />
                                        </div>
                                        <p className="text-slate-400 font-bold italic">Không có dữ liệu báo cáo trong khoảng thời gian này.</p>
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((b_item, idx) => (
                                    <tr key={b_item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-4 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                        <td className="p-4">
                                            <div className="font-mono text-indigo-600 font-bold text-xs">{b_item.docNo || '---'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700 dark:text-slate-200">{b_item.bookingDate ? formatDate(b_item.bookingDate.split('T')[0]) : '---'}</div>
                                            <div className="text-xs text-blue-600 font-black flex items-center gap-1 mt-0.5">
                                                <ClockIcon className="w-3 h-3" /> {b_item.bookingTime}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-black text-slate-800 dark:text-white uppercase text-sm">{b_item.patientName}</div>
                                            <div className="text-[10px] text-slate-500 font-bold mt-0.5">{b_item.gender === 'M' ? 'Nam' : 'Nữ'}, {b_item.birthDate ? formatDate(b_item.birthDate.split('T')[0]) : '---'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 dark:text-slate-300">
                                                <PhoneIcon className="w-3.5 h-3.5 text-slate-400" /> {b_item.phone}
                                            </div>
                                            {b_item.idCard && <div className="text-[10px] font-mono text-blue-500 mt-1 uppercase">Mã BN: {b_item.idCard}</div>}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 text-sm">
                                                <BuildingOfficeIcon className="w-3.5 h-3.5 text-indigo-500" /> {b_item.deptName || b_item.deptId}
                                            </div>
                                            <div className="text-[10px] text-indigo-400 font-black uppercase tracking-tight flex items-center gap-1 mt-0.5">
                                                <span>{b_item.specialityName}</span>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 italic line-clamp-1" title={b_item.reason}>{b_item.reason}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white text-sm">
                                                {b_item.roomName || 'Chưa phân phòng'}
                                            </div>
                                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                                <span className="font-mono">P.{b_item.roomId || '?'}</span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                <span>STT {b_item.receptNo || '?'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {b_item.isInsurance ? (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
                                                    BẢO HIỂM
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-300">
                                                    DỊCH VỤ
                                                </span>
                                            )}
                                            {b_item.isPriority && (
                                                <div className="mt-1">
                                                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400">
                                                        ƯU TIÊN
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="text-[10px] font-black uppercase text-slate-400 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                                                Online
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border shadow-sm ${getStatusStyle(b_item.status)}`}>
                                                {b_item.status === 'S' ? 'Đã duyệt' : b_item.status === 'C' ? 'Đã hủy' : 'Chờ duyệt'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg text-indigo-600 transition" title="Xem hồ sơ">
                                                    <UserCircleIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handlePrint(b_item)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 transition"
                                                    title="In phiếu"
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
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center text-[11px] font-black text-slate-500 uppercase tracking-widest shrink-0">
                    <div className="flex gap-6">
                        <span>Tổng kết: <strong className="text-slate-800 dark:text-white">{bookings.length} hồ sơ</strong></span>
                        <span className="text-green-600">Đã duyệt: {bookings.filter(d => d.status === 'S').length}</span>
                        <span className="text-orange-500">Chờ duyệt: {bookings.filter(d => d.status === 'O').length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-blue-500">Dữ liệu đồng bộ trực tuyến</span>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>

            {/* Print Template (ẩn, chỉ hiện khi in) */}
            {printBooking && <BookingPrintTemplate booking={printBooking} />}
        </div>
    );
};

export default ReceptionReportView;
