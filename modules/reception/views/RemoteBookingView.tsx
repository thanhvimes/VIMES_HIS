
import React, { useState, useMemo } from 'react';
import {
    PhoneIcon,
    SearchIcon,
    UserPlusIcon,
    CalendarIcon,
    ClockIcon,
    CheckCircleIcon,
    UserGroupIcon,
    ShieldCheckIcon,
    XIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { receptionService } from '../../../services/receptionService';
import { FormDateInput } from '../../../components/shared/forms';
import { Patient } from '../../../types';

const specialities = ['Nội tổng quát', 'Ngoại khoa', 'Nhi khoa', 'Sản phụ khoa', 'Tai mũi họng', 'Răng hàm mặt', 'Da liễu', 'Tim mạch', 'Mắt'];
const timeslots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30', '16:00'];

const RemoteBookingView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
    const [isNewPatient, setIsNewPatient] = useState(false);

    const [bookingData, setBookingData] = useState({
        name: '',
        phone: '',
        dob: '',
        gender: 'Nam',
        speciality: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        reason: '',
        isPriority: false
    });

    const handleSearch = async () => {
        if (!searchQuery) return;
        const result = await receptionService.getPatientByRecordNumber(searchQuery);
        if (result) {
            setFoundPatient(result);
            setIsNewPatient(false);
            setBookingData(prev => ({
                ...prev,
                name: result.name,
                phone: result.phone || '',
                dob: result.dob,
                gender: result.gender
            }));
        } else {
            setFoundPatient(null);
            setIsNewPatient(true);
            setBookingData(prev => ({ ...prev, name: '', phone: searchQuery.match(/^\d+$/) ? searchQuery : '' }));
        }
    };

    const handleBooking = () => {
        if (!bookingData.name || !bookingData.speciality || !bookingData.date || !bookingData.time) {
            alert("Vui lòng điền đầy đủ thông tin bắt buộc.");
            return;
        }
        alert(`Đăng ký thành công cho BN ${bookingData.name} tại khoa ${bookingData.speciality} lúc ${bookingData.time} ngày ${bookingData.date}`);
        // Reset form
        setFoundPatient(null);
        setIsNewPatient(false);
        setBookingData({ name: '', phone: '', dob: '', gender: 'Nam', speciality: '', date: new Date().toISOString().split('T')[0], time: '', reason: '', isPriority: false });
        setSearchQuery('');
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg">
                        <PhoneIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Đăng ký từ xa (Call Center)</h1>
                        <p className="text-sm text-slate-500">Tiếp nhận thông tin đặt lịch qua điện thoại/mạng xã hội.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* LEFT: Search & Basic Info */}
                <div className="lg:col-span-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2 border-b pb-2">
                            <SearchIcon className="w-5 h-5 text-blue-500" /> Tra cứu bệnh nhân
                        </h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder="SĐT, Mã BN, CCCD..."
                                className="flex-1 p-2.5 border rounded-xl dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                            />
                            <button onClick={handleSearch} className="px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-md">Tìm</button>
                        </div>

                        {foundPatient ? (
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-xl animate-fade-in">
                                <div className="flex items-center gap-3 mb-2">
                                    <CheckCircleIcon className="w-5 h-5 text-green-600" />
                                    <span className="font-bold text-green-800 dark:text-green-300">Đã thấy thông tin cũ</span>
                                </div>
                                <p className="text-sm"><strong>Mã BN:</strong> {foundPatient.id}</p>
                                <p className="text-sm"><strong>Lần cuối:</strong> {foundPatient.lastVisit || 'Chưa rõ'}</p>
                            </div>
                        ) : isNewPatient ? (
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-xl animate-fade-in">
                                <div className="flex items-center gap-3 mb-2">
                                    <UserPlusIcon className="w-5 h-5 text-blue-600" />
                                    <span className="font-bold text-blue-800 dark:text-blue-300">Bệnh nhân mới</span>
                                </div>
                                <p className="text-xs text-blue-600">Vui lòng nhập đầy đủ thông tin hành chính bên dưới.</p>
                            </div>
                        ) : null}
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                        <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2 border-b pb-2">
                            <UserGroupIcon className="w-5 h-5 text-indigo-500" /> Thông tin hành chính
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Họ và tên *</label>
                                <input type="text" value={bookingData.name} onChange={e => setBookingData({ ...bookingData, name: e.target.value.toUpperCase() })} className="w-full p-2.5 border rounded-lg dark:bg-slate-900 font-bold text-blue-600" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày sinh</label>
                                    <FormDateInput value={bookingData.dob} onChange={e => setBookingData({ ...bookingData, dob: e.target.value })} className="w-full p-2.5 border rounded-lg dark:bg-slate-900" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Giới tính</label>
                                    <select value={bookingData.gender} onChange={e => setBookingData({ ...bookingData, gender: e.target.value })} className="w-full p-2.5 border rounded-lg dark:bg-slate-900">
                                        <option>Nam</option>
                                        <option>Nữ</option>
                                        <option>Khác</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Số điện thoại *</label>
                                <input type="tel" value={bookingData.phone} onChange={e => setBookingData({ ...bookingData, phone: e.target.value })} className="w-full p-2.5 border rounded-lg dark:bg-slate-900" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Booking Options */}
                <div className="lg:col-span-2 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 shadow-sm flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section>
                                <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2 border-b pb-2 mb-4 uppercase text-sm">
                                    <CalendarIcon className="w-5 h-5 text-teal-500" /> Lịch hẹn khám
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Chuyên khoa *</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {specialities.map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setBookingData({ ...bookingData, speciality: s })}
                                                    className={`p-2 text-xs font-bold border rounded-lg transition-all ${bookingData.speciality === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-slate-50 dark:bg-slate-900 hover:border-indigo-300'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ngày khám *</label>
                                        <FormDateInput value={bookingData.date} onChange={e => setBookingData({ ...bookingData, date: e.target.value })} className="w-full p-2.5 border rounded-lg dark:bg-slate-900 font-bold" />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="font-bold text-slate-700 dark:text-white flex items-center gap-2 border-b pb-2 mb-4 uppercase text-sm">
                                    <ClockIcon className="w-5 h-5 text-orange-500" /> Khung giờ & Lý do
                                </h3>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Giờ hẹn *</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {timeslots.map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setBookingData({ ...bookingData, time: t })}
                                                className={`p-2 text-xs font-bold border rounded-lg transition-all ${bookingData.time === t ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-slate-50 dark:bg-slate-900 hover:border-orange-300'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lý do khám / Triệu chứng</label>
                                    <textarea
                                        rows={3}
                                        value={bookingData.reason}
                                        onChange={e => setBookingData({ ...bookingData, reason: e.target.value })}
                                        className="w-full p-3 border rounded-xl dark:bg-slate-900 resize-none text-sm"
                                        placeholder="Ghi nhận nhanh triệu chứng..."
                                    />
                                </div>
                                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900">
                                    <input
                                        type="checkbox"
                                        id="priority"
                                        checked={bookingData.isPriority}
                                        onChange={e => setBookingData({ ...bookingData, isPriority: e.target.checked })}
                                        className="w-5 h-5 text-red-600 rounded"
                                    />
                                    <label htmlFor="priority" className="text-sm font-bold text-red-700 dark:text-red-400 cursor-pointer">Bệnh nhân ưu tiên (Cấp cứu/TE/Người già)</label>
                                </div>
                            </section>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-t-2xl">
                        <button onClick={() => setSearchQuery('')} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition uppercase text-xs tracking-widest">Hủy bỏ</button>
                        <button onClick={handleBooking} className="px-12 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xl shadow-indigo-500/30 transition transform active:scale-95 flex items-center gap-2 uppercase text-sm tracking-wider">
                            <CheckCircleIcon className="w-5 h-5" /> Hoàn tất đăng ký
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RemoteBookingView;
