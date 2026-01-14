
import React, { useState, useEffect } from 'react';
import { ArchiveIcon, BellIcon, CurrencyDollarIcon, CheckCircleIcon, ClockIcon } from '../../../components/Icons';
import { socketService } from '../../../services/socketService';
import { useNotification } from '../../../contexts/NotificationContext';

const DashboardCard: React.FC<{title: string; value: string; icon: React.ReactNode; color: string}> = ({title, value, icon, color}) => (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
        <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${color}`}>
                {icon}
            </div>
            <div>
                <h3 className="text-slate-500 dark:text-slate-400 font-medium">{title}</h3>
                <p className="text-3xl font-bold text-onSurface dark:text-dark-onSurface">{value}</p>
            </div>
        </div>
    </div>
);

const DashboardView: React.FC = () => {
    const { addNotification } = useNotification();
    const [pendingOrders, setPendingOrders] = useState(12);
    const [recentAlerts, setRecentAlerts] = useState<any[]>([]);

    // LẮNG NGHE ĐƠN THUỐC MỚI TỪ BÁC SĨ
    useEffect(() => {
        const handleNewRx = (data: any) => {
            setPendingOrders(prev => prev + 1);
            
            const newAlert = {
                id: data.id,
                title: `Đơn mới: ${data.patientName}`,
                msg: `Số lượng: ${data.itemCount} loại thuốc. Từ: ${data.doctorName}`,
                time: data.time,
                isNew: true
            };
            setRecentAlerts(prev => [newAlert, ...prev].slice(0, 5));

            addNotification(
                "Đơn thuốc mới", 
                `Bác sĩ vừa gửi đơn thuốc của BN ${data.patientName} xuống quầy.`, 
                "success", 
                "/pharmacy/import-export", 
                true
            );

            // Xóa hiệu ứng New sau 10 giây
            setTimeout(() => {
                setRecentAlerts(current => 
                    current.map(a => a.id === data.id ? { ...a, isNew: false } : a)
                );
            }, 10000);
        };

        socketService.on('new_prescription', handleNewRx);
        return () => socketService.off('new_prescription', handleNewRx);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Trạm Dược (Pharmacy Station)</h1>
                <div className="text-xs font-bold text-green-500 flex items-center gap-1 uppercase tracking-widest">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Live Connection
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard title="Chờ cấp phát" value={pendingOrders.toString()} icon={<ClockIcon className="w-6 h-6 text-white"/>} color="bg-orange-500" />
                <DashboardCard title="Đã hoàn tất" value="85" icon={<CheckCircleIcon className="w-6 h-6 text-white"/>} color="bg-green-500" />
                <DashboardCard title="Thuốc sắp hết" value="3" icon={<BellIcon className="w-6 h-6 text-white"/>} color="bg-red-500" />
                <DashboardCard title="Tổng loại thuốc" value="128" icon={<ArchiveIcon className="w-6 h-6 text-white"/>} color="bg-cyan-500" />
            </div>

            <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <ArchiveIcon className="w-5 h-5 text-blue-500"/> Thông báo đơn thuốc Real-time
                </h2>
                <div className="space-y-3">
                    {recentAlerts.length === 0 && <p className="text-slate-400 italic py-10 text-center border-2 border-dashed rounded-xl">Chưa có đơn thuốc mới trong phiên này.</p>}
                    {recentAlerts.map(alert => (
                        <div key={alert.id} className={`flex justify-between items-center p-4 rounded-xl border transition-all ${alert.isNew ? 'bg-green-50 border-green-300 ring-2 ring-green-100' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100'}`}>
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-full ${alert.isNew ? 'bg-green-500 text-white animate-bounce' : 'bg-slate-200 text-slate-400'}`}>
                                    <ArchiveIcon className="w-5 h-5"/>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 dark:text-white">{alert.title}</p>
                                    <p className="text-slate-500 text-xs mt-1">{alert.msg}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-400">{alert.time}</p>
                                {alert.isNew && <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">New</span>}
                            </div>
                        </div>
                    ))}
                    
                    {/* Hàng mẫu tĩnh */}
                    <div className="flex justify-between items-center p-3 rounded-md bg-slate-50 dark:bg-slate-800/50 opacity-60">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                            <p className="text-sm font-medium">BN. Nguyễn Văn An - Đã nhận thuốc</p>
                        </div>
                        <span className="text-[10px] text-slate-400">10:45 AM</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
