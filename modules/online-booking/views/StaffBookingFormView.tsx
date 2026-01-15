
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    SearchIcon, RefreshIcon, CheckCircleIcon, XIcon, ClockIcon, TrashIcon,
    CalendarPlusIcon, ChevronRightIcon, UserGroupIcon, BuildingOfficeIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotification } from '../../../contexts/NotificationContext';
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
    
    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Master Data
    const [specialities, setSpecialities] = useState<BookingSpeciality[]>([]);
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
        gender: 'Nam',
        identityCard: '',
        identityIssueDate: '',
        provinceId: '',
        wardId: '',
        addressDetail: '',
        specialityId: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        reason: '',
        isPriority: false
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const resetForm = useCallback(() => {
        setBookingData({
            patientId: '', name: '', phone: '', dob: '', gender: 'Nam',
            identityCard: '', identityIssueDate: '', provinceId: '', wardId: '',
            addressDetail: '', specialityId: '', date: new Date().toISOString().split('T')[0],
            time: '', reason: '', isPriority: false
        });
        setErrors({});
        setSearchQuery('');
    }, []);

    useEffect(() => {
        bookingService.getSpecialities().then(setSpecialities);
        bookingService.getProvinces().then(setProvinces);
    }, []);

    useEffect(() => {
        if (bookingData.provinceId) {
            bookingService.getWards(bookingData.provinceId).then(setWards);
        }
    }, [bookingData.provinceId]);

    useEffect(() => {
        if (bookingData.specialityId && bookingData.date) {
            setIsLoadingSlots(true);
            bookingService.getAvailableSlots(bookingData.specialityId, bookingData.date)
                .then(setAvailableSlots)
                .finally(() => setIsLoadingSlots(false));
        }
    }, [bookingData.specialityId, bookingData.date]);

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
                    addressDetail: result.address
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
        setBookingData(prev => ({ ...prev, [name]: name === 'name' ? val.toString().toUpperCase() : val }));
        if (errors[name]) setErrors(prev => { const n = {...prev}; delete n[name]; return n; });
    };

    const validateForm = () => {
        const n: Record<string, string> = {};
        if (!bookingData.name) n.name = "Bắt buộc";
        if (!bookingData.phone.match(/^\d{10}$/)) n.phone = "10 số";
        if (!bookingData.dob) n.dob = "Bắt buộc";
        if (!bookingData.identityCard) n.identityCard = "Bắt buộc";
        if (!bookingData.identityIssueDate) n.identityIssueDate = "Bắt buộc";
        if (!bookingData.provinceId) n.provinceId = "Bắt buộc";
        if (!bookingData.wardId) n.wardId = "Bắt buộc";
        if (!bookingData.specialityId) n.specialityId = "Bắt buộc";
        if (!bookingData.time) n.time = "Bắt buộc";

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
            const res = await bookingService.submitBooking(bookingData as any);
            if (res.success) {
                addNotification("Thành công", "Đã đặt lịch khám trực tuyến", "success", "/online-booking/management", true);
                resetForm();
            }
        } catch (error) {
            addNotification("Lỗi", "Không thể kết nối máy chủ", "error", undefined, true);
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
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="SĐT, Mã BN, CCCD..."
                                className="w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-teal-500 text-sm font-bold outline-none"
                            />
                        </div>
                        <button onClick={handleSearch} className="px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-black uppercase transition-all active:scale-95 shadow-md">
                            {isLoadingSearch ? <RefreshIcon className="w-5 h-5 animate-spin"/> : 'Tìm'}
                        </button>
                    </div>

                    <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-y-auto custom-scrollbar">
                         <h3 className="text-xs font-black text-slate-400 uppercase mb-5 flex items-center gap-2 tracking-[0.2em]">
                            <UserGroupIcon className="w-5 h-5 text-teal-600"/> 1. Thông tin hành chính
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
                            <BuildingOfficeIcon className="w-5 h-5 text-teal-600"/> 2. Chuyên khoa & Ngày
                        </h3>
                        <div className="space-y-10">
                            <div className={errors.specialityId ? 'ring-2 ring-red-100 rounded-2xl p-1' : ''}>
                                <SpecialitySelector 
                                    specialities={specialities} 
                                    selectedId={bookingData.specialityId} 
                                    onSelect={id => setBookingData({...bookingData, specialityId: id, time: ''})} 
                                />
                            </div>
                            <DateSelector 
                                daysCount={bookingConfig.maxDaysBefore}
                                selectedDate={bookingData.date} 
                                onSelect={date => setBookingData({...bookingData, date: date})} 
                            />
                        </div>
                    </div>
                </div>

                {/* CỘT 3: GIỜ & HOÀN TẤT (4 units) */}
                <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-hidden">
                    <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-y-auto custom-scrollbar flex flex-col">
                        <h3 className="text-xs font-black text-slate-400 uppercase mb-5 flex items-center gap-2 tracking-[0.2em]">
                            <ClockIcon className="w-5 h-5 text-orange-500"/> 3. Giờ khám & Lý do
                        </h3>
                        
                        <div className="flex-1 space-y-6">
                            <div className={`transition-all ${!bookingData.specialityId ? 'opacity-20 pointer-events-none' : ''}`}>
                                <div className={`grid grid-cols-3 gap-2.5 ${errors.time ? 'ring-2 ring-red-100 rounded-2xl p-1' : ''}`}>
                                    {availableSlots.map(s => (
                                        <button 
                                            key={s.time}
                                            disabled={s.isFull}
                                            onClick={() => setBookingData({...bookingData, time: s.time})}
                                            className={`p-3 rounded-xl border-2 text-sm font-black transition-all ${s.isFull ? 'opacity-30 cursor-not-allowed bg-slate-100' : bookingData.time === s.time ? 'border-orange-500 bg-orange-600 text-white shadow-xl scale-105 ring-4 ring-orange-100' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-200'}`}
                                        >
                                            {s.time}
                                            <div className="text-[9px] font-normal opacity-70 mt-0.5 uppercase tracking-tighter">Còn {s.maxQuota - s.currentCount}</div>
                                        </button>
                                    ))}
                                </div>
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
                        </div>

                        {/* NÚT HOÀN TẤT LỚN CỐ ĐỊNH Ở DƯỚI CÙNG CỦA CỘT 3 */}
                        <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-3 shrink-0">
                            <button 
                                onClick={handleBooking} 
                                disabled={isSubmitting} 
                                className="w-full py-5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black shadow-2xl shadow-teal-500/40 transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 uppercase text-sm tracking-[0.2em]"
                            >
                                {isSubmitting ? <RefreshIcon className="w-6 h-6 animate-spin"/> : <CheckCircleIcon className="w-6 h-6"/>}
                                HOÀN TẤT ĐẶT LỊCH (F9)
                            </button>
                            <button onClick={resetForm} className="w-full py-2 text-slate-400 font-bold hover:text-red-600 transition-colors uppercase text-[10px] tracking-widest flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100">
                                <TrashIcon className="w-4 h-4"/> Hủy & Nhập mới từ đầu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffBookingFormView;
