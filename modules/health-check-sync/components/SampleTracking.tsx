// ==================== HIS SAMPLE MANAGEMENT SYSTEM (e-MCH WEB STYLE) ====================
// File: modules/health-check-sync/components/SampleTracking.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { healthCheckService } from '../../../services/healthCheckService';
import { useSession } from '../../../contexts/SessionContext';
import { toast } from 'sonner';
import { catalogService, CatalogItem } from '../../../services/catalogService';

interface DeliverySlip {
    id: number;
    department: string;
    createdAt: string;
    createdBy: string;
    status: 'VS' | 'XN' | 'CHỜ'; // VS: Đã nhận, XN: Đang xử lý, CHỜ: Chờ gửi
    kth: string;
    acceptedDate: string;
    acceptedBy: string;
    patients: SlipPatient[];
}

interface SlipPatient {
    stt: number;
    docNo: string;
    patientName: string;
    description: string;
    barcode: string;
    sampleDate: string;
    collector: string;
    testServices: string[];
    tubes?: any[];
}

interface CancelledSample {
    orderId: string;
    docNo: string;
    patientName: string;
    cancelledBy: string;
    cancelledAt: string;
    reason: string;
}

const SampleTracking: React.FC = () => {
    const { user } = useSession();

    // Filters state
    const [departments, setDepartments] = useState<CatalogItem[]>([]);
    const [deptFilter, setDeptFilter] = useState('KB');
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('2026-06-02');
    const [endDate, setEndDate] = useState('2026-06-02');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Slips List State
    const [slips, setSlips] = useState<any[]>([]);
    const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null);

    // Selected Patient details on Right Pane
    const [selectedPatientDocNo, setSelectedPatientDocNo] = useState<string | null>(null);
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [slipPatients, setSlipPatients] = useState<any[]>([]);
    const [testItems, setTestItems] = useState<any[]>([]);
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [selectedTubeIds, setSelectedTubeIds] = useState<Set<number>>(new Set());

    // Cancelled samples state
    const [cancelledSamples, setCancelledSamples] = useState<any[]>([]);

    // Load data from Backend APIs
    // Load data from Backend APIs
    const loadData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch delivery slips
            const slipsData = await healthCheckService.getSampleSlips({
                startDate,
                endDate,
                deptId: deptFilter
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
            }
        } catch (error) {
            console.error("Failed to load sample slips", error);
            toast.error("Không thể tải danh sách phiếu!");
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch active departments on mount
    useEffect(() => {
        catalogService.getDepartments()
            .then(res => {
                if (Array.isArray(res)) {
                    setDepartments(res);
                    const hasKB = res.some(d => d.id === 'KB');
                    if (!hasKB && res.length > 0) {
                        setDeptFilter(res[0].id);
                    }
                }
            })
            .catch(err => {
                console.error("Failed to load active departments:", err);
            });
    }, []);

    useEffect(() => {
        loadData();
    }, [startDate, endDate, statusFilter, searchQuery, deptFilter]);

    const activeSlip = useMemo(() => {
        if (!selectedSlipId || !Array.isArray(slips)) return null;
        return slips.find(s => s.id === selectedSlipId) || null;
    }, [slips, selectedSlipId]);

    const activePatient = useMemo(() => {
        if (!Array.isArray(slipPatients)) return null;
        return slipPatients.find(p => String(p.hpc_docno) === selectedPatientDocNo) || null;
    }, [slipPatients, selectedPatientDocNo]);

    const filteredSlipPatients = useMemo(() => {
        if (!patientSearchQuery) return slipPatients;
        const q = patientSearchQuery.toLowerCase().trim();
        return slipPatients.filter(p => 
            String(p.hpc_docno || '').toLowerCase().includes(q) ||
            String(p.hpc_orderid || '').toLowerCase().includes(q) ||
            String(p.pname || '').toLowerCase().includes(q)
        );
    }, [slipPatients, patientSearchQuery]);

    // Load patients in the selected slip
    useEffect(() => {
        if (selectedSlipId) {
            healthCheckService.getSampleSlipPatients(selectedSlipId)
                .then(res => {
                    const patients = Array.isArray(res) ? res : [];
                    setSlipPatients(patients);
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
        }
    }, [selectedSlipId]);

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
            .then(res => {
                setCancelledSamples(Array.isArray(res) ? res : []);
            })
            .catch(err => {
                console.error("Failed to load cancelled samples", err);
            });
    };

    useEffect(() => {
        loadCancelled();
    }, [slips]);

    const handleSelectSlip = (id: number) => {
        setSelectedSlipId(id);
    };

    // Confirm receipt of tubes
    const handleConfirmReceipt = async () => {
        if (!selectedOrderId) {
            toast.error("Không có mẫu nào được chọn!");
            return;
        }

        try {
            await healthCheckService.confirmSampleReceipt([selectedOrderId], user?.username);
            toast.success("Xác nhận nhận mẫu thành công!");
            loadData();
        } catch (err) {
            console.error("Failed to confirm samples receipt", err);
            toast.error("Gặp lỗi khi xác nhận nhận mẫu!");
        }
    };

    // Cancel receipt of tubes
    const handleCancelReceipt = async () => {
        if (!selectedOrderId) {
            toast.error("Không có mẫu nào được chọn!");
            return;
        }

        try {
            await healthCheckService.cancelSampleReceipt([selectedOrderId], 'Hủy nhận từ giao diện Web', user?.username);
            toast.success("Đã hủy nhận mẫu thành công!");
            loadData();
        } catch (err) {
            console.error("Failed to cancel samples receipt", err);
            toast.error("Gặp lỗi khi hủy nhận mẫu!");
        }
    };

    const handleDeleteSlip = () => {
        toast.info("Tính năng xóa phiếu giao nhận mẫu đang được đồng bộ.");
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-slate-900 rounded-2xl overflow-hidden text-slate-800 dark:text-slate-200">
            {/* ===== HEADER BAR (e-MCH Style) ===== */}
            <div className="flex items-center justify-between px-6 py-4 bg-[#0f766e] text-white rounded-t-2xl shadow-sm">
                <div className="flex items-center gap-3">
                    <span className="p-2.5 bg-white/10 rounded-xl text-white">🧪</span>
                    <div>
                        <h2 className="text-base font-extrabold tracking-tight uppercase">Quản lý Giao nhận mẫu</h2>
                        <p className="text-teal-100/70 text-xs mt-0.5">Hệ thống đồng bộ dữ liệu giao nhận mẫu xét nghiệm lâm sàng</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={loadData}
                        className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm border border-teal-500/35 transition active:scale-95 cursor-pointer"
                    >
                        🔄 Tải lại dữ liệu
                    </button>
                    <button 
                        onClick={handleConfirmReceipt}
                        className="px-4 py-2 text-xs font-bold text-[#0f766e] bg-white hover:bg-teal-50 rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
                    >
                        ✓ Xác nhận nhận mẫu
                    </button>
                </div>
            </div>

            {/* ===== MAIN DUAL PANE AREA ===== */}
            <div className="flex flex-1 overflow-hidden p-4 gap-4">
                
                {/* ===== LEFT PANE (45%): DANH SÁCH PHIẾU ===== */}
                <div className="w-[45%] flex flex-col bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
                    {/* Filters Area */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Khoa</label>
                            <select 
                                value={deptFilter}
                                onChange={e => setDeptFilter(e.target.value)}
                                className="w-full p-2 border border-slate-350 dark:border-slate-650 rounded-lg bg-white dark:bg-slate-700 font-bold focus:ring-1 focus:ring-teal-500 focus:outline-none text-xs"
                            >
                                <option value="All">--- Tất cả khoa ---</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Trạng thái nhận</label>
                            <select 
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-full p-2 border border-slate-355 dark:border-slate-650 rounded-lg bg-white dark:bg-slate-700 font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none"
                            >
                                <option value="">Tất cả</option>
                                <option value="A">Đã nhận đủ mẫu (A)</option>
                                <option value="M">Chưa nhận đủ mẫu (M)</option>
                            </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Từ ngày</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full p-2 border border-slate-355 dark:border-slate-650 rounded-lg bg-white dark:bg-slate-700 font-mono text-sm font-bold focus:ring-1 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>
                        <div className="col-span-2 space-y-1">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Đến ngày</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full p-2 border border-slate-355 dark:border-slate-650 rounded-lg bg-white dark:bg-slate-700 font-mono text-sm font-bold focus:ring-1 focus:ring-teal-500 focus:outline-none"
                            />
                        </div>
                        <div className="col-span-4 mt-1">
                            <label className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Từ khóa tìm kiếm</label>
                            <input 
                                type="text" 
                                placeholder="Nhập mã vạch hoặc số hồ sơ..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full p-2 border border-slate-355 dark:border-slate-650 rounded-lg bg-white dark:bg-slate-700 text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Slips Table */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-400 text-xs">Đang tải danh sách phiếu...</div>
                        ) : slips.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs">Không có phiếu giao nhận mẫu nào phù hợp.</div>
                        ) : (
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="bg-[#fff1f2] dark:bg-rose-950/20 text-[#be123c] dark:text-rose-300 font-extrabold uppercase tracking-wider border-b border-rose-100 dark:border-rose-950/30">
                                    <tr>
                                        <th className="p-3 w-16 border-r border-rose-100/40">Id</th>
                                        <th className="p-3 w-14 border-r border-rose-100/40 text-center">Khoa</th>
                                        <th className="p-3 w-28 border-r border-rose-100/40">Ngày tạo</th>
                                        <th className="p-3 w-16 border-r border-rose-100/40">Người tạo</th>
                                        <th className="p-3 w-14 border-r border-rose-100/40 text-center">Trạng thái</th>
                                        <th className="p-3 w-10 border-r border-rose-100/40 text-center">KTH</th>
                                        <th className="p-3 w-28 border-r border-rose-100/40">Accepted Date</th>
                                        <th className="p-3">Accepted By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {slips.map(slip => {
                                        const isSelected = selectedSlipId === slip.id;
                                        return (
                                            <tr 
                                                key={slip.id}
                                                onClick={() => handleSelectSlip(slip.id)}
                                                className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750/30 transition-colors ${
                                                    isSelected ? 'bg-teal-50/30 dark:bg-teal-950/20 text-teal-800 dark:text-teal-400 font-extrabold' : ''
                                                }`}
                                            >
                                                <td className="p-3 border-r border-slate-100 dark:border-slate-700/30 font-semibold">{slip.id}</td>
                                                <td className="p-3 border-r border-slate-100 dark:border-slate-700/30 text-center">{slip.department}</td>
                                                <td className="p-3 border-r border-slate-100 dark:border-slate-700/30 font-mono text-slate-500">{slip.createdAt}</td>
                                                <td className="p-3 border-r border-slate-100 dark:border-slate-700/30">{slip.createdBy}</td>
                                                <td className="p-3 border-r border-slate-100 dark:border-slate-700/30 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wide ${
                                                        slip.status === 'VS' 
                                                            ? 'bg-emerald-100 text-emerald-800' 
                                                            : slip.status === 'XN' 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {slip.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 border-r border-slate-100 dark:border-slate-700/30 text-center">{slip.kth}</td>
                                                <td className="p-3 border-r border-slate-100 dark:border-slate-700/30 font-mono text-slate-500">{slip.acceptedDate || '---'}</td>
                                                <td className="p-3 text-slate-500">{slip.acceptedBy || '---'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 grid grid-cols-6 gap-2 text-[10px] font-bold">
                        <button 
                            onClick={() => toast.info("Tính năng tạo phiếu trực tiếp đang đồng bộ.")}
                            className="px-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        >
                            Thêm
                        </button>
                        <button 
                            onClick={() => toast.info("Chọn dòng phiếu trên danh sách để sửa.")}
                            className="px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        >
                            Sửa
                        </button>
                        <button 
                            onClick={handleDeleteSlip}
                            className="px-2 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        >
                            Xóa
                        </button>
                        <button 
                            onClick={() => toast.success("Đã hủy gửi phiếu giao nhận mẫu.")}
                            className="px-2 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        >
                            Hủy gửi
                        </button>
                        <button 
                            onClick={handleConfirmReceipt}
                            className="px-2 py-2 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-lg shadow-sm transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        >
                            Xác nhận
                        </button>
                        <button 
                            onClick={() => toast.success("Đang gửi yêu cầu in phiếu...")}
                            className="px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                        >
                            In
                        </button>
                    </div>
                </div>

                {/* ===== RIGHT PANE (55%): CHI TIẾT PHIẾU ===== */}
                <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {activeSlip ? (
                        <>
                            {/* UPPER RIGHT: Patient Samples list */}
                            <div className="flex-1 min-h-[40%] flex flex-col bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
                                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                                    <span>Danh sách bệnh nhân trong phiếu</span>
                                    <input 
                                        type="text"
                                        placeholder="Tìm số HS, số phiếu, họ tên..."
                                        value={patientSearchQuery}
                                        onChange={e => setPatientSearchQuery(e.target.value)}
                                        className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-xs font-semibold focus:ring-1 focus:ring-teal-500 focus:outline-none placeholder:text-slate-450 w-64 normal-case text-slate-800 dark:text-slate-100"
                                    />
                                </div>
                                <div className="flex-1 overflow-auto custom-scrollbar">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead className="bg-[#fff1f2]/50 dark:bg-rose-950/10 text-slate-600 dark:text-slate-400 sticky top-0 border-b border-slate-200 dark:border-slate-700 font-bold">
                                            <tr>
                                                <th className="p-3 w-10 text-center">STT</th>
                                                <th className="p-3 w-20">Số hồ sơ</th>
                                                <th className="p-3 w-32">Tên bệnh nhân</th>
                                                <th className="p-3">Diễn giải</th>
                                                <th className="p-3 w-28">Mã vạch</th>
                                                <th className="p-3 w-32">Ngày lấy mẫu</th>
                                                <th className="p-3">Người lấy</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                            {filteredSlipPatients.map((pat, idx) => {
                                                const isSelected = selectedOrderId === pat.hpc_orderid;
                                                return (
                                                    <tr 
                                                        key={pat.hpc_orderid || idx}
                                                        onClick={() => {
                                                            setSelectedPatientDocNo(String(pat.hpc_docno));
                                                            setSelectedOrderId(pat.hpc_orderid);
                                                        }}
                                                        className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750/30 transition-colors ${
                                                            isSelected ? 'bg-teal-50/20 dark:bg-teal-950/10 font-bold' : ''
                                                        }`}
                                                    >
                                                        <td className="p-3 text-center text-slate-450">{idx + 1}</td>
                                                        <td className="p-3 font-mono">{pat.hpc_docno}</td>
                                                        <td className="p-3 text-slate-900 dark:text-white font-extrabold">{pat.pname}</td>
                                                        <td className="p-3 text-slate-500">{pat.hfg_name}</td>
                                                        <td className="p-3 font-mono text-slate-700 dark:text-slate-300 font-bold">{pat.hpc_orderid}</td>
                                                        <td className="p-3 font-mono text-slate-550">{pat.limsoe_sample_date}</td>
                                                        <td className="p-3 text-slate-550">{pat.limsoe_sample_by}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* MIDDLE RIGHT: Detailed test items (Fee Name) */}
                            <div className="h-40 flex flex-col bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
                                <div className="px-4 py-3 bg-[#e0f2fe]/40 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-black text-sky-700 dark:text-sky-400 uppercase tracking-wider flex justify-between items-center">
                                    <span>Fee Name {activePatient && `(${activePatient.pname})`}</span>
                                    {activePatient && (
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={handleConfirmReceipt}
                                                className="px-2 py-0.5 bg-teal-600 text-white rounded text-[9px] font-bold hover:bg-teal-700 cursor-pointer"
                                            >
                                                Nhận mẫu
                                            </button>
                                            <button 
                                                onClick={handleCancelReceipt}
                                                className="px-2 py-0.5 bg-rose-600 text-white rounded text-[9px] font-bold hover:bg-rose-700 cursor-pointer"
                                            >
                                                Hủy nhận
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 text-xs font-mono space-y-1.5 bg-slate-50/40 dark:bg-slate-900/10">
                                    {activePatient ? (
                                        testItems.length > 0 ? (
                                            testItems.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 py-0.5 text-slate-700 dark:text-slate-300 font-semibold">
                                                    <span className="text-[#0f766e] font-bold">•</span>
                                                    <span>{item.comment ? `${item.name} (${item.comment})` : item.name}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-slate-400 text-center py-2">Không tìm thấy chi tiết xét nghiệm cho bệnh nhân này.</div>
                                        )
                                    ) : (
                                        <div className="text-slate-400 text-center py-4">Chọn một bệnh nhân để xem chi tiết xét nghiệm</div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm">
                            Chọn một phiếu giao nhận mẫu ở cột bên trái
                        </div>
                    )}

                    {/* BOTTOM RIGHT: Cancelled samples list */}
                    <div className="h-44 flex flex-col bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-rose-50/50 dark:bg-rose-950/20 text-[#be123c] dark:text-rose-450 border-b border-rose-100 dark:border-rose-900/30 text-[10px] font-black uppercase tracking-wider">
                            Mẫu đã hủy
                        </div>
                        <div className="flex-1 overflow-auto custom-scrollbar">
                            <table className="w-full text-left border-collapse text-[10px]">
                                <thead className="bg-[#fff1f2]/30 dark:bg-rose-950/10 border-b border-slate-200 dark:border-slate-700/60 text-slate-500 font-bold">
                                    <tr>
                                        <th className="p-3 w-20">OrderID</th>
                                        <th className="p-3 w-20">Số hồ sơ</th>
                                        <th className="p-3 w-32">Tên bệnh nhân</th>
                                        <th className="p-3 w-16">Người hủy</th>
                                        <th className="p-3 w-32">Ngày hủy</th>
                                        <th className="p-3">Lý do hủy</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                    {cancelledSamples.map((sample, idx) => (
                                        <tr key={sample.orderId || idx} className="hover:bg-rose-50/10">
                                            <td className="p-3 font-mono font-bold text-rose-700 dark:text-rose-450">{sample.orderId}</td>
                                            <td className="p-3 font-mono">{sample.docNo}</td>
                                            <td className="p-3 font-extrabold text-slate-800 dark:text-slate-200">{sample.patientName}</td>
                                            <td className="p-3 text-slate-500">{sample.cancelledBy}</td>
                                            <td className="p-3 font-mono text-slate-550">{sample.cancelledDate}</td>
                                            <td className="p-3 text-rose-600 dark:text-rose-400 italic font-semibold">{sample.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default SampleTracking;
// ==================== END OF COMPONENT ====================
