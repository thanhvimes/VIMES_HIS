
import React, { useState } from 'react';
import { CheckCircleIcon } from '../../../components/Icons';

const specialities = ['Nội tổng quát', 'Ngoại khoa', 'Nhi khoa', 'Sản phụ khoa', 'Tai mũi họng', 'Răng hàm mặt', 'Da liễu', 'Tim mạch', 'Mắt'];
const timeslots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

const BookingView: React.FC = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        speciality: '',
        doctor: '',
        date: '',
        time: '',
        reason: ''
    });

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const handleReset = () => {
        setStep(1);
        setFormData({ speciality: '', doctor: '', date: '', time: '', reason: '' });
    }

    if (step === 3) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircleIcon className="w-14 h-14"/>
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Đăng ký thành công!</h2>
                <p className="text-slate-500 mb-8 text-lg">Mã đặt lịch của bạn là <span className="font-bold text-slate-800 text-xl block mt-2">#BK8829</span></p>
                
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 w-full mb-8 text-left">
                    <p className="mb-2"><strong>Chuyên khoa:</strong> {formData.speciality}</p>
                    <p className="mb-2"><strong>Thời gian:</strong> {formData.time} - {formData.date}</p>
                    <p className="text-sm text-slate-500 italic">Vui lòng đến trước giờ hẹn 15 phút để làm thủ tục.</p>
                </div>

                <button onClick={handleReset} className="w-full md:w-auto px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg transition">Về trang chủ</button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-0 h-full flex flex-col md:flex-row gap-8">
            {/* Left: Progress & Summary (Desktop) */}
            <div className="md:w-1/3 bg-white md:bg-slate-50 md:p-6 rounded-xl md:border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-6 hidden md:block">Quy trình đăng ký</h2>
                
                <div className="flex md:flex-col items-center md:items-start mb-8 px-4 md:px-0 gap-4 relative">
                    {/* Progress Line Desktop */}
                    <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200 hidden md:block -z-10"></div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${step >= 1 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                        <div className="hidden md:block">
                            <p className={`font-bold ${step >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>Thông tin khám</p>
                            <p className="text-xs text-slate-500">Chọn chuyên khoa & ngày</p>
                        </div>
                    </div>
                    
                    {/* Mobile Horizontal Line */}
                    <div className={`flex-1 h-1 mx-2 md:hidden ${step >= 2 ? 'bg-teal-600' : 'bg-slate-200'}`}></div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:mt-8">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${step >= 2 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                        <div className="hidden md:block">
                            <p className={`font-bold ${step >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>Thời gian & Lý do</p>
                            <p className="text-xs text-slate-500">Chọn giờ & mô tả</p>
                        </div>
                    </div>

                    {/* Mobile Horizontal Line */}
                    <div className={`flex-1 h-1 mx-2 md:hidden ${step >= 3 ? 'bg-teal-600' : 'bg-slate-200'}`}></div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:mt-8">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${step >= 3 ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>3</div>
                        <div className="hidden md:block">
                            <p className={`font-bold ${step >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>Hoàn tất</p>
                            <p className="text-xs text-slate-500">Xác nhận phiếu</p>
                        </div>
                    </div>
                </div>

                {/* Summary Desktop */}
                <div className="hidden md:block bg-white p-4 rounded-lg border border-slate-200 shadow-sm mt-4">
                    <h4 className="font-bold text-sm mb-2 uppercase text-slate-500">Tóm tắt</h4>
                    <p className="text-sm mb-1"><span className="font-bold">Chuyên khoa:</span> {formData.speciality || '---'}</p>
                    <p className="text-sm mb-1"><span className="font-bold">Ngày:</span> {formData.date || '---'}</p>
                    <p className="text-sm"><span className="font-bold">Giờ:</span> {formData.time || '---'}</p>
                </div>
            </div>

            {/* Right: Form Content */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto bg-white md:bg-transparent rounded-xl md:rounded-none shadow-sm md:shadow-none border md:border-none p-4 md:p-0">
                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Chọn Chuyên khoa</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {specialities.map(spec => (
                                        <button 
                                            key={spec}
                                            onClick={() => setFormData({...formData, speciality: spec})}
                                            className={`p-4 rounded-xl border text-sm font-bold transition-all hover:shadow-md ${formData.speciality === spec ? 'border-teal-500 bg-teal-50 text-teal-700 ring-2 ring-teal-200' : 'border-slate-200 text-slate-600 hover:border-teal-300 hover:bg-white'}`}
                                        >
                                            {spec}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={`transition-opacity duration-500 ${formData.speciality ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Chọn Ngày khám</label>
                                <input 
                                    type="date" 
                                    className="w-full md:w-1/2 p-3 border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none font-medium"
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                    value={formData.date}
                                />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Chọn Giờ khám</label>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                    {timeslots.map(time => (
                                        <button 
                                            key={time}
                                            onClick={() => setFormData({...formData, time: time})}
                                            className={`p-2 rounded-lg border text-sm font-bold transition-all ${formData.time === time ? 'border-teal-500 bg-teal-600 text-white shadow-md' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Triệu chứng / Lý do</label>
                                <textarea 
                                    rows={4}
                                    className="w-full p-4 border border-slate-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none resize-none bg-slate-50 focus:bg-white transition-colors"
                                    placeholder="Mô tả ngắn gọn triệu chứng..."
                                    onChange={e => setFormData({...formData, reason: e.target.value})}
                                    value={formData.reason}
                                ></textarea>
                            </div>

                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 text-sm text-orange-800 flex gap-3 items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="font-bold mb-1">Lưu ý:</p>
                                    <p>Vui lòng mang theo BHYT và giấy tờ tùy thân khi đến khám. Đến trước giờ hẹn 15 phút.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4 mt-auto border-t border-slate-100 flex justify-end">
                    <button 
                        onClick={handleNext}
                        disabled={step === 1 && (!formData.speciality || !formData.date)}
                        className="w-full md:w-auto md:px-12 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
                    >
                        {step === 2 ? 'Xác nhận Đặt lịch' : 'Tiếp tục →'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookingView;
