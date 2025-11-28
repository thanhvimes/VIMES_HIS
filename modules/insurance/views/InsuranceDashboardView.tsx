
import React from 'react';
import { 
    CheckCircleIcon, 
    ExclamationCircleIcon, 
    PaperAirplaneIcon, 
    CreditCardIcon,
    ChartBarIcon
} from '../../../components/Icons';

const DashboardCard: React.FC<{title: string; value: string; icon: React.ReactNode; color: string; subtext?: string}> = ({title, value, icon, color, subtext}) => (
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

const InsuranceDashboardView: React.FC = () => {
  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tổng quan Bảo hiểm Y tế</h1>
            <div className="text-sm text-slate-500">Dữ liệu tháng 11/2023</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard 
                title="Hồ sơ chờ đẩy" 
                value="15" 
                icon={<PaperAirplaneIcon className="w-6 h-6 text-white"/>} 
                color="bg-blue-500" 
                subtext="Cần xử lý trước 4:00 PM"
            />
            <DashboardCard 
                title="Đã giám định" 
                value="1,240" 
                icon={<CheckCircleIcon className="w-6 h-6 text-white"/>} 
                color="bg-green-500" 
                subtext="Tỷ lệ chấp nhận: 98.5%"
            />
            <DashboardCard 
                title="Bị từ chối / Lỗi" 
                value="12" 
                icon={<ExclamationCircleIcon className="w-6 h-6 text-white"/>} 
                color="bg-red-500" 
                subtext="Cần kiểm tra lại thông tin"
            />
            <DashboardCard 
                title="Tổng tiền đề nghị" 
                value="4.5 Tỷ" 
                icon={<CreditCardIcon className="w-6 h-6 text-white"/>} 
                color="bg-orange-500" 
                subtext="Trong tháng này"
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-blue-600"/> Tình trạng gửi hồ sơ (7 ngày qua)
                </h3>
                <div className="h-64 flex items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    Biểu đồ sẽ hiển thị tại đây (Chart Component)
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <ExclamationCircleIcon className="w-5 h-5 text-red-500"/> Các lỗi xuất toán thường gặp
                </h3>
                <ul className="space-y-3">
                    <li className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-800/30">
                        <span className="text-sm text-slate-700 dark:text-slate-300">Sai mã KCB ban đầu</span>
                        <span className="font-bold text-red-600">5 hồ sơ</span>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-800/30">
                         <span className="text-sm text-slate-700 dark:text-slate-300">Thiếu ngày ra viện</span>
                         <span className="font-bold text-red-600">3 hồ sơ</span>
                    </li>
                    <li className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-800/30">
                         <span className="text-sm text-slate-700 dark:text-slate-300">Chênh lệch tổng tiền</span>
                         <span className="font-bold text-red-600">2 hồ sơ</span>
                    </li>
                </ul>
            </div>
        </div>
    </div>
  );
};

export default InsuranceDashboardView;
