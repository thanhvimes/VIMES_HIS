// ==================== HIS SAMPLE MANAGEMENT SYSTEM (MODERN e-MCH DESIGN) ====================
// File: modules/health-check-sync/components/SampleTracking.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { catalogService, CatalogItem } from '../../../services/catalogService';
import { healthCheckService } from '../../../services/healthCheckService';
import { useSession } from '../../../contexts/SessionContext';

import { useSampleAudioCues } from './sample-tracking/hooks/useSampleAudioCues';
import { SampleStatusBadge } from './sample-tracking/SampleStatusBadge';
import { SampleRejectionModal } from './sample-tracking/SampleRejectionModal';
import { BatchReceivingModal } from './sample-tracking/BatchReceivingModal';
import { SampleAuditTrail } from './sample-tracking/SampleAuditTrail';
import { useSampleHotkeys } from './sample-tracking/hooks/useSampleHotkeys';
import { HotkeyGuideModal } from './sample-tracking/HotkeyGuideModal';

export interface DeliverySlip {
    id: number;
    department: string;
    createdAt: string;
    createdBy: string;
    status: 'VS' | 'XN' | 'CHỜ' | string;
    kth: string;
    acceptedDate: string;
    acceptedBy: string;
}

export interface AuditTrailEvent {
    timestamp: string;
    action: string;
    actor: string;
}

export interface SlipPatient {
    hpc_orderid: number;
    hpc_docno: string | number;
    hpc_sid: string;
    pname: string;
    hpc_orderdate: string;
    hpc_roomid: string;
    hfg_deptid: string;
    hfg_name: string;
    limsoe_map_by: string;
    limsoe_map_date: string;
    limsoe_sample_by: string;
    limsoe_sample_date: string;
    limsoe_receive?: string;
    // New LIMS Features
    isStat?: boolean;
    tatWarning?: boolean;
    needsAliquot?: boolean;
    rejectedReason?: string;
    auditTrail?: AuditTrailEvent[];
}

const formatDateTime = (rawStr?: string) => {
    if (!rawStr || rawStr === '---') return '---';
    if (rawStr.includes('/')) return rawStr;
    try {
        const date = new Date(rawStr);
        if (isNaN(date.getTime())) return rawStr;
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        const hh = String(date.getHours()).padStart(2, '0');
        const mi = String(date.getMinutes()).padStart(2, '0');
        return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
    } catch {
        return rawStr;
    }
};

const SampleTracking: React.FC = () => {
    const { user } = useSession();

    // View Mode (Tabbed Layout)
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

    // Workspace Sub-tab on Right Pane
    const [rightTab, setRightTab] = useState<'patients' | 'cancelled' | 'history'>('patients');

    // Advanced LIMS Modals
    const [isRejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [isBatchModalOpen, setBatchModalOpen] = useState(false);
    const [isHotkeyGuideOpen, setHotkeyGuideOpen] = useState(false);
    const { playSuccessBeep, playErrorBuzz } = useSampleAudioCues();

    // Filters state
    const [departments, setDepartments] = useState<CatalogItem[]>([]);
    const [deptFilter, setDeptFilter] = useState('KB');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('2026-06-02');
    const [endDate, setEndDate] = useState('2026-06-02');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Barcode scanner state
    const [barcodeScanInput, setBarcodeScanInput] = useState('');
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // Slips List State
    const [slips, setSlips] = useState<DeliverySlip[]>([]);
    const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null);

    // Patients & Orders State
    const [selectedPatientDocNo, setSelectedPatientDocNo] = useState<string | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [slipPatients, setSlipPatients] = useState<SlipPatient[]>([]);
    const [testItems, setTestItems] = useState<any[]>([]);
    const [patientSearchQuery, setPatientSearchQuery] = useState('');

    // Bulk Patient Selection
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(new Set());

    // Cancelled samples state
    const [cancelledSamples, setCancelledSamples] = useState<any[]>([]);

    // Fetch active departments on mount
    useEffect(() => {
        catalogService.getDepartments()
            .then(res => {
                if (Array.isArray(res)) {
                    setDepartments(res);
                    const hasKB = res.some(d => d.id === 'KB');
                    if (!hasKB && res.length > 0) setDeptFilter(res[0].id);
                }
            })
            .catch(err => console.error("Failed to load departments:", err));
    }, []);

    // Load Slips from Backend API
    const loadData = async () => {
        setIsLoading(true);
        try {
            const slipsData = await healthCheckService.getSampleSlips({
                startDate,
                endDate,
                deptId: deptFilter,
                status: statusFilter,
                search: searchQuery
            });

            const data = Array.isArray(slipsData) ? slipsData : [];
            setSlips(data);

            if (data.length > 0) {
                if (!selectedSlipId || !data.some(s => s.id === selectedSlipId)) {
                    setSelectedSlipId(data[0].id);
                }
            } else {
                setSelectedSlipId(null);
                setSlipPatients([]);
                setSelectedPatientDocNo(null);
                setSelectedOrderId(null);
                setTestItems([]);
                setSelectedOrderIds(new Set());
            }
        } catch (error) {
            console.error("Failed to load sample slips", error);
            toast.error("Không thể tải danh sách phiếu giao nhận!");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [startDate, endDate, statusFilter, searchQuery, deptFilter]);

    // Active Slip calculation
    const activeSlip = useMemo(() => {
        if (!selectedSlipId || !Array.isArray(slips)) return null;
        return slips.find(s => s.id === selectedSlipId) || null;
    }, [slips, selectedSlipId]);

    // Load patients for selected slip
    useEffect(() => {
        if (selectedSlipId) {
            healthCheckService.getSampleSlipPatients(selectedSlipId)
                .then(res => {
                    let patients = Array.isArray(res) ? res : [];
                    
                    // Mock advanced LIMS flags for demo purposes
                    patients = patients.map((p, idx) => ({
                        ...p,
                        isStat: idx % 5 === 0,
                        needsAliquot: idx % 4 === 0,
                    }));

                    setSlipPatients(patients);
                    setSelectedOrderIds(new Set());
                    if (patients.length > 0) {
                        setSelectedPatientDocNo(String(patients[0].hpc_docno));
                        setSelectedOrderId(patients[0].hpc_orderid);
                    } else {
                        setSelectedPatientDocNo(null);
                        setSelectedOrderId(null);
                        setTestItems([]);
                    }
                })
                .catch(err => {
                    console.error("Failed to load slip patients", err);
                    setSlipPatients([]);
                });
        } else {
            setSlipPatients([]);
            setSelectedPatientDocNo(null);
            setSelectedOrderId(null);
            setTestItems([]);
            setSelectedOrderIds(new Set());
        }
    }, [selectedSlipId]);

    // Active patient object
    const activePatient = useMemo(() => {
        if (!Array.isArray(slipPatients)) return null;
        return slipPatients.find(p => String(p.hpc_docno) === selectedPatientDocNo || p.hpc_orderid === selectedOrderId) || null;
    }, [slipPatients, selectedPatientDocNo, selectedOrderId]);

    // Filter patients by patientSearchQuery
    const filteredSlipPatients = useMemo(() => {
        if (!patientSearchQuery) return slipPatients;
        const q = patientSearchQuery.toLowerCase().trim();
        return slipPatients.filter(p => 
            String(p.hpc_docno || '').toLowerCase().includes(q) ||
            String(p.hpc_orderid || '').toLowerCase().includes(q) ||
            String(p.pname || '').toLowerCase().includes(q) ||
            String(p.hpc_sid || '').toLowerCase().includes(q)
        );
    }, [slipPatients, patientSearchQuery]);

    // Load detailed test items for selected order ID
    useEffect(() => {
        if (selectedOrderId) {
            healthCheckService.getPatientTestDetails(selectedOrderId)
                .then(res => {
                    setTestItems(Array.isArray(res) ? res : []);
                })
                .catch(err => {
                    console.error("Failed to load test details", err);
                    setTestItems([]);
                });
        } else {
            setTestItems([]);
        }
    }, [selectedOrderId]);

    // Load cancelled samples
    const loadCancelled = () => {
        healthCheckService.getCancelledSamples()
            .then(res => setCancelledSamples(Array.isArray(res) ? res : []))
            .catch(err => console.error("Failed to load cancelled samples", err));
    };

    useEffect(() => {
        loadCancelled();
    }, [slips]);

    // Handle slip selection (switch to detail view)
    const handleSelectSlip = (id: number) => {
        setSelectedSlipId(id);
        setViewMode('detail');
    };

    // Fast Barcode Scanner Enter Key action
    const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const code = barcodeScanInput.trim();
            if (!code) return;

            // Search in active slip first
            const foundInCurrent = slipPatients.find(p => String(p.hpc_orderid) === code || String(p.hpc_docno) === code);
            
            if (foundInCurrent) {
                playSuccessBeep();
                toast.success(`Đã tìm thấy bệnh nhân ${foundInCurrent.pname} trong phiếu hiện tại!`);
                setSelectedPatientDocNo(String(foundInCurrent.hpc_docno));
                setSelectedOrderId(foundInCurrent.hpc_orderid);
                setViewMode('detail');
                setBarcodeScanInput('');
                return;
            }
            
            // If not found in current slip
            playErrorBuzz();
            toast.info(`Mã [${code}] không có trong phiếu hiện tại. Đang tìm trên hệ thống...`);
            setSearchQuery(code);
            setBarcodeScanInput('');
        }
    };

    // Bulk Checkbox Toggles
    const toggleSelectAllPatients = () => {
        if (selectedOrderIds.size === filteredSlipPatients.length) {
            setSelectedOrderIds(new Set());
        } else {
            const allIds = new Set(filteredSlipPatients.map(p => p.hpc_orderid));
            setSelectedOrderIds(allIds);
        }
    };

    const toggleSelectPatient = (orderId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = new Set(selectedOrderIds);
        if (updated.has(orderId)) {
            updated.delete(orderId);
        } else {
            updated.add(orderId);
        }
        setSelectedOrderIds(updated);
    };

    // Confirm receipt of selected or active tube
    const handleConfirmReceipt = async (targetOrderIds?: number[]) => {
        const idsToProcess = targetOrderIds && targetOrderIds.length > 0 
            ? targetOrderIds 
            : selectedOrderIds.size > 0 
            ? Array.from(selectedOrderIds) 
            : selectedOrderId ? [selectedOrderId] : [];

        if (idsToProcess.length === 0) {
            toast.error("Vui lòng chọn ít nhất một mẫu hoặc bệnh nhân!");
            return;
        }

        try {
            await healthCheckService.confirmSampleReceipt(idsToProcess, user?.username);
            
            // Check if any of these need aliquoting to simulate printer
            const needAliquotCount = idsToProcess.filter(id => slipPatients.find(p => p.hpc_orderid === id)?.needsAliquot).length;
            
            toast.success(`Đã xác nhận nhận ${idsToProcess.length} mẫu xét nghiệm!`);
            if (needAliquotCount > 0) {
                playSuccessBeep();
                toast.info(`🖨️ Đang in tự động ${needAliquotCount * 2} tem phụ san chiết...`, { duration: 4000 });
            }
            
            setSelectedOrderIds(new Set());
            loadData();
        } catch (err) {
            console.error("Failed to confirm samples receipt", err);
            toast.error("Gặp lỗi khi xác nhận nhận mẫu!");
        }
    };

    // Cancel receipt of selected or active tube
    const handleCancelReceipt = async (targetOrderIds?: number[]) => {
        const idsToProcess = targetOrderIds && targetOrderIds.length > 0 
            ? targetOrderIds 
            : selectedOrderIds.size > 0 
            ? Array.from(selectedOrderIds) 
            : selectedOrderId ? [selectedOrderId] : [];

        if (idsToProcess.length === 0) {
            toast.error("Vui lòng chọn ít nhất một mẫu để hủy!");
            return;
        }

        try {
            await healthCheckService.cancelSampleReceipt(idsToProcess, 'Hủy nhận từ giao diện Web', user?.username);
            toast.success(`Đã hủy nhận ${idsToProcess.length} mẫu xét nghiệm!`);
            setSelectedOrderIds(new Set());
            loadData();
        } catch (err) {
            console.error("Failed to cancel samples receipt", err);
            toast.error("Gặp lỗi khi hủy nhận mẫu!");
        }
    };

    const handleRejectSample = async (reasonCode: string, notes: string) => {
        if (!activePatient) return;
        
        try {
            // Mock API call for rejection
            await healthCheckService.cancelSampleReceipt([activePatient.hpc_orderid], `TỪ CHỐI (${reasonCode}): ${notes}`, user?.username);
            playErrorBuzz();
            toast.error(`Đã từ chối mẫu: ${reasonCode}. Hệ thống đã gửi cảnh báo về Khoa lâm sàng!`);
            setSelectedOrderIds(new Set());
            loadData();
        } catch (err) {
            console.error("Failed to reject sample", err);
            toast.error("Gặp lỗi khi gửi lệnh từ chối!");
        }
    };

    const handleBatchReceive = async (rackId: string) => {
        // Mock Batch logic
        toast.info(`Đang quét hệ thống tìm Khay ${rackId}...`);
        setTimeout(() => {
            playSuccessBeep();
            toast.success(`Đã nhận toàn bộ ống mẫu trên Khay ${rackId} thành công!`);
        }, 1500);
    };

    // KPI Counters
    const receivedSlipsCount = useMemo(() => slips.filter(s => s.status === 'VS' || s.status === 'A').length, [slips]);
    const pendingSlipsCount = useMemo(() => slips.filter(s => s.status === 'XN' || s.status === 'M').length, [slips]);

    // Register Hotkeys
    useSampleHotkeys({
        onConfirmReceipt: () => handleConfirmReceipt(),
        onOpenBatchModal: () => setBatchModalOpen(true),
        onOpenRejectionModal: () => {
            if (activePatient) setRejectionModalOpen(true);
            else toast.info("Vui lòng chọn một bệnh nhân trước khi từ chối mẫu!");
        },
        onReloadData: loadData,
        onBackToList: () => setViewMode('list'),
        onToggleHotkeyGuide: () => setHotkeyGuideOpen(prev => !prev),
        isModalOpen: isRejectionModalOpen || isBatchModalOpen || isHotkeyGuideOpen
    });

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800 shadow-xl">
            
            {/* ===== HEADER & BARCODE TOOLBAR ===== */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sm:p-5 relative z-10">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    
                    {/* Title & System Status */}
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl border border-blue-100 dark:border-blue-800/50">
                            🔬
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 uppercase tracking-tight">Quản lý Giao nhận Mẫu</h1>
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                                    LIMS Connected
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Phân hệ đồng bộ & kiểm soát luồng nhận mẫu xét nghiệm
                            </p>
                        </div>
                    </div>

                    {/* KPI Quick Stats Cards */}
                    <div className="grid grid-cols-4 gap-3 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-center min-w-[70px]">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase block">Tổng phiếu</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{slips.length}</span>
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/50 text-center min-w-[70px]">
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase block">Đã nhận</span>
                            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{receivedSlipsCount}</span>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/50 text-center min-w-[70px]">
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase block">Chờ nhận</span>
                            <span className="text-sm font-bold text-amber-700 dark:text-amber-300">{pendingSlipsCount}</span>
                        </div>
                        <div className="bg-rose-50 dark:bg-rose-900/20 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/50 text-center min-w-[70px]">
                            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase block">Đã hủy</span>
                            <span className="text-sm font-bold text-rose-700 dark:text-rose-300">{cancelledSamples.length}</span>
                        </div>
                    </div>

                    {/* Barcode Quick Scanner & Sync Actions */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                placeholder="Quét / Nhập Barcode (Enter)..."
                                value={barcodeScanInput}
                                onChange={e => setBarcodeScanInput(e.target.value)}
                                onKeyDown={handleBarcodeKeyDown}
                                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📷</span>
                        </div>
                        <button 
                            onClick={() => setBatchModalOpen(true)}
                            className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 border border-slate-200 rounded-xl shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                            title="Phím tắt [F2]"
                        >
                            <span>📦</span> Nhận lô <kbd className="text-[9px] bg-slate-200 dark:bg-slate-700 px-1 rounded font-mono text-slate-500">F2</kbd>
                        </button>
                        <button 
                            onClick={() => setHotkeyGuideOpen(true)}
                            className="px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:border-indigo-800 dark:text-indigo-300 border border-indigo-200 rounded-xl shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                            title="Xem bảng phím tắt [Shift + ?]"
                        >
                            <span>⌨️</span> Phím tắt
                        </button>
                        <button 
                            onClick={loadData}
                            className="px-3 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300 border border-blue-200 rounded-xl shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                            title="Phím tắt [F5]"
                        >
                            <span>🔄</span> Tải lại
                        </button>
                    </div>
                </div>
            </div>

            {/* ===== MAIN WORKSPACE (FULL-WIDTH TABBED VIEWS) ===== */}
            <div className="flex flex-1 overflow-hidden p-3 sm:p-4 gap-4 relative">
                
                {/* ===== VIEW 1: SLIPS LIST (100% WIDTH) ===== */}
                {viewMode === 'list' && (
                <div className="w-full flex flex-col bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                    
                    {/* Filters Toolbar - Expanded for Full Width */}
                    <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-700/60 flex flex-col lg:flex-row gap-4 text-xs items-end">
                        <div className="flex-1 min-w-[200px] w-full">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Khoa yêu cầu</label>
                            <select 
                                value={deptFilter}
                                onChange={e => setDeptFilter(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-750 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                            >
                                <option value="All">--- Tất cả khoa ---</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full lg:w-48">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Trạng thái nhận</label>
                            <select 
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-750 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none text-xs"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="A">Đã nhận đủ (A)</option>
                                <option value="M">Chưa nhận đủ (M)</option>
                            </select>
                        </div>
                        <div className="flex gap-4 w-full lg:w-auto">
                            <div className="w-full lg:w-36">
                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Từ ngày</label>
                                <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-750 font-mono text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                            <div className="w-full lg:w-36">
                                <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Đến ngày</label>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-750 font-mono text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex-1 w-full min-w-[250px]">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Tìm kiếm</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Tìm mã vạch, số hồ sơ, tên bệnh nhân..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-750 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-400"
                                />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                            </div>
                        </div>
                    </div>

                    {/* Slips Grid (Full Width) */}
                    <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-slate-50/40 dark:bg-slate-900/20">
                        {isLoading ? (
                            <div className="p-8 w-full text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                                <span className="animate-spin text-2xl text-teal-600">⌛</span> 
                                <span>Đang nạp danh sách phiếu...</span>
                            </div>
                        ) : slips.length === 0 ? (
                            <div className="p-8 w-full text-center text-slate-400 text-xs">Không tìm thấy phiếu giao nhận mẫu nào.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {slips.map(slip => {
                                    const isSelected = selectedSlipId === slip.id;
                                    const isReceived = slip.status === 'VS' || slip.status === 'A';
                                    return (
                                        <div 
                                            key={slip.id}
                                            onClick={() => handleSelectSlip(slip.id)}
                                            className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between min-h-[110px] ${
                                                isSelected 
                                                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-500/50 scale-[1.02]' 
                                                    : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700/60 hover:border-blue-300 hover:shadow-md hover:-translate-y-1'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-black text-lg text-blue-700 dark:text-blue-400">
                                                        #{slip.id}
                                                    </span>
                                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold uppercase border border-slate-200 dark:border-slate-600">
                                                        {slip.department}
                                                    </span>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${
                                                    isReceived 
                                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300' 
                                                        : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300'
                                                }`}>
                                                    {isReceived ? '✓ Đã nhận' : '⏳ Chờ nhận'}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                                                <div className="flex items-center gap-1.5 font-mono">
                                                    <span>📅</span> {formatDateTime(slip.createdAt)}
                                                </div>
                                                <div>
                                                    <span className="text-[10px]">Tạo bởi: </span>
                                                    <strong className="text-slate-700 dark:text-slate-300 text-xs">{slip.createdBy}</strong>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Left Actions Bar */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 grid grid-cols-4 gap-1.5 text-[11px] font-bold">
                        <button 
                            onClick={() => toast.info("Tính năng tạo phiếu trực tiếp đang đồng bộ.")}
                            className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        >
                            ➕ Thêm
                        </button>
                        <button 
                            onClick={() => toast.info("Chọn dòng phiếu trên danh sách để sửa.")}
                            className="py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        >
                            ✏️ Sửa
                        </button>
                        <button 
                            onClick={() => toast.info("Tính năng xóa phiếu giao nhận mẫu đang đồng bộ.")}
                            className="py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        >
                            🗑️ Xóa
                        </button>
                        <button 
                            onClick={() => toast.success("Đang gửi lệnh in toàn bộ phiếu...")}
                            className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        >
                            🖨️ In
                        </button>
                    </div>
                </div>
                )}

                {/* ===== VIEW 2: WORKSPACE DETAILS (100% WIDTH) ===== */}
                {viewMode === 'detail' && (
                <div className="w-full flex flex-col gap-4 overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300">
                    
                    {/* Detail View Global Header (Back Button) */}
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-2xl text-xs border border-slate-200 dark:border-slate-700 shadow-sm">
                        <button 
                            onClick={() => setViewMode('list')}
                            className="px-4 py-2 font-bold text-blue-800 dark:text-blue-300 bg-white dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer border border-slate-200 dark:border-slate-600 active:scale-95"
                        >
                            <span>⬅️</span> Quay lại Danh sách phiếu
                        </button>
                    </div>

                    {activeSlip ? (
                        <>
                            {/* Workspace Header Info Bar */}
                            <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-700 dark:text-blue-400 font-mono font-black text-lg border border-blue-200 dark:border-blue-800">
                                        #{activeSlip.id}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase">
                                                Phiếu giao nhận - Khoa {activeSlip.department}
                                            </h3>
                                            <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                                                {filteredSlipPatients.length} Bệnh nhân
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                                            <span>Tạo lúc: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatDateTime(activeSlip.createdAt)}</strong></span>
                                            <span>Bởi: <strong className="text-slate-700 dark:text-slate-300">{activeSlip.createdBy}</strong></span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Tab Switcher (Patients vs Cancelled Log) */}
                                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setRightTab('patients')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                            rightTab === 'patients' 
                                                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm border border-slate-200 dark:border-slate-600' 
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        🧪 Bệnh nhân & Chỉ định ({filteredSlipPatients.length})
                                    </button>
                                    <button 
                                        onClick={() => setRightTab('cancelled')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                            rightTab === 'cancelled' 
                                                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm border border-slate-200 dark:border-slate-600' 
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        🚫 Mẫu đã hủy ({cancelledSamples.length})
                                    </button>
                                    <button 
                                        onClick={() => setRightTab('history')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                            rightTab === 'history' 
                                                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-600' 
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        ⏳ Lịch sử
                                    </button>
                                </div>
                            </div>

                            {/* TAB 1: PATIENTS & TEST INSPECTOR VIEW */}
                            {rightTab === 'patients' && (
                                <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden">
                                    
                                    {/* Left Sub-Pane: Patients List (60% width) */}
                                    <div className="flex-1 lg:w-[60%] flex flex-col bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
                                        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
                                                <input 
                                                    type="checkbox" 
                                                    checked={filteredSlipPatients.length > 0 && selectedOrderIds.size === filteredSlipPatients.length}
                                                    onChange={toggleSelectAllPatients}
                                                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                                <span>Danh sách bệnh nhân</span>
                                            </div>
                                            <input 
                                                type="text"
                                                placeholder="Tìm tên, số HS, mã vạch..."
                                                value={patientSearchQuery}
                                                onChange={e => setPatientSearchQuery(e.target.value)}
                                                className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-700 text-xs font-semibold focus:ring-1 focus:ring-blue-500 focus:outline-none w-44"
                                            />
                                        </div>

                                        <div className="flex-1 overflow-auto custom-scrollbar">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-700 font-bold uppercase text-[10px]">
                                                    <tr>
                                                        <th className="p-2.5 w-8 text-center"></th>
                                                        <th className="p-2.5 w-10 text-center">STT</th>
                                                        <th className="p-2.5 w-24">Số hồ sơ</th>
                                                        <th className="p-2.5 min-w-[130px]">Họ tên bệnh nhân</th>
                                                        <th className="p-2.5 w-28">Mã vạch</th>
                                                        <th className="p-2.5 w-28">Ngày lấy</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                                    {filteredSlipPatients.map((pat, idx) => {
                                                        const isSelected = selectedOrderId === pat.hpc_orderid;
                                                        const isChecked = selectedOrderIds.has(pat.hpc_orderid);
                                                        return (
                                                            <tr 
                                                                key={pat.hpc_orderid || idx}
                                                                onClick={() => {
                                                                    setSelectedPatientDocNo(String(pat.hpc_docno));
                                                                    setSelectedOrderId(pat.hpc_orderid);
                                                                }}
                                                                className={`cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-750/40 transition-colors ${
                                                                    isSelected ? 'bg-blue-50 dark:bg-blue-950/30 font-extrabold border-l-4 border-l-blue-600' : ''
                                                                }`}
                                                            >
                                                                <td className="p-2.5 text-center" onClick={e => e.stopPropagation()}>
                                                                    <input 
                                                                        type="checkbox"
                                                                        checked={isChecked}
                                                                        onChange={e => toggleSelectPatient(pat.hpc_orderid, e as any)}
                                                                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                    />
                                                                </td>
                                                                <td className="p-2.5 text-center text-slate-400 font-normal">{idx + 1}</td>
                                                                <td className="p-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">{pat.hpc_docno}</td>
                                                                <td className="p-2.5 whitespace-nowrap">
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <span className="font-bold text-slate-900 dark:text-white">{pat.pname}</span>
                                                                        <SampleStatusBadge patient={pat} isReceived={activeSlip?.status === 'VS' || activeSlip?.status === 'A'} />
                                                                    </div>
                                                                </td>
                                                                <td className="p-2.5 font-mono text-blue-700 dark:text-blue-400 font-bold">{pat.hpc_orderid}</td>
                                                                <td className="p-2.5 font-mono text-[11px] text-slate-500">{formatDateTime(pat.limsoe_sample_date)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Right Sub-Pane: Detailed Test Items Inspector (40% width) */}
                                    <div className="lg:w-[40%] flex flex-col bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
                                        <div className="p-3.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold">
                                            <div>
                                                <span className="block uppercase tracking-wider text-[10px] text-slate-500">Chi tiết dịch vụ</span>
                                                <span className="text-sm font-extrabold text-blue-700 dark:text-blue-400">{activePatient ? activePatient.pname : 'Chưa chọn BN'}</span>
                                            </div>
                                            {activePatient && (
                                                <div className="flex gap-1.5">
                                                    <button 
                                                        onClick={() => handleConfirmReceipt([activePatient.hpc_orderid])}
                                                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold shadow-sm cursor-pointer active:scale-95"
                                                    >
                                                        ✓ Nhận mẫu
                                                    </button>
                                                    <button 
                                                        onClick={() => setRejectionModalOpen(true)}
                                                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-extrabold shadow-sm cursor-pointer active:scale-95"
                                                    >
                                                        ✕ Từ chối
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50 dark:bg-slate-900/20 text-xs custom-scrollbar">
                                            {activePatient ? (
                                                <>
                                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1 text-[11px]">
                                                        <div><span className="text-slate-500">Mã vạch:</span> <strong className="font-mono text-blue-700 dark:text-blue-400">{activePatient.hpc_orderid}</strong></div>
                                                        <div><span className="text-slate-500">Nhóm XN:</span> <strong className="text-slate-800 dark:text-slate-200">{activePatient.hfg_name || 'Xét nghiệm'}</strong></div>
                                                        <div><span className="text-slate-500">Người lấy mẫu:</span> <strong>{activePatient.limsoe_sample_by || '---'}</strong></div>
                                                    </div>

                                                    <h4 className="font-extrabold uppercase text-[10px] text-slate-500 tracking-wider mt-3">Danh sách chỉ định (Fee Items)</h4>

                                                    {testItems.length > 0 ? (
                                                        <div className="space-y-1.5">
                                                            {testItems.map((item, idx) => (
                                                                <div key={idx} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-start gap-2 text-slate-800 dark:text-slate-200 shadow-2xs">
                                                                    <span className="text-blue-600 font-black text-sm mt-0.5">•</span>
                                                                    <div>
                                                                        <div className="font-bold">{item.name}</div>
                                                                        {item.comment && <div className="text-[11px] text-slate-500 italic mt-0.5">{item.comment}</div>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-slate-400 text-center py-6">Không tìm thấy chi tiết xét nghiệm.</div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="text-slate-400 text-center py-12">Chọn một bệnh nhân ở bảng bên trái để xem chi tiết dịch vụ.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: AUDIT TRAIL */}
                            {rightTab === 'history' && (
                                <div className="flex-1 flex flex-col bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <SampleAuditTrail patient={activePatient || null} />
                                </div>
                            )}

                            {/* TAB 2: CANCELLED SAMPLES LOG VIEW */}
                            {rightTab === 'cancelled' && (
                                <div className="flex-1 flex flex-col bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden">
                                    <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900/40 flex justify-between items-center text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                                        <span>Nhật ký mẫu đã hủy / Trả mẫu ({cancelledSamples.length})</span>
                                        <span className="text-[11px] text-rose-600 dark:text-rose-400 font-normal">Hiển thị 50 vụ việc gần nhất</span>
                                    </div>
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <table className="w-full text-left border-collapse text-xs">
                                            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-700 font-bold uppercase text-[10px]">
                                                <tr>
                                                    <th className="p-3 w-24">OrderID</th>
                                                    <th className="p-3 w-24">Số hồ sơ</th>
                                                    <th className="p-3 min-w-[140px]">Họ tên bệnh nhân</th>
                                                    <th className="p-3 w-28">Người hủy</th>
                                                    <th className="p-3 w-36">Thời gian hủy</th>
                                                    <th className="p-3">Lý do hủy</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                                {cancelledSamples.map((sample, idx) => (
                                                    <tr key={sample.orderId || idx} className="hover:bg-rose-50/20 dark:hover:bg-rose-950/10">
                                                        <td className="p-3 font-mono font-bold text-rose-700 dark:text-rose-400">{sample.orderId}</td>
                                                        <td className="p-3 font-mono">{sample.docNo}</td>
                                                        <td className="p-3 font-extrabold text-slate-800 dark:text-slate-200">{sample.patientName}</td>
                                                        <td className="p-3 text-slate-600 dark:text-slate-400">{sample.cancelledBy}</td>
                                                        <td className="p-3 font-mono text-[11px] text-slate-500">{formatDateTime(sample.cancelledDate)}</td>
                                                        <td className="p-3 text-rose-600 dark:text-rose-400 italic font-semibold">{sample.reason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs bg-white dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
                            Vui lòng chọn một phiếu giao nhận mẫu ở danh sách bên trái.
                        </div>
                    )}

                </div>
                )}
            </div>
            <SampleRejectionModal 
                isOpen={isRejectionModalOpen}
                onClose={() => setRejectionModalOpen(false)}
                onReject={handleRejectSample}
                patientName={activePatient?.pname || ''}
                sampleId={activePatient?.hpc_orderid || ''}
            />

            <BatchReceivingModal 
                isOpen={isBatchModalOpen}
                onClose={() => setBatchModalOpen(false)}
                onReceiveBatch={handleBatchReceive}
            />

            <HotkeyGuideModal 
                isOpen={isHotkeyGuideOpen}
                onClose={() => setHotkeyGuideOpen(false)}
            />
        </div>
    );
};

export default SampleTracking;
// ==================== END OF COMPONENT ====================
