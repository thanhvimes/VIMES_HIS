import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { XIcon, CheckCircleIcon, ExclamationCircleIcon } from '../../../components/Icons';
import { useSession } from '../../../contexts/SessionContext';
import { useRegistration } from '../hooks/useRegistration';
import { CURRENT_HOSPITAL_CODE } from '../utils/registrationUtils';
import { CatalogItem } from '../../../services/catalogService';
import { ComboboxColumn } from '../../../components/shared/Combobox';
import { calculateAge } from '../../../utils/formatters';

// Sub-components
import HeaderSection from '../components/HeaderSection';
import AdministrativeSection from '../components/AdministrativeSection';
import VisitSection from '../components/VisitSection';
import InsuranceSection from '../components/InsuranceSection';
import HistorySection from '../components/HistorySection';
import TransferSection from '../components/TransferSection';
import ExamTicketPrint from '../components/ExamTicketPrint';
import BHXHResultModal from '../components/BHXHResultModal';
import AuditLogModal from '../components/AuditLogModal';
import { ClockIcon } from '../../../components/Icons';

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast: React.FC<{ toast: any; onClose: () => void }> = ({ toast, onClose }) => {
    React.useEffect(() => {
        if (toast) { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }
    }, [toast, onClose]);

    if (!toast) return null;
    const bg = toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    const icon = toast.type === 'success'
        ? <CheckCircleIcon className="w-6 h-6 text-white" />
        : <ExclamationCircleIcon className="w-6 h-6 text-white" />;
    return (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white animate-fade-in-up ${bg}`}>
            {icon}
            <div>
                <h4 className="font-bold text-sm uppercase">
                    {toast.type === 'success' ? 'Thành công' : toast.type === 'error' ? 'Lỗi' : 'Thông báo'}
                </h4>
                <p className="text-sm">{toast.message}</p>
            </div>
            <button onClick={onClose} className="ml-2 hover:bg-white/20 rounded-full p-1">
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

// ─── Main View ────────────────────────────────────────────────────────────────
const RegistrationView: React.FC = () => {
    const navigate = useNavigate();
    const {
        formData, setFormData, mode, setMode, regMode, setRegMode,
        searchQuery, setSearchQuery,
        isSaving, isLoading, originalData, toast, setToast,
        checkInResponse, setCheckInResponse,
        provinces, wards, departments, rooms,
        ethnicities, occupations, examTypes, patientObjects,
        hospitals, insRouteTypes, areaOptions,
        nations, relationships, workplaces,
        handleInputChange, handleSave, handleScan, handleCheckIn, handleAcceptCheckIn, showToast,
        hasActiveDocToday
    } = useRegistration();

    const { hasPermission } = useSession();

    // ── Audit state ───────────────────────────────────────────────────────────
    const [auditLog, setAuditLog] = useState<{ isOpen: boolean, targets: { tableName: string, recordId: string | number }[], title: string }>({
        isOpen: false, targets: [], title: ''
    });

    // ── Print state ───────────────────────────────────────────────────────────
    const [showPrint, setShowPrint] = useState(false);
    const [isAutoPrint, setIsAutoPrint] = useState(false);

    // Tên phòng khám hiện tại (tra theo regRoom)
    const currentRoom = rooms.find(r => String(r.id) === String(formData.regRoom));
    const currentDept = departments.find(d => String(d.id) === String(formData.regDepartment));

    // ── Columns ───────────────────────────────────────────────────────────────
    const hospitalColumns: ComboboxColumn<CatalogItem>[] = [
        { key: 'code', label: 'Mã', width: '20%' },
        { key: 'name', label: 'Tên Bệnh viện', width: '80%' }
    ];
    const commonColumns: ComboboxColumn<CatalogItem>[] = [
        { key: 'code', label: 'Mã', width: '25%' },
        { key: 'name', label: 'Tên', width: '75%' }
    ];

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleCancel = useCallback(() => {
        if (mode === 'EDIT' && originalData) {
            setFormData(JSON.parse(JSON.stringify(originalData)));
            setMode('VIEW');
        } else {
            navigate('/reception');
        }
    }, [mode, originalData, navigate, setFormData, setMode]);

    const handleShowCombinedAudit = useCallback(() => {
        const targets = [];
        if (formData.id) targets.push({ tableName: 'hms_patient', recordId: formData.id });
        if (formData.recordNumber) {
            targets.push({ tableName: 'hms_doc', recordId: formData.recordNumber });
            targets.push({ tableName: 'hms_exam', recordId: formData.recordNumber });
            targets.push({ tableName: 'hms_card', recordId: formData.recordNumber });
        }
        setAuditLog({
            isOpen: true,
            targets,
            title: `Nhật ký hoạt động tổng hợp: ${formData.name || 'Bệnh nhân'}`
        });
    }, [formData]);

    /** Lưu phiếu — nếu thành công thì mở modal xem trước phiếu in */
    const handleSaveAndPrint = useCallback(async () => {
        // Chỉ in tự động nếu là các chế độ thêm mới (BN mới, Lượt mới, hoặc Phiếu khám mới)
        const isAdding = regMode === 'ADD_PATIENT' || regMode === 'ADD_DOC' || regMode === 'ADD_EXAM';
        const saved = await handleSave();
        
        if (saved && isAdding) {
            setIsAutoPrint(true);
            setShowPrint(true);
        }
    }, [handleSave, regMode]);

    const handleClosePrint = useCallback(() => {
        setShowPrint(false);
        setIsAutoPrint(false);
    }, []);

    const handleManualPrint = useCallback(() => {
        setIsAutoPrint(false);
        setShowPrint(true);
    }, []);

    // ── UI helpers ────────────────────────────────────────────────────────────
    const isEditable = mode !== 'VIEW';
    
    // Logic permissions mapping from HMSRegistration_utf8.cpp (01.13, 01.10)
    const canEditPatientBasicInfo = isEditable && (mode === 'ADD' || hasPermission('01.13'));
    const canEditInsuranceInfo = isEditable && (mode === 'ADD' || hasPermission('01.10'));
    const isInsurancePatient =
        (formData.patientType === 'Bảo hiểm' || formData.patientType === 'I') ||
        ['1', '4', '6'].includes(String(formData.patientType)) || // Typical insurance IDs
        patientObjects.find(o => String(o.id) === String(formData.patientType))?.type === 'I';

    const scanModeBadge = regMode === 'ADD_PATIENT'
        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full text-[10px] font-bold uppercase tracking-wider">🟢 Bệnh nhân mới</span>
        : regMode === 'ADD_DOC'
            ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-full text-[10px] font-bold uppercase tracking-wider">🟠 Lượt khám mới</span>
            : regMode === 'ADD_EXAM'
                ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold uppercase tracking-wider">🔵 Phiếu khám bổ sung</span>
                : mode === 'EDIT'
                    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-bold uppercase tracking-wider">📝 Chỉnh sửa thông tin</span>
                    : null;

    // ── Enter as Tab functionality ───────────────────────────────────────────
    const handleFormKeyDown = useCallback((e: React.KeyboardEvent) => {
        // Hotkey for Save & Print (Standard F2)
        if (e.key === 'F2') {
            e.preventDefault();
            if (!isSaving && mode !== 'VIEW') {
                handleSaveAndPrint();
            }
            return;
        }

        if (e.key === 'Enter') {
            const target = e.target as HTMLElement;
            
            // Allow default behavior for textareas and buttons (like Submit)
            if (target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON') return;
            
            // Special check for Combobox input - handled locally if list is open
            // But if we're here, default was not prevented, so move to next
            
            e.preventDefault();
            const container = target.closest('.registration-form-container');
            if (!container) return;
            
            // Get all focusable elements in order
            const focusable = Array.from(
                container.querySelectorAll<HTMLElement>(
                    'input:not([disabled]):not([readonly]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
                )
            ).filter(el => {
                // Filter out hidden elements or elements inside hidden containers
                const style = window.getComputedStyle(el);
                return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetWidth > 0;
            });
            
            const index = focusable.indexOf(target);
            if (index > -1 && index < focusable.length - 1) {
                focusable[index + 1].focus();
                // If it's an input, select its text for better UX
                if (focusable[index + 1] instanceof HTMLInputElement) {
                    (focusable[index + 1] as HTMLInputElement).select();
                }
            }
        }
    }, []);

    return (
        <div 
            className="h-full flex flex-col gap-3 bg-slate-50 dark:bg-slate-950 p-3 md:p-4 overflow-hidden registration-form-container"
            onKeyDown={handleFormKeyDown}
        >
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* ── HEADER ── */}
            <HeaderSection
                mode={mode} formData={formData}
                regMode={regMode} setRegMode={setRegMode}
                searchQuery={searchQuery} setSearchQuery={setSearchQuery}
                handleScan={(e) => { if (e.key === 'Enter') handleScan(searchQuery); }}
                isSaving={isSaving}
                handleSave={handleSaveAndPrint}
                handleCancel={handleCancel}
                setMode={setMode}
                navigate={navigate}
                onPrint={handleManualPrint}
                onShowAudit={handleShowCombinedAudit}
                hasActiveDocToday={hasActiveDocToday}
                title="F2: Lưu & In"
            />
            {/* ── STATUS BAR: Scan mode + Mã hồ sơ + Số thứ tự ── */}
            <div className="flex items-center justify-between px-1 flex-shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                    {scanModeBadge}
                    {formData.recordNumber && (
                        <div className="flex items-center gap-1 group">
                             <span className="text-sm text-slate-500 font-medium">
                                Hồ sơ: <b className="text-slate-800 font-mono text-base font-extrabold">#{formData.recordNumber}</b>
                            </span>
                            <button 
                                onClick={handleShowCombinedAudit}
                                className="p-1 hover:bg-white rounded-full text-slate-400 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                                title="Xem lịch sử hoạt động tổng hợp"
                            >
                                <ClockIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    {formData.id && (
                        <div className="flex items-center gap-1 group ml-2">
                            <span className="text-sm text-slate-500 font-medium">
                                Mã BN: <b className="text-blue-700 font-mono text-base font-black">{formData.id}</b>
                            </span>
                            <button 
                                onClick={handleShowCombinedAudit}
                                className="p-1 hover:bg-white rounded-full text-slate-400 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                                title="Xem lịch sử hoạt động tổng hợp"
                            >
                                <ClockIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Số thứ tự — nổi bật khi đã đăng ký */}
                {formData.receptNo && (
                    <button
                        onClick={() => setShowPrint(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow transition-colors cursor-pointer"
                        title="Nhấn để xem và in phiếu khám"
                    >
                        <span>🎫</span>
                        <span>STT:</span>
                        <span className="text-2xl font-black leading-none">{formData.receptNo}</span>
                        <span className="text-[10px] opacity-75 ml-1">🖨️ In</span>
                    </button>
                )}
            </div>

            {/* ── MAIN CONTENT ── */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 pb-10">

                    {/* Cột trái: Chiếm 3/4 - Chứa toàn bộ các section chính */}
                    <div className="lg:col-span-3 space-y-4">
                        <AdministrativeSection
                            formData={formData} isEditable={canEditPatientBasicInfo}
                            handleInputChange={handleInputChange}
                            handleDobChange={(e) => {
                                handleInputChange('dob', e.target.value);
                            }}
                            handleIdentityInput={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 12) handleInputChange('identityCard', val);
                            }}
                            handleIdentityBlur={() => {
                                if (formData.identityCard && !/^\d{12}$/.test(formData.identityCard))
                                    showToast('error', 'CCCD phải đúng 12 chữ số');
                            }}
                            ethnicities={ethnicities} occupations={occupations}
                            provinces={provinces} wards={wards}
                            handleProvinceChange={(val, item) => setFormData(p => ({ ...p, provinceId: item?.id || val, wardId: '' }))}
                            handleWardChange={(val, item) => handleInputChange('wardId', item?.id || val)}
                            commonColumns={commonColumns}
                            nations={nations}
                            relationships={relationships}
                            workplaces={workplaces}
                        />

                        <VisitSection
                            formData={formData} isEditable={isEditable}
                            handleInputChange={handleInputChange}
                            departments={departments} rooms={rooms}
                            examTypes={examTypes} patientObjects={patientObjects}
                        />

                        {/* Chỉ hiển thị Lịch sử ở cột trái nếu là bệnh nhân BHYT (để cột phải cho BHYT & Chuyển tuyến) */}
                        {isInsurancePatient && (
                            <HistorySection 
                                formData={formData} 
                                onSelect={(docNo) => {
                                    if (docNo !== formData.recordNumber) {
                                        navigate(`/reception/register/${docNo}`);
                                    }
                                }}
                            />
                        )}
                    </div>

                    {/* Cột phải: Chiếm 1/4 - Chứa BHYT & Chuyển tuyến */}
                    <div className="lg:col-span-1 space-y-4">
                        {isInsurancePatient ? (
                            <>
                                <InsuranceSection
                                    formData={formData} isEditable={canEditInsuranceInfo}
                                    handleInputChange={handleInputChange}
                                    handleInsurancePlaceChange={(val, item) => {
                                        const code = item?.code || '';
                                        setFormData(p => ({
                                            ...p,
                                            insurancePlace: val,
                                            insuranceRegCode: code,
                                            route: p.route === 'Cấp cứu' ? 'Cấp cứu'
                                                : (code === CURRENT_HOSPITAL_CODE ? 'Đúng tuyến' : 'Trái tuyến')
                                        }));
                                    }}
                                    handleInsuranceAreaChange={(val) => handleInputChange('insuranceArea', val)}
                                    hospitals={hospitals} hospitalColumns={hospitalColumns}
                                    areaOptions={areaOptions} insRouteTypes={insRouteTypes}
                                    setFormData={setFormData}
                                    handleCheckIn={handleCheckIn}
                                    handleUpdate={handleSave}
                                    isSaving={isSaving}
                                    checkInResponse={checkInResponse}
                                    onCloseResponse={() => setCheckInResponse(null)}
                                />

                                <TransferSection
                                    formData={formData} isEditable={isEditable}
                                    handleInputChange={handleInputChange}
                                    hospitals={hospitals} hospitalColumns={hospitalColumns}
                                    setFormData={setFormData}
                                />
                            </>
                        ) : (
                            /* Nếu là đối tượng Dịch vụ: Đưa Lịch sử khám sang cột phải thay vì nằm ở cột trái */
                            <HistorySection 
                                formData={formData} 
                                onSelect={(docNo) => {
                                    if (docNo !== formData.recordNumber) {
                                        navigate(`/reception/register/${docNo}`);
                                    }
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* ── LOADING OVERLAY ── */}
            {isLoading && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[110] flex items-center justify-center">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="font-bold text-slate-800">Đang xử lý...</p>
                    </div>
                </div>
            )}

            {/* ── PRINT MODAL ── */}
            <ExamTicketPrint
                visible={showPrint}
                onClose={handleClosePrint}
                formData={formData}
                roomName={currentRoom?.name}
                deptName={currentDept?.name}
                autoPrint={isAutoPrint}
            />

            {/* ── BHXH RESULT MODAL ── */}
            <BHXHResultModal
                visible={!!checkInResponse}
                onClose={() => setCheckInResponse(null)}
                onAccept={handleAcceptCheckIn}
                data={checkInResponse}
            />

            {/* ── AUDIT LOG MODAL ── */}
            <AuditLogModal
                isOpen={auditLog.isOpen}
                onClose={() => setAuditLog(prev => ({ ...prev, isOpen: false }))}
                targets={auditLog.targets}
                title={auditLog.title}
            />
        </div>
    );
};

export default RegistrationView;
