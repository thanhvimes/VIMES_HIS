
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ReportDefinition, FilterValues } from '../../reports/types';
import { 
    PrinterIcon, 
    SearchIcon, 
    CogIcon, 
    ChevronUpIcon, 
    ChevronDownIcon, 
    CheckIcon,
    FilterIcon,
    DocumentArrowDownIcon,
    DocumentTextIcon
} from '../../../components/Icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- 1. PHẦN BỘ LỌC (Filter) ---
const Filter: React.FC<{ onRun: (v: FilterValues) => void }> = ({ onRun }) => {
    const [filters, setFilters] = useState({
        year: new Date().getFullYear(),
        period: 'Tháng 11',
        fromDate: new Date().toISOString().slice(0, 10),
        toDate: new Date().toISOString().slice(0, 10),
        doctor: '',
        patientType: 'all' // all, insurance, service
    });

    const handleChange = (key: string, value: any) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400 mb-3 uppercase border-b border-blue-100 pb-1">
                Điều kiện báo cáo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Năm</label>
                    <input 
                        type="number" 
                        value={filters.year}
                        onChange={e => handleChange('year', e.target.value)}
                        className="w-full p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Kỳ báo cáo</label>
                    <select 
                        className="w-full p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
                        value={filters.period}
                        onChange={e => handleChange('period', e.target.value)}
                    >
                        <option>Tháng 10</option>
                        <option>Tháng 11</option>
                        <option>Tháng 12</option>
                        <option>Quý IV</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Từ ngày</label>
                    <input 
                        type="date" 
                        value={filters.fromDate}
                        onChange={e => handleChange('fromDate', e.target.value)}
                        className="w-full p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Đến ngày</label>
                    <input 
                        type="date" 
                        value={filters.toDate}
                        onChange={e => handleChange('toDate', e.target.value)}
                        className="w-full p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
                    />
                </div>
                
                <div className="lg:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Bác sĩ chỉ định</label>
                    <select 
                        className="w-full p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
                        value={filters.doctor}
                        onChange={e => handleChange('doctor', e.target.value)}
                    >
                        <option value="">-- Tất cả bác sĩ --</option>
                        <option value="dr_a">BS. Nguyễn Văn A</option>
                        <option value="dr_b">BS. Trần Thị B</option>
                    </select>
                </div>

                <div className="lg:col-span-2 flex items-end gap-4">
                    <div className="flex gap-4">
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="type" checked={filters.patientType === 'insurance'} onChange={() => handleChange('patientType', 'insurance')} />
                            <span className="text-sm">Bảo hiểm</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="type" checked={filters.patientType === 'service'} onChange={() => handleChange('patientType', 'service')} />
                            <span className="text-sm">Dịch vụ</span>
                         </label>
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="type" checked={filters.patientType === 'all'} onChange={() => handleChange('patientType', 'all')} />
                            <span className="text-sm font-bold">Toàn viện</span>
                         </label>
                    </div>
                </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-3">
                <button 
                    onClick={() => onRun(filters)}
                    className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded shadow flex items-center gap-2 transition-transform active:scale-95"
                >
                    <SearchIcon className="w-4 h-4"/> Xem Báo cáo
                </button>
            </div>
        </div>
    );
};

// --- ĐỊNH NGHĨA CỘT ---
const AVAILABLE_COLUMNS = [
    { key: 'stt', label: 'STT', width: 'w-12', align: 'center' },
    { key: 'patientId', label: 'Mã BN', width: 'w-32', align: 'left' },
    { key: 'name', label: 'Tên Bệnh nhân', width: 'flex-1', align: 'left' },
    { key: 'dob', label: 'Năm sinh', width: 'w-24', align: 'center' },
    { key: 'drug', label: 'Thuốc sử dụng', width: 'w-64', align: 'left' },
    { key: 'qty', label: 'SL', width: 'w-16', align: 'center' },
    { key: 'unit', label: 'ĐVT', width: 'w-16', align: 'center' },
    { key: 'insurance', label: 'BHYT', width: 'w-20', align: 'center' },
    { key: 'date', label: 'Ngày kê', width: 'w-28', align: 'right' },
];

// --- 2. PHẦN HIỂN THỊ (View/Table/PDF) ---
const Content: React.FC<{ filters: FilterValues | null }> = ({ filters }) => {
    const [localSearch, setLocalSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(AVAILABLE_COLUMNS.map(c => c.key));
    const [isColMenuOpen, setIsColMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Click outside để đóng menu cột
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsColMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 1. Giả lập dữ liệu gốc (Data Fetching)
    const rawData = useMemo(() => {
        if (!filters) return [];
        return Array.from({ length: 25 }).map((_, i) => ({
            stt: i + 1,
            patientId: `BN23${1000+i}`,
            name: `Bệnh nhân Nguyễn Văn ${String.fromCharCode(65 + (i % 26))}`,
            dob: 1970 + Math.floor(Math.random() * 40),
            drug: i % 3 === 0 ? 'Paracetamol 500mg, Vitamin C' : (i % 3 === 1 ? 'Amoxicillin 500mg' : 'Ginkgo Biloba'),
            qty: Math.floor(Math.random() * 20) + 1,
            unit: 'Viên',
            insurance: filters.patientType === 'insurance' || (filters.patientType === 'all' && i % 2 === 0) ? 'Có' : 'Không',
            date: new Date(new Date().setDate(new Date().getDate() - i)).toLocaleDateString('vi-VN')
        }));
    }, [filters]);

    // 2. Xử lý Sắp xếp & Tìm kiếm (Client-side Processing)
    const processedData = useMemo(() => {
        let data = [...rawData];

        // Filter Local
        if (localSearch) {
            const lowerTerm = localSearch.toLowerCase();
            data = data.filter(item => 
                Object.values(item).some(val => 
                    String(val).toLowerCase().includes(lowerTerm)
                )
            );
        }

        // Sort
        if (sortConfig) {
            data.sort((a, b) => {
                // @ts-ignore
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                // @ts-ignore
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }, [rawData, localSearch, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const toggleColumn = (key: string) => {
        setVisibleColumns(prev => 
            prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
        );
    };

    // --- EXPORT FUNCTIONS ---

    const handleExportExcel = () => {
        if (processedData.length === 0) {
            alert('Không có dữ liệu để xuất.');
            return;
        }

        // 1. Prepare Header Row
        const headers = AVAILABLE_COLUMNS
            .filter(col => visibleColumns.includes(col.key))
            .map(col => col.label);

        // 2. Prepare Data Rows
        const rows = processedData.map(row => 
            AVAILABLE_COLUMNS
                .filter(col => visibleColumns.includes(col.key))
                // @ts-ignore
                .map(col => `"${String(row[col.key] || '').replace(/"/g, '""')}"`) // Escape quotes for CSV
                .join(',')
        );

        // 3. Combine with BOM for UTF-8 support in Excel
        const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
        
        // 4. Create Blob and Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `BaoCao_SuDungThuoc_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPdf = () => {
        if (processedData.length === 0) {
            alert('Không có dữ liệu để xuất.');
            return;
        }

        const doc = new jsPDF();

        // Header
        doc.setFontSize(16);
        doc.setTextColor(40);
        doc.text("DANH SÁCH BỆNH NHÂN SỬ DỤNG THUỐC", 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Kỳ báo cáo: ${filters?.period}/${filters?.year}`, 105, 28, { align: 'center' });
        doc.text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, 105, 34, { align: 'center' });

        // Table Data
        const tableHeaders = AVAILABLE_COLUMNS
            .filter(col => visibleColumns.includes(col.key))
            .map(col => col.label);

        const tableBody = processedData.map(row => 
            AVAILABLE_COLUMNS
                .filter(col => visibleColumns.includes(col.key))
                // @ts-ignore
                .map(col => String(row[col.key]))
        );

        autoTable(doc, {
            head: [tableHeaders],
            body: tableBody,
            startY: 45,
            theme: 'grid',
            styles: { font: "helvetica", fontSize: 9 }, // Note: Standard Helvetica doesn't support Vietnamese well. In real app, load custom font.
            headStyles: { fillColor: [13, 148, 136] }, // Teal-600
            didDrawPage: (data) => {
                // Footer
                doc.setFontSize(8);
                doc.text(`Trang ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        doc.save(`BaoCao_PDF_${new Date().getTime()}.pdf`);
    };

    if (!filters) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <SearchIcon className="w-16 h-16 mb-4 opacity-20"/>
                <p>Vui lòng chọn điều kiện lọc và bấm "Xem Báo cáo"</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full overflow-hidden">
            
            {/* Toolbar Báo cáo */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-900">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white uppercase text-sm md:text-base">
                        Danh sách bệnh nhân sử dụng thuốc
                    </h3>
                    <p className="text-xs text-slate-500">Kỳ: {filters.period}/{filters.year} - Tổng số: {processedData.length} bản ghi</p>
                </div>
                
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {/* Local Search */}
                    <div className="relative flex-1 sm:w-56">
                        <FilterIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"/>
                        <input 
                            type="text" 
                            placeholder="Lọc nhanh..." 
                            value={localSearch}
                            onChange={e => setLocalSearch(e.target.value)}
                            className="w-full pl-9 p-2 border border-slate-300 dark:border-slate-600 rounded text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Column Settings */}
                    <div className="relative" ref={menuRef}>
                        <button 
                            onClick={() => setIsColMenuOpen(!isColMenuOpen)}
                            className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm"
                            title="Tùy chọn cột"
                        >
                            <CogIcon className="w-5 h-5"/>
                        </button>
                        {isColMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-20 p-2 animate-fade-in-up">
                                <div className="text-xs font-bold text-slate-500 uppercase mb-2 px-2">Hiển thị cột</div>
                                <div className="space-y-1 max-h-60 overflow-y-auto">
                                    {AVAILABLE_COLUMNS.map(col => (
                                        <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={visibleColumns.includes(col.key)}
                                                onChange={() => toggleColumn(col.key)}
                                                className="rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-200">{col.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Export Actions */}
                    <button 
                        onClick={handleExportExcel}
                        className="px-3 py-2 bg-green-600 text-white rounded text-xs font-bold flex items-center gap-2 hover:bg-green-700 shadow active:scale-95 transition-transform"
                    >
                        <DocumentArrowDownIcon className="w-4 h-4"/> Excel
                    </button>
                    <button 
                        onClick={handleExportPdf}
                        className="px-3 py-2 bg-red-600 text-white rounded text-xs font-bold flex items-center gap-2 hover:bg-red-700 shadow active:scale-95 transition-transform"
                    >
                        <DocumentTextIcon className="w-4 h-4"/> PDF
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-auto p-0 relative">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-700 font-bold text-slate-600 dark:text-slate-300 sticky top-0 z-10 shadow-sm">
                        <tr>
                            {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                                <th 
                                    key={col.key} 
                                    className={`p-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors select-none text-${col.align || 'left'} whitespace-nowrap`}
                                    onClick={() => handleSort(col.key)}
                                >
                                    <div className={`flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                        {col.label}
                                        <div className="flex flex-col w-3">
                                            <ChevronUpIcon className={`w-2 h-2 ${sortConfig?.key === col.key && sortConfig.direction === 'asc' ? 'text-blue-600' : 'text-slate-400'}`}/>
                                            <ChevronDownIcon className={`w-2 h-2 ${sortConfig?.key === col.key && sortConfig.direction === 'desc' ? 'text-blue-600' : 'text-slate-400'}`}/>
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {processedData.length > 0 ? (
                            processedData.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                    {AVAILABLE_COLUMNS.filter(c => visibleColumns.includes(c.key)).map(col => (
                                        <td 
                                            key={col.key} 
                                            className={`p-3 text-${col.align || 'left'} ${col.key === 'patientId' ? 'font-mono text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'} whitespace-nowrap`}
                                        >
                                            {col.key === 'insurance' ? (
                                                // @ts-ignore
                                                row[col.key] === 'Có' ? (
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold border border-green-200">BHYT</span>
                                                ) : (
                                                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded border border-slate-200">DV</span>
                                                )
                                            ) : (
                                                // @ts-ignore
                                                row[col.key]
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={visibleColumns.length} className="p-10 text-center text-slate-500 italic">
                                    Không tìm thấy dữ liệu phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination (Simple Mock) */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center text-xs text-slate-500">
                <span>Hiển thị 1 - {processedData.length} của {processedData.length} bản ghi</span>
                <div className="flex gap-1">
                    <button disabled className="px-2 py-1 border rounded bg-slate-100 text-slate-400 cursor-not-allowed">Trước</button>
                    <button className="px-2 py-1 border rounded bg-blue-50 text-blue-600 border-blue-200 font-bold">1</button>
                    <button disabled className="px-2 py-1 border rounded bg-slate-100 text-slate-400 cursor-not-allowed">Sau</button>
                </div>
            </div>
        </div>
    );
};

// --- 3. EXPORT (Đăng ký báo cáo) ---
export const PatientDrugReport: ReportDefinition = {
    id: 'rep_recep_04',
    title: '4. Danh sách bệnh nhân sử dụng thuốc',
    module: 'reception',
    description: 'Báo cáo danh sách BN dùng thuốc, lọc theo đối tượng BHYT/Dịch vụ',
    FilterComponent: Filter,
    ContentComponent: Content
};
