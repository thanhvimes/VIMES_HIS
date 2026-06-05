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
    AdjustmentsHorizontalIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { healthCheckService } from '../../../services/healthCheckService';

// Import Modular Components
import Dashboard from '../components/Dashboard';
import DocumentList from '../components/DocumentList';
import DynamicForm from '../forms/DynamicForm';
import PrintForm from '../forms/PrintForm';

type ViewMode = 'LIST' | 'CREATE' | 'EDIT' | 'PRINT';

const HealthCheckSyncView: React.FC = () => {
    const { fontSettings } = useTheme();
    const [documents, setDocuments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const [isSigning, setIsSigning] = useState(false);
    
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
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
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
            alert("Đã lưu cấu hình liên thông thành công!");
        } catch (error: any) {
            alert("Lỗi khi lưu cấu hình: " + error.message);
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
            alert(res.message || "Kết nối thành công!");
        } catch (error: any) {
            alert("Kết nối thất bại: " + error.message);
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

        // Reset dates
        setStartDate('');
        setEndDate('');

        if (stepParam === 'settings') {
            loadSettings();
        } else {
            loadData();
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
                alert("Tạo hồ sơ KSK thành công!");
            } else if (viewMode === 'EDIT' && activeDocument) {
                await healthCheckService.updateDocument(activeDocument.id, payload);
                alert("Cập nhật hồ sơ KSK thành công!");
            }
            await loadData();
            setSearchParams({ step: 'pending-sign' }); // Redirect to pending sign
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelForm = () => {
        setSearchParams({ step: 'pending-sign' });
    };

    const handleDeleteDoc = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa hồ sơ khám sức khỏe này?")) return;
        setIsLoading(true);
        try {
            await healthCheckService.deleteDocument(id);
            alert("Đã xóa hồ sơ thành công!");
            await loadData();
        } catch (error: any) {
            alert(error.message);
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
            alert("Vui lòng chọn ít nhất một hồ sơ để gửi.");
            return;
        }

        const unsignedDocs = documents.filter(d => selectedIds.has(d.id.toString()) && d.signature_status === 'Unsigned');
        if (unsignedDocs.length > 0) {
            alert(`Có ${unsignedDocs.length} hồ sơ chưa được ký số. Bạn phải thực hiện ký số trước khi gửi cổng y tế.`);
            return;
        }

        setIsSending(true);
        try {
            const idsToSend = Array.from(selectedIds) as string[];
            const failedIds = await healthCheckService.sendDocumentsToPortal(idsToSend);
            await loadData();
            
            if (failedIds.length > 0) {
                alert(`Đã gửi hoàn tất. Có ${failedIds.length} hồ sơ bị lỗi.`);
            } else {
                alert(`Liên thông thành công ${idsToSend.length} hồ sơ khám sức khỏe lên cổng VNeID.`);
                setSearchParams({ step: 'history' }); // Redirect to history
            }
            
            setSelectedIds(new Set());
        } catch (error) {
            console.error("Error sending documents", error);
            alert("Có lỗi xảy ra trong quá trình đồng bộ.");
        } finally {
            setIsSending(false);
        }
    };

    const handleSignDocuments = async () => {
        if (selectedIds.size === 0) return alert("Vui lòng chọn hồ sơ để ký.");
        
        const idsToSign = Array.from(selectedIds) as string[];
        
        if (signatureTypeSelect === 'USB') {
            const confirmSign = confirm(`Bạn đang thực hiện ký số máy trạm cho ${idsToSign.length} hồ sơ sử dụng thiết bị USB Token. Hãy đảm bảo khóa cứng đã cắm vào máy tính.\nTiếp tục?`);
            if (!confirmSign) return;
            
            setIsSigning(true);
            try {
                await new Promise(resolve => setTimeout(resolve, 1500));
                await healthCheckService.signDocuments(idsToSign, 'USB');
                await loadData();
                alert("Đã hoàn tất ký số bằng USB Token cá nhân.");
                setSelectedIds(new Set());
                setSearchParams({ step: 'pending-send' }); // Redirect to pending send
            } catch (error: any) {
                alert("Lỗi ký số USB Token: " + error.message);
            } finally {
                setIsSigning(false);
            }
        } else {
            const confirmSign = confirm(`Bạn đang thực hiện ký số tập trung bằng HSM Server (Cloud CA) cho ${idsToSign.length} hồ sơ.\nTiếp tục?`);
            if (!confirmSign) return;
            
            setIsSigning(true);
            try {
                await healthCheckService.signDocuments(idsToSign, 'HSM');
                await loadData();
                alert("Đã ký số thành công bằng HSM Server.");
                setSelectedIds(new Set());
                setSearchParams({ step: 'pending-send' }); // Redirect to pending send
            } catch (error: any) {
                alert("Lỗi ký số HSM: " + error.message);
            } finally {
                setIsSigning(false);
            }
        }
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
            if (startDate) {
                const docDate = new Date(doc.created_at);
                const start = new Date(startDate + 'T00:00:00');
                matchesDate = matchesDate && docDate >= start;
            }
            if (endDate) {
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
        if (num === 2) return 'text-blue-600 bg-blue-50 border-blue-200';
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
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col lg:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <PaperAirplaneIcon className="w-8 h-8 text-blue-600 -rotate-45 mt-1"/> Liên thông Khám sức khỏe (VNeID)
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Đồng bộ 17 mẫu biểu dữ liệu KSK định kỳ và sàng lọc lên ứng dụng VNeID theo QĐ 1551/QĐ-BYT.</p>
                </div>
                
                {viewMode === 'LIST' && (
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto justify-end">
                        
                        {stepParam === 'pending-sign' && (
                            <>
                                <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setSignatureTypeSelect('USB')}
                                        className={`px-3 py-2 text-xs font-bold transition ${signatureTypeSelect === 'USB' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        USB Token
                                    </button>
                                    <button
                                        onClick={() => setSignatureTypeSelect('HSM')}
                                        className={`px-3 py-2 text-xs font-bold transition ${signatureTypeSelect === 'HSM' ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        HSM Cloud
                                    </button>
                                </div>

                                <button 
                                    onClick={handleSignDocuments}
                                    disabled={selectedIds.size === 0 || isLoading || isSending || isSigning}
                                    className="px-4 py-2 bg-white border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition"
                                >
                                    {isSigning ? <RefreshIcon className="w-5 h-5 animate-spin"/> : <SignatureIcon className="w-5 h-5 text-blue-600"/>}
                                    Ký số ({signatureTypeSelect})
                                </button>
                            </>
                        )}
                        
                        {stepParam === 'pending-send' && (
                            <button 
                                onClick={handleSendDocuments}
                                disabled={selectedIds.size === 0 || isLoading || isSending || isSigning}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-transform active:scale-95"
                            >
                                {isSending ? <RefreshIcon className="w-5 h-5 animate-spin"/> : <CloudUploadIcon className="w-5 h-5"/>}
                                Đẩy cổng VNeID
                            </button>
                        )}
                    </div>
                )}
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
                            <div className="flex flex-col lg:flex-row gap-3 bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div className="relative flex-1">
                                    <SearchIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400"/>
                                    <input 
                                        type="text" 
                                        placeholder="Tìm tên bệnh nhân, CCCD, mã hồ sơ KSK..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 ${fontSettings.controls}`}
                                    />
                                </div>
                                
                                <div className="flex flex-wrap gap-2 items-center overflow-x-auto pb-1 no-scrollbar">
                                    {/* Date range filters */}
                                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-sm">
                                        <span className="text-slate-500 dark:text-slate-400 text-xs">Từ:</span>
                                        <input 
                                            type="date"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                            className="bg-transparent border-0 p-0 text-xs focus:ring-0 text-slate-700 dark:text-slate-200 focus:outline-none"
                                        />
                                        <span className="text-slate-400 font-light">|</span>
                                        <span className="text-slate-500 dark:text-slate-400 text-xs">Đến:</span>
                                        <input 
                                            type="date"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                            className="bg-transparent border-0 p-0 text-xs focus:ring-0 text-slate-700 dark:text-slate-200 focus:outline-none"
                                        />
                                        {(startDate || endDate) && (
                                            <button 
                                                onClick={() => { setStartDate(''); setEndDate(''); }}
                                                className="text-slate-400 hover:text-red-500 text-xs ml-1 font-bold"
                                                title="Xóa bộ lọc ngày"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>

                                    {/* Signature filter */}
                                    <select 
                                        value={signFilter}
                                        onChange={e => setSignFilter(e.target.value)}
                                        className={`p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer ${fontSettings.controls}`}
                                    >
                                        <option value="All">Tất cả ký số</option>
                                        <option value="Signed">Đã ký số</option>
                                        <option value="Unsigned">Chưa ký số</option>
                                    </select>

                                    {/* Send status filter */}
                                    <select 
                                        value={sendFilter}
                                        onChange={e => setSendFilter(e.target.value)}
                                        className={`p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer ${fontSettings.controls}`}
                                    >
                                        <option value="All">Tất cả gửi cổng</option>
                                        <option value="Success">Gửi thành công</option>
                                        <option value="Unsent">Chưa gửi</option>
                                        <option value="Pending">Đang gửi</option>
                                        <option value="Error">Lỗi</option>
                                    </select>
 
                                    <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
 
                                    <select 
                                        value={formFilter}
                                        onChange={e => setFormFilter(e.target.value)}
                                        className={`p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer min-w-[150px] ${fontSettings.controls}`}
                                    >
                                        <option value="All">Tất cả 17 mẫu biểu KSK</option>
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
                            </div>
 
                            {/* Document List Table */}
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
                                getFormName={getFormName}
                                getFormColor={getFormColor}
                            />
                        </>
                    )}

                    {stepParam === 'settings' && (
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom duration-200">
                            <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <AdjustmentsHorizontalIcon className="w-6 h-6 text-blue-600"/> Cấu hình liên thông cổng VNeID
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    Thiết lập các tham số kết nối, mã cơ sở y tế và đồng bộ tự động lên cổng sức khỏe điện tử VNeID.
                                </p>
                            </div>

                            {isSettingsLoading ? (
                                <div className="py-10 text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                                    <RefreshIcon className="w-10 h-10 animate-spin text-blue-500 mb-2"/>
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
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500"
                                            placeholder="https://api-vneid.moh.gov.vn/api/v1"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Tài khoản Cổng VNeID</label>
                                        <input
                                            type="text"
                                            value={vneidUsername}
                                            onChange={e => setVneidUsername(e.target.value)}
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500"
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
                                                className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500 pr-10"
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
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500"
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
                                            className="w-full p-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm focus:ring-2 focus:ring-blue-500"
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
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        {autoSyncEnabled && (
                                            <div className="flex items-center gap-3 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30">
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
                                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-md transition disabled:opacity-50"
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
                            <div className="text-blue-400 font-bold mb-2">// RAW XML BODY //</div>
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
        </div>
    );
};

export default HealthCheckSyncView;
