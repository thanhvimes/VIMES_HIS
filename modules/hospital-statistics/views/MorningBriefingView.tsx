// ==================== EXECUTIVE MORNING BRIEFING VIEW ====================
// File: modules/hospital-statistics/views/MorningBriefingView.tsx
// Bản tin giao ban 24h phục vụ họp giao ban lãnh đạo viện 07h00 sáng

import React, { useState, useEffect, useMemo } from 'react';
import { PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { ExecutiveMorningBriefingData } from '../types';
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    PieChart, 
    Pie, 
    Cell, 
    XAxis, 
    YAxis, 
    Tooltip, 
    Legend, 
    ReferenceLine, 
    CartesianGrid 
} from 'recharts';
import { 
    BuildingOfficeIcon, 
    UserGroupIcon, 
    HeartIcon, 
    SparklesIcon, 
    ArrowPathIcon,
    AlertCircleIcon,
    CheckIcon,
    ScissorsIcon,
    InformationCircleIcon,
    ClipboardListIcon
} from '../../../components/Icons';

export const MorningBriefingView: React.FC = () => {
    const todayStr = formatLocalDate(new Date());
    const [briefingDate, setBriefingDate] = useState<string>(todayStr);
    const [loading, setLoading] = useState<boolean>(false);
    const [data, setData] = useState<ExecutiveMorningBriefingData | null>(null);
    const [donutTab, setDonutTab] = useState<'exam' | 'surgery' | 'inpatient'>('exam');

    const fetchData = async (dateVal?: string) => {
        const target = dateVal || briefingDate;
        setLoading(true);
        try {
            const res = await statisticsService.getExecutiveMorningBriefing(target);
            setData(res);
        } catch (error) {
            console.error('Error fetching morning briefing:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(briefingDate);
    }, [briefingDate]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportExcel = () => {
        if (!data) return;
        const examRows: any[] = [
            { 'Hạng Mục': 'Khám Bệnh', 'Chỉ Số': 'Tổng số khám', 'Giá Trị': data.examination.tong_kham },
            { 'Hạng Mục': 'Khám Bệnh', 'Chỉ Số': 'Khám BHYT', 'Giá Trị': data.examination.kham_bhyt },
            { 'Hạng Mục': 'Khám Bệnh', 'Chỉ Số': 'Khám Viện phí / Dịch vụ', 'Giá Trị': data.examination.kham_dichvu },
            { 'Hạng Mục': 'Khám Bệnh', 'Chỉ Số': 'Cấp cứu', 'Giá Trị': data.examination.cap_cuu },
            { 'Hạng Mục': 'Khám Bệnh', 'Chỉ Số': 'Chỉ định nhập viện', 'Giá Trị': data.examination.chi_dinh_nhap_vien },
            { 'Hạng Mục': 'Khám Bệnh', 'Chỉ Số': 'Chuyển viện ngoại trú', 'Giá Trị': data.examination.chuyen_vien_ngoai_tru },
            { 'Hạng Mục': 'Nội Trú', 'Chỉ Số': 'Bệnh nhân vào viện mới', 'Giá Trị': data.inpatient.vao_vien },
            { 'Hạng Mục': 'Nội Trú', 'Chỉ Số': 'Bệnh nhân ra viện', 'Giá Trị': data.inpatient.ra_vien },
            { 'Hạng Mục': 'Nội Trú', 'Chỉ Số': 'Chuyển tuyến trên', 'Giá Trị': data.inpatient.chuyen_tuyen_noi_tru },
            { 'Hạng Mục': 'Nội Trú', 'Chỉ Số': 'Tử vong', 'Giá Trị': data.inpatient.tu_vong },
            { 'Hạng Mục': 'Nội Trú', 'Chỉ Số': 'Hiện diện điều trị', 'Giá Trị': data.inpatient.hien_dien_hien_tai },
            { 'Hạng Mục': 'Phẫu Thuật', 'Chỉ Số': 'Tổng ca PTTT', 'Giá Trị': data.surgery.tong_ca_pttt },
            { 'Hạng Mục': 'Phẫu Thuật', 'Chỉ Số': 'Mổ cấp cứu', 'Giá Trị': data.surgery.mo_cap_cuu },
            { 'Hạng Mục': 'Phẫu Thuật', 'Chỉ Số': 'Mổ phiên', 'Giá Trị': data.surgery.mo_phien },
            { 'Hạng Mục': 'Phẫu Thuật', 'Chỉ Số': 'Thủ thuật', 'Giá Trị': data.surgery.thu_thuat },
            { 'Hạng Mục': 'Giường Bệnh', 'Chỉ Số': 'Tổng giường kế hoạch', 'Giá Trị': data.bed_status.total_planned_beds },
            { 'Hạng Mục': 'Giường Bệnh', 'Chỉ Số': 'Công suất sử dụng (%)', 'Giá Trị': `${data.bed_status.occupancy_rate}%` }
        ];

        if (data.surgeries_list && data.surgeries_list.length > 0) {
            data.surgeries_list.forEach(s => {
                examRows.push({
                    'Hạng Mục': 'Ca Phẫu Thuật',
                    'Chỉ Số': `${s.docno} - ${s.patient_name}`,
                    'Giá Trị': `${s.operation_name} | BS: ${s.doctor_name} | ${s.operation_type === 'EMERGENCY' ? 'Cấp cứu' : 'Mổ phiên'}`
                });
            });
        }

        if (data.deaths_list && data.deaths_list.length > 0) {
            data.deaths_list.forEach(d => {
                examRows.push({
                    'Hạng Mục': 'Ca Tử Vong',
                    'Chỉ Số': `${d.docno} - ${d.patient_name} (${d.dept_name})`,
                    'Giá Trị': `${d.death_time} | ${d.death_cause} (${d.death_icd})`
                });
            });
        }

        exportTableToExcel(examRows, `Ban_Tin_Giao_Ban_${briefingDate}`, 'Giao Ban 24h');
    };

    const exam = data?.examination;
    const inp = data?.inpatient;
    const sur = data?.surgery;
    const bed = data?.bed_status;

    // 1. Bed Occupancy Bar Chart Data
    const bedChartData = useMemo(() => {
        const list = bed?.all_depts || [
            ...(bed?.overloaded_depts || []),
            ...(bed?.near_capacity_depts || []),
            ...(bed?.optimal_depts || []),
            ...(bed?.available_depts || [])
        ];
        return list.map((d: any) => {
            const plan = Number(d.giuong_ke_hoach || 0);
            const active = Number(d.bn_dang_nam || 0);
            const rate = Number(d.ty_le_cong_suat || 0);

            // Clean shortened name for display without awkward wrapping
            let shortName = d.dept_name || '';
            if (shortName.includes('Liên chuyên khoa')) {
                shortName = 'Khoa Liên CK (TMH-RHM-Mắt)';
            } else if (shortName.includes('Chăm sóc sức khỏe sinh sản')) {
                shortName = 'Khoa CSSK Sinh Sản';
            }

            return {
                dept_id: d.dept_id,
                dept_name: d.dept_name,
                short_dept_name: shortName,
                giuong_ke_hoach: plan,
                bn_dang_nam: active,
                ty_le_cong_suat: rate,
                status: rate > 100 ? 'OVERLOAD' : rate >= 90 ? 'NEAR' : rate >= 80 ? 'OPTIMAL' : 'AVAILABLE'
            };
        }).sort((a: any, b: any) => b.ty_le_cong_suat - a.ty_le_cong_suat);
    }, [bed]);

    // 2. Outpatient Donut Chart Data
    const examDonutData = useMemo(() => {
        if (!exam) return [];
        return [
            { name: 'Khám BHYT', value: exam.kham_bhyt, color: '#2563EB' },
            { name: 'Khám Dịch Vụ', value: exam.kham_dichvu, color: '#F59E0B' },
            { name: 'Cấp Cứu 🚨', value: exam.cap_cuu, color: '#EF4444' },
            { name: 'Chỉ Định Vào Viện', value: exam.chi_dinh_nhap_vien, color: '#10B981' }
        ].filter(d => d.value > 0);
    }, [exam]);

    // 3. Surgery Donut Chart Data
    const surgeryDonutData = useMemo(() => {
        if (!sur) return [];
        return [
            { name: 'Mổ Cấp Cứu 🚨', value: sur.mo_cap_cuu, color: '#EF4444' },
            { name: 'Mổ Phiên', value: sur.mo_phien, color: '#3B82F6' },
            { name: 'Thủ Thuật', value: sur.thu_thuat, color: '#10B981' }
        ].filter(d => d.value > 0);
    }, [sur]);

    // 4. Inpatient Movement Donut Data
    const inpatientDonutData = useMemo(() => {
        if (!inp) return [];
        return [
            { name: 'Vào Viện Mới', value: inp.vao_vien, color: '#3B82F6' },
            { name: 'Ra Viện', value: inp.ra_vien, color: '#10B981' },
            { name: 'Chuyển Tuyến Trên', value: inp.chuyen_tuyen_noi_tru, color: '#F59E0B' },
            { name: 'Tử Vong 🚨', value: inp.tu_vong, color: '#EF4444' }
        ].filter(d => d.value > 0);
    }, [inp]);

    // Center KPI info for Donut Chart
    const donutCenterInfo = useMemo(() => {
        if (donutTab === 'exam') {
            return {
                value: (exam?.tong_kham || 0).toLocaleString('vi-VN'),
                label: 'Lượt Khám'
            };
        } else if (donutTab === 'surgery') {
            return {
                value: (sur?.tong_ca_pttt || 0).toLocaleString('vi-VN'),
                label: 'Ca PTTT'
            };
        } else {
            const movementTotal = (inp?.vao_vien || 0) + (inp?.ra_vien || 0) + (inp?.chuyen_tuyen_noi_tru || 0) + (inp?.tu_vong || 0);
            return {
                value: movementTotal.toLocaleString('vi-VN'),
                label: 'Biến Động'
            };
        }
    }, [donutTab, exam, sur, inp]);

    const showDateSuggestion = Boolean(
        data?.latest_active_date && 
        data.latest_active_date !== briefingDate && 
        (exam?.tong_kham || 0) < 10
    );

    return (
        <div className="w-full space-y-4">
            {/* IN-PRINT HEADER */}
            <PrintReportHeader 
                title="BẢN TIN GIAO BAN BỆNH VIỆN (24 GIỜ QUA)"
                subtitle="Số liệu tổng hợp báo cáo giao ban sáng Ban Giám đốc và Lãnh đạo các Khoa/Phòng"
                fromDate={briefingDate}
                toDate={briefingDate}
                formCode="BM-GB-01/KHTH"
                departmentName="PHÒNG KẾ HOẠCH TỔNG HỢP"
            />

            {/* SCREEN CONTROLS BAR */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs print:hidden">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
                        <ClipboardListIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-slate-900 dark:text-white">
                                Bản Tin Giao Ban Sáng (24h Flash Report)
                            </h2>
                            <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full">
                                Họp 07h00
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Tự động trích xuất dữ liệu lâm sàng, buồng bệnh, mổ cấp cứu và biến động nội trú
                        </p>
                    </div>
                </div>

                {/* Date Picker & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                        <span className="text-slate-500 font-medium">Ngày giao ban:</span>
                        <input
                            type="date"
                            value={briefingDate}
                            onChange={(e) => setBriefingDate(e.target.value)}
                            className="bg-transparent border-none text-slate-800 dark:text-slate-200 font-semibold focus:outline-hidden cursor-pointer"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            const y = new Date();
                            y.setDate(y.getDate() - 1);
                            setBriefingDate(formatLocalDate(y));
                        }}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                        Hôm qua
                    </button>

                    <button
                        type="button"
                        onClick={() => setBriefingDate(todayStr)}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-blue-600 dark:text-blue-400 font-semibold"
                    >
                        Hôm nay
                    </button>

                    <button
                        type="button"
                        onClick={() => fetchData()}
                        disabled={loading}
                        className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition"
                        title="Tải lại dữ liệu"
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
                    </button>

                    <button
                        type="button"
                        onClick={handleExportExcel}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 transition"
                    >
                        <span>📗</span> Xuất Excel
                    </button>

                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-xl hover:bg-slate-800 transition shadow-xs"
                    >
                        <span>🖨️</span> In Bản Tin A4
                    </button>
                </div>
            </div>

            {/* NOTICE / SUGGESTION IF CURRENT DATE HAS NO EXAM DATA */}
            {showDateSuggestion && (
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-2">
                        <AlertCircleIcon className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                            Ngày {briefingDate} có ít hoạt động ghi nhận. Đợt khám và hoạt động tập trung gần nhất trong hệ thống là ngày <strong>{data?.latest_active_date}</strong>.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => data?.latest_active_date && setBriefingDate(data.latest_active_date)}
                        className="underline font-bold hover:text-amber-900 shrink-0 ml-2"
                    >
                        Xem số liệu ngày {data?.latest_active_date} →
                    </button>
                </div>
            )}

            {/* 4 CORE EXECUTIVE FLASH CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 print:grid-cols-4">
                {/* CARD 1: KHÁM BỆNH & CẤP CỨU */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            1. KHÁM BỆNH (24H)
                        </span>
                        <span className="p-1.5 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                            <UserGroupIcon className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                        {loading ? '...' : (exam?.tong_kham || 0).toLocaleString('vi-VN')}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">lượt</span>
                    </div>
                    <div className="space-y-1 text-xs border-t border-slate-100 dark:border-slate-700/60 pt-2">
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>BHYT / Viện phí:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                                {exam?.kham_bhyt || 0} / {exam?.kham_dichvu || 0}
                            </span>
                        </div>
                        <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
                            <span className="flex items-center gap-1">🚨 Tiếp nhận Cấp cứu:</span>
                            <span className="font-bold">{exam?.cap_cuu || 0}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>Chỉ định vào viện:</span>
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{exam?.chi_dinh_nhap_vien || 0}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>Chuyển tuyến ngoài:</span>
                            <span className="font-semibold">{exam?.chuyen_vien_ngoai_tru || 0}</span>
                        </div>
                    </div>
                </div>

                {/* CARD 2: ĐIỀU TRỊ NỘI TRÚ */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            2. NỘI TRÚ (24H)
                        </span>
                        <span className="p-1.5 bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-lg">
                            <HeartIcon className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                        {loading ? '...' : (inp?.hien_dien_hien_tai || 0).toLocaleString('vi-VN')}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">BN đang nằm</span>
                    </div>
                    <div className="space-y-1 text-xs border-t border-slate-100 dark:border-slate-700/60 pt-2">
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>Vào viện mới:</span>
                            <span className="font-bold text-blue-600 dark:text-blue-400">+{inp?.vao_vien || 0}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>Ra viện:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{inp?.ra_vien || 0}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>Chuyển tuyến trên:</span>
                            <span className="font-semibold">{inp?.chuyen_tuyen_noi_tru || 0}</span>
                        </div>
                        <div className={`flex justify-between font-bold ${(inp?.tu_vong || 0) > 0 ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1 py-0.5 rounded' : 'text-slate-600 dark:text-slate-300'}`}>
                            <span>Tử vong:</span>
                            <span>{inp?.tu_vong || 0}</span>
                        </div>
                    </div>
                </div>

                {/* CARD 3: PHẪU THUẬT & THỦ THUẬT */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            3. PHẪU THUẬT (24H)
                        </span>
                        <span className="p-1.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg">
                            <SparklesIcon className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                        {loading ? '...' : (sur?.tong_ca_pttt || 0).toLocaleString('vi-VN')}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">ca thực hiện</span>
                    </div>
                    <div className="space-y-1 text-xs border-t border-slate-100 dark:border-slate-700/60 pt-2">
                        <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                            <span>🚨 Mổ cấp cứu:</span>
                            <span>{sur?.mo_cap_cuu || 0}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>Mổ phiên:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{sur?.mo_phien || 0}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>Tổng phẫu thuật:</span>
                            <span className="font-semibold">{sur?.tong_phau_thuat || 0}</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-300">
                            <span>Thủ thuật:</span>
                            <span className="font-semibold">{sur?.thu_thuat || 0}</span>
                        </div>
                    </div>
                </div>

                {/* CARD 4: CÔNG SUẤT BUỒNG BỆNH TOÀN VIỆN */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            4. CÔNG SUẤT GIƯỜNG BỆNH
                        </span>
                        <span className="p-1.5 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg">
                            <BuildingOfficeIcon className="w-4 h-4" />
                        </span>
                    </div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mb-2 flex items-baseline gap-2">
                        {loading ? '...' : `${bed?.occupancy_rate || 0}%`}
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                            ({bed?.total_patients || 0}/{bed?.total_planned_beds || 0} giường)
                        </span>
                    </div>
                    <div className="space-y-1 text-xs border-t border-slate-100 dark:border-slate-700/60 pt-2">
                        <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold">
                            <span>Khoa quá tải (&gt;100%):</span>
                            <span>{bed?.overloaded_depts?.length || 0} khoa</span>
                        </div>
                        <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                            <span>Khoa cận tải (90-100%):</span>
                            <span>{bed?.near_capacity_depts?.length || 0} khoa</span>
                        </div>
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                            <span>Khoa sẵn sàng (&lt;80%):</span>
                            <span>{bed?.available_depts?.length || 0} khoa</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== CHARTS SECTION (EXECUTIVE VISUAL INTELLIGENCE) ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 print:hidden">
                {/* CHART 1: CÔNG SUẤT GIƯỜNG BỆNH CÁC KHOA (BAR CHART WITH LABELS & THRESHOLDS) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60 gap-2">
                            <div>
                                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                                    <span>📊</span> Biểu Đồ Công Suất Giường Bệnh Các Khoa Lâm Sàng (%)
                                </h3>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                    Tỷ lệ bệnh nhân đang nằm trên số giường kế hoạch của từng khoa điều trị
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                                <span className="flex items-center gap-1 text-rose-600">
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> &gt;100% (Quá tải)
                                </span>
                                <span className="flex items-center gap-1 text-amber-600">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 90-100% (Cận tải)
                                </span>
                                <span className="flex items-center gap-1 text-emerald-600">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> &lt;80% (Còn giường)
                                </span>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="h-72 w-full mt-3">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={bedChartData}
                                    margin={{ top: 10, right: 45, left: 10, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" opacity={0.6} />
                                    <XAxis 
                                        type="number" 
                                        domain={[0, (dataMax: number) => Math.max(125, Math.ceil(dataMax + 15))]}
                                        unit="%" 
                                        tick={{ fontSize: 11, fill: '#64748B' }} 
                                    />
                                    <YAxis 
                                        type="category" 
                                        dataKey="short_dept_name" 
                                        width={170} 
                                        tick={{ fontSize: 11, fill: '#334155' }}
                                    />
                                    <Tooltip 
                                        formatter={(val: any, name: any, item: any) => [
                                            `${val}% (${item.payload.bn_dang_nam}/${item.payload.giuong_ke_hoach} giường)`,
                                            'Công Suất'
                                        ]}
                                    />
                                    <ReferenceLine x={100} stroke="#EF4444" strokeDasharray="4 4" label={{ value: '100% Quá tải', position: 'insideTopRight', fill: '#EF4444', fontSize: 10 }} />
                                    <ReferenceLine x={80} stroke="#10B981" strokeDasharray="4 4" label={{ value: '80% An toàn', position: 'insideTopRight', fill: '#10B981', fontSize: 10 }} />
                                    <Bar 
                                        dataKey="ty_le_cong_suat" 
                                        radius={[0, 6, 6, 0]}
                                        barSize={18}
                                        label={{ position: 'right', fill: '#334155', fontSize: 10, fontWeight: 700, formatter: (val: any) => `${val}%` }}
                                    >
                                        {bedChartData.map((entry: any, index: number) => {
                                            const color = entry.ty_le_cong_suat > 100 
                                                ? '#EF4444' 
                                                : entry.ty_le_cong_suat >= 90 
                                                ? '#F59E0B' 
                                                : entry.ty_le_cong_suat >= 80 
                                                ? '#3B82F6' 
                                                : '#10B981';
                                            return <Cell key={`cell-${index}`} fill={color} />;
                                        })}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* CHART 2: CƠ CẤU HOẠT ĐỘNG 24H (DONUT CHARTS WITH CENTER KPI + 3 TABS) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                                <span>🍩</span> Cơ Cấu Hoạt Động Lâm Sàng 24h
                            </h3>
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg text-xs">
                                <button
                                    type="button"
                                    onClick={() => setDonutTab('exam')}
                                    className={`px-2 py-0.5 rounded-md font-semibold transition ${donutTab === 'exam' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-500'}`}
                                >
                                    Khám Bệnh
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDonutTab('surgery')}
                                    className={`px-2 py-0.5 rounded-md font-semibold transition ${donutTab === 'surgery' ? 'bg-white dark:bg-slate-800 text-purple-600 shadow-xs' : 'text-slate-500'}`}
                                >
                                    Phẫu Thuật
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDonutTab('inpatient')}
                                    className={`px-2 py-0.5 rounded-md font-semibold transition ${donutTab === 'inpatient' ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-xs' : 'text-slate-500'}`}
                                >
                                    Nội Trú
                                </button>
                            </div>
                        </div>

                        {/* Donut Chart Content with Center KPI Indicator */}
                        <div className="h-72 w-full flex items-center justify-center relative mt-3">
                            {/* Executive Center Counter */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                                <span className="text-2xl font-black text-slate-800 dark:text-white">
                                    {donutCenterInfo.value}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    {donutCenterInfo.label}
                                </span>
                            </div>

                            {donutTab === 'exam' ? (
                                examDonutData.length === 0 ? (
                                    <div className="text-xs text-slate-400 text-center">Chưa có lượt khám phát sinh trong ngày</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={examDonutData}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={55}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {examDonutData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val: any) => [`${val} lượt`, 'Số lượng']} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )
                            ) : donutTab === 'surgery' ? (
                                surgeryDonutData.length === 0 ? (
                                    <div className="text-xs text-slate-400 text-center">Chưa có ca phẫu thuật / thủ thuật phát sinh trong ngày</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={surgeryDonutData}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={55}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {surgeryDonutData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val: any) => [`${val} ca`, 'Số lượng']} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )
                            ) : (
                                inpatientDonutData.length === 0 ? (
                                    <div className="text-xs text-slate-400 text-center">Chưa có biến động nội trú phát sinh trong ngày</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={inpatientDonutData}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={55}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {inpatientDonutData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val: any) => [`${val} người`, 'Số lượng']} />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== 3-TIER BED CAPACITY MANAGEMENT (GIÁM SÁT & ĐIỀU PHỐI BUỒNG BỆNH) ==================== */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. CÁC KHOA QUÁ TẢI (>100%) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2">
                        <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wide flex items-center gap-1.5">
                            <AlertCircleIcon className="w-4 h-4" />
                            Khoa báo động quá tải (&gt; 100% CSG)
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 rounded-full">
                            {bed?.overloaded_depts?.length || 0} khoa
                        </span>
                    </div>

                    {(!bed?.overloaded_depts || bed.overloaded_depts.length === 0) ? (
                        <div className="py-6 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ Không có khoa nào vượt 100% công suất giường.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-500 dark:text-slate-400">
                                        <th className="py-2 px-2">Khoa Điều Trị</th>
                                        <th className="py-2 px-2 text-right">Giường KH</th>
                                        <th className="py-2 px-2 text-right">Đang Nằm</th>
                                        <th className="py-2 px-2 text-right">Công Suất</th>
                                        <th className="py-2 px-2 text-right">Vượt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {bed.overloaded_depts.map((d: any) => (
                                        <tr key={d.dept_id} className="hover:bg-rose-50/50 dark:hover:bg-rose-950/20">
                                            <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200">{d.dept_name}</td>
                                            <td className="py-2 px-2 text-right">{d.giuong_ke_hoach}</td>
                                            <td className="py-2 px-2 text-right font-bold text-rose-600 dark:text-rose-400">{d.bn_dang_nam}</td>
                                            <td className="py-2 px-2 text-right font-bold text-rose-600 dark:text-rose-400">{d.ty_le_cong_suat}%</td>
                                            <td className="py-2 px-2 text-right font-semibold text-rose-700">
                                                +{Number(d.bn_dang_nam || 0) - Number(d.giuong_ke_hoach || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* 2. CÁC KHOA CẬN TẢI (90% - 100%) -> ĐIỀU TIẾT KỊP THỜI */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200/80 dark:border-amber-700/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-amber-100 dark:border-amber-700/60 pb-2">
                        <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                            <AlertCircleIcon className="w-4 h-4 text-amber-500" />
                            Khoa cận quá tải (90% - 100% CSG)
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-full">
                            {bed?.near_capacity_depts?.length || 0} khoa
                        </span>
                    </div>

                    {(!bed?.near_capacity_depts || bed.near_capacity_depts.length === 0) ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                            ✓ Không có khoa nào trong ngưỡng cận tải (90% - 100%).
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-500 dark:text-slate-400">
                                            <th className="py-2 px-2">Khoa Điều Trị</th>
                                            <th className="py-2 px-2 text-right">Giường KH</th>
                                            <th className="py-2 px-2 text-right">Đang Nằm</th>
                                            <th className="py-2 px-2 text-right">Công Suất</th>
                                            <th className="py-2 px-2 text-right">Còn Lại</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-100 dark:divide-amber-900/30">
                                        {bed.near_capacity_depts.map((d: any) => (
                                            <tr key={d.dept_id} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/20">
                                                <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200">{d.dept_name}</td>
                                                <td className="py-2 px-2 text-right">{d.giuong_ke_hoach}</td>
                                                <td className="py-2 px-2 text-right font-bold text-amber-600 dark:text-amber-400">{d.bn_dang_nam}</td>
                                                <td className="py-2 px-2 text-right font-bold text-amber-600 dark:text-amber-400">{d.ty_le_cong_suat}%</td>
                                                <td className="py-2 px-2 text-right font-bold text-amber-700">
                                                    {Math.max(0, Number(d.giuong_ke_hoach || 0) - Number(d.bn_dang_nam || 0))} giường
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300">
                                💡 <strong>Khuyến nghị:</strong> Cân nhắc điều phối bệnh nhân nhẹ hoặc chuẩn bị phương án kê thêm giường dự phòng trước khi quá tải.
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. CÁC KHOA CÒN NHIỀU GIƯỜNG SẴN SÀNG TIẾP NHẬN (<80%) */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-700/60 pb-2">
                        <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                            <CheckIcon className="w-4 h-4 text-emerald-500" />
                            Khoa sẵn sàng tiếp nhận (&lt; 80% CSG)
                        </h3>
                        <span className="px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-full">
                            {bed?.available_depts?.length || 0} khoa
                        </span>
                    </div>

                    {(!bed?.available_depts || bed.available_depts.length === 0) ? (
                        <div className="py-6 text-center text-xs text-slate-500">
                            Tất cả các khoa đều trên 80% công suất giường.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-500 dark:text-slate-400">
                                        <th className="py-2 px-2">Khoa Điều Trị</th>
                                        <th className="py-2 px-2 text-right">Giường KH</th>
                                        <th className="py-2 px-2 text-right">Đang Nằm</th>
                                        <th className="py-2 px-2 text-right">Công Suất</th>
                                        <th className="py-2 px-2 text-right">Giường Trống</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {bed.available_depts.slice(0, 6).map((d: any) => (
                                        <tr key={d.dept_id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20">
                                            <td className="py-2 px-2 font-medium text-slate-800 dark:text-slate-200">{d.dept_name}</td>
                                            <td className="py-2 px-2 text-right">{d.giuong_ke_hoach}</td>
                                            <td className="py-2 px-2 text-right text-slate-700 dark:text-slate-300">{d.bn_dang_nam}</td>
                                            <td className="py-2 px-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">{d.ty_le_cong_suat}%</td>
                                            <td className="py-2 px-2 text-right font-bold text-emerald-700 dark:text-emerald-400">
                                                {Math.max(0, Number(d.giuong_ke_hoach || 0) - Number(d.bn_dang_nam || 0))}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== CLINICAL INTELLIGENCE: TỬ VONG & PHẪU THUẬT (SỰ VỤ ĐẶC BIỆT 24H) ==================== */}
            
            {/* 1. KHẨN CẤP: BÁO CÁO CA TỬ VONG (NẾU CÓ) */}
            {((inp?.tu_vong || 0) > 0 || (data?.deaths_list && data.deaths_list.length > 0)) && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500 rounded-2xl p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-rose-200 dark:border-rose-900/60 gap-2">
                        <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-rose-600 text-white rounded-lg animate-pulse">
                                <AlertCircleIcon className="w-5 h-5" />
                            </span>
                            <div>
                                <h3 className="text-sm font-black text-rose-700 dark:text-rose-300 uppercase tracking-wide">
                                    🚨 Báo Cáo Ca Tử Vong Trong 24h ({data?.deaths_list?.length || inp?.tu_vong || 0} ca)
                                </h3>
                                <p className="text-xs text-rose-600 dark:text-rose-400">
                                    Yêu cầu Khoa chuyên môn và Hội đồng Chuyên môn hoàn thiện hồ sơ kiểm thảo tử vong theo đúng quy định Bộ Y Tế.
                                </p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 text-xs font-bold bg-rose-600 text-white rounded-lg self-start sm:self-auto">
                            Hạn kiểm thảo: 24h
                        </span>
                    </div>

                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 font-bold bg-rose-100/60 dark:bg-rose-900/30">
                                    <th className="py-2.5 px-3">Mã BA</th>
                                    <th className="py-2.5 px-3">Bệnh Nhân</th>
                                    <th className="py-2.5 px-3">Khoa Điều Trị</th>
                                    <th className="py-2.5 px-3">Thời Gian Tử Vong</th>
                                    <th className="py-2.5 px-3">Nguyên Nhân / Chẩn Đoán Tử Vong</th>
                                    <th className="py-2.5 px-3 text-center">Mã ICD-10</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-200/60 dark:divide-rose-900/40">
                                {data?.deaths_list?.map((death, idx) => (
                                    <tr key={`${death.docno}-${idx}`} className="hover:bg-rose-100/40 dark:hover:bg-rose-900/20">
                                        <td className="py-2 px-3 font-mono font-bold text-rose-700 dark:text-rose-400">{death.docno}</td>
                                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white uppercase">{death.patient_name}</td>
                                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{death.dept_name}</td>
                                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{death.death_time}</td>
                                        <td className="py-2 px-3 font-semibold text-rose-800 dark:text-rose-200">{death.death_cause}</td>
                                        <td className="py-2 px-3 text-center font-mono font-bold text-rose-600">{death.death_icd}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 2. DANH SÁCH CA PHẪU THUẬT TRONG CA TRỰC 24H */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60 gap-2">
                    <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg">
                            <ScissorsIcon className="w-4 h-4" />
                        </span>
                        <div>
                            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                                Danh Sách Phẫu Thuật Trong Ca Trực 24h
                            </h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Toàn bộ các ca phẫu thuật cấp cứu và mổ phiên thực hiện tại phòng mổ
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 rounded-full">
                            {sur?.mo_cap_cuu || 0} mổ cấp cứu
                        </span>
                        <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">
                            {sur?.mo_phien || 0} mổ phiên
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-full">
                            {sur?.thu_thuat || 0} thủ thuật
                        </span>
                    </div>
                </div>

                {(!data?.surgeries_list || data.surgeries_list.length === 0) ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                        ✓ Trong 24h qua không có ca phẫu thuật lớn nào được thực hiện (Thủ thuật: {sur?.thu_thuat || 0} ca).
                    </div>
                ) : (
                    <div className="overflow-x-auto mt-2">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-500 dark:text-slate-400 bg-slate-50/60 dark:bg-slate-900/40">
                                    <th className="py-2.5 px-3">Mã BA</th>
                                    <th className="py-2.5 px-3">Bệnh Nhân</th>
                                    <th className="py-2.5 px-3">Tên Phẫu Thuật</th>
                                    <th className="py-2.5 px-3">Thời Gian</th>
                                    <th className="py-2.5 px-3">Phẫu Thuật Viên</th>
                                    <th className="py-2.5 px-3">Khoa Lâm Sàng</th>
                                    <th className="py-2.5 px-3 text-center">Phân Loại</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {data.surgeries_list.map((s, idx) => (
                                    <tr key={`${s.docno}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                                        <td className="py-2 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">{s.docno}</td>
                                        <td className="py-2 px-3 font-bold text-slate-900 dark:text-white uppercase">{s.patient_name}</td>
                                        <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{s.operation_name}</td>
                                        <td className="py-2 px-3 text-slate-500 dark:text-slate-400">{s.order_time}</td>
                                        <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">{s.doctor_name}</td>
                                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{s.dept_name}</td>
                                        <td className="py-2 px-3 text-center">
                                            {s.operation_type === 'EMERGENCY' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300/60">
                                                    🚨 CẤP CỨU
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-300/60">
                                                    MỔ PHIÊN
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* BẢNG CHI TIẾT TỔNG KẾT BẢN TIN GIAO BAN IN TRANG A4 */}
            <div className="hidden print:block text-black text-xs mt-4" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                <table className="w-full border-collapse border border-black text-xs text-left">
                    <thead>
                        <tr className="bg-gray-100 text-center font-bold">
                            <th className="border border-black p-1.5 w-10">STT</th>
                            <th className="border border-black p-1.5">Nội Dung Chỉ Số Giao Ban</th>
                            <th className="border border-black p-1.5 w-24">Đơn Vị</th>
                            <th className="border border-black p-1.5 w-28 text-right">Số Lượng 24h</th>
                            <th className="border border-black p-1.5">Ghi Chú / Khuyến Nghị</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="font-bold bg-gray-50">
                            <td className="border border-black p-1.5 text-center">I</td>
                            <td className="border border-black p-1.5" colSpan={4}>HOẠT ĐỘNG KHÁM BỆNH & CẤP CỨU</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1.5 text-center">1</td>
                            <td className="border border-black p-1.5">Tổng số lượt khám bệnh tiếp nhận</td>
                            <td className="border border-black p-1.5 text-center">Lượt</td>
                            <td className="border border-black p-1.5 text-right font-bold">{exam?.tong_kham || 0}</td>
                            <td className="border border-black p-1.5">BHYT: {exam?.kham_bhyt || 0}, Viện phí: {exam?.kham_dichvu || 0}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1.5 text-center">2</td>
                            <td className="border border-black p-1.5">Số lượt khám cấp cứu tiếp nhận</td>
                            <td className="border border-black p-1.5 text-center">Lượt</td>
                            <td className="border border-black p-1.5 text-right font-bold text-rose-600">{exam?.cap_cuu || 0}</td>
                            <td className="border border-black p-1.5">Kịp thời xử trí, thường trực 24/24</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1.5 text-center">3</td>
                            <td className="border border-black p-1.5">Chỉ định vào viện điều trị nội trú</td>
                            <td className="border border-black p-1.5 text-center">Người</td>
                            <td className="border border-black p-1.5 text-right font-bold">{exam?.chi_dinh_nhap_vien || 0}</td>
                            <td className="border border-black p-1.5">Phân bổ theo các khoa chuyên môn</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1.5 text-center">4</td>
                            <td className="border border-black p-1.5">Chuyển viện tuyến trên (ngoại trú)</td>
                            <td className="border border-black p-1.5 text-center">Người</td>
                            <td className="border border-black p-1.5 text-right">{exam?.chuyen_vien_ngoai_tru || 0}</td>
                            <td className="border border-black p-1.5">Đảm bảo thủ tục chuyển tuyến BHYT</td>
                        </tr>

                        <tr className="font-bold bg-gray-50">
                            <td className="border border-black p-1.5 text-center">II</td>
                            <td className="border border-black p-1.5" colSpan={4}>ĐIỀU TRỊ NỘI TRÚ & BIẾN ĐỘNG BUỒNG BỆNH</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1.5 text-center">5</td>
                            <td className="border border-black p-1.5">Bệnh nhân vào viện mới trong 24h</td>
                            <td className="border border-black p-1.5 text-center">Người</td>
                            <td className="border border-black p-1.5 text-right font-bold">{inp?.vao_vien || 0}</td>
                            <td className="border border-black p-1.5">Đã làm thủ tục hồ sơ bệnh án</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1.5 text-center">6</td>
                            <td className="border border-black p-1.5">Bệnh nhân kết thúc điều trị ra viện</td>
                            <td className="border border-black p-1.5 text-center">Người</td>
                            <td className="border border-black p-1.5 text-right">{inp?.ra_vien || 0}</td>
                            <td className="border border-black p-1.5">Hoàn tất thanh quyết toán viện phí</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1.5 text-center">7</td>
                            <td className="border border-black p-1.5">Chuyển tuyến điều trị nội trú</td>
                            <td className="border border-black p-1.5 text-center">Người</td>
                            <td className="border border-black p-1.5 text-right">{inp?.chuyen_tuyen_noi_tru || 0}</td>
                            <td className="border border-black p-1.5">Theo quy chế chuyên môn chuyển viện</td>
                        </tr>
                        <tr className={(inp?.tu_vong || 0) > 0 ? 'bg-rose-50 font-bold' : ''}>
                            <td className="border border-black p-1.5 text-center">8</td>
                            <td className="border border-black p-1.5">Bệnh nhân tử vong trong 24h</td>
                            <td className="border border-black p-1.5 text-center">Người</td>
                            <td className="border border-black p-1.5 text-right font-bold">{inp?.tu_vong || 0}</td>
                            <td className="border border-black p-1.5">Kiểm thảo tử vong theo quy chế Bộ Y Tế</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1.5 text-center">9</td>
                            <td className="border border-black p-1.5">Tổng số bệnh nhân đang điều trị nội trú</td>
                            <td className="border border-black p-1.5 text-center">Người</td>
                            <td className="border border-black p-1.5 text-right font-bold">{inp?.hien_dien_hien_tai || 0}</td>
                            <td className="border border-black p-1.5">Công suất chung: {bed?.occupancy_rate || 0}% / {bed?.total_planned_beds || 0} giường KH</td>
                        </tr>

                        <tr className="font-bold bg-gray-50">
                            <td className="border border-black p-1.5 text-center">III</td>
                            <td className="border border-black p-1.5" colSpan={4}>PHẪU THUẬT - THỦ THUẬT (24H)</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1.5 text-center">10</td>
                            <td className="border border-black p-1.5">Phẫu thuật mổ cấp cứu</td>
                            <td className="border border-black p-1.5 text-center">Ca</td>
                            <td className="border border-black p-1.5 text-right font-bold">{sur?.mo_cap_cuu || 0}</td>
                            <td className="border border-black p-1.5">Cấp cứu ngoại khoa, sản khoa</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1.5 text-center">11</td>
                            <td className="border border-black p-1.5">Phẫu thuật phiên theo kế hoạch</td>
                            <td className="border border-black p-1.5 text-center">Ca</td>
                            <td className="border border-black p-1.5 text-right">{sur?.mo_phien || 0}</td>
                            <td className="border border-black p-1.5">Thực hiện theo lịch mổ phiên</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1.5 text-center">12</td>
                            <td className="border border-black p-1.5">Thủ thuật các loại</td>
                            <td className="border border-black p-1.5 text-center">Ca</td>
                            <td className="border border-black p-1.5 text-right">{sur?.thu_thuat || 0}</td>
                            <td className="border border-black p-1.5">Thực hiện tại các khoa phòng</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* IN-PRINT FOOTER (3 KÝ TÊN) */}
            <PrintReportFooter />
        </div>
    );
};
