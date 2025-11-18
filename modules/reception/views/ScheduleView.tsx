import React, { useState } from 'react';
import { Appointment, AppointmentStatus } from '../../../types';
import { CalendarIcon, UserPlusIcon } from '../../../components/Icons';

const mockAppointments: Appointment[] = [
    { id: 'A001', patientName: 'Trần Thị Bích', patientId: 'P002', time: '09:00', doctor: 'Dr. Minh', reason: 'Khám thai định kỳ', status: AppointmentStatus.Completed },
    { id: 'A002', patientName: 'Phạm Thị Dung', patientId: 'P004', time: '09:30', doctor: 'Dr. Minh', reason: 'Tái khám', status: AppointmentStatus.Waiting },
    { id: 'A003', patientName: 'Nguyễn Văn An', patientId: 'P001', time: '10:00', doctor: 'Dr. Minh', reason: 'Khám tổng quát', status: AppointmentStatus.Scheduled },
    { id: 'A004', patientName: 'Lê Hoàng Cường', patientId: 'P003', time: '10:30', doctor: 'Dr. Minh', reason: 'Đau đầu', status: AppointmentStatus.Scheduled },
];


const getStatusClass = (status: AppointmentStatus) => {
    switch (status) {
        case AppointmentStatus.Completed: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
        case AppointmentStatus.Waiting: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
        case AppointmentStatus.Cancelled: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
        default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
    }
};

const ScheduleView: React.FC = () => {
    const [appointments, setAppointments] = useState(mockAppointments);
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Appointment List */}
            <div className="lg:col-span-2 bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Lịch hẹn trong ngày</h2>
                    <input
                        type="date"
                        value={currentDate}
                        onChange={(e) => setCurrentDate(e.target.value)}
                        className="p-2 text-sm bg-inherit border border-slate-300 dark:border-slate-600 rounded-md"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                                <th className="p-3">Giờ</th>
                                <th className="p-3">Bệnh nhân</th>
                                <th className="p-3">Lý do khám</th>
                                <th className="p-3 text-center">Trạng thái</th>
                                <th className="p-3 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map(apt => (
                                <tr key={apt.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                    <td className="p-3 font-semibold text-primary dark:text-dark-primary">{apt.time}</td>
                                    <td className="p-3 font-medium text-onSurface dark:text-dark-onSurface">{apt.patientName}</td>
                                    <td className="p-3 text-slate-600 dark:text-slate-300">{apt.reason}</td>
                                    <td className="p-3 text-center">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(apt.status)}`}>
                                            {apt.status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-right">
                                        <button className="text-primary dark:text-dark-primary hover:underline">Chi tiết</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Add Appointment Form */}
            <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                 <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center">
                    <UserPlusIcon className="w-6 h-6 mr-2 text-primary dark:text-dark-primary"/>
                    Thêm lịch hẹn mới
                 </h2>
                 <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Tìm bệnh nhân</label>
                        <input type="text" placeholder="Nhập tên hoặc SĐT..." className="w-full p-2 bg-inherit border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Giờ hẹn</label>
                        <input type="time" className="w-full p-2 bg-inherit border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">Lý do khám</label>
                        <textarea rows={3} className="w-full p-2 bg-inherit border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"></textarea>
                    </div>
                    <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105 flex items-center justify-center">
                        <CalendarIcon className="w-5 h-5 mr-2"/>
                        Đặt lịch
                    </button>
                 </form>
            </div>
        </div>
    );
};

export default ScheduleView;
