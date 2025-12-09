
import React, { useState } from 'react';
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

// Mock Waiting List
const waitingPatients = [
    { id: 'P003', name: 'Lê Hoàng Cường', age: 45, gender: 'Nam', reason: 'Đau đầu, chóng mặt, buồn nôn', waitTime: '15p', priority: 'Normal', status: 'waiting' },
    { id: 'P005', name: 'Hoàng Văn Em', age: 12, gender: 'Nam', reason: 'Sốt cao 39 độ, ho nhiều', waitTime: '05p', priority: 'Emergency', status: 'waiting' },
    { id: 'P004', name: 'Phạm Thị Dung', age: 22, gender: 'Nữ', reason: 'Tái khám dạ dày', waitTime: '30p', priority: 'Normal', status: 'waiting' },
];

const inProgressPatients = [
    { id: 'P002', name: 'Trần Thị Bích', age: 31, gender: 'Nữ', reason: 'Đau bụng dưới', time: '10:15', status: 'processing' }
];

const DashboardView: React.FC = () => {
  const navigate = useNavigate();

  const handleStartExam = (patientId: string) => {
      navigate(`/consultation/record/${patientId}`);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Bàn khám Bác sĩ</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Xin chào, BS. Trần Văn Minh - Khoa Nội Tổng Quát</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-sm flex items-center gap-2">
              <ClockIcon className="w-5 h-5"/> Ca làm việc: Sáng (07:30 - 11:30)
          </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DoctorStatCard title="Chờ khám" value={waitingPatients.length} icon={<UserGroupIcon className="w-5 h-5"/>} color="bg-amber-500" />
        <DoctorStatCard title="Đang khám" value={inProgressPatients.length} icon={<HeartIcon className="w-5 h-5"/>} color="bg-blue-600" />
        <DoctorStatCard title="Hoàn tất" value="12" icon={<CheckCircleIcon className="w-5 h-5"/>} color="bg-emerald-500" />
        <DoctorStatCard title="AI Hỗ trợ" value="8" icon={<SparklesIcon className="w-5 h-5"/>} color="bg-purple-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Main Column: Waiting List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ClipboardListIcon className="w-5 h-5 text-blue-600"/> Danh sách chờ khám
                </h2>
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">{waitingPatients.length} bệnh nhân</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {waitingPatients.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">Không có bệnh nhân chờ.</div>
                ) : (
                    waitingPatients.map(p => (
                        <div key={p.id} className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center relative overflow-hidden">
                            {p.priority === 'Emergency' && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>}
                            
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm ${p.priority === 'Emergency' ? 'bg-red-500' : 'bg-blue-500'}`}>
                                    {p.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-800 dark:text-white text-base">{p.name}</h3>
                                        {p.priority === 'Emergency' && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Cấp cứu</span>}
                                    </div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{p.gender}, {p.age} tuổi • ID: {p.id}</p>
                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-1 line-clamp-1">
                                        <span className="text-slate-400 font-normal">Lý do:</span> {p.reason}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs text-slate-400 font-bold uppercase">Thời gian chờ</p>
                                    <p className="text-lg font-mono font-bold text-orange-500">{p.waitTime}</p>
                                </div>
                                <button 
                                    onClick={() => handleStartExam(p.id)}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95 whitespace-nowrap"
                                >
                                    <PlayIcon className="w-5 h-5"/> Khám ngay
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Right Column: In Progress & Recent */}
        <div className="flex flex-col gap-6">
            {/* Active Session */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-5 border border-blue-100 dark:border-blue-800 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4 relative z-10">
                    <h3 className="font-bold text-blue-800 dark:text-blue-300 uppercase text-sm flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        Đang khám
                    </h3>
                </div>
                
                {inProgressPatients.length > 0 ? (
                    inProgressPatients.map(p => (
                        <div key={p.id} className="relative z-10">
                            <h4 className="text-xl font-bold text-slate-800 dark:text-white">{p.name}</h4>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{p.gender}, {p.age}T - {p.reason}</p>
                            <button 
                                onClick={() => handleStartExam(p.id)}
                                className="w-full py-2 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold rounded-lg border border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-slate-700 transition shadow-sm"
                            >
                                Tiếp tục khám &rarr;
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 italic text-sm relative z-10">Hiện chưa có bệnh nhân nào đang khám.</p>
                )}
                {/* Decor */}
                <HeartIcon className="absolute -bottom-4 -right-4 w-32 h-32 text-blue-100 dark:text-blue-900 opacity-50 z-0"/>
            </div>

            {/* Recent History */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200">
                    Vừa hoàn tất
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                     <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition flex justify-between items-center group">
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Nguyễn Văn An</p>
                            <p className="text-xs text-green-600 font-medium">Đã kê đơn</p>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform"/>
                     </div>
                      <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition flex justify-between items-center group">
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Trần Thị Cúc</p>
                            <p className="text-xs text-blue-600 font-medium">Chỉ định CLS</p>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform"/>
                     </div>
                </div>
                <div className="p-3 border-t border-slate-100 dark:border-slate-700 text-center">
                    <button onClick={() => navigate('/consultation/list')} className="text-xs text-blue-600 font-bold hover:underline">Xem tất cả</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
