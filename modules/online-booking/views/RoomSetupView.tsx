
import React, { useState, useEffect, useMemo } from 'react';
import {
    SearchIcon,
    PlusIcon,
    TrashIcon,
    CheckIcon,
    XIcon,
    RefreshIcon,
    BuildingOfficeIcon,
    SaveIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { roomService, RoomSchedule } from '../../../services/roomService';
import { bookingService } from '../../../services/bookingService';

const RoomSetupView: React.FC = () => {
    const { fontSettings } = useTheme();
    const { addNotification } = useNotification();

    // State
    const [schedules, setSchedules] = useState<RoomSchedule[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filters
    const [deptFilter, setDeptFilter] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<RoomSchedule | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        deptId: '',
        roomId: 0,
        roomName: '',
        type: 'S' as 'S' | 'C',
        avgTime: 10,
        maxSlot: 8,
        startTime: '08:00',
        endTime: '12:00',
        isActive: true
    });

    // Load data
    const loadData = async () => {
        setIsLoading(true);
        try {
            const [schedulesData, deptsData] = await Promise.all([
                roomService.getSchedules({}),
                bookingService.getDepartments()
            ]);
            setSchedules(schedulesData);
            setDepartments(deptsData);
        } catch (error) {
            addNotification("Lỗi", "Không thể tải dữ liệu", "error", undefined, true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Filtered schedules
    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => {
            const matchesDept = deptFilter === 'All' || s.deptId === deptFilter;
            const matchesType = typeFilter === 'All' || s.type === typeFilter;
            return matchesDept && matchesType;
        });
    }, [schedules, deptFilter, typeFilter]);

    // Calculate stats
    const calculateStats = (schedule: { avgTime: number; maxSlot: number; startTime: string; endTime: string }) => {
        const [startH, startM] = schedule.startTime.split(':').map(Number);
        const [endH, endM] = schedule.endTime.split(':').map(Number);
        const totalMin = (endH * 60 + endM) - (startH * 60 + startM);
        const slots = Math.floor(totalMin / schedule.avgTime);
        const maxPatients = slots * schedule.maxSlot;
        return { slots, maxPatients };
    };

    // Handlers
    const handleDoubleClick = (schedule: RoomSchedule) => {
        setEditingSchedule(schedule);
        setFormData({
            deptId: schedule.deptId,
            roomId: schedule.roomId,
            roomName: schedule.roomName || '',
            type: schedule.type,
            avgTime: schedule.avgTime,
            maxSlot: schedule.maxSlot,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            isActive: schedule.isActive !== false
        });
        setShowModal(true);
    };

    const handleAdd = () => {
        setEditingSchedule(null);
        setFormData({
            deptId: '',
            roomId: 0,
            roomName: '',
            type: 'S',
            avgTime: 10,
            maxSlot: 8,
            startTime: '08:00',
            endTime: '12:00',
            isActive: true
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const { roomName, ...scheduleData } = formData;
            await roomService.upsertSchedule(scheduleData);
            addNotification("Thành công", editingSchedule ? "Cập nhật thành công" : "Thêm mới thành công", "success", undefined, true);
            setShowModal(false);
            loadData();
        } catch (error: any) {
            addNotification("Lỗi", error.message || "Không thể lưu", "error", undefined, true);
        }
    };

    const handleDelete = async (schedule: RoomSchedule, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(`Xóa cấu hình ${schedule.type === 'S' ? 'Sáng' : 'Chiều'} của phòng ${schedule.roomName || schedule.roomId}?`)) return;
        try {
            await roomService.deleteSchedule(schedule.deptId, schedule.roomId, schedule.type);
            addNotification("Thành công", "Xóa thành công", "success", undefined, true);
            loadData();
        } catch (error: any) {
            addNotification("Lỗi", error.message || "Không thể xóa", "error", undefined, true);
        }
    };

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg">
                            <BuildingOfficeIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase">Thiết lập phòng khám</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Cấu hình lịch khám theo khoa và phòng (Double-click để sửa)</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={loadData}
                            disabled={isLoading}
                            className="p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white transition shadow-sm"
                        >
                            <RefreshIcon className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={handleAdd}
                            className="px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-md flex items-center gap-2 font-bold"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Thêm cấu hình
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Khoa</label>
                        <select
                            value={deptFilter}
                            onChange={e => setDeptFilter(e.target.value)}
                            className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold ${fontSettings.controls}`}
                        >
                            <option value="All">Tất cả khoa</option>
                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Loại ca</label>
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value)}
                            className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm font-bold ${fontSettings.controls}`}
                        >
                            <option value="All">Tất cả</option>
                            <option value="S">Ca sáng</option>
                            <option value="C">Ca chiều</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            Hiển thị <span className="font-bold text-indigo-600">{filteredSchedules.length}</span> cấu hình
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className={`w-full text-left ${fontSettings.listSecondary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 sticky top-0 z-10 text-[10px] font-black uppercase">
                            <tr>
                                <th className="p-3 w-12">STT</th>
                                <th className="p-3">Mã khoa</th>
                                <th className="p-3">Tên khoa</th>
                                <th className="p-3">Mã phòng</th>
                                <th className="p-3">Tên phòng</th>
                                <th className="p-3 text-center">Loại ca</th>
                                <th className="p-3">TG khám TB</th>
                                <th className="p-3">Số slot</th>
                                <th className="p-3">Giờ bắt đầu</th>
                                <th className="p-3">Giờ kết thúc</th>
                                <th className="p-3 text-center">Tổng slot</th>
                                <th className="p-3 text-center">Tổng BN</th>
                                <th className="p-3 text-center">Hoạt động</th>
                                <th className="p-3 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredSchedules.length === 0 ? (
                                <tr><td colSpan={14} className="p-20 text-center text-slate-400 italic">Không tìm thấy cấu hình nào.</td></tr>
                            ) : (
                                filteredSchedules.map((schedule, idx) => {
                                    const stats = calculateStats(schedule);
                                    return (
                                        <tr
                                            key={`${schedule.deptId}-${schedule.roomId}-${schedule.type}`}
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                                            onDoubleClick={() => handleDoubleClick(schedule)}
                                            title="Double-click để sửa"
                                        >
                                            <td className="p-3 text-center text-slate-400 font-mono text-xs">{idx + 1}</td>
                                            <td className="p-3"><span className="font-bold text-indigo-600">{schedule.deptId}</span></td>
                                            <td className="p-3"><span className="text-sm font-bold">{schedule.deptName || '-'}</span></td>
                                            <td className="p-3"><span className="font-mono font-bold">{schedule.roomId}</span></td>
                                            <td className="p-3"><span className="text-sm">{schedule.roomName || '-'}</span></td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${schedule.type === 'S'
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                                                    }`}>
                                                    {schedule.type === 'S' ? 'SÁNG' : 'CHIỀU'}
                                                </span>
                                            </td>
                                            <td className="p-3"><span className="text-sm">{schedule.avgTime} phút</span></td>
                                            <td className="p-3"><span className="text-sm font-bold">{schedule.maxSlot} BN</span></td>
                                            <td className="p-3"><span className="text-sm font-mono">{schedule.startTime}</span></td>
                                            <td className="p-3"><span className="text-sm font-mono">{schedule.endTime}</span></td>
                                            <td className="p-3 text-center"><span className="text-sm font-bold text-blue-600">{stats.slots}</span></td>
                                            <td className="p-3 text-center"><span className="text-sm font-bold text-green-600">{stats.maxPatients}</span></td>
                                            <td className="p-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${schedule.isActive !== false
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30'
                                                    }`}>
                                                    {schedule.isActive !== false ? 'HOẠT ĐỘNG' : 'NGỪNG'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">
                                                <button
                                                    onClick={(e) => handleDelete(schedule, e)}
                                                    className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                                                    title="Xóa"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit/Add Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">
                                {editingSchedule ? 'Sửa cấu hình lịch khám' : 'Thêm cấu hình mới'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold mb-1">Khoa *</label>
                                    <select
                                        value={formData.deptId}
                                        onChange={e => setFormData({ ...formData, deptId: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                        disabled={!!editingSchedule}
                                    >
                                        <option value="">-- Chọn khoa --</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Mã phòng *</label>
                                    <input
                                        type="number"
                                        value={formData.roomId || ''}
                                        onChange={e => setFormData({ ...formData, roomId: parseInt(e.target.value) || 0 })}
                                        className="w-full p-2 border rounded-lg"
                                        placeholder="VD: 65"
                                        disabled={!!editingSchedule}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold mb-1">Tên phòng</label>
                                    <input
                                        type="text"
                                        value={formData.roomName}
                                        onChange={e => setFormData({ ...formData, roomName: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                        placeholder="VD: Phòng khám bệnh"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Loại ca *</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value as 'S' | 'C' })}
                                        className="w-full p-2 border rounded-lg"
                                        disabled={!!editingSchedule}
                                    >
                                        <option value="S">Sáng (S)</option>
                                        <option value="C">Chiều (C)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Thời gian khám TB (phút) *</label>
                                    <input
                                        type="number"
                                        value={formData.avgTime}
                                        onChange={e => setFormData({ ...formData, avgTime: parseInt(e.target.value) })}
                                        className="w-full p-2 border rounded-lg"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Số BN tối đa/slot *</label>
                                    <input
                                        type="number"
                                        value={formData.maxSlot}
                                        onChange={e => setFormData({ ...formData, maxSlot: parseInt(e.target.value) })}
                                        className="w-full p-2 border rounded-lg"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Giờ bắt đầu *</label>
                                    <input
                                        type="time"
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold mb-1">Giờ kết thúc *</label>
                                    <input
                                        type="time"
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm font-bold">Đang hoạt động</label>
                            </div>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                <div className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                    Ước tính: {calculateStats(formData).slots} slot × {formData.maxSlot} BN = {calculateStats(formData).maxPatients} BN tối đa
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-bold flex items-center gap-2"
                            >
                                <XIcon className="w-4 h-4" />
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-bold flex items-center gap-2"
                            >
                                <SaveIcon className="w-4 h-4" />
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoomSetupView;
