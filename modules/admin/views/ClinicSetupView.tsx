
import React, { useState, useMemo } from 'react';
import { 
    HospitalIcon, 
    SearchIcon, 
    PlusIcon, 
    CheckIcon, 
    XIcon, 
    RefreshIcon,
    ChevronRightIcon,
    FunnelIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

interface ClinicGroup {
    id: string;
    name: string;
}

interface ClinicRoom {
    id: string;
    name: string;
    isActive: boolean;
    isSelected: boolean;
}

const mockGroups: ClinicGroup[] = [
    { id: '1', name: 'Khám Phụ khoa' },
    { id: '2', name: 'Khám Vú' },
    { id: '3', name: 'Khám Tiêu hóa' },
    { id: '4', name: 'Khám Đầu mặt cổ, tuyến giáp' },
    { id: '5', name: 'Khám phổi' },
    { id: '6', name: 'Khám y học hạt nhân (t1 nhà c)' },
    { id: '7', name: 'Khám lồng ngực' },
    { id: '8', name: 'Khám nội' },
    { id: '9', name: 'Khám thần kinh' },
    { id: '10', name: 'Khám gan mật' },
    { id: '11', name: 'Khám tiết niệu' },
];

const mockRooms: ClinicRoom[] = [
    { id: '15', name: 'Phòng Khám Đầu - Mặt - Cổ', isActive: true, isSelected: true },
    { id: '14', name: 'Phòng Khám Đầu - Mặt - Cổ', isActive: false, isSelected: false },
    { id: '91', name: 'Phòng Khám Tuyến Giáp 01', isActive: true, isSelected: true },
    { id: '92', name: 'Phòng Khám Tuyến Giáp 02', isActive: true, isSelected: false },
    { id: '105', name: 'Phòng Nội soi 05', isActive: true, isSelected: false },
];

const ClinicSetupView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [selectedGroupId, setSelectedGroupId] = useState('4');
    const [rooms, setRooms] = useState<ClinicRoom[]>(mockRooms);
    const [groupSearch, setGroupSearch] = useState('');
    const [roomSearch, setRoomSearch] = useState('');

    const filteredGroups = useMemo(() => 
        mockGroups.filter(g => g.name.toLowerCase().includes(groupSearch.toLowerCase()) || g.id.includes(groupSearch)),
    [groupSearch]);

    const filteredRooms = useMemo(() => 
        rooms.filter(r => r.name.toLowerCase().includes(roomSearch.toLowerCase()) || r.id.includes(roomSearch)),
    [rooms, roomSearch]);

    const handleToggleRoom = (id: string) => {
        setRooms(prev => prev.map(r => r.id === id ? { ...r, isSelected: !r.isSelected } : r));
    };

    const handleApply = () => {
        const selected = rooms.filter(r => r.isSelected).map(r => r.name);
        alert(`Đã cập nhật ${selected.length} phòng khám vào nhóm ${mockGroups.find(g => g.id === selectedGroupId)?.name}`);
    };

    const inputClass = "w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all";

    return (
        <div className="h-full flex flex-col gap-4 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-teal-600 text-white rounded-lg shadow-lg">
                        <HospitalIcon className="w-6 h-6"/>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Cấu hình luồng phòng khám</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Thiết lập nhóm và danh sách phòng hoạt động</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-bold text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-600 hover:bg-white transition shadow-sm">
                        <RefreshIcon className="w-4 h-4"/> Làm mới
                    </button>
                    <button className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-md transition transform active:scale-95">
                        <PlusIcon className="w-4 h-4"/> Thêm mới nhóm
                    </button>
                </div>
            </div>

            {/* Main Area: Split Pane */}
            <div className="flex-1 flex gap-4 overflow-hidden">
                
                {/* LEFT PANE: GROUPS */}
                <div className="w-1/3 min-w-[320px] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                        <h3 className="font-black text-[10px] text-blue-600 uppercase tracking-[0.2em]">Danh mục Nhóm</h3>
                        <div className="relative">
                            <SearchIcon className="absolute left-2.5 top-2 w-4 h-4 text-slate-400"/>
                            <input 
                                type="text" 
                                placeholder="Tìm mã hoặc tên nhóm..." 
                                value={groupSearch}
                                onChange={e => setGroupSearch(e.target.value)}
                                className={`${inputClass} pl-8 py-1.5`}
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 sticky top-0 z-10 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-2 w-16 text-center border-r border-slate-200 dark:border-slate-700">Mã</th>
                                    <th className="p-2 pl-4">Tên nhóm khám</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredGroups.map(group => (
                                    <tr 
                                        key={group.id} 
                                        onClick={() => setSelectedGroupId(group.id)}
                                        className={`cursor-pointer transition-colors ${selectedGroupId === group.id ? 'bg-blue-600 text-white shadow-inner' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'}`}
                                    >
                                        <td className={`p-2.5 text-center font-mono font-bold border-r ${selectedGroupId === group.id ? 'border-blue-500' : 'border-slate-100 dark:border-slate-700 text-slate-400'}`}>
                                            {group.id}
                                        </td>
                                        <td className="p-2.5 pl-4 font-bold text-sm">
                                            {group.name}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* RIGHT PANE: ROOMS */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden relative">
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-[10px] text-teal-600 uppercase tracking-[0.2em]">Danh sách phòng thuộc nhóm</h3>
                            <div className="text-[10px] font-bold text-slate-400">
                                Đang chọn: {mockGroups.find(g => g.id === selectedGroupId)?.name}
                            </div>
                        </div>
                        <div className="relative">
                            <FunnelIcon className="absolute left-2.5 top-2 w-4 h-4 text-slate-400"/>
                            <input 
                                type="text" 
                                placeholder="Lọc danh sách phòng..." 
                                value={roomSearch}
                                onChange={e => setRoomSearch(e.target.value)}
                                className={`${inputClass} pl-8 py-1.5`}
                            />
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-auto custom-scrollbar pb-20">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 sticky top-0 z-10 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="p-2 w-12 text-center">Chọn</th>
                                    <th className="p-2 w-20 text-center border-x border-slate-200 dark:border-slate-700">Mã</th>
                                    <th className="p-2 pl-4">Tên phòng khám</th>
                                    <th className="p-2 w-24 text-center">Hoạt động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredRooms.map(room => (
                                    <tr 
                                        key={room.id} 
                                        onClick={() => handleToggleRoom(room.id)}
                                        className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${room.isSelected ? 'bg-teal-50/50 dark:bg-teal-900/10' : ''}`}
                                    >
                                        <td className="p-2.5 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={room.isSelected} 
                                                readOnly 
                                                className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="p-2.5 text-center font-mono font-bold text-slate-500 border-x border-slate-100 dark:border-slate-700">
                                            {room.id}
                                        </td>
                                        <td className={`p-2.5 pl-4 font-bold text-sm ${room.isSelected ? 'text-teal-700 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {room.name}
                                        </td>
                                        <td className="p-2.5 text-center">
                                            <span className={`font-black text-xs ${room.isActive ? 'text-green-600' : 'text-rose-500'}`}>
                                                {room.isActive ? 'Y' : 'N'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Actions Sticky */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                        <button 
                            onClick={() => setRoomSearch('')}
                            className="px-6 py-2 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 transition"
                        >
                            Hủy bỏ
                        </button>
                        <button 
                            onClick={handleApply}
                            className="px-10 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-black text-sm shadow-xl shadow-teal-500/30 transition transform active:scale-95 uppercase flex items-center gap-2"
                        >
                            <CheckIcon className="w-5 h-5"/> Áp dụng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicSetupView;
