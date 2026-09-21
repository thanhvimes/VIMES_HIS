import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { healthCheckService } from '../../../services/healthCheckService';
import { useSession } from '../../../contexts/SessionContext';
import { 
    DownloadIcon, 
    RefreshIcon, 
    CheckCircleIcon, 
    AlertCircleIcon, 
    InfoIcon,
    PrinterIcon
} from '../../../components/Icons';
import { toast } from 'sonner';
import { buildHealthCheckExcelReport, EmployeeReportRecord } from '../utils/healthCheckExcelReportHelper';

interface Props {
    contractId: number;
    contractName: string;
    contractCode: string;
    startDate?: string;
    endDate?: string;
}

export const ContractReportTab: React.FC<Props> = ({ contractId, contractName, contractCode, startDate, endDate }) => {
    const { orgInfo } = useSession();
    const [isLoading, setIsLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'CONCLUDED' | 'ALL' | 'UNCONCLUDED'>('CONCLUDED');
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
        const matchesStatus = 
            filterStatus === 'ALL' ||
            (filterStatus === 'CONCLUDED' && emp.is_concluded) ||
            (filterStatus === 'UNCONCLUDED' && !emp.is_concluded);

        const matchesSearch = searchTerm === '' || 
            emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.cccd?.includes(searchTerm) ||
            emp.dept?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesClassification = filterClassification === 'ALL' ||
            (filterClassification === 'UNCLASSIFIED' && (!emp.phanloai || emp.phanloai.trim() === '')) ||
            emp.phanloai === filterClassification;

        return matchesStatus && matchesSearch && matchesClassification;
    });

    const exportToExcel = () => {
        // Nghiệp vụ Báo cáo KSK Doanh nghiệp: Chỉ các nhân sự đã có kết luận đủ dữ kiện mới đưa vào danh sách kết quả & chi phí
        const exportList = employees.filter((e: any) => e.is_concluded);
        if (!exportList || exportList.length === 0) {
            toast.warning("Chưa có nhân viên nào có kết luận đủ dữ kiện để xuất báo cáo!");
            return;
        }

        try {
            const mappedEmployees: EmployeeReportRecord[] = exportList.map((e: any, idx: number) => ({
                stt: idx + 1,
                code: e.code || '',
                name: e.name || '',
                dob: e.dob || '',
                gender: e.gender === 'F' || e.gender === 'Nữ' ? 'Nữ' : 'Nam',
                dept: e.dept || '',
                pos: e.pos || '',
                height: e.height,
                weight: e.weight,
                bmi: e.bmi,
                blood_pressure: e.blood_pressure ? `${e.blood_pressure}${e.blood_pressure_x ? '/' + e.blood_pressure_x : ''}` : '',
                pulse: e.pulse,
                mat: e.mat || 'Bình thường',
                tmh: e.tmh || 'Bình thường',
                rhm: e.rhm || 'Bình thường',
                noi: e.noi || 'Bình thường',
                ngoai: e.ngoai || 'Bình thường',
                dalieu: e.dalieu || 'Bình thường',
                phukhoa: e.phukhoa || (e.gender === 'Nữ' || e.gender === 'F' ? 'Bình thường' : ''),
                // Cận lâm sàng Huyết học & Hóa sinh từ lab_data
                glucose: e.lab_data?.blood_test?.glycemia || '',
                hgb: e.lab_data?.blood_test?.hemoglobin || '',
                rbc: e.lab_data?.blood_test?.chi_so_hc || '',
                wbc: e.lab_data?.blood_test?.chi_so_bach_cau || '',
                plt: e.lab_data?.blood_test?.chi_so_tieu_cau || '',
                cholesterol: e.lab_data?.blood_test?.cholesterol || '',
                triglyceride: e.lab_data?.blood_test?.triglycerid || '',
                hdl: e.lab_data?.blood_test?.hdl || '',
                ldl: e.lab_data?.blood_test?.ldl || '',
                urine_pro: e.lab_data?.urine_test?.protein || '',
                us_abdomen: e.lab_data?.us?.ket_qua || '',
                phanloai: e.phanloai || 'II',
                conclusion: e.conclusion_name ? `${e.conclusion} - ${e.conclusion_name}` : (e.conclusion || 'Hiện tại sức khỏe bình thường.'),
                remark: e.remark || ''
            }));

            // Thông tin bệnh viện động (Ưu tiên từ sys_company của Backend, fallback qua session orgInfo)
            const hospitalInfo = {
                name: reportData?.hospital?.name || orgInfo?.hospitalName || 'BỆNH VIỆN ĐA KHOA',
                parentOrg: reportData?.hospital?.parentOrg || orgInfo?.governingUnitName || 'SỞ Y TẾ',
                address: reportData?.hospital?.address || orgInfo?.address || '',
                phone: reportData?.hospital?.phone || orgInfo?.hotline || '',
                location: reportData?.hospital?.location || (orgInfo?.address ? orgInfo.address.split(',').pop()?.trim() : '') || 'Hà Nội'
            };

            const workbook = buildHealthCheckExcelReport({
                hospital: hospitalInfo,
                contract: {
                    contractCode: contractCode || 'KSK-VIMES',
                    contractName: contractName || 'Đoàn khám sức khỏe định kỳ',
                    companyName: contractName || 'Doanh nghiệp',
                    examDate: (startDate && endDate) 
                        ? `${new Date(startDate).toLocaleDateString('vi-VN')} - ${new Date(endDate).toLocaleDateString('vi-VN')}` 
                        : (reportData?.contract?.hec_examdate 
                            ? new Date(reportData.contract.hec_examdate).toLocaleDateString('vi-VN') 
                            : new Date().toLocaleDateString('vi-VN')),
                    totalRegistered: reportData?.summary?.totalEmployees || employees.length
                },
                employees: mappedEmployees
            });

            const filename = `Bao_Cao_KSK_${contractCode || 'Doan'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(workbook, filename);
            toast.success(`Xuất file Báo cáo KSK 4 sheet thành công (${exportList.length} NV đã kết luận): ${filename}`);
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
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Danh Sách Chi Tiết ({filteredEmployees.length})
                        </span>

                        {/* Bộ lọc trạng thái kết luận chuẩn xác */}
                        <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                            <button
                                onClick={() => setFilterStatus('CONCLUDED')}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    filterStatus === 'CONCLUDED'
                                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                                title="Chỉ hiển thị các nhân sự đã có kết luận & xếp loại đủ điều kiện đưa vào báo cáo"
                            >
                                <span>Đã kết luận (Báo cáo)</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    filterStatus === 'CONCLUDED'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                    {summary?.concludedEmployees || 0}
                                </span>
                            </button>

                            <button
                                onClick={() => setFilterStatus('UNCONCLUDED')}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    filterStatus === 'UNCONCLUDED'
                                        ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                                title="Các nhân sự chưa có kết luận bác sĩ"
                            >
                                <span>Chờ kết luận</span>
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                    filterStatus === 'UNCONCLUDED'
                                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                    {summary?.unconcludedEmployees ?? Math.max(0, (summary?.totalEmployees || 0) - (summary?.concludedEmployees || 0))}
                                </span>
                            </button>

                            <button
                                onClick={() => setFilterStatus('ALL')}
                                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                    filterStatus === 'ALL'
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                <span>Tất cả</span>
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                    {summary?.totalEmployees || 0}
                                </span>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={filterClassification}
                            onChange={(e) => setFilterClassification(e.target.value)}
                            className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-white cursor-pointer"
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
                                <th className="py-2.5 px-3 text-center">Trạng thái</th>
                                <th className="py-2.5 px-3 text-center">Xếp loại</th>
                                <th className="py-2.5 px-3">Kết luận bác sĩ</th>
                                <th className="py-2.5 px-3 text-center">VNeID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-8 text-center text-slate-400">
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
                                            {e.bmi || e.blood_pressure ? (
                                                <div className="flex flex-col gap-0.5">
                                                    {e.bmi && <span>BMI: <strong className="text-slate-800 dark:text-white">{e.bmi}</strong></span>}
                                                    {e.blood_pressure && (
                                                        <span className="text-[11px] text-slate-500 font-mono">
                                                            HA: {e.blood_pressure}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            {e.is_concluded ? (
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                    Đã kết luận
                                                </span>
                                            ) : (
                                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                    Chờ kết luận
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2 px-3 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${getGradeColor(e.phanloai)}`}>
                                                {e.phanloai || 'Chưa khám'}
                                            </span>
                                        </td>
                                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300 max-w-sm" title={e.conclusion_name ? `${e.conclusion} - ${e.conclusion_name}` : e.conclusion}>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                                                    {e.conclusion_name ? `${e.conclusion} - ${e.conclusion_name}` : (e.conclusion || '—')}
                                                </span>
                                                {e.remark && <span className="text-[10px] text-slate-400 italic">{e.remark}</span>}
                                            </div>
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
