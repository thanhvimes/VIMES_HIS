
import React, { useState, useEffect } from 'react';
import { HospitalIcon, UserGroupIcon, ClockIcon } from '../../../components/Icons';

// Mock Data
const mockWaitingPatients = [
    { id: 'P001', name: 'Nguyễn Văn A', status: 'recovery', room: 'OR1', time: '10:30' },
    { id: 'P002', name: 'Trần Thị B', status: 'surgery', room: 'OR2', time: '09:00' },
    { id: 'P003', name: 'Lê Hoàng C', status: 'surgery', room: 'OR3', time: '08:45' },
    { id: 'P004', name: 'Phạm Thị D', status: 'pre-op', room: 'OR1', time: '13:00' },
    { id: 'P005', name: 'Hoàng Văn E', status: 'finished', room: 'OR2', time: '07:30' },
];

const SurgeryWaitingRoomView: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const maskName = (name: string) => {
        const parts = name.split(' ');
        if (parts.length > 1) {
            return parts.slice(0, parts.length - 1).join(' ') + ' ***';
        }
        return name;
    };

    const getStatusDisplay = (status: string) => {
        switch(status) {
            case 'pre-op': return { text: 'CHUẨN BỊ', color: 'bg-yellow-500', textColor: 'text-yellow-500' };
            case 'surgery': return { text: 'ĐANG PHẪU THUẬT', color: 'bg-red-600', textColor: 'text-red-600 animate-pulse' };
            case 'recovery': return { text: 'HỒI TỈNH', color: 'bg-blue-500', textColor: 'text-blue-500' };
            case 'finished': return { text: 'ĐÃ VỀ KHOA', color: 'bg-green-600', textColor: 'text-green-600' };
            default: return { text: 'KHÔNG RÕ', color: 'bg-gray-500', textColor: 'text-gray-500' };
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#0f172a] text-white flex flex-col overflow-hidden font-sans">
            {/* Header */}
            <div className="px-8 py-6 bg-slate-900 border-b border-slate-700 flex justify-between items-center shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="p-3 bg-blue-600 rounded-xl">
                        <HospitalIcon className="w-10 h-10 text-white"/>
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold uppercase tracking-wider text-blue-400">Khu Vực Phòng Mổ</h1>
                        <p className="text-xl text-slate-400 mt-1">Thông tin trạng thái người bệnh</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-5xl font-mono font-bold text-white mb-1">
                        {currentTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="text-xl text-slate-400 uppercase">
                        {currentTime.toLocaleDateString('vi-VN', {weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'})}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 p-8 overflow-hidden">
                <div className="grid grid-cols-1 gap-4 h-full">
                    
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 text-xl font-bold text-slate-400 uppercase border-b-2 border-slate-700 pb-4 mb-2 px-4">
                        <div className="col-span-4">Họ và tên người bệnh</div>
                        <div className="col-span-2 text-center">Phòng mổ</div>
                        <div className="col-span-2 text-center">Giờ vào</div>
                        <div className="col-span-4 text-center">Trạng thái hiện tại</div>
                    </div>

                    {/* Rows */}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {mockWaitingPatients.map((p, idx) => {
                            const statusInfo = getStatusDisplay(p.status);
                            return (
                                <div key={idx} className="grid grid-cols-12 gap-4 items-center bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-lg">
                                    <div className="col-span-4 text-3xl font-bold text-white truncate">
                                        {maskName(p.name)}
                                    </div>
                                    <div className="col-span-2 text-2xl font-mono text-slate-300 text-center font-bold">
                                        {p.room}
                                    </div>
                                    <div className="col-span-2 text-2xl font-mono text-slate-300 text-center">
                                        {p.time}
                                    </div>
                                    <div className="col-span-4 flex justify-center">
                                        <span className={`px-6 py-2 rounded-full text-xl font-bold border-2 uppercase shadow-inner ${
                                            p.status === 'surgery' 
                                            ? 'bg-red-900/30 text-red-400 border-red-600/50 animate-pulse' 
                                            : p.status === 'recovery' 
                                            ? 'bg-blue-900/30 text-blue-400 border-blue-600/50'
                                            : p.status === 'finished'
                                            ? 'bg-green-900/30 text-green-400 border-green-600/50'
                                            : 'bg-yellow-900/30 text-yellow-400 border-yellow-600/50'
                                        }`}>
                                            {statusInfo.text}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer Ticker */}
            <div className="bg-slate-900 py-3 border-t border-slate-800 overflow-hidden whitespace-nowrap">
                <div className="inline-block animate-marquee text-xl text-slate-400 px-4">
                    Lưu ý: Thông tin trên màn hình chỉ mang tính chất tham khảo. Người nhà vui lòng giữ trật tự và chờ thông báo từ nhân viên y tế. --- Hotline Phòng Mổ: 024.1234.5678
                </div>
            </div>
        </div>
    );
};

export default SurgeryWaitingRoomView;
