
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    XIcon,
    UserGroupIcon,
    SaveIcon,
    CameraIcon,
    IdentificationIcon,
    BriefcaseIcon,
    CheckBadgeIcon,
    KeyIcon,
    PhoneIcon,
    HomeIcon
} from '../Icons';

import { useSession } from '../../contexts/SessionContext';
import { authService } from '../../services/authService';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, userInfo, updateUserInfo } = useSession();
    const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'security'>('personal');
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper to safely split date strings (backend might return Date objects or strings)
    const safeDateSplit = (dateVal: any) => {
        if (!dateVal) return '';
        if (typeof dateVal !== 'string') {
            // If it's a Date object, try to convert to ISO string first
            try {
                return new Date(dateVal).toISOString().split('T')[0];
            } catch (e) {
                return '';
            }
        }
        return dateVal.split('T')[0];
    };

    // Initialize with session data
    const [formData, setFormData] = useState({
        // Personal
        avatar: user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=0ea5e9&color=fff&size=128`,
        fullName: user?.fullName || userInfo?.name || '',
        dob: safeDateSplit(userInfo?.dob || user?.dob) || '1985-05-20',
        gender: userInfo?.gender || user?.gender || 'Nam',
        identityCard: userInfo?.identityCard || user?.identityCard || '',
        phone: userInfo?.phone || user?.phone || '',
        email: userInfo?.email || user?.email || (user?.username ? `${user.username}@vimes.com.vn` : 'staff@vimes.com.vn'),
        address: userInfo?.address || user?.address || '',

        // Professional
        staffId: userInfo?.userId || user?.userId || '',
        department: user?.departmentName || userInfo?.deptId || 'Hành chính',
        position: userInfo?.position || user?.position || 'Nhân viên',
        title: userInfo?.title || user?.title || 'Bác sĩ',
        licenseNumber: userInfo?.certificate || user?.certificate || 'Đang cập nhật',
        scopeOfPractice: 'Chuyên môn theo phân công đơn vị',
        digitalSignatureStatus: 'Đã đăng ký (Token)',

        // Security
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Update form when session data loads
    useEffect(() => {
        if (isOpen && (user || userInfo)) {
            setFormData(prev => ({
                ...prev,
                fullName: user?.fullName || userInfo?.name || prev.fullName,
                staffId: userInfo?.userId || user?.userId || prev.staffId,
                department: user?.departmentName || userInfo?.deptId || prev.department,
                phone: userInfo?.phone || user?.phone || prev.phone,
                title: userInfo?.title || user?.title || prev.title,
                licenseNumber: userInfo?.certificate || user?.certificate || prev.licenseNumber,
                position: userInfo?.position || user?.position || prev.position,
                avatar: user?.avatarUrl || prev.avatar,
                dob: safeDateSplit(userInfo?.dob || user?.dob) || prev.dob,
                gender: userInfo?.gender || user?.gender || prev.gender,
                identityCard: userInfo?.identityCard || user?.identityCard || prev.identityCard,
                email: userInfo?.email || user?.email || prev.email,
                address: userInfo?.address || user?.address || prev.address
            }));
        }
    }, [isOpen, user, userInfo]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, avatar: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        // Prevent default only if triggered by form submit
        if (e) e.preventDefault();

        setIsSaving(true);
        try {
            // Map frontend fields to backend expected fields
            const updateData = {
                name: formData.fullName,
                phone: formData.phone,
                certificate: formData.licenseNumber,
                position: formData.position,
                title: formData.title,
                dob: formData.dob,
                gender: formData.gender,
                identityCard: formData.identityCard,
                email: formData.email,
                address: formData.address
            };

            const response = await authService.updateProfile(updateData);

            if (response.success) {
                // Update local session state using returned data if available
                updateUserInfo(response.user || updateData);
                alert("Cập nhật thông tin tài khoản thành công!");
                onClose();
            } else {
                alert("Lỗi: " + (response.message || "Không thể cập nhật"));
            }
        } catch (error: any) {
            console.error('Update profile error:', error);
            alert("Lỗi hệ thống: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Common input style
    const inputClass = "w-full p-2.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow";
    const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5";

    // Use Portal to render outside of Header context to avoid CSS transform issues
    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Modal Container with max-height to prevent jumping */}
            <div
                className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <UserGroupIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Thông tin Tài khoản</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Quản lý hồ sơ nhân viên và chuyên môn y tế</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs & Main Layout */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Sidebar Tabs (Desktop) / Top Tabs (Mobile) */}
                    <div className="w-64 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 flex-col hidden md:flex p-4 gap-2 shrink-0">
                        <div className="text-center mb-6">
                            <div className="relative inline-block">
                                <img
                                    src={formData.avatar}
                                    alt="Avatar"
                                    className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md mx-auto"
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 border-2 border-white dark:border-slate-800 shadow-sm transition"
                                >
                                    <CameraIcon className="w-4 h-4" />
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                            <h3 className="mt-3 font-bold text-slate-800 dark:text-white">{formData.fullName}</h3>
                            <p className="text-xs text-slate-500">{formData.title}</p>
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-[10px] font-bold rounded uppercase border border-green-200 dark:border-green-800">
                                Đang hoạt động
                            </span>
                        </div>

                        <button
                            onClick={() => setActiveTab('personal')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'personal' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <IdentificationIcon className="w-5 h-5" /> Thông tin cá nhân
                        </button>
                        <button
                            onClick={() => setActiveTab('professional')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'professional' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <BriefcaseIcon className="w-5 h-5" /> Công tác & Chuyên môn
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'security' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <KeyIcon className="w-5 h-5" /> Thiết lập tài khoản
                        </button>
                    </div>

                    {/* Mobile Tab Fallback */}
                    <div className="md:hidden flex border-b border-slate-200 dark:border-slate-700 shrink-0 overflow-x-auto">
                        <button onClick={() => setActiveTab('personal')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'personal' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Cá nhân</button>
                        <button onClick={() => setActiveTab('professional')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'professional' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Chuyên môn</button>
                        <button onClick={() => setActiveTab('security')} className={`flex-1 py-3 text-xs font-bold ${activeTab === 'security' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Thiết lập</button>
                    </div>

                    {/* Form Content Area */}
                    <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">

                        {activeTab === 'personal' && (
                            <div className="space-y-6 animate-fade-in">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700 mb-4">Thông tin hành chính</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-1 md:col-span-2">
                                        <label className={labelClass}>Họ và tên đầy đủ</label>
                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={`${inputClass} font-bold uppercase`} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Ngày sinh</label>
                                        <input type="date" name="dob" value={formData.dob} onChange={handleChange} className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Giới tính</label>
                                        <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>CCCD / CMND</label>
                                        <div className="relative">
                                            <IdentificationIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            <input type="text" name="identityCard" value={formData.identityCard} onChange={handleChange} className={`${inputClass} pl-9`} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Số điện thoại</label>
                                        <div className="relative">
                                            <PhoneIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`${inputClass} pl-9`} />
                                        </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className={labelClass}>Email liên hệ</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <label className={labelClass}>Địa chỉ thường trú</label>
                                        <div className="relative">
                                            <HomeIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                            <input type="text" name="address" value={formData.address} onChange={handleChange} className={`${inputClass} pl-9`} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'professional' && (
                            <div className="space-y-6 animate-fade-in">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700 mb-4">Thông tin công tác & Chứng chỉ</h3>

                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={labelClass}>Mã Nhân viên (Staff ID)</label>
                                            <input type="text" value={formData.staffId} disabled className={`${inputClass} bg-slate-100 dark:bg-slate-800 cursor-not-allowed font-mono font-bold`} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Khoa / Phòng ban</label>
                                            <select name="department" value={formData.department} onChange={handleChange} className={inputClass}>
                                                <option>Khoa Nội Tổng Quát</option>
                                                <option>Khoa Ngoại</option>
                                                <option>Khoa Cấp Cứu</option>
                                                <option>Khoa Xét Nghiệm</option>
                                                <option>Chẩn Đoán Hình Ảnh</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>Chức vụ</label>
                                            <input type="text" name="position" value={formData.position} onChange={handleChange} className={inputClass} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Học hàm / Học vị</label>
                                            <select name="title" value={formData.title} onChange={handleChange} className={inputClass}>
                                                <option>Bác sĩ</option>
                                                <option>Bác sĩ CKI</option>
                                                <option>Bác sĩ CKII</option>
                                                <option>Thạc sĩ</option>
                                                <option>Tiến sĩ</option>
                                                <option>Phó Giáo sư</option>
                                                <option>Giáo sư</option>
                                                <option>Điều dưỡng</option>
                                                <option>Kỹ thuật viên</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>Chứng chỉ hành nghề (CCHN)</label>
                                        <div className="relative">
                                            <CheckBadgeIcon className="absolute left-3 top-2.5 w-4 h-4 text-emerald-500" />
                                            <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className={`${inputClass} pl-9 font-bold`} placeholder="Số hiệu chứng chỉ..." />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phạm vi hoạt động chuyên môn</label>
                                        <textarea name="scopeOfPractice" value={formData.scopeOfPractice} onChange={handleChange} rows={3} className={inputClass} placeholder="Mô tả phạm vi chuyên môn được cấp phép..."></textarea>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Trạng thái Chữ ký số (Digital Signature)</label>
                                        <div className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800">
                                            <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{formData.digitalSignatureStatus}</span>
                                            <button type="button" className="ml-auto text-xs text-blue-600 hover:underline">Cấu hình Token</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-fade-in">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b pb-2 dark:border-slate-700 mb-4">Đổi mật khẩu</h3>
                                <div className="max-w-md mx-auto space-y-4">
                                    <div>
                                        <label className={labelClass}>Mật khẩu hiện tại</label>
                                        <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} className={inputClass} placeholder="••••••" />
                                    </div>
                                    <div className="border-t border-slate-100 dark:border-slate-700 my-4"></div>
                                    <div>
                                        <label className={labelClass}>Mật khẩu mới</label>
                                        <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} className={inputClass} placeholder="Nhập mật khẩu mới" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Xác nhận mật khẩu mới</label>
                                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={inputClass} placeholder="Nhập lại mật khẩu mới" />
                                    </div>
                                </div>

                                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 p-4 rounded-lg mt-6">
                                    <h4 className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-2">Nhật ký đăng nhập gần đây</h4>
                                    <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                        <li>• 10:30 AM - Chrome (Windows) - IP: 192.168.1.15</li>
                                        <li>• Hôm qua - Safari (iPhone) - IP: 14.162.x.x</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition">
                        Hủy bỏ
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg flex items-center gap-2 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <SaveIcon className="w-4 h-4" />
                        )}
                        {isSaving ? 'Đang lưu...' : 'Lưu hồ sơ'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default UserProfileModal;
