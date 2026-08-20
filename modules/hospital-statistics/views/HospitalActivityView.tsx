// ==================== HOSPITAL ACTIVITY VIEW ====================
// File: modules/hospital-statistics/views/HospitalActivityView.tsx

import React, { useState, useEffect } from 'react';
import { CommonFilter, PrintReportHeader, PrintReportFooter, exportTableToExcel, formatLocalDate, getStartOfMonthLocalDate } from '../components/CommonFilter';
import { statisticsService } from '../services/statisticsService';
import { HospitalActivityData } from '../types';
import { 
    UserGroupIcon, 
    HeartIcon, 
    ShieldCheckIcon, 
    BuildingOfficeIcon, 
    TrendingUpIcon, 
    CheckCircleIcon,
    CurrencyDollarIcon 
} from '../../../components/Icons';

export const HospitalActivityView: React.FC = () => {
    const now = new Date();
    const [fromDate, setFromDate] = useState(`${formatLocalDate(now)} 00:00:00`);
    const [toDate, setToDate] = useState(`${formatLocalDate(now)} 23:59:59`);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<HospitalActivityData | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await statisticsService.getHospitalActivity(fromDate, toDate);
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
            { 'STT': '1.3', 'Chỉ Tiêu Chuyên Môn': 'Số ca chỉ định Nhập viện', 'Số Lượng': exam.nhap_vien || 0, 'Đơn Vị': 'Ca bệnh', 'Ghi Chú': '' },
            { 'STT': '1.4', 'Chỉ Tiêu Chuyên Môn': 'Số ca Chuyển viện / Chuyển tuyến', 'Số Lượng': exam.chuyen_vien || 0, 'Đơn Vị': 'Ca bệnh', 'Ghi Chú': '' },

            { 'STT': 'II', 'Chỉ Tiêu Chuyên Môn': 'HOẠT ĐỘNG ĐIỀU TRỊ NỘI TRÚ', 'Số Lượng': '', 'Đơn Vị': '', 'Ghi Chú': '' },
            { 'STT': '2', 'Chỉ Tiêu Chuyên Môn': 'Tổng số người bệnh Vào viện nội trú', 'Số Lượng': inp.vao_vien || 0, 'Đơn Vị': 'Người bệnh', 'Ghi Chú': '' },
            { 'STT': '2.1', 'Chỉ Tiêu Chuyên Môn': 'Số người bệnh Ra viện', 'Số Lượng': inp.ra_vien || 0, 'Đơn Vị': 'Người bệnh', 'Ghi Chú': '' },
            { 'STT': '2.2', 'Chỉ Tiêu Chuyên Môn': 'Số ca Tử vong tại viện', 'Số Lượng': inp.tu_vong || 0, 'Đơn Vị': 'Ca bệnh', 'Ghi Chú': '' },
            { 'STT': '2.3', 'Chỉ Tiêu Chuyên Môn': 'Số người bệnh Đang nằm điều trị', 'Số Lượng': inp.dang_dieu_tri || 0, 'Đơn Vị': 'Người bệnh', 'Ghi Chú': 'Hiện diện tại khoa' },

            { 'STT': 'III', 'Chỉ Tiêu Chuyên Môn': 'HOẠT ĐỘNG CẬN LÂM SÀNG (CLS)', 'Số Lượng': '', 'Đơn Vị': '', 'Ghi Chú': '' }
        ];

        if (Array.isArray(data.paraclinical)) {
            data.paraclinical.forEach((cls, i) => {
                rows.push({
                    'STT': `3.${i + 1}`,
                    'Chỉ Tiêu Chuyên Môn': `Nhóm kỹ thuật: ${cls.cls_group}`,
                    'Số Lượng': cls.so_chi_dinh || 0,
                    'Đơn Vị': 'Chỉ định',
                    'Ghi Chú': `${cls.so_benh_nhan || 0} BN`
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
                    'Ghi Chú': `${sur.so_benh_nhan || 0} BN`
                });
            });
        }

        exportTableToExcel(rows, 'Bao_Cao_Hoat_Dong_Benh_Vien', 'Hoạt Động BV');
    };

    const exam = data?.examination || {};
    const inp = data?.inpatient || {};
    const tongKham = Number(exam.tong_so || 0);
    const soBhyt = Number(exam.so_bhyt || 0);
    const soDv = Number(exam.so_dichvu || 0);
    const vaoVien = Number(inp.vao_vien || 0);
    const chuyenVien = Number(exam.chuyen_vien || 0);
    const tuVong = Number(inp.tu_vong || 0);

    const bhytRatio = tongKham > 0 ? ((soBhyt / tongKham) * 100).toFixed(1) : '0.0';
    const chuyenVienRatio = tongKham > 0 ? ((chuyenVien / tongKham) * 100).toFixed(2) : '0.0';
    const tuVongRatio = vaoVien > 0 ? ((tuVong / vaoVien) * 100).toFixed(2) : '0.0';

    return (
        <div className="space-y-6">
            <div className="print:hidden">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Báo cáo Hoạt động Bệnh viện Tổng thể</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Bảng tổng hợp chỉ tiêu chuyên môn khám chữa bệnh toàn diện theo quy định Bộ Y tế
                </p>
            </div>

            <PrintReportHeader 
                formCode="Biểu mẫu: 01/BC-BV"
                title="BÁO CÁO THỐNG KÊ HOẠT ĐỘNG BỆNH VIỆN TỔNG THỂ"
                subtitle="Tổng hợp các chỉ tiêu chuyên môn khám chữa bệnh theo quy định Bộ Y tế"
                fromDate={fromDate}
                toDate={toDate}
            />

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

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 uppercase text-xs font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-3.5 w-20 text-center">STT</th>
                            <th className="px-6 py-3.5">Chỉ tiêu Chuyên môn</th>
                            <th className="px-6 py-3.5 text-right w-48">Số lượng</th>
                            <th className="px-6 py-3.5 w-40 text-center">Đơn vị</th>
                            <th className="px-6 py-3.5 w-60">Chỉ số Hiệu suất / Tỷ lệ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {/* ==================== SECTION I ==================== */}
                        <tr className="bg-blue-50/60 dark:bg-blue-900/30 font-bold text-blue-900 dark:text-blue-200">
                            <td className="px-6 py-3 text-center">I</td>
                            <td className="px-6 py-3" colSpan={4}>HOẠT ĐỘNG KHÁM BỆNH (NGOẠI TRÚ)</td>
                        </tr>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                            <td className="px-6 py-3 text-center font-bold text-slate-500">1</td>
                            <td className="px-6 py-3 font-bold text-slate-900 dark:text-slate-100">Tổng số lượt khám bệnh</td>
                            <td className="px-6 py-3 text-right font-black text-blue-600 dark:text-blue-400 text-base">
                                {tongKham.toLocaleString()}
                            </td>
                            <td className="px-6 py-3 text-center text-xs text-slate-500">Lượt khám</td>
                            <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">
                                100% Lượt tiếp nhận
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                            <td className="px-6 py-2.5 text-center text-slate-400">1.1</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Khám Bảo hiểm Y tế (BHYT)</td>
                            <td className="px-6 py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                                {soBhyt.toLocaleString()}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500">Lượt</td>
                            <td className="px-6 py-2.5 text-xs font-semibold text-emerald-600">
                                {bhytRatio}% tổng lượt khám
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                            <td className="px-6 py-2.5 text-center text-slate-400">1.2</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Khám Viện phí / Dịch vụ</td>
                            <td className="px-6 py-2.5 text-right font-semibold text-amber-600 dark:text-amber-400">
                                {soDv.toLocaleString()}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500">Lượt</td>
                            <td className="px-6 py-2.5 text-xs font-semibold text-amber-600">
                                {tongKham > 0 ? ((soDv / tongKham) * 100).toFixed(1) : 0}% tổng lượt khám
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                            <td className="px-6 py-2.5 text-center text-slate-400">1.3</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Số ca chỉ định Nhập viện</td>
                            <td className="px-6 py-2.5 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                                {Number(exam.nhap_vien || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500">Ca bệnh</td>
                            <td className="px-6 py-2.5 text-xs text-slate-500">
                                {tongKham > 0 ? ((Number(exam.nhap_vien || 0) / tongKham) * 100).toFixed(2) : 0}% tỷ lệ vào viện
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                            <td className="px-6 py-2.5 text-center text-slate-400">1.4</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Số ca Chuyển tuyến / Chuyển viện</td>
                            <td className="px-6 py-2.5 text-right font-semibold text-rose-600 dark:text-rose-400">
                                {chuyenVien.toLocaleString()}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500">Ca bệnh</td>
                            <td className="px-6 py-2.5 text-xs font-semibold text-rose-600">
                                {chuyenVienRatio}% tỷ lệ chuyển tuyến
                            </td>
                        </tr>

                        {/* ==================== SECTION II ==================== */}
                        <tr className="bg-emerald-50/60 dark:bg-emerald-900/30 font-bold text-emerald-900 dark:text-emerald-200">
                            <td className="px-6 py-3 text-center">II</td>
                            <td className="px-6 py-3" colSpan={4}>HOẠT ĐỘNG ĐIỀU TRỊ NỘI TRÚ</td>
                        </tr>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                            <td className="px-6 py-3 text-center font-bold text-slate-500">2</td>
                            <td className="px-6 py-3 font-bold text-slate-900 dark:text-slate-100">Số người bệnh Vào điều trị nội trú</td>
                            <td className="px-6 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 text-base">
                                {vaoVien.toLocaleString()}
                            </td>
                            <td className="px-6 py-3 text-center text-xs text-slate-500">Người bệnh</td>
                            <td className="px-6 py-3 text-xs text-slate-600 dark:text-slate-300">Tổng nhập viện mới</td>
                        </tr>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                            <td className="px-6 py-2.5 text-center text-slate-400">2.1</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Số người bệnh Ra viện (khỏi, đỡ)</td>
                            <td className="px-6 py-2.5 text-right font-semibold text-emerald-600">
                                {Number(inp.ra_vien || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500">Người bệnh</td>
                            <td className="px-6 py-2.5 text-xs text-slate-500">
                                {vaoVien > 0 ? ((Number(inp.ra_vien || 0) / vaoVien) * 100).toFixed(1) : 0}% tỷ lệ ra/vào
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                            <td className="px-6 py-2.5 text-center text-slate-400">2.2</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Số ca Tử vong tại bệnh viện</td>
                            <td className="px-6 py-2.5 text-right font-bold text-rose-600">
                                {tuVong.toLocaleString()}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500">Ca bệnh</td>
                            <td className="px-6 py-2.5 text-xs font-semibold text-rose-600">
                                {tuVongRatio}% tỷ lệ tử vong
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                            <td className="px-6 py-2.5 text-center text-slate-400">2.3</td>
                            <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">- Số người bệnh Đang nằm điều trị</td>
                            <td className="px-6 py-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                {Number(inp.dang_dieu_tri || 0).toLocaleString()}
                            </td>
                            <td className="px-6 py-2.5 text-center text-xs text-slate-500">Người bệnh</td>
                            <td className="px-6 py-2.5 text-xs text-indigo-600 font-semibold">Hiện diện tại buồng bệnh</td>
                        </tr>

                        {/* ==================== SECTION III ==================== */}
                        <tr className="bg-purple-50/60 dark:bg-purple-900/30 font-bold text-purple-900 dark:text-purple-200">
                            <td className="px-6 py-3 text-center">III</td>
                            <td className="px-6 py-3" colSpan={4}>HOẠT ĐỘNG CẬN LÂM SÀNG (CLS)</td>
                        </tr>
                        {Array.isArray(data?.paraclinical) && data.paraclinical.length > 0 ? (
                            data.paraclinical.map((cls, i) => (
                                <tr key={cls.cls_group} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                                    <td className="px-6 py-2.5 text-center text-slate-400">3.{i + 1}</td>
                                    <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">
                                        - {cls.cls_group === 'XET_NGHIEM' ? 'Xét nghiệm (LIS)' : cls.cls_group === 'CDHA' ? 'Chẩn đoán hình ảnh (RIS/PACS)' : cls.cls_group === 'TDCN' ? 'Thăm dò chức năng (TDCN)' : cls.cls_group}
                                    </td>
                                    <td className="px-6 py-2.5 text-right font-semibold text-purple-600">
                                        {Number(cls.so_chi_dinh || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-2.5 text-center text-xs text-slate-500">Chỉ định</td>
                                    <td className="px-6 py-2.5 text-xs text-slate-500">
                                        {Number(cls.so_benh_nhan || 0).toLocaleString()} bệnh nhân
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="px-6 py-3 text-center text-slate-400">3</td>
                                <td className="px-6 py-3 text-slate-500 italic pl-10" colSpan={4}>Không có chỉ định cận lâm sàng trong kỳ</td>
                            </tr>
                        )}

                        {/* ==================== SECTION IV ==================== */}
                        <tr className="bg-amber-50/60 dark:bg-amber-900/30 font-bold text-amber-900 dark:text-amber-200">
                            <td className="px-6 py-3 text-center">IV</td>
                            <td className="px-6 py-3" colSpan={4}>PHẪU THUẬT - THỦ THUẬT (PTTT)</td>
                        </tr>
                        {Array.isArray(data?.surgery) && data.surgery.length > 0 ? (
                            data.surgery.map((sur, i) => (
                                <tr key={sur.pttt_type} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition">
                                    <td className="px-6 py-2.5 text-center text-slate-400">4.{i + 1}</td>
                                    <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300 pl-10">
                                        - {sur.pttt_type === 'PHAU_THUAT' ? 'Phẫu thuật các loại' : 'Thủ thuật các loại'}
                                    </td>
                                    <td className="px-6 py-2.5 text-right font-bold text-amber-600">
                                        {Number(sur.tong_so_ca || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-2.5 text-center text-xs text-slate-500">Ca thực hiện</td>
                                    <td className="px-6 py-2.5 text-xs text-slate-500">
                                        {Number(sur.so_benh_nhan || 0).toLocaleString()} người bệnh
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="px-6 py-3 text-center text-slate-400">4</td>
                                <td className="px-6 py-3 text-slate-500 italic pl-10" colSpan={4}>Không có ca phẫu thuật thủ thuật trong kỳ</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <PrintReportFooter />
        </div>
    );
};
