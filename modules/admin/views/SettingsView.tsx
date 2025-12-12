
import React, { useState, useEffect, useRef } from 'react';
import { useTheme, FontSettings } from '../../../contexts/ThemeContext';
import { useSession } from '../../../contexts/SessionContext';
import { useSystem, NavItemDTO } from '../../../contexts/SystemContext';
import { adminService } from '../../../services/adminService';
import { 
    CogIcon, HospitalIcon, GlobeIcon, CheckCircleIcon, ArrowUpTrayIcon, 
    ListBulletIcon, PencilIcon, TrashIcon, PlusIcon, EyeIcon, BanIcon,
    ChevronUpIcon, ChevronDownIcon, SearchIcon, XIcon
} from '../../../components/Icons';
import { OrganizationInfo } from '../../../types/common';
import { ICON_MAP } from '../../../components/Icons';

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
    { value: 'hr', label: 'Nhân sự' },
];

const iconOptions = Object.keys(ICON_MAP).sort();

const SettingsView: React.FC = () => {
    const { fontSettings, updateFontSettings } = useTheme();
    const { orgInfo, setOrgInfo } = useSession();
    const { menuConfig, updateMenuConfig, resetMenuConfig } = useSystem();
    
    const [activeTab, setActiveTab] = useState<'display' | 'hospital' | 'menu'>('display');
    const [hospitalForm, setHospitalForm] = useState<OrganizationInfo>(orgInfo);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Menu Management State
    const [selectedModule, setSelectedModule] = useState('reception');
    const [currentMenuItems, setCurrentMenuItems] = useState<NavItemDTO[]>([]);
    const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<NavItemDTO | null>(null);
    const [newItem, setNewItem] = useState<Partial<NavItemDTO>>({ name: '', path: '', iconName: 'Squares2X2Icon', isVisible: true });

    // Update form if global orgInfo changes
    useEffect(() => {
        setHospitalForm(orgInfo);
    }, [orgInfo]);

    // Update menu items when module selection changes or config updates
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

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setHospitalForm(prev => ({ ...prev, logoUrl: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveHospital = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const updatedInfo = await adminService.updateOrganizationInfo(hospitalForm);
            setOrgInfo(updatedInfo);
            alert("Cập nhật thông tin bệnh viện thành công!");
        } catch (error) {
            alert("Lỗi khi lưu thông tin.");
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

    const handleSaveItem = () => {
        const itemToSave = editingItem || newItem;
        if (!itemToSave.name || !itemToSave.path) {
            alert("Vui lòng nhập tên và đường dẫn");
            return;
        }

        let newItems = [...currentMenuItems];
        if (editingItem) {
            // Update existing
            const index = newItems.findIndex(i => i.name === editingItem.name && i.path === editingItem.path); // Simple identifier match
            // A better way is using ID if available, but here we replace based on array index passed or just handle editing state better. 
            // Simplified: We actually need the index or unique ID. Let's assume we pass the index to handleEditItem instead.
            // For now, let's just append or replace based on logic below.
            // Correction: editingItem is a copy. We need to know which one we are editing.
            // Let's rely on UI state: if editingItem is set, we are in edit mode.
            // But we need the index. Let's modify handleEditItem to store index.
        } else {
             // Add new
             newItems.push(itemToSave as NavItemDTO);
        }
        updateMenuConfig(selectedModule, newItems);
        setIsMenuModalOpen(false);
        setEditingItem(null);
        setNewItem({ name: '', path: '', iconName: 'Squares2X2Icon', isVisible: true });
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
        setNewItem({...currentMenuItems[index]});
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
        if(confirm("Khôi phục menu mặc định cho phân hệ này?")) {
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
                    onClick={() => setActiveTab('display')}
                    className={`pb-2 px-4 text-sm font-bold transition-colors border-b-2 ${activeTab === 'display' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    Giao diện & Hiển thị
                </button>
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

            {/* TAB: DISPLAY SETTINGS */}
            {activeTab === 'display' && (
                <div className="grid grid-cols-1 gap-8 overflow-y-auto">
                    {/* Worklists Setting */}
                    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Danh sách công việc (Orders/Worklists)</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Áp dụng cho: Danh sách chờ khám, DS Xét nghiệm, DS Thuốc...</p>
                            </div>
                            <div className="w-64">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chọn kích thước</label>
                                <select 
                                    value={fontSettings.listPrimary}
                                    onChange={(e) => handleFontChange('listPrimary', e.target.value)}
                                    className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600"
                                >
                                    {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                            <p className="text-xs text-slate-400 uppercase font-bold mb-2">Xem trước</p>
                            <div className={`flex justify-between p-3 bg-white dark:bg-slate-800 rounded shadow-sm ${fontSettings.listPrimary}`}>
                                <span className="font-bold text-blue-600">Nguyễn Văn A</span>
                                <span>08:30 - Khám tổng quát</span>
                            </div>
                        </div>
                    </div>

                    {/* Controls Setting */}
                    <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Nhập liệu (Controls)</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Áp dụng cho: Ô nhập liệu, Nút bấm...</p>
                            </div>
                            <div className="w-64">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Chọn kích thước</label>
                                <select 
                                    value={fontSettings.controls}
                                    onChange={(e) => handleFontChange('controls', e.target.value)}
                                    className="w-full p-2 border rounded-md bg-white dark:bg-slate-700 dark:border-slate-600"
                                >
                                    {fontOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                            <div className="flex items-end gap-2">
                                <div className="flex-1">
                                    <label className={`block font-bold text-slate-700 dark:text-slate-300 mb-1 ${fontSettings.controls}`}>Họ tên</label>
                                    <input type="text" value="Nguyễn Văn A" readOnly className={`w-full p-2 border rounded-lg ${fontSettings.controls}`} />
                                </div>
                                <button className={`px-4 py-2 bg-blue-600 text-white rounded-lg font-bold ${fontSettings.controls}`}>Lưu</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: HOSPITAL INFO */}
            {activeTab === 'hospital' && (
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in overflow-y-auto">
                    <div className="flex items-start gap-4 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                            <HospitalIcon className="w-8 h-8"/>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Thông tin Đơn vị</h3>
                            <p className="text-sm text-slate-500">Thông tin này sẽ hiển thị trên Header và các báo cáo/phiếu in.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSaveHospital} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column: Logo & Basic */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tên Bệnh viện (Hiển thị lớn)</label>
                                    <input 
                                        type="text" 
                                        name="hospitalName"
                                        value={hospitalForm.hospitalName}
                                        onChange={handleHospitalChange}
                                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                                        placeholder="BỆNH VIỆN..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Đơn vị chủ quản (Sở/Bộ)</label>
                                    <input 
                                        type="text" 
                                        name="governingUnitCode"
                                        value={hospitalForm.governingUnitCode}
                                        onChange={handleHospitalChange}
                                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                                        placeholder="SỞ Y TẾ..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Mã KCB (Hospital Code)</label>
                                    <input 
                                        type="text" 
                                        name="hospitalCode"
                                        value={hospitalForm.hospitalCode}
                                        onChange={handleHospitalChange}
                                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 font-mono"
                                    />
                                </div>
                            </div>

                            {/* Right Column: Contact & Logo URL */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Logo</label>
                                    <div className="flex gap-2 items-start">
                                        <div className="flex-1">
                                            <input 
                                                type="text" 
                                                name="logoUrl"
                                                value={hospitalForm.logoUrl}
                                                onChange={handleHospitalChange}
                                                className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                                                placeholder="https://... hoặc tải ảnh lên"
                                            />
                                            <input 
                                                type="file" 
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                            />
                                            <button 
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="text-xs flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                                            >
                                                <ArrowUpTrayIcon className="w-3 h-3"/> Tải ảnh lên từ máy
                                            </button>
                                        </div>
                                        <div className="w-16 h-16 bg-white border rounded-lg flex items-center justify-center shrink-0 p-1 overflow-hidden shadow-sm">
                                            {hospitalForm.logoUrl ? (
                                                <img src={hospitalForm.logoUrl} alt="Logo Preview" className="w-full h-full object-contain"/>
                                            ) : (
                                                <GlobeIcon className="w-8 h-8 text-slate-300"/>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Địa chỉ</label>
                                    <input 
                                        type="text" 
                                        name="address"
                                        value={hospitalForm.address}
                                        onChange={handleHospitalChange}
                                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Hotline</label>
                                    <input 
                                        type="text" 
                                        name="hotline"
                                        value={hospitalForm.hotline}
                                        onChange={handleHospitalChange}
                                        className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-70"
                            >
                                {isSaving ? 'Đang lưu...' : <><CheckCircleIcon className="w-5 h-5"/> Lưu Thay Đổi</>}
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
                            <ListBulletIcon className="w-6 h-6 text-indigo-600"/>
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
                                <PlusIcon className="w-4 h-4"/> Thêm mục
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
                                                    <IconComponent className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/>
                                                </div>
                                            </td>
                                            <td className="p-3 font-medium text-slate-800 dark:text-white">{item.name}</td>
                                            <td className="p-3 font-mono text-slate-500 text-xs">{item.path}</td>
                                            <td className="p-3 text-center">
                                                <button onClick={() => handleToggleVisibility(idx)} className={`p-1 rounded ${item.isVisible ? 'text-green-600 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-100'}`}>
                                                    {item.isVisible ? <EyeIcon className="w-4 h-4"/> : <BanIcon className="w-4 h-4"/>}
                                                </button>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <button 
                                                        disabled={idx === 0} 
                                                        onClick={() => handleMoveItem(idx, 'up')}
                                                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                                                    >
                                                        <ChevronUpIcon className="w-4 h-4"/>
                                                    </button>
                                                    <button 
                                                        disabled={idx === currentMenuItems.length - 1} 
                                                        onClick={() => handleMoveItem(idx, 'down')}
                                                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30"
                                                    >
                                                        <ChevronDownIcon className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openEditModal(idx)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"><PencilIcon className="w-4 h-4"/></button>
                                                    <button onClick={() => handleDeleteItem(idx)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition"><TrashIcon className="w-4 h-4"/></button>
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
                            <button onClick={() => setIsMenuModalOpen(false)}><XIcon className="w-5 h-5 text-slate-400"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tên hiển thị</label>
                                <input 
                                    type="text" 
                                    value={newItem.name} 
                                    onChange={e => setNewItem({...newItem, name: e.target.value})}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                                    placeholder="Ví dụ: Danh sách bệnh nhân"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Đường dẫn (Path)</label>
                                <input 
                                    type="text" 
                                    value={newItem.path} 
                                    onChange={e => setNewItem({...newItem, path: e.target.value})}
                                    className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono text-sm"
                                    placeholder={`/${selectedModule}/...`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Icon</label>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                                    <select 
                                        value={newItem.iconName} 
                                        onChange={e => setNewItem({...newItem, iconName: e.target.value})}
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
                                    onChange={e => setNewItem({...newItem, isVisible: e.target.checked})}
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
