import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingService } from '../../../services/bookingService';
import { BookingSpeciality as Speciality, BookingSlot as TimeSlot } from '../../../services/bookingService';
import { CheckCircleIcon, ChevronRightIcon } from '../../../components/Icons';

const getLocalDateString = (date: Date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
};

// --- FIX: Define interface for DateCard props to ensure strict typing ---
interface DateCardProps {
    date: Date;
    isSelected: boolean;
    isToday: boolean;
    onClick: () => void;
}

// --- FIX: Use React.FC to properly handle React internal attributes like 'key' when used in lists ---
// Component thẻ ngày đơn lẻ
const DateCard: React.FC<DateCardProps> = ({ date, isSelected, isToday, onClick }) => {
    const dayNames = ['CN', 'TH 2', 'TH 3', 'TH 4', 'TH 5', 'TH 6', 'TH 7'];
    const dayName = dayNames[date.getDay()];
    const dayNumber = date.getDate();
    const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;

    return (
        <button
            onClick={onClick}
            type="button"
            className={`relative flex flex-col items-center justify-center min-w-[110px] h-28 rounded-2xl border-2 transition-all duration-300 shrink-0 select-none ${isSelected
                ? 'border-teal-500 bg-teal-50/20 ring-4 ring-teal-50 shadow-md'
                : 'border-slate-100 bg-white hover:border-teal-200 text-slate-500 shadow-sm'
                }`}
        >
            {isToday && (
                <span className="absolute -top-1 -right-1 bg-[#ff4d4f] text-white text-[9px] font-black px-2 py-0.5 rounded-tr-xl rounded-bl-lg shadow-sm z-10 animate-fade-in uppercase">
                    Hôm nay
                </span>
            )}

            <span className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`}>
                {dayName}
            </span>

            <span className={`text-4xl font-black leading-none mb-2 ${isSelected ? 'text-teal-700' : 'text-slate-700'}`}>
                {dayNumber}
            </span>

            <span className={`text-[10px] font-bold ${isSelected ? 'text-teal-500' : 'text-slate-400'}`}>
                {monthYear}
            </span>
        </button>
    );
};

const BookingView: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);
    const [bookingId, setBookingId] = useState('');

    // Data Lists
    const [departments, setDepartments] = useState<any[]>([]); // TODO: Type this properly
    const [specialities, setSpecialities] = useState<Speciality[]>([]);
    const [slots, setSlots] = useState<TimeSlot[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        deptId: '',
        deptName: '',
        specialityCode: '', // Was specialityId
        specialityName: '',
        date: getLocalDateString(new Date()),
        time: '',
        reason: ''
    });

    // 1. Fetch Departments on Mount
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const data = await bookingService.getDepartments();
                setDepartments(data);

                // Auto-select if only 1 department
                if (data.length === 1) {
                    setFormData(prev => ({
                        ...prev,
                        deptId: data[0].id.toString(),
                        deptName: data[0].name
                    }));
                }
            } catch (error) {
                console.error('Failed to fetch departments:', error);
            }
        };
        fetchDepartments();
    }, []);

    // 2. Fetch Specialities when Dept changes
    useEffect(() => {
        if (formData.deptId) {
            const fetchSpecialities = async () => {
                try {
                    const data = await bookingService.getSpecialities(formData.deptId);
                    setSpecialities(data);

                    // Re-register logic: if we have dept & diagnosis, try to match?
                    // Note: Re-register usually passes 'dept' name. We might need logic here.
                } catch (error) {
                    console.error('Failed to fetch specialities:', error);
                }
            };
            fetchSpecialities();
        } else {
            setSpecialities([]);
        }
    }, [formData.deptId]);

    // 3. Fetch Slots when Spec & Date change
    useEffect(() => {
        if (formData.deptId && formData.specialityCode && formData.date) {
            const fetchSlots = async () => {
                try {
                    // Pass deptId AND specialityCode
                    const data = await bookingService.getAvailableSlots(
                        formData.deptId,
                        formData.specialityCode,
                        formData.date
                    );
                    setSlots(data);
                } catch (error) {
                    console.error('Failed to fetch slots:', error);
                }
            };
            fetchSlots();
        }
    }, [formData.deptId, formData.specialityCode, formData.date]);

    // Handle Re-register (Location State)
    useEffect(() => {
        if (location.state?.reRegister && location.state.dept && specialities.length > 0) {
            // This logic is tricky now because we need Dept first.
            // Assuming simplified re-register for now or it matches specialty name
            const match = specialities.find(s => s.name === location.state.dept || s.id === location.state.dept);
            if (match) {
                setFormData(prev => ({
                    ...prev,
                    specialityCode: match.id,
                    specialityName: match.name,
                    reason: `Tái khám: ${location.state.diagnosis || ''}`
                }));
            }
        }
    }, [location.state, specialities]);


    // --- FIX: Added explicit type Date[] to availableDates to avoid inference issues with any[] ---
    // Tạo danh sách 14 ngày tới
    const availableDates = useMemo(() => {
        const dates: Date[] = [];
        const now = new Date();
        for (let i = 0; i < 14; i++) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
            dates.push(d);
        }
        return dates;
    }, []);

    const handleNext = async () => {
        if (step === 2) {
            setIsSubmitting(true);
            try {
                const patient = JSON.parse(localStorage.getItem('portal_patient') || '{}');
                const response = await bookingService.registerBooking({
                    name: patient.name,
                    birthDate: patient.birthDate || '2000-01-01',
                    gender: patient.gender || 'M',
                    phone: localStorage.getItem('portal_phone') || '',
                    deptId: formData.deptId, // Passes Department ID (e.g., 'KB')
                    specialityCode: formData.specialityCode, // Passes Specialty Code
                    bookingDate: formData.date,
                    bookingTime: formData.time,
                    reason: formData.reason
                });

                if (response.success) {
                    setBookingId(response.bookingId.toString());
                    setStep(3);
                }
            } catch (error) {
                console.error('Booking failed:', error);
                alert('Đăng ký không thành công. Vui lòng thử lại sau.');
            } finally {
                setIsSubmitting(false);
            }
        } else {
            setStep(step + 1);
        }
    };

    const handleReset = () => {
        setStep(1);
        setBookingId('');
        // Reset to initial, keeping auto-selected dept if single
        if (departments.length === 1) {
            setFormData({
                deptId: departments[0].id,
                deptName: departments[0].name,
                specialityCode: '', specialityName: '', date: getLocalDateString(new Date()), time: '', reason: ''
            });
        } else {
            setFormData({
                deptId: '', deptName: '',
                specialityCode: '', specialityName: '', date: getLocalDateString(new Date()), time: '', reason: ''
            });
        }
    }

    if (step === 3) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto animate-fade-in">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircleIcon className="w-14 h-14" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Đăng ký thành công!</h2>
                <p className="text-slate-500 mb-8 text-lg">Mã đặt lịch của bạn là <span className="font-black text-teal-600 text-2xl block mt-2">#{bookingId}</span></p>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full mb-8 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p><strong className="text-slate-400 uppercase text-[10px] block mb-1">Khoa:</strong> <span className="text-slate-800 font-bold">{formData.deptName}</span></p>
                        <p><strong className="text-slate-400 uppercase text-[10px] block mb-1">Chuyên khoa:</strong> <span className="text-slate-800 font-bold">{formData.specialityName}</span></p>
                        <p><strong className="text-slate-400 uppercase text-[10px] block mb-1">Thời gian dự kiến:</strong> <span className="text-teal-600 font-bold">{formData.time} - {formData.date ? new Date(formData.date).toLocaleDateString('vi-VN') : ''}</span></p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs text-slate-400 italic">Ghi chú: Vui lòng mang theo CCCD và thẻ BHYT đến trước 15 phút tại Quầy số 1 để làm thủ tục.</p>
                    </div>
                </div>

                <button onClick={handleReset} className="w-full md:w-auto px-10 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black shadow-xl shadow-teal-500/30 transition-all transform active:scale-95">VỀ TRANG CHỦ</button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 h-full flex flex-col md:flex-row gap-8 bg-slate-50/50">
            {/* Left: Progress & Summary */}
            <div className="md:w-1/3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shrink-0 h-fit md:sticky md:top-24">
                <h2 className="text-xl font-bold text-slate-800 mb-8 hidden md:block">Tiến trình đăng ký</h2>

                <div className="flex md:flex-col items-center md:items-start mb-8 px-4 md:px-0 gap-4 relative">
                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100 hidden md:block -z-10"></div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors shadow-sm ${step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                        <div className="hidden md:block">
                            <p className={`font-bold text-sm ${step >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>Thông tin khám</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold opacity-60">Bước 1</p>
                        </div>
                    </div>

                    <div className={`flex-1 h-0.5 mx-2 md:hidden ${step >= 2 ? 'bg-teal-600' : 'bg-slate-200'}`}></div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:mt-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors shadow-sm ${step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                        <div className="hidden md:block">
                            <p className={`font-bold text-sm ${step >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>Thời gian & Lý do</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold opacity-60">Bước 2</p>
                        </div>
                    </div>

                    <div className={`flex-1 h-0.5 mx-2 md:hidden ${step >= 3 ? 'bg-teal-600' : 'bg-slate-200'}`}></div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:mt-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors shadow-sm ${step >= 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
                        <div className="hidden md:block">
                            <p className={`font-bold text-sm ${step >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>Hoàn tất</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold opacity-60">Bước cuối</p>
                        </div>
                    </div>
                </div>

                <div className="hidden md:block bg-teal-50/30 p-5 rounded-2xl border border-teal-100 shadow-inner mt-4 animate-fade-in">
                    <h4 className="font-black text-[10px] mb-4 uppercase text-teal-600 tracking-[0.2em]">Tóm tắt lịch hẹn</h4>
                    <div className="space-y-3">
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Khoa</span>
                            <span className="font-bold text-slate-800">{formData.deptName || '---'}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Chuyên khoa</span>
                            <span className="font-bold text-slate-800">{formData.specialityName || '---'}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Thời gian</span>
                            <span className="font-bold text-teal-700">
                                {formData.date ? new Date(formData.date).toLocaleDateString('vi-VN') : '---'}
                                {formData.time ? ` lúc ${formData.time}` : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Form Content */}
            <div className="flex-1 flex flex-col max-w-full overflow-hidden">
                <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar pr-2">
                    {step === 1 && (
                        <div className="space-y-10 animate-fade-in">
                            {/* Department Selection (Show only if > 1 dept) */}
                            {departments.length > 1 && (
                                <section>
                                    <h2 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">Chọn Khoa khám</h2>
                                    <p className="text-slate-500 text-sm mb-6 font-medium">Vui lòng chọn khoa bạn muốn đăng ký.</p>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                        {departments.map(dept => (
                                            <button
                                                key={dept.id}
                                                onClick={() => setFormData(prev => ({
                                                    ...prev,
                                                    deptId: dept.id.toString(),
                                                    deptName: dept.name,
                                                    specialityCode: '', specialityName: '' // Reset specialty
                                                }))}
                                                className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all text-left relative overflow-hidden group ${formData.deptId === dept.id.toString() ? 'border-teal-500 bg-teal-50/50 text-teal-700 ring-2 ring-teal-100 shadow-md scale-[1.02]' : 'border-white bg-white text-slate-600 hover:border-teal-200 shadow-sm'}`}
                                            >
                                                {dept.name}
                                                {formData.deptId === dept.id.toString() && (
                                                    <div className="absolute top-2 right-2 text-teal-500">
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Specialty Selection */}
                            <section className={`transition-all duration-500 ${formData.deptId ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                                <h2 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">Chọn chuyên khoa</h2>
                                <p className="text-slate-500 text-sm mb-6 font-medium">Bạn muốn đặt lịch khám tại chuyên khoa nào?</p>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {specialities.map(spec => (
                                        <button
                                            key={spec.id}
                                            onClick={() => setFormData({ ...formData, specialityCode: spec.id, specialityName: spec.name })}
                                            className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all text-left relative overflow-hidden group ${formData.specialityCode === spec.id ? 'border-teal-500 bg-teal-50/50 text-teal-700 ring-2 ring-teal-100 shadow-md scale-[1.02]' : 'border-white bg-white text-slate-600 hover:border-teal-200 shadow-sm'}`}
                                        >
                                            {spec.name}
                                            {formData.specialityCode === spec.id && (
                                                <div className="absolute top-2 right-2 text-teal-500">
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                    {specialities.length === 0 && formData.deptId && (
                                        <p className="col-span-full text-slate-400 italic">Không tìm thấy chuyên khoa nào.</p>
                                    )}
                                </div>
                            </section>

                            <section className={`transition-all duration-500 ${formData.specialityCode ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
                                <h2 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">Chọn ngày khám</h2>
                                <p className="text-slate-500 text-sm mb-6 font-medium">Vui lòng chọn thời gian bạn mong muốn đến khám.</p>

                                <div className="flex gap-4 overflow-x-auto pb-6 no-scrollbar -mx-2 px-2 scroll-smooth">
                                    {availableDates.map((date, idx) => {
                                        const dateKey = getLocalDateString(date);
                                        return (
                                            <DateCard
                                                key={dateKey}
                                                date={date}
                                                isToday={idx === 0}
                                                isSelected={formData.date === dateKey}
                                                onClick={() => setFormData({ ...formData, date: dateKey })}
                                            />
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-10 animate-fade-in">
                            <section>
                                <h2 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">Chọn khung giờ</h2>
                                <p className="text-slate-500 text-sm mb-6 font-medium">Khung giờ còn trống trong ngày {new Date(formData.date).toLocaleDateString('vi-VN')}</p>
                                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {slots.length === 0 ? (
                                        <p className="col-span-full text-center py-10 text-slate-400">Không có khung giờ trống cho ngày này.</p>
                                    ) : slots.map(slot => (
                                        <button
                                            key={slot.time}
                                            onClick={() => setFormData({ ...formData, time: slot.time })}
                                            className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${formData.time === slot.time ? 'border-teal-500 bg-teal-600 text-white shadow-lg scale-105' : 'border-white bg-white text-slate-600 hover:border-teal-200 shadow-sm'}`}
                                        >
                                            {slot.time}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h2 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">Lý do thăm khám</h2>
                                <p className="text-slate-500 text-sm mb-4 font-medium">Mô tả ngắn gọn tình trạng sức khỏe của bạn.</p>
                                <textarea
                                    rows={4}
                                    className="w-full p-5 border-2 border-white rounded-3xl text-slate-800 focus:ring-4 focus:ring-teal-100 focus:border-teal-500 outline-none shadow-sm resize-none bg-white transition-all text-lg font-medium"
                                    placeholder="Ví dụ: Đau đầu kéo dài, tái khám tiểu đường..."
                                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                    value={formData.reason}
                                ></textarea>
                            </section>

                            <div className="bg-white p-6 rounded-3xl border border-orange-100 shadow-sm flex gap-5 items-start">
                                <div className="bg-orange-100 p-3 rounded-2xl text-orange-600 shrink-0">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <p className="font-black text-slate-800 mb-1 uppercase text-xs tracking-wider">Hướng dẫn chuẩn bị</p>
                                    <ul className="text-sm text-slate-500 list-disc list-inside space-y-1 font-medium">
                                        <li>Cần mang theo thẻ BHYT và CCCD bản gốc để đối chiếu.</li>
                                        <li>Vui lòng nhịn ăn sáng nếu bạn cần thực hiện xét nghiệm máu.</li>
                                        <li>Có mặt tại quầy tiếp đón trước giờ hẹn ít nhất 15 phút.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>


                {/* Footer Navigation */}
                <div className="pt-6 mt-auto border-t border-slate-200 flex justify-between items-center bg-white md:bg-transparent -mx-4 px-4 md:mx-0 md:px-0 sticky bottom-0 z-50 pb-20 md:pb-4">
                    {step > 1 ? (
                        <button onClick={() => setStep(step - 1)} className="text-slate-400 font-black hover:text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest transition-colors">
                            ← Quay lại
                        </button>
                    ) : <div />}

                    <button
                        onClick={handleNext}
                        disabled={step === 1 && (!formData.deptId || !formData.specialityCode || !formData.date)}
                        className="w-full md:w-auto md:px-14 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black shadow-2xl shadow-teal-600/30 disabled:opacity-30 disabled:grayscale transition-all transform active:scale-95 flex items-center justify-center gap-3 uppercase text-sm tracking-widest"
                    >
                        {isSubmitting ? 'Đang xử lý...' : step === 2 ? 'Xác nhận Đăng ký' : 'Tiếp tục bước 2'}
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingView;
