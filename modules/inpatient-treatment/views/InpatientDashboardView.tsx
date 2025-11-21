
import React from 'react';
import { HeartIcon, UserGroupIcon, SparklesIcon, HospitalIcon } from '../../../components/Icons';
import { useNavigate } from 'react-router-dom';

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

const InpatientDashboardView: React.FC = () => {
  const navigate = useNavigate();

  const handleOpenRecord = (patientId: string) => {
      navigate(`/inpatient-treatment/record/${patientId}`);
  };

  return (
    <div className="space-y-6">
      <p className="text-slate-500 dark:text-slate-400 -mt-2">Tổng quan tình hình điều trị nội trú tại khoa.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Hiện diện" value="32" icon={<HospitalIcon className="w-6 h-6 text-white"/>} color="bg-indigo-500" />
        <DashboardCard title="Nhập mới" value="4" icon={<UserGroupIcon className="w-6 h-6 text-white"/>} color="bg-green-500" />
        <DashboardCard title="Chờ xuất viện" value="6" icon={<HeartIcon className="w-6 h-6 text-white"/>} color="bg-amber-500" />
        <DashboardCard title="Cảnh báo AI" value="2" icon={<SparklesIcon className="w-6 h-6 text-white"/>} color="bg-red-500" />
      </div>

       <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4">Bệnh nhân cần chú ý</h2>
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
                        Xem hồ sơ
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
                        Xem hồ sơ
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default InpatientDashboardView;
