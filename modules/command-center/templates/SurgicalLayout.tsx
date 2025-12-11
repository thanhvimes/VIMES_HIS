
import React from 'react';
import { 
    ScissorsIcon, 
    ClockIcon, 
    UserGroupIcon,
    CheckBadgeIcon,
    ExclamationCircleIcon
} from '../../../components/Icons';
import { KPICard } from '../components/Widgets';

// Mock Data for Surgery
const surgeryRooms = [
    { id: 'OR1', name: 'Phòng Mổ 1 (Chấn thương)', status: 'active', current: 'Kết hợp xương đùi', surgeon: 'BS. Hùng', progress: 70 },
    { id: 'OR2', name: 'Phòng Mổ 2 (Tiêu hóa)', status: 'cleaning', current: '-', surgeon: '-', progress: 0 },
    { id: 'OR3', name: 'Phòng Mổ 3 (Sản)', status: 'active', current: 'Mổ lấy thai', surgeon: 'BS. Lan', progress: 90 },
    { id: 'OR4', name: 'Phòng Mổ 4 (Tiểu phẫu)', status: 'waiting', current: 'Chuẩn bị: Cắt u bì', surgeon: 'BS. Tuấn', progress: 0 },
];

const postOpStatus = [
    { id: 'P01', name: 'Nguyễn Văn A', timeOut: '10:30', status: 'Hồi tỉnh', vitals: 'Ổn định' },
    { id: 'P02', name: 'Trần Thị B', timeOut: '09:15', status: 'Chuyển khoa', vitals: 'Chuyển Khoa Sản' },
    { id: 'P03', name: 'Lê Văn C', timeOut: '11:00', status: 'Hồi tỉnh', vitals: 'HA hơi thấp' },
];

const SurgicalLayout: React.FC = () => {
    return (
        <div className="grid grid-cols-12 gap-4 lg:gap-6 h-full overflow-hidden">
            
            {/* TOP METRICS ROW */}
            <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-4 h-fit">
                <KPICard 
                    title="Tổng ca mổ" 
                    value="18" 
                    subtext="Phiên: 15 | Cấp cứu: 3"
                    icon={<ScissorsIcon/>} 
                    color="text-teal-600"
                />
                <KPICard 
                    title="Đang phẫu thuật" 
                    value="2" 
                    subtext="Trên 4 phòng mổ"
                    icon={<ActivityIcon/>} 
                    color="text-blue-600"
                />
                 <KPICard 
                    title="Hậu phẫu / Hồi tỉnh" 
                    value="6" 
                    subtext="Cần theo dõi sát"
                    icon={<ClockIcon/>} 
                    color="text-purple-600"
                />
                 <KPICard 
                    title="Tai biến / Sự cố" 
                    value="0" 
                    subtext="Trong 24h qua"
                    icon={<ExclamationCircleIcon/>} 
                    color="text-green-600"
                />
            </div>

            {/* MIDDLE: OR STATUS BOARD */}
            <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm overflow-hidden flex flex-col">
                <h3 className="font-bold text-slate-700 dark:text-white mb-4 uppercase flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Trực tiếp Phòng mổ
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1">
                    {surgeryRooms.map(room => (
                        <div key={room.id} className={`p-4 rounded-lg border-l-4 shadow-sm ${
                            room.status === 'active' ? 'bg-red-50 border-red-500 dark:bg-red-900/10' :
                            room.status === 'cleaning' ? 'bg-yellow-50 border-yellow-500 dark:bg-yellow-900/10' :
                            'bg-green-50 border-green-500 dark:bg-green-900/10'
                        }`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-slate-800 dark:text-white">{room.name}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                                    room.status === 'active' ? 'bg-red-200 text-red-800' :
                                    room.status === 'cleaning' ? 'bg-yellow-200 text-yellow-800' :
                                    'bg-green-200 text-green-800'
                                }`}>
                                    {room.status === 'active' ? 'Đang mổ' : room.status === 'cleaning' ? 'Vệ sinh' : 'Sẵn sàng'}
                                </span>
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300 mb-1">
                                <strong>Thủ thuật:</strong> {room.current}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                                <strong>PTV:</strong> {room.surgeon}
                            </div>
                            {room.status === 'active' && (
                                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full transition-all duration-1000" style={{width: `${room.progress}%`}}></div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: POST-OP RECOVERY */}
            <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm overflow-hidden flex flex-col">
                <h3 className="font-bold text-slate-700 dark:text-white mb-4 uppercase flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-purple-600"/> Khu Hồi Tỉnh
                </h3>
                <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                    {postOpStatus.map((p) => (
                        <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-700">
                            <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200 mb-1">
                                <span>{p.name}</span>
                                <span className="text-slate-500 text-xs">{p.timeOut}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">{p.status}</span>
                                <span className={p.vitals.includes('thấp') ? 'text-red-500 font-bold animate-pulse' : 'text-green-600'}>
                                    {p.vitals}
                                </span>
                            </div>
                        </div>
                    ))}
                    {postOpStatus.length === 0 && <p className="text-center text-slate-400 italic">Không có bệnh nhân.</p>}
                </div>
            </div>
        </div>
    );
};

// Helper for Icon
const ActivityIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

export default SurgicalLayout;
