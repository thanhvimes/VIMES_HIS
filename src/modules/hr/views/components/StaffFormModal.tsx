
import React, { useState, useEffect, useRef } from 'react';
import { 
    XIcon, 
    SaveIcon, 
    CameraIcon, 
    UserCircleIcon, 
    BriefcaseIcon, 
    CashIcon, 
    IdentificationIcon, 
    PhoneIcon, 
    HomeIcon,
    CalendarDaysIcon
} from '../../../../components/Icons';
import { Staff } from '../../data';

interface StaffFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Staff;
    onSave: (data: Staff) => void;
}

const emptyStaff: Staff = {
    id: '',
    employeeCode: '',
    fullName: '',
    gender: 'Nam',
    dob: '',
    phone: '',
    email: '',
    address: '',
    identityCard: '',
    department: '',
    role: '',
    type: 'Full-time',
    status: 'Active',
    joinDate: new Date().toISOString().slice(0, 10),
    basicSalary: 0,
    bankAccount: '',
    bankName: '',
    taxCode: '',
    socialInsuranceNo: '',
    licenseNumber: '',
    avatar: ''
};

const StaffFormModal: React.FC<StaffFormModalProps> = ({ isOpen, onClose, initialData, onSave }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'work' | 'payroll'>('info');
    const [formData, setFormData] = useState<Staff>(emptyStaff);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData(initialData);
            } else {
                setFormData({ 
                    ...emptyStaff, 
                    id: `NV${Date.now()}`, 
                    employeeCode: `S${Math.floor(Math.random()*1000)}` 
                });
            }
            setActiveTab('info');
        }
    }, [isOpen, initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    setFormData(prev => ({ ...prev, avatar: event.target!.result as string }));
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName || !formData.phone) {
            alert("Vui lòng điền các thông tin bắt buộc.");
            return;
        }
        onSave(formData);
        onClose();
    };

    if (!isOpen) return null;

    const inputClass = "w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-slate-900 dark:text-white";
    const labelClass = "block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5";

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in max-h-[90vh]">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                            {initialData ? 'Cập nhật Hồ sơ Nhân viên' : 'Thêm mới Nhân viên'}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {initialData ? `ID: ${formData.employeeCode}` : 'Nhập thông tin chi tiết cho nhân sự mới'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
                    <button 
                        onClick={() => setActiveTab('info')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'info' ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-slate-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <UserCircleIcon className="w-4 h-4"/> Thông tin Cá nhân
                    </button>
                    <button 
                        onClick={() => setActiveTab('work')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'work' ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-slate-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <BriefcaseIcon className="w-4 h-4"/> Công việc
                    </button>
                    <button 
                        onClick={() => setActiveTab('payroll')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'payroll' ? 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-slate-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        <CashIcon className="w-4 h-4"/> Lương & Bảo hiểm
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                    
                    {/* AVATAR UPLOAD (Common) */}
                    <div className="flex justify-center mb-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-md bg-slate-200">
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                                        <UserCircleIcon className="w-12 h-12"/>
                                    </div>
                                )}
                            </div>
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm transition border-2 border-white dark:border-slate-800"
                            >
                                <CameraIcon className="w-4 h-4"/>
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                        </div>
                    </div>

                    {activeTab === 'info' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                            <div className="col-span-1 md:col-span-2">
                                <label className={labelClass}>Họ và tên <span className="text-red-500">*</span></label>
                                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={`${inputClass} font-bold uppercase`} required />
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
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Số CCCD / CMND</label>
                                <div className="relative">
                                    <IdentificationIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                                    <input type="text" name="identityCard" value={formData.identityCard} onChange={handleChange} className={`${inputClass} pl-10`} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Điện thoại <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <PhoneIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={`${inputClass} pl-10`} required />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
                            </div>
                            <div className="col-span-1 md:col-span-2">
                                <label className={labelClass}>Địa chỉ thường trú</label>
                                <div className="relative">
                                    <HomeIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                                    <input type="text" name="address" value={formData.address} onChange={handleChange} className={`${inputClass} pl-10`} />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'work' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                            <div>
                                <label className={labelClass}>Mã Nhân viên</label>
                                <input type="text" name="employeeCode" value={formData.employeeCode} onChange={handleChange} className={`${inputClass} font-mono`} />
                            </div>
                            <div>
                                <label className={labelClass}>Trạng thái làm việc</label>
                                <select name="status" value={formData.status} onChange={handleChange} className={inputClass}>
                                    <option value="Active">Đang làm việc</option>
                                    <option value="Probation">Thử việc</option>
                                    <option value="Maternity">Thai sản</option>
                                    <option value="OnLeave">Nghỉ phép</option>
                                    <option value="Resigned">Đã nghỉ việc</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Khoa / Phòng ban</label>
                                <select name="department" value={formData.department} onChange={handleChange} className={inputClass}>
                                    <option value="">-- Chọn Khoa/Phòng --</option>
                                    <option>Khoa Nội Tổng Quát</option>
                                    <option>Khoa Ngoại</option>
                                    <option>Khoa Nhi</option>
                                    <option>Khoa Sản</option>
                                    <option>Chẩn đoán hình ảnh</option>
                                    <option>Khoa Xét nghiệm</option>
                                    <option>Khoa Dược</option>
                                    <option>Phòng Khám</option>
                                    <option>Hành chính - Kế toán</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Chức danh / Vị trí</label>
                                <input type="text" name="role" value={formData.role} onChange={handleChange} className={inputClass} placeholder="VD: Bác sĩ CKII, Điều dưỡng..." />
                            </div>
                            <div>
                                <label className={labelClass}>Loại hợp đồng</label>
                                <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                                    <option value="Full-time">Toàn thời gian</option>
                                    <option value="Part-time">Bán thời gian</option>
                                    <option value="Contract">Hợp đồng dịch vụ</option>
                                    <option value="Probation">Hợp đồng thử việc</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Số CCHN (Nếu có)</label>
                                <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Ngày bắt đầu làm việc</label>
                                <div className="relative">
                                    <CalendarDaysIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                                    <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} className={`${inputClass} pl-10`} />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Ngày kết thúc HĐ</label>
                                <input type="date" name="contractEndDate" value={formData.contractEndDate || ''} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>
                    )}

                    {activeTab === 'payroll' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                            <div className="col-span-1 md:col-span-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                                <label className={labelClass}>Lương cơ bản (Gross)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        name="basicSalary" 
                                        value={formData.basicSalary} 
                                        onChange={handleNumberChange} 
                                        className="w-full p-3 pr-12 text-xl font-bold text-right text-blue-700 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-slate-800 dark:border-slate-600 dark:text-blue-400" 
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">VND</span>
                                </div>
                            </div>
                            
                            <div>
                                <label className={labelClass}>Số tài khoản ngân hàng</label>
                                <input type="text" name="bankAccount" value={formData.bankAccount} onChange={handleChange} className={inputClass} placeholder="Số TK..." />
                            </div>
                            <div>
                                <label className={labelClass}>Ngân hàng thụ hưởng</label>
                                <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} className={inputClass} placeholder="Tên ngân hàng..." />
                            </div>
                            <div>
                                <label className={labelClass}>Mã số thuế cá nhân</label>
                                <input type="text" name="taxCode" value={formData.taxCode} onChange={handleChange} className={inputClass} />
                            </div>
                            <div>
                                <label className={labelClass}>Số sổ BHXH</label>
                                <input type="text" name="socialInsuranceNo" value={formData.socialInsuranceNo} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition">
                        Hủy bỏ
                    </button>
                    <button onClick={handleSubmit} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg flex items-center gap-2 transition transform active:scale-95">
                        <SaveIcon className="w-4 h-4"/> Lưu Hồ sơ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StaffFormModal;
