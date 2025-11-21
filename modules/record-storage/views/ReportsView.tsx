
import React, { useState } from 'react';
import { ChartBarIcon, DocumentReportIcon, UserGroupIcon, ShieldCheckIcon } from '../../../components/Icons';

const ReportsView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'stats' | 'logs'>('stats');

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Báo cáo & Nhật ký</h1>
                <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('stats')} 
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'stats' ? 'bg-white dark:bg-slate-600 shadow text-blue-600' : 'text-slate-500'}`}
                    >
                        Thống kê
                    </button>
                    <button 
                        onClick={() => setActiveTab('logs')} 
                        className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'logs' ? 'bg-white dark:bg-slate-600 shadow text-blue-600' : 'text-slate-500'}`}
                    >
                        Nhật ký truy cập (Logs)
                    </button>
                </div>
            </div>

            {activeTab === 'stats' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <DocumentReportIcon className="w-5 h-5 text-blue-500"/> Tình trạng hồ sơ
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Đã lưu trữ</span>
                                    <span className="font-bold">85%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{width: '85%'}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Đang mượn</span>
                                    <span className="font-bold">5%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-teal-500 h-2 rounded-full" style={{width: '5%'}}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>Đã tiêu hủy</span>
                                    <span className="font-bold">10%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{width: '10%'}}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5 text-orange-500"/> Hoạt động trong tháng
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">124</p>
                                <p className="text-xs text-slate-500">HS Tiếp nhận mới</p>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">45</p>
                                <p className="text-xs text-slate-500">Lượt mượn/trả</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <ShieldCheckIcon className="w-5 h-5 text-green-600"/>
                        Hệ thống tự động ghi lại mọi thao tác truy cập hồ sơ.
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-100 dark:bg-slate-900/50 font-bold text-slate-600 dark:text-slate-300 sticky top-0">
                                <tr>
                                    <th className="p-3">Thời gian</th>
                                    <th className="p-3">Người dùng</th>
                                    <th className="p-3">Hành động</th>
                                    <th className="p-3">Đối tượng</th>
                                    <th className="p-3">IP/Thiết bị</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 text-slate-500">30/10/2023 10:15</td>
                                    <td className="p-3 font-medium">admin_minh</td>
                                    <td className="p-3 text-blue-600">Xem chi tiết</td>
                                    <td className="p-3">HS_21024061</td>
                                    <td className="p-3 text-slate-400 text-xs">192.168.1.10</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 text-slate-500">30/10/2023 09:45</td>
                                    <td className="p-3 font-medium">khoa_luutru</td>
                                    <td className="p-3 text-green-600">Tiếp nhận</td>
                                    <td className="p-3">HS_23011618</td>
                                    <td className="p-3 text-slate-400 text-xs">192.168.1.25</td>
                                </tr>
                                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 text-slate-500">30/10/2023 08:30</td>
                                    <td className="p-3 font-medium">admin_minh</td>
                                    <td className="p-3 text-red-600">Tiêu hủy</td>
                                    <td className="p-3">HS_19005522</td>
                                    <td className="p-3 text-slate-400 text-xs">192.168.1.10</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportsView;
