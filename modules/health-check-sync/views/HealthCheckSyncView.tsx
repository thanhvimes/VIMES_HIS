// ==================== HEALTH CHECK SYNC VIEW ====================
// File: modules/health-check-sync/views/HealthCheckSyncView.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSystemStore } from '../../../stores/useSystemStore';
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
    DocumentArrowDownIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { healthCheckService } from '../../../services/healthCheckService';
import { toast } from 'sonner';
import { catalogService, CatalogItem } from '../../../services/catalogService';
import { FormDateInput } from '../../../components/ui/forms';
import { formatDate, formatDateTime } from '../../../utils/formatters';
import * as XLSX from 'xlsx';

// Import Modular Components
import Dashboard from '../components/Dashboard';
import DocumentList from '../components/DocumentList';
import PrintCodeList from '../components/PrintCodeList';
import SyncDataList from '../components/SyncDataList';
import DynamicForm from '../forms/DynamicForm';
import PrintForm from '../forms/PrintForm';

type ViewMode = 'LIST' | 'CREATE' | 'EDIT' | 'PRINT';

const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const HealthCheckSyncView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    
    // Seeding Filter Modal States
    const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
    const [seedStartDate, setSeedStartDate] = useState('');
    const [seedEndDate, setSeedEndDate] = useState('');
    const [seedWorkplaceId, setSeedWorkplaceId] = useState('');
    const [workplaces, setWorkplaces] = useState<CatalogItem[]>([]);

    // View States
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [activeDocument, setActiveDocument] = useState<any | null>(null);
    const [createFormType, setCreateFormType] = useState<string>('2'); // Mẫu 2 mặc định
    
    // Search Params & Step Workflow
    const [searchParams, setSearchParams] = useSearchParams();
    const stepParam = searchParams.get('step') || 'dashboard';

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [formFilter, setFormFilter] = useState<string>('All');
    const [signatureTypeSelect, setSignatureTypeSelect] = useState<'USB' | 'HSM'>('HSM');
    const [signFilter, setSignFilter] = useState<string>('All');
    const [sendFilter, setSendFilter] = useState<string>('All');
    const [startDate, setStartDate] = useState<string>(getLocalDateString());
    const [endDate, setEndDate] = useState<string>(getLocalDateString());
    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeXmlDoc, setActiveXmlDoc] = useState<any | null>(null);

    // Settings States
    const [vneidUrl, setVneidUrl] = useState('https://api-vneid.moh.gov.vn/api/v1');
    const [vneidUsername, setVneidUsername] = useState('');
    const [vneidPassword, setVneidPassword] = useState('');
    const [maCskcb, setMaCskcb] = useState('15124');
    const [maGtinCskcb, setMaGtinCskcb] = useState('1234567890123');
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
    const [autoSyncInterval, setAutoSyncInterval] = useState(15);
    const [showPassword, setShowPassword] = useState(false);
    const [isSettingsLoading, setIsSettingsLoading] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isTestingSettings, setIsTestingSettings] = useState(false);

    useEffect(() => {
        try {
            useSystemStore.getState().resetMenuConfig('health-check');
        } catch (error) {
            console.error("Failed to reset menu config:", error);
        }
    }, []);

    // Fetch settings
    const loadSettings = async () => {
        setIsSettingsLoading(true);
        try {
            const settings = await healthCheckService.getSettings();
            if (settings) {
                setVneidUrl(settings.vneid_url || 'https://api-vneid.moh.gov.vn/api/v1');
                setVneidUsername(settings.vneid_username || '');
                setVneidPassword(settings.vneid_password || '');
                setMaCskcb(settings.ma_cskcb || '15124');
                setMaGtinCskcb(settings.ma_gtin_cskcb || '1234567890123');
                setAutoSyncEnabled(settings.auto_sync_enabled === true);
                setAutoSyncInterval(settings.auto_sync_interval || 15);
            }
        } catch (error) {
            console.error("Failed to load settings:", error);
        } finally {
            setIsSettingsLoading(false);
        }
    };


    const handleOpenSeedModal = () => {
        const todayStr = getLocalDateString();
        setSeedStartDate(todayStr);
        setSeedEndDate(todayStr);
        setSeedWorkplaceId('');
        setIsSeedModalOpen(true);
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
                toast.success(res.message || `Đồng bộ thành công ${res.count} hồ sơ từ HIS!`, { id: toastId });
                await loadData();
                setIsSeedModalOpen(false); // Đóng modal sau khi đồng bộ thành công
            } else {
                toast.error(res.message || "Lấy dữ liệu từ HIS thất bại.", { id: toastId });
            }
        } catch (error: any) {
            toast.error("Lỗi đồng bộ từ HIS: " + error.message, { id: toastId });
        } finally {
            setIsSeeding(false);
        }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await healthCheckService.updateSettings({
                vneid_url: vneidUrl,
                vneid_username: vneidUsername,
                vneid_password: vneidPassword,
                ma_cskcb: maCskcb,
                ma_gtin_cskcb: maGtinCskcb,
                auto_sync_enabled: autoSyncEnabled,
                auto_sync_interval: autoSyncInterval
            });
            toast.success("Đã lưu cấu hình liên thông thành công!");
        } catch (error: any) {
            toast.error("Lỗi khi lưu cấu hình: " + error.message);
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleTestConnection = async () => {
        setIsTestingSettings(true);
        try {
            const res = await healthCheckService.testConnection({
                vneid_url: vneidUrl,
                vneid_username: vneidUsername,
                vneid_password: vneidPassword
            });
            toast.success(res.message || "Kết nối thành công!");
        } catch (error: any) {
            toast.error("Kết nối thất bại: " + error.message);
        } finally {
            setIsTestingSettings(false);
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

        if (stepParam === 'settings') {
            loadSettings();
        } else {
            loadData();
        }

        if (stepParam === 'sync') {
            handleOpenSeedModal();
        }
        setSelectedIds(new Set()); // Reset selections
    }, [stepParam]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await healthCheckService.getDocumentsList();
            setDocuments(data);
        } catch (error) {
            console.error("Failed to load health check documents", error);
        } finally {
            setIsLoading(false);
        }
    };



    const handleSaveDocument = async (payload: any) => {
        setIsLoading(true);
        try {
            if (viewMode === 'CREATE') {
                await healthCheckService.createDocument(payload);
                toast.success("Tạo hồ sơ KSK thành công!");
            } else if (viewMode === 'EDIT' && activeDocument) {
                await healthCheckService.updateDocument(activeDocument.id, payload);
                toast.success("Cập nhật hồ sơ KSK thành công!");
            }
            await loadData();
            setSearchParams({ step: 'manage' }); // Redirect to manage
        } catch (error: any) {
            toast.error("Lỗi lưu hồ sơ: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelForm = () => {
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

        const unsignedDocs = documents.filter(d => selectedIds.has(d.id.toString()) && d.signature_status === 'Unsigned');
        if (unsignedDocs.length > 0) {
            toast.warning(`Có ${unsignedDocs.length} hồ sơ chưa được ký số. Bạn phải thực hiện ký số trước khi gửi cổng y tế.`);
            return;
        }

        setIsSending(true);
        const toastId = toast.loading(`Đang đồng bộ liên thông ${selectedIds.size} hồ sơ lên VNeID...`);
        try {
            const idsToSend = Array.from(selectedIds) as string[];
            const failedIds = await healthCheckService.sendDocumentsToPortal(idsToSend);
            await loadData();
            
            if (failedIds.length > 0) {
                toast.error(`Đồng bộ hoàn tất với ${failedIds.length} lỗi. Vui lòng kiểm tra lại.`, { id: toastId });
            } else {
                toast.success(`Liên thông thành công ${idsToSend.length} hồ sơ khám sức khỏe lên cổng VNeID!`, { id: toastId });
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
        if (doc.signature_status === 'Unsigned') {
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
            const toastId = toast.loading("Đang kết nối USB Token và ký số tài liệu...");
            try {
                await new Promise(resolve => setTimeout(resolve, 1500));
                await healthCheckService.signDocuments(idsToSign, 'USB');
                await loadData();
                toast.success("Đã hoàn tất ký số bằng USB Token cá nhân thành công!", { id: toastId });
                setSelectedIds(new Set());
                setSearchParams({ step: 'pending-send' }); // Redirect to pending send
            } catch (error: any) {
                toast.error("Lỗi ký số USB Token: " + error.message, { id: toastId });
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

    const handleExportExcel = () => {
        if (filteredDocuments.length === 0) {
            toast.warning("Không có dữ liệu để xuất.");
            return;
        }

        // 1. Define Headers
        const headerRow = [
            'STT',
            'Mã đợt khám',
            'Mã bệnh nhân',
            'Họ và tên',
            'Số CCCD',
            'Ngày sinh',
            'Giới tính',
            'Loại mẫu biểu',
            'Trạng thái ký số',
            'Loại ký số',
            'Trạng thái gửi cổng',
            'Thời gian tạo',
            'Thời gian gửi',
            'Mã giao dịch',
            'Thông báo lỗi'
        ];

        // 2. Map Document Rows
        const dataRows = filteredDocuments.map((doc, idx) => {
            let sigStatusText = doc.signature_status === 'Signed' ? 'Đã ký số' : 'Chưa ký số';
            let sendStatusText = 'Chưa gửi';
            if (doc.send_status === 'Success') sendStatusText = 'Thành công';
            else if (doc.send_status === 'Pending') sendStatusText = 'Đang gửi';
            else if (doc.send_status === 'Error') sendStatusText = 'Lỗi';

            return [
                idx + 1,
                doc.doc_no || '',
                doc.patient_id || '',
                doc.patient_name || '',
                doc.cccd || '',
                doc.dob ? formatDate(doc.dob) : '',
                doc.gender || 'Nam',
                getFormName(doc.form_type),
                sigStatusText,
                doc.signature_type || '',
                sendStatusText,
                doc.created_at ? formatDateTime(doc.created_at) : '',
                doc.sent_at ? formatDateTime(doc.sent_at) : '',
                doc.transaction_id || '',
                doc.error_message || ''
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

        const aoaData = [
            ['HỆ THỐNG QUẢN LÝ PHÒNG KHÁM VCLINIC'],
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
            { wch: 20 },  // Mã đợt khám
            { wch: 15 },  // Mã bệnh nhân
            { wch: 25 },  // Họ và tên
            { wch: 18 },  // Số CCCD
            { wch: 14 },  // Ngày sinh
            { wch: 10 },  // Giới tính
            { wch: 30 },  // Loại mẫu biểu
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
        toast.success("Xuất file Excel thành công!");
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

            return matchesSearch && matchesSign && matchesSend && matchesDate && matchesForm;
        });
    }, [documents, searchTerm, formFilter, signFilter, sendFilter, startDate, endDate]);

    const getFormName = (type: string) => {
        const names: Record<string, string> = {
            '1': 'Mẫu 1: Trẻ em 6T - dưới 18T',
            '2': 'Mẫu 2: Người lớn >= 18T',
            '3': 'Mẫu 3: Khám sức khỏe lái xe',
            '4': 'Mẫu 4: Nhân viên đường sắt',
            '5': 'Mẫu 5: Thuyền viên tàu biển',
            '6': 'Mẫu 6: Trẻ em 0 - dưới 2 tháng',
            '7': 'Mẫu 7: Trẻ em 2 - 3 tháng',
            '8': 'Mẫu 8: Trẻ em 4 - 6 tháng',
            '9': 'Mẫu 9: Trẻ em 7 - 9 tháng',
            '10': 'Mẫu 10: Trẻ em 10 - 12 tháng',
            '11': 'Mẫu 11: Trẻ em 13 - 18 tháng',
            '12': 'Mẫu 12: Trẻ em 19 - 24 tháng',
            '13': 'Mẫu 13: Trẻ em 2 - dưới 6 tuổi',
            '14': 'Mẫu 14: Học sinh 3M - dưới 6T',
            '15': 'Mẫu 15: Học sinh cấp 1',
            '16': 'Mẫu 16: Học sinh cấp 2',
            '17': 'Mẫu 17: Học sinh cấp 3'
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
        return <PrintForm document={activeDocument} onClose={() => setViewMode('LIST')} />;
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header - hidden during CREATE/EDIT to maximize form space */}
            {viewMode === 'LIST' && (
                <div className="bg-[#0f766e] text-white p-4 rounded-xl shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-white/10 rounded-lg">
                            <PaperAirplaneIcon className="w-6 h-6 text-white -rotate-45" />
                        </span>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">
                                Quản lý Liên thông Khám sức khỏe
                            </h1>
                            <p className="text-emerald-100/70 text-xs">Đồng bộ dữ liệu KSK lên Cổng VNeID theo QĐ 1551/QĐ-BYT</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                        {stepParam !== 'settings' && (
                            <button 
                                onClick={handleOpenSeedModal}
                                disabled={isLoading || isSending || isSigning || isSeeding}
                                className="px-4 py-2 bg-transparent hover:bg-white/10 text-white border border-white/30 hover:border-white/50 rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all text-xs active:scale-95 cursor-pointer"
                            >
                                {isSeeding ? <RefreshIcon className="w-3.5 h-3.5 animate-spin"/> : <RefreshIcon className="w-3.5 h-3.5"/>}
                                Lấy dữ liệu mới từ HIS
                            </button>
                        )}

                        <button
                            onClick={() => {
                                if (stepParam === 'settings') {
                                    setSearchParams({ step: 'manage' });
                                } else {
                                    setSearchParams({ step: 'settings' });
                                }
                            }}
                            className="px-4 py-2 bg-white hover:bg-emerald-50 text-[#0f766e] rounded-lg font-bold shadow-sm flex items-center justify-center gap-2 transition-all text-xs active:scale-95 cursor-pointer"
                        >
                            <AdjustmentsHorizontalIcon className="w-3.5 h-3.5" />
                            {stepParam === 'settings' ? 'Về danh sách' : 'Cấu hình cổng'}
                        </button>
                    </div>
                </div>
            )}

            {viewMode === 'LIST' ? (
                <>
                    {/* Dashboard */}
                    {stepParam === 'dashboard' && (
                        <Dashboard documents={documents} />
                    )}

                    {/* Filter toolbar and Table only shown on non-dashboard workflow steps */}
                    {stepParam !== 'dashboard' && stepParam !== 'settings' && (
                        <>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                                    {/* Từ ngày */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Từ ngày</label>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                placeholder="dd/mm/yyyy"
                                                value={getFilterDateDisplay(startDate)}
                                                onChange={e => handleFilterDateChange(e.target.value, setStartDate)}
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Đến ngày */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Đến ngày</label>
                                        <div className="relative">
                                            <input 
                                                type="text"
                                                placeholder="dd/mm/yyyy"
                                                value={getFilterDateDisplay(endDate)}
                                                onChange={e => handleFilterDateChange(e.target.value, setEndDate)}
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Loại danh mục (formFilter) */}
                                    <div className="space-y-1">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Loại danh mục</label>
                                        <select 
                                            value={formFilter}
                                            onChange={e => setFormFilter(e.target.value)}
                                            className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer ${fontSettings.controls}`}
                                        >
                                            <option value="All">Tất cả biểu mẫu</option>
                                            <optgroup label="Theo Nhóm Phổ Biến">
                                                <option value="2">Mẫu 2: Người lớn (&gt;= 18T)</option>
                                                <option value="3">Mẫu 3: KSK Lái xe</option>
                                            </optgroup>
                                            <optgroup label="Theo Nhóm Đối Tượng">
                                                <option value="group_children">Nhóm: Trẻ em (Mẫu 6-13)</option>
                                                <option value="group_students">Nhóm: Học sinh (Mẫu 1, 14-17)</option>
                                                <option value="group_industry">Nhóm: Đặc thù ngành (Mẫu 4-5)</option>
                                            </optgroup>
                                            <optgroup label="Chi tiết 17 mẫu">
                                                {Array.from({ length: 17 }, (_, i) => (
                                                    <option key={i+1} value={(i+1).toString()}>Mẫu {i+1}: {getFormName((i+1).toString()).substring(getFormName((i+1).toString()).indexOf(':') + 1).trim()}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>

                                    {/* Trạng thái gửi (sendFilter) */}
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

                                    {/* Từ khóa tìm kiếm */}
                                    <div className="space-y-1 relative">
                                        <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">Từ khóa tìm kiếm</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <input 
                                                    type="text" 
                                                    placeholder="Tên BN, số hồ sơ hoặc thẻ BHYT..." 
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

                                    {/* Switch Hiện debug */}
                                    <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" defaultChecked />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-teal-600"></div>
                                        </label>
                                        <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                                            🐞 Hiện debug
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

                                    <button 
                                        onClick={handleSendDocuments}
                                        disabled={selectedIds.size === 0 || isLoading || isSending || isSigning}
                                        className="px-4 py-2 bg-[#55b1a3] hover:bg-[#43a294] text-white rounded-lg font-bold flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95 text-xs cursor-pointer shadow-sm"
                                    >
                                        <CloudUploadIcon className="w-4 h-4"/>
                                        Gửi liên thông mục đã chọn ({selectedIds.size})
                                    </button>

                                    <button 
                                        onClick={handleExportExcel}
                                        disabled={isLoading || filteredDocuments.length === 0}
                                        className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
                                        title="Xuất danh sách hiện tại ra file Excel"
                                    >
                                        <DocumentArrowDownIcon className="w-4 h-4"/>
                                        Xuất Excel
                                    </button>
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
                                        setViewMode('PRINT');
                                    }}
                                    getFormName={getFormName}
                                    getFormColor={getFormColor}
                                />
                            ) : stepParam === 'sync' ? (
                                <SyncDataList
                                    documents={filteredDocuments}
                                    selectedIds={selectedIds}
                                    onToggleSelect={handleToggleSelect}
                                    onSelectAll={handleSelectAll}
                                    onViewXml={(doc) => setActiveXmlDoc(doc)}
                                    onPrint={(doc) => {
                                        setActiveDocument(doc);
                                        setViewMode('PRINT');
                                    }}
                                    onSend={handleSendSingleDocument}
                                    getFormName={getFormName}
                                    getFormColor={getFormColor}
                                    onSeed={handleOpenSeedModal}
                                />
                            ) : (
                                <DocumentList
                                    documents={filteredDocuments}
                                    selectedIds={selectedIds}
                                    onToggleSelect={handleToggleSelect}
                                    onSelectAll={handleSelectAll}
                                    onEdit={(doc) => {
                                        setActiveDocument(doc);
                                        setViewMode('EDIT');
                                    }}
                                    onDelete={handleDeleteDoc}
                                    onViewXml={(doc) => setActiveXmlDoc(doc)}
                                    onPrint={(doc) => {
                                        setActiveDocument(doc);
                                        setViewMode('PRINT');
                                    }}
                                    onSend={handleSendSingleDocument}
                                    getFormName={getFormName}
                                    getFormColor={getFormColor}
                                    onSeed={handleOpenSeedModal}
                                />
                            )}
                        </>
                    )}

                    {stepParam === 'settings' && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom duration-200">
                            <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <AdjustmentsHorizontalIcon className="w-6 h-6 text-[#0f766e]"/> Cấu hình liên thông cổng VNeID
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Thiết lập các tham số kết nối, mã cơ sở y tế và đồng bộ tự động lên cổng sức khỏe điện tử VNeID.
                                </p>
                            </div>

                            {isSettingsLoading ? (
                                <div className="py-10 text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                                    <RefreshIcon className="w-10 h-10 animate-spin text-teal-500 mb-2"/>
                                    Đang tải cấu hình thiết lập...
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">URL Cổng liên thông (Sandbox / Production)</label>
                                        <input
                                            type="text"
                                            value={vneidUrl}
                                            onChange={e => setVneidUrl(e.target.value)}
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500"
                                            placeholder="https://api-vneid.moh.gov.vn/api/v1"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tài khoản Cổng VNeID</label>
                                        <input
                                            type="text"
                                            value={vneidUsername}
                                            onChange={e => setVneidUsername(e.target.value)}
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500"
                                            placeholder="Nhập tên tài khoản..."
                                        />
                                    </div>

                                    <div className="space-y-1 relative">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mật khẩu Cổng VNeID</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={vneidPassword}
                                                onChange={e => setVneidPassword(e.target.value)}
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500 pr-10"
                                                placeholder="Nhập mật khẩu..."
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? "Ẩn" : "Hiện"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mã cơ sở KCB (MA_CSKCB - 5 ký tự)</label>
                                        <input
                                            type="text"
                                            maxLength={5}
                                            value={maCskcb}
                                            onChange={e => setMaCskcb(e.target.value)}
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500"
                                            placeholder="15124"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Mã GLN Cơ sở (MA_GTIN_CSKCB - 13 ký tự)</label>
                                        <input
                                            type="text"
                                            maxLength={13}
                                            value={maGtinCskcb}
                                            onChange={e => setMaGtinCskcb(e.target.value)}
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-teal-500"
                                            placeholder="1234567890123"
                                        />
                                    </div>

                                    <div className="md:col-span-2 border-t border-slate-100 dark:border-slate-700 pt-4 mt-2 space-y-4">
                                        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-700/30 p-3.5 rounded-lg border border-slate-200/50 dark:border-slate-700">
                                            <div>
                                                <div className="text-sm font-bold text-slate-800 dark:text-white">Tự động đồng bộ liên thông</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400">Đẩy dữ liệu hồ sơ đã được ký số đầy đủ lên cổng một cách tự động.</div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={autoSyncEnabled}
                                                    onChange={e => setAutoSyncEnabled(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-teal-300 dark:peer-focus:ring-teal-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#0f766e]"></div>
                                            </label>
                                        </div>

                                        {autoSyncEnabled && (
                                            <div className="flex items-center gap-3 p-3 bg-teal-50/50 dark:bg-teal-900/10 rounded-lg border border-teal-100 dark:border-teal-900/30">
                                                <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">Tần suất đồng bộ tự động:</span>
                                                <select
                                                    value={autoSyncInterval}
                                                    onChange={e => setAutoSyncInterval(parseInt(e.target.value))}
                                                    className="p-1.5 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm"
                                                >
                                                    <option value={5}>Mỗi 5 phút</option>
                                                    <option value={15}>Mỗi 15 phút</option>
                                                    <option value={30}>Mỗi 30 phút</option>
                                                    <option value={60}>Mỗi 1 giờ</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:col-span-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-700 pt-4">
                                        <button
                                            type="button"
                                            disabled={isTestingSettings || isSavingSettings}
                                            onClick={handleTestConnection}
                                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-bold text-sm transition disabled:opacity-50"
                                        >
                                            {isTestingSettings ? "Đang ping..." : "Kiểm tra kết nối"}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isTestingSettings || isSavingSettings}
                                            onClick={handleSaveSettings}
                                            className="px-5 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-lg font-bold text-sm shadow-md transition disabled:opacity-50"
                                        >
                                            {isSavingSettings ? "Đang lưu..." : "Lưu cấu hình"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <DynamicForm 
                    formType={viewMode === 'EDIT' ? activeDocument?.form_type : createFormType}
                    initialData={viewMode === 'EDIT' ? activeDocument : undefined}
                    onSave={handleSaveDocument}
                    onCancel={handleCancelForm}
                    onChangeFormType={setCreateFormType}
                />
            )}

            {/* XML Preview Modal */}
            {activeXmlDoc && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/80 rounded-t-xl">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">XML Preview: {activeXmlDoc.patient_name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{getFormName(activeXmlDoc.form_type)} - Số: {activeXmlDoc.doc_no}</p>
                            </div>
                            <button 
                                onClick={() => setActiveXmlDoc(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        {/* Modal Content */}
                        <div className="p-4 flex-1 overflow-auto bg-slate-950 text-slate-200 font-mono text-xs border border-slate-800 flex flex-col">
                            <div className="text-teal-400 font-bold mb-2">// RAW XML BODY //</div>
                            <pre className="whitespace-pre-wrap flex-1">{activeXmlDoc.xml_data}</pre>
                            {activeXmlDoc.signature && (
                                <div className="mt-4 pt-4 border-t border-slate-800">
                                    <div className="text-green-400 font-bold mb-1">// DIGITAL SIGNATURE VALUE ({activeXmlDoc.signature_type}) //</div>
                                    <div className="text-slate-500 break-all">{activeXmlDoc.signature}</div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* HIS Seeding Filter Modal */}
            {isSeedModalOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md flex flex-col border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
                        {/* Modal Header */}
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/80 rounded-t-xl">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 font-sans">
                                    <RefreshIcon className="w-5 h-5 text-emerald-600"/> Đồng bộ dữ liệu khám từ HIS
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5 font-sans">Chọn điều kiện lọc để đồng bộ danh sách khám</p>
                            </div>
                            <button 
                                onClick={() => setIsSeedModalOpen(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>
                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            {/* Date filters */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 font-sans">Thời gian khám (Từ ngày)</label>
                                <FormDateInput
                                    label=""
                                    value={seedStartDate}
                                    onChange={e => setSeedStartDate(e.target.value)}
                                    placeholder="dd/mm/yyyy"
                                    className="w-full !p-2.5 !h-auto border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 font-sans">Thời gian khám (Đến ngày)</label>
                                <FormDateInput
                                    label=""
                                    value={seedEndDate}
                                    onChange={e => setSeedEndDate(e.target.value)}
                                    placeholder="dd/mm/yyyy"
                                    className="w-full !p-2.5 !h-auto border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white"
                                />
                            </div>

                            {/* Workplace filter */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 font-sans">Nơi làm việc / Công ty</label>
                                <select
                                    value={seedWorkplaceId}
                                    onChange={e => setSeedWorkplaceId(e.target.value)}
                                    className={`w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500 focus:outline-none cursor-pointer ${fontSettings.controls}`}
                                >
                                    <option value="">-- Tất cả công ty --</option>
                                    {workplaces.map(w => (
                                        <option key={w.id} value={w.code}>{w.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 rounded-b-xl border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsSeedModalOpen(false)}
                                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg font-bold text-xs transition font-sans"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="button"
                                disabled={isSeeding}
                                onClick={() => {
                                    handleSeedFromHis({
                                        startDate: seedStartDate,
                                        endDate: seedEndDate,
                                        workplaceId: seedWorkplaceId
                                    });
                                }}
                                className="px-5 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-lg font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50 font-sans active:scale-95 cursor-pointer"
                            >
                                {isSeeding && <RefreshIcon className="w-3.5 h-3.5 animate-spin"/>}
                                Đồng bộ ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HealthCheckSyncView;
