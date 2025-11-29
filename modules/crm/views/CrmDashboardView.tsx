
import React from 'react';
import { FunnelIcon, GiftIcon, TicketIcon, TrendingUpIcon } from '../icons';
import { UserGroupIcon } from '../../../components/Icons';

const DashboardCard = ({ title, value, subtext, icon, color }: any) => (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 flex justify-between items-start">
        <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">{title}</h3>
            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">{value}</p>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-full ${color} shadow-sm`}>
            {icon}
        </div>
    </div>
);

const CrmDashboardView: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tổng quan Quan hệ Khách hàng</h1>
                    <p className="text-slate-500 text-sm">Theo dõi hiệu quả chăm sóc và chuyển đổi bệnh nhân.</p>
                </div>
                <div className="flex gap-2">
                    <select className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm">
                        <option>Tháng này</option>
                        <option>Quý này</option>
                        <option>Năm nay</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard 
                    title="Leads Mới" 
                    value="128" 
                    subtext="+12% so với tháng trước" 
                    icon={<FunnelIcon className="w-6 h-6 text-white"/>} 
                    color="bg-indigo-500"
                />
                <DashboardCard 
                    title="Tỷ lệ chuyển đổi" 
                    value="24.5%" 
                    subtext="Mục tiêu: 20%" 
                    icon={<TrendingUpIcon className="w-6 h-6 text-white"/>} 
                    color="bg-green-500"
                />
                <DashboardCard 
                    title="Ticket Hỗ trợ" 
                    value="15" 
                    subtext="3 yêu cầu đang chờ xử lý" 
                    icon={<TicketIcon className="w-6 h-6 text-white"/>} 
                    color="bg-orange-500"
                />
                <DashboardCard 
                    title="Khách hàng thân thiết" 
                    value="1,420" 
                    subtext="Thành viên active" 
                    icon={<GiftIcon className="w-6 h-6 text-white"/>} 
                    color="bg-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-6">Phễu Chuyển đổi (Tháng 11)</h3>
                    <div className="space-y-4">
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                                    Quan tâm (Leads)
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-indigo-600">500</span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-indigo-100">
                                <div style={{ width: "100%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"></div>
                            </div>
                        </div>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                    Đã liên hệ
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-blue-600">350</span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-100">
                                <div style={{ width: "70%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                            </div>
                        </div>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-600 bg-teal-200">
                                    Đã đặt lịch
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-teal-600">180</span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-teal-100">
                                <div style={{ width: "36%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-teal-500"></div>
                            </div>
                        </div>
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                                    Đã khám (Converted)
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-green-600">122</span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-100">
                                <div style={{ width: "24%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Nguồn khách hàng</h3>
                    <div className="flex items-center justify-center h-64 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-400">
                        Chart Placeholder (Pie Chart)
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrmDashboardView;
