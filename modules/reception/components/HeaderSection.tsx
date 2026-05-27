import React from 'react';
import { PlusIcon, SaveIcon, BanIcon, PencilIcon, PrinterIcon, QrcodeIcon, ClockIcon } from '../../../components/Icons';
import ActionButton from '../../../components/ui/ActionButton';
import { ExtendedFormData } from '../utils/registrationUtils';
import { useSession } from '../../../contexts/SessionContext';

interface HeaderSectionProps {
    mode: 'VIEW' | 'EDIT' | 'ADD';
    formData: ExtendedFormData;
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    handleScan: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    isSaving: boolean;
    regMode: 'ADD_PATIENT' | 'ADD_DOC' | 'ADD_EXAM';
    setRegMode: (mode: 'ADD_PATIENT' | 'ADD_DOC' | 'ADD_EXAM') => void;
    handleSave: () => void;
    handleCancel: () => void;
    setMode: (mode: 'VIEW' | 'EDIT' | 'ADD') => void;
    navigate: (path: string) => void;
    onPrint?: () => void;
    onShowAudit?: () => void;
    hasActiveDocToday?: boolean;
}

const HeaderSection: React.FC<HeaderSectionProps> = ({
    mode, formData, regMode, setRegMode, searchQuery, setSearchQuery, handleScan, isSaving, handleSave, handleCancel, setMode, navigate, onPrint, onShowAudit, hasActiveDocToday
}) => {
    const { hasPermission } = useSession();
    const isEditable = mode !== 'VIEW';

    return (
        <div className="modern-card px-4 py-2 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                <h1 className="text-[16px] font-bold text-[#005A9E] flex items-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    <span className="hidden sm:inline uppercase">{mode === 'ADD' ? 'Đăng ký mới' : 'Hồ sơ bệnh nhân'}</span>
                </h1>
                {formData.regId && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100/50 text-blue-800 rounded text-[11px] font-bold border border-blue-200">#{formData.regId}</span>
                )}
            </div>

            <div className="flex-1 w-full md:max-w-[700px] flex items-center gap-2 order-3 md:order-2">
                {/* Mode Selector (MFC Legacy replacement) - Show if editing OR if patient open */}
                {(isEditable || formData.id) && (
                    <div className="flex bg-[#F4F7F9] p-0.5 rounded-lg border border-slate-200 shadow-inner shrink-0">
                        <button 
                            title="Đăng ký bệnh nhân mới"
                            onClick={() => {
                                if (mode === 'VIEW') {
                                    navigate('/reception/register');
                                    setMode('ADD');
                                }
                                setRegMode('ADD_PATIENT');
                            }}
                            className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${regMode === 'ADD_PATIENT' ? 'bg-white shadow-sm text-[#107C10] border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                            disabled={!!formData.id && mode === 'EDIT'} 
                        >
                            BN Mới
                        </button>
                        <button 
                            title="Tạo lượt khám mới (Hồ sơ mới)"
                            onClick={() => {
                                if (mode === 'VIEW') setMode('EDIT');
                                setRegMode('ADD_DOC');
                            }}
                            className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${regMode === 'ADD_DOC' ? 'bg-white shadow-sm text-[#E67E22] border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                            disabled={!formData.id}
                        >
                            Lượt mới
                        </button>
                        <button 
                            title="Thêm phiếu khám vào lượt hiện tại"
                            onClick={() => {
                                if (mode === 'VIEW') setMode('EDIT');
                                setRegMode('ADD_EXAM');
                            }}
                            className={`px-3 py-1 rounded-md text-[10px] uppercase font-bold transition-all ${regMode === 'ADD_EXAM' ? 'bg-white shadow-sm text-[#1A73E8] border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
                            disabled={!formData.recordNumber}
                        >
                            Phiếu khám
                        </button>
                    </div>
                )}

                <div className="relative group flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <QrcodeIcon className={`h-5 w-5 ${searchQuery ? 'text-blue-500 animate-pulse' : 'text-slate-400'}`} />
                    </div>
                    <input
                        type="text"
                        autoComplete="off"
                        className="enterprise-input !pl-10 !pr-16 !h-9 !bg-[#F4F7F9]/80 focus:!bg-white border-slate-200 transition-all font-mono italic"
                        placeholder="Quét QR CCCD / BHYT hoặc nhập Mã BN..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={handleScan}
                        autoFocus
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-[9px] font-bold text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white shadow-sm">Enter</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-end order-2 md:order-3">
                {isEditable ? (
                    <>
                        <ActionButton
                            label={isSaving ? "Đang lưu..." : (
                                regMode === 'ADD_PATIENT' ? "Lưu BN Mới (F2)" : 
                                regMode === 'ADD_DOC' ? "Lưu Lượt Mới (F2)" : 
                                regMode === 'ADD_EXAM' ? "Lưu thêm phiếu (F2)" : 
                                "Lưu thay đổi (F2)"
                            )}
                            icon={isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`h-8 px-4 text-[12px] font-bold shadow-sm ${regMode === 'ADD_PATIENT' ? 'bg-[#0078D4]' : regMode === 'ADD_DOC' ? 'bg-[#E67E22]' : regMode === 'ADD_EXAM' ? 'bg-[#1A73E8]' : 'bg-[#107C10]'} text-white hover:opacity-95`}
                        />
                        <ActionButton
                            label="Hủy"
                            icon={<BanIcon className="w-4 h-4" />}
                            onClick={handleCancel}
                            className="bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-red-600 h-8 px-4 text-[12px] font-bold shadow-sm transition-colors"
                        />
                    </>
                ) : (
                    <>
                        {hasPermission('01.01') && (
                            <ActionButton 
                                label="Thêm mới" 
                                icon={<PlusIcon className="w-4 h-4" />} 
                                onClick={() => { 
                                    if (formData.id) {
                                        // Smart logic: Nếu đang mở BN, nhấn Thêm mới sẽ khởi tạo đăng ký cho BN đó
                                        setMode('EDIT');
                                        setRegMode(hasActiveDocToday ? 'ADD_EXAM' : 'ADD_DOC');
                                    } else {
                                        navigate('/reception/register'); 
                                        setMode('ADD'); 
                                    }
                                }} 
                                className="bg-[#0078D4] hover:bg-[#005A9E] text-white h-8 px-4 text-[12px] font-bold shadow-sm" 
                            />
                        )}
                        {hasPermission('01.02') && (
                            <ActionButton label="Sửa" icon={<PencilIcon className="w-4 h-4" />} onClick={() => { setMode('EDIT'); setRegMode('NONE'); }} className="bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 h-8 px-3 text-[12px] font-bold shadow-sm" />
                        )}
                        <ActionButton label="In" icon={<PrinterIcon className="w-4 h-4" />} onClick={() => onPrint?.()} className="bg-white border border-slate-300 text-slate-800 hover:bg-blue-50 h-8 px-3 text-[12px] font-bold shadow-sm hidden sm:flex" />
                    </>
                )}
            </div>
        </div>
    );
};

export default HeaderSection;
