import React, { useState, useMemo, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { Bill, Customer, Signature } from '../../../types';
import { TrashIcon, PlusIcon, DownloadIcon, ReceiptIcon, DocumentReportIcon, ShareIcon, SignatureIcon } from '../../../components/Icons';
import Card from '../../../components/shared/Card';
import ConfirmationModal from '../../../components/shared/ConfirmationModal';
import PdfPreviewModal from '../../../components/shared/PdfPreviewModal';
import SignatureModal from '../../../components/shared/SignatureModal';

// --- PDF HELPER FUNCTIONS ---
const SIGNATURE_BOX = { x: 40, y: 700, width: 150, height: 50 }; 
const PDF_TEXT_RENDER_SCALE = 5; // Use a higher scale for sharper text rendering in the PDF

const addPdfHeader = (doc: jsPDF) => {
    const margin = 15;
    const headerY = 30;
    const logoColor = '#00A8E8';
    const secondaryColor = '#007EA7';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);

    doc.setFillColor(logoColor);
    doc.rect(margin, headerY - 12, 32, 14, 'F');

    doc.setTextColor('#FFFFFF');
    doc.text('Volt', margin + 3, headerY);

    doc.setTextColor(secondaryColor);
    doc.text('AI', margin + 32, headerY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Intelligent Energy Management', margin, headerY + 6);

    return headerY + 25; // Return new Y position for content
};

const addPdfFooter = (doc: jsPDF) => {
    const margin = 15;
    const pageCount = (doc as any).internal.getNumberOfPages();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        doc.setDrawColor(200);
        doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

        doc.setFontSize(9);
        doc.setTextColor(150);
        
        const dateStr = `Generated on: ${new Date().toLocaleString('en-GB')}`;
        doc.text(dateStr, margin, pageHeight - 10);
        
        doc.text(`Volt AI © ${new Date().getFullYear()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

        const pageNumText = `Page ${i} of ${pageCount}`;
        doc.text(pageNumText, pageWidth - margin, pageHeight - 10, { align: 'right' });
    }
};

const formatSignatureDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};


// Common Types for props
interface PageProps {
  bills: Bill[];
  customers: Customer[];
}

interface BillMutations {
  addBill: (bill: Omit<Bill, 'id' | 'status'>) => void;
  deleteBill: (id: string) => void;
  updateBillStatus: (id: string, status: 'paid' | 'unpaid') => void;
}

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-200 dark:bg-slate-700 p-2 border border-slate-300 dark:border-slate-600 rounded">
        <p className="label text-sm text-slate-600 dark:text-slate-300">{`Date: ${label}`}</p>
        <p className="intro text-sm text-cyan-500 dark:text-cyan-400">{`Consumption: ${payload[0].value} kWh`}</p>
        <p className="intro text-sm text-amber-500 dark:text-amber-400">{`Cost: ${payload[1].value.toLocaleString('vi-VN')} VND`}</p>
      </div>
    );
  }
  return null;
};

// --- 1. OVERVIEW COMPONENT ---
export const Overview: React.FC<PageProps> = ({ bills, customers }) => {
    const sortedBills = useMemo(() => [...bills].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [bills]);
    
    const summaryStats = useMemo(() => {
        const totalConsumption = bills.reduce((acc, bill) => acc + bill.consumption, 0);
        const totalCost = bills.reduce((acc, bill) => acc + bill.cost, 0);
        const unpaidBills = bills.filter(bill => bill.status === 'unpaid').length;
        return { totalConsumption, totalCost, unpaidBills };
    }, [bills]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                     <h3 className="text-slate-500 dark:text-slate-400 font-medium">Tổng tiêu thụ</h3>
                     <p className="text-3xl font-bold text-cyan-500">{summaryStats.totalConsumption} kWh</p>
                </div>
                <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                     <h3 className="text-slate-500 dark:text-slate-400 font-medium">Tổng doanh thu</h3>
                     <p className="text-3xl font-bold text-emerald-500">{summaryStats.totalCost.toLocaleString('vi-VN')} đ</p>
                </div>
                <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                     <h3 className="text-slate-500 dark:text-slate-400 font-medium">Chưa thanh toán</h3>
                     <p className="text-3xl font-bold text-amber-500">{summaryStats.unpaidBills}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                    <h3 className="text-lg font-bold mb-4">Biểu đồ Chi phí</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={sortedBills}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="cost" fill="#10b981" name="Chi phí (VND)" radius={[4, 4, 0, 0]}/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                 <div className="bg-surface dark:bg-dark-surface p-6 rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700">
                    <h3 className="text-lg font-bold mb-4">Danh sách Hóa đơn</h3>
                    <div className="overflow-y-auto max-h-[300px]">
                         <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-700">
                                    <th className="p-2">Ngày</th>
                                    <th className="p-2">Khách hàng</th>
                                    <th className="p-2 text-right">Số tiền</th>
                                    <th className="p-2 text-center">TT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedBills.map(bill => {
                                    const customer = customers.find(c => c.id === bill.customerId);
                                    return (
                                        <tr key={bill.id} className="border-b border-slate-100 dark:border-slate-700">
                                            <td className="p-2">{bill.date}</td>
                                            <td className="p-2">{customer?.name || bill.customerId}</td>
                                            <td className="p-2 text-right">{bill.cost.toLocaleString('vi-VN')}</td>
                                            <td className="p-2 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs ${bill.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {bill.status === 'paid' ? 'Đã thu' : 'Chưa thu'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
