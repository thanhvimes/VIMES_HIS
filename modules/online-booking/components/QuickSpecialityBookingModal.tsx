import React, { useState, useEffect } from 'react';
import {
    XIcon, ClockIcon, CheckCircleIcon, RefreshIcon,
    BuildingOfficeIcon, CalendarIcon, UserCircleIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useSession } from '../../../contexts/SessionContext';
import { bookingService, OnlineBookingRecord, BookingSpeciality, BookingSlot } from '../../../services/bookingService';
import SpecialitySelector from './SpecialitySelector';
import DateSelector from './DateSelector';

interface QuickSpecialityBookingModalProps {
    booking: OnlineBookingRecord;
    onClose: () => void;
    onSuccess: () => void;
}

const QuickSpecialityBookingModal: React.FC<QuickSpecialityBookingModalProps> = ({ booking, onClose, onSuccess }) => {
    const { fontSettings } = useTheme();
    const { addNotification } = useNotification();
    const { userInfo } = useSession();

    // State
    const [specialities, setSpecialities] = useState<BookingSpeciality[]>([]);
    const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form
    const [selectedSpeciality, setSelectedSpeciality] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedTime, setSelectedTime] = useState('');
    const [reason, setReason] = useState('');

    // Load specialities
    useEffect(() => {
        const deptId = userInfo?.deptId;
        bookingService.getSpecialities(deptId).then(specs => {
            // Loại bỏ chuyên khoa mà bệnh nhân đã đăng ký
            const filtered = specs.filter(s => s.id !== booking.specialityCode);
            setSpecialities(filtered);
        });
    }, [userInfo, booking.specialityCode]);

    // Load slots khi chuyên khoa + ngày thay đổi
    useEffect(() => {
        if (selectedSpeciality && selectedDate) {
            setIsLoadingSlots(true);
            setSelectedTime('');
            const deptId = userInfo?.deptId || 'KB';
            bookingService.getAvailableSlots(deptId, selectedSpeciality, selectedDate)
                .then(setAvailableSlots)
                .catch(() => setAvailableSlots([]))
                .finally(() => setIsLoadingSlots(false));
        } else {
            setAvailableSlots([]);
        }
    }, [selectedSpeciality, selectedDate, userInfo]);

    const handleSubmit = async () => {
        if (!selectedSpeciality) {
            addNotification("Lỗi", "Vui lòng chọn chuyên khoa", "warning", undefined, true);
            return;
        }
        if (!selectedTime) {
            addNotification("Lỗi", "Vui lòng chọn giờ khám", "warning", undefined, true);
            return;
        }

        setIsSubmitting(true);
        try {
            // Chuyển birthDate sang YYYY-MM-DD nếu cần
            const convertDate = (dateStr: string) => {
                if (!dateStr) return '';
                if (dateStr.includes('/')) {
                    const parts = dateStr.split('/');
                    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                // Nếu đã là ISO hoặc YYYY-MM-DD
                return dateStr.split('T')[0];
            };

            const res = await bookingService.registerBooking({
                idCard: booking.idCard || '',
                name: booking.patientName,
                birthDate: convertDate(booking.birthDate),
                gender: booking.gender,
                provinceId: booking.provinceId,
                wardId: booking.wardId,
                address: booking.address,
                phone: booking.phone,
                deptId: selectedSpeciality,
                bookingDate: selectedDate,
                bookingTime: selectedTime,
                reason: reason || booking.reason,
                idCardIssuedDate: booking.idCardIssuedDate ? convertDate(booking.idCardIssuedDate) : undefined,
                isPriority: booking.isPriority,
                isInsurance: booking.isInsurance,
                doctor: userInfo?.deptId,
                email: booking.email,
                occupation: booking.occupation
            });

            if (res.success) {
                addNotification(
                    "Đăng ký thành công",
                    `Đã đăng ký thêm chuyên khoa cho BN ${booking.patientName}. Mã: ${res.bookingId}`,
                    "success", undefined, true
                );
                onSuccess();
                onClose();
            }
        } catch (error: any) {
            addNotification("Lỗi đăng ký", error.message || "Không thể đăng ký chuyên khoa mới", "error", undefined, true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedSpecialityName = specialities.find(s => s.id === selectedSpeciality)?.name || '';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in border border-slate-200 dark:border-slate-700">

                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-teal-600 to-teal-700 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <BuildingOfficeIcon className="w-5 h-5" />
                            Đăng ký thêm Chuyên khoa
                        </h2>
                        <p className="text-teal-100 text-xs font-medium mt-1">
                            Thêm lịch hẹn chuyên khoa khác cho bệnh nhân đã có trên hệ thống
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition">
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                    {/* Thông tin bệnh nhân (Chỉ đọc) */}
                    <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <UserCircleIcon className="w-4 h-4" /> Thông tin bệnh nhân (tự động điền)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase">Họ và tên</label>
                                <p className="text-sm font-black text-slate-800 dark:text-white uppercase mt-0.5">{booking.patientName}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase">Số điện thoại</label>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{booking.phone}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase">Ngày sinh / Giới tính</label>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                                    {booking.birthDate ? booking.birthDate.split('T')[0] : '---'} / {booking.gender === 'M' ? 'Nam' : 'Nữ'}
                                </p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase">CCCD</label>
                                <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">{booking.idCard || '---'}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase">CK đã đăng ký</label>
                                <p className="text-sm font-bold text-orange-600 mt-0.5">{booking.specialityName || booking.deptId}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase">Đối tượng</label>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                                    {booking.isInsurance ? '🏥 Bảo hiểm' : '💰 Dịch vụ'}
                                    {booking.isPriority && ' ⚡ Ưu tiên'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Chọn chuyên khoa mới */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <BuildingOfficeIcon className="w-4 h-4 text-teal-600" /> Chọn chuyên khoa mới
                        </h3>
                        <SpecialitySelector
                            specialities={specialities}
                            selectedId={selectedSpeciality}
                            onSelect={(id) => {
                                setSelectedSpeciality(id);
                                setSelectedTime('');
                            }}
                        />
                        {specialities.length === 0 && (
                            <p className="text-xs text-slate-400 italic mt-2">Đang tải danh sách chuyên khoa...</p>
                        )}
                    </div>

                    {/* Chọn ngày */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-blue-600" /> Chọn ngày khám
                        </h3>
                        <DateSelector
                            selectedDate={selectedDate}
                            onSelect={(date) => {
                                setSelectedDate(date);
                                setSelectedTime('');
                            }}
                        />
                    </div>

                    {/* Chọn giờ */}
                    <div>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <ClockIcon className="w-4 h-4 text-orange-500" /> Chọn giờ khám
                        </h3>
                        {isLoadingSlots ? (
                            <div className="text-center py-6 text-slate-400 flex items-center justify-center gap-2">
                                <RefreshIcon className="w-4 h-4 animate-spin" /> Đang tải khung giờ...
                            </div>
                        ) : !selectedSpeciality ? (
                            <div className="text-center py-6 text-slate-400 text-sm italic">
                                Vui lòng chọn chuyên khoa trước
                            </div>
                        ) : availableSlots.length === 0 ? (
                            <div className="text-center py-6 text-slate-400 text-sm italic">
                                Không có khung giờ khả dụng cho ngày này
                            </div>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                                {availableSlots.map(s => (
                                    <button
                                        key={s.time}
                                        onClick={() => setSelectedTime(s.time)}
                                        disabled={s.status === 'F'}
                                        className={`p-2.5 rounded-xl border-2 text-sm font-black transition-all ${s.status === 'F'
                                                ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                                                : selectedTime === s.time
                                                    ? 'border-teal-500 bg-teal-600 text-white shadow-xl scale-105 ring-4 ring-teal-100'
                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-200 hover:scale-105'
                                            }`}
                                    >
                                        {s.time}
                                        <div className="text-[9px] font-normal opacity-70 mt-0.5">
                                            {s.available}/{s.max}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Lý do khám */}
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                            Lý do khám / Triệu chứng (tùy chọn)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ví dụ: Tái khám, Đau đầu, Kiểm tra kết quả xét nghiệm..."
                            className={`w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm h-20 focus:ring-2 focus:ring-teal-500 outline-none resize-none ${fontSettings.controls}`}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                    <div className="text-xs text-slate-500">
                        {selectedSpecialityName && selectedTime && (
                            <span className="font-bold text-teal-600">
                                ✓ Đăng ký: <strong>{selectedSpecialityName}</strong> lúc <strong>{selectedTime}</strong> ngày <strong>{selectedDate}</strong>
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-300 transition"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !selectedSpeciality || !selectedTime}
                            className="px-8 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-sm uppercase shadow-lg shadow-teal-500/20 flex items-center gap-2 transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <><RefreshIcon className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                            ) : (
                                <><CheckCircleIcon className="w-4 h-4" /> Xác nhận đăng ký</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickSpecialityBookingModal;
