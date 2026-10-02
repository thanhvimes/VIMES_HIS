// ==================== DASHBOARD COMPONENT ====================
// File: modules/health-check-sync/components/Dashboard.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { 
    CheckCircleIcon, 
    ExclamationCircleIcon, 
    PaperAirplaneIcon, 
    SignatureIcon,
    ChartBarIcon,
    RefreshIcon
} from '../../../components/Icons';
import { healthCheckService } from '../../../services/healthCheckService';

interface DashboardProps {
    documents: any[];
    startDate?: string;
    endDate?: string;
    contractId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ 
    documents,
    startDate: propStartDate,
    endDate: propEndDate,
    contractId: propContractId
}) => {
    const [liveStats, setLiveStats] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [filterStart, setFilterStart] = useState<string>(propStartDate || '');
    const [filterEnd, setFilterEnd] = useState<string>(propEndDate || '');

    useEffect(() => {
        if (propStartDate !== undefined) setFilterStart(propStartDate);
        if (propEndDate !== undefined) setFilterEnd(propEndDate);
    }, [propStartDate, propEndDate]);

    const fetchLiveStats = useCallback(async (start = filterStart, end = filterEnd) => {
        setIsLoading(true);
        try {
            const data = await healthCheckService.getDashboardStats({
                startDate: start,
                endDate: end,
                contractId: propContractId
            });
            if (data) {
                setLiveStats(data);
            }
        } catch (err) {
            console.warn("⚠️ [Dashboard] Không thể tải dashboard-stats từ server, chuyển sang fallback dữ liệu trang:", err);
        } finally {
            setIsLoading(false);
        }
    }, [filterStart, filterEnd, propContractId]);

    useEffect(() => {
        fetchLiveStats();
    }, [fetchLiveStats]);

    // Compute metrics: Ưu tiên dữ liệu thật từ DB, fallback sang mảng documents hiện tại
    const total = liveStats?.total !== undefined ? liveStats.total : documents.length;
    const unsigned = liveStats?.unsigned !== undefined ? liveStats.unsigned : documents.filter(d => d.signature_status === 'Unsigned').length;
    const signed = liveStats?.signed !== undefined ? liveStats.signed : documents.filter(d => d.signature_status === 'Signed').length;
    const synced = liveStats?.synced !== undefined ? liveStats.synced : documents.filter(d => d.send_status === 'Success').length;
    const errors = liveStats?.errors !== undefined ? liveStats.errors : documents.filter(d => d.send_status === 'Error').length;
    const errorList = liveStats?.errorList || documents.filter(d => d.send_status === 'Error' && d.error_message);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Top Bar: Bộ lọc thời gian & Làm mới */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center font-bold">
                        <ChartBarIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                            Tổng quan Thống kê Liên thông KSK
                        </h2>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Số liệu thời gian thực được tổng hợp trực tiếp từ cơ sở dữ liệu bệnh viện
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-end">
                    <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-500 font-medium">Từ:</span>
                        <input
                            type="date"
                            value={filterStart}
                            onChange={(e) => {
                                setFilterStart(e.target.value);
                                fetchLiveStats(e.target.value, filterEnd);
                            }}
                            className="p-1 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                        <span className="text-slate-500 font-medium">Đến:</span>
                        <input
                            type="date"
                            value={filterEnd}
                            onChange={(e) => {
                                setFilterEnd(e.target.value);
                                fetchLiveStats(filterStart, e.target.value);
                            }}
                            className="p-1 border border-slate-300 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-700 text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                        />
                    </div>
                    {(filterStart || filterEnd) && (
                        <button
                            onClick={() => {
                                setFilterStart('');
                                setFilterEnd('');
                                fetchLiveStats('', '');
                            }}
                            className="px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Xóa bộ lọc ngày"
                        >
                            Tất cả
                        </button>
                    )}
                    <button
                        onClick={() => fetchLiveStats()}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#0d645c] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
                        title="Tải lại số liệu mới nhất"
                    >
                        <RefreshIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Tổng số hồ sơ KSK</h3>
                        <p className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1 font-mono">{total.toLocaleString('vi-VN')}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Hồ sơ trong hệ thống</p>
                    </div>
                    <div className="p-3 rounded-full bg-[#0f766e] shadow-sm text-white">
                        <PaperAirplaneIcon className="w-5 h-5"/>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Chưa ký số</h3>
                        <p className="text-3xl font-extrabold text-orange-500 mt-1 font-mono">{unsigned.toLocaleString('vi-VN')}</p>
                        <p className="text-[10px] text-orange-400 mt-1">Cần ký USB Token / HSM</p>
                    </div>
                    <div className="p-3 rounded-full bg-orange-500 shadow-sm text-white">
                        <SignatureIcon className="w-5 h-5"/>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Đã đồng bộ VNeID</h3>
                        <p className="text-3xl font-extrabold text-green-500 mt-1 font-mono">{synced.toLocaleString('vi-VN')}</p>
                        <p className="text-[10px] text-green-400 mt-1">Tỷ lệ liên thông: {total > 0 ? ((synced/total)*100).toFixed(1) : 0}%</p>
                    </div>
                    <div className="p-3 rounded-full bg-green-500 shadow-sm text-white">
                        <CheckCircleIcon className="w-5 h-5"/>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Gửi cổng lỗi</h3>
                        <p className="text-3xl font-extrabold text-red-500 mt-1 font-mono">{errors.toLocaleString('vi-VN')}</p>
                        <p className="text-[10px] text-red-400 mt-1">Cần rà soát và gửi lại</p>
                    </div>
                    <div className="p-3 rounded-full bg-red-500 shadow-sm text-white">
                        <ExclamationCircleIcon className="w-5 h-5"/>
                    </div>
                </div>
            </div>

            {/* Graphs & Logs */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Simulated Chart Container */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 lg:col-span-2 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <ChartBarIcon className="w-5 h-5 text-[#0f766e]"/> Biểu đồ phân bổ hồ sơ theo 17 Mẫu biểu KSK
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">Quy chuẩn TT 32/2023 &amp; QĐ 1551</span>
                    </div>

                    <div className="flex-1 min-h-[240px] bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 flex flex-col justify-end p-4">
                        {/* Mock Bar Chart */}
                        <div className="flex items-end justify-between h-48 w-full px-4 gap-1">
                            {Array.from({ length: 17 }, (_, i) => {
                                const formKey = (i + 1).toString();
                                const count = liveStats?.formDistribution 
                                    ? (liveStats.formDistribution[formKey] || 0)
                                    : documents.filter(d => d.form_type === formKey).length;
                                const isSelected = count > 0;
                                const heightPercent = isSelected ? Math.min(100, Math.max(12, (count / Math.max(1, total)) * 200)) : 5;
                                return (
                                    <div key={i+1} className="flex flex-col items-center flex-1 group">
                                        <div className="text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                                            {count}
                                        </div>
                                        <div 
                                            style={{ height: `${heightPercent}px` }} 
                                            className={`w-full max-w-[20px] rounded-t transition-all ${isSelected ? 'bg-[#0f766e] group-hover:bg-[#0d645c] shadow-xs' : 'bg-slate-200 dark:bg-slate-800'}`}
                                            title={`Mẫu ${i+1}: ${count} hồ sơ`}
                                        ></div>
                                        <span className="text-[9px] text-slate-400 mt-2 font-mono font-bold">M{i+1}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Error Log Console */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <ExclamationCircleIcon className="w-5 h-5 text-red-500"/> Nhật ký lỗi đồng bộ chi tiết ({errorList.length})
                    </h3>
                    
                    <div className="flex-1 overflow-auto max-h-[250px] space-y-3 custom-scrollbar pr-1">
                        {errorList.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                                Không có lỗi đồng bộ nào được ghi nhận.
                            </div>
                        ) : (
                            errorList.map((doc: any, idx: number) => (
                                <div key={doc.id || idx} className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg text-xs leading-relaxed">
                                    <div className="flex justify-between items-center font-bold text-red-800 dark:text-red-400 mb-1">
                                        <span>HS: {doc.doc_no}</span>
                                        <span className="font-mono text-[10px]">Mẫu {doc.form_type}</span>
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-400 font-bold">{doc.patient_name}</div>
                                    <div className="text-red-600 dark:text-red-500 font-mono mt-1 pt-1 border-t border-red-200/40 text-[11px] break-words">
                                        {doc.error_message}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
