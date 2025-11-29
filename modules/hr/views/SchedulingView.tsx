
import React, { useState } from 'react';
import { mockStaff, shifts } from '../data';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, SaveIcon } from '../../../components/Icons';

const SchedulingView: React.FC = () => {
    // Mock Schedule Grid: Record<StaffId, Record<DateString, ShiftId>>
    const [scheduleData, setScheduleData] = useState<Record<string, Record<string, string>>>({});
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

    // Helper to get days of week
    const getWeekDays = (startDate: Date) => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() - startDate.getDay() + 1 + i); // Start from Monday
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays(currentWeekStart);

    const handleShiftChange = (staffId: string, dateStr: string, shiftId: string) => {
        setScheduleData(prev => ({
            ...prev,
            [staffId]: {
                ...(prev[staffId] || {}),
                [dateStr]: shiftId
            }
        }));
    };

    const handlePrevWeek = () => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() - 7);
        setCurrentWeekStart(d);
    };

    const handleNextWeek = () => {
        const d = new Date(currentWeekStart);
        d.setDate(d.getDate() + 7);
        setCurrentWeekStart(d);
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <CalendarDaysIcon className="w-8 h-8 text-rose-600"/> Xếp ca trực
                    </h1>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                        <button onClick={handlePrevWeek} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded"><ChevronLeftIcon className="w-5 h-5"/></button>
                        <span className="px-4 font-bold text-sm">Tuần {weekDays[0].toLocaleDateString('vi-VN')} - {weekDays[6].toLocaleDateString('vi-VN')}</span>
                        <button onClick={handleNextWeek} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded"><ChevronRightIcon className="w-5 h-5"/></button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 text-xs mr-4">
                        {shifts.map(s => (
                            <div key={s.id} className="flex items-center gap-1">
                                <span className={`w-3 h-3 rounded ${s.color.split(' ')[0]}`}></span>
                                <span>{s.id}</span>
                            </div>
                        ))}
                    </div>
                    <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow flex items-center gap-2">
                        <SaveIcon className="w-4 h-4"/> Lưu lịch
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-slate-900/80 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 min-w-[250px] border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">Nhân viên</th>
                                {weekDays.map(d => (
                                    <th key={d.toString()} className="p-2 min-w-[120px] text-center border-b border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                                        <div className="text-xs text-slate-500 uppercase">{d.toLocaleDateString('vi-VN', { weekday: 'short' })}</div>
                                        <div className="text-sm font-bold">{d.getDate()}/{d.getMonth() + 1}</div>
                                    </th>
                                ))}
                                <th className="p-4 min-w-[100px] text-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">Tổng công</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm">
                            {mockStaff.map(staff => (
                                <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="p-3 border-r border-slate-100 dark:border-slate-700">
                                        <div className="font-bold text-slate-800 dark:text-white">{staff.fullName}</div>
                                        <div className="text-xs text-slate-500">{staff.role}</div>
                                    </td>
                                    {weekDays.map(d => {
                                        const dateStr = d.toISOString().slice(0, 10);
                                        const currentShiftId = scheduleData[staff.id]?.[dateStr] || '';
                                        const currentShift = shifts.find(s => s.id === currentShiftId);

                                        return (
                                            <td key={dateStr} className="p-1 border-r border-slate-100 dark:border-slate-700 text-center align-middle">
                                                <select 
                                                    className={`w-full h-10 rounded text-center text-xs font-bold border border-transparent focus:border-rose-500 outline-none cursor-pointer appearance-none ${currentShift ? currentShift.color : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-600'}`}
                                                    value={currentShiftId}
                                                    onChange={(e) => handleShiftChange(staff.id, dateStr, e.target.value)}
                                                >
                                                    <option value="">--</option>
                                                    {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </td>
                                        );
                                    })}
                                    <td className="p-3 text-center font-bold text-rose-600">
                                        {Object.values(scheduleData[staff.id] || {}).filter(v => v && v !== 'OFF').length}
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

export default SchedulingView;
