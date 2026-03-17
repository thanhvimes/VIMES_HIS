
import React, { useState, useMemo } from 'react';
import { ReportDefinition, FilterValues } from '../../reports/types';
import { 
    PrinterIcon, 
    SearchIcon, 
    FilterIcon,
    DocumentArrowDownIcon,
    DocumentTextIcon,
    TableIcon
} from '../../../components/Icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- FILTER COMPONENT ---
const Filter: React.FC<{ onRun: (v: FilterValues) => void }> = ({ onRun }) => {
    const [filters, setFilters] = useState({
        quarter: '4',
        year: new Date().getFullYear(),
        type: '79a' // 79a (Ngoại trú) hoặc 80a (Nội trú)
    });

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap items-end gap-4">
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Loại mẫu</label>
                <select 
                    value={filters.type}
                    onChange={e => setFilters({...filters, type: e.target.value})}
                    className="w-40 p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600 font-bold text-blue-600"
                >
                    <option value="79a">Mẫu 79a (Ngoại trú)</option>
                    <option value="80a">Mẫu 80a (Nội trú)</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Quý</label>
                <select 
                    value={filters.quarter}
                    onChange={e => setFilters({...filters, quarter: e.target.value})}
                    className="w-24 p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
                >
                    <option value="1">Quý I</option>
                    <option value="2">Quý II</option>
                    <option value="3">Quý III</option>
                    <option value="4">Quý IV</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Năm</label>
                <input 
                    type="number" 
                    value={filters.year}
                    onChange={e => setFilters({...filters, year: parseInt(e.target.value)})}
                    className="w-24 p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
                />
            </div>
            <button 
                onClick={() => onRun(filters)}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded shadow flex items-center gap-2 transition-transform active:scale-95"
            >
                <SearchIcon className="w-4 h-4"/> Tổng hợp số liệu
            </button>
        </div>
    );
};

// --- CONTENT COMPONENT ---
const Content: React.FC<{ filters: FilterValues | null }> = ({ filters }) => {
    // Mock Data Generator
    const data = useMemo(() => {
        if (!filters) return [];
        return Array.from({ length: 15 }).map((_, i) => ({
            stt: i + 1,
            ho_ten: `Bệnh nhân ${i + 1}`,
            nam_sinh: 1980 + i,
            gioi_tinh: i % 2 === 0 ? 'Nam' : 'Nữ',
            ma_the: `GD479021556${(1000 + i).toString()}`,
            ma_dkbd: '01001',
            ma_benh: 'I10',
            ngay_kham: `0${(i % 9) + 1}/11/2023`,
            tong_cong: (i + 1) * 500000,
            xet_nghiem: (i + 1) * 100000,
            cdha: (i + 1) * 150000,
            thuoc: (i + 1) * 200000,
            mau: 0,
            pttt: 0,
            vtyt: (i + 1) * 50000,
            dvkt_tl: 0,
            thuoc_tl: 0,
            vtyt_tl: 0,
            tien_kham: 39000,
            van_chuyen: 0,
            nguoi_benh_tra: (i + 1) * 100000,
            bhyt_tra: (i + 1) * 400000,
            ngoai_dinh_suat: 0
        }));
    }, [filters]);

    const total = useMemo(() => {
        return data.reduce((acc, item) => ({
            tong_cong: acc.tong_cong + item.tong_cong,
            bhyt_tra: acc.bhyt_tra + item.bhyt_tra,
            nguoi_benh_tra: acc.nguoi_benh_tra + item.nguoi_benh_tra
        }), { tong_cong: 0, bhyt_tra: 0, nguoi_benh_tra: 0 });
    }, [data]);

    const formatCurrency = (val: number) => val.toLocaleString('vi-VN');

    const handleExportExcel = () => {
        if(!filters) return;
        alert(`Đang xuất Excel Mẫu ${filters.type} - Quý ${filters.quarter}/${filters.year}`);
    };

    if (!filters) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <TableIcon className="w-16 h-16 mb-4 opacity-20"/>
                <p>Chọn thời gian và loại mẫu báo cáo (79a/80a)</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                        TỔNG HỢP CHI PHÍ KCB BHYT {filters.type === '79a' ? 'NGOẠI TRÚ' : 'NỘI TRÚ'}
                    </h3>
                    <p className="text-xs text-slate-500">Mẫu số: C{filters.type}-HD | Quý {filters.quarter} năm {filters.year}</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-bold flex items-center gap-1">
                        <PrinterIcon className="w-3 h-3"/> In
                    </button>
                    <button onClick={handleExportExcel} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold flex items-center gap-1 shadow">
                        <DocumentArrowDownIcon className="w-3 h-3"/> Xuất Excel
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
                    <thead className="bg-slate-100 dark:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 sticky top-0 z-10">
                        <tr>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 text-center w-10" rowSpan={2}>STT</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 w-40" rowSpan={2}>Họ và tên</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 w-16 text-center" rowSpan={2}>Năm sinh</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 w-16 text-center" rowSpan={2}>Giới tính</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 w-32" rowSpan={2}>Mã thẻ BHYT</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 w-16 text-center" rowSpan={2}>Mã ĐKBĐ</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 w-16 text-center" rowSpan={2}>Mã bệnh</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 w-24 text-center" rowSpan={2}>Ngày khám</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 text-right w-24" rowSpan={2}>Tổng cộng</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 text-center" colSpan={7}>Trong đó</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 text-right w-24" rowSpan={2}>Người bệnh trả</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 text-right w-24" rowSpan={2}>BHYT trả</th>
                        </tr>
                        <tr>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 text-right">XN</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 text-right">CĐHA</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 text-right">Thuốc</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 text-right">Máu</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 text-right">PTTT</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 text-right">VTYT</th>
                            <th className="p-2 border border-slate-300 dark:border-slate-600 text-right">Khám</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {data.map((row) => (
                            <tr key={row.stt} className="hover:bg-blue-50 dark:hover:bg-slate-700/50">
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-center">{row.stt}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 font-medium">{row.ho_ten}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-center">{row.nam_sinh}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-center">{row.gioi_tinh}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600">{row.ma_the}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-center">{row.ma_dkbd}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-center">{row.ma_benh}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-center">{row.ngay_kham}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-right font-bold">{formatCurrency(row.tong_cong)}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-right text-slate-500">{formatCurrency(row.xet_nghiem)}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-right text-slate-500">{formatCurrency(row.cdha)}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-right text-slate-500">{formatCurrency(row.thuoc)}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-right text-slate-500">{formatCurrency(row.mau)}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-right text-slate-500">{formatCurrency(row.pttt)}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-right text-slate-500">{formatCurrency(row.vtyt)}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-right text-slate-500">{formatCurrency(row.tien_kham)}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-right font-semibold text-blue-600">{formatCurrency(row.nguoi_benh_tra)}</td>
                                <td className="p-2 border-r border-slate-200 dark:border-slate-600 text-right font-semibold text-teal-600">{formatCurrency(row.bhyt_tra)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-yellow-50 dark:bg-yellow-900/20 font-bold sticky bottom-0 z-10 border-t-2 border-yellow-200 dark:border-yellow-700">
                        <tr>
                            <td colSpan={8} className="p-2 text-center uppercase">Tổng cộng</td>
                            <td className="p-2 text-right">{formatCurrency(total.tong_cong)}</td>
                            <td colSpan={7}></td>
                            <td className="p-2 text-right text-blue-700 dark:text-blue-400">{formatCurrency(total.nguoi_benh_tra)}</td>
                            <td className="p-2 text-right text-teal-700 dark:text-teal-400">{formatCurrency(total.bhyt_tra)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export const InsuranceSettlementReport: ReportDefinition = {
    id: 'rep_ins_79_80',
    title: 'Quyết toán BHYT (Mẫu 79a/80a)',
    module: 'insurance',
    description: 'Bảng tổng hợp chi phí khám chữa bệnh BHYT Ngoại trú/Nội trú theo quy định.',
    FilterComponent: Filter,
    ContentComponent: Content
};
