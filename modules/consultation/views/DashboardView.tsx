
import React, { useState, useEffect } from 'react';
import { 
    HeartIcon, 
    UserGroupIcon, 
    SparklesIcon, 
    ClockIcon, 
    CheckCircleIcon,
    ClipboardListIcon,
    ChevronRightIcon,
    PlayIcon
} from '../../../components/Icons';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../../../services/socketService';
import { useNotification } from '../../../contexts/NotificationContext';
import { useSession } from '../../../contexts/SessionContext';

const DoctorStatCard = ({title, value, icon, color}: any) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold">{title}</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${color} text-white shadow-md`}>
            {icon}
        </div>
    </div>
);

const DashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const { hasPermission } = useSession();
  
  // Chuyển sang State để có thể cập nhật Real-time
  const [waitingPatients, setWaitingPatients] = useState([
    { id: 'P003', name: 'Lê Hoàng Cường', age: 45, gender: 'Nam', reason: 'Đau đầu, chóng mặt', waitTime: '15p', priority: 'Normal', status: 'waiting', isNew: false },
    { id: 'P004', name: 'Phạm Thị Dung', age: 22, gender: 'Nữ', reason: 'Tái khám dạ dày', waitTime: '30p', priority: 'Normal', status: 'waiting', isNew: false },
  ]);

  // LẮNG NGHE BỆNH NHÂN MỚI TỪ TIẾP ĐÓN
  useEffect(() => {
    const handleNewPatient = (data: any) => {
        // Thêm vào danh sách chờ với hiệu ứng 'isNew'
        const newEntry = {
            id: data.id,
            name: data.name,
            age: data.age || 30,
            gender: data.gender || 'Nam',
            reason: data.reason || 'Khám bệnh',
            waitTime: '0p',
            priority: data.priority || 'Normal',
            status: 'waiting',
            isNew: true // Để hiển thị hiệu ứng highlight
        };

        setWaitingPatients(prev => [newEntry, ...prev]);
        
        // Thông báo cho bác sĩ
        addNotification(
            "Bệnh nhân mới", 
            `Có BN ${data.name} vừa đăng ký vào phòng khám của bạn.`, 
            "info", 
            undefined, 
            true
        );

        // Sau 5 giây thì tắt hiệu ứng highlight
        setTimeout(() => {
            setWaitingPatients(current => 
                current.map(p => p.id === data.id ? { ...p, isNew: false } : p)
            );
        }, 5000);
    };

    socketService.on('new_patient_to_clinic', handleNewPatient);
    return () => socketService.off('new_patient_to_clinic', handleNewPatient);
  }, []);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight">Bàn khám Bác sĩ</h1>
            <p className="text-slate-500 text-sm">Khoa Nội Tổng Quát - Real-time Sync Active</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 text-blue-700 font-bold text-sm flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div> Live Monitoring
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DoctorStatCard title="Chờ khám" value={waitingPatients.length} icon={<UserGroupIcon className="w-5 h-5"/>} color="bg-amber-500" />
        <DoctorStatCard title="Đang khám" value="1" icon={<HeartIcon className="w-5 h-5"/>} color="bg-blue-600" />
        <DoctorStatCard title="Hoàn tất" value="12" icon={<CheckCircleIcon className="w-5 h-5"/>} color="bg-emerald-500" />
        <DoctorStatCard title="AI Hỗ trợ" value="8" icon={<SparklesIcon className="w-5 h-5"/>} color="bg-purple-500" />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden flex-1">
            <div className="p-4 border-b border-slate-200 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2">
                    <ClipboardListIcon className="w-5 h-5 text-blue-600"/> Danh sách chờ khám
                </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {waitingPatients.map(p => (
                    <div 
                        key={p.id} 
                        className={`group border rounded-xl p-4 transition-all flex justify-between items-center relative overflow-hidden ${
                            p.isNew 
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 ring-2 ring-blue-200 animate-pulse' 
                            : 'bg-white dark:bg-slate-800 border-slate-200'
                        }`}
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shadow-sm">
                                {p.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white">{p.name}</h3>
                                <p className="text-xs text-slate-500">{p.gender}, {p.age} tuổi • ID: {p.id}</p>
                                <p className="text-sm text-slate-600 mt-1"><span className="text-slate-400">Lý do:</span> {p.reason}</p>
                            </div>
                        </div>
                        {hasPermission('02.01') && (
                            <button 
                                onClick={() => navigate(`/consultation/record/${p.id}`)}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition transform active:scale-95"
                            >
                                Khám ngay
                            </button>
                        )}
                    </div>
                ))}
            </div>
      </div>
    </div>
  );
};

export default DashboardView;
