
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    SearchIcon, RefreshIcon, CheckCircleIcon, XIcon, ClockIcon, TrashIcon,
    CalendarPlusIcon, ChevronRightIcon, UserGroupIcon, BuildingOfficeIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useSession } from '../../../contexts/SessionContext';
import { bookingService, BookingSpeciality, BookingSlot, LocationItem } from '../../../services/bookingService';
import { receptionService } from '../../../services/receptionService';

// Sub-components
import SpecialitySelector from '../components/SpecialitySelector';
import DateSelector from '../components/DateSelector';
import PatientInfoForm from '../components/PatientInfoForm';

const StaffBookingFormView: React.FC = () => {
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    const { fontSettings } = useTheme();
    const { userInfo } = useSession();

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<'morning' | 'afternoon'>('morning');

    // Master Data
    const [specialities, setSpecialities] = useState<BookingSpeciality[]>([]);
    const [rooms, setRooms] = useState<any[]>([]);
    const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
    const [provinces, setProvinces] = useState<LocationItem[]>([]);
    const [wards, setWards] = useState<LocationItem[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    // Cấu hình hệ thống (Giả lập lấy từ Setting)
    const bookingConfig = {
        maxDaysBefore: 14 // Cho phép đặt trước 14 ngày
    };

    // Form State
    const [bookingData, setBookingData] = useState({
        patientId: '',
        name: '',
        phone: '',
        dob: '',
        gender: 'M' as 'M' | 'F',
        identityCard: '',
        identityIssueDate: '',
        provinceId: '',
        wardId: '',
        addressDetail: '',
        specialityId: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        reason: '',
        isPriority: false,
        isInsurance: false
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const resetForm = useCallback(() => {
        setBookingData({
            patientId: '', name: '', phone: '', dob: '', gender: 'M',
            identityCard: '', identityIssueDate: '', provinceId: '', wardId: '',
            addressDetail: '', specialityId: '', date: new Date().toISOString().split('T')[0],
            time: '', reason: '', isPriority: false, isInsurance: false
        });
        setErrors({});
        setSearchQuery('');
        setRooms([]);
        setAvailableSlots([]);
    }, []);

    useEffect(() => {
        // Load specialties filtered by user's department
        const userDeptId = userInfo?.deptId;
        bookingService.getSpecialities(userDeptId).then(setSpecialities);
        bookingService.getProvinces().then(setProvinces);
    }, [userInfo]);

    useEffect(() => {
        if (bookingData.provinceId) {
            // Note: wardId is optional, so empty wards list is acceptable
            bookingService.getWards(bookingData.provinceId).then(setWards).catch(() => setWards([]));
        }
    }, [bookingData.provinceId]);

    // Load slots when speciality and date change (NO ROOM SELECTION NEEDED)
    useEffect(() => {
        if (bookingData.specialityId && bookingData.date) {
            setIsLoadingSlots(true);
            const deptId = userInfo?.deptId || 'KB';
            bookingService.getAvailableSlots(deptId, bookingData.specialityId, bookingData.date)
                .then(data => {
                    setAvailableSlots(data);
                })
                .catch(err => {
                    console.error('Error loading slots:', err);
                    setAvailableSlots([]);
                })
                .finally(() => setIsLoadingSlots(false));
        } else {
            setAvailableSlots([]);
        }
    }, [bookingData.specialityId, bookingData.date, userInfo]);

    // Auto-select period based on available slots when they change
    useEffect(() => {
        if (availableSlots.length > 0) {
            if (bookingData.time) {
                setSelectedPeriod(bookingData.time < '12:00' ? 'morning' : 'afternoon');
            } else {
                const hasMorning = availableSlots.some(s => s.time < '12:00');
                setSelectedPeriod(hasMorning ? 'morning' : 'afternoon');
            }
        }
    }, [availableSlots]);
    // Duplicate CCCD Check & Auto-fill
    useEffect(() => {
        const checkDuplicateCCCD = async () => {
            if (bookingData.identityCard.length === 12 && !bookingData.patientId) {
                try {
                    const result = await receptionService.getPatientByRecordNumber(bookingData.identityCard);
                    if (result) {
                        setBookingData(prev => ({
                            ...prev,
                            patientId: result.id,
                            name: result.name,
                            phone: result.phone || prev.phone,
                            dob: result.dob,
                            gender: result.gender,
                            addressDetail: result.address || prev.addressDetail,
                            provinceId: result.provinceId?.toString() || prev.provinceId,
                            wardId: result.wardId?.toString() || prev.wardId
                        }));
                        addNotification("CCCD đã tồn tại", `Bệnh nhân: ${result.name} đã có trên hệ thống HIS. Thông tin đã được tự động điền.`, "info", undefined, true);
                    }
                } catch (error) {
                    console.error('Error checking duplicate CCCD:', error);
                }
            }
        };

        checkDuplicateCCCD();
    }, [bookingData.identityCard, bookingData.patientId, addNotification]);

    // Duplicate Phone Check & Auto-fill
    useEffect(() => {
        const checkDuplicatePhone = async () => {
            if (bookingData.phone.length === 10 && !bookingData.patientId) {
                try {
                    const result = await receptionService.getPatientByRecordNumber(bookingData.phone);
                    if (result) {
                        setBookingData(prev => ({
                            ...prev,
                            patientId: result.id,
                            name: result.name,
                            phone: result.phone || prev.phone,
                            dob: result.dob,
                            gender: result.gender,
                            addressDetail: result.address || prev.addressDetail,
                            provinceId: result.provinceId?.toString() || prev.provinceId,
                            wardId: result.wardId?.toString() || prev.wardId,
                            identityCard: result.identityCard || prev.identityCard
                        }));
                        addNotification("SĐT đã tồn tại", `Bệnh nhân: ${result.name} đã có trên hệ thống HIS. Thông tin đã được tự động điền.`, "info", undefined, true);
                    }
                } catch (error) {
                    console.error('Error checking duplicate phone:', error);
                }
            }
        };

        checkDuplicatePhone();
    }, [bookingData.phone, bookingData.patientId, addNotification]);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsLoadingSearch(true);
        try {
            const result = await receptionService.getPatientByRecordNumber(searchQuery);
            if (result) {
                setBookingData(prev => ({
                    ...prev,
                    patientId: result.id,
                    name: result.name,
                    phone: result.phone || '',
                    dob: result.dob, // Sử dụng dd/mm/yyyy từ mock/api
                    gender: result.gender,
                    identityCard: result.identityCard || '',
                    addressDetail: result.address,
                    provinceId: result.provinceId?.toString() || prev.provinceId,
                    wardId: result.wardId?.toString() || prev.wardId
                }));
                addNotification("Tìm thấy hồ sơ", `BN: ${result.name}`, "success", undefined, true);
            } else {
                addNotification("Thông báo", "Bệnh nhân mới", "info", undefined, true);
                setBookingData(prev => ({ ...prev, name: '', phone: searchQuery.match(/^\d{10}$/) ? searchQuery : prev.phone }));
            }
        } finally {
            setIsLoadingSearch(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setBookingData(prev => ({ ...prev, [name]: val }));

        // Realtime validation
        const newErrors = { ...errors };

        if (name === 'phone') {
            if (value && !value.match(/^\d{10}$/)) {
                newErrors.phone = value.length < 10 ? `Thiếu ${10 - value.length} số` : 'Chỉ được 10 số';
            } else {
                delete newErrors.phone;
            }
        }

        if (name === 'identityCard') {
            if (value && !value.match(/^\d{12}$/)) {
                newErrors.identityCard = value.length < 12 ? `Thiếu ${12 - value.length} số` : 'Chỉ được 12 số';
            } else {
                delete newErrors.identityCard;
            }
        }

        // Clear other errors when field is filled
        if (value && errors[name]) {
            delete newErrors[name];
        }

        setErrors(newErrors);
    };

    const validateForm = () => {
        const n: Record<string, string> = {};
        if (!bookingData.name) n.name = "Bắt buộc";
        if (!bookingData.phone.match(/^\d{10}$/)) n.phone = bookingData.phone ? "Phải đúng 10 số" : "Bắt buộc";
        if (!bookingData.dob) n.dob = "Bắt buộc";
        if (!bookingData.identityCard.match(/^\d{12}$/)) n.identityCard = bookingData.identityCard ? "Phải đúng 12 số" : "Bắt buộc";
        // identityIssueDate is optional - removed from validation
        if (!bookingData.provinceId) n.provinceId = "Bắt buộc";
        // wardId is optional - removed from validation
        if (!bookingData.specialityId) n.specialityId = "Bắt buộc";
        if (!bookingData.time) n.time = "Bắt buộc";

        console.log('Validation errors:', n);
        console.log('Booking data:', bookingData);

        setErrors(n);
        if (Object.keys(n).length > 0) {
            addNotification("Lỗi nhập liệu", "Vui lòng hoàn thành các trường bắt buộc (*)", "warning", undefined, true);
            return false;
        }
        return true;
    };

    const handleBooking = async () => {
        if (!validateForm()) return;
        setIsSubmitting(true);
        try {
            // Convert DD/MM/YYYY to YYYY-MM-DD
            const convertDate = (dateStr: string) => {
                if (!dateStr) return '';
                const parts = dateStr.split('/');
                if (parts.length !== 3) return dateStr;
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            };

            const res = await bookingService.registerBooking({
                idCard: bookingData.identityCard,
                name: bookingData.name.normalize('NFC').toLocaleUpperCase('vi-VN'),
                birthDate: convertDate(bookingData.dob),
                gender: bookingData.gender,
                provinceId: bookingData.provinceId ? parseInt(bookingData.provinceId) : undefined,
                wardId: bookingData.wardId ? parseInt(bookingData.wardId) : undefined,
                address: bookingData.addressDetail,
                phone: bookingData.phone,
                deptId: bookingData.specialityId,
                bookingDate: bookingData.date,
                bookingTime: bookingData.time,
                reason: bookingData.reason,
                idCardIssuedDate: convertDate(bookingData.identityIssueDate),
                isPriority: bookingData.isPriority,
                isInsurance: bookingData.isInsurance,
                doctor: userInfo?.deptId // Using userDeptId as an additional indicator if needed, or just relying on backend mapping
            });

            console.log('✅ Converted birthDate:', convertDate(bookingData.dob));
            if (res.success) {
                addNotification("Thành công", `Đã đặt lịch khám. Mã: ${res.bookingId}`, "success", "/online-booking/management", true);
                resetForm();
            }
        } catch (error: any) {
            addNotification("Lỗi", error.message || "Không thể đăng ký", "error", undefined, true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col gap-4 animate-fade-in overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-full">

                {/* CỘT 1: HÀNH CHÍNH (4 units) */}
                <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 flex gap-2">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="SĐT, Mã BN, CCCD..."
                                autoComplete="new-password"
                                className="w-full h-11 pl-10 pr-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={isLoadingSearch}
                            className="px-6 h-11 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                        >
                            {isLoadingSearch ? <RefreshIcon className="w-5 h-5 animate-spin" /> : 'Tìm'}
                        </button>
                    </div>

                    <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-y-auto custom-scrollbar">
                        <h3 className="text-xs font-black text-slate-400 uppercase mb-5 flex items-center gap-2 tracking-[0.2em]">
                            <UserGroupIcon className="w-5 h-5 text-teal-600" /> 1. Thông tin hành chính
                        </h3>
                        <PatientInfoForm
                            data={bookingData}
                            errors={errors}
                            onChange={handleInputChange}
                            provinces={provinces}
                            wards={wards}
                        />
                    </div>
                </div>

                {/* CỘT 2: KHOA & NGÀY (4 units) */}
                <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
                    <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-y-auto custom-scrollbar">
                        <h3 className="text-xs font-black text-slate-400 uppercase mb-5 flex items-center gap-2 tracking-[0.2em]">
                            <BuildingOfficeIcon className="w-5 h-5 text-teal-600" /> 2. Chuyên khoa & Ngày
                        </h3>
                        <div className="space-y-6">
                            <div className={errors.specialityId ? 'ring-2 ring-red-100 rounded-2xl p-1' : ''}>
                                <SpecialitySelector
                                    specialities={specialities}
                                    selectedId={bookingData.specialityId}
                                    onSelect={id => setBookingData({ ...bookingData, specialityId: id, roomId: 0, time: '' })}
                                />
                            </div>

                            {/* Room Selector */}
                            {/* DATE SELECTOR */}
                            <div className={errors.date ? 'ring-2 ring-red-100 rounded-2xl p-1' : ''}>
                                <DateSelector
                                    selectedDate={bookingData.date}
                                    onSelect={date => setBookingData({ ...bookingData, date, time: '' })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CỘT 3: GIỜ & HOÀN TẤT (4 units) */}
                <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
                    <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-y-auto custom-scrollbar flex flex-col">
                        <h3 className="text-xs font-black text-slate-400 uppercase mb-5 flex items-center gap-2 tracking-[0.2em]">
                            <ClockIcon className="w-5 h-5 text-orange-500" /> 3. Giờ khám & Lý do
                        </h3>

                        <div className="flex-1 space-y-6">
                            <div>
                                {isLoadingSlots ? (
                                    <div className="text-center py-8 text-slate-400">Đang tải slots...</div>
                                ) : !bookingData.specialityId || !bookingData.date ? (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        Vui lòng chọn chuyên khoa và ngày khám
                                    </div>
                                ) : availableSlots.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        Không có slot khả dụng cho ngày này
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex bg-slate-150 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPeriod('morning')}
                                                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                                                    selectedPeriod === 'morning'
                                                        ? 'bg-teal-600 text-white shadow-md'
                                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                            >
                                                ☀️ Sáng ({availableSlots.filter(s => s.time < '12:00').length})
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedPeriod('afternoon')}
                                                className={`flex-1 py-2 text-xs font-black rounded-lg transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                                                    selectedPeriod === 'afternoon'
                                                        ? 'bg-teal-600 text-white shadow-md'
                                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                                }`}
                                            >
                                                🌙 Chiều ({availableSlots.filter(s => s.time >= '12:00').length})
                                            </button>
                                        </div>

                                        {availableSlots.filter(s => selectedPeriod === 'morning' ? s.time < '12:00' : s.time >= '12:00').length === 0 ? (
                                            <div className="text-center py-6 text-slate-400 text-sm italic">
                                                Không có khung giờ khả dụng cho buổi {selectedPeriod === 'morning' ? 'sáng' : 'chiều'}
                                            </div>
                                        ) : (
                                            <div className={`grid grid-cols-3 gap-2.5 ${errors.time ? 'ring-2 ring-red-100 rounded-2xl p-1' : ''}`}>
                                                {availableSlots
                                                    .filter(s => selectedPeriod === 'morning' ? s.time < '12:00' : s.time >= '12:00')
                                                    .map(s => (
                                                        <button
                                                            key={s.time}
                                                            onClick={() => setBookingData({ ...bookingData, time: s.time })}
                                                            disabled={s.status === 'F'}
                                                            className={`p-3 rounded-xl border-2 text-sm font-black transition-all ${s.status === 'F'
                                                                ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed opacity-50'
                                                                : bookingData.time === s.time
                                                                    ? 'border-orange-500 bg-orange-600 text-white shadow-xl scale-105 ring-4 ring-orange-100'
                                                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-200 hover:scale-105'
                                                                }`}
                                                        >
                                                            {s.time}
                                                            <div className="text-[9px] font-normal opacity-70 mt-0.5 uppercase tracking-tighter">
                                                                {s.available}/{s.max}
                                                            </div>
                                                        </button>
                                                    ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase ml-1 tracking-widest">Lý do khám / Triệu chứng</label>
                                <textarea
                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] text-base h-32 focus:ring-2 focus:ring-teal-500 outline-none resize-none font-medium shadow-inner"
                                    placeholder="Ví dụ: Đau đầu, sốt nhẹ, tái khám..."
                                    name="reason"
                                    value={bookingData.reason}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900 flex items-center gap-3">
                                <input type="checkbox" id="priority" name="isPriority" checked={bookingData.isPriority} onChange={handleInputChange} className="w-5 h-5 rounded text-red-600 accent-red-600 cursor-pointer" />
                                <label htmlFor="priority" className="text-xs font-black text-red-700 dark:text-red-400 uppercase cursor-pointer tracking-tight">Đối tượng Ưu tiên (Cấp cứu/TE/Người già)</label>
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900 flex items-center gap-3">
                                <input type="checkbox" id="insurance" name="isInsurance" checked={bookingData.isInsurance} onChange={handleInputChange} className="w-5 h-5 rounded text-blue-600 accent-blue-600 cursor-pointer" />
                                <label htmlFor="insurance" className="text-xs font-black text-blue-700 dark:text-blue-400 uppercase cursor-pointer tracking-tight">Đối tượng Bảo hiểm (BHYT)</label>
                            </div>
                        </div>

                        {/* NÚT HOÀN TẤT LỚN CỐ ĐỊNH Ở DƯỚI CÙNG CỦA CỘT 3 */}
                        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-3 shrink-0">
                            <button
                                onClick={handleBooking}
                                disabled={isSubmitting}
                                className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black shadow-2xl shadow-teal-500/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 uppercase text-sm tracking-[0.2em]"
                            >
                                {isSubmitting ? <RefreshIcon className="w-6 h-6 animate-spin" /> : <CheckCircleIcon className="w-6 h-6" />}
                                HOÀN TẤT ĐẶT LỊCH (F9)
                            </button>
                            <button onClick={resetForm} className="w-full py-2 text-slate-400 font-bold hover:text-red-600 transition-colors uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100">
                                <TrashIcon className="w-4 h-4" /> Hủy & Nhập mới từ đầu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffBookingFormView;
