// ==================== DYNAMIC FORM GENERATOR ====================
// File: modules/health-check-sync/forms/DynamicForm.tsx

import React, { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { toast } from 'sonner';
import { DynamicFormContext } from './DynamicFormContext';
import { useDynamicFormState } from '../hooks/useDynamicFormState';
import AdminTab from './tabs/AdminTab';
import HistoryTab from './tabs/HistoryTab';
import ChildDevelopmentTab from './tabs/ChildDevelopmentTab';
import ChildClinicalExamTab from './tabs/ChildClinicalExamTab';
import ExamContainer from './tabs/exam/ExamContainer';
import LabTab from './tabs/LabTab';
import ConclusionTab from './tabs/ConclusionTab';

interface DynamicFormProps {
    formType: string;
    initialData?: any;
    onSave: (formData: any) => void;
    onCancel: () => void;
    onChangeFormType?: (type: string) => void;
    onPreview?: (formData: any) => void;
}

// Local Error Boundary Component to capture Tab rendering errors
class TabErrorBoundary extends React.Component<any, any> {
    state: { hasError: boolean; error: any };
    props: any;
    setState: any;
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("TabErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    <h4 className="font-bold text-md mb-2">Đã xảy ra lỗi khi tải tab Khám lâm sàng:</h4>
                    <pre className="text-xs bg-red-100 p-4 rounded overflow-auto max-h-60 font-mono">
                        {this.state.error?.toString()}
                        {"\n\nStack:\n"}
                        {this.state.error?.stack}
                    </pre>
                    <button 
                        type="button" 
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-xs"
                    >
                        Thử lại
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

import ChildForm from './mau1-child/ChildForm';

const DynamicForm: React.FC<DynamicFormProps> = ({ formType, initialData, onSave, onCancel, onChangeFormType, onPreview }) => {
    const { fontSettings } = useTheme();

    if (formType === '1') {
        return (
            <TabErrorBoundary>
                <ChildForm
                    initialData={initialData}
                    onSave={onSave}
                    onPreview={onPreview}
                    onClose={onCancel}
                    onChangeFormType={onChangeFormType}
                />
            </TabErrorBoundary>
        );
    }
    
    const formState = useDynamicFormState(formType, initialData, onSave, onPreview);
    const {
        handlePreview,
        activeTab,
        setActiveTab,
        isLocked,
        setIsLocked,
        patientName,
        patientId,
        cccd,
        dob,
        gender,
        handleSubmit
    } = formState;

    const handleTabChange = (targetTab: string) => {
        if (targetTab === activeTab) return;
        
        const specialtyMetadata = formState.specialtyMetadata || {};

        if (activeTab === 'exam') {
            const unapprovedKey = Object.keys(specialtyMetadata).find(
                key => specialtyMetadata[key]?.status === 'ĐANG_KHÁM'
            );
            if (unapprovedKey) {
                const specLabels: Record<string, string> = {
                    physical: 'Thể lực',
                    internal: 'Nội khoa',
                    surgery: 'Ngoại khoa',
                    dermatology: 'Da liễu',
                    eye: 'Mắt',
                    ent: 'Tai Mũi Họng',
                    dental: 'Răng Hàm Mặt',
                    gynecology: 'Sản phụ khoa'
                };
                const label = specLabels[unapprovedKey] || unapprovedKey;
                toast.warning(`Chuyên khoa "${label}" chưa được Duyệt. Vui lòng nhấn "Duyệt" trước khi rời khỏi trang Khám lâm sàng!`);
                return;
            }
        }

        if (activeTab === 'admin' && specialtyMetadata.admin?.status === 'ĐANG_KHÁM') {
            toast.warning(`Thông tin "Hành chính & Đặc thù" chưa được Duyệt. Vui lòng nhấn "Duyệt" trước khi rời khỏi tab!`);
            return;
        }

        if (activeTab === 'history' && specialtyMetadata.history?.status === 'ĐANG_KHÁM') {
            toast.warning(`Thông tin "Tiền sử & Vaccine" chưa được Duyệt. Vui lòng nhấn "Duyệt" trước khi rời khỏi tab!`);
            return;
        }

        if (activeTab === 'conclusion' && specialtyMetadata.conclusion?.status === 'ĐANG_KHÁM') {
            toast.warning(`Thông tin "Kết luận" chưa được Duyệt. Vui lòng nhấn "Duyệt" trước khi rời khỏi tab!`);
            return;
        }

        if (activeTab === 'lab' && specialtyMetadata.lab?.status === 'ĐANG_KHÁM') {
            toast.warning(`Thông tin "Cận lâm sàng" chưa được Duyệt. Vui lòng nhấn "Duyệt" trước khi rời khỏi tab!`);
            return;
        }
        
        setActiveTab(targetTab);
    };

    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        confirmText?: string;
        cancelText?: string;
        severity?: 'warning' | 'danger' | 'info' | 'success';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const isChild = formType === '1';

    return (
        <DynamicFormContext.Provider value={formState}>
        <form onSubmit={handleSubmit} autoComplete="off" spellCheck={false} className="health-check-form flex flex-col h-full bg-white dark:bg-slate-800 rounded-none shadow-none border-0 overflow-hidden transition-all duration-300">
            {isLocked && (
                <div className="bg-emerald-600 text-white px-5 py-2.5 flex items-center gap-2 text-sm font-bold shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                    <span>Hồ sơ đã được Khóa &amp; Ký số liên thông quốc gia. Không thể chỉnh sửa.</span>
                </div>
            )}
            {/* Header */}
            <div className="bg-[#0f766e] px-5 py-3 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                {/* Left: Back button + Patient Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Nút Back */}
                    <button
                        type="button"
                        onClick={onCancel}
                        title="Quay lại danh sách"
                        className="flex-shrink-0 flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-lg px-3 py-2 text-xs font-bold transition-all duration-150 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 5l-7 7 7 7"/>
                        </svg>
                        <span className="hidden sm:inline">Danh sách</span>
                    </button>

                    {/* Patient Info - hiển thị thẳng không có ô bo */}
                    <div className="flex-1 min-w-0 flex flex-wrap gap-x-6 gap-y-1 items-center">
                        {patientName ? (
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-teal-200 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                </svg>
                                <span className="font-extrabold text-white uppercase text-base tracking-wide">{patientName}</span>
                            </div>
                        ) : (
                            <span className="italic text-teal-300 text-sm">Chưa có thông tin bệnh nhân</span>
                        )}
                        {patientId && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-extrabold uppercase text-teal-200 tracking-wider">Mã HS:</span>
                                <span className="font-mono font-bold text-white text-sm">{patientId}</span>
                            </div>
                        )}
                        {cccd && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-extrabold uppercase text-teal-200 tracking-wider">CCCD:</span>
                                <span className="font-mono font-bold text-white text-sm">{cccd}</span>
                            </div>
                        )}
                        {dob && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-extrabold uppercase text-teal-200 tracking-wider">Năm sinh:</span>
                                <span className="font-bold text-white text-sm">{new Date(dob).getFullYear()}</span>
                            </div>
                        )}
                        {gender && (
                            <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-extrabold uppercase text-teal-200 tracking-wider">Giới tính:</span>
                                <span className="font-bold text-white text-sm">{gender}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 self-stretch lg:self-auto flex-shrink-0">
                    {onChangeFormType ? (
                        <div className="flex flex-col items-start lg:items-end gap-1 w-full lg:w-auto">
                            <span className="text-[10px] uppercase tracking-wider text-teal-200 font-bold">Mẫu biểu áp dụng:</span>
                            <select
                                value={formType}
                                onChange={e => {
                                    if (window.confirm("Thay đổi mẫu biểu áp dụng có thể thay đổi cấu trúc và làm mất các trường dữ liệu đặc thù. Bạn có chắc chắn muốn thay đổi?")) {
                                        onChangeFormType(e.target.value);
                                    }
                                }}
                                disabled={isLocked}
                                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg px-3 py-1.5 text-sm font-bold focus:ring-2 focus:ring-white focus:outline-none cursor-pointer w-full lg:w-[280px] disabled:opacity-55 disabled:cursor-not-allowed"
                                style={{ colorScheme: 'dark' }}
                            >
                                <option value="1" className="text-slate-800 bg-white">Mẫu 1: Trẻ em dưới 06 tuổi</option>
                                <option value="2" className="text-slate-800 bg-white">Mẫu 2: Người từ đủ 06 tuổi đến dưới 18 tuổi</option>
                                <option value="3" className="text-slate-800 bg-white">Mẫu 3: Người từ đủ 18 tuổi trở lên</option>
                            </select>
                        </div>
                    ) : (
                        <div className="text-right">
                            <span className="text-sm font-sans font-bold bg-white/20 text-white px-3 py-1.5 rounded-lg border border-white/10 uppercase">
                                MẪU BIỂU SỐ {formType}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-4 overflow-x-auto whitespace-nowrap scrollbar-none flex-nowrap">
                <button type="button" onClick={() => handleTabChange('admin')} className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${activeTab === 'admin' ? 'border-[#0f766e] text-[#0f766e] dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    Thông tin hành chính
                </button>
                <button 
                    type="button" 
                    disabled={!patientName}
                    onClick={() => handleTabChange('history')} 
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${!patientName ? 'opacity-50 cursor-not-allowed text-slate-400 border-transparent' : activeTab === 'history' ? 'border-[#0f766e] text-[#0f766e] dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    title={!patientName ? "Vui lòng tìm kiếm/nhập thông tin hành chính bệnh nhân trước" : ""}
                >
                    Tiền sử & Khám thể lực
                </button>
                {isChild && (
                    <button 
                        type="button" 
                        disabled={!patientName}
                        onClick={() => handleTabChange('childDev')} 
                        className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${!patientName ? 'opacity-50 cursor-not-allowed text-slate-400 border-transparent' : activeTab === 'childDev' ? 'border-[#0f766e] text-[#0f766e] dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Dinh dưỡng &amp; Phát triển
                    </button>
                )}
                <button 
                    type="button" 
                    disabled={!patientName}
                    onClick={() => handleTabChange('exam')} 
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${!patientName ? 'opacity-50 cursor-not-allowed text-slate-400 border-transparent' : activeTab === 'exam' ? 'border-[#0f766e] text-[#0f766e] dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    title={!patientName ? "Vui lòng tìm kiếm/nhập thông tin hành chính bệnh nhân trước" : ""}
                >
                    Khám lâm sàng
                </button>
                <button 
                    type="button" 
                    disabled={!patientName}
                    onClick={() => handleTabChange('lab')} 
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${!patientName ? 'opacity-50 cursor-not-allowed text-slate-400 border-transparent' : activeTab === 'lab' ? 'border-[#0f766e] text-[#0f766e] dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    title={!patientName ? "Vui lòng tìm kiếm/nhập thông tin hành chính bệnh nhân trước" : ""}
                >
                    Cận lâm sàng
                </button>
                <button 
                    type="button" 
                    disabled={!patientName}
                    onClick={() => handleTabChange('conclusion')} 
                    className={`px-4 py-3 text-sm font-bold border-b-2 transition-all duration-200 flex-shrink-0 ${!patientName ? 'opacity-50 cursor-not-allowed text-slate-400 border-transparent' : activeTab === 'conclusion' ? 'border-[#0f766e] text-[#0f766e] dark:text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    title={!patientName ? "Vui lòng tìm kiếm/nhập thông tin hành chính bệnh nhân trước" : ""}
                >
                    Kết luận
                </button>
            </div>

            {/* Content Area */}
            <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar scroll-smooth">
                {activeTab === 'admin' && <AdminTab />}
                {activeTab === 'history' && <HistoryTab />}
                {activeTab === 'childDev' && isChild && <ChildDevelopmentTab />}
                {activeTab === 'exam' && (
                    isChild ? (
                        <ChildClinicalExamTab />
                    ) : (
                        <TabErrorBoundary>
                            <ExamContainer />
                        </TabErrorBoundary>
                    )
                )}
                {activeTab === 'lab' && <LabTab />}
                {activeTab === 'conclusion' && <ConclusionTab />}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                <div>
                    {isLocked ? (
                        <button
                            type="button"
                            onClick={() => {
                                setConfirmConfig({
                                    isOpen: true,
                                    title: "Mở khóa hồ sơ",
                                    message: "Bạn có chắc chắn muốn mở khóa hồ sơ khám sức khỏe này?",
                                    confirmText: "Đồng ý mở khóa",
                                    cancelText: "Hủy bỏ",
                                    severity: "warning",
                                    onConfirm: () => {
                                        setIsLocked(false);
                                        setTimeout(() => {
                                            handleSubmit(undefined, { shouldUnlock: true });
                                        }, 50);
                                    }
                                });
                            }}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                        >
                            Mở khóa hồ sơ
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={!patientName}
                            onClick={() => {
                                setConfirmConfig({
                                    isOpen: true,
                                    title: "Khóa & Ký Số",
                                    message: "Bạn có chắc chắn muốn Khóa & Ký số hồ sơ này? Sau khi khóa sẽ không thể chỉnh sửa dữ liệu.",
                                    confirmText: "Khóa & Ký Số",
                                    cancelText: "Hủy bỏ",
                                    severity: "success",
                                    onConfirm: () => {
                                        setIsLocked(true);
                                        setTimeout(() => {
                                            handleSubmit(undefined, { shouldSign: true });
                                        }, 50);
                                    }
                                });
                            }}
                            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                            title={!patientName ? "Vui lòng nhập thông tin bệnh nhân trước khi thực hiện" : ""}
                        >
                            Khóa &amp; Ký Số
                        </button>
                    )}
                </div>
                <div className="flex gap-3">
                    <button 
                        type="button" 
                        onClick={handlePreview} 
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Xem hồ sơ
                    </button>
                    <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer">
                        Đóng / Quay lại
                    </button>
                </div>
            </div>
        </form>

        {confirmConfig.isOpen && (
            <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm z-[999] flex justify-center items-center p-4 animate-fadeIn">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 overflow-hidden transform transition-all scale-100 duration-200">
                    <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${
                            confirmConfig.severity === 'danger' ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' :
                            confirmConfig.severity === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' :
                            'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                        }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                        </div>
                        <div className="flex-1 space-y-1">
                            <h3 className="text-base font-extrabold text-slate-800 dark:text-white uppercase tracking-wide">
                                {confirmConfig.title}
                            </h3>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                                {confirmConfig.message}
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 flex flex-row-reverse gap-3 justify-end sm:justify-start">
                        <button
                            type="button"
                            className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer ${
                                confirmConfig.severity === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/10' :
                                confirmConfig.severity === 'success' ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/10' :
                                'bg-amber-600 hover:bg-amber-500 shadow-amber-500/10'
                            }`}
                            onClick={() => {
                                confirmConfig.onConfirm();
                                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                            }}
                        >
                            {confirmConfig.confirmText || 'Đồng ý'}
                        </button>
                        <button
                            type="button"
                            className="px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all cursor-pointer"
                            onClick={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
                        >
                            {confirmConfig.cancelText || 'Hủy bỏ'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </DynamicFormContext.Provider>
    );
};

export default DynamicForm;
