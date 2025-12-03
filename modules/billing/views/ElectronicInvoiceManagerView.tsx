
import React, { useState, useMemo, useEffect } from 'react';
import { 
    SearchIcon, 
    FilterIcon, 
    CloudUploadIcon, 
    DocumentTextIcon, 
    UserCircleIcon, 
    CalendarIcon, 
    EyeIcon, 
    PrinterIcon,
    ClipboardListIcon,
    PlusIcon,
    DocumentArrowDownIcon,
    CheckCircleIcon,
    RefreshIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { usePdfPreview } from '../../../contexts/PdfPreviewContext';
import { invoiceService, InvoiceDetailDB, SummarySheetDB } from '../../../services/invoiceService';

const ElectronicInvoiceManagerView: React.FC = () => {
    const { fontSettings } = useTheme();
    const { openPdf } = usePdfPreview();
    const [activeTab, setActiveTab] = useState<'invoices' | 'summary'>('invoices');
    
    // Data State
    const [invoices, setInvoices] = useState<InvoiceDetailDB[]>([]);
    const [sheets, setSheets] = useState<SummarySheetDB[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Selection State (For creating summary)
    const [selectedInvoiceKeys, setSelectedInvoiceKeys] = useState<Set<number>>(new Set());

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // --- LOAD DATA ---
    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'invoices') {
                const data = await invoiceService.getInvoiceLines();
                setInvoices(data);
            } else {
                const data = await invoiceService.getSummarySheets();
                setSheets(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    // --- FILTER LOGIC ---
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const matchesSearch = inv.hfe_cusname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  inv.hfe_invoice_number?.includes(searchTerm) || 
                                  inv.hfe_serial?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const statusMap: Record<string, string> = { 'O': 'Draft', 'P': 'Signed', 'C': 'Cancelled' };
            const currentStatus = statusMap[inv.hfe_status] || 'Unknown';
            
            const matchesStatus = statusFilter === 'All' || currentStatus === statusFilter;
            
            // Mock Date filter logic (string comparison for demo)
            const matchesDate = (!fromDate || inv.hfe_invoice_date >= fromDate) && (!toDate || inv.hfe_invoice_date <= toDate);
            
            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [invoices, searchTerm, statusFilter, fromDate, toDate]);

    const filteredSheets = useMemo(() => {
        return sheets.filter(sheet => {
            const matchesSearch = sheet.hfe_desc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  sheet.hfe_orderid.toString().includes(searchTerm);
             return matchesSearch;
        });
    }, [sheets, searchTerm]);

    // --- HANDLERS ---

    const handleToggleSelect = (key: number) => {
        const newSet = new Set(selectedInvoiceKeys);
        if (newSet.has(key)) newSet.delete(key);
        else newSet.add(key);
        setSelectedInvoiceKeys(newSet);
    };

    const handleCreateSummary = async () => {
        if (selectedInvoiceKeys.size === 0) {
            alert("Vui lòng chọn ít nhất một hóa đơn để lập bảng kê.");
            return;
        }

        const desc = prompt("Nhập diễn giải cho bảng kê (VD: Bảng kê ngày 03/12):", `Bảng kê tổng hợp ${new Date().toLocaleDateString('vi-VN')}`);
        if (!desc) return;

        setIsProcessing(true);
        try {
            await invoiceService.createSummarySheet(desc, Array.from(selectedInvoiceKeys));
            alert("Lập bảng kê thành công!");
            setSelectedInvoiceKeys(new Set());
            // Switch to summary tab to see result
            setActiveTab('summary');
        } catch (error) {
            alert("Lỗi khi tạo bảng kê.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportExcel = async () => {
        setIsProcessing(true);
        try {
            const data = activeTab === 'invoices' ? filteredInvoices : filteredSheets;
            await invoiceService.exportToExcel(data, `${activeTab}_export.csv`);
        } catch (error) {
            alert("Có lỗi khi xuất Excel");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePrint = (id: number | string) => {
        openPdf({
            url: invoiceService.getPrintUrl(id),
            fileName: `Print_${id}.pdf`,
            isSignable: false
        });
    };

    const getStatusBadge = (statusChar: string) => {
        switch(statusChar) {
            case 'P': return <span className="px-2 py-1 bg-green-100 text-green-700 border border-green-200 rounded text-xs font-bold">Đã ký (Posted)</span>;
            case 'O': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 border border-yellow-200 rounded text-xs font-bold">Mới (Open)</span>;
            case 'C': return <span className="px-2 py-1 bg-red-100 text-red-700 border border-red-200 rounded text-xs font-bold">Đã hủy</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded text-xs font-bold">{statusChar}</span>;
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <CloudUploadIcon className="w-6 h-6"/>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-800 dark:text-white">Quản lý Hóa đơn điện tử</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Quản lý phát hành, ký số và bảng kê tổng hợp.</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-full md:w-auto mt-3 md:mt-0">
                    <button 
                        onClick={() => setActiveTab('invoices')}
                        className={`flex-1 px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'invoices' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <DocumentTextIcon className="w-4 h-4"/> Danh sách Hóa đơn
                    </button>
                    <button 
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 px-6 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'summary' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <ClipboardListIcon className="w-4 h-4"/> Phiếu tổng hợp
                    </button>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col gap-4">
                <div className="flex flex-col lg:flex-row gap-3 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tìm kiếm</label>
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <input 
                                type="text" 
                                placeholder={activeTab === 'invoices' ? "Tìm tên khách, số hóa đơn, ký hiệu..." : "Tìm mã bảng kê..."} 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 outline-none ${fontSettings.controls}`}
                            />
                        </div>
                    </div>

                    <div className="w-full lg:w-auto">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Từ ngày</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <input 
                                type="date" 
                                value={fromDate}
                                onChange={e => setFromDate(e.target.value)}
                                className={`pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 ${fontSettings.controls}`}
                            />
                        </div>
                    </div>
                    <div className="w-full lg:w-auto">
                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Đến ngày</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                            <input 
                                type="date" 
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                                className={`pl-8 p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 ${fontSettings.controls}`}
                            />
                        </div>
                    </div>

                    {activeTab === 'invoices' && (
                        <div className="w-full lg:w-40">
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Trạng thái</label>
                            <select 
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className={`w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 ${fontSettings.controls}`}
                            >
                                <option value="All">Tất cả</option>
                                <option value="Draft">Mới tạo (Draft)</option>
                                <option value="Signed">Đã ký (Posted)</option>
                                <option value="Cancelled">Đã hủy</option>
                            </select>
                        </div>
                    )}
                </div>

                {/* Action Buttons Row */}
                <div className="flex justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                     <div className="flex items-center gap-2 text-sm text-slate-500">
                        {activeTab === 'invoices' && selectedInvoiceKeys.size > 0 && (
                            <span className="text-blue-600 font-bold">Đã chọn: {selectedInvoiceKeys.size} hóa đơn</span>
                        )}
                     </div>
                     <div className="flex gap-2">
                        <button
                            onClick={handleExportExcel}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-sm flex items-center gap-2 transition transform active:scale-95 disabled:opacity-70"
                        >
                            <DocumentArrowDownIcon className="w-4 h-4"/> Xuất Excel
                        </button>

                        {activeTab === 'invoices' ? (
                             <button
                                onClick={handleCreateSummary}
                                disabled={selectedInvoiceKeys.size === 0 || isProcessing}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PlusIcon className="w-4 h-4"/> Lập Bảng kê
                            </button>
                        ) : (
                            <button
                                onClick={() => alert("Chức năng tạo mới phiếu tổng hợp trực tiếp đang phát triển. Vui lòng chọn từ danh sách hóa đơn.")}
                                className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg font-bold flex items-center gap-2 cursor-not-allowed"
                            >
                                <PlusIcon className="w-4 h-4"/> Thêm mới (Từ DS HĐ)
                            </button>
                        )}
                     </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                             <RefreshIcon className="w-8 h-8 animate-spin mb-2"/>
                             Đang tải dữ liệu...
                        </div>
                    ) : (
                        <table className={`w-full text-left border-collapse ${fontSettings.listPrimary}`}>
                            <thead className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-bold uppercase text-xs sticky top-0 z-10 shadow-sm">
                                {activeTab === 'invoices' ? (
                                    <tr>
                                        <th className="p-3 w-10 text-center">
                                            <input type="checkbox" className="rounded text-blue-600" />
                                        </th>
                                        <th className="p-3 w-20">ID Dòng</th>
                                        <th className="p-3 w-32">Mẫu/Ký hiệu</th>
                                        <th className="p-3 w-32">Số HĐ</th>
                                        <th className="p-3 w-32">Ngày HĐ</th>
                                        <th className="p-3">Khách hàng</th>
                                        <th className="p-3 text-right w-36">Thành tiền</th>
                                        <th className="p-3 text-center w-32">Trạng thái</th>
                                        <th className="p-3 w-32 text-right">Tác vụ</th>
                                    </tr>
                                ) : (
                                    <tr>
                                        <th className="p-3 w-24">ID Phiếu</th>
                                        <th className="p-3">Diễn giải</th>
                                        <th className="p-3 w-40">Ngày lập</th>
                                        <th className="p-3 w-32 text-center">Số lượng HĐ</th>
                                        <th className="p-3 text-right w-40">Tổng tiền</th>
                                        <th className="p-3 text-center w-32">Trạng thái</th>
                                        <th className="p-3 w-40 text-center">Người tạo</th>
                                        <th className="p-3 w-32 text-right">Tác vụ</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {activeTab === 'invoices' ? (
                                    filteredInvoices.map(inv => (
                                        <tr key={inv.hfe_key} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="p-3 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedInvoiceKeys.has(inv.hfe_key)}
                                                    onChange={() => handleToggleSelect(inv.hfe_key)}
                                                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-3 font-mono text-xs text-slate-500">{inv.hfe_key}</td>
                                            <td className="p-3 text-xs">
                                                <div>{inv.hfe_patter}</div>
                                                <div className="text-slate-500">{inv.hfe_serial}</div>
                                            </td>
                                            <td className="p-3 font-bold text-blue-600 dark:text-blue-400">
                                                {inv.hfe_invoice_number || <span className="text-slate-400 italic">Chưa cấp</span>}
                                            </td>
                                            <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                                                {new Date(inv.hfe_invoice_date).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="p-3">
                                                <div className="font-bold text-slate-800 dark:text-white">{inv.hfe_cusname}</div>
                                                {inv.hfe_orderid > 0 && <div className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded w-fit">Ref Order: {inv.hfe_orderid}</div>}
                                            </td>
                                            <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-200">
                                                {inv.hfe_amount.toLocaleString()}
                                            </td>
                                            <td className="p-3 text-center">{getStatusBadge(inv.hfe_status)}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => handlePrint(inv.hfe_key)}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 bg-transparent hover:bg-blue-50 rounded transition" 
                                                        title="Xem/In"
                                                    >
                                                        <EyeIcon className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    filteredSheets.map(sheet => (
                                        <tr key={sheet.hfe_orderid} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                            <td className="p-3 font-mono font-bold text-purple-600 dark:text-purple-400">{sheet.hfe_orderid}</td>
                                            <td className="p-3 font-medium text-slate-800 dark:text-slate-200">{sheet.hfe_desc}</td>
                                            <td className="p-3 text-sm text-slate-600 dark:text-slate-300">
                                                {new Date(sheet.hfe_date).toLocaleString('vi-VN')}
                                            </td>
                                            <td className="p-3 text-center font-bold">{sheet.hfe_number}</td>
                                            <td className="p-3 text-right font-black text-slate-800 dark:text-white">{sheet.hfe_amount.toLocaleString()}</td>
                                            <td className="p-3 text-center">{getStatusBadge(sheet.hfe_status)}</td>
                                            <td className="p-3 text-center text-xs text-slate-500">{sheet.hfe_createdby}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                     <button className="p-1.5 text-slate-400 hover:text-blue-600 bg-transparent hover:bg-blue-50 rounded transition" title="Xem chi tiết">
                                                        <EyeIcon className="w-4 h-4"/>
                                                    </button>
                                                    <button className="p-1.5 text-slate-400 hover:text-green-600 bg-transparent hover:bg-green-50 rounded transition" title="In bảng kê">
                                                        <PrinterIcon className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                {/* Footer Summary */}
                <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 flex justify-between items-center">
                    <span>Hiển thị {activeTab === 'invoices' ? filteredInvoices.length : filteredSheets.length} bản ghi</span>
                </div>
            </div>
        </div>
    );
};

export default ElectronicInvoiceManagerView;
