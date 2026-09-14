import React, { useState, useEffect, useMemo, useContext } from 'react';
import { DynamicFormContext } from '../DynamicFormContext';
import { ChildFormContext } from '../mau1-child/ChildFormContext';
import { healthCheckService, PatientFeeReport, PatientFeeItem } from '../../../../services/healthCheckService';
import { formatCurrency, formatDate, removeVietnameseTones } from '../../../../utils/formatters';
import { 
    Receipt, 
    ShieldCheck, 
    Layers, 
    Search, 
    RefreshCw, 
    AlertCircle, 
    CheckCircle2, 
    FileSpreadsheet,
    DollarSign,
    Building2,
    Calendar,
    Tag
} from 'lucide-react';
import { toast } from 'sonner';

interface FeeTabProps {
    customDocNo?: string | number;
    initialData?: any;
}

const FeeTab: React.FC<FeeTabProps> = ({ customDocNo, initialData: propsInitialData }) => {
    const dynamicCtx = useContext(DynamicFormContext);
    const childCtx = useContext(ChildFormContext);

    const initialData = propsInitialData || dynamicCtx?.initialData || childCtx?.initialData;
    const targetId = customDocNo || initialData?.id || initialData?.doc_no || dynamicCtx?.docNo || childCtx?.docNo;

    const [loading, setLoading] = useState<boolean>(false);
    const [isCreatingFees, setIsCreatingFees] = useState<boolean>(false);
    const [feeData, setFeeData] = useState<PatientFeeReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

    const fetchFees = async () => {
        if (!targetId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await healthCheckService.getDocumentFees(targetId);
            if (res.success) {
                setFeeData(res);
            } else {
                setError(res.message || 'Không tìm thấy thông tin chi phí của hồ sơ');
            }
        } catch (err: any) {
            console.error('Lỗi khi tải chi phí:', err);
            setError(err.message || 'Lỗi kết nối khi tải danh mục chi phí bệnh nhân');
            toast.error('Không thể tải dữ liệu chi phí từ HIS');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFees = async () => {
        const docNo = targetId || dynamicCtx?.docNo || childCtx?.docNo || initialData?.doc_no;
        if (!docNo) {
            toast.error("Không xác định được số hồ sơ (doc_no) để tạo lập phí.");
            return;
        }

        setIsCreatingFees(true);
        const toastId = toast.loading("Đang gọi thủ tục tạo lập mục phí (hms_fee_create) từ HIS...");
        try {
            const res = await healthCheckService.createDocumentFees(Number(docNo));
            if (res.success) {
                toast.success(res.message || "Đã tạo lập mục phí thành công!", { id: toastId });
                await fetchFees();
            } else {
                toast.error(res.message || "Tạo lập mục phí thất bại.", { id: toastId });
            }
        } catch (err: any) {
            toast.error("Lỗi tạo lập mục phí: " + err.message, { id: toastId });
        } finally {
            setIsCreatingFees(false);
        }
    };

    useEffect(() => {
        fetchFees();
    }, [targetId]);

    // Danh sách các nhóm dịch vụ
    const groups = useMemo(() => {
        if (!feeData?.groups) return [];
        return feeData.groups;
    }, [feeData]);

    // Lọc danh sách dịch vụ theo từ khóa và nhóm
    const filteredItems = useMemo(() => {
        if (!feeData?.items) return [];
        return feeData.items.filter((item: PatientFeeItem) => {
            const matchesGroup = selectedGroup === 'ALL' || item.group_name === selectedGroup;
            if (!matchesGroup) return false;

            if (!searchTerm.trim()) return true;
            const term = removeVietnameseTones(searchTerm.trim().toLowerCase());
            const itemName = removeVietnameseTones((item.item_name || '').toLowerCase());
            const itemId = removeVietnameseTones((item.item_id || '').toLowerCase());
            const groupName = removeVietnameseTones((item.group_name || '').toLowerCase());

            return itemName.includes(term) || itemId.includes(term) || groupName.includes(term);
        });
    }, [feeData, searchTerm, selectedGroup]);

    // Tính tổng tiền BHYT của danh sách đang hiển thị
    const filteredInsuranceTotal = useMemo(() => {
        return filteredItems.reduce((sum, item) => sum + item.total_ins_cost, 0);
    }, [filteredItems]);

    // Tính tổng tiền Viện phí của danh sách đang hiển thị
    const filteredServiceTotal = useMemo(() => {
        return filteredItems.reduce((sum, item) => sum + item.total_cost, 0);
    }, [filteredItems]);

    return (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
            {/* 1. Header Banner & KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Tổng chi phí BHYT (Đơn giá bảo hiểm) - NỔI BẬT THEO YÊU CẦU */}
                <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-emerald-600 via-teal-700 to-teal-800 text-white shadow-lg shadow-teal-900/10 border border-teal-500/30">
                    <div className="absolute -right-3 -top-3 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md text-emerald-100 uppercase tracking-wider">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                            Đơn giá BHYT quy định
                        </span>
                        <Receipt className="w-7 h-7 text-emerald-200/50" />
                    </div>
                    <div className="mt-3">
                        <div className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                            {formatCurrency(feeData?.totalInsuranceCost ?? 0)}
                        </div>
                        <p className="mt-1 text-xs text-teal-100/90 font-medium">
                            Tổng chi phí dịch vụ tính theo mức thanh toán BHYT
                        </p>
                    </div>
                </div>

                {/* Card 2: Tổng chi phí Viện phí */}
                <div className="rounded-2xl p-5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            Giá viện phí / Dịch vụ
                        </span>
                        <DollarSign className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                            {formatCurrency(feeData?.totalServiceCost ?? 0)}
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Tổng giá viện phí áp dụng tại cơ sở y tế
                        </p>
                    </div>
                </div>

                {/* Card 3: Số lượng dịch vụ và nhóm */}
                <div className="rounded-2xl p-5 bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                            <Layers className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            Tổng số dịch vụ sử dụng
                        </span>
                        <FileSpreadsheet className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                    </div>
                    <div className="mt-3">
                        <div className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                            {feeData?.totalItems ?? 0} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">dịch vụ</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Phân bổ trong {groups.length} nhóm dịch vụ kỹ thuật
                        </p>
                    </div>
                </div>
            </div>

            {/* 2. Group Pills Quick Filter */}
            {groups.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-xs border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
                        <button
                            type="button"
                            onClick={() => setSelectedGroup('ALL')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                selectedGroup === 'ALL'
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                            }`}
                        >
                            <span>Tất cả</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                selectedGroup === 'ALL' ? 'bg-teal-700 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                            }`}>
                                {feeData?.totalItems || 0}
                            </span>
                        </button>
                        {groups.map(g => {
                            const isSelected = selectedGroup === g.group_name;
                            return (
                                <button
                                    key={g.group_name}
                                    type="button"
                                    onClick={() => setSelectedGroup(g.group_name)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                                        isSelected
                                            ? 'bg-teal-600 text-white shadow-xs'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    <span>{g.group_name}</span>
                                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                        isSelected ? 'bg-teal-700 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                                    }`}>
                                        {g.count}
                                    </span>
                                    <span className={`text-[11px] font-semibold ${isSelected ? 'text-teal-100' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        ({formatCurrency(g.total_ins_cost)})
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 3. Search & Actions Toolbar */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-3.5 shadow-xs border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-96">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm dịch vụ theo tên, mã dịch vụ..."
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                        type="button"
                        onClick={handleCreateFees}
                        disabled={loading || isCreatingFees}
                        className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                        title="Tạo lập lại toàn bộ mục phí từ các chỉ định trên HIS"
                    >
                        <Layers className={`w-3.5 h-3.5 ${isCreatingFees ? 'animate-spin' : ''}`} />
                        <span>Tạo lập mục phí</span>
                    </button>

                    <button
                        type="button"
                        onClick={fetchFees}
                        disabled={loading}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Đồng bộ lại chi phí mới nhất từ HIS"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
                        <span>Làm mới dữ liệu</span>
                    </button>
                </div>
            </div>

            {/* 4. Table of Services */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 overflow-hidden">
                {loading ? (
                    <div className="py-16 flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="w-8 h-8 text-teal-600 animate-spin" />
                        <span className="text-xs font-medium text-slate-500">Đang truy vấn bảng kê chi phí từ hệ thống HIS...</span>
                    </div>
                ) : error ? (
                    <div className="py-12 px-6 flex flex-col items-center justify-center gap-2 text-center">
                        <AlertCircle className="w-9 h-9 text-rose-500" />
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Không thể tải thông tin chi phí</span>
                        <span className="text-xs text-slate-500 max-w-md">{error}</span>
                        <button
                            type="button"
                            onClick={fetchFees}
                            className="mt-3 px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="py-16 px-6 flex flex-col items-center justify-center gap-2 text-center">
                        <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Chưa có dịch vụ nào phát sinh chi phí</span>
                        <span className="text-xs text-slate-400 max-w-sm">
                            {searchTerm || selectedGroup !== 'ALL'
                                ? 'Không tìm thấy dịch vụ phù hợp với bộ lọc hiện tại'
                                : 'Hồ sơ bệnh nhân chưa được chỉ định dịch vụ hoặc chưa có dữ liệu phí ghi nhận trong HIS.'}
                        </span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-bold">
                                    <th className="py-3 px-3 w-12 text-center">STT</th>
                                    <th className="py-3 px-3 w-24">Mã DV</th>
                                    <th className="py-3 px-3 min-w-[240px]">Tên dịch vụ y tế / Kỹ thuật</th>
                                    <th className="py-3 px-3 w-40">Nhóm dịch vụ</th>
                                    <th className="py-3 px-3 w-16 text-center">ĐVT</th>
                                    <th className="py-3 px-3 w-16 text-center">SL</th>
                                    <th className="py-3 px-3 text-right text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 font-extrabold">
                                        Đơn giá BHYT
                                    </th>
                                    <th className="py-3 px-3 text-right text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20 font-extrabold">
                                        Thành tiền BHYT
                                    </th>
                                    <th className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">Đơn giá VP</th>
                                    <th className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">Thành tiền VP</th>
                                    <th className="py-3 px-3 w-28 text-center">Ngày CĐ</th>
                                    <th className="py-3 px-3 w-24 text-center">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredItems.map((item, idx) => (
                                    <tr 
                                        key={`${item.fee_id}-${idx}`}
                                        className="hover:bg-teal-50/30 dark:hover:bg-slate-700/40 transition-colors"
                                    >
                                        <td className="py-2.5 px-3 text-center text-slate-400 font-semibold">{idx + 1}</td>
                                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 font-bold">
                                            {item.item_id}
                                        </td>
                                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">
                                            {item.item_name}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 font-medium">
                                                <Tag className="w-2.5 h-2.5 text-slate-400" />
                                                {item.group_name}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-400 font-medium">
                                            {item.unit || 'Lần'}
                                        </td>
                                        <td className="py-2.5 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                                            {item.quantity}
                                        </td>
                                        
                                        {/* ĐƠN GIÁ BHYT (QUAN TRỌNG) */}
                                        <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/10">
                                            {formatCurrency(item.ins_price)}
                                        </td>

                                        {/* THÀNH TIỀN BHYT (QUAN TRỌNG) */}
                                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20">
                                            {formatCurrency(item.total_ins_cost)}
                                        </td>

                                        <td className="py-2.5 px-3 text-right text-slate-500 dark:text-slate-400">
                                            {formatCurrency(item.unit_price)}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                                            {formatCurrency(item.total_cost)}
                                        </td>
                                        <td className="py-2.5 px-3 text-center text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {formatDate(item.fee_date)}
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                                                <CheckCircle2 className="w-3 h-3" />
                                                {item.status === 'P' ? 'Đã thu' : item.status === 'O' ? 'Chỉ định' : (item.status || 'Hợp lệ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            {/* Summary Footer */}
                            <tfoot>
                                <tr className="bg-slate-100/95 dark:bg-slate-900 font-bold border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white">
                                    <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                                        Tổng cộng ({filteredItems.length} dịch vụ):
                                    </td>
                                    <td className="py-3 px-3 text-center font-extrabold">
                                        {filteredItems.reduce((acc, it) => acc + it.quantity, 0)}
                                    </td>
                                    <td className="py-3 px-3 text-right text-emerald-800 dark:text-emerald-300 bg-emerald-100/40 dark:bg-emerald-950/30">
                                        ---
                                    </td>
                                    <td className="py-3 px-3 text-right text-sm font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/40">
                                        {formatCurrency(filteredInsuranceTotal)}
                                    </td>
                                    <td className="py-3 px-3 text-right text-slate-500">
                                        ---
                                    </td>
                                    <td className="py-3 px-3 text-right text-sm font-extrabold text-slate-800 dark:text-slate-200">
                                        {formatCurrency(filteredServiceTotal)}
                                    </td>
                                    <td colSpan={2} className="py-3 px-3"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Note & Explanation */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                    <span className="font-bold">Ghi chú nghiệp vụ BHYT: </span>
                    Đơn giá bảo hiểm y tế hiển thị theo danh mục kỹ thuật và mức giá thanh toán BHYT đã được cấu hình trong hệ thống HIS (bảng <code className="font-mono font-bold bg-emerald-100/80 dark:bg-emerald-900/40 px-1 py-0.5 rounded">hms_fee</code> &amp; <code className="font-mono font-bold bg-emerald-100/80 dark:bg-emerald-900/40 px-1 py-0.5 rounded">hms_fee_list</code>). Các dịch vụ được trích xuất trực tiếp theo số hồ sơ đợt khám của bệnh nhân.
                </div>
            </div>
        </div>
    );
};

export default FeeTab;
