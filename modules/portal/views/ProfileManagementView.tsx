import React, { useState, useEffect } from 'react';
import { portalService, PortalProfile } from '../../../services/portalService';
import { UserIcon, PlusIcon, ChevronLeftIcon, SaveIcon, UsersIcon } from '../icons';
import { CameraIcon } from '../../../components/Icons';
import CCCDScannerModal from '../components/CCCDScannerModal';

const PROVINCES = [
    { code: '01', name: 'Hà Nội' },
    { code: '79', name: 'Hồ Chí Minh' },
    { code: '48', name: 'Đà Nẵng' },
    // Add more as needed
];

const DISTRICTS: Record<string, { code: string; name: string }[]> = {
    '01': [{ code: '001', name: 'Ba Đình' }, { code: '002', name: 'Hoàn Kiếm' }],
    '79': [{ code: '760', name: 'Quận 1' }, { code: '761', name: 'Quận 12' }],
    '48': [{ code: '490', name: 'Hải Châu' }, { code: '491', name: 'Thanh Khê' }]
};

const ETHNICITIES = [
    'Kinh', 'Tày', 'Thái', 'Mường', 'Khmer', 'Hoa', 'Nùng', 'Hmông',
    'Dao', 'Gia Rai', 'Ê Đê', 'Ba Na', 'Xơ Đăng', 'Sán Chay', 'Cơ Ho',
    'Chăm', 'Sán Dìu', 'Hrê', 'Ra Glai', 'Mnông', 'Khác'
];

const ProfileManagementView: React.FC = () => {
    const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
    const [profiles, setProfiles] = useState<PortalProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [showScanner, setShowScanner] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        name: '',
        gender: 'Nam',
        dob: '',
        phone: '',
        cccd: '',
        issueDate: '',
        province: '',
        district: '',
        address: '',
        ethnicity: '',
        occupation: '',
        email: ''
    });

    // State for editing mode
    const [isEditing, setIsEditing] = useState(false);

    // Detect mobile for camera button
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        'ontouchstart' in window || navigator.maxTouchPoints > 0;

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        try {
            const data = await portalService.getProfiles();
            setProfiles(data);
        } catch (error) {
            console.error('Error fetching profiles', error);
            setMessage({ type: 'error', text: 'Không thể tải danh sách hồ sơ' });
        }
    };

    const handleEdit = (profile: PortalProfile) => {
        setIsEditing(true);
        setFormData({
            name: profile.name,
            gender: profile.gender || 'Nam',
            dob: profile.birthDate,
            phone: profile.phone || '',
            cccd: profile.patient_no || profile.id,
            issueDate: profile.id_card_issue_date || '',
            province: profile.province_code || '',
            district: profile.district_code || '',
            address: profile.address_detail || '',
            ethnicity: profile.ethnicity || '',
            occupation: profile.occupation || '',
            email: profile.email || ''
        });
        setView('FORM');
    };

    const handleCreateNew = () => {
        setIsEditing(false);
        setFormData({
            name: '', gender: 'Nam', dob: '', phone: '', cccd: '',
            issueDate: '', province: '', district: '', address: '',
            ethnicity: '', occupation: '', email: ''
        });
        setView('FORM');
    }

    const handleCCCDScan = (data: { cccd: string; name: string; dob: string; gender: string; address: string; issueDate: string }) => {
        // Convert YYYY-MM-DD to DD/MM/YYYY for display
        const formatDisplay = (dateStr: string) => {
            if (!dateStr) return '';
            const parts = dateStr.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
            return dateStr;
        };

        // Try to match province from address
        let matchedProvince = '';
        if (data.address) {
            const addrParts = data.address.split(',').map(s => s.trim());
            const provinceStr = addrParts[addrParts.length - 1] || '';
            const found = PROVINCES.find(p => {
                const cleanP = p.name.toLowerCase().replace(/(tỉnh|thành phố|tp\.?)\s+/g, '').trim();
                const cleanI = provinceStr.toLowerCase().replace(/(tỉnh|thành phố|tp\.?)\s+/g, '').trim();
                return cleanP.includes(cleanI) || cleanI.includes(cleanP);
            });
            if (found) matchedProvince = found.code;
        }

        setFormData(prev => ({
            ...prev,
            cccd: data.cccd,
            name: data.name,
            dob: formatDisplay(data.dob),
            gender: data.gender,
            issueDate: formatDisplay(data.issueDate),
            address: data.address,
            province: matchedProvince
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        try {
            if (isEditing) {
                const profile = profiles.find(p => p.patient_no === formData.cccd || p.id === formData.cccd);
                if (!profile) {
                    throw new Error('Không tìm thấy hồ sơ');
                }

                await portalService.updateProfile(profile.id, {
                    phone: formData.phone,
                    id_card: formData.cccd,
                    id_card_issue_date: formData.issueDate,
                    province_code: formData.province,
                    district_code: formData.district,
                    address_detail: formData.address,
                    ethnicity: formData.ethnicity,
                    occupation: formData.occupation,
                    email: formData.email
                });

                setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
            } else {
                await portalService.createProfile(formData.cccd, formData.dob, 'Mới');
                setMessage({ type: 'success', text: 'Liên kết hồ sơ thành công!' });
            }

            await fetchProfiles();

            setTimeout(() => {
                setView('LIST');
                setMessage({ type: '', text: '' });
                handleCreateNew();
            }, 1000);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || error.error || 'Có lỗi xảy ra' });
        } finally {
            setIsLoading(false);
        }
    };

    // --- SUB-COMPONENTS ---

    const ProfileList = () => (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Quản lý hồ sơ</h1>
                    <p className="text-slate-500 font-medium">Liên kết hồ sơ y tế của bạn và người thân</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-teal-600/20 transition-all active:scale-95"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Thêm hồ sơ</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profiles.map((profile, idx) => (
                    <div
                        key={idx}
                        onClick={() => handleEdit(profile)}
                        className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-teal-400 cursor-pointer hover:shadow-md transition-all group relative overflow-hidden"
                    >
                        <div className="absolute right-0 top-0 bg-teal-500 text-white text-[10px] px-2 py-0.5 rounded-bl-xl font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            CẬP NHẬT
                        </div>
                        <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                            <UserIcon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-800 text-lg">{profile.name}</h3>
                                {profile.relationship === 'Bản thân' && (
                                    <span className="text-[10px] font-black px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full uppercase">SELF</span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 font-bold mt-1">PID: <span className="text-slate-700">{profile.id}</span> • {profile.birthDate}</p>
                        </div>
                    </div>
                ))}
            </div>

            {profiles.length === 0 && (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 mt-4">
                    <p className="text-slate-400 font-bold">Chưa có hồ sơ nào được liên kết.</p>
                </div>
            )}
        </div>
    );

    const inputClass = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all font-medium text-slate-700";
    const labelClass = "text-xs font-black text-slate-700 uppercase";

    const ProfileForm = () => (
        <div className="animate-slide-up max-w-4xl mx-auto">
            <button
                onClick={() => setView('LIST')}
                className="flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold mb-6 transition-colors"
            >
                <ChevronLeftIcon className="w-5 h-5" /> Quay lại Trang chủ
            </button>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center flex-wrap gap-3">
                    <h2 className="text-xl font-black text-teal-700 flex items-center gap-3 uppercase tracking-wide">
                        <UsersIcon className="w-6 h-6" /> {isEditing ? 'Cập nhật thông tin' : 'Kiểm tra & Cập nhật thông tin'}
                    </h2>
                    <div className="flex items-center gap-2">
                        {/* CCCD Scanner Button - show on mobile or always for testing */}
                        <button
                            type="button"
                            onClick={() => setShowScanner(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-600/20"
                        >
                            <CameraIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">Quét CCCD</span>
                        </button>
                        {isEditing && <span className="bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded font-bold">MODE: EDIT</span>}
                    </div>
                </div>

                <form onSubmit={handleSave} className="p-6 md:p-8 space-y-8">
                    {/* Row 1: Name & Gender */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-2">
                            <label className={labelClass}>Họ và tên bệnh nhân <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="NGUYỄN VĂN A"
                                className={`${inputClass} font-bold uppercase`}
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClass}>Giới tính</label>
                            <select
                                className={inputClass}
                                value={formData.gender}
                                onChange={e => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                            </select>
                        </div>
                    </div>

                    {/* Row 2: DOB & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className={labelClass}>Ngày sinh (DD/MM/YYYY) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="dd/mm/yyyy"
                                className={inputClass}
                                value={formData.dob}
                                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClass}>Số điện thoại <span className="text-red-500">*</span></label>
                            <input
                                type="tel"
                                required
                                placeholder="09xxxxxxxx"
                                className={inputClass}
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Row 3: CCCD & Issue Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className={labelClass}>Số CCCD (12 số) <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                required
                                placeholder="0010xxxxxxxx"
                                className={inputClass}
                                value={formData.cccd}
                                onChange={e => setFormData({ ...formData, cccd: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClass}>Ngày cấp</label>
                            <input
                                type="text"
                                placeholder="dd/mm/yyyy"
                                className={inputClass}
                                value={formData.issueDate}
                                onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Row 4: Ethnicity, Occupation, Email (NEW) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className={labelClass}>Dân tộc</label>
                            <select
                                className={inputClass}
                                value={formData.ethnicity}
                                onChange={e => setFormData({ ...formData, ethnicity: e.target.value })}
                            >
                                <option value="">-- Chọn dân tộc --</option>
                                {ETHNICITIES.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className={labelClass}>Nghề nghiệp</label>
                            <input
                                type="text"
                                placeholder="Ví dụ: Kỹ sư, Giáo viên..."
                                className={inputClass}
                                value={formData.occupation}
                                onChange={e => setFormData({ ...formData, occupation: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className={labelClass}>Địa chỉ Email</label>
                            <input
                                type="email"
                                placeholder="email@example.com"
                                className={inputClass}
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 my-4"></div>

                    {/* Row 5: Address */}
                    <div className="space-y-4">
                        <label className="text-xs font-black text-teal-600 uppercase">Địa chỉ thường trú <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <select
                                className={inputClass}
                                value={formData.province}
                                onChange={e => setFormData({ ...formData, province: e.target.value, district: '' })}
                            >
                                <option value="">-- Tỉnh/TP --</option>
                                {PROVINCES.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                            </select>
                            <select
                                className={inputClass}
                                value={formData.district}
                                onChange={e => setFormData({ ...formData, district: e.target.value })}
                                disabled={!formData.province}
                            >
                                <option value="">-- Quận/Huyện --</option>
                                {formData.province && DISTRICTS[formData.province]?.map(d => (
                                    <option key={d.code} value={d.code}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <input
                            type="text"
                            placeholder="Số nhà, tên đường..."
                            className={inputClass}
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6 mt-6 border-t border-slate-100 sticky bottom-0 bg-white/95 backdrop-blur-sm -mx-6 px-6 py-4 md:static md:bg-transparent md:border-0 md:p-0 md:m-0 z-10">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full md:w-auto md:float-right flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-teal-600/20 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isLoading ? 'Đang lưu...' : (
                                <>
                                    <SaveIcon className="w-5 h-5" /> Lưu hồ sơ
                                </>
                            )}
                        </button>
                        <div className="clear-both"></div>
                    </div>
                </form>
            </div>

            {message.text && (
                <div className={`mt-6 p-4 rounded-xl flex items-center gap-3 animate-slide-up ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <p className="font-bold text-sm">{message.text}</p>
                </div>
            )}
        </div>
    );

    return (
        <div className="h-full overflow-y-auto w-full custom-scrollbar pb-32">
            <div className="p-4 md:p-6 max-w-5xl mx-auto">
                {view === 'LIST' ? <ProfileList /> : <ProfileForm />}
            </div>

            {/* CCCD Scanner Modal */}
            <CCCDScannerModal
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onScanSuccess={handleCCCDScan}
            />
        </div>
    );
};

export default ProfileManagementView;
