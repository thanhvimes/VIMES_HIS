import React, { useState } from 'react';
import { ChildFormContext } from './ChildFormContext';
import { useChildFormState } from './hooks/useChildFormState';
import ChildAdminTab from './tabs/ChildAdminTab';
import ChildHistoryTab from './tabs/ChildHistoryTab';
import ChildDevelopmentTab from './tabs/ChildDevelopmentTab';
import ChildClinicalTab from './tabs/ChildClinicalTab';
import ChildLabTab from './tabs/ChildLabTab';
import ChildConclusionTab from './tabs/ChildConclusionTab';
import { 
    User, 
    Activity, 
    Stethoscope, 
    FlaskConical, 
    ClipboardCheck, 
    Baby 
} from 'lucide-react';
import ConfirmationModal from '../../../../components/ui/ConfirmationModal';

interface ChildFormProps {
    initialData?: any;
    onSave: (formData: any, options?: any) => Promise<void>;
    onPreview?: (formData: any) => void;
    onClose?: () => void;
    onChangeFormType?: (type: string) => void;
}

const ChildForm: React.FC<ChildFormProps> = ({
    initialData,
    onSave,
    onPreview,
    onClose,
    onChangeFormType
}) => {
    // Standard wrapper to match onSave options
    const handleSaveWrapper = async (payload: any, options?: any) => {
        await onSave(payload, { shouldClose: false, ...options });
    };

    const state = useChildFormState({
        initialData,
        onSave: handleSaveWrapper,
        onPreview,
        onChangeFormType
    });

    const {
        activeTab,
        handleTabChange,
        patientName,
        patientId,
        docNo,
        cccd,
        dob,
        gender,
        isLocked,
        setIsLocked,
        handleSubmit,
        confirmConfig,
        setConfirmConfig
    } = state;

    const handlePreview = () => {
        if (onPreview) {
            // Re-build payload from current state
            const payload = state.handleSubmit; // It's safer to let state package it
            // We invoke the internal builder since we returned it
            const currentPayload = (state as any).buildPayload ? (state as any).buildPayload() : {};
            onPreview(currentPayload);
        }
    };

    return (
        <ChildFormContext.Provider value={state}>
            <div className="health-check-form flex flex-col h-full bg-white dark:bg-slate-900 shadow-xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                {/* Header Information Banner */}
                <div className="bg-[#0f766e] px-5 py-3 text-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                    {/* Left: Back button + Patient Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Nút Back */}
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                title="Quay lại danh sách"
                                className="flex-shrink-0 flex items-center gap-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white rounded-lg px-3 py-2 text-xs font-bold transition-all duration-150 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 12H5M12 5l-7 7 7 7"/>
                                </svg>
                                <span className="hidden sm:inline">Danh sách</span>
                            </button>
                        )}

                        {/* Patient Info */}
                        <div className="flex-1 min-w-0 flex flex-wrap gap-x-6 gap-y-1 items-center">
                            {patientName ? (
                                <div className="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-teal-200 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                    <span className="font-extrabold text-white uppercase text-base tracking-wide">{patientName}</span>
                                </div>
                            ) : (
                                <span className="italic text-teal-300 text-sm">Chưa có thông tin bệnh nhân</span>
                            )}
                            {docNo && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-extrabold uppercase text-teal-200 tracking-wider">Số hồ sơ:</span>
                                    <span className="font-mono font-bold text-white text-sm">{docNo}</span>
                                </div>
                            )}
                            {patientId && (
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-extrabold uppercase text-teal-200 tracking-wider">Mã BN:</span>
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

                    {/* Right: Dropdown select form type */}
                    <div className="flex items-center gap-3 self-stretch lg:self-auto flex-shrink-0">
                        {onChangeFormType ? (
                            <div className="flex flex-col items-start lg:items-end gap-1 w-full lg:w-auto">
                                <span className="text-[10px] uppercase tracking-wider text-teal-200 font-bold">Mẫu biểu áp dụng:</span>
                                <select
                                    value="1"
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
                                    <option value="driver" className="text-slate-800 bg-white">Giấy KSK người lái xe (Học lái xe / Nâng hạng / Đổi GPLX)</option>
                                </select>
                            </div>
                        ) : (
                            <div className="text-right">
                                <span className="text-sm font-sans font-bold bg-white/20 text-white px-3 py-1.5 rounded-lg border border-white/10 uppercase">
                                    Mẫu 1: Trẻ em dưới 06 tuổi
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tab Navigation Specific to Child Form */}
                {(() => {
                    const specMeta = state.specialtyMetadata || {};
                    const getTabBadge = (key: string) => {
                        if (key === 'exam') {
                            const childExamKeys = ['child_general', 'child_head_neck', 'child_eye', 'child_ear', 'child_nose_throat', 'child_mouth_dental', 'child_respiratory', 'child_cardiovascular', 'child_abdomen_genital', 'child_musculoskeletal_neuro'];
                            const total = childExamKeys.length;
                            const doneCount = childExamKeys.filter(k => specMeta[k]?.status === 'ĐÃ_DUYỆT' || specMeta[k]?.status === 'ĐÃ_KHÁM').length;
                            const isExamining = childExamKeys.some(k => specMeta[k]?.status === 'ĐANG_KHÁM');
                            
                            if (isExamining) {
                                return {
                                    text: 'Đang khám',
                                    className: 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold',
                                    dotClass: 'bg-blue-600 animate-ping'
                                };
                            }
                            if (doneCount === total) {
                                return {
                                    text: 'Đã khám',
                                    className: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold',
                                    dotClass: 'bg-emerald-600'
                                };
                            }
                            if (doneCount > 0) {
                                return {
                                    text: `${doneCount}/${total} đã khám`,
                                    className: 'bg-amber-600/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold',
                                    dotClass: 'bg-amber-600'
                                };
                            }
                            return {
                                text: 'Chưa khám',
                                className: 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300 font-medium',
                                dotClass: 'bg-slate-400'
                            };
                        }
                        const st = specMeta[key]?.status;
                        if (st === 'ĐÃ_DUYỆT' || st === 'ĐÃ_KHÁM' || st === 'ĐÃ_KẾT_LUẬN') {
                            return {
                                text: 'Đã khám',
                                className: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold',
                                dotClass: 'bg-emerald-600'
                            };
                        }
                        if (st === 'ĐANG_KHÁM') {
                            return {
                                text: 'Đang khám',
                                className: 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 font-bold',
                                dotClass: 'bg-blue-600 animate-ping'
                            };
                        }
                        return {
                            text: 'Chưa khám',
                            className: 'bg-slate-200/80 text-slate-600 dark:bg-slate-700 dark:text-slate-300 font-medium',
                            dotClass: 'bg-slate-400'
                        };
                    };

                    const tabItems: Array<{ id: 'admin' | 'history' | 'childDev' | 'exam' | 'lab' | 'conclusion'; label: string; step: number; icon: any }> = [
                        { id: 'admin', label: 'Thông tin hành chính', step: 1, icon: User },
                        { id: 'history', label: 'Tiền sử & Khám thể lực', step: 2, icon: Activity },
                        { id: 'childDev', label: 'Dinh dưỡng & Phát triển', step: 3, icon: Baby },
                        { id: 'exam', label: 'Khám lâm sàng', step: 4, icon: Stethoscope },
                        { id: 'lab', label: 'Cận lâm sàng', step: 5, icon: FlaskConical },
                        { id: 'conclusion', label: 'Kết luận & Ký số', step: 6, icon: ClipboardCheck },
                    ];

                    return (
                        <div className="bg-slate-100/90 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 select-none">
                            <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-0.5">
                                {tabItems.map((tab) => {
                                    const isActive = activeTab === tab.id;
                                    const badge = getTabBadge(tab.id);
                                    const isDisabled = !patientName && tab.id !== 'admin';
                                    const IconComponent = tab.icon;

                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            disabled={isDisabled}
                                            onClick={() => handleTabChange(tab.id)}
                                            title={isDisabled ? 'Vui lòng tìm kiếm/nhập thông tin hành chính bệnh nhân trước' : ''}
                                            className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all duration-200 cursor-pointer flex-shrink-0 border ${
                                                isDisabled
                                                    ? 'opacity-40 cursor-not-allowed text-slate-400 border-transparent bg-transparent'
                                                    : isActive
                                                        ? 'bg-white dark:bg-slate-800 text-teal-900 dark:text-teal-200 shadow-sm border-slate-300 dark:border-slate-600 ring-2 ring-teal-600/20 font-bold'
                                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/80 dark:hover:bg-slate-800/60 border-transparent hover:border-slate-200 font-semibold'
                                            }`}
                                        >
                                            {/* Step Icon Badge */}
                                            <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold transition-transform group-hover:scale-105 ${
                                                isActive
                                                    ? 'bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-xs'
                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                            }`}>
                                                <IconComponent className="w-3.5 h-3.5" />
                                            </span>

                                            {/* Tab Title */}
                                            <span className={`text-xs tracking-tight ${isActive ? 'text-teal-950 dark:text-teal-100 font-bold' : ''}`}>
                                                {tab.label}
                                            </span>

                                            {/* Status Chip */}
                                            <span className={`inline-flex items-center gap-1.5 text-[10.5px] px-2 py-0.5 rounded-full transition-all ${badge.className}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dotClass}`} />
                                                <span>{badge.text}</span>
                                            </span>

                                            {/* Active Bottom Indicator Accent */}
                                            {isActive && (
                                                <span className="absolute -bottom-[2px] left-3 right-3 h-[3px] bg-teal-600 rounded-full" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                {/* Main Content Area */}
                <div className="px-6 py-5 space-y-6 overflow-y-auto flex-1 min-h-0 custom-scrollbar scroll-smooth">
                    {activeTab === 'admin' && <ChildAdminTab />}
                    {activeTab === 'history' && <ChildHistoryTab />}
                    {activeTab === 'childDev' && <ChildDevelopmentTab />}
                    {activeTab === 'exam' && <ChildClinicalTab />}
                    {activeTab === 'lab' && <ChildLabTab />}
                    {activeTab === 'conclusion' && <ChildConclusionTab />}
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                    <div>
                        {isLocked ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setConfirmConfig({
                                        isOpen: true,
                                        title: "Mở khóa hồ sơ",
                                        message: "Bạn có chắc chắn muốn mở khóa hồ sơ khám sức khỏe trẻ em này?",
                                        onConfirm: () => {
                                            setConfirmConfig(null);
                                            handleSubmit({ shouldUnlock: true });
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
                                        message: "Bạn có chắc chắn muốn Khóa & Ký số hồ sơ trẻ em này? Sau khi khóa sẽ không thể chỉnh sửa dữ liệu.",
                                        onConfirm: () => {
                                            setConfirmConfig(null);
                                            handleSubmit({ shouldSign: true });
                                        }
                                    });
                                }}
                                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
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
                            Xem hồ sơ
                        </button>
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-sm font-bold transition-all shadow-md cursor-pointer"
                            >
                                Đóng / Quay lại
                            </button>
                        )}
                    </div>
                </div>

                {/* Modal confirmation */}
                {confirmConfig && (
                    <ConfirmationModal
                        isOpen={confirmConfig.isOpen}
                        title={confirmConfig.title}
                        message={confirmConfig.message}
                        confirmText="Xác nhận"
                        cancelText="Hủy bỏ"
                        severity="warning"
                        onConfirm={confirmConfig.onConfirm}
                        onCancel={() => setConfirmConfig(null)}
                    />
                )}
            </div>
        </ChildFormContext.Provider>
    );
};

export default ChildForm;
