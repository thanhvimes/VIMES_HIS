
import React from 'react';
import { HeartIcon, UserGroupIcon, SparklesIcon, HospitalIcon, ClockIcon, ActivityIcon } from '../../../components/Icons';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../../contexts/SessionContext';

const DashboardCard: React.FC<{title: string; value: string; icon: React.ReactNode; color: string; subtext?: string}> = ({title, value, icon, color, subtext}) => (
    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
        <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full ${color}`}>
                {icon}
            </div>
            <div>
                <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wider">{title}</h3>
                <p className="text-3xl font-bold text-onSurface dark:text-dark-onSurface">{value}</p>
                {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
            </div>
        </div>
    </div>
);

const InpatientDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSession();
  const isNurse = user?.role === 'nurse';

  const handleOpenRecord = (patientId: string) => {
      navigate(`/inpatient-treatment/record/${patientId}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                {isNurse ? 'Trạm Điều dưỡng (Nursing Station)' : 'Tổng quan Điều trị (Doctors Dashboard)'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {isNurse ? 'Theo dõi người bệnh, thực hiện thuốc và chăm sóc.' : 'Theo dõi diễn biến, ra y lệnh và hội chẩn.'}
            </p>
          </div>
      </div>
      
      {/* Dynamic Widgets based on Role */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
            title="Hiện diện" 
            value="32" 
            icon={<HospitalIcon className="w-6 h-6 text-white"/>} 
            color="bg-indigo-500" 
        />
        
        {isNurse ? (
            <>
                <DashboardCard 
                    title="Chờ thực hiện thuốc" 
                    value="12" 
                    subtext="Trong 1 giờ tới"
                    icon={<ClockIcon className="w-6 h-6 text-white"/>} 
                    color="bg-orange-500" 
                />
                <DashboardCard 
                    title="Cần đo sinh hiệu" 
                    value="8" 
                    icon={<ActivityIcon className="w-6 h-6 text-white"/>} 
                    color="bg-pink-500" 
                />
            </>
        ) : (
            <>
                <DashboardCard 
                    title="Chờ ký lệnh" 
                    value="5" 
                    icon={<SparklesIcon className="w-6 h-6 text-white"/>} 
                    color="bg-blue-500" 
                />
                <DashboardCard 
                    title="Chờ xuất viện" 
                    value="6" 
                    icon={<HeartIcon className="w-6 h-6 text-white"/>} 
                    color="bg-green-500" 
                />
            </>
        )}
        
        <DashboardCard 
            title="Cảnh báo nặng" 
            value="2" 
            subtext="Phòng 301, 305"
            icon={<ExclamationCircleIcon className="w-6 h-6 text-white"/>} 
            color="bg-red-500" 
        />
      </div>

      {/* Patient List */}
       <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">
                {isNurse ? 'Danh sách cần chăm sóc' : 'Bệnh nhân cần chú ý'}
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                <div className="flex justify-between items-center text-sm p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div>
                        <p className="font-medium text-onSurface dark:text-dark-onSurface">Lê Hoàng Cường (P.301 - G.02)</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Chẩn đoán: Viêm phổi nặng | <span className="text-red-500 font-semibold">Sốt cao liên tục</span></p>
                    </div>
                    <button 
                        onClick={() => handleOpenRecord('P003')}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        {isNurse ? 'Chăm sóc' : 'Xem hồ sơ'}
                    </button>
                </div>
                 <div className="flex justify-between items-center text-sm p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div>
                        <p className="font-medium text-onSurface dark:text-dark-onSurface">Phạm Thị Dung (P.302 - G.01)</p>
                        <p className="text-slate-500 dark:text-slate-400 text-xs">Chẩn đoán: Hậu phẫu ruột thừa (Ngày 2)</p>
                    </div>
                    <button 
                        onClick={() => handleOpenRecord('P004')}
                        className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                        {isNurse ? 'Chăm sóc' : 'Xem hồ sơ'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

// Helper Icon
const ExclamationCircleIcon = ({ className = 'w-6 h-6', ...props }: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default InpatientDashboardView;
