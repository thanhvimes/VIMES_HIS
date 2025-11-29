
import React, { useState } from 'react';
import { mockCampaigns } from '../data';
import { MegaphoneIcon, PlusIcon, PaperAirplaneIcon, CheckCircleIcon } from '../../../components/Icons';
import { ChatAltIcon } from '../icons';

const MarketingView: React.FC = () => {
    const [campaigns, setCampaigns] = useState(mockCampaigns);

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <MegaphoneIcon className="w-8 h-8 text-indigo-600"/> Marketing & CSKH Tự động
                </h1>
                <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> Tạo chiến dịch mới
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                {/* List */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-300">
                        Danh sách Chiến dịch
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {campaigns.map(c => (
                            <div key={c.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase ${c.type === 'SMS' ? 'bg-green-100 text-green-700' : c.type === 'Zalo' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{c.type}</span>
                                            <h3 className="font-bold text-lg text-slate-800 dark:text-white">{c.name}</h3>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">Ngày chạy: {c.date}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.status === 'Running' ? 'bg-blue-500 text-white animate-pulse' : c.status === 'Completed' ? 'bg-slate-200 text-slate-600' : 'bg-orange-100 text-orange-700'}`}>
                                        {c.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <div className="text-center">
                                        <p className="text-xs text-slate-500 uppercase font-bold">Đã gửi</p>
                                        <p className="text-xl font-bold text-slate-800 dark:text-slate-200">{c.sent}</p>
                                    </div>
                                    <div className="text-center border-l border-slate-100 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 uppercase font-bold">Đã mở</p>
                                        <p className="text-xl font-bold text-blue-600">{c.opened}</p>
                                    </div>
                                    <div className="text-center border-l border-slate-100 dark:border-slate-700">
                                        <p className="text-xs text-slate-500 uppercase font-bold">Chuyển đổi (Đặt lịch)</p>
                                        <p className="text-xl font-bold text-green-600">{c.converted}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Tools / Template Preview */}
                <div className="flex flex-col gap-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                        <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><ChatAltIcon className="w-6 h-6"/> Xem trước tin nhắn</h3>
                        <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/20 text-sm leading-relaxed">
                            <p>Chào <strong>[Ten_BN]</strong>,</p>
                            <p className="mt-2">Chúc mừng sinh nhật bạn! Phòng khám ABC tặng bạn voucher <strong>GIAM20</strong> (20%) cho gói khám tổng quát trong tháng này.</p>
                            <p className="mt-2">Đặt lịch ngay tại: https://clinic.vn/book</p>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button className="flex-1 bg-white text-indigo-600 font-bold py-2 rounded-lg text-sm hover:bg-indigo-50 transition">Gửi thử</button>
                            <button className="flex-1 bg-indigo-800/50 text-white font-bold py-2 rounded-lg text-sm hover:bg-indigo-800 transition">Sửa mẫu</button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Chiến dịch đề xuất</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer">
                                <div className="bg-green-100 p-2 rounded text-green-600"><CheckCircleIcon className="w-4 h-4"/></div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">Nhắc tái khám 6 tháng</h4>
                                    <p className="text-xs text-slate-500">Tự động gửi cho khách hàng khám nha khoa.</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer">
                                <div className="bg-blue-100 p-2 rounded text-blue-600"><PaperAirplaneIcon className="w-4 h-4"/></div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">Chào mừng khách mới</h4>
                                    <p className="text-xs text-slate-500">Gửi tin nhắn cảm ơn sau lần khám đầu tiên.</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingView;
