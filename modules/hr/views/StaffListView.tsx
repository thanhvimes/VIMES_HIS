
import React, { useState } from 'react';
import { mockStaff } from '../data';
import { SearchIcon, PlusIcon, FilterIcon, PhoneIcon, BriefcaseIcon, UserGroupIcon } from '../../../components/Icons';
import { AcademicCapIcon } from '../icons';

const StaffListView: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [staffs] = useState(mockStaff);

    const filteredStaff = staffs.filter(s => 
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.department.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'Active': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Chính thức</span>;
            case 'Probation': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">Thử việc</span>;
            case 'OnLeave': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">Nghỉ phép</span>;
            default: return null;
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <UserGroupIcon className="w-8 h-8 text-rose-600"/> Hồ sơ Nhân sự
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý thông tin chi tiết cán bộ công nhân viên.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm tên, khoa phòng..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-rose-500"
                        />
                    </div>
                    <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow flex items-center gap-2 transition transform active:scale-95">
                        <PlusIcon className="w-5 h-5"/> Thêm nhân sự
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-16">#</th>
                                <th className="p-4">Họ và tên</th>
                                <th className="p-4">Chức vụ / Khoa</th>
                                <th className="p-4">Liên hệ</th>
                                <th className="p-4">Ngày vào</th>
                                <th className="p-4">Chứng chỉ HN</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                            {filteredStaff.map((s, idx) => (
                                <tr key={s.id} className="hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors group cursor-pointer">
                                    <td className="p-4 text-slate-400">{idx + 1}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img src={s.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm"/>
                                            <div>
                                                <div className="font-bold text-slate-800 dark:text-white">{s.fullName}</div>
                                                <div className="text-xs text-slate-500 font-mono">{s.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-slate-700 dark:text-slate-200">{s.role}</div>
                                        <div className="text-xs text-slate-500">{s.department}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                            <PhoneIcon className="w-3 h-3"/> {s.phone}
                                        </div>
                                        <div className="text-xs text-slate-400">{s.email}</div>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">
                                        {new Date(s.joinDate).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="p-4">
                                        {s.licenseNumber !== '---' ? (
                                            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-mono text-xs bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded w-fit">
                                                <AcademicCapIcon className="w-3 h-3"/> {s.licenseNumber}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs italic">Chưa cập nhật</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {getStatusBadge(s.status)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded border border-rose-200 font-bold text-xs transition">
                                            Chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StaffListView;
