// ==================== HOSPITAL ACTIVITY VIEW ====================
// File: modules/hospital-statistics/views/HospitalActivityView.tsx
// Standardized to GCV Ninh Binh Medical UI System & Biểu Mẫu 01/BC-BV (Bộ Y Tế)

import React, { useState, useEffect, useMemo } from 'react';
import { CommonFilter, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { HospitalActivityData } from '../types';
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    Tooltip, 
    CartesianGrid, 
    PieChart, 
    Pie, 
    Cell 
} from 'recharts';
import { 
    UserGroupIcon, 
    HeartIcon, 
    BuildingOfficeIcon, 
    SparklesIcon, 
    BeakerIcon,
    ChartBarIcon
} from '../../../components/Icons';

type SectionTab = 'ALL' | 'EXAM' | 'INP' | 'CLS' | 'SUR';

export const HospitalActivityView: React.FC = () => {
    const now = new Date();
    const [fromDate, setFromDate] = useState(`${formatLocalDate(now)} 00:00:00`);
    const [toDate, setToDate] = useState(`${formatLocalDate(now)} 23:59:59`);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<HospitalActivityData | null>(null);
    const [activeSection, setActiveSection] = useState<SectionTab>('ALL');

    // Auto scroll to top on mount
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const mainEl = document.querySelector('main');
        if (mainEl) {
            mainEl.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, []);

    const fetchData = async (overrideFrom?: string, overrideTo?: string) => {
        const from = overrideFrom || fromDate;
        const to = overrideTo || toDate;
        setLoading(true);
        try {
            const res = await statisticsService.getHospitalActivity(from, to);
            setData(res);
        } catch (error) {
            console.error('Error fetching hospital activity:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleExport = () => {
        if (!data) return;
        const exam = data.examination || {};
        const inp = data.inpatient || {};
        const rows: any[] = [
            { 'STT': 'I', 'Chỉ Tiêu Chuyên Môn': 'HOẠT ĐỘNG KHÁM BỆNH (NGOẠI TRÚ)', 'Số Lượng': '', 'Đơn Vị': '', 'Ghi Chú': '' },
            { 'STT': '1', 'Chỉ Tiêu Chuyên Môn': 'Tổng số lượt khám bệnh', 'Số Lượng': exam.tong_so || 0, 'Đơn Vị': 'Lượt khám', 'Ghi Chú': 'Tổng lượt tiếp nhận' },
            { 'STT': '1.1', 'Chỉ Tiêu Chuyên Môn': '- Khám Bảo hiểm Y tế (BHYT)', 'Số Lượng': exam.so_bhyt || 0, 'Đơn Vị': 'Lượt khám', 'Ghi Chú': '' },
            { 'STT': '1.2', 'Chỉ Tiêu Chuyên Môn': '- Khám Dịch vụ / Viện phí', 'Số Lượng': exam.so_dichvu || 0, 'Đơn Vị': 'Lượt khám', 'Ghi Chú': '' },
            { 'STT': '1.3', 'Chỉ Tiêu Chuyên Môn': '- Số ca chỉ định Nhập viện', 'Số Lượng': exam.nhap_vien || 0, 'Đơn Vị': 'Ca bệnh', 'Ghi Chú': '' },
            { 'STT': '1.4', 'Chỉ Tiêu Chuyên Môn': '- Số ca Chuyển tuyến / Chuyển viện ngoại trú', 'Số Lượng': exam.chuyen_vien || 0, 'Đơn Vị': 'Ca bệnh', 'Ghi Chú': '' },

            { 'STT': 'II', 'Chỉ Tiêu Chuyên Môn': 'HOẠT ĐỘNG ĐIỀU TRỊ NỘI TRÚ', 'Số Lượng': '', 'Đơn Vị': '', 'Ghi Chú': '' },
            { 'STT': '2', 'Chỉ Tiêu Chuyên Môn': 'Tổng số người bệnh Vào viện nội trú', 'Số Lượng': inp.vao_vien || 0, 'Đơn Vị': 'Người bệnh', 'Ghi Chú': '' },
            { 'STT': '2.1', 'Chỉ Tiêu Chuyên Môn': '- Số người bệnh Ra viện (khỏi, đỡ)', 'Số Lượng': inp.ra_vien || 0, 'Đơn Vị': 'Người bệnh', 'Ghi Chú': '' },
            { 'STT': '2.2', 'Chỉ Tiêu Chuyên Môn': '- Số ca Tử vong tại bệnh viện', 'Số Lượng': inp.tu_vong || 0, 'Đơn Vị': 'Ca bệnh', 'Ghi Chú': '' },
            { 'STT': '2.3', 'Chỉ Tiêu Chuyên Môn': '- Số ca Chuyển viện nội trú (Điểm G)', 'Số Lượng': inp.chuyen_vien_noi_tru || 0, 'Đơn Vị': 'Ca bệnh', 'Ghi Chú': 'Điểm G báo cáo IV' },
            { 'STT': '2.4', 'Chỉ Tiêu Chuyên Môn': '- Số người bệnh Đang nằm điều trị', 'Số Lượng': inp.dang_dieu_tri || 0, 'Đơn Vị': 'Người bệnh', 'Ghi Chú': 'Hiện diện tại buồng bệnh' },

            { 'STT': 'III', 'Chỉ Tiêu Chuyên Môn': 'HOẠT ĐỘNG CẬN LÂM SÀNG (CLS)', 'Số Lượng': '', 'Đơn Vị': '', 'Ghi Chú': '' }
        ];

        if (Array.isArray(data.paraclinical)) {
            data.paraclinical.forEach((cls, i) => {
                rows.push({
                    'STT': `3.${i + 1}`,
                    'Chỉ Tiêu Chuyên Môn': `Nhóm kỹ thuật: ${cls.cls_group === 'XET_NGHIEM' ? 'Xét nghiệm (LIS)' : cls.cls_group === 'CDHA' ? 'Chẩn đoán hình ảnh (RIS/PACS)' : cls.cls_group === 'TDCN' ? 'Thăm dò chức năng (TDCN)' : cls.cls_group}`,
                    'Số Lượng': cls.so_chi_dinh || 0,
                    'Đơn Vị': 'Chỉ định',
                    'Ghi Chú': `${cls.so_benh_nhan || 0} bệnh nhân`
                });
            });
        }

        rows.push({ 'STT': 'IV', 'Chỉ Tiêu Chuyên Môn': 'PHẪU THUẬT - THỦ THUẬT (PTTT)', 'Số Lượng': '', 'Đơn Vị': '', 'Ghi Chú': '' });
        if (Array.isArray(data.surgery)) {
            data.surgery.forEach((sur, i) => {
                rows.push({
                    'STT': `4.${i + 1}`,
                    'Chỉ Tiêu Chuyên Môn': sur.pttt_type === 'PHAU_THUAT' ? 'Phẫu thuật các loại' : 'Thủ thuật các loại',
                    'Số Lượng': sur.tong_so_ca || 0,
                    'Đơn Vị': 'Ca thực hiện',
                    'Ghi Chú': `${sur.so_benh_nhan || 0} người bệnh`
                });
            });
        }

        exportTableToExcel(rows, 'Bao_Cao_Hoat_Dong_Benh_Vien', 'Hoạt Động BV');
    };

    // Statistical variables
    const exam = data?.examination || {};
    const inp = data?.inpatient || {};
    const tongKham = Number(exam.tong_so || 0);
    const soBhyt = Number(exam.so_bhyt || 0);
    const soDv = Number(exam.so_dichvu || 0);
    const nhapVien = Number(exam.nhap_vien || 0);
    const vaoVien = Number(inp.vao_vien || 0);
    const raVien = Number(inp.ra_vien || 0);
    const chuyenVienNgoaiTru = Number(exam.chuyen_vien || 0);
    const chuyenVienNoiTru = Number(inp.chuyen_vien_noi_tru || 0);
    const tuVong = Number(inp.tu_vong || 0);
    const dangDieuTri = Number(inp.dang_dieu_tri || 0);

    const bhytRatio = tongKham > 0 ? ((soBhyt / tongKham) * 100).toFixed(1) : '0.0';
    const dvRatio = tongKham > 0 ? ((soDv / tongKham) * 100).toFixed(1) : '0.0';
    const nhapVienRatio = tongKham > 0 ? ((nhapVien / tongKham) * 100).toFixed(2) : '0.00';
    const raVienRatio = vaoVien > 0 ? ((raVien / vaoVien) * 100).toFixed(1) : '0.0';
    const chuyenVienRatio = tongKham > 0 ? ((chuyenVienNgoaiTru / tongKham) * 100).toFixed(2) : '0.00';
    const tuVongRatio = vaoVien > 0 ? ((tuVong / vaoVien) * 100).toFixed(2) : '0.00';
    const chuyenVienNoiTruRatio = vaoVien > 0 ? ((chuyenVienNoiTru / vaoVien) * 100).toFixed(2) : '0.00';

    // CLS Aggregate & Breakdown
    const tongClsChiDinh = (data?.paraclinical || []).reduce((acc, c) => acc + Number(c.so_chi_dinh || 0), 0);
    const tongClsBenhNhan = (data?.paraclinical || []).reduce((acc, c) => acc + Number(c.so_benh_nhan || 0), 0);
    const lisItem = (data?.paraclinical || []).find(c => c.cls_group === 'XET_NGHIEM');
    const cdhaItem = (data?.paraclinical || []).find(c => c.cls_group === 'CDHA');
    const tdcnItem = (data?.paraclinical || []).find(c => c.cls_group === 'TDCN');
    const lisChiDinh = Number(lisItem?.so_chi_dinh || 0);
    const cdhaChiDinh = Number(cdhaItem?.so_chi_dinh || 0);
    const tdcnChiDinh = Number(tdcnItem?.so_chi_dinh || 0);
    const lisRatio = tongClsChiDinh > 0 ? ((lisChiDinh / tongClsChiDinh) * 100).toFixed(1) : '0.0';
    const cdhaRatio = tongClsChiDinh > 0 ? ((cdhaChiDinh / tongClsChiDinh) * 100).toFixed(1) : '0.0';
    const tdcnRatio = tongClsChiDinh > 0 ? ((tdcnChiDinh / tongClsChiDinh) * 100).toFixed(1) : '0.0';

    // Surgery Aggregate & Breakdown
    const tongPtttCa = (data?.surgery || []).reduce((acc, s) => acc + Number(s.tong_so_ca || 0), 0);
    const tongPtttBenhNhan = (data?.surgery || []).reduce((acc, s) => acc + Number(s.so_benh_nhan || 0), 0);
    const phauThuatItem = (data?.surgery || []).find(s => s.pttt_type === 'PHAU_THUAT');
    const thuThuatItem = (data?.surgery || []).find(s => s.pttt_type === 'THU_THUAT');
    const phauThuatCa = Number(phauThuatItem?.tong_so_ca || 0);
    const thuThuatCa = Number(thuThuatItem?.tong_so_ca || 0);

    const tongKyThuat = tongClsChiDinh + tongPtttCa;

    // BI Chart 1 Data: Patient Journey & Pipeline
    const patientFlowData = useMemo(() => [
        { name: 'Tiếp nhận khám', shortName: 'Khám', value: tongKham, color: '#2563EB', sub: '100% Tiếp nhận ngoại trú' },
        { name: 'Khám BHYT', shortName: 'BHYT', value: soBhyt, color: '#10B981', sub: `${bhytRatio}% Lượt khám BHYT` },
        { name: 'Vào nội trú', shortName: 'Vào viện', value: vaoVien, color: '#6366F1', sub: `${tongKham > 0 ? ((vaoVien / tongKham) * 100).toFixed(1) : 0}% Chỉ định nhập viện` },
        { name: 'Ra viện (Khỏi, đỡ)', shortName: 'Ra viện', value: raVien, color: '#0D9488', sub: `${raVienRatio}% Tỷ lệ ra/vào` },
        { name: 'Đang điều trị', shortName: 'Nằm viện', value: dangDieuTri, color: '#8B5CF6', sub: 'Hiện diện tại buồng bệnh' },
        { name: 'Chuyển tuyến', shortName: 'Chuyển viện', value: chuyenVienNgoaiTru + chuyenVienNoiTru, color: '#F43F5E', sub: 'Chuyển viện ngoại + nội trú' }
    ], [tongKham, soBhyt, bhytRatio, vaoVien, raVien, raVienRatio, dangDieuTri, chuyenVienNgoaiTru, chuyenVienNoiTru]);

    // BI Chart 2 Data: Technical Services Distribution
    const technicalServicesData = useMemo(() => {
        const list = [];
        if (lisChiDinh > 0) {
            list.push({ name: 'Xét nghiệm (LIS)', shortName: 'LIS', value: lisChiDinh, color: '#8B5CF6', patients: Number(lisItem?.so_benh_nhan || 0) });
        }
        if (thuThuatCa > 0) {
            list.push({ name: 'Thủ thuật', shortName: 'Thủ thuật', value: thuThuatCa, color: '#F59E0B', patients: Number(thuThuatItem?.so_benh_nhan || 0) });
        }
        if (tdcnChiDinh > 0) {
            list.push({ name: 'Thăm dò chức năng', shortName: 'TDCN', value: tdcnChiDinh, color: '#06B6D4', patients: Number(tdcnItem?.so_benh_nhan || 0) });
        }
        if (cdhaChiDinh > 0) {
            list.push({ name: 'CĐHA (RIS/PACS)', shortName: 'PACS', value: cdhaChiDinh, color: '#3B82F6', patients: Number(cdhaItem?.so_benh_nhan || 0) });
        }
        if (phauThuatCa > 0) {
            list.push({ name: 'Phẫu thuật', shortName: 'Mổ', value: phauThuatCa, color: '#EC4899', patients: Number(phauThuatItem?.so_benh_nhan || 0) });
        }
        return list;
    }, [lisChiDinh, thuThuatCa, tdcnChiDinh, cdhaChiDinh, phauThuatCa, lisItem, thuThuatItem, tdcnItem, cdhaItem, phauThuatItem]);

    // Custom Tooltip for Patient Flow Chart
    const CustomPatientFlowTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-lg text-xs space-y-1">
                    <p className="font-bold text-slate-800 dark:text-white">{item.name}</p>
                    <p className="font-mono font-black text-sm" style={{ color: item.color }}>
                        {Number(item.value).toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">lượt/ca</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">{item.sub}</p>
                </div>
            );
        }
        return null;
    };

    // Custom Tooltip for Technical Services Donut
    const CustomTechServicesTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            const percent = tongKyThuat > 0 ? ((item.value / tongKyThuat) * 100).toFixed(1) : 0;
            return (
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-lg text-xs space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-bold text-slate-800 dark:text-white">{item.name}</span>
                    </div>
                    <p className="font-mono font-black text-sm" style={{ color: item.color }}>
                        {Number(item.value).toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">chỉ định / ca</span>
                    </p>
                    <p className="text-slate-500 dark:text-slate-400">
                        Tỷ trọng: <strong className="text-slate-700 dark:text-slate-200">{percent}%</strong> toàn viện ({item.patients.toLocaleString('vi-VN')} bệnh nhân)
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-3 sm:space-y-3.5">
            {/* Header Title & Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
                <div>
                    <div className="flex items-center gap-2.5">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white tracking-tight">
                            Báo Cáo Hoạt Động Bệnh Viện Tổng Thể
                        </h1>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800 shadow-xs">
                            Biểu Mẫu 01/BC-BV
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Bảng tổng hợp chỉ tiêu chuyên môn khám chữa bệnh toàn diện đồng bộ theo quy định Bộ Y tế
                    </p>
                </div>
            </div>

            {/* Print Header (Visible only when printing) */}
            <PrintReportHeader 
                formCode="Biểu mẫu: 01/BC-BV"
                title="BÁO CÁO THỐNG KÊ HOẠT ĐỘNG BỆNH VIỆN TỔNG THỂ"
                subtitle="Tổng hợp các chỉ tiêu chuyên môn khám chữa bệnh theo quy định Bộ Y tế"
                fromDate={fromDate}
                toDate={toDate}
            />

            {/* Filter Bar with Auto-refresh on preset */}
            <CommonFilter
                fromDate={fromDate}
                toDate={toDate}
                onFromDateChange={setFromDate}
                onToDateChange={setToDate}
                onRefresh={fetchData}
                loading={loading}
                onExportExcel={handleExport}
                onPrint={() => window.print()}
            />

            {/* 4 Executive Clinical KPI Cards - GCV Standard his-kpi-card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 print:hidden">
                {/* KPI 1: Ngoại Trú */}
                <div className="his-kpi-card border-l-4 border-l-blue-500 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <UserGroupIcon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                            Khối Ngoại Trú
                        </span>
                    </div>
                    <div className="mt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Khám Tiếp Nhận</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight block mt-0.5">
                            {tongKham.toLocaleString('vi-VN')}
                        </span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-500">
                        <span className="flex items-center gap-1.5" title="Bảo hiểm Y tế">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            BHYT: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{bhytRatio}%</strong>
                        </span>
                        <span className="flex items-center gap-1.5" title="Viện phí / Dịch vụ">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Dịch vụ: <strong className="font-mono text-amber-600 dark:text-amber-400">{dvRatio}%</strong>
                        </span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-semibold" title="Tỷ lệ nhập viện">
                            Vào: {nhapVienRatio}%
                        </span>
                    </div>
                </div>

                {/* KPI 2: Nội Trú */}
                <div className="his-kpi-card border-l-4 border-l-emerald-500 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <HeartIcon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                            Khối Nội Trú
                        </span>
                    </div>
                    <div className="mt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Vào Viện Điều Trị</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight block mt-0.5">
                            {vaoVien.toLocaleString('vi-VN')}
                        </span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-500">
                        <span title="Số bệnh nhân ra viện">
                            Ra: <strong className="font-mono text-emerald-600 dark:text-emerald-400">{raVienRatio}%</strong>
                        </span>
                        <span title="Bệnh nhân hiện diện buồng bệnh">
                            Đang nằm: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{dangDieuTri.toLocaleString('vi-VN')}</strong>
                        </span>
                        <span title="Số ca tử vong" className={tuVong > 0 ? 'text-rose-600 font-bold' : ''}>
                            Tử vong: <strong className="font-mono">{tuVong}</strong>
                        </span>
                    </div>
                </div>

                {/* KPI 3: Cận Lâm Sàng */}
                <div className="his-kpi-card border-l-4 border-l-purple-500 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                            <BeakerIcon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
                            Khối Kỹ Thuật CLS
                        </span>
                    </div>
                    <div className="mt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng Chỉ Định CLS</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight block mt-0.5">
                            {tongClsChiDinh.toLocaleString('vi-VN')}
                        </span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-500">
                        <span title="Xét nghiệm LIS">LIS: <strong className="font-mono text-purple-600 dark:text-purple-400">{lisRatio}%</strong></span>
                        <span title="Thăm dò chức năng">TDCN: <strong className="font-mono text-cyan-600 dark:text-cyan-400">{tdcnRatio}%</strong></span>
                        <span title="Chẩn đoán hình ảnh">PACS: <strong className="font-mono text-blue-600 dark:text-blue-400">{cdhaRatio}%</strong></span>
                    </div>
                </div>

                {/* KPI 4: Phẫu Thuật - Thủ Thuật */}
                <div className="his-kpi-card border-l-4 border-l-amber-500 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                        <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                            <SparklesIcon className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800">
                            Can Thiệp PT-TT
                        </span>
                    </div>
                    <div className="mt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tổng Ca PT - TT</span>
                        <span className="text-2xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight block mt-0.5">
                            {tongPtttCa.toLocaleString('vi-VN')}
                        </span>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-xs flex items-center justify-between text-slate-500">
                        <span title="Số ca phẫu thuật">
                            Mổ: <strong className="font-mono text-rose-600 dark:text-rose-400">{phauThuatCa.toLocaleString('vi-VN')}</strong>
                        </span>
                        <span title="Số ca thủ thuật">
                            Thủ thuật: <strong className="font-mono text-amber-600 dark:text-amber-400">{thuThuatCa.toLocaleString('vi-VN')}</strong>
                        </span>
                        <span title="Số bệnh nhân thực hiện">
                            {tongPtttBenhNhan.toLocaleString('vi-VN')} BN
                        </span>
                    </div>
                </div>
            </div>

            {/* BI Executive Visual Charts (Interactive Recharts Panel) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-3.5 print:hidden">
                {/* Chart 1: Luồng Chuyển Tiếp Người Bệnh (7 cols) */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-4 sm:p-4.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                <ChartBarIcon className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Chuỗi Chuyển Tiếp & Phục Vụ Người Bệnh
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Lưu lượng từ tiếp nhận phòng khám đến nhập buồng bệnh và xuất viện
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 rounded-lg">
                            Tổng thể chu kỳ
                        </span>
                    </div>

                    <div className="h-64 w-full mt-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={patientFlowData} margin={{ top: 15, right: 15, left: -5, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.6} />
                                <XAxis 
                                    dataKey="shortName" 
                                    stroke="#64748B" 
                                    fontSize={11} 
                                    tickLine={false}
                                    interval={0}
                                />
                                <YAxis 
                                    stroke="#64748B" 
                                    fontSize={11} 
                                    tickLine={false}
                                    allowDecimals={false}
                                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                                />
                                <Tooltip content={<CustomPatientFlowTooltip />} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {patientFlowData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center text-[11px]">
                        {patientFlowData.map((d, i) => (
                            <div key={i} className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/40">
                                <span className="text-slate-400 block truncate">{d.shortName}</span>
                                <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                                    {d.value.toLocaleString('vi-VN')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chart 2: Cơ Cấu Kỹ Thuật Toàn Viện Breakdown Matrix (5 cols) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-4 sm:p-4.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                    <BeakerIcon className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Cơ Cấu Kỹ Thuật & Can Thiệp
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Tỷ trọng phân bổ 5 khối kỹ thuật chuyên môn
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200/60">
                                {tongKyThuat.toLocaleString('vi-VN')} ca
                            </span>
                        </div>

                        {/* Breakdown List */}
                        <div className="space-y-2.5 mt-3">
                            {technicalServicesData.map((item, idx) => {
                                const pct = tongKyThuat > 0 ? ((item.value / tongKyThuat) * 100).toFixed(1) : '0';
                                return (
                                    <div key={idx} className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/60 hover:bg-slate-100/70 transition-colors">
                                        <div className="flex items-center justify-between text-xs mb-1.5">
                                            <div className="flex items-center gap-2 truncate">
                                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                                <span className="font-bold text-slate-800 dark:text-slate-100 truncate">
                                                    {item.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                                                <strong className="text-slate-900 dark:text-white font-black">
                                                    {item.value.toLocaleString('vi-VN')} ca
                                                </strong>
                                                <span className="font-bold text-[11px]" style={{ color: item.color }}>
                                                    ({pct}%)
                                                </span>
                                            </div>
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-200/70 dark:bg-slate-600/40 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%`, backgroundColor: item.color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Summary Insight */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-purple-50/50 dark:bg-purple-950/20 px-3 py-2 rounded-xl border border-purple-100 dark:border-purple-900/40">
                        <span className="text-[11px] font-medium text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                            <SparklesIcon className="w-4 h-4 text-purple-600 shrink-0" />
                            <span>Cận lâm sàng: <strong>{((tongClsChiDinh / (tongKyThuat || 1)) * 100).toFixed(1)}%</strong></span>
                        </span>
                        <span className="font-mono text-[11px] font-bold text-purple-700 dark:text-purple-300">
                            PT-TT: {((tongPtttCa / (tongKyThuat || 1)) * 100).toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Section Filter Navigation Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 print:hidden">
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                    <button
                        type="button"
                        onClick={() => setActiveSection('ALL')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeSection === 'ALL'
                                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>Tất cả các khối</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-mono">
                            4 Khối
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('EXAM')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeSection === 'EXAM'
                                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>I. Khám Ngoại Trú</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-mono">
                            5
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('INP')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeSection === 'INP'
                                ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>II. Điều Trị Nội Trú</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 font-mono">
                            5
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('CLS')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeSection === 'CLS'
                                ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>III. Cận Lâm Sàng</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 font-mono">
                            {Array.isArray(data?.paraclinical) ? data.paraclinical.length : 0}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveSection('SUR')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                            activeSection === 'SUR'
                                ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                    >
                        <span>IV. Phẫu - Thủ Thuật</span>
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 font-mono">
                            {Array.isArray(data?.surgery) ? data.surgery.length : 0}
                        </span>
                    </button>
                </div>

                <span className="text-xs text-slate-400 font-medium">
                    Chuẩn báo cáo: <strong className="text-slate-600 dark:text-slate-300">Biểu Mẫu 01/BC-BV</strong>
                </span>
            </div>

            {/* Main Statistical Table - GCV Standard his-table */}
            <div className="his-table-wrap">
                <table className="his-table w-full text-left text-sm">
                    <thead className="sticky top-0 z-10 shadow-xs">
                        <tr>
                            <th className="px-5 py-3.5 w-16 text-center whitespace-nowrap font-mono">STT</th>
                            <th className="px-6 py-3.5">Chỉ Tiêu Chuyên Môn</th>
                            <th className="px-6 py-3.5 text-right w-48">Số Lượng</th>
                            <th className="px-6 py-3.5 w-36 text-center">Đơn Vị</th>
                            <th className="px-6 py-3.5 w-72">Chỉ Số Hiệu Suất / Tỷ Lệ</th>
                        </tr>
                    </thead>

                    {/* ==================== SECTION I ==================== */}
                    <tbody className={`${(activeSection === 'ALL' || activeSection === 'EXAM') ? '' : 'hidden print:table-row-group'}`}>
                        <tr className="bg-blue-50/90 dark:bg-blue-950/50 font-bold text-[#01579b] dark:text-blue-200">
                            <td className="px-5 py-3 text-center font-mono text-sm font-bold">I</td>
                            <td className="px-6 py-3" colSpan={4}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <UserGroupIcon className="w-5 h-5 text-[#01579b] dark:text-blue-400" />
                                        <span className="tracking-wide uppercase">Hoạt Động Khám Bệnh (Ngoại Trú)</span>
                                    </div>
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100/80 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800 print:hidden">
                                        5 chỉ tiêu
                                    </span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-5 py-3 text-center font-bold text-slate-700 dark:text-slate-200 font-mono whitespace-nowrap">1</td>
                            <td className="px-6 py-3 font-bold text-slate-900 dark:text-slate-100">Tổng số lượt khám bệnh</td>
                            <td className="px-6 py-3 text-right font-black text-blue-700 dark:text-blue-400 text-base font-mono tabular-nums">
                                {tongKham.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-3 text-center text-xs text-slate-500 font-medium">Lượt khám</td>
                            <td className="px-6 py-3 text-xs">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold rounded-lg border border-blue-200 dark:border-blue-800">
                                    100% Lượt tiếp nhận
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-5 py-2.5 text-center text-slate-400 font-mono whitespace-nowrap">1.1</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Khám Bảo hiểm Y tế (BHYT)</td>
                            <td className="px-6 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                                {soBhyt.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500 font-medium">Lượt</td>
                            <td className="px-6 py-2.5 text-xs">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    {bhytRatio}% tổng lượt khám
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-5 py-2.5 text-center text-slate-400 font-mono whitespace-nowrap">1.2</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Khám Viện phí / Dịch vụ</td>
                            <td className="px-6 py-2.5 text-right font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                                {soDv.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500 font-medium">Lượt</td>
                            <td className="px-6 py-2.5 text-xs">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold rounded-lg border border-amber-200 dark:border-amber-800">
                                    {dvRatio}% tổng lượt khám
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-5 py-2.5 text-center text-slate-400 font-mono whitespace-nowrap">1.3</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Số ca chỉ định Nhập viện</td>
                            <td className="px-6 py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                                {nhapVien.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500 font-medium">Ca bệnh</td>
                            <td className="px-6 py-2.5 text-xs">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium rounded-lg border border-indigo-200 dark:border-indigo-800">
                                    {nhapVienRatio}% tỷ lệ vào viện
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-5 py-2.5 text-center text-slate-400 font-mono whitespace-nowrap">1.4</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Số ca Chuyển tuyến / Chuyển viện ngoại trú</td>
                            <td className="px-6 py-2.5 text-right font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                                {chuyenVienNgoaiTru.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500 font-medium">Ca bệnh</td>
                            <td className="px-6 py-2.5 text-xs">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-semibold rounded-lg border border-rose-200 dark:border-rose-800">
                                    {chuyenVienRatio}% tỷ lệ chuyển viện
                                </span>
                            </td>
                        </tr>
                    </tbody>

                    {/* ==================== SECTION II ==================== */}
                    <tbody className={`${(activeSection === 'ALL' || activeSection === 'INP') ? '' : 'hidden print:table-row-group'}`}>
                        <tr className="bg-emerald-50/90 dark:bg-emerald-950/50 font-bold text-emerald-900 dark:text-emerald-200">
                            <td className="px-5 py-3 text-center font-mono text-sm font-bold">II</td>
                            <td className="px-6 py-3" colSpan={4}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <HeartIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                        <span className="tracking-wide uppercase">Hoạt Động Điều Trị Nội Trú (Đồng Bộ Điểm IV)</span>
                                    </div>
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 print:hidden">
                                        5 chỉ tiêu
                                    </span>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-5 py-3 text-center font-bold text-slate-700 dark:text-slate-200 font-mono whitespace-nowrap">2</td>
                            <td className="px-6 py-3 font-bold text-slate-900 dark:text-slate-100">Số người bệnh Vào điều trị nội trú</td>
                            <td className="px-6 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-base font-mono tabular-nums">
                                {vaoVien.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-3 text-center text-xs text-slate-500 font-medium">Người bệnh</td>
                            <td className="px-6 py-3 text-xs">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    Tổng nhập viện mới (Điểm a)
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-5 py-2.5 text-center text-slate-400 font-mono whitespace-nowrap">2.1</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Số người bệnh Ra viện (khỏi, đỡ)</td>
                            <td className="px-6 py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                                {raVien.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500 font-medium">Người bệnh</td>
                            <td className="px-6 py-2.5 text-xs">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    {raVienRatio}% tỷ lệ ra/vào (Điểm e)
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-5 py-2.5 text-center text-slate-400 font-mono whitespace-nowrap">2.2</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Số ca Tử vong tại bệnh viện</td>
                            <td className="px-6 py-2.5 text-right font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                                {tuVong.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500 font-medium">Ca bệnh</td>
                            <td className="px-6 py-2.5 text-xs">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 font-semibold rounded-lg border border-rose-200 dark:border-rose-800">
                                    {tuVongRatio}% tỷ lệ tử vong (Điểm h)
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-5 py-2.5 text-center text-slate-400 font-mono whitespace-nowrap">2.3</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Số ca Chuyển tuyến / Chuyển viện nội trú</td>
                            <td className="px-6 py-2.5 text-right font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                                {chuyenVienNoiTru.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500 font-medium">Ca bệnh</td>
                            <td className="px-6 py-2.5 text-xs">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-semibold rounded-lg border border-amber-200 dark:border-amber-800">
                                    {chuyenVienNoiTruRatio}% tỷ lệ chuyển viện (Điểm g)
                                </span>
                            </td>
                        </tr>
                        <tr>
                            <td className="px-5 py-2.5 text-center text-slate-400 font-mono whitespace-nowrap">2.4</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Số người bệnh Đang nằm điều trị</td>
                            <td className="px-6 py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
                                {dangDieuTri.toLocaleString('vi-VN')}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500 font-medium">Người bệnh</td>
                            <td className="px-6 py-2.5 text-xs">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800">
                                    Hiện diện tại buồng bệnh
                                </span>
                            </td>
                        </tr>
                    </tbody>

                    {/* ==================== SECTION III ==================== */}
                    <tbody className={`${(activeSection === 'ALL' || activeSection === 'CLS') ? '' : 'hidden print:table-row-group'}`}>
                        <tr className="bg-purple-50/90 dark:bg-purple-950/50 font-bold text-purple-900 dark:text-purple-200">
                            <td className="px-5 py-3 text-center font-mono text-sm font-bold">III</td>
                            <td className="px-6 py-3" colSpan={4}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BeakerIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                        <span className="tracking-wide uppercase">Hoạt Động Cận Lâm Sàng (CLS - Loại Trừ PTTT)</span>
                                    </div>
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100/80 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800 print:hidden">
                                        {Array.isArray(data?.paraclinical) ? `${data.paraclinical.length} nhóm kỹ thuật` : '0'}
                                    </span>
                                </div>
                            </td>
                        </tr>
                        {Array.isArray(data?.paraclinical) && data.paraclinical.length > 0 ? (
                            data.paraclinical.map((cls, i) => (
                                <tr key={cls.cls_group}>
                                    <td className="px-5 py-2.5 text-center text-slate-400 font-mono whitespace-nowrap">3.{i + 1}</td>
                                    <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">
                                        - {cls.cls_group === 'XET_NGHIEM' ? 'Xét nghiệm (LIS)' : cls.cls_group === 'CDHA' ? 'Chẩn đoán hình ảnh (RIS/PACS)' : cls.cls_group === 'TDCN' ? 'Thăm dò chức năng (TDCN)' : cls.cls_group}
                                    </td>
                                    <td className="px-6 py-2.5 text-right font-bold text-purple-600 dark:text-purple-400 font-mono tabular-nums">
                                        {Number(cls.so_chi_dinh || 0).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-2.5 text-center text-xs text-slate-500 font-medium">Chỉ định</td>
                                    <td className="px-6 py-2.5 text-xs">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium rounded-lg border border-purple-200 dark:border-purple-800">
                                            {Number(cls.so_benh_nhan || 0).toLocaleString('vi-VN')} người bệnh
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="px-5 py-3 text-center text-slate-400 font-mono whitespace-nowrap">3</td>
                                <td className="px-6 py-3 text-slate-500 italic pl-10" colSpan={4}>Không có chỉ định cận lâm sàng trong kỳ</td>
                            </tr>
                        )}
                    </tbody>

                    {/* ==================== SECTION IV ==================== */}
                    <tbody className={`${(activeSection === 'ALL' || activeSection === 'SUR') ? '' : 'hidden print:table-row-group'}`}>
                        <tr className="bg-amber-50/90 dark:bg-amber-950/50 font-bold text-amber-900 dark:text-amber-200">
                            <td className="px-5 py-3 text-center font-mono text-sm font-bold">IV</td>
                            <td className="px-6 py-3" colSpan={4}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <SparklesIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                        <span className="tracking-wide uppercase">Phẫu Thuật - Thủ Thuật (PTTT - Đồng Bộ Mục 1 Nhóm C Nội Trú)</span>
                                    </div>
                                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100/80 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 print:hidden">
                                        {Array.isArray(data?.surgery) ? `${data.surgery.length} phân loại` : '0'}
                                    </span>
                                </div>
                            </td>
                        </tr>
                        {Array.isArray(data?.surgery) && data.surgery.length > 0 ? (
                            data.surgery.map((sur, i) => (
                                <tr key={sur.pttt_type}>
                                    <td className="px-5 py-2.5 text-center text-slate-400 font-mono whitespace-nowrap">4.{i + 1}</td>
                                    <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">
                                        - {sur.pttt_type === 'PHAU_THUAT' ? 'Phẫu thuật các loại' : 'Thủ thuật các loại'}
                                    </td>
                                    <td className="px-6 py-2.5 text-right font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                                        {Number(sur.tong_so_ca || 0).toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-6 py-2.5 text-center text-xs text-slate-500 font-medium">Ca thực hiện</td>
                                    <td className="px-6 py-2.5 text-xs">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium rounded-lg border border-amber-200 dark:border-amber-800">
                                            {Number(sur.so_benh_nhan || 0).toLocaleString('vi-VN')} người bệnh
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="px-5 py-3 text-center text-slate-400 font-mono whitespace-nowrap">4</td>
                                <td className="px-6 py-3 text-slate-500 italic pl-10" colSpan={4}>Không có ca phẫu thuật thủ thuật trong kỳ</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Print Footer (Visible only when printing) */}
            <PrintReportFooter />
        </div>
    );
};
