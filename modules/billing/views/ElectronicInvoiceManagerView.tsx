
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
    RefreshIcon,
    XIcon,
    CheckIcon,
    BanIcon,
    ChartBarIcon
} from '../../../components/Icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { usePdfPreview } from '../../../contexts/PdfPreviewContext';
import { useSession } from '../../../contexts/SessionContext';
import { invoiceService, InvoiceDetailDB, SummarySheetDB } from '../../../services/invoiceService';
import ElectronicInvoiceSummaryDetail from './components/ElectronicInvoiceSummaryDetail';
import ElectronicInvoiceReport from './components/ElectronicInvoiceReport';

const ElectronicInvoiceManagerView: React.FC = () => {
    const { fontSettings } = useTheme();
    const { openPdf } = usePdfPreview();
    const { user } = useSession();
    const [activeTab, setActiveTab] = useState<'invoices' | 'summary' | 'report'>('invoices');
    
    // Data State
    const [invoices, setInvoices] = useState<InvoiceDetailDB[]>([]);
    const [sheets, setSheets] = useState<SummarySheetDB[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Detail Modal State
    const [selectedSheet, setSelectedSheet] = useState<SummarySheetDB | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // Create Summary Modal State
    const [isCreateSummaryModalOpen, setIsCreateSummaryModalOpen] = useState(false);
    const [createSummaryParams, setCreateSummaryParams] = useState({
        fromDate: '',
        toDate: '',
        createdBy: ''
    });

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    
    // Invoice Selection (Optional)
    const [selectedInvoiceKeys, setSelectedInvoiceKeys] = useState<Set<number>>(new Set());

    // --- LOAD DATA ---
    useEffect(() => {
        if (activeTab === 'report') return; // Report tab handles its own data fetching
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'invoices') {
                const data = await invoiceService.getInvoiceLines();
                setInvoices(data);
            } else if (activeTab === 'summary') {
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

    const handleOpenCreateSummary = () => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
        const toLocalISO = (date: Date) => {
            const offset = date.getTimezoneOffset() * 60000;
            return new Date(date.getTime() - offset).toISOString().slice(0, 16);
        };

        setCreateSummaryParams({
            fromDate: toLocalISO(startOfDay),
            toDate: toLocalISO(endOfDay),
            createdBy: user?.username || 'admin'
        });
        setIsCreateSummaryModalOpen(true);
    };

    const handleSubmitCreateSummary = async () => {
        if (!createSummaryParams.fromDate || !createSummaryParams.toDate || !createSummaryParams.createdBy) {
            alert("Vui lòng điền đầy đủ thông tin.");
            return;
        }

        setIsProcessing(true);
        try {
            const newSheet = await invoiceService.createElectronicSummary(
                createSummaryParams.createdBy,
                createSummaryParams.fromDate,
                createSummaryParams.toDate
            );
            alert(`Lập bảng kê thành công! Mã: ${newSheet.hfe_orderid}. Số lượng HĐ: ${newSheet.hfe_number}`);
            setIsCreateSummaryModalOpen(false);
            if (activeTab !== 'summary') setActiveTab('summary'); 
            else setSheets(prev => [newSheet, ...prev]);
        } catch (error) {
            console.error(error);
            alert("Lỗi khi tạo bảng kê. Vui lòng thử lại.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleViewSheet = (sheet: SummarySheetDB) => {
        setSelectedSheet(sheet);
        setIsDetailModalOpen(true);
    };

    const handleCancelSheet = async (sheet: SummarySheetDB) => {
        if (!window.confirm(`Bạn có chắc chắn muốn hủy bảng kê #${sheet.hfe_orderid}? Các hóa đơn con sẽ được giải phóng để lập lại bảng kê khác.`)) {
            return;
        }
        setIsProcessing(true);
        try {
            await invoiceService.cancelSummarySheet(sheet.hfe_orderid);
            // Refresh local list
            setSheets(prev => prev.map(s => s.hfe_orderid === sheet.hfe_orderid ? { ...s, hfe_status: 'C' } : s));
            // Close detail modal if open
            setIsDetailModalOpen(false);
            alert(`Đã hủy bảng kê #${sheet.hfe_orderid}`);
        } catch (error) {
            alert("Lỗi khi hủy bảng kê.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleExportExcel = async () => {
        setIsProcessing(true);
        try {
            let exportData = [];
            
            if (activeTab === 'invoices') {
                // Map Invoice List to User Friendly Format
                exportData = filteredInvoices.map((inv, idx) => ({
                    STT: idx + 1,
                    'Mã nội bộ': inv.hfe_key,
                    'Mẫu số': inv.hfe_patter,
                    'Ký hiệu': inv.hfe_serial,
                    'Số hóa đơn': inv.hfe_invoice_number,
                    'Ngày hóa đơn': new Date(inv.hfe_invoice_date).toLocaleDateString('vi-VN'),
                    'Tên khách hàng': inv.hfe_cusname,
                    'Mã số thuế': inv.hfe_custaxcode || '',
                    'Thành tiền': inv.hfe_amount,
                    'Tiền thuế': inv.hfe_vatamount,
                    'Tổng thanh toán': inv.hfe_patpaid,
                    'Trạng thái': inv.hfe_status === 'P' ? 'Đã ký' : inv.hfe_status === 'C' ? 'Đã hủy' : 'Nháp',
                    'Người tạo': inv.hfe_createdby
                }));
            } else {
                // Map Summary List
                exportData = filteredSheets.map((sheet, idx) => ({
                    STT: idx + 1,
                    'Mã bảng kê': sheet.hfe_orderid,
                    'Diễn giải': sheet.hfe_desc,
                    'Ngày lập': new Date(sheet.hfe_date).toLocaleDateString('vi-VN'),
                    'Số lượng HĐ': sheet.hfe_number,
                    'Tổng tiền': sheet.hfe_amount,
                    'Trạng thái': sheet.hfe_status === 'P' ? 'Đã duyệt' : sheet.hfe_status === 'C' ? 'Đã hủy' : 'Mới',
                    'Người lập': sheet.hfe_createdby
                }));
            }
            
            await invoiceService.exportToExcel(exportData, `${activeTab}_export.csv`);
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
        <div className="h-full flex flex-col space-y-4 relative">
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
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'invoices' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <DocumentTextIcon className="w-4 h-4"/> Hóa đơn
                    </button>
                    <button 
                        onClick={() => setActiveTab('summary')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'summary' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <ClipboardListIcon className="w-4 h-4"/> Bảng kê
                    </button>
                    <button 
                        onClick={() => setActiveTab('report')}
                        className={`flex-1 px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'report' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <ChartBarIcon className="w-4 h-4"/> Báo cáo
                    </button>
                </div>
            </div>

            {activeTab === 'report' ? (
                <ElectronicInvoiceReport />
            ) : (
                <>
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
                                        onClick={() => {
                                            if(selectedInvoiceKeys.size === 0) {
                                                alert("Vui lòng chọn hóa đơn trước khi lập bảng kê thủ công (Nếu muốn).");
                                            } else {
                                                alert("Chức năng lập bảng kê thủ công từ danh sách chọn.");
                                            }
                                        }}
                                        disabled={selectedInvoiceKeys.size === 0 || isProcessing}
                                        className="px-4 py-2 bg-slate-200 text-slate-600 rounded-lg font-bold shadow-sm flex items-center gap-2 disabled:opacity-50"
                                    >
                                        <PlusIcon className="w-4 h-4"/> Lập BK (Chọn)
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleOpenCreateSummary}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition transform active:scale-95"
                                    >
                                        <PlusIcon className="w-4 h-4"/> Lập Bảng kê mới
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
                                                <th className="p-3 w-40 text-right">Tác vụ</th>
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
                                                             <button 
                                                                onClick={() => handleViewSheet(sheet)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition" 
                                                                title="Xem chi tiết"
                                                            >
                                                                <EyeIcon className="w-4 h-4"/>
                                                            </button>
                                                            <button 
                                                                onClick={() => handlePrint(sheet.hfe_orderid)}
                                                                className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition" 
                                                                title="In bảng kê"
                                                            >
                                                                <PrinterIcon className="w-4 h-4"/>
                                                            </button>
                                                            {sheet.hfe_status !== 'C' && (
                                                                <button 
                                                                    onClick={() => handleCancelSheet(sheet)}
                                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition" 
                                                                    title="Hủy bảng kê"
                                                                >
                                                                    <BanIcon className="w-4 h-4"/>
                                                                </button>
                                                            )}
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
                </>
            )}

            {/* CREATE SUMMARY MODAL */}
            {isCreateSummaryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up transform transition-all">
                        
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <ClipboardListIcon className="w-5 h-5 text-blue-600"/> Lập bảng kê tổng hợp
                            </h3>
                            <button onClick={() => setIsCreateSummaryModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500"><XIcon className="w-5 h-5"/></button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Từ ngày (Bắt đầu)</label>
                                <input 
                                    type="datetime-local" 
                                    value={createSummaryParams.fromDate}
                                    onChange={e => setCreateSummaryParams({...createSummaryParams, fromDate: e.target.value})}
                                    className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 text-sm ${fontSettings.controls}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Đến ngày (Kết thúc)</label>
                                <input 
                                    type="datetime-local" 
                                    value={createSummaryParams.toDate}
                                    onChange={e => setCreateSummaryParams({...createSummaryParams, toDate: e.target.value})}
                                    className={`w-full p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 text-sm ${fontSettings.controls}`}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Người tạo (Created By)</label>
                                <div className="relative">
                                    <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                                    <input 
                                        type="text" 
                                        value={createSummaryParams.createdBy}
                                        onChange={e => setCreateSummaryParams({...createSummaryParams, createdBy: e.target.value})}
                                        className={`w-full pl-9 p-2 border rounded-lg bg-white dark:bg-slate-700 dark:border-slate-600 text-sm font-medium ${fontSettings.controls}`}
                                    />
                                </div>
                            </div>
                            
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-xs text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                Hệ thống sẽ tự động tìm kiếm tất cả các hóa đơn hợp lệ (chưa thuộc bảng kê nào) trong khoảng thời gian này để gom nhóm.
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
                            <button 
                                onClick={() => setIsCreateSummaryModalOpen(false)} 
                                className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleSubmitCreateSummary} 
                                disabled={isProcessing}
                                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2 transition disabled:opacity-70"
                            >
                                {isProcessing ? <RefreshIcon className="w-4 h-4 animate-spin"/> : <CheckIcon className="w-4 h-4"/>}
                                Duyệt & Tạo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL MODAL */}
            <ElectronicInvoiceSummaryDetail 
                isOpen={isDetailModalOpen} 
                onClose={() => setIsDetailModalOpen(false)} 
                sheet={selectedSheet}
                onCancelSheet={handleCancelSheet}
            />
        </div>
    );
};

export default ElectronicInvoiceManagerView;
