
import React, { useState, useMemo, useEffect } from 'react';
import { CheckCircleIcon, ChevronRightIcon } from '../../../components/Icons';

const specialities = ['Nội tổng quát', 'Ngoại khoa', 'Nhi khoa', 'Sản phụ khoa', 'Tai mũi họng', 'Răng hàm mặt', 'Da liễu', 'Tim mạch', 'Mắt'];
const timeslots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

// Helper để tạo chuỗi ngày yyyy-mm-dd theo giờ địa phương
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
            className={`relative flex flex-col items-center justify-center min-w-[110px] h-28 rounded-2xl border-2 transition-all duration-300 shrink-0 select-none ${
                isSelected 
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
    const [step, setStep] = useState(1);
    const [bookingId, setBookingId] = useState(''); // Lưu mã đặt lịch để tránh bị nhảy khi render
    const [formData, setFormData] = useState({
        speciality: '',
        doctor: '',
        date: '',
        time: '',
        reason: ''
    });

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

    const handleNext = () => {
        if (step === 2) {
            setBookingId(`BK-VIMES-${Math.floor(1000 + Math.random() * 9000)}`);
        }
        if (step < 3) setStep(step + 1);
    };

    const handleReset = () => {
        setStep(1);
        setBookingId('');
        setFormData({ speciality: '', doctor: '', date: '', time: '', reason: '' });
    }

    if (step === 3) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto animate-fade-in">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircleIcon className="w-14 h-14"/>
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Đăng ký thành công!</h2>
                <p className="text-slate-500 mb-8 text-lg">Mã đặt lịch của bạn là <span className="font-black text-teal-600 text-2xl block mt-2">#{bookingId}</span></p>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm w-full mb-8 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p><strong className="text-slate-400 uppercase text-[10px] block mb-1">Chuyên khoa:</strong> <span className="text-slate-800 font-bold">{formData.speciality}</span></p>
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
            <div className="md:w-1/3 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm shrink-0 h-fit sticky top-24">
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
                            <span className="text-[10px] text-slate-400 font-bold uppercase block">Chuyên khoa</span>
                            <span className="font-bold text-slate-800">{formData.speciality || '---'}</span>
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
                            <section>
                                <h2 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">Chọn chuyên khoa</h2>
                                <p className="text-slate-500 text-sm mb-6 font-medium">Bạn muốn đặt lịch khám tại khoa nào?</p>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                    {specialities.map(spec => (
                                        <button 
                                            key={spec}
                                            onClick={() => setFormData({...formData, speciality: spec})}
                                            className={`p-4 rounded-2xl border-2 text-sm font-bold transition-all text-left relative overflow-hidden group ${formData.speciality === spec ? 'border-teal-500 bg-teal-50/50 text-teal-700 ring-2 ring-teal-100 shadow-md scale-[1.02]' : 'border-white bg-white text-slate-600 hover:border-teal-200 shadow-sm'}`}
                                        >
                                            {spec}
                                            {formData.speciality === spec && (
                                                <div className="absolute top-2 right-2 text-teal-500">
                                                    <CheckCircleIcon className="w-5 h-5"/>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className={`transition-all duration-500 ${formData.speciality ? 'opacity-100' : 'opacity-20 pointer-events-none'}`}>
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
                                                onClick={() => setFormData({...formData, date: dateKey})}
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
                                    {timeslots.map(time => (
                                        <button 
                                            key={time}
                                            onClick={() => setFormData({...formData, time: time})}
                                            className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${formData.time === time ? 'border-teal-500 bg-teal-600 text-white shadow-lg scale-105' : 'border-white bg-white text-slate-600 hover:border-teal-200 shadow-sm'}`}
                                        >
                                            {time}
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
                                    onChange={e => setFormData({...formData, reason: e.target.value})}
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
                <div className="pt-6 mt-auto border-t border-slate-200 flex justify-between items-center bg-white md:bg-transparent -mx-4 px-4 md:mx-0 md:px-0 sticky bottom-0 z-10 pb-2">
                    {step > 1 ? (
                        <button onClick={() => setStep(step - 1)} className="text-slate-400 font-black hover:text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest transition-colors">
                            ← Quay lại
                        </button>
                    ) : <div />}
                    
                    <button 
                        onClick={handleNext}
                        disabled={step === 1 && (!formData.speciality || !formData.date)}
                        className="w-full md:w-auto md:px-14 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black shadow-2xl shadow-teal-600/30 disabled:opacity-30 disabled:grayscale transition-all transform active:scale-95 flex items-center justify-center gap-3 uppercase text-sm tracking-widest"
                    >
                        {step === 2 ? 'Xác nhận Đăng ký' : 'Tiếp tục bước 2'}
                        <ChevronRightIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingView;
