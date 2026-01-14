
import React from 'react';
import { 
    CogIcon, 
    ClockIcon, 
    ArchiveIcon, 
    UserGroupIcon, 
    GlobeIcon,
    BellIcon,
    ShieldCheckIcon,
    SaveIcon
} from '../../../components/Icons';

const BookingConfigurationView: React.FC = () => {
    const sectionClass = "bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm";
    const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase text-[10px] tracking-widest";
    
    // Khắc phục màu nền đen bằng cách dùng bg-white dark:bg-slate-900
    const inputClass = "w-full p-3 border rounded-xl outline-none transition-all font-bold text-sm " + 
                      "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 " +
                      "text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500";

    return (
        <div className="h-full overflow-y-auto custom-scrollbar pr-1 animate-fade-in space-y-6 pb-10">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Thiết lập Quy trình</h1>
                    <p className="text-slate-500 mt-1 font-medium">Cấu hình thời gian, định mức và quy trình duyệt lịch online.</p>
                </div>
                <button className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl font-black shadow-lg flex items-center gap-2 transition active:scale-95">
                    <SaveIcon className="w-5 h-5"/> Lưu cấu hình
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <section className={sectionClass}>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase text-xs tracking-widest border-b dark:border-slate-700 pb-3">
                        <ClockIcon className="w-5 h-5 text-blue-500"/> Khung giờ & Định mức (Quota)
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Lượt khám tối đa / Khung giờ</label>
                                <input type="number" defaultValue={10} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Thời gian cách quãng (Phút)</label>
                                <input type="number" defaultValue={30} className={inputClass} />
                            </div>
                        </div>
                        <div>
                            <label className={labelClass}>Ngày cho phép đặt trước (Tối đa)</label>
                            <input type="number" defaultValue={14} className={inputClass} />
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <input type="checkbox" id="quota-strict" defaultChecked className="w-5 h-5 rounded-lg text-teal-600 focus:ring-teal-500 cursor-pointer" />
                            <label htmlFor="quota-strict" className="text-sm font-bold text-slate-600 dark:text-slate-300 cursor-pointer">Tự động khóa khung giờ khi đủ định mức</label>
                        </div>
                    </div>
                </section>

                <section className={sectionClass}>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase text-xs tracking-widest border-b dark:border-slate-700 pb-3">
                        <GlobeIcon className="w-5 h-5 text-teal-500"/> Kênh đăng ký & Tích hợp
                    </h3>
                    <div className="space-y-3">
                        {[
                            { name: 'Website Portal', desc: 'Trang web bệnh nhân tự đặt', status: 'Active' },
                            { name: 'Mobile App', desc: 'Ứng dụng iOS/Android', status: 'Inactive' },
                            { name: 'Zalo Mini App', desc: 'Quan tâm Zalo OA để đặt lịch', status: 'Active' }
                        ].map((channel, i) => (
                            <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div>
                                    <span className="font-black text-slate-800 dark:text-white block text-sm uppercase">{channel.name}</span>
                                    <span className="text-xs text-slate-500 font-medium">{channel.desc}</span>
                                </div>
                                <button className={`text-[10px] font-black px-3 py-1 rounded-full uppercase border ${channel.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-200 text-slate-500 border-slate-300'}`}>
                                    {channel.status === 'Active' ? 'Đang mở' : 'Tạm đóng'}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={sectionClass}>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase text-xs tracking-widest border-b dark:border-slate-700 pb-3">
                        <BellIcon className="w-5 h-5 text-orange-500"/> Thông báo & SMS
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>Mẫu SMS xác nhận tự động</label>
                            <textarea rows={3} className={`${inputClass} resize-none`} defaultValue="Cam on ban da dat lich tai VIMES luc [GIO] ngay [NGAY]. Vui long den truoc 15 phut." />
                        </div>
                        <div className="flex items-center justify-between p-2">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Gửi nhắc lịch trước 2 tiếng</span>
                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg text-teal-600 cursor-pointer" />
                        </div>
                        <div className="flex items-center justify-between p-2">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Thông báo cho bác sĩ khi có ca mới</span>
                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg text-teal-600 cursor-pointer" />
                        </div>
                    </div>
                </section>

                <section className={sectionClass}>
                    <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2 uppercase text-xs tracking-widest border-b dark:border-slate-700 pb-3">
                        <ShieldCheckIcon className="w-5 h-5 text-indigo-500"/> Quy tắc Duyệt lịch
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-2">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Tự động duyệt nếu đã có mã BN (Hồ sơ cũ)</span>
                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg text-teal-600 cursor-pointer" />
                        </div>
                        <div className="flex items-center justify-between p-2">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Yêu cầu xác thực OTP cho bệnh nhân mới</span>
                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg text-teal-600 cursor-pointer" />
                        </div>
                        <div className="flex items-center justify-between p-2">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Cho phép hủy lịch online</span>
                            <input type="checkbox" defaultChecked className="w-5 h-5 rounded-lg text-teal-600 cursor-pointer" />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default BookingConfigurationView;
