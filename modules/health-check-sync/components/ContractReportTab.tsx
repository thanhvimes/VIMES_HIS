// ==================== CONTRACT REPORT & ANALYTICS COMPONENT ====================
// File: modules/health-check-sync/components/ContractReportTab.tsx

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { healthCheckService } from '../../../services/healthCheckService';
import { 
    DownloadIcon, 
    RefreshIcon, 
    CheckCircleIcon, 
    AlertCircleIcon, 
    InfoIcon,
    PrinterIcon
} from '../../../components/Icons';
import { toast } from 'sonner';

interface Props {
    contractId: number;
    contractName: string;
    contractCode: string;
}

export const ContractReportTab: React.FC<Props> = ({ contractId, contractName, contractCode }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterClassification, setFilterClassification] = useState<string>('ALL');

    const loadReport = async () => {
        if (!contractId) return;
        setIsLoading(true);
        try {
            const data = await healthCheckService.getContractReportSummary(contractId);
            setReportData(data);
        } catch (err: any) {
            console.error("Lỗi khi tải báo cáo tổng kết đoàn khám:", err);
            toast.error("Không thể tải dữ liệu báo cáo tổng kết!");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadReport();
    }, [contractId]);

    const summary = reportData?.summary;
    const employees = reportData?.employees || [];

    const filteredEmployees = employees.filter((emp: any) => {
        const matchesSearch = searchTerm === '' || 
            emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.cccd?.includes(searchTerm) ||
            emp.dept?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesClassification = filterClassification === 'ALL' ||
            (filterClassification === 'UNCLASSIFIED' && (!emp.phanloai || emp.phanloai.trim() === '')) ||
            emp.phanloai === filterClassification;

        return matchesSearch && matchesClassification;
    });

    const exportToExcel = () => {
        if (!employees || employees.length === 0) {
            toast.warning("Không có dữ liệu nhân viên để xuất Excel!");
            return;
        }

        try {
            // Chuẩn bị dữ liệu Excel
            const excelRows = employees.map((e: any, idx: number) => ({
                'STT': idx + 1,
                'Mã NV': e.code || '',
                'Họ và Tên': e.name || '',
                'Ngày sinh': e.dob || '',
                'Giới tính': e.gender === 'F' || e.gender === 'Nữ' ? 'Nữ' : 'Nam',
                'Số CCCD': e.cccd || '',
                'Phòng ban': e.dept || '',
                'Chức danh': e.pos || '',
                'Số bệnh án HIS': e.doc_no || '',
                'Chiều cao (cm)': e.height || '',
                'Cân nặng (kg)': e.weight || '',
                'BMI': e.bmi || '',
                'Huyết áp': e.blood_pressure ? `${e.blood_pressure}/${e.blood_pressure_x || ''}` : '',
                'Khám Mắt': e.mat || '',
                'Khám TMH': e.tmh || '',
                'Khám RHM': e.rhm || '',
                'Khám Nội': e.noi || '',
                'Khám Ngoại': e.ngoai || '',
                'Phân loại Sức khỏe': e.phanloai || 'Chưa phân loại',
                'Kết luận': e.conclusion || '',
                'Ghi chú / Lời dặn': e.remark || '',
                'Trạng thái VNeID': e.send_status === 'Success' ? 'Đã liên thông' : 'Chưa gửi'
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelRows);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Báo Cáo Đoàn KSK');

            // Thiết lập độ rộng cột
            const colWidths = [
                { wch: 6 },  // STT
                { wch: 12 }, // Mã NV
                { wch: 25 }, // Họ tên
                { wch: 12 }, // Ngày sinh
                { wch: 10 }, // Giới tính
                { wch: 16 }, // CCCD
                { wch: 22 }, // Phòng ban
                { wch: 20 }, // Chức danh
                { wch: 14 }, // Số BA
                { wch: 14 }, // Chiều cao
                { wch: 14 }, // Cân nặng
                { wch: 10 }, // BMI
                { wch: 14 }, // Huyết áp
                { wch: 25 }, // Mắt
                { wch: 25 }, // TMH
                { wch: 25 }, // RHM
                { wch: 30 }, // Nội
                { wch: 25 }, // Ngoại
                { wch: 18 }, // Phân loại
                { wch: 30 }, // Kết luận
                { wch: 30 }, // Lời dặn
                { wch: 18 }  // VNeID
            ];
            worksheet['!cols'] = colWidths;

            const filename = `Bao_Cao_KSK_${contractCode || 'Doan'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(workbook, filename);
            toast.success(`Xuất file Excel thành công: ${filename}`);
        } catch (err: any) {
            console.error("Lỗi xuất Excel:", err);
            toast.error("Không thể xuất file Excel!");
        }
    };

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'Loại 1': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';
            case 'Loại 2': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800';
            case 'Loại 3': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800';
            case 'Loại 4': return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800';
            case 'Loại 5': return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800';
            default: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 overflow-y-auto">
            {/* 1. Header Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                            {contractCode}
                        </span>
                        <h2 className="text-base font-bold text-slate-800 dark:text-white">
                            Báo Cáo Tổng Kết Đoàn Khám: {contractName}
                        </h2>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Tổng hợp kết quả phân loại sức khỏe, bệnh lý lao động & liên thông Cổng Quốc gia
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={loadReport}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Tải lại dữ liệu"
                    >
                        <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Làm mới</span>
                    </button>

                    <button
                        onClick={exportToExcel}
                        disabled={isLoading || !employees.length}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all active:scale-95"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span>Xuất Excel Doanh Nghiệp</span>
                    </button>
                </div>
            </div>

            {/* 2. KPI Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Tổng số CBNV</span>
                        <div className="flex items-baseline justify-between mt-1">
                            <span className="text-2xl font-bold font-mono text-slate-800 dark:text-white">
                                {summary.totalEmployees}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">100%</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Đã Tiếp Đón</span>
                        <div className="flex items-baseline justify-between mt-1">
                            <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                                {summary.receivedEmployees}
                            </span>
                            <span className="text-xs text-blue-500 font-mono">
                                {summary.totalEmployees > 0 ? Math.round((summary.receivedEmployees / summary.totalEmployees) * 100) : 0}%
                            </span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Đã Kết Luận Khám</span>
                        <div className="flex items-baseline justify-between mt-1">
                            <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                {summary.concludedEmployees}
                            </span>
                            <span className="text-xs font-bold font-mono text-emerald-500">
                                {summary.concludedRate}%
                            </span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Liên Thông VNeID</span>
                        <div className="flex items-baseline justify-between mt-1">
                            <span className="text-2xl font-bold font-mono text-teal-600 dark:text-teal-400">
                                {summary.syncedEmployees}
                            </span>
                            <span className="text-xs text-teal-500 font-mono">
                                {summary.totalEmployees > 0 ? Math.round((summary.syncedEmployees / summary.totalEmployees) * 100) : 0}%
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Analytics: Phân Loại Sức Khỏe & Thống Kê Bệnh Lý */}
            {summary && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* A. Phân loại sức khỏe */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
                            Phân Bổ Phân Loại Sức Khỏe (Bộ Y Tế)
                        </h3>

                        <div className="space-y-2.5">
                            {Object.entries(summary.classificationCounts || {}).map(([grade, count]: [string, any]) => {
                                const pct = summary.totalEmployees > 0 ? Math.round((count / summary.totalEmployees) * 100) : 0;
                                return (
                                    <div key={grade} className="flex items-center justify-between text-xs">
                                        <span className="w-32 font-medium text-slate-700 dark:text-slate-300">{grade}</span>
                                        <div className="flex-1 mx-3 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                            <div 
                                                className={`h-full transition-all ${
                                                    grade === 'Loại 1' ? 'bg-emerald-500' :
                                                    grade === 'Loại 2' ? 'bg-blue-500' :
                                                    grade === 'Loại 3' ? 'bg-amber-500' :
                                                    grade === 'Loại 4' ? 'bg-orange-500' :
                                                    grade === 'Loại 5' ? 'bg-rose-500' : 'bg-slate-400'
                                                }`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="w-16 text-right font-mono font-bold text-slate-800 dark:text-white">
                                            {count} ({pct}%)
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* B. Thống kê bệnh lý thường gặp */}
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3 flex items-center gap-2">
                            <AlertCircleIcon className="w-4 h-4 text-amber-500" />
                            Cảnh Báo & Bệnh Lý Thường Gặp
                        </h3>

                        <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                                <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">Tật khúc xạ Mắt</span>
                                <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200 mt-0.5">
                                    {summary.pathologyStats?.refractiveError || 0} <span className="text-xs font-normal">người</span>
                                </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40">
                                <span className="text-xs text-blue-800 dark:text-blue-300 font-medium">Bệnh Tai Mũi Họng</span>
                                <div className="text-xl font-bold font-mono text-blue-900 dark:text-blue-200 mt-0.5">
                                    {summary.pathologyStats?.entIssue || 0} <span className="text-xs font-normal">người</span>
                                </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
                                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Bệnh Răng Hàm Mặt</span>
                                <div className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-0.5">
                                    {summary.pathologyStats?.dentalIssue || 0} <span className="text-xs font-normal">người</span>
                                </div>
                            </div>

                            <div className="p-2.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                                <span className="text-xs text-rose-800 dark:text-rose-300 font-medium">Huyết áp cao (≥140/90)</span>
                                <div className="text-xl font-bold font-mono text-rose-900 dark:text-rose-200 mt-0.5">
                                    {summary.pathologyStats?.hypertension || 0} <span className="text-xs font-normal">người</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Filter & Detailed Table */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-[300px]">
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Danh Sách Chi Tiết ({filteredEmployees.length})
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={filterClassification}
                            onChange={(e) => setFilterClassification(e.target.value)}
                            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white"
                        >
                            <option value="ALL">Tất cả phân loại</option>
                            <option value="Loại 1">Loại 1</option>
                            <option value="Loại 2">Loại 2</option>
                            <option value="Loại 3">Loại 3</option>
                            <option value="Loại 4">Loại 4</option>
                            <option value="Loại 5">Loại 5</option>
                            <option value="UNCLASSIFIED">Chưa phân loại</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Tìm tên, mã NV, CCCD, phòng ban..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white w-64"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                            <tr>
                                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                                <th className="py-2.5 px-3">Mã NV</th>
                                <th className="py-2.5 px-3">Họ và Tên</th>
                                <th className="py-2.5 px-3">Ngày sinh</th>
                                <th className="py-2.5 px-3">Phòng ban</th>
                                <th className="py-2.5 px-3">Sinh hiệu (BMI / HA)</th>
                                <th className="py-2.5 px-3 text-center">Xếp loại</th>
                                <th className="py-2.5 px-3">Kết luận bác sĩ</th>
                                <th className="py-2.5 px-3 text-center">VNeID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-slate-400">
                                        Không tìm thấy dữ liệu phù hợp
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((e: any, index: number) => (
                                    <tr key={e.id || index} className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors">
                                        <td className="py-2 px-3 text-center font-mono text-slate-400">{index + 1}</td>
                                        <td className="py-2 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">{e.code}</td>
                                        <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white">
                                            {e.name}
                                            <div className="text-[10px] text-slate-400 font-mono font-normal">{e.cccd}</div>
                                        </td>
                                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-400">{e.dob}</td>
                                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                                            {e.dept || '—'}
                                            {e.pos && <div className="text-[10px] text-slate-400">{e.pos}</div>}
                                        </td>
                                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">
                                            {e.bmi ? `BMI ${e.bmi}` : '—'}
                                            {e.blood_pressure && (
                                                <div className="text-[10px] text-slate-400 font-mono">
                                                    HA: {e.blood_pressure}/{e.blood_pressure_x || ''}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getGradeColor(e.phanloai)}`}>
                                                {e.phanloai || 'Chưa khám'}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 max-w-xs truncate" title={e.conclusion}>
                                            {e.conclusion || '—'}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            {e.send_status === 'Success' ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                                    Đã gửi
                                                </span>
                                            ) : (
                                                <span className="text-[11px] text-slate-400 font-mono">Chưa</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
