
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TrashIcon, PlusIcon, PrinterIcon, CurrencyDollarIcon, CreditCardIcon, DocumentReportIcon, ReceiptIcon } from '../../../components/Icons';
import PdfPreviewModal from '../../../components/ui/PdfPreviewModal';
import { useTheme } from '../../../contexts/ThemeContext';

// --- Types ---
interface MedicalInvoice {
    id: string;
    patientId: string;
    patientName: string;
    date: string;
    totalAmount: number;
    insurancePaid: number;
    patientPaid: number;
    status: 'pending' | 'paid' | 'cancelled';
    items: InvoiceItem[];
}

interface InvoiceItem {
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    type: 'service' | 'drug' | 'material';
}

// --- Mock Data ---
const mockInvoices: MedicalInvoice[] = [
    {
        id: 'INV-2310-001',
        patientId: 'P001',
        patientName: 'Nguyễn Văn An',
        date: '2023-10-27',
        totalAmount: 1500000,
        insurancePaid: 1000000,
        patientPaid: 500000,
        status: 'paid',
        items: [
            { id: '1', name: 'Khám tổng quát', quantity: 1, unitPrice: 300000, total: 300000, type: 'service' },
            { id: '2', name: 'Xét nghiệm máu tổng quát', quantity: 1, unitPrice: 800000, total: 800000, type: 'service' },
            { id: '3', name: 'Thuốc bổ gan', quantity: 2, unitPrice: 200000, total: 400000, type: 'drug' }
        ]
    },
    {
        id: 'INV-2310-002',
        patientId: 'P003',
        patientName: 'Lê Hoàng Cường',
        date: '2023-10-27',
        totalAmount: 450000,
        insurancePaid: 0,
        patientPaid: 0,
        status: 'pending',
        items: [
            { id: '1', name: 'Khám tai mũi họng', quantity: 1, unitPrice: 250000, total: 250000, type: 'service' },
            { id: '2', name: 'Nội soi tai', quantity: 1, unitPrice: 200000, total: 200000, type: 'service' }
        ]
    },
    {
        id: 'INV-2310-003',
        patientId: 'P002',
        patientName: 'Trần Thị Bích',
        date: '2023-10-26',
        totalAmount: 2100000,
        insurancePaid: 1800000,
        patientPaid: 300000,
        status: 'paid',
        items: [
            { id: '1', name: 'Siêu âm thai 4D', quantity: 1, unitPrice: 500000, total: 500000, type: 'service' },
            { id: '2', name: 'Xét nghiệm Double Test', quantity: 1, unitPrice: 1600000, total: 1600000, type: 'service' }
        ]
    },
];

// --- PDF Generator ---
const generateMedicalInvoicePdf = (invoice: MedicalInvoice) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(6, 182, 212); // Cyan-500
    doc.text("BỆNH VIỆN ĐA KHOA VIMES HIS", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("123 Đường Sức Khỏe, Quận 1, TP. Hồ Chí Minh", 105, 28, { align: "center" });
    doc.text("Hotline: 1900 1234 | Email: contact@vimes.com.vn", 105, 34, { align: "center" });
    
    doc.setDrawColor(200);
    doc.line(15, 40, 195, 40);

    // Invoice Title
    doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text(invoice.status === 'paid' ? "HÓA ĐƠN THANH TOÁN" : "PHIẾU YÊU CẦU THANH TOÁN", 105, 55, { align: "center" });

    // Info
    doc.setFontSize(11);
    doc.setTextColor(60);
    const leftX = 20;
    const rightX = 120;
    let y = 70;

    doc.text(`Mã hóa đơn: ${invoice.id}`, leftX, y);
    doc.text(`Ngày: ${new Date(invoice.date).toLocaleDateString('vi-VN')}`, rightX, y);
    y += 8;
    doc.text(`Bệnh nhân: ${invoice.patientName}`, leftX, y);
    doc.text(`Mã BN: ${invoice.patientId}`, rightX, y);
    y += 10;
    
    // Table
    const tableBody = invoice.items.map((item, index) => [
        index + 1,
        item.name,
        item.quantity,
        item.unitPrice.toLocaleString('vi-VN'),
        item.total.toLocaleString('vi-VN')
    ]);

    autoTable(doc, {
        startY: y,
        head: [['STT', 'Dịch vụ / Thuốc', 'SL', 'Đơn giá (đ)', 'Thành tiền (đ)']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [6, 182, 212] },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'right' },
            4: { halign: 'right' }
        }
    });

    // Totals
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    
    const drawTotalLine = (label: string, value: number, isBold = false) => {
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        doc.text(label, 130, finalY);
        doc.text(`${value.toLocaleString('vi-VN')} đ`, 190, finalY, { align: 'right' });
        finalY += 7;
    };

    drawTotalLine("Tổng cộng:", invoice.totalAmount);
    drawTotalLine("Bảo hiểm chi trả:", invoice.insurancePaid);
    doc.setDrawColor(150);
    doc.line(130, finalY - 3, 190, finalY - 3);
    finalY += 2;
    drawTotalLine("Bệnh nhân thanh toán:", invoice.patientPaid, true);

    // Footer
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text("Cảm ơn quý khách đã sử dụng dịch vụ!", 105, finalY + 15, { align: "center" });

    return doc;
};

// --- Custom Tooltip for Chart ---
const CustomChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg text-sm">
                <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                        <span className="text-slate-600 dark:text-slate-400">{entry.name}:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100 ml-auto">
                            {entry.value ? entry.value.toLocaleString() : 0}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

interface BillingProps {}

// --- 1. OVERVIEW COMPONENT ---
export const Overview: React.FC<BillingProps> = () => {
    const { theme } = useTheme();
    
    const stats = {
        totalRevenue: mockInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        insurancePending: mockInvoices.reduce((sum, inv) => sum + inv.insurancePaid, 0),
        cashCollection: mockInvoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.patientPaid, 0),
        pendingInvoices: mockInvoices.filter(i => i.status === 'pending').length
    };

    const chartData = mockInvoices.map(inv => ({
        name: inv.patientName.split(' ').pop(),
        Total: inv.totalAmount,
        Paid: inv.patientPaid,
        Insurance: inv.insurancePaid
    }));

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Doanh thu tổng</p>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                                {(stats.totalRevenue / 1000000).toFixed(1)}M
                            </h3>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <CurrencyDollarIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Thực thu (Tiền mặt)</p>
                            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                {(stats.cashCollection / 1000000).toFixed(1)}M
                            </h3>
                        </div>
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                            <CreditCardIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Bảo hiểm chi trả</p>
                            <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                                {(stats.insurancePending / 1000000).toFixed(1)}M
                            </h3>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <DocumentReportIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Hóa đơn chờ</p>
                            <h3 className="text-2xl font-bold text-amber-500 mt-1">
                                {stats.pendingInvoices}
                            </h3>
                        </div>
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                            <ReceiptIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart & Recent */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Phân tích doanh thu</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barSize={20} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                <XAxis dataKey="name" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip content={<CustomChartTooltip />} cursor={{fill: 'transparent'}} />
                                <Legend />
                                <Bar dataKey="Total" name="Tổng cộng" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Paid" name="Thực thu" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Giao dịch mới nhất</h3>
                    <div className="space-y-4">
                        {mockInvoices.slice(0, 5).map(inv => (
                            <div key={inv.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                <div>
                                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{inv.patientName}</p>
                                    <p className="text-xs text-slate-500">{inv.id}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">{inv.patientPaid.toLocaleString()} đ</p>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {inv.status === 'paid' ? 'Thành công' : 'Chờ TT'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface BillsManagerProps {
    bills?: any;
    customers?: any;
    addBill?: any;
    deleteBill?: any;
    updateBillStatus?: any;
    filter?: any;
    clearFilter?: any;
    onRowClick?: (patientId: string) => void;
}

// --- 2. INVOICE MANAGER (Details) ---
export const BillsManager: React.FC<BillingProps & BillsManagerProps> = ({ onRowClick }) => {
    const { fontSettings } = useTheme();
    const [invoices, setInvoices] = useState<MedicalInvoice[]>(mockInvoices);
    const [pdfPreview, setPdfPreview] = useState<{ url: string, fileName: string } | null>(null);

    const handlePrint = (invoice: MedicalInvoice) => {
        const doc = generateMedicalInvoicePdf(invoice);
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPdfPreview({
            url,
            fileName: `Invoice_${invoice.id}.pdf`
        });
    };

    const handlePayment = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if(window.confirm("Xác nhận đã thu tiền hóa đơn này?")) {
            setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'paid', patientPaid: inv.totalAmount - inv.insurancePaid } : inv));
        }
    };

    const handleRowClickInternal = (invoice: MedicalInvoice) => {
        if (onRowClick) {
            onRowClick(invoice.patientId);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Danh sách Hóa đơn Y tế</h2>
                    <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg shadow-sm text-sm font-semibold flex items-center gap-2">
                        <PlusIcon className="w-4 h-4"/> Tạo hóa đơn
                    </button>
                </div>
                
                <div className="flex-1 overflow-auto">
                    <table className={`w-full text-left ${fontSettings.listPrimary}`}>
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold sticky top-0">
                            <tr>
                                <th className="p-4">Mã HĐ</th>
                                <th className="p-4">Bệnh nhân</th>
                                <th className="p-4 text-center">Ngày lập</th>
                                <th className="p-4 text-right">Tổng tiền</th>
                                <th className="p-4 text-right">BHYT</th>
                                <th className="p-4 text-right">BN Trả</th>
                                <th className="p-4 text-center">Trạng thái</th>
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {invoices.map(invoice => (
                                <tr 
                                    key={invoice.id} 
                                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                                    onClick={() => handleRowClickInternal(invoice)}
                                >
                                    <td className="p-4 font-mono text-slate-600 dark:text-slate-300 text-sm">{invoice.id}</td>
                                    <td className="p-4 font-medium text-slate-800 dark:text-white">{invoice.patientName}</td>
                                    <td className="p-4 text-center text-slate-500 dark:text-slate-400">{new Date(invoice.date).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-4 text-right font-bold text-slate-700 dark:text-slate-200">{invoice.totalAmount.toLocaleString()}</td>
                                    <td className="p-4 text-right text-blue-600 dark:text-blue-400">{invoice.insurancePaid.toLocaleString()}</td>
                                    <td className="p-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">{invoice.patientPaid.toLocaleString()}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                            invoice.status === 'paid' 
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}>
                                            {invoice.status === 'paid' ? 'Đã TT' : 'Chờ TT'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center flex justify-center gap-2">
                                        {invoice.status === 'pending' && (
                                            <button 
                                                onClick={(e) => handlePayment(e, invoice.id)}
                                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition" 
                                                title="Thanh toán"
                                            >
                                                <CreditCardIcon className="w-5 h-5"/>
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handlePrint(invoice); }}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition" 
                                            title="In hóa đơn"
                                        >
                                            <PrinterIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <PdfPreviewModal
                isOpen={!!pdfPreview}
                onClose={() => {
                    if (pdfPreview?.url) URL.revokeObjectURL(pdfPreview.url);
                    setPdfPreview(null);
                }}
                pdfUrl={pdfPreview?.url || ''}
                fileName={pdfPreview?.fileName || 'Invoice.pdf'}
                isSignable={false}
            />
        </>
    );
};

export const Payments: React.FC<BillingProps> = () => (
    <div className="text-center p-10 text-slate-500 dark:text-slate-400">
        <h3 className="text-xl font-bold mb-2">Cổng thanh toán & Công nợ</h3>
        <p>Chức năng quản lý công nợ bảo hiểm và thanh toán trực tuyến đang được phát triển.</p>
    </div>
);

export const Reports: React.FC<BillingProps> = () => (
    <div className="text-center p-10 text-slate-500 dark:text-slate-400">
        <h3 className="text-xl font-bold mb-2">Báo cáo tài chính chi tiết</h3>
        <p>Các báo cáo doanh thu theo bác sĩ, theo dịch vụ đang được xây dựng.</p>
    </div>
);
