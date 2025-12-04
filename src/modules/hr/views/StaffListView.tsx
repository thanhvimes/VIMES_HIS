
import React, { useState, useMemo } from 'react';
import { mockStaff, Staff } from '../data';
import { SearchIcon, PlusIcon, PhoneIcon, UserGroupIcon, FilterIcon, PencilIcon, TrashIcon } from '../../../components/Icons';
import { AcademicCapIcon, BriefcaseIcon } from '../icons';
import StaffFormModal from './components/StaffFormModal';
import { useTheme } from '../../../contexts/ThemeContext';

const StaffListView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [staffs, setStaffs] = useState<Staff[]>(mockStaff);
    const [filterDept, setFilterDept] = useState('All');
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | undefined>(undefined);

    const departments = useMemo(() => ['All', ...Array.from(new Set(staffs.map(s => s.department)))], [staffs]);

    const filteredStaff = useMemo(() => {
        return staffs.filter(s => {
            const matchSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                s.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                s.phone.includes(searchTerm);
            const matchDept = filterDept === 'All' || s.department === filterDept;
            return matchSearch && matchDept;
        });
    }, [staffs, searchTerm, filterDept]);

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'Active': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Đang làm việc</span>;
            case 'Probation': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">Thử việc</span>;
            case 'OnLeave': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">Nghỉ phép</span>;
            case 'Resigned': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Đã nghỉ</span>;
            case 'Maternity': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-pink-100 text-pink-700 border border-pink-200">Thai sản</span>;
            default: return null;
        }
    };

    const handleAdd = () => {
        setEditingStaff(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (staff: Staff) => {
        setEditingStaff(staff);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa nhân viên này? Hành động không thể hoàn tác.')) {
            setStaffs(prev => prev.filter(s => s.id !== id));
        }
    };

    const handleSave = (data: Staff) => {
        if (editingStaff) {
            // Update
            setStaffs(prev => prev.map(s => s.id === data.id ? data : s));
        } else {
            // Create
            setStaffs(prev => [data, ...prev]);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <UserGroupIcon className="w-8 h-8 text-rose-600"/> Hồ sơ Nhân sự
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý thông tin cán bộ công nhân viên toàn viện.</p>
                </div>
                
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative flex-1 min-w-[200px]">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm tên, mã NV, SĐT..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-rose-500 ${fontSettings.controls}`}
                        />
                    </div>
                    <div className="relative">
                        <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <select 
                            value={filterDept}
                            onChange={e => setFilterDept(e.target.value)}
                            className={`pl-9 pr-4 p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-rose-500 cursor-pointer ${fontSettings.controls}`}
                        >
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept === 'All' ? 'Tất cả Khoa/Phòng' : dept}</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={handleAdd}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow flex items-center gap-2 transition transform active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5"/> Thêm mới
                    </button>
                </div>
            </div>

            {/* List View */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-100 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-20 text-center">Ảnh</th>
                                <th className="p-4">Họ tên / Mã NV</th>
                                <th className="p-4">Chức vụ / Khoa</th>
                                <th className="p-4">Liên hệ</th>
                                <th className="p-4">Loại HĐ</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right w-32">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredStaff.map((s) => (
                                <tr key={s.id} className="hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors group cursor-pointer" onClick={() => handleEdit(s)}>
                                    <td className="p-4 text-center">
                                        <img src={s.avatar} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm mx-auto object-cover"/>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800 dark:text-white">{s.fullName}</div>
                                        <div className="text-xs text-slate-500 font-mono bg-slate-100 dark:bg-slate-700 px-1.5 rounded w-fit mt-0.5">{s.employeeCode}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                                            <BriefcaseIcon className="w-3.5 h-3.5 text-slate-400"/> {s.role}
                                        </div>
                                        <div className="text-xs text-slate-500 ml-5">{s.department}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 text-sm">
                                            <PhoneIcon className="w-3 h-3"/> {s.phone}
                                        </div>
                                        <div className="text-xs text-slate-400 truncate max-w-[150px]">{s.email}</div>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                                        {s.type}
                                        {s.licenseNumber && (
                                            <div className="flex items-center gap-1 text-[10px] text-indigo-600 bg-indigo-50 px-1.5 rounded border border-indigo-100 w-fit mt-1">
                                                <AcademicCapIcon className="w-3 h-3"/> {s.licenseNumber}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {getStatusBadge(s.status)}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleEdit(s); }}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition"
                                                title="Chỉnh sửa"
                                            >
                                                <PencilIcon className="w-4 h-4"/>
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition"
                                                title="Xóa nhân viên"
                                            >
                                                <TrashIcon className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStaff.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-slate-500 italic">Không tìm thấy nhân viên nào.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
                    Hiển thị {filteredStaff.length} nhân sự
                </div>
            </div>

            {/* Staff Form Modal */}
            <StaffFormModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                initialData={editingStaff}
                onSave={handleSave}
            />
        </div>
    );
};

export default StaffListView;
