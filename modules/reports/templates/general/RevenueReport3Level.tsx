
import React, { useState, useMemo, useEffect } from 'react';
import { ReportDefinition, FilterValues } from '../../types';
import { 
    RefreshIcon,
    ChartBarIcon,
    DocumentArrowDownIcon,
    DocumentTextIcon,
    PrinterIcon,
    ChevronDownIcon,
    ChevronRightIcon
} from '../../../../components/Icons';
import { reportService, RevenueReportItem } from '../../../../services/reportService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- FILTER COMPONENT ---
const Filter: React.FC<{ onRun: (v: FilterValues) => void }> = ({ onRun }) => {
    const [filters, setFilters] = useState({
        fromDate: new Date().toISOString().slice(0, 10),
        toDate: new Date().toISOString().slice(0, 10),
    });

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap items-end gap-4 no-print">
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Từ ngày</label>
                <input 
                    type="date" 
                    value={filters.fromDate}
                    onChange={e => setFilters({...filters, fromDate: e.target.value})}
                    className="p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600 w-40"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Đến ngày</label>
                <input 
                    type="date" 
                    value={filters.toDate}
                    onChange={e => setFilters({...filters, toDate: e.target.value})}
                    className="p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600 w-40"
                />
            </div>
            <button 
                onClick={() => onRun(filters)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded shadow flex items-center gap-2 transition-transform active:scale-95"
            >
                <RefreshIcon className="w-4 h-4"/> Lấy số liệu
            </button>
        </div>
    );
};

// --- DATA PROCESSING LOGIC (CORE) ---
interface GroupLevel2 {
    key: string;
    items: RevenueReportItem[];
    subTotal: { qty: number; revenue: number; insurance: number; patient: number };
    isExpanded: boolean;
}

interface GroupLevel1 {
    key: string;
    groups: GroupLevel2[];
    subTotal: { qty: number; revenue: number; insurance: number; patient: number };
    isExpanded: boolean;
}

// --- CONTENT COMPONENT ---
const Content: React.FC<{ filters: FilterValues | null }> = ({ filters }) => {
    const [loading, setLoading] = useState(false);
    const [dataTree, setDataTree] = useState<GroupLevel1[]>([]);
    const [grandTotal, setGrandTotal] = useState({ qty: 0, revenue: 0, insurance: 0, patient: 0 });
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (filters) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const result = await reportService.getRevenueReport(filters.fromDate, filters.toDate);
                    processDataToTree(result);
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }
    }, [filters]);

    const processDataToTree = (items: RevenueReportItem[]) => {
        const tree: GroupLevel1[] = [];
        const total = { qty: 0, revenue: 0, insurance: 0, patient: 0 };

        const groupedByDept = items.reduce((acc, item) => {
            if (!acc[item.departmentName]) acc[item.departmentName] = [];
            acc[item.departmentName].push(item);
            return acc;
        }, {} as Record<string, RevenueReportItem[]>);

        Object.entries(groupedByDept).forEach(([deptName, deptItems]) => {
            const deptSubTotal = { qty: 0, revenue: 0, insurance: 0, patient: 0 };
            const level2Groups: GroupLevel2[] = [];

            const groupedByServiceGroup = deptItems.reduce((acc, item) => {
                if (!acc[item.serviceGroup]) acc[item.serviceGroup] = [];
                acc[item.serviceGroup].push(item);
                return acc;
            }, {} as Record<string, RevenueReportItem[]>);

            Object.entries(groupedByServiceGroup).forEach(([groupName, serviceItems]) => {
                const groupSubTotal = serviceItems.reduce((sum, i) => ({
                    qty: sum.qty + i.quantity,
                    revenue: sum.revenue + i.totalRevenue,
                    insurance: sum.insurance + i.insurancePaid,
                    patient: sum.patient + i.patientPaid
                }), { qty: 0, revenue: 0, insurance: 0, patient: 0 });

                level2Groups.push({
                    key: groupName,
                    items: serviceItems,
                    subTotal: groupSubTotal,
                    isExpanded: true
                });

                deptSubTotal.qty += groupSubTotal.qty;
                deptSubTotal.revenue += groupSubTotal.revenue;
                deptSubTotal.insurance += groupSubTotal.insurance;
                deptSubTotal.patient += groupSubTotal.patient;
            });

            tree.push({
                key: deptName,
                groups: level2Groups,
                subTotal: deptSubTotal,
                isExpanded: true
            });

            total.qty += deptSubTotal.qty;
            total.revenue += deptSubTotal.revenue;
            total.insurance += deptSubTotal.insurance;
            total.patient += deptSubTotal.patient;
        });

        setDataTree(tree);
        setGrandTotal(total);
    };

    const toggleLevel1 = (index1: number) => {
        const newTree = [...dataTree];
        newTree[index1].isExpanded = !newTree[index1].isExpanded;
        setDataTree(newTree);
    };

    const toggleLevel2 = (index1: number, index2: number) => {
        const newTree = [...dataTree];
        newTree[index1].groups[index2].isExpanded = !newTree[index1].groups[index2].isExpanded;
        setDataTree(newTree);
    };

    const formatCurrency = (val: number) => val.toLocaleString('vi-VN');

    const generatePdfDocument = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(14);
        doc.setTextColor(40);
        doc.text("BÁO CÁO DOANH THU DỊCH VỤ CHI TIẾT", 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Thời gian: ${filters?.fromDate} đến ${filters?.toDate}`, 105, 28, { align: 'center' });

        const tableBody: any[] = [];
        
        dataTree.forEach((l1, i1) => {
            tableBody.push([
                { content: `${i1 + 1}. ${l1.key.toUpperCase()}`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [220, 230, 240] } },
                { content: formatCurrency(l1.subTotal.revenue), styles: { fontStyle: 'bold', fillColor: [220, 230, 240], halign: 'right' } },
                { content: formatCurrency(l1.subTotal.insurance), styles: { fontStyle: 'bold', fillColor: [220, 230, 240], halign: 'right' } },
                { content: formatCurrency(l1.subTotal.patient), styles: { fontStyle: 'bold', fillColor: [220, 230, 240], halign: 'right' } },
            ]);

            l1.groups.forEach((l2) => {
                tableBody.push([
                    { content: `  ${l2.key}`, colSpan: 4, styles: { fontStyle: 'bold', textColor: [80, 80, 80] } },
                    { content: formatCurrency(l2.subTotal.revenue), styles: { fontStyle: 'bold', halign: 'right' } },
                    { content: formatCurrency(l2.subTotal.insurance), styles: { fontStyle: 'bold', halign: 'right' } },
                    { content: formatCurrency(l2.subTotal.patient), styles: { fontStyle: 'bold', halign: 'right' } },
                ]);

                l2.items.forEach(item => {
                    tableBody.push([
                        '',
                        item.serviceName,
                        'Lần',
                        item.quantity,
                        formatCurrency(item.totalRevenue),
                        formatCurrency(item.insurancePaid),
                        formatCurrency(item.patientPaid),
                    ]);
                });
            });
        });

        tableBody.push([
            { content: "TỔNG CỘNG", colSpan: 4, styles: { fontStyle: 'bold', fillColor: [255, 200, 0] } },
            { content: formatCurrency(grandTotal.revenue), styles: { fontStyle: 'bold', fillColor: [255, 200, 0], halign: 'right' } },
            { content: formatCurrency(grandTotal.insurance), styles: { fontStyle: 'bold', fillColor: [255, 200, 0], halign: 'right' } },
            { content: formatCurrency(grandTotal.patient), styles: { fontStyle: 'bold', fillColor: [255, 200, 0], halign: 'right' } },
        ]);

        autoTable(doc, {
            head: [['', 'Nội dung', 'ĐVT', 'SL', 'Thành tiền', 'BHYT', 'BN Trả']],
            body: tableBody,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 15 },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'right' }
            },
        });

        return doc;
    };

    const handlePrint = () => {
        if (dataTree.length === 0) return alert('Không có dữ liệu.');
        const doc = generatePdfDocument();
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        window.open(url, '_blank');
    };

    const handleExportPdf = () => {
        if (dataTree.length === 0) return alert('Không có dữ liệu.');
        const doc = generatePdfDocument();
        doc.save(`DoanhThu_${new Date().getTime()}.pdf`);
    };

    const handleExportExcel = () => {
        if (dataTree.length === 0) return alert('Không có dữ liệu.');
        let csvContent = "\uFEFFSTT,Nội dung,Đơn vị,SL,Thành tiền,BHYT,BN Trả\n";
        
        dataTree.forEach((l1, i1) => {
            csvContent += `"${i1+1}","${l1.key}",,,${l1.subTotal.revenue},${l1.subTotal.insurance},${l1.subTotal.patient}\n`;
            l1.groups.forEach(l2 => {
                csvContent += `,"${l2.key}",,,${l2.subTotal.revenue},${l2.subTotal.insurance},${l2.subTotal.patient}\n`;
                l2.items.forEach(i => {
                    csvContent += `,"${i.serviceName}","Lần",${i.quantity},${i.totalRevenue},${i.insurancePaid},${i.patientPaid}\n`;
                });
            });
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'DoanhThu.csv';
        link.click();
    };

    if (loading) return <div className="p-10 text-center text-slate-500">Đang tải dữ liệu...</div>;
    if (!filters) return <div className="p-10 text-center text-slate-400">Vui lòng chọn thời gian xem báo cáo</div>;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center no-print">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <ChartBarIcon className="w-5 h-5 text-blue-600"/> Kết quả Báo cáo
                </h3>
                <div className="flex gap-2">
                     <button onClick={handlePrint} className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded flex items-center gap-1 shadow-sm">
                        <PrinterIcon className="w-3 h-3"/> In
                    </button>
                     <button onClick={handleExportExcel} className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 flex items-center gap-1 shadow">
                        <DocumentArrowDownIcon className="w-3 h-3"/> Excel
                    </button>
                    <button onClick={handleExportPdf} className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 flex items-center gap-1 shadow">
                        <DocumentTextIcon className="w-3 h-3"/> PDF
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar relative">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-700 font-bold text-slate-600 dark:text-slate-300 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-3 w-10 text-center"></th>
                            <th className="p-3">Nội dung</th>
                            <th className="p-3 w-20 text-center">SL</th>
                            <th className="p-3 w-32 text-right">Thành tiền</th>
                            <th className="p-3 w-32 text-right">BHYT</th>
                            <th className="p-3 w-32 text-right">BN Trả</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {dataTree.map((level1, idx1) => (
                            <React.Fragment key={level1.key}>
                                <tr className="bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 dark:hover:bg-blue-900/60 cursor-pointer" onClick={() => toggleLevel1(idx1)}>
                                    <td className="p-3 text-center">
                                        {level1.isExpanded ? <ChevronDownIcon className="w-4 h-4"/> : <ChevronRightIcon className="w-4 h-4"/>}
                                    </td>
                                    <td className="p-3 font-bold uppercase text-blue-800 dark:text-blue-200">{level1.key}</td>
                                    <td className="p-3 text-center font-bold">{level1.subTotal.qty.toLocaleString()}</td>
                                    <td className="p-3 text-right font-bold">{formatCurrency(level1.subTotal.revenue)}</td>
                                    <td className="p-3 text-right font-bold text-slate-500">{formatCurrency(level1.subTotal.insurance)}</td>
                                    <td className="p-3 text-right font-bold text-blue-700 dark:text-blue-300">{formatCurrency(level1.subTotal.patient)}</td>
                                </tr>
                                {level1.isExpanded && level1.groups.map((level2, idx2) => (
                                    <React.Fragment key={level2.key}>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer" onClick={() => toggleLevel2(idx1, idx2)}>
                                            <td className="p-3"></td>
                                            <td className="p-3 pl-8 font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                {level2.isExpanded ? <ChevronDownIcon className="w-3 h-3 text-slate-400"/> : <ChevronRightIcon className="w-3 h-3 text-slate-400"/>}
                                                {level2.key}
                                            </td>
                                            <td className="p-3 text-center font-semibold">{level2.subTotal.qty.toLocaleString()}</td>
                                            <td className="p-3 text-right font-semibold">{formatCurrency(level2.subTotal.revenue)}</td>
                                            <td className="p-3 text-right text-slate-500">{formatCurrency(level2.subTotal.insurance)}</td>
                                            <td className="p-3 text-right text-blue-600 dark:text-blue-400">{formatCurrency(level2.subTotal.patient)}</td>
                                        </tr>
                                        {level2.isExpanded && level2.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-yellow-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-50 dark:border-slate-700/50">
                                                <td className="p-2"></td>
                                                <td className="p-2 pl-16 text-slate-600 dark:text-slate-400">{item.serviceName}</td>
                                                <td className="p-2 text-center text-slate-600 dark:text-slate-400">{item.quantity}</td>
                                                <td className="p-2 text-right text-slate-700 dark:text-slate-300">{formatCurrency(item.totalRevenue)}</td>
                                                <td className="p-2 text-right text-slate-500 text-xs">{formatCurrency(item.insurancePaid)}</td>
                                                <td className="p-2 text-right text-slate-700 dark:text-slate-300">{formatCurrency(item.patientPaid)}</td>
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        ))}
                        <tr className="bg-yellow-100 dark:bg-yellow-900/30 font-bold text-slate-900 dark:text-white border-t-2 border-yellow-300 sticky bottom-0 shadow-inner">
                            <td className="p-4 text-center"></td>
                            <td className="p-4 uppercase">TỔNG CỘNG TOÀN VIỆN</td>
                            <td className="p-4 text-center">{grandTotal.qty.toLocaleString()}</td>
                            <td className="p-4 text-right text-red-600 dark:text-red-400 text-base">{formatCurrency(grandTotal.revenue)}</td>
                            <td className="p-4 text-right">{formatCurrency(grandTotal.insurance)}</td>
                            <td className="p-4 text-right text-blue-700 dark:text-blue-300 text-base">{formatCurrency(grandTotal.patient)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const RevenueMultiLevelReport: ReportDefinition = {
    id: 'rep_gen_03_revenue',
    title: '3. Báo cáo Doanh thu Dịch vụ (Đa cấp)',
    module: 'billing',
    description: 'Báo cáo tổng hợp doanh thu theo Khoa -> Nhóm -> Dịch vụ chi tiết',
    FilterComponent: Filter,
    ContentComponent: Content
};
