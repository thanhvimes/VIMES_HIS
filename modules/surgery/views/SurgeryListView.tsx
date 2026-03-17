
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    SearchIcon,
    PlusIcon,
    FilterIcon,
    CalendarIcon,
    UserGroupIcon,
    ClipboardListIcon,
    ClockIcon,
    PlayIcon,
    CheckCircleIcon,
    EyeIcon,
    TrashIcon,
    ScissorsIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { FormDateInput } from '../../../components/shared/forms';
import { SurgerySchedule } from '../../../types';
import { mockSurgeries, resources } from '../data';
import SurgeryScheduleModal from './SurgeryScheduleModal';

const SurgeryListView: React.FC = () => {
    const { fontSettings } = useTheme();
    const navigate = useNavigate();
    const [surgeries, setSurgeries] = useState<SurgerySchedule[]>(mockSurgeries);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().slice(0, 10));
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // --- Filter Logic ---
    const filteredSurgeries = useMemo(() => {
        return surgeries.filter(s => {
            const matchesSearch = s.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.surgeonName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

            // Optional: Filter by date or show all if date filter is cleared (not implemented in UI yet, default is today)
            // For list view, maybe we want to see broader range, but let's stick to date picker for now
            const matchesDate = !dateFilter || s.date === dateFilter;

            return matchesSearch && matchesStatus && matchesDate;
        }).sort((a, b) => a.startTime.localeCompare(b.startTime));
    }, [surgeries, searchTerm, statusFilter, dateFilter]);

    // --- Actions ---
    const handleAddSurgery = (newSchedule: Omit<SurgerySchedule, 'id' | 'status'>) => {
        const schedule: SurgerySchedule = {
            ...newSchedule,
            id: `S${Date.now()}`,
            status: 'scheduled'
        };
        setSurgeries([...surgeries, schedule]);
    };

    const handleOpenDetail = (id: string) => {
        navigate(`/surgery/detail/${id}`);
    };

    const handleOpenEMR = (patientId: string) => {
        navigate(`/consultation/record/${patientId}`);
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>, id: string) => {
        e.stopPropagation();
        setSurgeries(prev => prev.map(s => s.id === id ? { ...s, status: e.target.value as any } : s));
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 hover:bg-green-200';
            case 'in-progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 hover:bg-blue-200 animate-pulse';
            case 'emergency': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 hover:bg-red-200';
            case 'scheduled': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-200 hover:bg-gray-200';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getRoomName = (id: string) => {
        return resources.find(r => r.id === id)?.name || id;
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <ClipboardListIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Danh sách Phẫu thuật</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý danh sách bệnh nhân và lịch mổ.</p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
                    <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <FormDateInput
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className={`!pl-9 !p-2 w-36 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                        />
                    </div>
                    <div className="relative flex-1 min-w-[200px]">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm bệnh nhân, Bác sĩ..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                        />
                    </div>
                    <div className="relative">
                        <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className={`pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer ${fontSettings.controls}`}
                        >
                            <option value="All">Tất cả trạng thái</option>
                            <option value="scheduled">Chờ mổ</option>
                            <option value="in-progress">Đang mổ</option>
                            <option value="completed">Hoàn tất</option>
                            <option value="emergency">Cấp cứu</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-md whitespace-nowrap"
                    >
                        <PlusIcon className="w-5 h-5" /> <span className="hidden sm:inline">Đặt lịch mổ</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-24 text-center">Giờ</th>
                                <th className="p-4">Phòng mổ</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4">Phẫu thuật / Thủ thuật</th>
                                <th className="p-4">Ekip Phẫu thuật</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right w-48">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredSurgeries.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-slate-400 dark:text-slate-500 italic">
                                        Không có lịch phẫu thuật nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredSurgeries.map(s => (
                                    <tr key={s.id} className={`hover:bg-blue-50 dark:hover:bg-slate-700/30 transition-colors group ${s.status === 'emergency' ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
                                        <td className="p-4 text-center">
                                            <div className="text-lg font-bold text-slate-700 dark:text-slate-300">{s.startTime}</div>
                                            <div className="text-xs text-slate-400">{s.endTime}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                                                {getRoomName(s.roomId)}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">{s.patientName}</div>
                                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{s.patientId}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-blue-700 dark:text-blue-400">{s.procedureName}</div>
                                            {s.notes && <div className="text-xs text-slate-500 italic mt-1 truncate max-w-xs">{s.notes}</div>}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1 text-sm text-slate-700 dark:text-slate-300">
                                                <UserGroupIcon className="w-4 h-4 text-slate-400" /> {s.surgeonName}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <select
                                                value={s.status}
                                                onChange={(e) => handleStatusChange(e, s.id)}
                                                onClick={(e) => e.stopPropagation()}
                                                className={`appearance-none cursor-pointer px-2 py-0.5 rounded-full text-xs font-bold border outline-none w-28 text-center ${getStatusColor(s.status)}`}
                                            >
                                                <option value="scheduled">Chờ mổ</option>
                                                <option value="in-progress">Đang mổ</option>
                                                <option value="completed">Hoàn tất</option>
                                                <option value="emergency">Cấp cứu</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenEMR(s.patientId)}
                                                    className="p-2 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600 rounded shadow-sm transition"
                                                    title="Xem Hồ sơ bệnh án"
                                                >
                                                    <ClipboardListIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDetail(s.id)}
                                                    className="p-2 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600 rounded shadow-sm transition"
                                                    title="Chi tiết & Tường trình"
                                                >
                                                    <ScissorsIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    className="p-2 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-600 rounded shadow-sm transition"
                                                    title="Hủy lịch"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
                    Hiển thị {filteredSurgeries.length} ca phẫu thuật
                </div>
            </div>

            <SurgeryScheduleModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleAddSurgery}
                resources={resources}
            />
        </div>
    );
};

export default SurgeryListView;
