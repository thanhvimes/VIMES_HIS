
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
import { healthCheckService } from '../../services/healthCheckService';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SigningPartner {
    sign_partner: string;
    sign_name?: string;
    sign_url?: string;
    sign_url_wan?: string;
}

const DEFAULT_SIGNING_PARTNERS: SigningPartner[] = [
    { sign_partner: 'VIETTEL', sign_name: 'MySign', sign_url: 'https://api.viettel-ca.vn' },
    { sign_partner: 'BCY', sign_name: 'Ban Cơ yếu', sign_url: 'https://ca.gov.vn' },
    { sign_partner: 'TOKEN', sign_name: 'USB Token', sign_url: 'http://localhost:8080' },
    { sign_partner: 'USB', sign_name: 'USB Token', sign_url: 'http://localhost:9999' },
    { sign_partner: 'LOCAL', sign_name: 'Local', sign_url: 'http://localhost:5000' },
    { sign_partner: 'USB_STAMP', sign_name: 'Ký dấu', sign_url: 'http://localhost:8080' },
    { sign_partner: 'VNPT-CA', sign_name: 'SmartCA', sign_url: 'https://smartca.vnpt.vn' }
];

const formatPartnerLabel = (partner: string, name?: string): string => {
    if (!name || name.trim() === partner.trim()) return partner;
    const clean = name.trim();
    if (/mysign/i.test(clean)) return `${partner} (MySign)`;
    if (/ban cơ yếu|vgca/i.test(clean)) return `${partner} (Ban Cơ yếu)`;
    if (/smartca/i.test(clean)) return `${partner} (SmartCA)`;
    if (/đóng dấu|stamp/i.test(clean)) return `${partner} (Ký dấu)`;
    if (/usb|token/i.test(clean)) return `${partner} (USB Token)`;
    if (/local|nội bộ/i.test(clean)) return `${partner} (Local)`;
    const shortened = clean.replace(/^(Ký số|Dịch vụ ký số|Hệ thống ký số)\s+/i, '');
    return shortened ? `${partner} (${shortened})` : partner;
};

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
    const { user, userInfo, updateUserInfo } = useSession();
    const [partners, setPartners] = useState<SigningPartner[]>(DEFAULT_SIGNING_PARTNERS);
    const [showHsmPassword, setShowHsmPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const loadPartners = async () => {
                try {
                    const res = await healthCheckService.getSigningPartners();
                    if (res.success && Array.isArray(res.data) && res.data.length > 0) {
                        const partnerMap = new Map<string, SigningPartner>();
                        DEFAULT_SIGNING_PARTNERS.forEach(p => partnerMap.set(p.sign_partner, p));
                        res.data.forEach((p: SigningPartner) => {
                            partnerMap.set(p.sign_partner, { ...partnerMap.get(p.sign_partner), ...p });
                        });
                        setPartners(Array.from(partnerMap.values()));
                    }
                } catch (error) {
                    console.error("Failed to load signing partners:", error);
                }
            };
            loadPartners();
        }
    }, [isOpen]);
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
        confirmPassword: '',

        // HSM Signing
        hsmUsername: userInfo?.signUserid || user?.signUserid || '',
        hsmPassword: userInfo?.signPasswd || user?.signPasswd || '',
        hsmProvider: userInfo?.signPartner || user?.signPartner || '',
        signCredentialId: userInfo?.signCredentialId || user?.signCredentialId || ''
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
                address: userInfo?.address || user?.address || prev.address,
                hsmUsername: userInfo?.signUserid || user?.signUserid || prev.hsmUsername,
                hsmPassword: userInfo?.signPasswd || user?.signPasswd || prev.hsmPassword,
                hsmProvider: userInfo?.signPartner || user?.signPartner || prev.hsmProvider,
                signCredentialId: userInfo?.signCredentialId || user?.signCredentialId || prev.signCredentialId
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
                address: formData.address,
                signUserid: formData.hsmUsername,
                signPasswd: formData.hsmPassword,
                signPartner: formData.hsmProvider,
                signCredentialId: formData.signCredentialId
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
                                    {/* Khung cấu hình Chữ ký số cá nhân sys_user */}
                                    <div className="border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 bg-slate-50/70 dark:bg-slate-800/40 space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                                            <div className="flex items-center gap-2">
                                                <KeyIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                                <h4 className="text-xs font-extrabold text-teal-800 dark:text-teal-300 uppercase tracking-wider">
                                                    Tài khoản ký số cá nhân
                                                </h4>
                                            </div>
                                            <div>
                                                {formData.hsmProvider ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                        Đã cấu hình: {formData.hsmProvider}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                        Chưa chọn nhà cung cấp
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className={labelClass}>
                                                    Nhà cung cấp <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="hsmProvider"
                                                    value={formData.hsmProvider}
                                                    onChange={handleChange}
                                                    className={`${inputClass} font-semibold text-teal-900 dark:text-teal-200 cursor-pointer`}
                                                >
                                                    <option value="">-- Chọn nhà cung cấp --</option>
                                                    {partners.map(p => (
                                                        <option key={p.sign_partner} value={p.sign_partner}>
                                                            {formatPartnerLabel(p.sign_partner, p.sign_name)}
                                                        </option>
                                                    ))}
                                                    {/* Fallback if user has a custom provider not currently in list */}
                                                    {formData.hsmProvider && !partners.some(p => p.sign_partner === formData.hsmProvider) && (
                                                        <option value={formData.hsmProvider}>{formData.hsmProvider}</option>
                                                    )}
                                                </select>
                                                {(() => {
                                                    const activePartner = partners.find(p => p.sign_partner === formData.hsmProvider);
                                                    const targetUrl = activePartner?.sign_url || activePartner?.sign_url_wan;
                                                    return targetUrl ? (
                                                        <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block truncate">
                                                            Cổng kết nối: <code className="text-teal-600 dark:text-teal-400 font-mono text-[10px]">{targetUrl}</code>
                                                        </span>
                                                    ) : null;
                                                })()}
                                            </div>

                                            <div>
                                                <label className={labelClass}>
                                                    Tài khoản ký / CCCD
                                                </label>
                                                <input
                                                    type="text"
                                                    name="hsmUsername"
                                                    value={formData.hsmUsername}
                                                    onChange={handleChange}
                                                    className={inputClass}
                                                    placeholder="Tên đăng nhập HSM hoặc số CCCD..."
                                                />
                                            </div>

                                            <div>
                                                <label className={labelClass}>
                                                    Mật khẩu ký (PIN)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showHsmPassword ? 'text' : 'password'}
                                                        name="hsmPassword"
                                                        value={formData.hsmPassword}
                                                        onChange={handleChange}
                                                        className={`${inputClass} pr-10`}
                                                        placeholder={formData.hsmPassword ? '••••••••' : 'Nhập mã PIN hoặc mật khẩu ký...'}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowHsmPassword(!showHsmPassword)}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                                                        title={showHsmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                                    >
                                                        {showHsmPassword ? (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                                                            </svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label className={labelClass}>
                                                    Mã chứng thư (Credential ID)
                                                </label>
                                                <input
                                                    type="text"
                                                    name="signCredentialId"
                                                    value={formData.signCredentialId}
                                                    onChange={handleChange}
                                                    className={inputClass}
                                                    placeholder="Mã định danh (tùy chọn)..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 p-2 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/50 dark:border-teal-800/40 text-[11px] text-teal-800 dark:text-teal-300">
                                            <span className="font-bold shrink-0">Ghi chú:</span>
                                            <span>Lưu vào hệ thống <code className="font-mono font-bold">sys_user</code>, tự động dùng khi ký kết luận khám.</span>
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
