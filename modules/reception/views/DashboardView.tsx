
import React, { useState, useEffect } from 'react';
import { 
    UserGroupIcon, 
    CalendarIcon, 
    ClipboardListIcon, 
    MegaphoneIcon, 
    RefreshIcon, 
    PlayIcon,
    CheckCircleIcon,
    PlusIcon,
    ClockIcon,
    UserPlusIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { receptionService, QueueStatus } from '../../../services/receptionService';
import { useNavigate } from 'react-router-dom';

const hourlyData = [
    { hour: '7h', patients: 3 },
    { hour: '8h', patients: 12 },
    { hour: '9h', patients: 18 },
    { hour: '10h', patients: 15 },
    { hour: '11h', patients: 8 },
    { hour: '13h', patients: 10 },
    { hour: '14h', patients: 14 },
    { hour: '15h', patients: 9 },
];

const DashboardCard: React.FC<{title: string; value: string; subtext?: string; icon: React.ReactNode; color: string}> = ({title, value, subtext, icon, color}) => (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 relative overflow-hidden group">
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-110 ${color.replace('text-', 'bg-')}`}></div>
        <div className="flex items-start justify-between relative z-10">
            <div>
                <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">{title}</h3>
                <p className="text-3xl font-black text-onSurface dark:text-dark-onSurface mt-2">{value}</p>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color} text-white shadow-md`}>
                {icon}
            </div>
        </div>
    </div>
);

// --- QUICK QUEUE CONTROLLER WIDGET ---
const QueueController: React.FC = () => {
    const navigate = useNavigate();
    const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
    const [isCalling, setIsCalling] = useState(false);
    const [isRecalling, setIsRecalling] = useState(false);

    useEffect(() => {
        const loadStatus = async () => {
            const status = await receptionService.getQueueStatus();
            setQueueStatus(status);
        };
        loadStatus();
    }, []);

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
            setTimeout(() => setIsRecalling(false), 2000);
        }
    };

    if (!queueStatus) return <div className="p-4 bg-white dark:bg-slate-800 rounded-xl animate-pulse h-40"></div>;

    return (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-xl p-6 text-white relative overflow-hidden flex flex-col justify-between h-full">
            {/* Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <MegaphoneIcon className="w-40 h-40" />
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold uppercase text-sm flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full w-fit backdrop-blur-md">
                        <MegaphoneIcon className="w-4 h-4"/> Điều khiển Gọi số
                    </h3>
                    <button onClick={() => navigate('/reception/queue')} className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition">
                        Mở rộng &rarr;
                    </button>
                </div>

                <div className="flex justify-between items-end mb-4">
                    <div>
                        <p className="text-blue-100 text-xs font-bold uppercase mb-1 opacity-80">Đang phục vụ</p>
                        <div className="text-6xl font-black font-mono tracking-tighter leading-none mb-1 text-white drop-shadow-md">
                            {queueStatus.currentNumber}
                        </div>
                        <p className="text-lg font-bold truncate max-w-[200px] text-blue-50">{queueStatus.currentPatientName}</p>
                    </div>

                    <div className="text-right">
                         <div className="bg-black/20 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                            <p className="text-xs text-blue-200 uppercase font-bold mb-1">Tiếp theo</p>
                            <p className="font-bold text-xl">{queueStatus.nextNumber}</p>
                            <p className="text-xs text-blue-100 truncate max-w-[100px]">{queueStatus.nextPatientName}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-auto relative z-10">
                <button 
                    onClick={handleCallNext}
                    disabled={isCalling}
                    className="bg-white text-blue-700 hover:bg-blue-50 font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70"
                >
                    {isCalling ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <PlayIcon className="w-5 h-5"/>}
                    Gọi số tiếp
                </button>
                
                <button 
                    onClick={handleRecall}
                    disabled={isRecalling}
                    className="bg-indigo-500 hover:bg-indigo-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-70 border border-indigo-400/50"
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
  const navigate = useNavigate();
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tổng quan Tiếp nhận</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Theo dõi lưu lượng bệnh nhân và điều phối phòng khám.</p>
          </div>
          <div className="text-sm text-slate-500 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-blue-500"/>
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
      </div>
      
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
            title="Đã tiếp nhận" 
            value="89" 
            subtext="+15% so với hôm qua"
            icon={<UserGroupIcon className="w-6 h-6"/>} 
            color="bg-cyan-500" 
        />
        <DashboardCard 
            title="Đang chờ khám" 
            value="12" 
            subtext="Thời gian chờ TB: 15p"
            icon={<ClockIcon className="w-6 h-6"/>} 
            color="bg-amber-500" 
        />
        <DashboardCard 
            title="Đã hoàn tất" 
            value="45" 
            subtext="Doanh thu ước tính: 15M"
            icon={<CheckCircleIcon className="w-6 h-6"/>} 
            color="bg-emerald-500" 
        />
        <DashboardCard 
            title="Đặt lịch trước" 
            value="24" 
            subtext="Qua App/Web"
            icon={<CalendarIcon className="w-6 h-6"/>} 
            color="bg-purple-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-auto lg:h-[450px]">
        {/* Left Column: Queue Controller (Fixed height) */}
        <div className="lg:col-span-1 h-full">
            <QueueController />
        </div>

        {/* Right Column: Chart & Actions */}
        <div className="lg:col-span-2 flex flex-col gap-6 h-full">
             {/* Quick Actions Bar */}
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 items-center">
                <span className="text-sm font-bold text-slate-500 uppercase mr-2">Thao tác nhanh:</span>
                <button 
                    onClick={() => navigate('/reception/register')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition transform active:scale-95"
                >
                    <PlusIcon className="w-5 h-5"/> Đăng ký mới
                </button>
                <button 
                    onClick={() => navigate('/reception/schedule')}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition"
                >
                    <CalendarIcon className="w-5 h-5 text-purple-500"/> Check-in Lịch hẹn
                </button>
                <button 
                    onClick={() => navigate('/reception/list')}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition"
                >
                    <ClipboardListIcon className="w-5 h-5 text-green-500"/> Tra cứu HS
                </button>
            </div>

            {/* Chart */}
            <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 min-h-[300px]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <UserPlusIcon className="w-5 h-5 text-blue-500"/>
                        Lưu lượng bệnh nhân theo giờ
                    </h2>
                    <select className="bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-xs font-bold px-3 py-1 cursor-pointer outline-none">
                        <option>Hôm nay</option>
                        <option>Hôm qua</option>
                    </select>
                </div>
                 <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#f1f5f9'} />
                        <XAxis dataKey="hour" tick={{fill: tickColor, fontSize: 12}} axisLine={false} tickLine={false} dy={10} />
                        <YAxis allowDecimals={false} tick={{fill: tickColor, fontSize: 12}} axisLine={false} tickLine={false} />
                        <Tooltip 
                            cursor={{fill: theme === 'dark' ? '#334155' : '#f8fafc', opacity: 0.4}}
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            labelStyle={{color: theme === 'dark' ? '#e2e8f0' : '#64748b', fontWeight: 'bold', marginBottom: '5px'}}
                        />
                        <Bar dataKey="patients" name="Bệnh nhân" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
