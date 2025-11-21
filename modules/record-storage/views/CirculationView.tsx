
import React, { useState } from 'react';
import { SwitchHorizontalIcon, UserGroupIcon, ClockIcon, CheckIcon, PlusIcon } from '../../../components/Icons';

const mockLoans = [
    { id: 'L01', recordId: '21024061', patientName: 'Nguyễn Văn An', borrower: 'BS. Lê Văn C (KHTH)', borrowDate: '30/10/2023', dueDate: '06/11/2023', status: 'Borrowed' },
    { id: 'L02', recordId: '23011618', patientName: 'Phạm Thị Dung', borrower: 'Điều dưỡng Trưởng (Sản)', borrowDate: '25/10/2023', dueDate: '01/11/2023', status: 'Overdue' },
];

const CirculationView: React.FC = () => {
    const [loans, setLoans] = useState(mockLoans);

    const handleReturn = (id: string) => {
        if (window.confirm("Xác nhận đã nhận lại hồ sơ?")) {
            setLoans(loans.filter(l => l.id !== id));
        }
    };

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quản lý Mượn - Trả</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Theo dõi lưu thông hồ sơ bệnh án.</p>
                </div>
                <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow flex items-center gap-2">
                    <PlusIcon className="w-5 h-5"/> Tạo phiếu mượn
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loans.map(loan => (
                    <div key={loan.id} className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow border-l-4 ${loan.status === 'Overdue' ? 'border-l-red-500' : 'border-l-teal-500'} border-slate-200 dark:border-slate-700`}>
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white">{loan.patientName}</h3>
                                <p className="font-mono text-sm text-slate-500">ID: {loan.recordId}</p>
                            </div>
                            {loan.status === 'Overdue' ? (
                                <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">Quá hạn</span>
                            ) : (
                                <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-bold rounded">Đang mượn</span>
                            )}
                        </div>
                        
                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
                            <div className="flex items-center gap-2">
                                <UserGroupIcon className="w-4 h-4 text-slate-400"/>
                                <span>{loan.borrower}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <SwitchHorizontalIcon className="w-4 h-4 text-slate-400"/>
                                <span>Ngày mượn: {loan.borrowDate}</span>
                            </div>
                            <div className="flex items-center gap-2 font-medium text-orange-600">
                                <ClockIcon className="w-4 h-4"/>
                                <span>Hạn trả: {loan.dueDate}</span>
                            </div>
                        </div>

                        <button 
                            onClick={() => handleReturn(loan.id)}
                            className="w-full py-2 bg-slate-100 hover:bg-teal-50 text-teal-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:text-teal-300 dark:hover:bg-slate-600 rounded font-bold text-sm flex items-center justify-center gap-2 transition"
                        >
                            <CheckIcon className="w-4 h-4"/> Xác nhận trả
                        </button>
                    </div>
                ))}
                
                {/* Empty State Placeholder */}
                {loans.length === 0 && (
                    <div className="col-span-full text-center p-10 text-slate-400">
                        Không có hồ sơ nào đang được mượn.
                    </div>
                )}
            </div>
        </div>
    );
};

export default CirculationView;
