// ==================== SYNC DATA LIST COMPONENT ====================
// File: modules/health-check-sync/components/SyncDataList.tsx

import React, { useState, useMemo } from 'react';
import { 
    RefreshIcon, 
    CheckCircleIcon,
    InformationCircleIcon
} from '../../../components/Icons';

interface SyncDataListProps {
    contracts: any[];
    isLoading: boolean;
    onSeed: (filters: { startDate?: string; endDate?: string; workplaceId: string }) => Promise<any>;
    startDate: string;
    endDate: string;
    searchTerm: string;
}

const SyncDataList: React.FC<SyncDataListProps> = ({
    contracts,
    isLoading,
    onSeed,
    startDate,
    endDate,
    searchTerm
}) => {
    const [syncingId, setSyncingId] = useState<string | null>(null);

    const filteredContracts = useMemo(() => {
        return contracts.filter(c => {
            // Filter by search term
            const matchesSearch = 
                (c.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (c.name || '').toLowerCase().includes(searchTerm.toLowerCase());
            if (!matchesSearch) return false;

            // Filter by date range if specified and valid (length 10)
            const isStartDateValid = startDate && startDate.length === 10 && startDate.includes('-');
            const isEndDateValid = endDate && endDate.length === 10 && endDate.includes('-');

            if (isStartDateValid || isEndDateValid) {
                if (c.contract_date) {
                    const parts = c.contract_date.split('/');
                    if (parts.length === 3) {
                        const cDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
                        if (isStartDateValid && cDateStr < startDate) return false;
                        if (isEndDateValid && cDateStr > endDate) return false;
                    }
                } else {
                    return false;
                }
            }

            return true;
        });
    }, [contracts, searchTerm, startDate, endDate]);

    const handleSync = async (contractId: string) => {
        const contract = contracts.find(c => String(c.id) === contractId);
        const contractName = contract ? contract.name : '';
        const confirmMsg = `Bạn có chắc chắn muốn đồng bộ dữ liệu khám từ HIS cho gói khám "${contractName}" không?`;
        if (!window.confirm(confirmMsg)) return;

        setSyncingId(contractId);
        try {
            await onSeed({
                startDate,
                endDate,
                workplaceId: contractId
            });
        } finally {
            setSyncingId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden w-full min-h-[400px] animate-in fade-in duration-200">
            <div className="overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-[#fff1f2] dark:bg-rose-950/20 text-[#9f1239] dark:text-rose-300 font-extrabold text-[11px] uppercase tracking-wider sticky top-0 z-10 border-b border-rose-100 dark:border-rose-950/40">
                        <tr>
                            <th className="p-4 w-16 text-center">STT</th>
                            <th className="p-4 w-36">Mã hợp đồng</th>
                            <th className="p-4">Tên gói khám / Công ty</th>
                            <th className="p-4 w-36 text-center">Ngày hợp đồng</th>
                            <th className="p-4 w-36 text-center">Trạng thái</th>
                            <th className="p-4 w-40 text-center">Số lượng nhân viên</th>
                            <th className="p-4 w-40 text-center">Đã đồng bộ</th>
                            <th className="p-4 text-right w-44">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {isLoading ? (
                            <tr>
                                <td colSpan={8} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-2">
                                        <RefreshIcon className="w-8 h-8 animate-spin text-teal-500" />
                                        <span className="text-slate-500 text-xs font-semibold">Đang tải danh sách gói khám...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredContracts.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                                        <InformationCircleIcon className="w-8 h-8 mb-2 text-slate-300" />
                                        <span className="font-bold text-sm">Không tìm thấy gói khám nào</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredContracts.map((c, idx) => {
                                const isSyncing = syncingId === String(c.id);
                                const progress = c.employee_count > 0 
                                    ? Math.round((c.synced_count / c.employee_count) * 100) 
                                    : 0;

                                return (
                                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4 text-center text-slate-500 font-mono text-xs">{idx + 1}</td>
                                        <td className="p-4 font-bold text-slate-900 dark:text-white font-mono text-[13px]">{c.code}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-slate-800 dark:text-white text-[13px]">{c.name}</div>
                                        </td>
                                        <td className="p-4 text-center text-slate-600 dark:text-slate-400 font-medium text-xs">
                                            {c.contract_date || '---'}
                                        </td>
                                        <td className="p-4 text-center">
                                            {c.status === 'P' ? (
                                                <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-200/50 dark:border-emerald-900/30">
                                                    Đã đồng bộ
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200/50 dark:border-amber-900/30">
                                                    Chưa đồng bộ
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs">
                                                {c.employee_count} nhân viên
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col items-center space-y-1">
                                                <div className="flex justify-between w-full max-w-[120px] text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                    <span>{c.synced_count} / {c.employee_count}</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <div className="w-full max-w-[120px] bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full transition-all duration-300 ${progress === 100 ? 'bg-emerald-500' : 'bg-teal-500'}`}
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleSync(String(c.id))}
                                                disabled={isSyncing}
                                                className={`px-4 py-2 rounded-lg font-bold text-xs shadow-sm hover:shadow transition-all active:scale-95 flex items-center justify-center gap-1.5 ml-auto cursor-pointer ${
                                                    isSyncing
                                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                        : progress === 100
                                                            ? 'bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 border border-emerald-200'
                                                            : 'bg-[#0f766e] hover:bg-[#0d9488] text-white'
                                                }`}
                                            >
                                                {isSyncing ? (
                                                    <RefreshIcon className="w-3.5 h-3.5 animate-spin" />
                                                ) : progress === 100 ? (
                                                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                                                ) : (
                                                    <RefreshIcon className="w-3.5 h-3.5" />
                                                )}
                                                {isSyncing ? 'Đang đồng bộ...' : progress === 100 ? 'Đồng bộ lại' : 'Đồng bộ HIS'}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500">
                Hiển thị {filteredContracts.length} gói khám sức khỏe
            </div>
        </div>
    );
};

export default SyncDataList;
