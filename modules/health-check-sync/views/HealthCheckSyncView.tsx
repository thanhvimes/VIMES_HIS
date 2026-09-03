// ==================== HEALTH CHECK SYNC VIEW ====================
// File: modules/health-check-sync/views/HealthCheckSyncView.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSystemStore } from '../../../stores/useSystemStore';
import { useSession } from '../../../contexts/SessionContext';
import { 
    PaperAirplaneIcon, 
    SearchIcon, 
    RefreshIcon, 
    SignatureIcon, 
    EyeIcon,
    CloudUploadIcon,
    DocumentTextIcon,
    PlusIcon,
    AdjustmentsHorizontalIcon,
    DocumentArrowDownIcon,
    PrinterIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { healthCheckService } from '../../../services/healthCheckService';
import { toast } from 'sonner';
import { catalogService, CatalogItem } from '../../../services/catalogService';
import { FormDateInput } from '../../../components/ui/forms';
import { formatDate, formatDateTime } from '../../../utils/formatters';
import * as XLSX from 'xlsx';
import { signHealthCheckXmlWithAgent } from '../services/healthCheckAgentXmlSigner';

// Import Modular Components
import Dashboard from '../components/Dashboard';
import DocumentList from '../components/DocumentList';
import PrintCodeList from '../components/PrintCodeList';
import SyncDataList from '../components/SyncDataList';
import ContractManagement from '../components/ContractManagement';
import PatientReception from '../components/PatientReception';
import SampleTracking from '../components/SampleTracking';
import { HisBatchImportModal } from '../components/HisBatchImportModal';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: any;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    props: ErrorBoundaryProps;
    state: ErrorBoundaryState = { hasError: false, error: null };

    constructor(props: ErrorBoundaryProps) {
        super(props);
    }

    static getDerivedStateFromError(error: any): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-rose-50 dark:bg-[#1a0e10] text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-950 rounded-2xl m-6 shadow-lg">
                    <h3 className="font-extrabold text-base mb-3 flex items-center gap-2">
                        <span className="text-xl">⚠️</span> Đã xảy ra lỗi kết xuất giao diện (Render Error):
                    </h3>
                    <p className="text-xs mb-4 font-semibold text-rose-700 dark:text-rose-350">
                        Vui lòng chụp lại thông tin chi tiết dưới đây:
                    </p>
                    <pre className="text-[10px] font-mono bg-white dark:bg-slate-950 p-4 rounded-xl border border-rose-100 dark:border-rose-950 overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed shadow-inner">
                        {this.state.error?.message || String(this.state.error)}{"\n\nStack Trace:\n"}{this.state.error?.stack}
                    </pre>
                </div>
            );
        }
        return this.props.children;
    }
}
import DynamicForm from '../forms/DynamicForm';

import PrintForm from '../forms/PrintForm';
import SettingsTab from '../components/SettingsTab';
import XmlPreviewModal from '../components/modals/XmlPreviewModal';
import HisSeedingFilterModal from '../components/modals/HisSeedingFilterModal';
import PrintBarcodeForm from '../forms/PrintBarcodeForm';
import PrintBarcodeXnForm, { PrintXnPayload } from '../forms/PrintBarcodeXnForm';
import PrintBarcodeXnModal from '../components/PrintBarcodeXnModal';

type ViewMode = 'LIST' | 'CREATE' | 'EDIT' | 'PRINT' | 'PRINT_BARCODE' | 'PRINT_BARCODE_XN';

const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const HealthCheckSyncView: React.FC = () => {
    const { fontSettings } = useTheme();
    const { user } = useSession();
    const { hospitalName, parentOrg, fetchBrandingSettings, brandingLoaded } = useSystemStore();
    const isAdmin = user?.role === 'admin';
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    
    // Seeding Filter Modal States
    const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
    const [workplaces, setWorkplaces] = useState<CatalogItem[]>([]);

    // View States
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [prevViewMode, setPrevViewMode] = useState<ViewMode>('LIST');
    const [activeDocument, setActiveDocument] = useState<any | null>(null);
    const [createFormType, setCreateFormType] = useState<string>('2'); // Mẫu 2 mặc định
    
    // Search Params & Step Workflow
    const [searchParams, setSearchParams] = useSearchParams();
    const stepParam = searchParams.get('step') || 'dashboard';

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [formFilter, setFormFilter] = useState<string>('All');
    const [contractFilter, setContractFilter] = useState<string>('All');
    const [signatureTypeSelect, setSignatureTypeSelect] = useState<'USB' | 'HSM'>('HSM');
    const [signFilter, setSignFilter] = useState<string>('All');
    const [sendFilter, setSendFilter] = useState<string>('All');
    const [examFilter, setExamFilter] = useState<string>('All');
    const [startDate, setStartDate] = useState<string>(getLocalDateString());
    const [endDate, setEndDate] = useState<string>(getLocalDateString());
    const [pageSize, setPageSize] = useState<number | string>(100);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeXmlDoc, setActiveXmlDoc] = useState<any | null>(null);

    // Contracts States
    const [contracts, setContracts] = useState<any[]>([]);
    const [isContractsLoading, setIsContractsLoading] = useState(false);

    // Barcode settings state loaded from VNeID configuration
    const [barcodeLabelSizeXn, setBarcodeLabelSizeXn] = useState('50x30');
    const [barcodeLabelSizeKsk, setBarcodeLabelSizeKsk] = useState('50x30');
    const [barcodeShowHospital, setBarcodeShowHospital] = useState(true);
    const [barcodeShowDate, setBarcodeShowDate] = useState(true);
    const [barcodeShowSampleType, setBarcodeShowSampleType] = useState(true);
    const [allowUnsignedSync, setAllowUnsignedSync] = useState(false);

    // Barcode print action states
    const [activeBarcodeDocs, setActiveBarcodeDocs] = useState<any[]>([]);
    const [isPrintXnModalOpen, setIsPrintXnModalOpen] = useState(false);
    const [xnPrintPayload, setXnPrintPayload] = useState<PrintXnPayload[]>([]);
    const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState(false);

    const loadSettings = async () => {
        try {
            const settings = await healthCheckService.getSettings();
            if (settings) {
                setBarcodeLabelSizeXn(settings.barcode_label_size_xn || '50x30');
                setBarcodeLabelSizeKsk(settings.barcode_label_size_ksk || '50x30');
                setBarcodeShowHospital(settings.barcode_show_hospital !== false);
                setBarcodeShowDate(settings.barcode_show_date !== false);
                setBarcodeShowSampleType(settings.barcode_show_sample_type !== false);
                setAllowUnsignedSync(settings.allow_unsigned_sync === true);
                setSignatureTypeSelect(settings.signature_type || 'HSM');
            }
        } catch (error) {
            console.error("Failed to load settings in HealthCheckSyncView:", error);
        }
    };


    useEffect(() => {
        loadSettings();
        if (!brandingLoaded) {
            fetchBrandingSettings();
        }
        try {
            useSystemStore.getState().resetMenuConfig('health-check');
        } catch (error) {
            console.error("Failed to reset menu config:", error);
        }
    }, [brandingLoaded, fetchBrandingSettings]);

    const loadContracts = async () => {
        setIsContractsLoading(true);
        try {
            const data = await healthCheckService.getContracts({ startDate, endDate });
            setContracts(data);
        } catch (error) {
            console.error("Failed to load contracts:", error);
            toast.error("Không thể tải danh sách gói khám!");
        } finally {
            setIsContractsLoading(false);
        }
    };

    const handleOpenSeedModal = () => {
        handleSeedFromHis({ startDate, endDate });
    };

    // Tải danh mục công ty khi mở modal đồng bộ HIS
    useEffect(() => {
        if (isSeedModalOpen && workplaces.length === 0) {
            catalogService.getWorkplaces().then(setWorkplaces).catch(err => {
                console.error("Lỗi tải danh mục công ty từ HIS:", err);
            });
        }
    }, [isSeedModalOpen, workplaces.length]);

    const handleSeedFromHis = async (filters?: { startDate?: string; endDate?: string; workplaceId?: string }) => {
        if (filters?.startDate && filters.startDate.trim() !== '') {
            if (filters.startDate.length !== 10 || !filters.startDate.includes('-')) {
                toast.error("Ngày bắt đầu không đúng định dạng dd/mm/yyyy");
                return;
            }
        }
        if (filters?.endDate && filters.endDate.trim() !== '') {
            if (filters.endDate.length !== 10 || !filters.endDate.includes('-')) {
                toast.error("Ngày kết thúc không đúng định dạng dd/mm/yyyy");
                return;
            }
        }

        setIsSeeding(true);
        const toastId = toast.loading("Đang kết nối hệ thống HIS và đồng bộ dữ liệu khám...");
        try {
            const res = await healthCheckService.seedFromHis(filters);
            if (res.success) {
                // Hiển thị thông báo kết quả chính
                toast.success(res.message || `Đồng bộ hoàn tất ${res.count} hồ sơ!`, { id: toastId });

                // Hiển thị thêm thông báo cảnh báo nếu có hồ sơ bị bỏ qua
                if (res.skipped_signed && res.skipped_signed > 0) {
                    setTimeout(() => {
                        toast.warning(`⚠️ ${res.skipped_signed} hồ sơ đã ký số — không thể cập nhật, giữ nguyên.`, { duration: 6000 });
                    }, 500);
                }
                if (res.skipped_sent && res.skipped_sent > 0) {
                    setTimeout(() => {
                        toast.warning(`⚠️ ${res.skipped_sent} hồ sơ đã gửi VNeID — không thể cập nhật, giữ nguyên.`, { duration: 6000 });
                    }, 1000);
                }
                if (res.partial_update && res.partial_update > 0) {
                    setTimeout(() => {
                        toast.info(`ℹ️ ${res.partial_update} hồ sơ đã có dữ liệu khám — chỉ cập nhật thông tin hành chính.`, { duration: 6000 });
                    }, 1500);
                }

                if (stepParam === 'sync') {
                    await loadContracts();
                } else {
                    await loadData();
                }
                setIsSeedModalOpen(false);
            } else {
                toast.error(res.message || "Lấy dữ liệu từ HIS thất bại.", { id: toastId });
            }
        } catch (error: any) {
            toast.error("Lỗi đồng bộ từ HIS: " + error.message, { id: toastId });
        } finally {
            setIsSeeding(false);
        }
    };


    // Tự động chuyển viewMode và tải lại dữ liệu khi URL step parameter thay đổi (click Sidebar)
    useEffect(() => {
        if (stepParam === 'create') {
            setActiveDocument(null);
            setViewMode('CREATE');
        } else {
            setViewMode('LIST');
        }

        // Auto-configure filters based on workflow step
        if (stepParam === 'pending-sign') {
            setSignFilter('Unsigned');
            setSendFilter('All');
        } else if (stepParam === 'pending-send') {
            setSignFilter('Signed');
            setSendFilter('Unsent');
        } else if (stepParam === 'history') {
            setSignFilter('Signed');
            setSendFilter('Success');
        } else {
            setSignFilter('All');
            setSendFilter('All');
        }

        // Reset dates to today
        const todayStr = getLocalDateString();
        setStartDate(todayStr);
        setEndDate(todayStr);

        if (stepParam === 'sync' || stepParam === 'manage' || stepParam === 'print-code') {
            loadContracts();
        }
        
        if (stepParam !== 'sync' && !stepParam.startsWith('settings')) {
            loadData();
        }

        if (stepParam === 'print-code') {
            loadSettings();
        }

        setSelectedIds(new Set()); // Reset selections
    }, [stepParam]);

    useEffect(() => {
        if (stepParam === 'sync' || stepParam === 'manage' || stepParam === 'print-code') {
            loadContracts();
        }
    }, [startDate, endDate]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const { documents: data, totalCount: total } = await healthCheckService.getDocumentsWithCount({
                startDate,
                endDate,
                searchTerm,
                status: sendFilter,
                signatureStatus: signFilter,
                formType: formFilter,
                contractId: contractFilter,
                examStatus: examFilter,
                limit: pageSize,
                page: currentPage
            });
            setDocuments(data);
            setTotalCount(total);
        } catch (error) {
            console.error("Failed to load health check documents", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-reload data when search terms, dates, or other filters change
    useEffect(() => {
        if (stepParam !== 'sync' && !stepParam.startsWith('settings')) {
            loadData();
        }
    }, [startDate, endDate, searchTerm, sendFilter, signFilter, formFilter, contractFilter, examFilter, pageSize, currentPage, stepParam]);



    const handleSaveDocument = async (payload: any, options?: { shouldSign?: boolean; shouldUnlock?: boolean; signatureType?: 'USB' | 'HSM' }) => {
        setIsLoading(true);
        try {
            let docId = activeDocument?.id || payload?.id;
            if (options?.shouldUnlock) {
                if (!docId) throw new Error('Không tìm thấy hồ sơ cần mở khóa.');
                const reason = window.prompt('Nhập lý do hủy chữ ký/mở khóa hồ sơ:', 'Điều chỉnh hồ sơ theo yêu cầu nghiệp vụ');
                if (!reason?.trim()) {
                    toast.error('Bắt buộc nhập lý do hủy chữ ký/mở khóa hồ sơ.');
                    return;
                }
                await healthCheckService.unlockDocument(docId.toString(), reason.trim());
                const unlockedDoc = await healthCheckService.getDocument(docId.toString());
                setActiveDocument(unlockedDoc);
                await loadData();
                toast.success('Đã hủy chữ ký số và mở khóa hồ sơ thành công!');
                return;
            }

            if (viewMode === 'CREATE' || !docId) {
                const res = await healthCheckService.createDocument(payload);
                docId = res.id;
                setViewMode('EDIT');
                if (!options?.shouldSign) {
                    toast.success("Tạo hồ sơ KSK thành công!");
                }
            } else if ((viewMode === 'EDIT' || docId) && docId) {
                await healthCheckService.updateDocument(docId.toString(), payload);
                if (!options?.shouldSign && !options?.shouldUnlock) {
                    toast.success("Cập nhật hồ sơ KSK thành công!");
                }
            }

            const targetSigType = options?.signatureType || signatureTypeSelect;

            if (options?.shouldSign && docId) {
                if (targetSigType === 'USB') {
                    const toastId = toast.loading("Đang kết nối USB Token...");
                    try {
                        const docDetail = await healthCheckService.getDocument(docId.toString());
                        if (!docDetail.xml_data) {
                            throw new Error("Không tìm thấy dữ liệu XML chưa ký.");
                        }
                        toast.loading("Đang yêu cầu ký số bằng USB Token. Vui lòng nhập PIN trên thiết bị...", { id: toastId });
                        await signHealthCheckXmlWithAgent(docId.toString());
                        toast.loading("Đang gửi chữ ký số lên hệ thống...", { id: toastId });
                        toast.success("Đã khóa & ký số hồ sơ thành công bằng USB Token!", { id: toastId });
                    } catch (error: any) {
                        toast.error("Lỗi ký số USB Token: " + error.message, { id: toastId, duration: 6000 });
                        throw error;
                    }
                } else {
                    await healthCheckService.signDocuments([docId.toString()], 'HSM');
                    toast.success("Đã khóa & ký số hồ sơ bằng HSM Server thành công!");
                }
            } else if (options?.shouldUnlock) {
                toast.success("Đã mở khóa hồ sơ thành công!");
            }

            await loadData();

            if (options?.shouldSign) {
                setSearchParams({ step: 'manage' }); // Redirect to manage
                setViewMode('LIST');
                setActiveDocument(null);
            } else {
                // Keep the editing form open and update the local activeDocument so the tabs and states remain intact
                if (docId) {
                    try {
                        const updatedDoc = await healthCheckService.getDocument(docId.toString());
                        if (updatedDoc) {
                            setActiveDocument(updatedDoc);
                        }
                    } catch (fetchErr) {
                        console.warn('⚠️ Failed to re-fetch merged document:', fetchErr);
                    }
                }
            }
        } catch (error: any) {
            toast.error("Lỗi lưu hồ sơ: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelForm = () => {
        setViewMode('LIST');
        setActiveDocument(null);
        setSearchParams({ step: 'manage' });
    };

    const handleDeleteDoc = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa hồ sơ khám sức khỏe này?")) return;
        setIsLoading(true);
        try {
            await healthCheckService.deleteDocument(id);
            toast.success("Đã xóa hồ sơ thành công!");
            await loadData();
        } catch (error: any) {
            toast.error("Lỗi xóa hồ sơ: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(filteredDocuments.map(d => d.id.toString())));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSendDocuments = async () => {
        if (selectedIds.size === 0) {
            toast.warning("Vui lòng chọn ít nhất một hồ sơ để gửi.");
            return;
        }

        // Kiểm tra điều kiện chỉ cho phép gửi khi ĐÃ KẾT LUẬN
        const uncompletedDocs = documents.filter(d => 
            selectedIds.has(d.id.toString()) && 
            !(d.status === 'ĐÃ_KẾT_LUẬN' || d.conclusion_data?.fitness_class || d.conclusion_data?.ket_luan_loai_suc_khoe || d.conclusion_data?.diagnosis)
        );
        if (uncompletedDocs.length > 0) {
            toast.warning(`Có ${uncompletedDocs.length} hồ sơ chưa có kết luận khám. Bấm "Gửi" chỉ cho phép khi hồ sơ ở trạng thái "Đã kết luận"!`);
            return;
        }

        if (!allowUnsignedSync) {
            const unsignedDocs = documents.filter(d => selectedIds.has(d.id.toString()) && d.signature_status === 'Unsigned');
            if (unsignedDocs.length > 0) {
                toast.warning(`Có ${unsignedDocs.length} hồ sơ chưa được ký số. Bạn phải thực hiện ký số trước khi gửi cổng y tế.`);
                return;
            }
        }

        setIsSending(true);
        const idsToSend = Array.from(selectedIds) as string[];
        const toastId = toast.loading(`Bắt đầu đồng bộ liên thông ${idsToSend.length} hồ sơ lên VNeID...`);
        let failedCount = 0;
        let successCount = 0;
        const failedIds: string[] = [];

        try {
            for (let i = 0; i < idsToSend.length; i++) {
                const docId = idsToSend[i];
                const docObj = documents.find(d => d.id.toString() === docId);
                const patientDesc = docObj?.patient_name ? ` (BN: ${docObj.patient_name})` : '';

                toast.loading(`[${i + 1}/${idsToSend.length}] Đang gửi hồ sơ ${docObj?.doc_no || docId}${patientDesc}...`, { id: toastId });

                try {
                    const resultFailed = await healthCheckService.sendDocumentsToPortal([docId]);
                    if (resultFailed && resultFailed.length > 0) {
                        failedCount++;
                        failedIds.push(docId);
                    } else {
                        successCount++;
                    }
                } catch (sendErr: any) {
                    console.error(`Lỗi gửi hồ sơ ID ${docId}:`, sendErr);
                    failedCount++;
                    failedIds.push(docId);
                }

                // Dừng nhẹ 500ms giữa các hồ sơ để tránh nghẽn Gateway
                if (i < idsToSend.length - 1) {
                    await new Promise(r => setTimeout(r, 500));
                }
            }

            await loadData();
            
            if (failedCount > 0 && successCount > 0) {
                toast.warning(`Đã hoàn tất: ${successCount} thành công, ${failedCount} lỗi. Vui lòng xem cột trạng thái để kiểm tra chi tiết.`, { id: toastId });
            } else if (failedCount > 0 && successCount === 0) {
                toast.error(`Đồng bộ thất bại toàn bộ ${failedCount} hồ sơ. Vui lòng xem log chi tiết.`, { id: toastId });
            } else {
                toast.success(`Liên thông thành công toàn bộ ${successCount} hồ sơ khám sức khỏe lên cổng VNeID!`, { id: toastId });
                setSearchParams({ step: 'manage' }); // Redirect to manage
            }
            
            setSelectedIds(new Set());
        } catch (error: any) {
            console.error("Error sending documents", error);
            toast.error("Có lỗi xảy ra trong quá trình đồng bộ: " + error.message, { id: toastId });
        } finally {
            setIsSending(false);
        }
    };

    const handleSendSingleDocument = async (doc: any) => {
        const isDone = doc.status === 'ĐÃ_KẾT_LUẬN' || doc.conclusion_data?.fitness_class || doc.conclusion_data?.ket_luan_loai_suc_khoe || doc.conclusion_data?.diagnosis;
        if (!isDone) {
            toast.warning(`Hồ sơ bệnh nhân ${doc.patient_name} chưa có kết luận khám. Bấm "Gửi" chỉ cho phép khi ở trạng thái "Đã kết luận"!`);
            return;
        }

        if (!allowUnsignedSync && doc.signature_status === 'Unsigned') {
            toast.warning(`Hồ sơ bệnh nhân ${doc.patient_name} chưa được ký số. Bạn phải thực hiện ký số trước khi gửi cổng y tế.`);
            return;
        }

        setIsSending(true);
        const toastId = toast.loading(`Đang đồng bộ liên thông hồ sơ của BN: ${doc.patient_name} lên VNeID...`);
        try {
            const failedIds = await healthCheckService.sendDocumentsToPortal([doc.id.toString()]);
            await loadData();
            
            if (failedIds.length > 0) {
                toast.error(`Đồng bộ thất bại. Vui lòng rà soát lại lỗi chi tiết.`, { id: toastId });
            } else {
                toast.success(`Liên thông thành công hồ sơ của BN: ${doc.patient_name} lên cổng VNeID!`, { id: toastId });
            }
        } catch (error: any) {
            console.error("Error sending document", error);
            toast.error("Có lỗi xảy ra: " + error.message, { id: toastId });
        } finally {
            setIsSending(false);
        }
    };

    const handleSignDocuments = async () => {
        if (selectedIds.size === 0) {
            toast.warning("Vui lòng chọn hồ sơ để ký.");
            return;
        }
        
        const idsToSign = Array.from(selectedIds) as string[];
        
        if (signatureTypeSelect === 'USB') {
            const confirmSign = confirm(`Bạn đang thực hiện ký số máy trạm cho ${idsToSign.length} hồ sơ sử dụng thiết bị USB Token. Hãy đảm bảo khóa cứng đã cắm vào máy tính.\nTiếp tục?`);
            if (!confirmSign) return;
            
            setIsSigning(true);
            const toastId = toast.loading("Đang khởi tạo kết nối USB Token...");
            try {
                
                for (let i = 0; i < idsToSign.length; i++) {
                    const id = idsToSign[i];
                    toast.loading(`Đang đọc dữ liệu hồ sơ (${i + 1}/${idsToSign.length})...`, { id: toastId });
                    
                    // Fetch document details to get unsigned XML data
                    const docDetail = await healthCheckService.getDocument(id);
                    if (!docDetail.xml_data) {
                        throw new Error(`Hồ sơ số ${docDetail.doc_no || id} chưa có dữ liệu XML XML_DATA để ký.`);
                    }
                    
                    toast.loading(`Đang yêu cầu ký số hồ sơ: ${docDetail.patient_name} (${i + 1}/${idsToSign.length}). Vui lòng nhập PIN trên thiết bị...`, { id: toastId });
                    
                    // Trigger USB signing via local EFY-CA eSigner service
                    await signHealthCheckXmlWithAgent(id);
                }
                
                toast.loading("Đang gửi chữ ký số lên hệ thống...", { id: toastId });
                await loadData();
                toast.success(`Đã hoàn tất ký số thành công cho ${idsToSign.length} hồ sơ bằng USB Token!`, { id: toastId });
                setSelectedIds(new Set());
                setSearchParams({ step: 'pending-send' }); // Redirect to pending send
            } catch (error: any) {
                toast.error("Lỗi ký số USB Token: " + error.message, { id: toastId, duration: 6000 });
            } finally {
                setIsSigning(false);
            }
        } else {
            const confirmSign = confirm(`Bạn đang thực hiện ký số tập trung bằng HSM Server (Cloud CA) cho ${idsToSign.length} hồ sơ.\nTiếp tục?`);
            if (!confirmSign) return;
            
            setIsSigning(true);
            const toastId = toast.loading("Đang gọi HSM Cloud CA để ký số hàng loạt...");
            try {
                await healthCheckService.signDocuments(idsToSign, 'HSM');
                await loadData();
                toast.success("Đã ký số thành công bằng HSM Server!", { id: toastId });
                setSelectedIds(new Set());
                setSearchParams({ step: 'pending-send' }); // Redirect to pending send
            } catch (error: any) {
                toast.error("Lỗi ký số HSM: " + error.message, { id: toastId });
            } finally {
                setIsSigning(false);
            }
        }
    };

    const handleExportExcel = async () => {
        const toastId = toast.loading("Đang khởi tạo dữ liệu và xuất file Excel...");
        try {
            // Fetch all matching records without pagination limit for full export
            const exportDocs = await healthCheckService.getDocumentsList({
                startDate,
                endDate,
                searchTerm,
                status: sendFilter,
                signatureStatus: signFilter,
                formType: formFilter,
                contractId: contractFilter,
                examStatus: examFilter,
                limit: 'all'
            });

            if (!exportDocs || exportDocs.length === 0) {
                toast.warning("Không có dữ liệu để xuất.", { id: toastId });
                return;
            }

            // 1. Define Headers
            const headerRow = [
                'STT',
                'Số hồ sơ',
                'Mã bệnh nhân',
                'Họ và tên',
                'Số CCCD',
                'Ngày sinh',
                'Giới tính',
                'Loại mẫu biểu',
                'Trạng thái khám',
                'Trạng thái ký số',
                'Loại ký số',
                'Trạng thái gửi cổng',
                'Thời gian tạo',
                'Thời gian gửi',
                'Mã giao dịch',
                'Thông báo lỗi'
            ];

            // 2. Map Document Rows
            const dataRows = exportDocs.map((doc: any, idx: number) => {
                let sigStatusText = (doc.signature_status || doc.signatureStatus) === 'Signed' ? 'Đã ký số' : 'Chưa ký số';
                let sendStatusText = 'Chưa gửi';
                const status = doc.send_status || doc.sendStatus;
                if (status === 'Success') sendStatusText = 'Thành công';
                else if (status === 'Pending') sendStatusText = 'Đang gửi';
                else if (status === 'Error') sendStatusText = 'Thất bại';

                const isDone = doc.conclusion_data?.fitness_class || doc.conclusion_data?.ket_luan_loai_suc_khoe || doc.conclusion_data?.diagnosis;
                const examStatusText = isDone ? 'Đã kết luận' : 'Đang khám';

                return [
                    idx + 1,
                    doc.doc_no || doc.docNo || '',
                    doc.patient_id || doc.patientId || '',
                    doc.patient_name || doc.patientName || '',
                    doc.cccd || '',
                    doc.dob ? formatDate(doc.dob) : '',
                    doc.gender || 'Nam',
                    getFormName(doc.form_type || doc.formType),
                    examStatusText,
                    sigStatusText,
                    doc.signature_type || doc.signatureType || '',
                    sendStatusText,
                    (doc.created_at || doc.createdAt) ? formatDateTime(doc.created_at || doc.createdAt) : '',
                    (doc.sent_at || doc.sentAt) ? formatDateTime(doc.sent_at || doc.sentAt) : '',
                    doc.transaction_id || doc.transactionId || '',
                    doc.error_message || doc.errorMessage || ''
                ];
            });

            // 3. Build AOA Data (Array of Arrays)
            const fromDateStr = startDate ? getFilterDateDisplay(startDate) : '';
            const toDateStr = endDate ? getFilterDateDisplay(endDate) : '';
            let dateSubtitle = '';
            if (fromDateStr && toDateStr) {
                dateSubtitle = `Khoảng thời gian: Từ ngày ${fromDateStr} đến ngày ${toDateStr}`;
            } else if (fromDateStr) {
                dateSubtitle = `Khoảng thời gian: Từ ngày ${fromDateStr}`;
            } else if (toDateStr) {
                dateSubtitle = `Khoảng thời gian: Đến ngày ${toDateStr}`;
            } else {
                dateSubtitle = 'Khoảng thời gian: Tất cả';
            }

            const unitTitle = (hospitalName || useSystemStore.getState().hospitalName || 'BỆNH VIỆN ĐA KHOA TỈNH NINH BÌNH').toUpperCase();
            const parentOrgTitle = (parentOrg || useSystemStore.getState().parentOrg || '').toUpperCase();

            const aoaData = [
                ...(parentOrgTitle ? [[parentOrgTitle]] : []),
                [unitTitle],
                ['DANH SÁCH LIÊN THÔNG KHÁM SỨC KHỎE (VNeID)'],
                [dateSubtitle],
                [''],
                headerRow,
                ...dataRows
            ];

            // Create Worksheet
            const ws = XLSX.utils.aoa_to_sheet(aoaData);

            // Define column widths in characters
            const colWidths = [
                { wch: 6 },   // STT
                { wch: 20 },  // Số hồ sơ
                { wch: 15 },  // Mã bệnh nhân
                { wch: 25 },  // Họ và tên
                { wch: 18 },  // Số CCCD
                { wch: 14 },  // Ngày sinh
                { wch: 10 },  // Giới tính
                { wch: 30 },  // Loại mẫu biểu
                { wch: 16 },  // Trạng thái khám
                { wch: 18 },  // Trạng thái ký số
                { wch: 12 },  // Loại ký số
                { wch: 20 },  // Trạng thái gửi cổng
                { wch: 22 },  // Thời gian tạo
                { wch: 22 },  // Thời gian gửi
                { wch: 30 },  // Mã giao dịch
                { wch: 40 }   // Thông báo lỗi
            ];
            ws['!cols'] = colWidths;

            // Create Workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "DanhSachKSK");

            // Write and download
            const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
            XLSX.writeFile(wb, `DanhSachLienThongKSK_${timestamp}.xlsx`);
            toast.success(`Đã xuất ${exportDocs.length} hồ sơ ra file Excel thành công!`, { id: toastId });
        } catch (err: any) {
            console.error("Lỗi xuất Excel:", err);
            toast.error("Lỗi xuất file Excel: " + (err?.message || err), { id: toastId });
        }
    };

    // Xuất Excel riêng cho trang Đồng bộ dữ liệu (danh sách gói khám/hợp đồng)
    const handleExportExcelContracts = () => {
        // Lọc contracts theo từ khóa + ngày (dùng lại logic của SyncDataList)
        const filtered = contracts.filter(c => {
            const matchesSearch =
                (c.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            const isStartDateValid = startDate && startDate.length === 10;
            const isEndDateValid = endDate && endDate.length === 10;
            if (isStartDateValid || isEndDateValid) {
                if (c.contract_date) {
                    const parts = c.contract_date.split('/');
                    if (parts.length === 3) {
                        const cDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        if (isStartDateValid && cDateStr < startDate) return false;
                        if (isEndDateValid && cDateStr > endDate) return false;
                    }
                } else {
                    return false;
                }
            }
            return true;
        });

        if (filtered.length === 0) {
            toast.warning("Không có dữ liệu để xuất.");
            return;
        }

        const fromDateStr = startDate ? getFilterDateDisplay(startDate) : '';
        const toDateStr = endDate ? getFilterDateDisplay(endDate) : '';
        let dateSubtitle = fromDateStr && toDateStr
            ? `Khoảng thời gian: Từ ngày ${fromDateStr} đến ngày ${toDateStr}`
            : fromDateStr ? `Từ ngày ${fromDateStr}` : toDateStr ? `Đến ngày ${toDateStr}` : 'Tất cả';

        const headerRow = ['STT', 'Mã hợp đồng', 'Tên gói khám / Công ty', 'Ngày hợp đồng', 'Trạng thái', 'Tổng nhân viên', 'Đã đồng bộ', 'Tỷ lệ (%)'];
        const dataRows = filtered.map((c, idx) => {
            const progress = c.employee_count > 0 ? Math.round((c.synced_count / c.employee_count) * 100) : 0;
            return [
                idx + 1,
                c.code || '',
                c.name || '',
                c.contract_date || '',
                c.status === 'P' ? 'Đã đồng bộ' : 'Chưa đồng bộ',
                c.employee_count || 0,
                c.synced_count || 0,
                `${progress}%`
            ];
        });

        const unitTitle = (hospitalName || useSystemStore.getState().hospitalName || 'BỆNH VIỆN ĐA KHOA TỈNH NINH BÌNH').toUpperCase();
        const parentOrgTitle = (parentOrg || useSystemStore.getState().parentOrg || '').toUpperCase();

        const aoaData = [
            ...(parentOrgTitle ? [[parentOrgTitle]] : []),
            [unitTitle],
            ['DANH SÁCH ĐỒNG BỘ DỮ LIỆU KHÁM SỨC KHỎE'],
            [dateSubtitle],
            [''],
            headerRow,
            ...dataRows
        ];

        const ws = XLSX.utils.aoa_to_sheet(aoaData);
        ws['!cols'] = [
            { wch: 6 }, { wch: 20 }, { wch: 35 }, { wch: 16 },
            { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 10 }
        ];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'DongBoDuLieu');
        const timestamp = new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/:/g, '-');
        XLSX.writeFile(wb, `DanhSachDongBo_${timestamp}.xlsx`);
        toast.success('Xuất file Excel thành công!');
    };

    const handleFilterDateChange = (val: string, setter: (v: string) => void) => {
        const rawValue = val;
        const allDigits = rawValue.replace(/\D/g, '').slice(0, 8);

        let formatted = '';
        if (allDigits.length > 0) {
            let day = allDigits.slice(0, 2);
            let month = allDigits.slice(2, 4);
            let year = allDigits.slice(4, 8);

            if (day.length === 2 && parseInt(day) > 31) day = '31';
            if (day.length === 2 && parseInt(day) === 0) day = '01';
            if (month.length === 2 && parseInt(month) > 12) month = '12';
            if (month.length === 2 && parseInt(month) === 0) month = '01';

            formatted = day;
            if (allDigits.length > 2) formatted += '/' + month;
            if (allDigits.length > 4) formatted += '/' + year;
        }

        let finalValue = formatted;
        if (formatted.length === 10) {
            const parts = formatted.split('/');
            finalValue = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        setter(finalValue);
    };

    const getFilterDateDisplay = (value: string) => {
        if (!value) return '';
        if (value.includes('-')) {
            const parts = value.split('-');
            if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        return value;
    };

    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            const matchesSearch = (doc.patient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  (doc.doc_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (doc.cccd || '').toLowerCase().includes(searchTerm.toLowerCase());
            
            // Filter by signature status
            let matchesSign = true;
            if (signFilter !== 'All') {
                matchesSign = doc.signature_status === signFilter;
            }

            // Filter by send status
            let matchesSend = true;
            if (sendFilter !== 'All') {
                if (sendFilter === 'Unsent') {
                    matchesSend = doc.send_status !== 'Success' && doc.send_status !== 'Pending';
                } else {
                    matchesSend = doc.send_status === sendFilter;
                }
            }

            // Filter by date range (created_at)
            let matchesDate = true;
            if (startDate && startDate.length === 10) {
                const docDate = new Date(doc.created_at);
                const start = new Date(startDate + 'T00:00:00');
                matchesDate = matchesDate && docDate >= start;
            }
            if (endDate && endDate.length === 10) {
                const docDate = new Date(doc.created_at);
                const end = new Date(endDate + 'T23:59:59');
                matchesDate = matchesDate && docDate <= end;
            }

            // Filter by form dropdown inside page
            let matchesForm = true;
            if (formFilter !== 'All') {
                if (formFilter === 'group_children') {
                    matchesForm = ['6', '7', '8', '9', '10', '11', '12', '13'].includes(doc.form_type);
                } else if (formFilter === 'group_students') {
                    matchesForm = ['1', '14', '15', '16', '17'].includes(doc.form_type);
                } else if (formFilter === 'group_industry') {
                    matchesForm = ['4', '5'].includes(doc.form_type);
                } else {
                    matchesForm = doc.form_type === formFilter;
                }
            }

            // Filter by contract
            let matchesContract = true;
            if (contractFilter !== 'All') {
                matchesContract = String(doc.his_contract_id) === contractFilter;
            }

            // Filter by exam status
            let matchesExam = true;
            if (examFilter !== 'All') {
                const isDone = doc.conclusion_data?.fitness_class || doc.conclusion_data?.ket_luan_loai_suc_khoe || doc.conclusion_data?.diagnosis;
                if (examFilter === 'Done') matchesExam = !!isDone;
                if (examFilter === 'InProgress') matchesExam = !isDone;
            }

            return matchesSearch && matchesSign && matchesSend && matchesDate && matchesForm && matchesContract && matchesExam;
        });
    }, [documents, searchTerm, formFilter, contractFilter, signFilter, sendFilter, examFilter, startDate, endDate]);

    const getFormName = (type: string) => {
        const names: Record<string, string> = {
            '1': 'Mẫu 1: Trẻ em dưới 06 tuổi',
            '2': 'Mẫu 2: Người từ đủ 06 tuổi đến dưới 18 tuổi',
            '3': 'Mẫu 3: Người từ đủ 18 tuổi trở lên',
            'driver': 'Giấy KSK người lái xe (TTLT 24/2015)',
            'mau3-driver': 'Giấy KSK người lái xe (TTLT 24/2015)',
            '4': 'Mẫu 4: KSK Nhân viên đường sắt',
            '5': 'Mẫu 5: KSK Thuyền viên / Đi biển',
        };
        return names[type] || `Mẫu biểu ${type}`;
    };

    const getFormColor = (type: string) => {
        const num = parseInt(type, 10);
        if (num === 2) return 'text-[#0f766e] bg-teal-50 border-teal-200';
        if (num === 3) return 'text-purple-600 bg-purple-50 border-purple-200';
        if (num >= 6 && num <= 13) return 'text-green-600 bg-green-50 border-green-200';
        return 'text-slate-600 bg-slate-50 border-slate-200';
    };

    if (viewMode === 'PRINT' && activeDocument) {
        return <PrintForm document={activeDocument} onClose={() => setViewMode(prevViewMode)} />;
    }

    if (viewMode === 'PRINT_BARCODE' && activeBarcodeDocs.length > 0) {
        return (
            <PrintBarcodeForm 
                documents={activeBarcodeDocs} 
                onClose={() => setViewMode('LIST')} 
                defaultLabelSize={barcodeLabelSizeKsk as any}
                showHospital={barcodeShowHospital}
                showDate={barcodeShowDate}
                showSampleType={barcodeShowSampleType}
            />
        );
    }

    if (viewMode === 'PRINT_BARCODE_XN' && xnPrintPayload.length > 0) {
        return (
            <PrintBarcodeXnForm 
                payload={xnPrintPayload} 
                onClose={async () => {
                    setViewMode('LIST');
                    const docIds = Array.from(new Set<string>(xnPrintPayload.map(p => String(p.patient.id))));
                    const samples = xnPrintPayload.flatMap(p => 
                        p.orders.map((o: any) => {
                            const docNoStr = o.hisDocNo || p.patient.hisDocNo || p.patient.docNo || '';
                            const docNoNum = parseInt(docNoStr.replace(/\D/g, ''), 10) || 0;
                            const orderNum = parseInt(o.orderNo || '', 10) || 0;
                            return {
                                userID: o.collectorId || user?.userId || '',
                                deptID: user?.departmentId || user?.deptId || '101',
                                documentNo: docNoNum,
                                orderID: orderNum,
                                sampleArea: o.sampleAreaCode || '',
                                gateID: o.sampleGateCode || ''
                            };
                        })
                    );

                    try {
                        await healthCheckService.markBarcodePrinted(docIds, samples);
                        loadData();
                    } catch (err) {
                        console.error("Lỗi cập nhật trạng thái in barcode:", err);
                    }
                }}
                defaultLabelSize={barcodeLabelSizeXn as any}
                showHospital={barcodeShowHospital}
                showDate={barcodeShowDate}
                showSampleType={barcodeShowSampleType}
            />
        );
    }

    return (
        <div className="h-full flex flex-col">

            {viewMode === 'LIST' ? (
                <div className="p-4 sm:p-5 lg:p-6 flex-1 flex flex-col space-y-4 overflow-y-auto min-h-0">
                    {/* Dashboard */}
                    {stepParam === 'dashboard' && (
                        <Dashboard documents={documents} />
                    )}

                    {/* Contract Management */}
                    {stepParam === 'contracts' && (
                        <ContractManagement />
                    )}

                    {/* Patient Reception */}
                    {stepParam === 'reception' && (
                        <PatientReception />
                    )}

                    {/* Sample Tracking */}
                    {stepParam === 'sample-tracking' && (
                        <ErrorBoundary>
                            <SampleTracking />
                        </ErrorBoundary>
                    )}

                    {/* Filter toolbar and Table only shown on non-dashboard workflow steps */}

                    {stepParam !== 'dashboard' && stepParam !== 'contracts' && stepParam !== 'reception' && stepParam !== 'sample-tracking' && !stepParam.startsWith('settings') && (

                        <>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 items-end ${stepParam === 'sync' ? 'lg:grid-cols-3' : 'lg:grid-cols-6'}`}>
                                    {/* Từ ngày */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Từ ngày</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    {/* Đến ngày */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Đến ngày</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                        />
                                    </div>

                                    {/* Gói hợp đồng (contractFilter) - ẩn khi ở trang đồng bộ */}
                                    {stepParam !== 'sync' && (
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Gói hợp đồng</label>
                                            <select 
                                                value={contractFilter}
                                                onChange={e => setContractFilter(e.target.value)}
                                                className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer ${fontSettings.controls} font-bold`}
                                            >
                                                <option value="All">Tất cả hợp đồng</option>
                                                {contracts.map(c => (
                                                    <option key={c.id} value={String(c.id)}>{c.code} - {c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Trạng thái khám (examFilter) - ẩn khi ở trang đồng bộ */}
                                    {stepParam !== 'sync' && (
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Trạng thái khám</label>
                                            <select 
                                                value={examFilter}
                                                onChange={e => setExamFilter(e.target.value)}
                                                className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer ${fontSettings.controls}`}
                                            >
                                                <option value="All">Tất cả trạng thái</option>
                                                <option value="Done">Đã kết luận</option>
                                                <option value="InProgress">Đang khám</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Trạng thái gửi (sendFilter) - ẩn khi ở trang đồng bộ */}
                                    {stepParam !== 'sync' && (
                                        <div className="space-y-1">
                                            <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Trạng thái gửi</label>
                                            <select 
                                                value={sendFilter}
                                                onChange={e => setSendFilter(e.target.value)}
                                                className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer ${fontSettings.controls}`}
                                            >
                                                <option value="All">Tất cả trạng thái</option>
                                                <option value="Success">Gửi thành công</option>
                                                <option value="Unsent">Chưa gửi</option>
                                                <option value="Pending">Đang gửi</option>
                                                <option value="Error">Thất bại</option>
                                            </select>
                                        </div>
                                    )}

                                    {/* Từ khóa tìm kiếm */}
                                    <div className="space-y-1 relative">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                                            {stepParam === 'sync' ? 'Tìm kiếm gói khám / công ty' : 'Từ khóa tìm kiếm'}
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input 
                                                    type="text" 
                                                    placeholder={stepParam === 'sync' ? 'Mã HĐ, tên gói khám, công ty...' : 'Tên BN, số hồ sơ hoặc thẻ BHYT...'}
                                                    value={searchTerm}
                                                    onChange={e => setSearchTerm(e.target.value)}
                                                    className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none ${fontSettings.controls}`}
                                                />
                                            </div>
                                            <button className="p-2.5 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-lg transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer">
                                                <SearchIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* List Title & Batch Action */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-md font-extrabold text-slate-800 dark:text-white">Danh sách hồ sơ</h2>
                                        <span className="px-2.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full text-xs font-bold font-mono">
                                            {filteredDocuments.length}
                                        </span>
                                    </div>


                                    {/* Số bản ghi/trang */}
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 border-l border-slate-200 dark:border-slate-700 pl-4">
                                        <span>Số bản ghi/trang:</span>
                                        <select className="p-1 border border-slate-300 rounded bg-slate-50 dark:bg-slate-700 font-bold focus:outline-none">
                                            <option>20</option>
                                            <option>50</option>
                                            <option>100</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                                    {/* Signature filter */}
                                    {stepParam === 'pending-sign' && (
                                        <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden text-xs">
                                            <button
                                                onClick={() => setSignatureTypeSelect('USB')}
                                                className={`px-3 py-1.5 font-bold transition ${signatureTypeSelect === 'USB' ? 'bg-[#0f766e] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                            >
                                                USB Token
                                            </button>
                                            <button
                                                onClick={() => setSignatureTypeSelect('HSM')}
                                                className={`px-3 py-1.5 font-bold transition ${signatureTypeSelect === 'HSM' ? 'bg-[#0f766e] text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                            >
                                                HSM Cloud
                                            </button>
                                        </div>
                                    )}

                                    {stepParam === 'pending-sign' && (
                        <button 
                                            onClick={handleSignDocuments}
                                            disabled={selectedIds.size === 0 || isLoading || isSending || isSigning}
                                            className="px-4 py-2 bg-white border border-[#0f766e] text-[#0f766e] hover:bg-emerald-50 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition text-xs active:scale-95 cursor-pointer"
                                        >
                                            {isSigning ? <RefreshIcon className="w-4 h-4 animate-spin"/> : <SignatureIcon className="w-4 h-4 text-[#0f766e]"/>}
                                            Ký số ({selectedIds.size})
                                        </button>
                                    )}

                                    {stepParam !== 'print-code' && stepParam !== 'sync' && (
                                        <button 
                                            onClick={() => setIsBatchImportModalOpen(true)}
                                            className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs active:scale-95 cursor-pointer shadow-sm"
                                            title="Import danh sách số hồ sơ từ Excel để tự động đồng bộ từ HIS"
                                        >
                                            <CloudUploadIcon className="w-4 h-4"/>
                                            Import từ HIS (Excel)
                                        </button>
                                    )}

                                    {stepParam !== 'print-code' && stepParam !== 'sync' && (
                                        <button 
                                            onClick={handleSendDocuments}
                                            disabled={selectedIds.size === 0 || isLoading || isSending || isSigning}
                                            className="px-4 py-2 bg-[#55b1a3] hover:bg-[#43a294] text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95 text-xs cursor-pointer shadow-sm"
                                        >
                                            <CloudUploadIcon className="w-4 h-4"/>
                                            Gửi liên thông mục đã chọn ({selectedIds.size})
                                        </button>
                                    )}

                                    {stepParam === 'print-code' && (
                                        <button 
                                            onClick={() => setIsPrintXnModalOpen(true)}
                                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs active:scale-95 cursor-pointer shadow-sm animate-in fade-in"
                                            title="In Barcode Xét Nghiệm"
                                        >
                                            <PrinterIcon className="w-4 h-4"/>
                                            In Barcode Xét Nghiệm
                                        </button>
                                    )}

                                    {stepParam === 'sync' ? (
                                        <button 
                                            onClick={handleExportExcelContracts}
                                            disabled={isContractsLoading || contracts.length === 0}
                                            className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
                                            title="Xuất danh sách gói khám / đồng bộ ra file Excel"
                                        >
                                            <DocumentArrowDownIcon className="w-4 h-4"/>
                                            Xuất Excel
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={handleExportExcel}
                                            disabled={isLoading || filteredDocuments.length === 0}
                                            className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
                                            title="Xuất danh sách hiện tại ra file Excel"
                                        >
                                            <DocumentArrowDownIcon className="w-4 h-4"/>
                                            Xuất Excel
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Document List Table */}
                            {stepParam === 'print-code' ? (
                                <PrintCodeList
                                    documents={filteredDocuments}
                                    selectedIds={selectedIds}
                                    onToggleSelect={handleToggleSelect}
                                    onSelectAll={handleSelectAll}
                                    onPrint={(doc) => {
                                        setActiveDocument(doc);
                                        setPrevViewMode('LIST');
                                        setViewMode('PRINT');
                                    }}
                                    onPrintBarcode={(docs) => {
                                        setActiveBarcodeDocs(docs);
                                        setIsPrintXnModalOpen(true);
                                    }}
                                    getFormName={getFormName}
                                    getFormColor={getFormColor}
                                />
                            ) : stepParam === 'sync' ? (
                                <SyncDataList
                                    contracts={contracts}
                                    isLoading={isContractsLoading}
                                    onSeed={handleSeedFromHis}
                                    startDate={startDate}
                                    endDate={endDate}
                                    searchTerm={searchTerm}
                                />
                            ) : (
                                <DocumentList
                                    documents={filteredDocuments}
                                    selectedIds={selectedIds}
                                    onToggleSelect={handleToggleSelect}
                                    onSelectAll={handleSelectAll}
                                    onEdit={async (doc) => {
                                        setIsLoading(true);
                                        try {
                                            const fullDoc = await healthCheckService.getDocument(doc.id);
                                            setActiveDocument(fullDoc || doc);
                                            setViewMode('EDIT');
                                        } catch (err) {
                                            console.error("Failed to fetch latest document:", err);
                                            setActiveDocument(doc);
                                            setViewMode('EDIT');
                                        } finally {
                                            setIsLoading(false);
                                        }
                                    }}
                                    onDelete={handleDeleteDoc}
                                    onViewXml={async (doc) => {
                                         if (!doc.xml_data || !String(doc.xml_data).trim()) {
                                             try {
                                                 const fullDoc = await healthCheckService.getDocument(doc.id);
                                                 setActiveXmlDoc(fullDoc || doc);
                                                 return;
                                             } catch {}
                                         }
                                         setActiveXmlDoc(doc);
                                     }}
                                    onPrint={(doc) => {
                                        setActiveDocument(doc);
                                        setPrevViewMode('LIST');
                                        setViewMode('PRINT');
                                    }}
                                    onSend={handleSendSingleDocument}
                                    getFormName={getFormName}
                                    getFormColor={getFormColor}
                                    pageSize={pageSize}
                                    setPageSize={setPageSize}
                                    currentPage={currentPage}
                                    setCurrentPage={setCurrentPage}
                                    totalCount={totalCount}
                                />
                            )}

                        </>
                    )}

                    {stepParam.startsWith('settings') && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-in fade-in duration-300">
                            {isAdmin ? (
                                <>
                                    <div className="mb-6">
                                        <h2 className="text-xl font-bold text-[#0f766e] dark:text-teal-400 mb-1 flex items-center gap-2">
                                            <AdjustmentsHorizontalIcon className="w-6 h-6" />
                                            {stepParam === 'settings-barcode' ? 'Cấu hình in Barcode' : 'Cấu hình kết nối VNeID'}
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            {stepParam === 'settings-barcode' ? 'Thiết lập kích thước và nội dung hiển thị trên tem in Barcode.' : 'Thiết lập các tham số kết nối, mã cơ sở y tế và đồng bộ tự động lên cổng sức khỏe điện tử VNeID.'}
                                        </p>
                                    </div>
                                    <SettingsTab 
                                        onSaved={loadSettings} 
                                        defaultTab={stepParam === 'settings-barcode' ? 'BARCODE' : 'VNEID'}
                                        hideTabs={false}
                                    />
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center">
                                    <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                                        <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">
                                        Không có quyền truy cập
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                                        Chức năng cấu hình này chỉ dành cho quản trị viên hệ thống. Vui lòng liên hệ admin nếu cần hỗ trợ.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <DynamicForm
                        key={`${activeDocument?.id || 'new'}-${viewMode === 'EDIT' ? activeDocument?.form_type : createFormType}`}
                        formType={viewMode === 'EDIT' ? activeDocument?.form_type : createFormType}
                        initialData={viewMode === 'EDIT' ? activeDocument : undefined}
                        onSave={handleSaveDocument}
                        onCancel={handleCancelForm}
                        onReload={async () => {
                            if (activeDocument?.id) {
                                setIsLoading(true);
                                try {
                                    const refreshed = await healthCheckService.getDocument(activeDocument.id);
                                    if (refreshed) {
                                        setActiveDocument(refreshed);
                                        toast.success("Đã làm mới dữ liệu từ server thành công!");
                                    }
                                } catch (err: any) {
                                    toast.error("Lỗi làm mới: " + err.message);
                                } finally {
                                    setIsLoading(false);
                                }
                            }
                        }}
                        onPreview={(formData) => {
                            setActiveDocument(formData);
                            setPrevViewMode(viewMode);
                            setViewMode('PRINT');
                        }}
                        onChangeFormType={(type) => {
                            if (viewMode === 'EDIT' && activeDocument) {
                                setActiveDocument(prev => prev ? { ...prev, form_type: type } : null);
                            } else {
                                setCreateFormType(type);
                            }
                        }}
                    />
                </div>
            )}

            {/* XML Preview Modal */}
            <XmlPreviewModal 
                activeXmlDoc={activeXmlDoc} 
                onClose={() => setActiveXmlDoc(null)} 
                getFormName={getFormName} 
            />

            {/* HIS Seeding Filter Modal */}
            <HisSeedingFilterModal 
                isOpen={isSeedModalOpen}
                onClose={() => setIsSeedModalOpen(false)}
                onSeed={handleSeedFromHis}
                isSeeding={isSeeding}
                workplaces={workplaces}
                fontSettings={fontSettings}
            />

            {/* Print Barcode XN Modal */}
            {isPrintXnModalOpen && (
                <PrintBarcodeXnModal 
                    patients={documents} 
                    contracts={contracts}
                    onClose={() => setIsPrintXnModalOpen(false)} 
                    onPrint={(payload) => {
                        setXnPrintPayload(payload);
                        setViewMode('PRINT_BARCODE_XN');
                        setIsPrintXnModalOpen(false);
                    }}
                />
            )}
            {/* HIS Batch Import Modal */}
            <HisBatchImportModal
                isOpen={isBatchImportModalOpen}
                onClose={() => setIsBatchImportModalOpen(false)}
                onSuccess={() => {
                    loadData();
                }}
            />
        </div>
    );
};

export default HealthCheckSyncView;
