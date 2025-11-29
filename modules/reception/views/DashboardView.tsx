
import React, { useState, useEffect } from 'react';
import { 
    UserGroupIcon, 
    CalendarIcon, 
    ClipboardListIcon, 
    MegaphoneIcon, 
    RefreshIcon, 
    PlayIcon,
    CheckCircleIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { receptionService, QueueStatus } from '../../../services/receptionService';

const hourlyData = [
    { hour: '7h', patients: 3 },
    { hour: '8h', patients: 5 },
    { hour: '9h', patients: 8 },
    { hour: '10h', patients: 6 },
    { hour: '11h', patients: 4 },
    { hour: '13h', patients: 3 },
    { hour: '14h', patients: 5 },
    { hour: '15h', patients: 2 },
];

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

// --- QUICK QUEUE CONTROLLER WIDGET ---
const QueueController: React.FC = () => {
    const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
    const [isCalling, setIsCalling] = useState(false);
    const [isRecalling, setIsRecalling] = useState(false);

    // Load initial status
    useEffect(() => {
        const loadStatus = async () => {
            const status = await receptionService.getQueueStatus();
            setQueueStatus(status);
        };
        loadStatus();
    }, []);

    // Text-to-Speech Helper
    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'vi-VN';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleCallNext = async () => {
        if (isCalling) return;
        setIsCalling(true);
        try {
            const newStatus = await receptionService.callNextPatient('DEFAULT');
            setQueueStatus(newStatus);
            
            // Play sound & Speak
            const message = `Mời số thứ tự ${newStatus.currentNumber}, bệnh nhân ${newStatus.currentPatientName}, đến ${newStatus.name}`;
            speak(message);
        } finally {
            setIsCalling(false);
        }
    };

    const handleRecall = async () => {
        if (!queueStatus || isRecalling) return;
        setIsRecalling(true);
        try {
            await receptionService.recallPatient('DEFAULT', queueStatus.currentNumber);
            
            const message = `Mời lại số thứ tự ${queueStatus.currentNumber}, bệnh nhân ${queueStatus.currentPatientName}, đến ${queueStatus.name}`;
            speak(message);
        } finally {
            // Small delay to prevent spam
            setTimeout(() => setIsRecalling(false), 2000);
        }
    };

    if (!queueStatus) return <div className="p-4 bg-white dark:bg-slate-800 rounded-xl animate-pulse h-40"></div>;

    return (
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <MegaphoneIcon className="w-32 h-32" />
            </div>

            <h3 className="text-blue-100 font-bold uppercase text-sm mb-4 flex items-center gap-2">
                <MegaphoneIcon className="w-4 h-4"/> Điều khiển Gọi số (Quick)
            </h3>

            <div className="flex justify-between items-end relative z-10">
                <div>
                    <p className="text-blue-200 text-xs font-bold uppercase mb-1">Đang phục vụ</p>
                    <div className="text-5xl font-black font-mono tracking-tight leading-none mb-1">
                        {queueStatus.currentNumber}
                    </div>
                    <p className="text-lg font-bold truncate max-w-[180px]">{queueStatus.currentPatientName}</p>
                </div>

                <div className="flex flex-col gap-2">
                     <div className="bg-white/10 rounded-lg p-2 mb-2 backdrop-blur-sm border border-white/10">
                        <p className="text-xs text-blue-200">Tiếp theo</p>
                        <p className="font-bold text-sm">{queueStatus.nextNumber} - {queueStatus.nextPatientName}</p>
                        <p className="text-[10px] text-blue-300">Đang chờ: {queueStatus.waitingCount}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
                <button 
                    onClick={handleCallNext}
                    disabled={isCalling}
                    className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-2.5 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70"
                >
                    {isCalling ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <PlayIcon className="w-5 h-5"/>}
                    Gọi số tiếp
                </button>
                
                <button 
                    onClick={handleRecall}
                    disabled={isRecalling}
                    className="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2.5 px-4 rounded-lg shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 border border-blue-400"
                >
                    <RefreshIcon className={`w-5 h-5 ${isRecalling ? 'animate-spin' : ''}`}/>
                    Gọi lại
                </button>
            </div>
        </div>
    );
};

const DashboardView: React.FC = () => {
  const { theme } = useTheme();
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  
  return (
    <div className="space-y-6">
      <p className="text-slate-500 dark:text-slate-400 -mt-2">Tổng quan hoạt động tiếp nhận bệnh nhân trong ngày.</p>
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title="Bệnh nhân hôm nay" value="25" icon={<UserGroupIcon className="w-6 h-6 text-white"/>} color="bg-cyan-500" />
        <DashboardCard title="Lịch hẹn chờ" value="8" icon={<CalendarIcon className="w-6 h-6 text-white"/>} color="bg-amber-500" />
        <DashboardCard title="Check-in hoàn tất" value="17" icon={<ClipboardListIcon className="w-6 h-6 text-white"/>} color="bg-emerald-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Chart & Recent */}
        <div className="lg:col-span-2 space-y-6">
            {/* Chart */}
            <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Lượng bệnh nhân theo giờ</h2>
                 <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={hourlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="hour" tick={{fill: tickColor}} />
                    <YAxis allowDecimals={false} tick={{fill: tickColor}}/>
                    <Tooltip 
                      contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0' }}
                      labelStyle={{color: theme === 'dark' ? '#e2e8f0' : '#1e293b'}}
                      formatter={(value) => [`${value} bệnh nhân`, "Số lượng"]}
                    />
                    <Bar dataKey="patients" name="Bệnh nhân" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Recent List */}
            <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Đăng ký gần đây</h2>
                <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">N</div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">Nguyễn Thị Ngọ</p>
                                <p className="text-xs text-slate-500">Mã: 2311005</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-700">Chờ khám</span>
                    </div>
                     <div className="flex justify-between items-center text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">T</div>
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">Trần Văn B</p>
                                <p className="text-xs text-slate-500">Mã: 2311004</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">Đang khám</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Queue Control & Quick Actions */}
        <div className="space-y-6">
            {/* NEW: Queue Controller Widget */}
            <QueueController />

            {/* Quick Actions */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-4">Thao tác nhanh</h3>
                <div className="grid grid-cols-1 gap-3">
                    <button className="flex items-center justify-between w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-200 transition"><CheckCircleIcon className="w-5 h-5"/></div>
                            <span className="font-medium text-slate-700 dark:text-slate-200">Check-in Lịch hẹn</span>
                        </div>
                        <PlayIcon className="w-4 h-4 text-slate-400"/>
                    </button>
                    <button className="flex items-center justify-between w-full p-3 bg-slate-50 dark:bg-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 transition group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-200 transition"><RefreshIcon className="w-5 h-5"/></div>
                            <span className="font-medium text-slate-700 dark:text-slate-200">Cập nhật thông tin BN</span>
                        </div>
                        <PlayIcon className="w-4 h-4 text-slate-400"/>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
