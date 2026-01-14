
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    SearchIcon, 
    UserPlusIcon, 
    CalendarIcon, 
    ClockIcon, 
    CheckCircleIcon,
    PhoneIcon,
    UserGroupIcon,
    IdentificationIcon,
    MapPinIcon,
    ExclamationCircleIcon,
    XIcon,
    RefreshIcon,
    // Add BuildingOfficeIcon to resolve the missing import error
    BuildingOfficeIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { receptionService } from '../../../services/receptionService';
import { bookingService, BookingSpeciality, BookingSlot } from '../../../services/bookingService';
import { Patient } from '../../../types';

const StaffBookingFormView: React.FC = () => {
    const navigate = useNavigate();
    const { fontSettings } = useTheme();
    const { addNotification } = useNotification();
    
    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Master Data
    const [specialities, setSpecialities] = useState<BookingSpeciality[]>([]);
    const [availableSlots, setAvailableSlots] = useState<BookingSlot[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    // Form State
    const [bookingData, setBookingData] = useState({
        patientId: '',
        name: '',
        phone: '',
        dob: '',
        gender: 'Nam',
        identityCard: '',
        province: '',
        district: '',
        ward: '',
        addressDetail: '',
        specialityId: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        reason: '',
        isPriority: false
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Define resetForm to resolve the missing function error
    const resetForm = () => {
        setBookingData({
            patientId: '',
            name: '',
            phone: '',
            dob: '',
            gender: 'Nam',
            identityCard: '',
            province: '',
            district: '',
            ward: '',
            addressDetail: '',
            specialityId: '',
            date: new Date().toISOString().split('T')[0],
            time: '',
            reason: '',
            isPriority: false
        });
        setErrors({});
        setSearchQuery('');
    };

    // 1. Initial Load: Chuyên khoa
    useEffect(() => {
        bookingService.getSpecialities().then(setSpecialities);
    }, []);

    // 2. Load Slots khi đổi Ngày hoặc Chuyên khoa
    useEffect(() => {
        if (bookingData.specialityId && bookingData.date) {
            setIsLoadingSlots(true);
            bookingService.getAvailableSlots(bookingData.specialityId, bookingData.date)
                .then(setAvailableSlots)
                .finally(() => setIsLoadingSlots(false));
        }
    }, [bookingData.specialityId, bookingData.date]);

    // 3. Tra cứu bệnh nhân
    const handleSearch = async () => {
        if (!searchQuery) return;
        setIsLoadingSearch(true);
        try {
            const result = await receptionService.getPatientByRecordNumber(searchQuery);
            if (result) {
                setBookingData(prev => ({
                    ...prev,
                    patientId: result.id,
                    name: result.name,
                    phone: result.phone || '',
                    dob: result.dob.includes('/') ? result.dob.split('/').reverse().join('-') : result.dob,
                    gender: result.gender,
                    identityCard: result.identityCard || '',
                    addressDetail: result.address
                }));
                addNotification("Đã tìm thấy hồ sơ", `Bệnh nhân: ${result.name}`, "success", undefined, true);
            } else {
                addNotification("Bệnh nhân mới", "Vui lòng nhập thông tin để tạo hồ sơ", "info", undefined, true);
                setBookingData(prev => ({ ...prev, patientId: '', name: '', phone: searchQuery.match(/^\d{10}$/) ? searchQuery : prev.phone }));
            }
        } finally {
            setIsLoadingSearch(false);
        }
    };

    // 4. Submit & Validation
    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!bookingData.name.trim()) newErrors.name = "Họ tên không được để trống";
        if (!bookingData.phone.match(/^\d{10}$/)) newErrors.phone = "SĐT phải là 10 chữ số";
        if (!bookingData.dob) newErrors.dob = "Chưa chọn ngày sinh";
        if (!bookingData.specialityId) newErrors.specialityId = "Vui lòng chọn chuyên khoa";
        if (!bookingData.time) newErrors.time = "Vui lòng chọn khung giờ";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleBooking = async () => {
        if (!validate()) return;
        
        setIsSubmitting(true);
        try {
            const res = await bookingService.submitBooking(bookingData);
            if (res.success) {
                addNotification("Đăng ký thành công", `Mã lịch hẹn: ${res.bookingId}`, "success", "/online-booking/management", true);
                navigate('/online-booking/management');
            }
        } catch (error) {
            addNotification("Lỗi", "Không thể gửi yêu cầu đăng ký", "error", undefined, true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBaseClass = "w-full p-3 border rounded-xl outline-none transition-all duration-200 focus:ring-2 focus:ring-teal-500 font-bold " + 
                          "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 " +
                          "text-slate-900 dark:text-white placeholder-slate-400 disabled:opacity-50";

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in pb-10">
            {/* Header / Search */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-center gap-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-teal-600 text-white rounded-2xl shadow-lg">
                        <UserPlusIcon className="w-7 h-7"/>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">Trung tâm Đăng ký khám</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1.5">Tiếp nhận hồ sơ trực tuyến & Call Center</p>
                    </div>
                </div>

                <div className="flex-1 max-w-2xl w-full flex gap-2">
                    <div className="relative flex-1">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                        <input 
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            placeholder="Tra cứu: SĐT, Mã BN hoặc CCCD..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500 text-base font-bold shadow-inner"
                        />
                        {isLoadingSearch && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <RefreshIcon className="w-5 h-5 animate-spin text-teal-600"/>
                            </div>
                        )}
                    </div>
                    <button onClick={handleSearch} className="px-8 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black text-sm uppercase shadow-lg shadow-teal-500/20 transition transform active:scale-95">Tìm kiếm</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* LEFT: ADMIN FORM */}
                <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                        <div className="flex justify-between items-center border-b dark:border-slate-700 pb-3">
                            <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2 uppercase text-sm tracking-wider">
                                <UserGroupIcon className="w-5 h-5 text-teal-500"/> Thông tin hành chính
                            </h3>
                            {bookingData.patientId && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">HS: {bookingData.patientId}</span>}
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Họ và tên bệnh nhân *</label>
                                <input 
                                    type="text" 
                                    value={bookingData.name} 
                                    onChange={e => setBookingData({...bookingData, name: e.target.value.toUpperCase()})} 
                                    className={`${inputBaseClass} ${errors.name ? 'border-red-500' : ''}`} 
                                    placeholder="NGUYỄN VĂN A" 
                                />
                                {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.name}</p>}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Ngày sinh *</label>
                                    <input type="date" value={bookingData.dob} onChange={e => setBookingData({...bookingData, dob: e.target.value})} className={`${inputBaseClass} ${errors.dob ? 'border-red-500' : ''}`} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Giới tính</label>
                                    <select value={bookingData.gender} onChange={e => setBookingData({...bookingData, gender: e.target.value})} className={inputBaseClass}>
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">Số điện thoại *</label>
                                <div className="relative">
                                    <PhoneIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/>
                                    <input type="tel" value={bookingData.phone} onChange={e => setBookingData({...bookingData, phone: e.target.value})} className={`${inputBaseClass} pl-9 ${errors.phone ? 'border-red-500' : ''}`} placeholder="09xxxxxxxx" />
                                </div>
                                {errors.phone && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.phone}</p>}
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1.5 ml-1">CCCD (12 số)</label>
                                <div className="relative">
                                    <IdentificationIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-400"/>
                                    <input type="text" value={bookingData.identityCard} onChange={e => setBookingData({...bookingData, identityCard: e.target.value.replace(/\D/g, '').slice(0,12)})} className={`${inputBaseClass} pl-9 font-mono tracking-widest`} placeholder="0010xxxxxxxx" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-dashed border-slate-200 dark:border-slate-700">
                                <label className="block text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase flex items-center gap-1.5">
                                    <MapPinIcon className="w-4 h-4"/> Địa chỉ liên hệ
                                </label>
                                <select className={inputBaseClass} value={bookingData.province} onChange={e => setBookingData({...bookingData, province: e.target.value})}>
                                    <option value="">-- Tỉnh / Thành phố --</option>
                                    <option>Thành phố Hà Nội</option>
                                    <option>Thành phố Hồ Chí Minh</option>
                                </select>
                                <input type="text" value={bookingData.addressDetail} onChange={e => setBookingData({...bookingData, addressDetail: e.target.value})} className={inputBaseClass} placeholder="Số nhà, tên đường..." />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: SCHEDULING PANEL */}
                <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {/* CHUYÊN KHOA */}
                            <section>
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3 border-b dark:border-slate-700 pb-3 mb-6 uppercase text-sm tracking-wider">
                                    <BuildingOfficeIcon className="w-5 h-5 text-teal-500"/> 1. Chọn dịch vụ khám
                                </h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-3">
                                        {specialities.map(s => (
                                            <button 
                                                key={s.id}
                                                onClick={() => setBookingData({...bookingData, specialityId: s.id, time: ''})}
                                                className={`p-4 text-xs font-bold border-2 rounded-2xl transition-all flex flex-col items-center justify-center gap-2 ${
                                                    bookingData.specialityId === s.id 
                                                    ? 'bg-teal-600 text-white border-teal-600 shadow-xl shadow-teal-500/20 scale-105' 
                                                    : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-600 dark:text-slate-400 hover:border-teal-200'
                                                }`}
                                            >
                                                {s.name}
                                                <div className="text-[8px] opacity-70 uppercase tracking-widest">Định mức: {s.quotaPerSlot}</div>
                                            </button>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1">Ngày hẹn dự kiến</label>
                                        <input type="date" value={bookingData.date} onChange={e => setBookingData({...bookingData, date: e.target.value})} className={`${inputBaseClass} py-4 text-lg`} />
                                    </div>
                                </div>
                            </section>

                            {/* GIỜ KHÁM & TRIỆU CHỨNG */}
                            <section className="space-y-6">
                                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-3 border-b dark:border-slate-700 pb-3 mb-6 uppercase text-sm tracking-wider">
                                    <ClockIcon className="w-5 h-5 text-orange-500"/> 2. Thời gian & Lý do
                                </h3>
                                
                                <div className={`transition-opacity ${!bookingData.specialityId ? 'opacity-30 pointer-events-none' : ''}`}>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 ml-1 tracking-widest">Khung giờ còn trống</label>
                                    {isLoadingSlots ? (
                                        <div className="flex items-center gap-2 py-4 justify-center text-slate-400"><RefreshIcon className="w-5 h-5 animate-spin"/> Đang tải định mức...</div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {availableSlots.map(s => (
                                                <button 
                                                    key={s.time}
                                                    disabled={s.isFull}
                                                    onClick={() => setBookingData({...bookingData, time: s.time})}
                                                    className={`p-3 text-xs font-bold border-2 rounded-xl transition-all flex flex-col items-center ${
                                                        s.isFull 
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 border-transparent cursor-not-allowed opacity-50' 
                                                        : bookingData.time === s.time 
                                                            ? 'bg-orange-500 text-white border-orange-500 shadow-lg scale-110' 
                                                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-400'
                                                    }`}
                                                >
                                                    {s.time}
                                                    {s.isFull && <span className="text-[8px] mt-0.5 text-red-500 uppercase">Hết chỗ</span>}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {errors.time && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">{errors.time}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-1 tracking-widest">Lý do khám / Triệu chứng</label>
                                    <textarea 
                                        rows={4}
                                        value={bookingData.reason}
                                        onChange={e => setBookingData({...bookingData, reason: e.target.value})}
                                        className={`${inputBaseClass} resize-none font-medium text-sm p-4 h-32 leading-relaxed`}
                                        placeholder="VD: Đau dạ dày âm ỉ kéo dài 3 ngày..."
                                    />
                                </div>

                                <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/50 flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        id="isPriority"
                                        checked={bookingData.isPriority}
                                        onChange={e => setBookingData({...bookingData, isPriority: e.target.checked})}
                                        className="w-6 h-6 text-rose-600 rounded-lg cursor-pointer" 
                                    />
                                    <label htmlFor="isPriority" className="text-xs font-black text-rose-700 dark:text-rose-400 cursor-pointer uppercase tracking-tight">Đối tượng ưu tiên (TE/Người già/Khuyết tật)</label>
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Bottom Action Bar */}
                    <div className="bg-white dark:bg-slate-800 p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4 sticky bottom-0 z-10 shadow-[0_-15px_40px_rgba(0,0,0,0.08)] rounded-t-[2.5rem]">
                         <button 
                            onClick={() => window.confirm("Hủy bỏ dữ liệu đang nhập?") && resetForm()} 
                            className="px-8 py-3 font-bold text-slate-400 hover:text-red-500 transition uppercase text-xs tracking-[0.2em]"
                        >
                            Hủy bỏ
                        </button>
                         <button 
                            onClick={handleBooking} 
                            disabled={isSubmitting}
                            className="px-16 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black shadow-2xl shadow-teal-600/30 transition-all transform active:scale-95 flex items-center gap-3 uppercase text-sm tracking-widest disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <RefreshIcon className="w-5 h-5 animate-spin"/>
                            ) : (
                                <CheckCircleIcon className="w-6 h-6"/>
                            )}
                            Hoàn tất & Đặt lịch (F9)
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffBookingFormView;
