
import React, { useState, useEffect, useRef } from 'react';
import { useTheme, FontSettings } from '../../../contexts/ThemeContext';
import { useSession } from '../../../contexts/SessionContext';
import { useSystemStore, NavItemDTO } from '../../../stores/useSystemStore';
import { adminService } from '../../../services/adminService';
import { settingsService } from '../../../services/settingsService';
import {
    CogIcon, HospitalIcon, GlobeIcon, CheckCircleIcon, ArrowUpTrayIcon,
    ListBulletIcon, PencilIcon, TrashIcon, PlusIcon, EyeIcon, BanIcon,
    ChevronUpIcon, ChevronDownIcon, SearchIcon, XIcon
} from '../../../components/Icons';
import { OrganizationInfo } from '../../../types/common';
import { ICON_MAP } from '../../../components/icon-map';

const fontOptions = [
    { label: 'Nhỏ (Compact)', value: 'text-xs' },
    { label: 'Bình thường (Standard)', value: 'text-sm' },
    { label: 'Trung bình (Medium)', value: 'text-base' },
    { label: 'Lớn (Large)', value: 'text-lg' },
    { label: 'Rất lớn (Extra)', value: 'text-xl' },
];

const moduleOptions = [
    { value: 'reception', label: 'Tiếp nhận' },
    { value: 'consultation', label: 'Khám bệnh' },
    { value: 'billing', label: 'Viện phí' },
    { value: 'pharmacy', label: 'Dược' },
    { value: 'lab-results', label: 'Xét nghiệm' },
    { value: 'imaging-results', label: 'CĐHA' },
    { value: 'inpatient-treatment', label: 'Nội trú' },
    { value: 'surgery', label: 'Phẫu thuật' },
    { value: 'admin', label: 'Quản trị' },
    { value: 'online-booking', label: 'Đăng ký Online' },
    { value: 'hr', label: 'Nhân sự' },
];

const iconOptions = Object.keys(ICON_MAP).sort();

const SettingsView: React.FC = () => {
    const { fontSettings, updateFontSettings } = useTheme();
    const { orgInfo, setOrgInfo } = useSession();
    // Using Zustand Store
    const { menuConfig, updateMenuConfig, resetMenuConfig } = useSystemStore();

    const [activeTab, setActiveTab] = useState<'hospital' | 'menu'>('hospital');
    const [hospitalForm, setHospitalForm] = useState<OrganizationInfo>(orgInfo);
    const [isLoadingCompany, setIsLoadingCompany] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    
    // Using System Store for dynamic branding
    const { hospitalName, systemName, logoUrl, updateBrandingSettings } = useSystemStore();
    const [brandingForm, setBrandingForm] = useState({
        hospitalName: hospitalName,
        systemName: systemName,
        logoUrl: logoUrl
    });

    // Load company info from sys_company on mount
    useEffect(() => {
        const loadCompanyInfo = async () => {
            setIsLoadingCompany(true);
            try {
                const company = await settingsService.getCompanyInfo();
                if (company) {
                    setHospitalForm(prev => ({
                        ...prev,
                        hospitalName: company.hospitalName || prev.hospitalName,
                        governingUnitName: company.parentOrg || prev.governingUnitName,
                        address: company.address || prev.address,
                        hotline: company.phone || prev.hotline,
                        email: company.email || prev.email,
                        website: company.website || prev.website,
                    }));
                    setBrandingForm(prev => ({
                        ...prev,
                        hospitalName: company.hospitalName || prev.hospitalName,
                        logoUrl: company.logoUrl || prev.logoUrl,
                    }));
                }
            } catch (e) {
                // Fallback to store values
            } finally {
                setIsLoadingCompany(false);
            }
        };
        loadCompanyInfo();
    }, []);

    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update form if global orgInfo changes
    useEffect(() => {
        setHospitalForm(orgInfo);
    }, [orgInfo]);

    // Update branding form when store values change
    useEffect(() => {
        setBrandingForm({
            hospitalName: hospitalName,
            systemName: systemName,
            logoUrl: logoUrl
        });
    }, [hospitalName, systemName, logoUrl]);

    // Update menu items when module selection changes or config updates
    const [selectedModule, setSelectedModule] = useState('reception');
    const [currentMenuItems, setCurrentMenuItems] = useState<NavItemDTO[]>([]);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<NavItemDTO | null>(null);
    const [newItem, setNewItem] = useState<Partial<NavItemDTO>>({ name: '', path: '', iconName: 'Squares2X2Icon', isVisible: true });


    useEffect(() => {
        if (menuConfig[selectedModule]) {
            setCurrentMenuItems(menuConfig[selectedModule]);
        } else {
            setCurrentMenuItems([]);
        }
    }, [selectedModule, menuConfig]);

    const handleFontChange = (key: keyof FontSettings, value: string) => {
        updateFontSettings({ [key]: value });
    };

    const handleHospitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setHospitalForm(prev => ({ ...prev, [name]: value }));
    };

    const handleBrandingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setBrandingForm(prev => ({ ...prev, [name]: value }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBrandingForm(prev => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveHospital = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Update Branding Settings (SystemStore) - system name
            await updateBrandingSettings([
                { key: 'general_system_name', value: brandingForm.systemName }
            ]);
            
            // Update logo in sys_company if it's base64
            if (brandingForm.logoUrl && brandingForm.logoUrl.startsWith('data:image')) {
                await settingsService.updateCompanyLogo(brandingForm.logoUrl);
            }
            
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            alert('Lỗi khi lưu thông tin.');
        } finally {
            setIsSaving(false);
        }
    };

    // --- MENU MANAGEMENT HANDLERS ---

    const handleMoveItem = (index: number, direction: 'up' | 'down') => {
        const newItems = [...currentMenuItems];
        if (direction === 'up' && index > 0) {
            [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
        } else if (direction === 'down' && index < newItems.length - 1) {
            [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
        }
        updateMenuConfig(selectedModule, newItems);
    };

    const handleToggleVisibility = (index: number) => {
        const newItems = [...currentMenuItems];
        newItems[index].isVisible = !newItems[index].isVisible;
        updateMenuConfig(selectedModule, newItems);
    };

    const handleDeleteItem = (index: number) => {
        if (confirm("Bạn có chắc chắn muốn xóa mục này?")) {
            const newItems = currentMenuItems.filter((_, i) => i !== index);
            updateMenuConfig(selectedModule, newItems);
        }
    };

    // Improved Edit Handler with Index
    const [editingIndex, setEditingIndex] = useState<number>(-1);

    const openAddModal = () => {
        setEditingIndex(-1);
        setNewItem({ name: '', path: `/${selectedModule}/new-path`, iconName: 'Squares2X2Icon', isVisible: true });
        setIsMenuModalOpen(true);
    }

    const openEditModal = (index: number) => {
        setEditingIndex(index);
        setNewItem({ ...currentMenuItems[index] });
        setIsMenuModalOpen(true);
    }

    const saveMenuModal = () => {
        if (!newItem.name || !newItem.path) return alert("Thiếu thông tin");
        const updatedList = [...currentMenuItems];
        if (editingIndex >= 0) {
            updatedList[editingIndex] = newItem as NavItemDTO;
        } else {
            updatedList.push(newItem as NavItemDTO);
        }
        updateMenuConfig(selectedModule, updatedList);
        setIsMenuModalOpen(false);
    }

    const handleResetMenu = () => {
        if (confirm("Khôi phục menu mặc định cho phân hệ này?")) {
            resetMenuConfig(selectedModule);
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto h-full flex flex-col">
            <div className="flex items-center space-x-3 mb-2 border-b border-slate-200 dark:border-slate-700 pb-4 shrink-0">
                <CogIcon className="h-8 w-8 text-primary dark:text-dark-primary" />
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cấu hình Hệ thống</h1>
                    <p className="text-slate-500 dark:text-slate-400">Thiết lập hiển thị và thông tin đơn vị.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-4 shrink-0">
                <button
                    onClick={() => setActiveTab('hospital')}
                    className={`pb-2 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'hospital' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Thông tin Bệnh viện
                </button>
                <button
                    onClick={() => setActiveTab('menu')}
                    className={`pb-2 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'menu' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Quản lý Menu
                </button>
            </div>


            {/* TAB: HOSPITAL INFO */}
            {activeTab === 'hospital' && (
                <div className="flex-1 overflow-y-auto space-y-5 pb-4">
                    {/* Header Card */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-5 flex items-center gap-4 shadow-lg">
                        <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center overflow-hidden border-2 border-white/30 shrink-0">
                            {brandingForm.logoUrl ? (
                                <img src={brandingForm.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <HospitalIcon className="w-8 h-8 text-white" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">{hospitalForm.governingUnitName || 'Đơn vị chủ quản'}</p>
                            <h2 className="text-white font-extrabold text-xl leading-tight truncate">{brandingForm.hospitalName || 'Tên Bệnh viện'}</h2>
                            <p className="text-blue-200 text-sm">{brandingForm.systemName}</p>
                        </div>
                        {isLoadingCompany && (
                            <div className="ml-auto">
                                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSaveHospital} className="space-y-5">
                        {/* Section 1: Thông tin định danh (read-only from sys_company) */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Thông tin Định danh</h4>
                                <span className="ml-auto text-xs text-slate-400 italic">Đọc từ bảng SYS_COMPANY · Không thể chỉnh sửa tại đây</span>
                            </div>
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Tên Bệnh viện (sc_name)</label>
                                    <div className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold text-base">
                                        {brandingForm.hospitalName || <span className="text-slate-400 italic font-normal">Chưa cấu hình</span>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Đơn vị chủ quản (sc_pname)</label>
                                    <div className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium">
                                        {hospitalForm.governingUnitName || <span className="text-slate-400 italic font-normal">Chưa cấu hình</span>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Địa chỉ (sc_address)</label>
                                    <div className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                                        {hospitalForm.address || <span className="text-slate-400 italic">Chưa cấu hình</span>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Hotline (sc_phone)</label>
                                    <div className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 font-mono">
                                        {hospitalForm.hotline || <span className="text-slate-400 italic font-sans">Chưa cấu hình</span>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Email (sc_email)</label>
                                    <div className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                                        {hospitalForm.email || <span className="text-slate-400 italic">Chưa cấu hình</span>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wide">Website (sc_website)</label>
                                    <div className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300">
                                        {hospitalForm.website ? (
                                            <a href={hospitalForm.website} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{hospitalForm.website}</a>
                                        ) : <span className="text-slate-400 italic">Chưa cấu hình</span>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Cấu hình Hiển thị (editable) */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Cấu hình Hiển thị</h4>
                                <span className="ml-auto text-xs text-blue-600 font-semibold">✎ Có thể chỉnh sửa</span>
                            </div>
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Tiêu đề Hệ thống (Subtitle)</label>
                                    <input
                                        type="text"
                                        name="systemName"
                                        value={brandingForm.systemName}
                                        onChange={handleBrandingChange}
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-semibold text-blue-600 dark:text-blue-400 transition text-sm"
                                        placeholder="HỆ THỐNG QUẢN LÝ TỔNG THỂ BỆNH VIỆN"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Hiển thị bên dưới tên bệnh viện trên Header và trang đăng nhập.</p>
                                </div>

                                {/* Logo Upload */}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wide">Logo Bệnh viện</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex items-center justify-center overflow-hidden shrink-0">
                                            {brandingForm.logoUrl ? (
                                                <img src={brandingForm.logoUrl} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                                            ) : (
                                                <div className="text-center">
                                                    <GlobeIcon className="w-8 h-8 text-slate-300 mx-auto" />
                                                    <p className="text-slate-400 text-xs mt-1">Chưa có Logo</p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/png,image/jpg,image/jpeg,image/svg+xml,image/webp"
                                                onChange={handleLogoUpload}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="flex items-center gap-2 px-5 py-3 border-2 border-blue-400 dark:border-blue-600 rounded-lg text-blue-600 dark:text-blue-400 font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                                            >
                                                <ArrowUpTrayIcon className="w-4 h-4" /> Chọn ảnh Logo (PNG / JPG / SVG)
                                            </button>
                                            <p className="text-xs text-slate-400 mt-2">Ảnh sẽ được lưu dạng Base64 trực tiếp vào bảng <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">sys_company</code>. Đề nghị dùng ảnh nền trắng/trong suốt, dung lượng &lt; 500KB.</p>
                                            {brandingForm.logoUrl && brandingForm.logoUrl.startsWith('data:image') && (
                                                <p className="text-xs text-emerald-600 font-semibold mt-1">✓ Ảnh mới đã sẵn sàng – Nhấn "Lưu thay đổi" để áp dụng</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Save button */}
                        <div className="flex items-center justify-end gap-4">
                            {saveSuccess && (
                                <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm animate-fade-in">
                                    <CheckCircleIcon className="w-5 h-5" /> Lưu thành công!
                                </div>
                            )}
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang lưu...</>
                                ) : (
                                    <><CheckCircleIcon className="w-5 h-5" /> Lưu thay đổi</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* TAB: MENU CONFIG */}
            {activeTab === 'menu' && (
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <ListBulletIcon className="w-6 h-6 text-indigo-600" />
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Cấu hình Menu Sidebar</h3>
                                <p className="text-sm text-slate-500">Tùy chỉnh danh sách chức năng cho từng phân hệ.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                                className="p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                            >
                                {moduleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <button onClick={openAddModal} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow flex items-center gap-2 transition">
                                <PlusIcon className="w-4 h-4" /> Thêm mục
                            </button>
                            <button onClick={handleResetMenu} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition text-xs">
                                Khôi phục mặc định
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase sticky top-0">
                                <tr>
                                    <th className="p-3 w-16 text-center">STT</th>
                                    <th className="p-3 w-16 text-center">Icon</th>
                                    <th className="p-3">Tên Menu</th>
                                    <th className="p-3">Đường dẫn (Path)</th>
                                    <th className="p-3 text-center">Hiển thị</th>
                                    <th className="p-3 text-center w-24">Sắp xếp</th>
                                    <th className="p-3 text-right w-24">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {currentMenuItems.map((item, idx) => {
                                    const IconComponent = ICON_MAP[item.iconName] || ICON_MAP['Squares2X2Icon'];
                                    return (
                                        <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition ${!item.isVisible ? 'opacity-50 bg-slate-50 dark:bg-slate-900' : ''}`}>
                                            <td className="p-3 text-center text-slate-400">{idx + 1}</td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center">
                                                    <IconComponent className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                            </td>
                                            <td className="p-3 font-medium text-slate-800 dark:text-white">{item.name}</td>
                                            <td className="p-3 font-mono text-slate-500 text-xs">{item.path}</td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => handleToggleVisibility(idx)} className={`p-1 rounded ${item.isVisible ? 'text-green-600 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-100'}`}>
                                                    {item.isVisible ? <EyeIcon className="w-4 h-4" /> : <BanIcon className="w-4 h-4" />}
                                                </button>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button
                                                        disabled={idx === 0}
                                                        onClick={() => handleMoveItem(idx, 'up')}
                                                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                                                    >
                                                        <ChevronUpIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        disabled={idx === currentMenuItems.length - 1}
                                                        onClick={() => handleMoveItem(idx, 'down')}
                                                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                                                    >
                                                        <ChevronDownIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openEditModal(idx)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"><PencilIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteItem(idx)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {currentMenuItems.length === 0 && (
                            <div className="p-10 text-center text-slate-400 italic">Menu trống. Hãy thêm mục mới.</div>
                        )}
                    </div>
                </div>
            )}

            {/* Menu Edit Modal */}
            {isMenuModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {editingIndex >= 0 ? 'Chỉnh sửa Menu Item' : 'Thêm Menu Item'}
                            </h3>
                            <button onClick={() => setIsMenuModalOpen(false)}><XIcon className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tên hiển thị</label>
                                <input
                                    type="text"
                                    value={newItem.name}
                                    onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="Ví dụ: Danh sách bệnh nhân"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Đường dẫn (Path)</label>
                                <input
                                    type="text"
                                    value={newItem.path}
                                    onChange={e => setNewItem({ ...newItem, path: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono text-sm"
                                    placeholder={`/${selectedModule}/...`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Icon</label>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                    <select
                                        value={newItem.iconName}
                                        onChange={e => setNewItem({ ...newItem, iconName: e.target.value })}
                                        className="w-full pl-9 p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white appearance-none"
                                    >
                                        {iconOptions.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                                    </select>
                                    <div className="absolute right-3 top-2 pointer-events-none">
                                        {newItem.iconName && React.createElement(ICON_MAP[newItem.iconName] || ICON_MAP['Squares2X2Icon'], { className: "w-5 h-5 text-indigo-600" })}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isVisible"
                                    checked={newItem.isVisible}
                                    onChange={e => setNewItem({ ...newItem, isVisible: e.target.checked })}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="isVisible" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">Hiển thị trên Sidebar</label>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                            <button onClick={() => setIsMenuModalOpen(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition">Hủy</button>
                            <button onClick={saveMenuModal} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow hover:bg-indigo-700 transition">Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsView;
