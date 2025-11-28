
import React, { useState, useMemo } from 'react';
import { 
    SearchIcon, 
    PlusIcon, 
    PencilIcon, 
    TrashIcon, 
    KeyIcon, 
    CheckCircleIcon, 
    XIcon,
    UserGroupIcon,
    FilterIcon,
    ShieldCheckIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

// --- TYPES ---
interface UserAccount {
    id: string;
    username: string;
    fullName: string;
    email: string;
    role: 'admin' | 'doctor' | 'nurse' | 'technician' | 'receptionist';
    department: string;
    title: string;
    status: 'active' | 'locked';
    lastLogin?: string;
}

// --- MOCK DATA ---
const mockUsers: UserAccount[] = [
    { id: 'BS001', username: 'minh.dr', fullName: 'Trần Văn Minh', email: 'minh.tv@vimes.com', role: 'doctor', department: 'Khoa Nội Tổng Quát', title: 'Bác sĩ CKII', status: 'active', lastLogin: '2023-11-27 08:00' },
    { id: 'BS002', username: 'lan.bs', fullName: 'Nguyễn Thị Lan', email: 'lan.nt@vimes.com', role: 'doctor', department: 'Khoa Nhi', title: 'Thạc sĩ', status: 'active', lastLogin: '2023-11-26 14:30' },
    { id: 'DD001', username: 'hoa.dd', fullName: 'Lê Thị Hoa', email: 'hoa.lt@vimes.com', role: 'nurse', department: 'Khoa Nội Tổng Quát', title: 'Cử nhân', status: 'active', lastLogin: '2023-11-27 07:45' },
    { id: 'KTV01', username: 'hung.ktv', fullName: 'Phạm Văn Hùng', email: 'hung.pv@vimes.com', role: 'technician', department: 'Chẩn đoán hình ảnh', title: 'KTV Trưởng', status: 'locked', lastLogin: '2023-10-15 09:00' },
    { id: 'AD001', username: 'admin', fullName: 'Quản trị viên', email: 'admin@vimes.com', role: 'admin', department: 'CNTT', title: 'Kỹ sư', status: 'active', lastLogin: 'Just now' },
    { id: 'TN001', username: 'thuy.tn', fullName: 'Hoàng Thị Thúy', email: 'thuy.ht@vimes.com', role: 'receptionist', department: 'Tiếp đón', title: 'Nhân viên', status: 'active', lastLogin: '2023-11-27 07:30' },
];

const departments = ['Tất cả', 'Khoa Nội Tổng Quát', 'Khoa Ngoại', 'Khoa Nhi', 'Khoa Sản', 'Chẩn đoán hình ảnh', 'Khoa Xét nghiệm', 'Tiếp đón', 'CNTT'];
const roles = [
    { value: 'all', label: 'Tất cả vai trò' },
    { value: 'doctor', label: 'Bác sĩ' },
    { value: 'nurse', label: 'Điều dưỡng' },
    { value: 'technician', label: 'Kỹ thuật viên' },
    { value: 'receptionist', label: 'Tiếp đón' },
    { value: 'admin', label: 'Quản trị' },
];

// --- USER MODAL COMPONENT ---
const UserModal = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (data: UserAccount) => void;
    initialData?: UserAccount 
}) => {
    const [formData, setFormData] = useState<Partial<UserAccount>>(initialData || {
        status: 'active',
        role: 'doctor',
        department: departments[1]
    });

    if (!isOpen) return null;

    const handleChange = (field: keyof UserAccount, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Basic Validation
        if (!formData.username || !formData.fullName) {
            alert("Vui lòng nhập đầy đủ thông tin bắt buộc.");
            return;
        }
        onSave({
            ...formData,
            id: formData.id || `U${Date.now()}` // Generate ID if new
        } as UserAccount);
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-fade-in-up">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {initialData ? <PencilIcon className="w-5 h-5 text-blue-600"/> : <PlusIcon className="w-5 h-5 text-green-600"/>}
                        {initialData ? 'Cập nhật thông tin nhân viên' : 'Thêm nhân viên mới'}
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tên đăng nhập <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                                value={formData.username}
                                onChange={e => handleChange('username', e.target.value)}
                                disabled={!!initialData} // Cannot change username if editing
                                placeholder="VD: minh.nguyen"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Họ và tên <span className="text-red-500">*</span></label>
                            <input 
                                type="text" 
                                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 uppercase font-medium"
                                value={formData.fullName}
                                onChange={e => handleChange('fullName', e.target.value)}
                                placeholder="VD: NGUYỄN VĂN MINH"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                            <input 
                                type="email" 
                                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                                value={formData.email}
                                onChange={e => handleChange('email', e.target.value)}
                                placeholder="email@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Chức danh / Học vị</label>
                            <input 
                                type="text" 
                                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                                value={formData.title}
                                onChange={e => handleChange('title', e.target.value)}
                                placeholder="VD: Bác sĩ CKI"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Khoa / Phòng ban</label>
                            <select 
                                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                                value={formData.department}
                                onChange={e => handleChange('department', e.target.value)}
                            >
                                {departments.filter(d => d !== 'Tất cả').map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Vai trò hệ thống</label>
                            <select 
                                className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                                value={formData.role}
                                onChange={e => handleChange('role', e.target.value)}
                            >
                                {roles.filter(r => r.value !== 'all').map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Password field only for new users */}
                        {!initialData && (
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Mật khẩu khởi tạo</label>
                                <input 
                                    type="password" 
                                    className="w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600"
                                    placeholder="Mặc định: 123456"
                                    disabled
                                />
                                <p className="text-xs text-slate-500 mt-1">Người dùng sẽ được yêu cầu đổi mật khẩu khi đăng nhập lần đầu.</p>
                            </div>
                        )}

                        <div className="col-span-1 md:col-span-2 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={formData.status === 'active'}
                                    onChange={e => handleChange('status', e.target.checked ? 'active' : 'locked')}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Kích hoạt tài khoản ngay</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg font-medium transition">
                            Hủy bỏ
                        </button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-bold shadow-md transition transform active:scale-95">
                            {initialData ? 'Cập nhật' : 'Thêm mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MAIN VIEW ---
const UserManagementView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [users, setUsers] = useState<UserAccount[]>(mockUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('Tất cả');
    const [filterRole, setFilterRole] = useState('all');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserAccount | undefined>(undefined);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  user.username.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDept = filterDept === 'Tất cả' || user.department === filterDept;
            const matchesRole = filterRole === 'all' || user.role === filterRole;
            return matchesSearch && matchesDept && matchesRole;
        });
    }, [users, searchTerm, filterDept, filterRole]);

    const handleAddUser = (newUser: UserAccount) => {
        setUsers(prev => [...prev, newUser]);
        setIsModalOpen(false);
    };

    const handleEditUser = (updatedUser: UserAccount) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        setIsModalOpen(false);
    };

    const handleDeleteUser = (id: string) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này? Hành động không thể hoàn tác.")) {
            setUsers(prev => prev.filter(u => u.id !== id));
        }
    };

    const handleResetPassword = (username: string) => {
        if (window.confirm(`Khôi phục mật khẩu cho ${username} về mặc định (123456)?`)) {
            alert("Đã khôi phục mật khẩu thành công.");
        }
    };

    const openEditModal = (user: UserAccount) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingUser(undefined);
        setIsModalOpen(true);
    };

    const getRoleBadge = (role: string) => {
        switch(role) {
            case 'admin': return <span className="bg-purple-100 text-purple-700 border-purple-200 px-2 py-0.5 rounded text-xs font-bold uppercase border">Quản trị</span>;
            case 'doctor': return <span className="bg-blue-100 text-blue-700 border-blue-200 px-2 py-0.5 rounded text-xs font-bold uppercase border">Bác sĩ</span>;
            case 'nurse': return <span className="bg-teal-100 text-teal-700 border-teal-200 px-2 py-0.5 rounded text-xs font-bold uppercase border">Điều dưỡng</span>;
            default: return <span className="bg-slate-100 text-slate-600 border-slate-200 px-2 py-0.5 rounded text-xs font-bold uppercase border">{role}</span>;
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header & Toolbar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <UserGroupIcon className="w-8 h-8 text-blue-600"/> Quản lý Người dùng
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Quản lý tài khoản nhân viên, phân quyền và bảo mật.</p>
                </div>
                
                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Tìm tên, tài khoản..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                        />
                    </div>
                    <div className="relative">
                        <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <select 
                            value={filterDept}
                            onChange={e => setFilterDept(e.target.value)}
                            className={`pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer ${fontSettings.controls}`}
                        >
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <button 
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-md active:scale-95"
                    >
                        <PlusIcon className="w-5 h-5"/> Thêm mới
                    </button>
                </div>
            </div>

            {/* User Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                    <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase font-bold sticky top-0 z-10">
                            <tr>
                                <th className="p-4 w-32">ID NV</th>
                                <th className="p-4">Họ và tên</th>
                                <th className="p-4">Tài khoản / Email</th>
                                <th className="p-4">Khoa / Phòng</th>
                                <th className="p-4 text-center">Vai trò</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-right w-48">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-10 text-center text-slate-400 italic">
                                        Không tìm thấy người dùng nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-blue-50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-4 font-mono text-slate-500 dark:text-slate-400 text-sm">{user.id}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white">{user.fullName}</div>
                                            <div className="text-xs text-slate-500">{user.title}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-700 dark:text-slate-300">{user.username}</div>
                                            <div className="text-xs text-slate-400">{user.email}</div>
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                                            {user.department}
                                        </td>
                                        <td className="p-4 text-center">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="p-4 text-center">
                                            {user.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                                                    <CheckCircleIcon className="w-3 h-3"/> Hoạt động
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                                                    <ShieldCheckIcon className="w-3 h-3"/> Đã khóa
                                                </span>
                                            )}
                                            <div className="text-[10px] text-slate-400 mt-1">Last: {user.lastLogin}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-90">
                                                <button 
                                                    onClick={() => handleResetPassword(user.username)}
                                                    className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded transition"
                                                    title="Đặt lại mật khẩu"
                                                >
                                                    <KeyIcon className="w-4 h-4"/>
                                                </button>
                                                <button 
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                                                    title="Chỉnh sửa"
                                                >
                                                    <PencilIcon className="w-4 h-4"/>
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                    title="Xóa"
                                                >
                                                    <TrashIcon className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 flex justify-between items-center">
                    <span>Hiển thị {filteredUsers.length} tài khoản</span>
                    <div className="flex gap-1">
                        <button className="px-2 py-1 border rounded bg-white disabled:opacity-50" disabled>Trước</button>
                        <button className="px-2 py-1 border rounded bg-white disabled:opacity-50" disabled>Sau</button>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            <UserModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={editingUser ? handleEditUser : handleAddUser}
                initialData={editingUser}
            />
        </div>
    );
};

export default UserManagementView;
