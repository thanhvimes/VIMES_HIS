// ==================== CONTRACT REPORT VIEW ====================
// File: modules/health-check-sync/components/ContractReportView.tsx
// Màn hình chuyên dụng: Báo Cáo Tổng Kết Đoàn Khám Sức Khỏe
// Cho phép chọn gói khám/hợp đồng và hiển thị báo cáo phân tích, thống kê bệnh lý & xuất Excel 4 Sheet chuẩn
// ==============================================================

import React, { useState, useEffect } from 'react';
import { healthCheckService } from '../../../services/healthCheckService';
import Combobox from '../../../components/ui/Combobox';
import { 
    ChartBarIcon, 
    RefreshIcon, 
    DownloadIcon, 
    DocumentTextIcon, 
    UserGroupIcon,
    CalendarIcon,
    SparklesIcon
} from '../../../components/Icons';
import { toast } from 'sonner';
import { ContractReportTab } from './ContractReportTab';

interface ContractItem {
    id: number;
    code: string;
    name: string;
    company_id?: string;
    contract_date?: string;
    exam_date?: string;
    employee_count?: number;
    synced_count?: number;
}

export const ContractReportView: React.FC = () => {
    const [contracts, setContracts] = useState<ContractItem[]>([]);
    const [selectedContractId, setSelectedContractId] = useState<string | number>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const loadContracts = async (start = startDate, end = endDate) => {
        setIsLoading(true);
        try {
            const filters: any = {};
            if (start) filters.startDate = start;
            if (end) filters.endDate = end;
            const data = await healthCheckService.getContracts(filters);
            setContracts(data || []);
            if (data && data.length > 0) {
                const existing = data.find((c: any) => String(c.id) === String(selectedContractId));
                setSelectedContractId(existing ? existing.id : data[0].id);
            } else {
                setSelectedContractId('');
            }
        } catch (err: any) {
            console.error('Lỗi khi tải danh sách hợp đồng KSK:', err);
            toast.error('Không thể tải danh sách hợp đồng khám sức khỏe!');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadContracts();
    }, []);

    const handleDateChange = (newStart: string, newEnd: string) => {
        setStartDate(newStart);
        setEndDate(newEnd);
        loadContracts(newStart, newEnd);
    };

    const selectedContract = contracts.find(c => String(c.id) === String(selectedContractId)) || (contracts.length > 0 ? contracts[0] : null);

    // Tải báo cáo mẫu hoàn thiện (ksk_mau_data)
    const handleDownloadSampleReport = () => {
        // Tải tệp mẫu hoàn chỉnh được sinh sẵn
        const link = document.createElement('a');
        link.href = '/modules/health-check-sync/docs/Bao_cao_ksk_mau_data_hoan_thien.xlsx';
        link.setAttribute('download', 'Bao_cao_ksk_mau_data_hoan_thien.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Đang tải tệp Báo cáo KSK mẫu 4 sheet hoàn thiện...');
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 space-y-3">
            {/* Top Toolbar: Lựa chọn đoàn khám, Bộ lọc Từ ngày - Đến ngày & Thông tin */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                <div className="flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-[#9f1239] text-white flex items-center justify-center shadow-md shadow-rose-900/20 shrink-0">
                        <ChartBarIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            Báo Cáo Tổng Kết Đoàn Khám Sức Khỏe
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Mẫu Chuẩn Doanh Nghiệp 4 Sheet
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Thống kê phân loại sức khỏe, bệnh lý chuyên khoa, viện phí và kết xuất Excel hoàn chỉnh
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Bộ lọc Từ ngày - Đến ngày & Quick filters */}
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Từ:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => handleDateChange(e.target.value, endDate)}
                            className="text-xs bg-transparent border-0 text-slate-800 dark:text-white font-medium focus:ring-0 p-0 cursor-pointer"
                            title="Lọc hợp đồng có ngày khám từ ngày này"
                        />
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Đến:</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => handleDateChange(startDate, e.target.value)}
                            className="text-xs bg-transparent border-0 text-slate-800 dark:text-white font-medium focus:ring-0 p-0 cursor-pointer"
                            title="Lọc hợp đồng có ngày khám đến ngày này"
                        />
                    </div>

                    {(startDate || endDate) && (
                        <button
                            onClick={() => handleDateChange('', '')}
                            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer flex items-center gap-1"
                            title="Xóa bộ lọc ngày để xem tất cả hợp đồng"
                        >
                            <span>✕ Tất cả</span>
                        </button>
                    )}

                    {/* Bộ chọn hợp đồng chuẩn Combobox Multi-column hiển thị rõ ngày khám & số lượng NV */}
                    <div className="w-80 xl:w-96">
                        <Combobox
                            options={contracts}
                            columns={[
                                { key: 'code', label: 'Mã HĐ', width: '90px' },
                                { key: 'name', label: 'Gói khám / Đoàn', width: '200px' },
                                { 
                                    key: 'exam_date', 
                                    label: 'Ngày khám', 
                                    width: '100px',
                                    render: (item: ContractItem) => (
                                        <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                                            {item.exam_date || item.contract_date || '—'}
                                        </span>
                                    )
                                },
                                { 
                                    key: 'employee_count', 
                                    label: 'Số NV', 
                                    width: '60px',
                                    render: (item: ContractItem) => (
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-center block">
                                            {item.employee_count || 0}
                                        </span>
                                    )
                                }
                            ]}
                            value={selectedContract?.name 
                                ? `${selectedContract.code ? `[${selectedContract.code}] ` : ''}${selectedContract.name}${selectedContract.exam_date || selectedContract.contract_date ? ` (${selectedContract.exam_date || selectedContract.contract_date})` : ''}` 
                                : ''}
                            onChange={(_val, item) => {
                                if (item) setSelectedContractId(item.id);
                            }}
                            displayValue={(item: ContractItem) => `${item.code ? `[${item.code}] ` : ''}${item.name}${item.exam_date || item.contract_date ? ` (${item.exam_date || item.contract_date})` : ''}`}
                            placeholder={contracts.length === 0 ? "Không có gói khám trong khoảng ngày này..." : `Chọn đoàn khám (${contracts.length} hợp đồng)...`}
                        />
                    </div>

                    <button
                        onClick={() => loadContracts(startDate, endDate)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors cursor-pointer"
                        title="Tải lại danh sách hợp đồng"
                    >
                        <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Làm mới</span>
                    </button>

                    <button
                        onClick={handleDownloadSampleReport}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800 rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
                        title="Tải tệp Excel báo cáo mẫu hoàn chỉnh 4 sheet tính toán từ dữ liệu ksk_mau_data.xlsx"
                    >
                        <SparklesIcon className="w-4 h-4 text-amber-500" />
                        <span>Tải Báo Cáo Mẫu (10 NV)</span>
                    </button>
                </div>
            </div>

            {/* Nội dung báo cáo */}
            <div className="flex-1 min-h-0">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                        <RefreshIcon className="w-8 h-8 animate-spin text-rose-500 mb-2" />
                        <span className="text-xs font-semibold text-slate-500">Đang tải dữ liệu đoàn khám...</span>
                    </div>
                ) : !selectedContract ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400">
                        <DocumentTextIcon className="w-12 h-12 mb-3 text-slate-300" />
                        <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300 mb-1">
                            {contracts.length === 0 ? 'Không tìm thấy gói khám nào trong khoảng thời gian đã chọn' : 'Chưa có hợp đồng nào được chọn'}
                        </h3>
                        <p className="text-xs text-slate-400 max-w-sm">
                            {contracts.length === 0 
                                ? 'Vui lòng nới rộng khoảng ngày "Từ ngày - Đến ngày" hoặc bấm "Xóa ngày" để xem tất cả hợp đồng.' 
                                : 'Vui lòng chọn một gói khám hoặc đoàn khám ở thanh công cụ phía trên để xem và xuất báo cáo.'}
                        </p>
                    </div>
                ) : (
                    <div className="h-full">
                        <ContractReportTab
                            contractId={selectedContract.id}
                            contractName={selectedContract.name}
                            contractCode={selectedContract.code}
                            startDate={startDate}
                            endDate={endDate}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContractReportView;
