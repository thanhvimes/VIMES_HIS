
import React, { useState, useEffect } from 'react';
import { useTheme, FontSettings } from '../../../contexts/ThemeContext';
import { useSession } from '../../../contexts/SessionContext';
import { adminService } from '../../../services/adminService';
import { CogIcon, HospitalIcon, GlobeIcon, CheckCircleIcon } from '../../../components/Icons';
import { OrganizationInfo } from '../../../types/common';

const fontOptions = [
    { label: 'Nhỏ (Compact)', value: 'text-xs' },
    { label: 'Bình thường (Standard)', value: 'text-sm' },
    { label: 'Trung bình (Medium)', value: 'text-base' },
    { label: 'Lớn (Large)', value: 'text-lg' },
    { label: 'Rất lớn (Extra)', value: 'text-xl' },
];

const SettingsView: React.FC = () => {
    const { fontSettings, updateFontSettings } = useTheme();
    const { orgInfo, setOrgInfo } = useSession();
    const [activeTab, setActiveTab] = useState<'display' | 'hospital'>('display');
    const [hospitalForm, setHospitalForm] = useState<OrganizationInfo>(orgInfo);
    const [isSaving, setIsSaving] = useState(false);

    // Update form if global orgInfo changes
    useEffect(() => {
        setHospitalForm(orgInfo);
    }, [orgInfo]);

    const handleFontChange = (key: keyof FontSettings, value: string) => {
        updateFontSettings({ [key]: value });
    };

    const handleHospitalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setHospitalForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveHospital = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const updatedInfo = await adminService.updateOrganizationInfo(hospitalForm);
            setOrgInfo(updatedInfo); // Update global context immediately
            alert("Cập nhật thông tin bệnh viện thành công!");
        } catch (error) {
            alert("Lỗi khi lưu thông tin.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center space-x-3 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                <CogIcon className="h-8 w-8 text-primary dark:text-dark-primary" />
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Cấu hình Hệ thống</h1>
                    <p className="text-slate-500 dark:text-slate-400">Thiết lập hiển thị và thông tin đơn vị.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-6">
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
            </div>

            {/* TAB: DISPLAY SETTINGS */}
            {activeTab === 'display' && (
                <div className="grid grid-cols-1 gap-8">
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
                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 animate-fade-in">
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
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Logo URL (Đường dẫn ảnh)</label>
                                    <div className="flex gap-2 items-start">
                                        <input 
                                            type="text" 
                                            name="logoUrl"
                                            value={hospitalForm.logoUrl}
                                            onChange={handleHospitalChange}
                                            className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 text-sm"
                                            placeholder="https://..."
                                        />
                                        <div className="w-12 h-12 bg-white border rounded-lg flex items-center justify-center shrink-0 p-1 overflow-hidden">
                                            {hospitalForm.logoUrl ? (
                                                <img src={hospitalForm.logoUrl} alt="Logo Preview" className="w-full h-full object-contain"/>
                                            ) : (
                                                <GlobeIcon className="w-6 h-6 text-slate-300"/>
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

        </div>
    );
};

export default SettingsView;
