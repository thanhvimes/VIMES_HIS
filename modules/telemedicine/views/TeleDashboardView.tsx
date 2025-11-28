
import React from 'react';
import { VideoCameraIcon, CalendarDaysIcon, CheckCircleIcon, ClockIcon } from '../../../components/Icons';
import { useNavigate } from 'react-router-dom';
import { mockTeleRequests } from '../data';

const DashboardCard: React.FC<{title: string; value: string; icon: React.ReactNode; color: string; subtext?: string}> = ({title, value, icon, color, subtext}) => (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 flex items-start justify-between">
        <div>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">{title}</h3>
            <p className="text-3xl font-bold text-onSurface dark:text-dark-onSurface mt-2">{value}</p>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-full ${color} shadow-sm`}>
            {icon}
        </div>
    </div>
);

const TeleDashboardView: React.FC = () => {
    const navigate = useNavigate();
    const upcoming = mockTeleRequests.filter(r => r.status === 'scheduled').length;
    const completed = mockTeleRequests.filter(r => r.status === 'completed').length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Trung tâm Hội chẩn Từ xa</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Kết nối chuyên gia - Nâng cao chất lượng điều trị.</p>
                </div>
                <button onClick={() => navigate('/telemedicine/requests')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow transition">
                    + Tạo yêu cầu mới
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard 
                    title="Sắp diễn ra" 
                    value={upcoming.toString()} 
                    icon={<CalendarDaysIcon className="w-6 h-6 text-white"/>} 
                    color="bg-indigo-500" 
                    subtext="Hôm nay: 2 ca"
                />
                <DashboardCard 
                    title="Đang kết nối" 
                    value="1" 
                    icon={<VideoCameraIcon className="w-6 h-6 text-white"/>} 
                    color="bg-red-500 animate-pulse" 
                    subtext="Phòng 01: Ung bướu"
                />
                <DashboardCard 
                    title="Đã hoàn thành" 
                    value={completed.toString()} 
                    icon={<CheckCircleIcon className="w-6 h-6 text-white"/>} 
                    color="bg-green-500" 
                    subtext="Tháng này"
                />
                <DashboardCard 
                    title="Tổng thời lượng" 
                    value="45h" 
                    icon={<ClockIcon className="w-6 h-6 text-white"/>} 
                    color="bg-blue-500" 
                    subtext="Tiết kiệm chi phí chuyển viện"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <CalendarDaysIcon className="w-5 h-5 text-indigo-600"/> Lịch hội chẩn sắp tới
                    </h3>
                    <div className="space-y-3">
                        {mockTeleRequests.filter(r => r.status === 'scheduled').map(req => (
                            <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-600 hover:border-indigo-300 transition-colors">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-indigo-700 dark:text-indigo-400">{req.scheduledTime}</span>
                                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">{req.specialty}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">{req.patientName} ({req.age}T)</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{req.reason}</p>
                                </div>
                                <button 
                                    onClick={() => navigate('/telemedicine/live')}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow flex items-center gap-2 transition-transform active:scale-95"
                                >
                                    <VideoCameraIcon className="w-4 h-4"/> Vào phòng
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Thống kê chuyên khoa</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600 dark:text-slate-300">Ung bướu</span>
                                <span className="font-bold">45%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                <div className="bg-indigo-500 h-2 rounded-full" style={{width: '45%'}}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600 dark:text-slate-300">Tim mạch</span>
                                <span className="font-bold">30%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                <div className="bg-red-500 h-2 rounded-full" style={{width: '30%'}}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-600 dark:text-slate-300">Chấn thương chỉnh hình</span>
                                <span className="font-bold">25%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                                <div className="bg-orange-500 h-2 rounded-full" style={{width: '25%'}}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeleDashboardView;
