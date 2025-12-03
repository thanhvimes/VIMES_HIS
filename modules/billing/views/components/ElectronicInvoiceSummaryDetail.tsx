
import React, { useState, useEffect } from 'react';
import { 
    XIcon, 
    ClipboardListIcon, 
    RefreshIcon, 
    DocumentArrowDownIcon, 
    BanIcon, 
    PrinterIcon,
    CheckCircleIcon,
    ExclamationCircleIcon
} from '../../../../components/Icons';
import { useTheme } from '../../../../contexts/ThemeContext';
import { invoiceService, InvoiceDetailDB, SummarySheetDB } from '../../../../services/invoiceService';

interface ElectronicInvoiceSummaryDetailProps {
    isOpen: boolean;
    onClose: () => void;
    sheet: SummarySheetDB | null;
    onCancelSheet: (sheet: SummarySheetDB) => void; // Callback to parent to handle cancel
}

const ElectronicInvoiceSummaryDetail: React.FC<ElectronicInvoiceSummaryDetailProps> = ({ 
    isOpen, 
    onClose, 
    sheet, 
    onCancelSheet 
}) => {
    const { fontSettings } = useTheme();
    const [details, setDetails] = useState<InvoiceDetailDB[]>([]);
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Load details when sheet changes
    useEffect(() => {
        if (isOpen && sheet) {
            const fetchDetails = async () => {
                setLoading(true);
                try {
                    const data = await invoiceService.getInvoicesBySummaryId(sheet.hfe_orderid);
                    setDetails(data);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchDetails();
        } else {
            setDetails([]);
        }
    }, [isOpen, sheet]);

    const handleExportExcel = async () => {
        if (!sheet || details.length === 0) return;
        setIsExporting(true);
        try {
            // Format data for export
            const exportData = details.map((item, index) => ({
                STT: index + 1,
                SoHoaDon: item.hfe_invoice_number,
                MauSo: item.hfe_patter,
                KyHieu: item.hfe_serial,
                NgayHD: new Date(item.hfe_invoice_date).toLocaleDateString('vi-VN'),
                TenKhachHang: item.hfe_cusname,
                MaSoThue: item.hfe_custaxcode,
                DiaChi: item.hfe_cusaddress,
                TienHang: item.hfe_amount,
                TienThue: item.hfe_vatamount,
                TongTien: item.hfe_patpaid,
                TrangThai: item.hfe_status === 'P' ? 'Da phat hanh' : 'Moi tao'
            }));

            await invoiceService.exportToExcel(exportData, `BangKe_${sheet.hfe_orderid}.csv`);
        } catch (error) {
            alert("Lỗi khi xuất Excel");
        } finally {
            setIsExporting(false);
        }
    };

    const handleCancel = () => {
        if (sheet) {
            onCancelSheet(sheet);
        }
    };

    const getStatusBadge = (status: string) => {
        switch(status) {
            case 'P': return <span className="px-2 py-1 bg-green-100 text-green-700 border border-green-200 rounded text-xs font-bold flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> Đã phát hành</span>;
            case 'O': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded text-xs font-bold">Mới tạo</span>;
            case 'C': return <span className="px-2 py-1 bg-red-100 text-red-700 border border-red-200 rounded text-xs font-bold flex items-center gap-1"><ExclamationCircleIcon className="w-3 h-3"/> Đã hủy</span>;
            default: return null;
        }
    };

    if (!isOpen || !sheet) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col overflow-hidden animate-zoom-in max-h-[95vh] border border-slate-200 dark:border-slate-700">
                
                {/* 1. Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-100 to-white dark:from-slate-900 dark:to-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                            <ClipboardListIcon className="w-6 h-6"/>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                Chi tiết Bảng kê tổng hợp #{sheet.hfe_orderid}
                                {getStatusBadge(sheet.hfe_status)}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Người lập: <span className="font-bold">{sheet.hfe_createdby}</span> • Ngày lập: {new Date(sheet.hfe_createddate).toLocaleString('vi-VN')}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition">
                        <XIcon className="w-6 h-6"/>
                    </button>
                </div>

                {/* 2. Info & Actions Bar */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="flex-1 text-sm text-slate-600 dark:text-slate-300 italic border-l-4 border-blue-500 pl-3">
                        "{sheet.hfe_desc}"
                    </div>
                    
                    <div className="flex items-center gap-2">
                         {sheet.hfe_status !== 'C' && (
                            <button 
                                onClick={handleCancel}
                                className="px-3 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm transition active:scale-95"
                            >
                                <BanIcon className="w-4 h-4"/> Hủy Bảng kê
                            </button>
                         )}
                         
                         <button 
                            className="px-3 py-2 bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 rounded-lg font-bold text-xs flex items-center gap-2 shadow-sm transition"
                         >
                            <PrinterIcon className="w-4 h-4"/> In ấn
                         </button>

                         <button 
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-xs flex items-center gap-2 shadow-md transition active:scale-95 disabled:opacity-70"
                        >
                            {isExporting ? <RefreshIcon className="w-4 h-4 animate-spin"/> : <DocumentArrowDownIcon className="w-4 h-4"/>}
                            Xuất Excel
                        </button>
                    </div>
                </div>

                {/* 3. Table Content */}
                <div className="flex-1 overflow-auto p-0 bg-white dark:bg-slate-800">
                     {loading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <RefreshIcon className="w-8 h-8 animate-spin mb-2 text-blue-500"/>
                            <p>Đang tải dữ liệu chi tiết...</p>
                        </div>
                    ) : (
                        <table className={`w-full text-left border-collapse ${fontSettings.listSecondary}`}>
                            <thead className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-3 w-12 text-center border-r border-slate-200 dark:border-slate-600">STT</th>
                                    <th className="p-3 w-32 border-r border-slate-200 dark:border-slate-600">Số hóa đơn</th>
                                    <th className="p-3 w-32 border-r border-slate-200 dark:border-slate-600">Mẫu / Ký hiệu</th>
                                    <th className="p-3 w-28 border-r border-slate-200 dark:border-slate-600">Ngày HĐ</th>
                                    <th className="p-3 border-r border-slate-200 dark:border-slate-600">Tên khách hàng</th>
                                    <th className="p-3 w-32 text-right border-r border-slate-200 dark:border-slate-600">Thành tiền</th>
                                    <th className="p-3 w-32 text-right border-r border-slate-200 dark:border-slate-600">Tiền thuế</th>
                                    <th className="p-3 w-32 text-right">Tổng cộng</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {details.map((item, index) => (
                                    <tr key={item.hfe_key} className="hover:bg-blue-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="p-3 text-center text-slate-500 border-r border-slate-100 dark:border-slate-700">{index + 1}</td>
                                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400 border-r border-slate-100 dark:border-slate-700">
                                            {item.hfe_invoice_number || <span className="text-slate-400 italic font-normal">Chưa cấp</span>}
                                        </td>
                                        <td className="p-3 text-xs border-r border-slate-100 dark:border-slate-700">
                                            <div>{item.hfe_patter}</div>
                                            <div className="text-slate-500">{item.hfe_serial}</div>
                                        </td>
                                        <td className="p-3 border-r border-slate-100 dark:border-slate-700">
                                            {new Date(item.hfe_invoice_date).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="p-3 font-medium text-slate-800 dark:text-white border-r border-slate-100 dark:border-slate-700">
                                            {item.hfe_cusname}
                                            {item.hfe_docno && <div className="text-[10px] text-slate-400">Doc: {item.hfe_docno}</div>}
                                        </td>
                                        <td className="p-3 text-right text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-700">
                                            {item.hfe_amount.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-right text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-700">
                                            {item.hfe_vatamount.toLocaleString()}
                                        </td>
                                        <td className="p-3 text-right font-bold text-slate-800 dark:text-white">
                                            {item.hfe_patpaid.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {details.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="p-10 text-center text-slate-400 italic">
                                            Bảng kê này chưa có hóa đơn chi tiết nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            <tfoot className="bg-slate-50 dark:bg-slate-900 font-bold text-sm border-t-2 border-slate-300 dark:border-slate-600">
                                <tr>
                                    <td colSpan={5} className="p-3 text-right text-slate-600 dark:text-slate-400 uppercase">Tổng cộng:</td>
                                    <td className="p-3 text-right">{details.reduce((s, i) => s + i.hfe_amount, 0).toLocaleString()}</td>
                                    <td className="p-3 text-right">{details.reduce((s, i) => s + i.hfe_vatamount, 0).toLocaleString()}</td>
                                    <td className="p-3 text-right text-blue-700 dark:text-blue-400 text-base">
                                        {details.reduce((s, i) => s + i.hfe_patpaid, 0).toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
                
                {/* 4. Footer */}
                <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-bold text-sm transition">
                        Đóng cửa sổ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ElectronicInvoiceSummaryDetail;
